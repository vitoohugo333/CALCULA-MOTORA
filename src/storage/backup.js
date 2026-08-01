import { normalizeState } from './migrations.js';

export function createBackup(state) {
  return JSON.stringify({ exportedAt: new Date().toISOString(), app: 'VETTA', state: normalizeState(state) }, null, 2);
}

export function parseBackup(text) {
  const parsed = JSON.parse(text);
  return normalizeState(parsed?.state || parsed);
}

export function downloadBackup(state) {
  const blob = new Blob([createBackup(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `vetta-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
