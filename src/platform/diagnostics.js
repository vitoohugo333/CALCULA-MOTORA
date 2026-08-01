export function createDiagnostics({ appVersion, registry, featureFlags, eventBus, clock = () => new Date() }) {
  if (!appVersion) throw new Error('appVersion é obrigatório para diagnóstico.');

  function snapshot() {
    const moduleState = registry.diagnostics();
    return Object.freeze({
      schemaVersion: 1,
      generatedAt: clock().toISOString(),
      app: Object.freeze({ version: String(appVersion), mode: 'local-first' }),
      flags: featureFlags.snapshot(),
      modules: moduleState,
      events: Object.freeze({ listeners: eventBus.listenerCount() }),
    });
  }

  function serialize(space = 2) {
    return JSON.stringify(snapshot(), null, space);
  }

  return Object.freeze({ snapshot, serialize });
}
