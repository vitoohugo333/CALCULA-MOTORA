import {
  createDiagnostics,
  createEventBus,
  createFeatureFlags,
  createModuleRegistry,
} from '../platform/index.js';
import { platformDemoModule } from '../modules/platform-demo/index.js';

export const PLATFORM_FLAGS = Object.freeze({
  'platform-demo': false,
});

export function createVettaPlatform({
  appVersion = '3.5.1',
  flagOverrides = {},
  services = {},
  onEventError = () => {},
  clock,
} = {}) {
  const events = createEventBus({ onError: onEventError });
  const flags = createFeatureFlags(PLATFORM_FLAGS, flagOverrides);
  const modules = createModuleRegistry({ eventBus: events, featureFlags: flags, services });
  modules.register(platformDemoModule);
  const diagnostics = createDiagnostics({ appVersion, registry: modules, featureFlags: flags, eventBus: events, clock });

  return Object.freeze({
    events,
    flags,
    modules,
    diagnostics,
    start: () => modules.initialize(),
    stop: () => modules.dispose(),
  });
}
