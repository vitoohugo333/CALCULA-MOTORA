import { normalizeCost } from '../engine/costs.js';
import { weekdaysForCount } from '../engine/calendar.js';

export const RELEASE = '4.0.0';
export const SCHEMA_VERSION = 4;

export const fuelPresets = {
  gnv: { label: 'GNV', unit: 'm³', price: 4.79, efficiency: 13.2 },
  gasoline: { label: 'Gasolina', unit: 'L', price: 6.19, efficiency: 10.5 },
  ethanol: { label: 'Etanol', unit: 'L', price: 4.29, efficiency: 7.4 },
  diesel: { label: 'Diesel', unit: 'L', price: 6.09, efficiency: 11.5 },
  custom: { label: 'Personalizado', unit: 'un.', price: 5, efficiency: 10 }
};

export function createDefaultState() {
  return {
    version: SCHEMA_VERSION,
    release: RELEASE,
    onboardingComplete: false,
    targetProfit: 4000,
    workWeekdays: [1, 2, 3, 4, 5, 6],
    extraDaysOff: 0,
    revenueKm: 2.25,
    fuel: { type: 'gnv', ...fuelPresets.gnv },
    compare: { gasPrice: 6.19, gasEff: 10.5, gnvPrice: 4.79, gnvEff: 13.2 },
    costs: [
      { id: 'maintenance-default', name: 'Reserva de manutenção', kind: 'per_km', category: 'reserve', value: 0.18, active: true },
      { id: 'fixed-default', name: 'Outros custos mensais', kind: 'monthly', category: 'obligation', value: 650, active: true }
    ],
    records: [],
    events: []
  };
}

export function normalizeState(value = {}) {
  const base = createDefaultState();
  const state = { ...base, ...value };
  state.version = SCHEMA_VERSION;
  state.release = RELEASE;
  state.targetProfit = Math.max(500, Number(state.targetProfit) || base.targetProfit);
  state.extraDaysOff = Math.max(0, Number(state.extraDaysOff) || 0);
  state.revenueKm = Math.max(0.01, Number(state.revenueKm) || base.revenueKm);
  state.workWeekdays = Array.isArray(state.workWeekdays) && state.workWeekdays.length ? [...new Set(state.workWeekdays.map(Number).filter(day => day >= 0 && day <= 6))] : base.workWeekdays;
  state.fuel = { ...base.fuel, ...(state.fuel || {}) };
  state.compare = { ...base.compare, ...(state.compare || {}) };
  state.costs = Array.isArray(state.costs) ? state.costs.map(normalizeCost) : base.costs.map(normalizeCost);
  state.records = Array.isArray(state.records) ? state.records.filter(Boolean) : [];
  state.events = Array.isArray(state.events) ? state.events.filter(Boolean) : [];
  delete state.migrationNotice;
  return state;
}

export function importLegacyState(legacy = {}) {
  const activeFuel = legacy.activeFuel === 'gas' ? 'gasoline' : 'gnv';
  const preset = fuelPresets[activeFuel];
  const days = Number(legacy.daysPerWeek || legacy.days || legacy.workWeekdays?.length || 6);
  return normalizeState({
    ...legacy,
    onboardingComplete: true,
    targetProfit: Number(legacy.targetProfit || legacy.target || 4000),
    workWeekdays: Array.isArray(legacy.workWeekdays) ? legacy.workWeekdays : weekdaysForCount(days),
    fuel: {
      type: activeFuel,
      label: preset.label,
      unit: preset.unit,
      price: Number(activeFuel === 'gasoline' ? legacy.gasPrice : legacy.gnvPrice) || preset.price,
      efficiency: Number(activeFuel === 'gasoline' ? legacy.gasEff : legacy.gnvEff) || preset.efficiency
    },
    costs: [
      { id: 'maintenance-default', name: 'Reserva de manutenção', kind: 'per_km', category: 'reserve', value: Number(legacy.maintKm) || 0.18, active: true },
      { id: 'fixed-default', name: 'Outros custos mensais', kind: 'monthly', category: 'obligation', value: Number(legacy.fixedMonthly || legacy.fixed) || 650, active: true }
    ]
  });
}
