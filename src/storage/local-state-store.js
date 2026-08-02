export class StateStorageError extends Error {
  constructor(message, { code = 'STATE_STORAGE_ERROR', cause = null } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'StateStorageError';
    this.code = code;
  }
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function createLocalStateStore({
  storage,
  key,
  normalize = value => value,
  validate = () => true,
  clock = () => new Date().toISOString(),
} = {}) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('Um armazenamento compatível com Storage é obrigatório.');
  }
  if (!key) throw new TypeError('A chave do estado é obrigatória.');

  function decode(serialized) {
    try {
      const parsed = JSON.parse(serialized);
      const normalized = normalize(parsed);
      if (!validate(normalized)) {
        throw new StateStorageError('O estado armazenado não passou na validação.', { code: 'INVALID_STATE' });
      }
      return clone(normalized);
    } catch (error) {
      if (error instanceof StateStorageError) throw error;
      throw new StateStorageError('Não foi possível interpretar o estado armazenado.', {
        code: 'INVALID_JSON',
        cause: error,
      });
    }
  }

  return Object.freeze({
    key,

    exists() {
      return storage.getItem(key) != null;
    },

    read() {
      const serialized = storage.getItem(key);
      if (serialized == null) return null;
      return decode(serialized);
    },

    write(state) {
      const normalized = normalize(clone(state));
      if (!validate(normalized)) {
        throw new StateStorageError('O estado informado não passou na validação.', { code: 'INVALID_STATE' });
      }
      const serialized = JSON.stringify(normalized);
      storage.setItem(key, serialized);
      return Object.freeze({
        key,
        bytes: new TextEncoder().encode(serialized).byteLength,
        savedAt: clock(),
      });
    },

    remove() {
      storage.removeItem(key);
    },

    export() {
      const state = this.read();
      if (state == null) return null;
      return JSON.stringify({
        format: 'vetta-state',
        version: 1,
        exportedAt: clock(),
        state,
      }, null, 2);
    },

    import(serialized) {
      let envelope;
      try {
        envelope = JSON.parse(serialized);
      } catch (error) {
        throw new StateStorageError('O arquivo de importação não contém JSON válido.', {
          code: 'INVALID_IMPORT_JSON',
          cause: error,
        });
      }
      if (envelope?.format !== 'vetta-state' || envelope?.version !== 1 || envelope?.state == null) {
        throw new StateStorageError('O arquivo não possui o formato de estado esperado.', { code: 'INVALID_IMPORT_FORMAT' });
      }
      return this.write(envelope.state);
    },

    inspect() {
      const serialized = storage.getItem(key);
      return Object.freeze({
        key,
        exists: serialized != null,
        bytes: serialized == null ? 0 : new TextEncoder().encode(serialized).byteLength,
      });
    },
  });
}

export function statesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
