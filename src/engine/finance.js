import { monthContext, monthKey } from './calendar.js';
import { monthlyFixedCosts, variableCostPerKm } from './costs.js';

export function fuelCostPerKm(fuel) {
  const price = Number(fuel?.price) || 0;
  const efficiency = Number(fuel?.efficiency) || 0;
  return efficiency > 0 ? price / efficiency : 0;
}

export function calculatePlan(state, reference = new Date()) {
  const calendar = monthContext(state.workWeekdays, state.extraDaysOff, reference);
  const targetNet = Math.max(0, Number(state.targetProfit) || 0);
  const revenueKm = Math.max(0.01, Number(state.revenueKm) || 0.01);
  const fixed = monthlyFixedCosts(state.costs, reference);
  const variableKm = variableCostPerKm(state.costs);
  const fuelKm = fuelCostPerKm(state.fuel);
  const operatingKm = variableKm + fuelKm;
  const marginPerReal = 1 - operatingKm / revenueKm;
  const gross = marginPerReal > 0.05 ? (targetNet + fixed) / marginPerReal : 0;
  const km = gross / revenueKm;
  const workdays = Math.max(1, calendar.workdays);
  return { calendar, targetNet, revenueKm, fixed, variableKm, fuelKm, operatingKm, gross, km, grossDaily: gross / workdays, netDaily: targetNet / workdays, kmDaily: km / workdays, fixedDaily: fixed / workdays, safe: marginPerReal > 0.05 };
}

export function calculateRecord(record, state, reference = new Date()) {
  const plan = calculatePlan(state, reference);
  const gross = Math.max(0, Number(record.gross) || 0);
  const km = Math.max(0, Number(record.km) || 0);
  const estimatedFuel = km * plan.fuelKm;
  const fuel = Number(record.fuel) > 0 ? Number(record.fuel) : estimatedFuel;
  const variable = km * plan.variableKm;
  const fixed = plan.fixedDaily;
  const cost = fuel + variable + fixed;
  return { gross, km, hours: Math.max(0, Number(record.hours) || 0), fuel, variable, fixed, cost, net: gross - cost, revenueKm: km > 0 ? gross / km : 0 };
}

export function recordsForMonth(records = [], reference = new Date()) {
  const key = monthKey(reference);
  return records.filter(record => String(record.date || '').startsWith(key));
}

export function summarizeRecords(records, state, reference = new Date()) {
  const calculated = records.map(record => ({ ...record, result: calculateRecord(record, state, new Date(`${record.date}T12:00:00`)) }));
  const totals = calculated.reduce((acc, item) => {
    acc.gross += item.result.gross; acc.km += item.result.km; acc.cost += item.result.cost; acc.net += item.result.net; acc.hours += item.result.hours; return acc;
  }, { gross: 0, km: 0, cost: 0, net: 0, hours: 0 });
  return { items: calculated, ...totals, days: calculated.length, revenueKm: totals.km > 0 ? totals.gross / totals.km : 0, netPerDay: calculated.length ? totals.net / calculated.length : 0 };
}
