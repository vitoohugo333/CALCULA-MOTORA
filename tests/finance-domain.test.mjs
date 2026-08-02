import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCostContext,
  calculateFinancialPlan,
  calculateRecord,
  compareFinancialResults,
  fuelCostPerKm,
  monthlyEquivalent,
} from '../src/domain/finance/calculations.js';

const closeTo = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} deveria ser próximo de ${expected}`);
};

test('calcula combustível, equivalência mensal e limites percentuais', () => {
  closeTo(fuelCostPerKm({ price: 6, efficiency: 12 }), 0.5);
  assert.equal(fuelCostPerKm({ price: 6, efficiency: 0 }), 0);
  closeTo(monthlyEquivalent({ active: true, kind: 'weekly', value: 120 }), 520);
  assert.equal(monthlyEquivalent({ active: true, kind: 'one_time', value: 300, month: '2026-08' }, '2026-07'), 0);

  const context = buildCostContext([
    { active: true, kind: 'monthly', category: 'obligation', value: 600 },
    { active: true, kind: 'weekly', category: 'reserve', value: 120 },
    { active: true, kind: 'per_km', category: 'reserve', value: 0.2 },
    { active: true, kind: 'percent', category: 'obligation', value: 120 },
  ], '2026-08');
  closeTo(context.monthlyFixed, 1120);
  closeTo(context.perKm, 0.2);
  closeTo(context.percent, 0.95);
});

test('calcula o resultado diário usando snapshots quando disponíveis', () => {
  const result = calculateRecord({
    gross: 300,
    km: 100,
    fuelSpend: 0,
    fuelCostKmSnapshot: 0.45,
    perKmCostSnapshot: 0.15,
    percentCostSnapshot: 0.1,
    fixedShareSnapshot: 20,
  }, {
    fuelKm: 0.5,
    costContext: { perKm: 0.3, monthlyFixed: 900 },
    plannedDays: 20,
  });

  closeTo(result.fuel, 45);
  closeTo(result.variable, 15);
  closeTo(result.percentCost, 30);
  closeTo(result.contribution, 210);
  closeTo(result.net, 190);
  closeTo(result.revenuePerKm, 3);
  closeTo(result.costPerKm, 0.9);
});

test('gera plano financeiro com resultados conhecidos', () => {
  const state = {
    targetProfit: 4000,
    revenueKm: 2.5,
    fuel: { price: 6, efficiency: 12 },
    costs: [
      { active: true, kind: 'monthly', category: 'obligation', value: 600 },
      { active: true, kind: 'per_km', category: 'reserve', value: 0.2 },
      { active: true, kind: 'percent', category: 'obligation', value: 10 },
    ],
  };
  const result = calculateFinancialPlan({
    state,
    context: {
      monthKey: '2026-08',
      plannedDays: 20,
      remainingDays: 18,
      monthRecords: [
        { date: '2026-08-01', gross: 250, km: 100, fixedShareSnapshot: 30, fuelCostKmSnapshot: 0.5, perKmCostSnapshot: 0.2, percentCostSnapshot: 0.1 },
        { date: '2026-08-02', gross: 300, km: 120, fixedShareSnapshot: 30, fuelCostKmSnapshot: 0.5, perKmCostSnapshot: 0.2, percentCostSnapshot: 0.1 },
      ],
    },
  });

  closeTo(result.fuelKm, 0.5);
  closeTo(result.contributionKm, 1.55);
  closeTo(result.actualGross, 550);
  closeTo(result.actualKm, 220);
  closeTo(result.actualFuel, 110);
  closeTo(result.actualVariable, 44);
  closeTo(result.actualPercent, 55);
  closeTo(result.actualContribution, 341);
  closeTo(result.fixedAllocated, 60);
  closeTo(result.actualNet, 281);
  closeTo(result.remainingContribution, 4259);
  closeTo(result.dailyContribution, 4259 / 18);
  closeTo(result.totalRequiredKm, 4600 / 1.55);
  closeTo(result.totalGross, (4600 / 1.55) * 2.5);
  closeTo(result.projectedNet, (341 / 2) * 20 - 600);
  assert.equal(result.records.length, 2);
});

test('comparador detecta igualdade e divergência material', () => {
  const base = calculateFinancialPlan({
    state: { targetProfit: 1000, revenueKm: 2, fuel: { price: 5, efficiency: 10 }, costs: [] },
    context: { plannedDays: 10, remainingDays: 10, monthRecords: [] },
  });
  assert.equal(compareFinancialResults(base, base).equal, true);
  const changed = { ...base, dailyGross: base.dailyGross + 1 };
  const comparison = compareFinancialResults(base, changed);
  assert.equal(comparison.equal, false);
  assert.equal(comparison.differences[0].key, 'dailyGross');
});
