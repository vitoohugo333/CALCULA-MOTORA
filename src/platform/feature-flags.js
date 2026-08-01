const FLAG_NAME_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;

function normalizeFlags(input, label) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError(`${label} deve ser um objeto.`);
  }

  const output = {};
  for (const [name, value] of Object.entries(input)) {
    if (!FLAG_NAME_PATTERN.test(name)) throw new Error(`Feature flag inválida: ${name}.`);
    if (typeof value !== 'boolean') throw new TypeError(`A flag ${name} deve ser booleana.`);
    output[name] = value;
  }
  return output;
}

export function createFeatureFlags(defaults = {}, overrides = {}) {
  const baseline = Object.freeze(normalizeFlags(defaults, 'Flags padrão'));
  const current = {
    ...baseline,
    ...normalizeFlags(overrides, 'Sobrescritas de flags'),
  };

  for (const name of Object.keys(current)) {
    if (!(name in baseline)) throw new Error(`Sobrescrita para flag desconhecida: ${name}.`);
  }

  function has(name) {
    return Object.hasOwn(current, name);
  }

  function isEnabled(name) {
    if (!has(name)) throw new Error(`Feature flag desconhecida: ${name}.`);
    return current[name] === true;
  }

  function set(name, enabled) {
    if (!has(name)) throw new Error(`Feature flag desconhecida: ${name}.`);
    if (typeof enabled !== 'boolean') throw new TypeError('O valor da flag deve ser booleano.');
    current[name] = enabled;
    return current[name];
  }

  function reset(name = null) {
    if (name === null) {
      for (const flagName of Object.keys(current)) current[flagName] = baseline[flagName];
      return snapshot();
    }
    if (!has(name)) throw new Error(`Feature flag desconhecida: ${name}.`);
    current[name] = baseline[name];
    return current[name];
  }

  function snapshot() {
    return Object.freeze({ ...current });
  }

  return Object.freeze({ has, isEnabled, set, reset, snapshot });
}
