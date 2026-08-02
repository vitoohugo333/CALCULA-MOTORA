const DEFAULT_EPSILON = 1e-9;

export function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function fuelCostPerKm(fuel = {}) {
  const efficiency = toNumber(fuel.efficiency);
  return efficiency > 0 ? toNumber(fuel.price) / efficiency : 0;
}

export function monthlyEquivalent(cost = {}, referenceMonthKey = '') {
  if (!cost.active) return 0;
  const value = toNumber(cost.value);
  if (cost.kind === 'monthly') return value;
  if (cost.kind === 'weekly') return value * 52 / 12;
  if (cost.kind === 'one_time') return (!cost.month || cost.month === referenceMonthKey) ? value : 0;
  return 0;
}

export function buildCostContext(costs = [], referenceMonthKey = '') {
  const active = Array.isArray(costs) ? costs.filter(cost => cost?.active) : [];
  let obligations = 0;
  let reserves = 0;
  let perKm = 0;
  let percent = 0;

  for (const cost of active) {
    if (cost.kind === 'per_km') perKm += toNumber(cost.value);
    else if (cost.kind === 'percent') percent += toNumber(cost.value) / 100;
    else if (cost.category === 'reserve') reserves += monthlyEquivalent(cost, referenceMonthKey);
    else obligations += monthlyEquivalent(cost, referenceMonthKey);
  }

  return Object.freeze({
    active,
    obligations,
    reserves,
    monthlyFixed: obligations + reserves,
    perKm,
    percent: clamp(percent, 0, 0.95),
  });
}

export function calculateRecord(record = {}, {
  fuelKm = 0,
  costContext = buildCostContext(),
  plannedDays = 1,
} = {}) {
  const gross = toNumber(record.gross);
  const km = toNumber(record.km);
  const fuelRate = toNumber(record.fuelCostKmSnapshot) || fuelKm;
  const fuel = toNumber(record.fuelSpend) > 0 ? toNumber(record.fuelSpend) : km * fuelRate;
  const perKmRate = record.perKmCostSnapshot != null
    ? toNumber(record.perKmCostSnapshot)
    : record.maintKmSnapshot != null
      ? toNumber(record.maintKmSnapshot)
      : costContext.perKm;
  const percentRate = record.percentCostSnapshot != null ? toNumber(record.percentCostSnapshot) : 0;
  const variable = km * perKmRate;
  const percentCost = gross * percentRate;
  const fixedShare = toNumber(record.fixedShareSnapshot) > 0
    ? toNumber(record.fixedShareSnapshot)
    : costContext.monthlyFixed / Math.max(1, plannedDays);
  const contribution = gross - fuel - variable - percentCost;

  return Object.freeze({
    ...record,
    gross,
    km,
    fuel,
    variable,
    percentCost,
    contribution,
    fixedShare,
    net: contribution - fixedShare,
    revenuePerKm: km > 0 ? gross / km : 0,
    costPerKm: km > 0 ? (fuel + variable + percentCost) / km : 0,
  });
}

export function calculateFinancialPlan({ state = {}, context = {} } = {}) {
  const plannedDays = Math.max(1, toNumber(context.plannedDays, 1));
  const remainingDays = Math.max(0, toNumber(context.remainingDays));
  const monthKey = String(context.monthKey || '');
  const monthRecords = Array.isArray(context.monthRecords) ? context.monthRecords : [];
  const costs = buildCostContext(state.costs, monthKey);
  const fuelKm = fuelCostPerKm(state.fuel);
  const revenueKm = toNumber(state.revenueKm);
  const targetProfit = toNumber(state.targetProfit);
  const contributionKm = Math.max(0.01, revenueKm * (1 - costs.percent) - fuelKm - costs.perKm);
  const records = monthRecords.map(record => calculateRecord(record, {
    fuelKm,
    costContext: costs,
    plannedDays,
  }));

  const actualGross = records.reduce((sum, record) => sum + record.gross, 0);
  const actualKm = records.reduce((sum, record) => sum + record.km, 0);
  const actualFuel = records.reduce((sum, record) => sum + record.fuel, 0);
  const actualVariable = records.reduce((sum, record) => sum + record.variable, 0);
  const actualPercent = records.reduce((sum, record) => sum + record.percentCost, 0);
  const actualContribution = actualGross - actualFuel - actualVariable - actualPercent;
  const fixedAllocated = costs.monthlyFixed * Math.min(1, records.length / plannedDays);
  const actualNet = actualContribution - fixedAllocated;
  const requiredContribution = targetProfit + costs.monthlyFixed;
  const remainingContribution = Math.max(0, requiredContribution - actualContribution);
  const dailyContribution = remainingDays > 0 ? remainingContribution / remainingDays : remainingContribution;
  const dailyKm = dailyContribution / contributionKm;
  const dailyGross = dailyKm * revenueKm;
  const dailyNet = remainingDays > 0
    ? Math.max(0, (targetProfit - actualNet) / remainingDays)
    : Math.max(0, targetProfit - actualNet);
  const totalRequiredKm = requiredContribution / contributionKm;
  const totalGross = totalRequiredKm * revenueKm;
  const totalFuel = totalRequiredKm * fuelKm;
  const totalVariable = totalRequiredKm * costs.perKm;
  const totalPercent = totalGross * costs.percent;
  const averageContribution = records.length ? actualContribution / records.length : dailyContribution;
  const projectedNet = records.length ? averageContribution * plannedDays - costs.monthlyFixed : targetProfit;
  const consumedDays = Math.max(0, plannedDays - remainingDays);
  const expectedNetToDate = targetProfit * (consumedDays / plannedDays);
  const paceDelta = actualNet - expectedNetToDate;
  const progress = targetProfit > 0 ? clamp(actualNet / targetProfit * 100, 0, 100) : 0;
  const avgRevenueKm = actualKm > 0 ? actualGross / actualKm : 0;
  const avgNetKm = actualKm > 0 ? actualContribution / actualKm : 0;
  const surplusContribution = Math.max(0, actualContribution - requiredContribution * (consumedDays / plannedDays));
  const earnedDays = dailyContribution > 0 ? Math.floor(surplusContribution / dailyContribution) : 0;

  return Object.freeze({
    costs,
    records,
    fuelKm,
    contributionKm,
    actualGross,
    actualKm,
    actualFuel,
    actualVariable,
    actualPercent,
    actualContribution,
    fixedAllocated,
    actualNet,
    remainingContribution,
    remainingDays,
    dailyContribution,
    dailyGross,
    dailyKm,
    dailyNet,
    totalRequiredKm,
    totalGross,
    totalFuel,
    totalVariable,
    totalPercent,
    projectedNet,
    expectedNetToDate,
    paceDelta,
    progress,
    avgRevenueKm,
    avgNetKm,
    earnedDays,
  });
}

export const FINANCIAL_PARITY_KEYS = Object.freeze([
  'fuelKm',
  'contributionKm',
  'actualGross',
  'actualKm',
  'actualFuel',
  'actualVariable',
  'actualPercent',
  'actualContribution',
  'fixedAllocated',
  'actualNet',
  'remainingContribution',
  'remainingDays',
  'dailyContribution',
  'dailyGross',
  'dailyKm',
  'dailyNet',
  'totalRequiredKm',
  'totalGross',
  'totalFuel',
  'totalVariable',
  'totalPercent',
  'projectedNet',
  'expectedNetToDate',
  'paceDelta',
  'progress',
  'avgRevenueKm',
  'avgNetKm',
  'earnedDays',
]);

export function compareFinancialResults(legacy = {}, modular = {}, epsilon = DEFAULT_EPSILON) {
  const differences = [];
  for (const key of FINANCIAL_PARITY_KEYS) {
    const left = toNumber(legacy[key]);
    const right = toNumber(modular[key]);
    if (Math.abs(left - right) > epsilon) differences.push(Object.freeze({ key, legacy: left, modular: right }));
  }
  if ((legacy.records?.length || 0) !== (modular.records?.length || 0)) {
    differences.push(Object.freeze({
      key: 'records.length',
      legacy: legacy.records?.length || 0,
      modular: modular.records?.length || 0,
    }));
  }
  return Object.freeze({ equal: differences.length === 0, differences: Object.freeze(differences) });
}
