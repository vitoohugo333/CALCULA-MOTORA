import { defineModule } from './manifest.js';

function toDisposer(result, moduleId) {
  if (result == null) return async () => {};
  if (typeof result === 'function') return result;
  if (typeof result.dispose === 'function') return () => result.dispose();
  throw new TypeError(`setup() de ${moduleId} deve retornar uma função, um objeto com dispose() ou nada.`);
}

export function createModuleRegistry({ eventBus, featureFlags, services = {} }) {
  if (!eventBus || typeof eventBus.emit !== 'function') throw new TypeError('eventBus é obrigatório.');
  if (!featureFlags || typeof featureFlags.isEnabled !== 'function') throw new TypeError('featureFlags é obrigatório.');
  if (!services || typeof services !== 'object' || Array.isArray(services)) throw new TypeError('services deve ser um objeto.');

  const definitions = new Map();
  const runtime = new Map();
  const registrationOrder = [];

  function register(input) {
    const definition = defineModule(input);
    const { id } = definition.manifest;
    if (definitions.has(id)) throw new Error(`Módulo já registrado: ${id}.`);

    definitions.set(id, definition);
    runtime.set(id, { status: 'registered', error: null, disposer: null });
    registrationOrder.push(id);
    return definition.manifest;
  }

  function assertRegistered(id) {
    if (!definitions.has(id)) throw new Error(`Módulo não registrado: ${id}.`);
  }

  function enabledDependents(id) {
    return registrationOrder.filter(candidateId => {
      const definition = definitions.get(candidateId);
      const state = runtime.get(candidateId);
      return definition?.manifest.dependencies.includes(id) && state?.status === 'enabled';
    });
  }

  async function enable(id, stack = []) {
    assertRegistered(id);
    const definition = definitions.get(id);
    const state = runtime.get(id);
    const { manifest } = definition;

    if (state.status === 'enabled') return manifest;
    if (state.status === 'enabling') {
      throw new Error(`Dependência circular detectada: ${[...stack, id].join(' -> ')}.`);
    }
    if (manifest.featureFlag && !featureFlags.isEnabled(manifest.featureFlag)) {
      throw new Error(`Módulo ${id} bloqueado pela flag ${manifest.featureFlag}.`);
    }

    state.status = 'enabling';
    state.error = null;

    try {
      for (const dependency of manifest.dependencies) {
        assertRegistered(dependency);
        await enable(dependency, [...stack, id]);
      }
      for (const serviceName of manifest.requiredServices) {
        if (!(serviceName in services)) throw new Error(`Serviço ausente para ${id}: ${serviceName}.`);
      }

      const context = Object.freeze({
        moduleId: id,
        manifest,
        events: eventBus,
        flags: featureFlags,
        services: Object.freeze({ ...services }),
      });
      const setupResult = await definition.setup(context);
      state.disposer = toDisposer(setupResult, id);
      state.status = 'enabled';
      await eventBus.emit('module:enabled', { id, version: manifest.version });
      return manifest;
    } catch (error) {
      state.status = 'error';
      state.error = error;
      state.disposer = null;
      await eventBus.emit('module:error', { id, phase: 'enable', error });
      throw error;
    }
  }

  async function disable(id, { cascade = false } = {}) {
    assertRegistered(id);
    const state = runtime.get(id);
    if (state.status !== 'enabled') {
      if (state.status === 'error') state.status = 'registered';
      return definitions.get(id).manifest;
    }

    const dependents = enabledDependents(id);
    if (dependents.length && !cascade) {
      throw new Error(`Não é possível desativar ${id}; módulos ativos dependem dele: ${dependents.join(', ')}.`);
    }
    for (const dependent of dependents.reverse()) await disable(dependent, { cascade: true });

    state.status = 'disabling';
    try {
      await state.disposer?.();
      state.disposer = null;
      state.status = 'registered';
      state.error = null;
      await eventBus.emit('module:disabled', { id });
      return definitions.get(id).manifest;
    } catch (error) {
      state.status = 'error';
      state.error = error;
      await eventBus.emit('module:error', { id, phase: 'disable', error });
      throw error;
    }
  }

  function remove(id) {
    assertRegistered(id);
    const state = runtime.get(id);
    if (state.status === 'enabled' || state.status === 'enabling' || state.status === 'disabling') {
      throw new Error(`Desative o módulo ${id} antes de removê-lo.`);
    }
    const dependents = registrationOrder.filter(candidateId => definitions.get(candidateId)?.manifest.dependencies.includes(id));
    if (dependents.length) {
      throw new Error(`Não é possível remover ${id}; módulos registrados dependem dele: ${dependents.join(', ')}.`);
    }

    definitions.delete(id);
    runtime.delete(id);
    registrationOrder.splice(registrationOrder.indexOf(id), 1);
    return true;
  }

  async function initialize() {
    for (const id of registrationOrder) {
      const { manifest } = definitions.get(id);
      const allowedByFlag = !manifest.featureFlag || featureFlags.isEnabled(manifest.featureFlag);
      if (manifest.defaultEnabled && allowedByFlag) await enable(id);
    }
    return diagnostics();
  }

  async function dispose() {
    for (const id of [...registrationOrder].reverse()) {
      if (runtime.get(id)?.status === 'enabled') await disable(id, { cascade: true });
    }
  }

  function get(id) {
    assertRegistered(id);
    const definition = definitions.get(id);
    const state = runtime.get(id);
    return Object.freeze({
      manifest: definition.manifest,
      status: state.status,
      error: state.error,
    });
  }

  function list() {
    return registrationOrder.map(get);
  }

  function diagnostics() {
    return Object.freeze({
      registered: definitions.size,
      enabled: registrationOrder.filter(id => runtime.get(id)?.status === 'enabled').length,
      modules: Object.freeze(list().map(item => Object.freeze({
        id: item.manifest.id,
        version: item.manifest.version,
        status: item.status,
        category: item.manifest.status,
        dataVersion: item.manifest.dataVersion,
        featureFlag: item.manifest.featureFlag,
        dependencies: [...item.manifest.dependencies],
        error: item.error ? String(item.error.message || item.error) : null,
      }))),
    });
  }

  return Object.freeze({ register, enable, disable, remove, initialize, dispose, get, list, diagnostics });
}
