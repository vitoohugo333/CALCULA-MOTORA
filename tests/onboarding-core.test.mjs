import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeOnboardingResult,
  normalizeOnboardingProgress,
  onboardingCompletionSummary,
  progressFromState,
  shouldOpenOnboarding,
  validateOnboardingStep,
  weekdaysForCount,
} from '../src/onboarding/onboarding-core.js';

const existingState = {
  onboardingComplete: true,
  targetProfit: 3500,
  workWeekdays: [1, 2, 3, 4, 5, 6],
  revenueKm: 2.15,
  fuel: { type: 'gasoline', label: 'Gasolina', unit: 'L', price: 6.1, efficiency: 10 },
  costs: [
    { id: 'user-insurance', name: 'Seguro', kind: 'monthly', category: 'obligation', value: 220, active: true },
    { id: 'maintenance-onboarding', name: 'Reserva antiga', kind: 'per_km', category: 'reserve', value: 0.1, active: true },
    { id: 'fixed-onboarding', name: 'Conta antiga', kind: 'monthly', category: 'obligation', value: 500, active: true },
  ],
  records: [{ date: '2026-08-01', gross: 180, km: 90 }],
  events: [{ id: 'event-1', title: 'Show' }],
  closings: [{ month: '2026-07' }],
};

test('normaliza e limita o rascunho do onboarding', () => {
  const progress = normalizeOnboardingProgress({
    mode: 'redo',
    step: 9,
    days: 4,
    fuelType: 'invalid',
    target: -10,
    dismissed: true,
  });
  assert.equal(progress.mode, 'redo');
  assert.equal(progress.step, 3);
  assert.equal(progress.days, 6);
  assert.equal(progress.fuelType, 'gnv');
  assert.equal(progress.target, 0);
  assert.equal(progress.dismissed, true);
});

test('decide quando o onboarding inicial deve abrir', () => {
  assert.equal(shouldOpenOnboarding({ onboardingComplete: false, progress: null }), true);
  assert.equal(shouldOpenOnboarding({ onboardingComplete: false, progress: { dismissed: true } }), false);
  assert.equal(shouldOpenOnboarding({ onboardingComplete: true, progress: null }), false);
});

test('validação identifica o campo obrigatório da etapa', () => {
  const step1 = validateOnboardingStep({ target: 0 }, 1);
  assert.equal(step1.valid, false);
  assert.equal(step1.code, 'target');

  const step2 = validateOnboardingStep({ target: 4000, fuelType: 'gnv', fuelPrice: 0, fuelEfficiency: 12 }, 2);
  assert.equal(step2.code, 'fuelPrice');
  assert.match(step2.message, /m³ de GNV/);
});

test('refazer atualiza a configuração sem apagar dados ou custos do usuário', () => {
  const result = mergeOnboardingResult(existingState, {
    mode: 'redo',
    target: 5000,
    days: 5,
    fuelType: 'gnv',
    fuelPrice: 4.9,
    fuelEfficiency: 13,
    revenueKm: 2.4,
    fixedMonthly: 700,
  });

  assert.equal(result.targetProfit, 5000);
  assert.deepEqual(result.workWeekdays, weekdaysForCount(5));
  assert.equal(result.fuel.type, 'gnv');
  assert.equal(result.revenueKm, 2.4);
  assert.deepEqual(result.records, existingState.records);
  assert.deepEqual(result.events, existingState.events);
  assert.deepEqual(result.closings, existingState.closings);
  assert.ok(result.costs.some(cost => cost.id === 'user-insurance' && cost.value === 220));
  assert.equal(result.costs.filter(cost => cost.id === 'maintenance-onboarding').length, 1);
  assert.ok(result.costs.some(cost => cost.id === 'fixed-onboarding' && cost.value === 700));
});

test('pular opcionais mantém a média existente e remove apenas a conta gerada pelo onboarding', () => {
  const result = mergeOnboardingResult(existingState, {
    target: 4000,
    days: 6,
    fuelType: 'gasoline',
    fuelPrice: 6.2,
    fuelEfficiency: 10.5,
    revenueKm: 0,
    fixedMonthly: 0,
  });
  assert.equal(result.revenueKm, existingState.revenueKm);
  assert.ok(result.costs.some(cost => cost.id === 'user-insurance'));
  assert.equal(result.costs.some(cost => cost.id === 'fixed-onboarding'), false);
});

test('cria rascunho e primeira ação a partir do estado atual', () => {
  const progress = progressFromState(existingState, { mode: 'redo' });
  assert.equal(progress.target, 3500);
  assert.equal(progress.days, 6);
  assert.equal(progress.fixedMonthly, 500);

  const summary = onboardingCompletionSummary(progress);
  assert.equal(summary.target, 3500);
  assert.equal(summary.primaryAction, 'Registrar meu primeiro dia');
});
