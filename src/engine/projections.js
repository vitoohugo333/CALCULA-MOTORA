import { calculatePlan, recordsForMonth, summarizeRecords } from './finance.js';
import { weekRange } from './calendar.js';

export function monthProjection(state, reference = new Date()) {
  const plan = calculatePlan(state, reference);
  const records = recordsForMonth(state.records, reference);
  const actual = summarizeRecords(records, state, reference);
  const elapsed = Math.max(1, plan.calendar.elapsedWorkdays);
  const projectedNet = actual.days ? (actual.net / elapsed) * plan.calendar.workdays : 0;
  const remaining = Math.max(0, plan.targetNet - actual.net);
  return { plan, actual, projectedNet, remaining, progress: plan.targetNet > 0 ? Math.min(100, Math.max(0, actual.net / plan.targetNet * 100)) : 0, completed: actual.net >= plan.targetNet };
}

export function weekProjection(state, reference = new Date()) {
  const plan = calculatePlan(state, reference);
  const { start, end } = weekRange(reference);
  const records = state.records.filter(record => record.date >= start && record.date <= end);
  const actual = summarizeRecords(records, state, reference);
  const plannedDays = plan.calendar.plannedDates.filter(date => date >= start && date <= end).length;
  return { target: plan.netDaily * plannedDays, actual, plannedDays, completed: actual.net >= plan.netDaily * plannedDays };
}

export function personalRanking(records, state) {
  const summary = summarizeRecords(records, state);
  if (!summary.items.length) return [];
  return [...summary.items].sort((a, b) => b.result.net - a.result.net).map((item, index) => ({ ...item, rank: index + 1 }));
}
