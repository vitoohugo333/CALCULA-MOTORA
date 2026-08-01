import { createDefaultState, importLegacyState, normalizeState } from './migrations.js';

export const STORAGE_KEY = 'vetta-driver-intelligence-v3';
const LEGACY_KEYS = ['vetta-driver-intelligence-v2', 'vetta-state'];

function getStorage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export function loadState() {
  const storage = getStorage();
  if (!storage) return createDefaultState();
  try {
    const current = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
    if (current) return normalizeState(current);
    for (const key of LEGACY_KEYS) {
      const legacy = JSON.parse(storage.getItem(key) || 'null');
      if (!legacy) continue;
      const state = importLegacyState(legacy);
      saveState(state);
      for (const legacyKey of LEGACY_KEYS) storage.removeItem(legacyKey);
      return state;
    }
  } catch (error) {
    console.warn('Falha ao carregar dados locais', error);
  }
  return createDefaultState();
}

export function saveState(state) {
  const normalized = normalizeState(state);
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function resetState() {
  const state = createDefaultState();
  saveState(state);
  return state;
}
