import test from 'node:test';
import assert from 'node:assert/strict';
import {
  StateStorageError,
  createLocalStateStore,
  statesEqual,
} from '../src/storage/local-state-store.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

function createStore(storage = memoryStorage()) {
  return createLocalStateStore({
    storage,
    key: 'vetta-state',
    normalize: value => ({ ...value, version: 3, records: Array.isArray(value.records) ? value.records : [], costs: Array.isArray(value.costs) ? value.costs : [] }),
    validate: value => value?.version === 3 && Array.isArray(value.records) && Array.isArray(value.costs),
    clock: () => '2026-08-02T00:00:00.000Z',
  });
}

test('grava, lê e devolve cópias independentes', () => {
  const store = createStore();
  const state = { targetProfit: 4000, records: [], costs: [] };
  const receipt = store.write(state);
  assert.equal(receipt.key, 'vetta-state');
  assert.ok(receipt.bytes > 0);
  assert.equal(receipt.savedAt, '2026-08-02T00:00:00.000Z');

  const first = store.read();
  first.targetProfit = 9999;
  const second = store.read();
  assert.equal(second.targetProfit, 4000);
  assert.equal(second.version, 3);
  assert.equal(store.inspect().exists, true);
});

test('falha de forma explícita para JSON e estado inválidos', () => {
  const storage = memoryStorage();
  storage.setItem('vetta-state', '{invalid');
  assert.throws(() => createStore(storage).read(), error => error instanceof StateStorageError && error.code === 'INVALID_JSON');

  const invalidStore = createLocalStateStore({
    storage: memoryStorage(),
    key: 'state',
    validate: () => false,
  });
  assert.throws(() => invalidStore.write({}), error => error instanceof StateStorageError && error.code === 'INVALID_STATE');
});

test('exporta e importa envelope versionado', () => {
  const source = createStore();
  source.write({ targetProfit: 4500, records: [{ date: '2026-08-01' }], costs: [] });
  const exported = source.export();
  const envelope = JSON.parse(exported);
  assert.equal(envelope.format, 'vetta-state');
  assert.equal(envelope.version, 1);
  assert.equal(envelope.state.targetProfit, 4500);

  const target = createStore();
  target.import(exported);
  assert.equal(target.read().targetProfit, 4500);
  assert.throws(() => target.import('{"format":"other"}'), error => error.code === 'INVALID_IMPORT_FORMAT');
});

test('remove o estado e compara estruturas serializadas', () => {
  const store = createStore();
  store.write({ records: [], costs: [], targetProfit: 4000 });
  store.remove();
  assert.equal(store.exists(), false);
  assert.equal(store.read(), null);
  assert.equal(statesEqual({ a: 1 }, { a: 1 }), true);
  assert.equal(statesEqual({ a: 1 }, { a: 2 }), false);
});
