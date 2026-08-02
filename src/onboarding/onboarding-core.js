export const ONBOARDING_PROGRESS_KEY = 'vetta-onboarding-progress-v1';

const FUEL_PRESETS = Object.freeze({
  gnv: Object.freeze({ type: 'gnv', label: 'GNV', unit: 'm³', price: 4.79, efficiency: 13.2 }),
  gasoline: Object.freeze({ type: 'gasoline', label: 'Gasolina', unit: 'L', price: 6.19, efficiency: 10.5 }),
  ethanol: Object.freeze({ type: 'ethanol', label: 'Etanol', unit: 'L', price: 4.29, efficiency: 7.5 }),
  diesel: Object.freeze({ type: 'diesel', label: 'Diesel', unit: 'L', price: 6.09, efficiency: 11.5 }),
});

const GENERATED_COST_IDS = new Set(['maintenance-onboarding', 'fixed-onboarding']);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function allowedStep(value) {
  return Math.min(3, Math.max(1, Math.trunc(finiteNumber(value, 1))));
}

function allowedDays(value) {
  const days = Math.trunc(finiteNumber(value, 6));
  return [5, 6, 7].includes(days) ? days : 6;
}

function allowedFuelType(value) {
  return Object.hasOwn(FUEL_PRESETS, value) ? value : 'gnv';
}

export function weekdaysForCount(days) {
  if (days >= 7) return [0, 1, 2, 3, 4, 5, 6];
  if (days === 6) return [1, 2, 3, 4, 5, 6];
  return [1, 2, 3, 4, 5];
}

export function workdayCount(weekdays = []) {
  if (!Array.isArray(weekdays)) return 6;
  if (weekdays.length >= 7) return 7;
  if (weekdays.length <= 5) return 5;
  return 6;
}

export function progressFromState(state = {}, overrides = {}) {
  const fuelType = allowedFuelType(state.fuel?.type);
  const preset = FUEL_PRESETS[fuelType];
  const fixedCost = Array.isArray(state.costs)
    ? state.costs.find(cost => cost.id === 'fixed-onboarding')
      || state.costs.find(cost => cost.active && cost.kind === 'monthly' && cost.category === 'obligation')
    : null;

  return normalizeOnboardingProgress({
    version: 1,
    mode: state.onboardingComplete ? 'redo' : 'initial',
    step: 1,
    dismissed: false,
    target: finiteNumber(state.targetProfit, 4000),
    days: workdayCount(state.workWeekdays),
    fuelType,
    fuelPrice: finiteNumber(state.fuel?.price, preset.price),
    fuelEfficiency: finiteNumber(state.fuel?.efficiency, preset.efficiency),
    revenueKm: finiteNumber(state.revenueKm, 2.25),
    fixedMonthly: finiteNumber(fixedCost?.value, 0),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });
}

export function normalizeOnboardingProgress(raw = {}) {
  const fuelType = allowedFuelType(raw.fuelType);
  const preset = FUEL_PRESETS[fuelType];
  const mode = raw.mode === 'redo' ? 'redo' : 'initial';
  return Object.freeze({
    version: 1,
    mode,
    step: allowedStep(raw.step),
    dismissed: raw.dismissed === true,
    target: Math.max(0, finiteNumber(raw.target, 4000)),
    days: allowedDays(raw.days),
    fuelType,
    fuelPrice: Math.max(0, finiteNumber(raw.fuelPrice, preset.price)),
    fuelEfficiency: Math.max(0, finiteNumber(raw.fuelEfficiency, preset.efficiency)),
    revenueKm: Math.max(0, finiteNumber(raw.revenueKm, 0)),
    fixedMonthly: Math.max(0, finiteNumber(raw.fixedMonthly, 0)),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  });
}

export function validateOnboardingStep(progress, step = progress?.step) {
  const normalized = normalizeOnboardingProgress(progress);
  if (step === 1 && normalized.target <= 0) {
    return Object.freeze({ valid: false, code: 'target', message: 'Informe quanto você quer que sobre por mês.' });
  }
  if (step === 2 && normalized.fuelPrice <= 0) {
    return Object.freeze({ valid: false, code: 'fuelPrice', message: `Informe quanto custa 1 ${normalized.fuelType === 'gnv' ? 'm³ de GNV' : 'litro'}.` });
  }
  if (step === 2 && normalized.fuelEfficiency <= 0) {
    return Object.freeze({ valid: false, code: 'fuelEfficiency', message: `Informe quantos quilômetros o veículo faz com 1 ${normalized.fuelType === 'gnv' ? 'm³ de GNV' : 'litro'}.` });
  }
  return Object.freeze({ valid: true, code: null, message: '' });
}

export function shouldOpenOnboarding({ onboardingComplete = false, progress = null } = {}) {
  if (onboardingComplete) return false;
  if (!progress) return true;
  return normalizeOnboardingProgress(progress).dismissed !== true;
}

export function mergeOnboardingResult(state = {}, rawProgress = {}) {
  const progress = normalizeOnboardingProgress(rawProgress);
  const preset = FUEL_PRESETS[progress.fuelType];
  const existingCosts = Array.isArray(state.costs) ? state.costs : [];
  const preservedCosts = existingCosts.filter(cost => !GENERATED_COST_IDS.has(cost.id));
  const generatedCosts = [
    {
      id: 'maintenance-onboarding',
      name: 'Reserva de manutenção',
      kind: 'per_km',
      category: 'reserve',
      value: 0.18,
      active: true,
      generatedBy: 'onboarding',
    },
  ];
  if (progress.fixedMonthly > 0) {
    generatedCosts.push({
      id: 'fixed-onboarding',
      name: 'Contas mensais iniciais',
      kind: 'monthly',
      category: 'obligation',
      value: progress.fixedMonthly,
      active: true,
      generatedBy: 'onboarding',
    });
  }

  return {
    ...state,
    onboardingComplete: true,
    targetProfit: progress.target,
    workWeekdays: weekdaysForCount(progress.days),
    fuel: {
      type: progress.fuelType,
      label: preset.label,
      unit: preset.unit,
      price: progress.fuelPrice,
      efficiency: progress.fuelEfficiency,
    },
    revenueKm: progress.revenueKm > 0 ? progress.revenueKm : finiteNumber(state.revenueKm, 2.25),
    costs: [...preservedCosts, ...generatedCosts],
  };
}

export function onboardingCompletionSummary(rawProgress = {}) {
  const progress = normalizeOnboardingProgress(rawProgress);
  return Object.freeze({
    title: 'Sua primeira meta está pronta',
    target: progress.target,
    primaryAction: 'Registrar meu primeiro dia',
    secondaryAction: 'Ver meu painel',
  });
}
