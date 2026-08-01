const MODULE_ID_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export const MODULE_STATUSES = Object.freeze([
  'core',
  'stable',
  'optional',
  'experimental',
  'deprecated',
]);

function requirePlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} deve ser um objeto.`);
  }
}

function normalizeStringArray(value, label) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new TypeError(`${label} deve ser uma lista.`);

  const normalized = value.map(item => String(item).trim()).filter(Boolean);
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${label} não pode conter valores duplicados.`);
  }
  return normalized;
}

export function defineModuleManifest(input) {
  requirePlainObject(input, 'Manifesto do módulo');

  const id = String(input.id || '').trim();
  const version = String(input.version || '').trim();
  const status = String(input.status || '').trim();
  const dependencies = normalizeStringArray(input.dependencies, 'dependencies');
  const requiredServices = normalizeStringArray(input.requiredServices, 'requiredServices');
  const capabilities = normalizeStringArray(input.capabilities, 'capabilities');
  const featureFlag = input.featureFlag == null ? null : String(input.featureFlag).trim();
  const dataVersion = Number(input.dataVersion ?? 1);

  if (!MODULE_ID_PATTERN.test(id)) {
    throw new Error(`ID de módulo inválido: ${id || '(vazio)'}.`);
  }
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Versão semântica inválida para ${id}: ${version || '(vazia)'}.`);
  }
  if (!MODULE_STATUSES.includes(status)) {
    throw new Error(`Status inválido para ${id}: ${status || '(vazio)'}.`);
  }
  if (!Number.isInteger(dataVersion) || dataVersion < 1) {
    throw new Error(`dataVersion de ${id} deve ser um inteiro positivo.`);
  }
  if (dependencies.includes(id)) {
    throw new Error(`O módulo ${id} não pode depender de si mesmo.`);
  }
  for (const dependency of dependencies) {
    if (!MODULE_ID_PATTERN.test(dependency)) {
      throw new Error(`Dependência inválida em ${id}: ${dependency}.`);
    }
  }
  if (featureFlag !== null && !MODULE_ID_PATTERN.test(featureFlag)) {
    throw new Error(`Feature flag inválida em ${id}: ${featureFlag}.`);
  }

  return Object.freeze({
    id,
    version,
    status,
    dataVersion,
    defaultEnabled: Boolean(input.defaultEnabled),
    featureFlag,
    dependencies: Object.freeze(dependencies),
    requiredServices: Object.freeze(requiredServices),
    capabilities: Object.freeze(capabilities),
    navigation: input.navigation ? Object.freeze({ ...input.navigation }) : null,
  });
}

export function defineModule(input) {
  requirePlainObject(input, 'Definição do módulo');
  if (typeof input.setup !== 'function') {
    throw new TypeError('Todo módulo deve fornecer uma função setup(context).');
  }

  return Object.freeze({
    manifest: defineModuleManifest(input.manifest),
    setup: input.setup,
  });
}
