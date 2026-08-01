import { monthKey } from './calendar.js';

export const COST_KINDS = { monthly: 'Mensal', weekly: 'Semanal', per_km: 'Por quilômetro', one_time: 'Pontual' };

export function activeCosts(costs = []) {
  return costs.filter(cost => cost && cost.active !== false && Number(cost.value) > 0);
}

export function monthlyFixedCosts(costs = [], reference = new Date()) {
  const currentMonth = monthKey(reference);
  return activeCosts(costs).reduce((total, cost) => {
    const value = Number(cost.value) || 0;
    if (cost.kind === 'monthly') return total + value;
    if (cost.kind === 'weekly') return total + value * 52 / 12;
    if (cost.kind === 'one_time' && (!cost.month || cost.month === currentMonth)) return total + value;
    return total;
  }, 0);
}

export function variableCostPerKm(costs = []) {
  return activeCosts(costs).filter(cost => cost.kind === 'per_km').reduce((total, cost) => total + (Number(cost.value) || 0), 0);
}

export function normalizeCost(cost) {
  const name = /custos?\s+fixos?\s+(migrados?|iniciais?)/i.test(cost?.name || '') ? 'Outros custos mensais' : String(cost?.name || 'Custo').trim();
  return {
    id: cost?.id || `cost-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    kind: COST_KINDS[cost?.kind] ? cost.kind : 'monthly',
    category: cost?.category === 'reserve' ? 'reserve' : 'obligation',
    value: Math.max(0, Number(cost?.value) || 0),
    active: cost?.active !== false,
    dueDay: cost?.dueDay ? Math.min(31, Math.max(1, Number(cost.dueDay))) : null,
    month: cost?.month || null
  };
}
