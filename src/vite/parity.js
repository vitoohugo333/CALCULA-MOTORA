import {
  calculateFinancialPlan,
  compareFinancialResults,
} from '../domain/finance/calculations.js';
import {
  createLocalStateStore,
  statesEqual,
} from '../storage/local-state-store.js';

const STORAGE_KEY = 'vetta-driver-intelligence-v3';

function monthKeyFromContext(context) {
  const year = Number(context?.year);
  const month = Number(context?.month);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return '';
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function normalizeLegacyState(value = {}) {
  const app = window.__vettaApp;
  return typeof app?.normalizeState === 'function' ? app.normalizeState(value) : value;
}

export function runLegacyParityChecks(app = window.__vettaApp) {
  if (!app?.state || typeof app.calculations !== 'function') {
    return Object.freeze({ status: 'unavailable', finance: null, storage: null });
  }

  const legacy = app.calculations();
  const modular = calculateFinancialPlan({
    state: app.state,
    context: {
      monthKey: monthKeyFromContext(legacy.ctx),
      plannedDays: legacy.ctx.plannedDays,
      remainingDays: legacy.ctx.remainingDays,
      monthRecords: legacy.ctx.monthRecords,
    },
  });
  const finance = compareFinancialResults(legacy, modular);

  const store = createLocalStateStore({
    storage: window.localStorage,
    key: STORAGE_KEY,
    normalize: normalizeLegacyState,
    validate: value => value && typeof value === 'object' && Array.isArray(value.records) && Array.isArray(value.costs),
  });
  const storedState = store.read();
  const storage = Object.freeze({
    available: storedState != null,
    equal: storedState == null ? true : statesEqual(storedState, normalizeLegacyState(app.state)),
    inspection: store.inspect(),
  });

  const status = finance.equal && storage.equal ? 'pass' : 'fail';
  const result = Object.freeze({ status, finance, storage, checkedAt: new Date().toISOString() });
  document.documentElement.dataset.vettaViteParity = status;
  window.__vettaViteParity = result;

  if (status === 'fail') {
    console.error('Divergência detectada entre os módulos Vite e o legado.', result);
  }
  return result;
}
