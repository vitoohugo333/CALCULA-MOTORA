import { defineModule } from '../../platform/manifest.js';

export const platformDemoModule = defineModule({
  manifest: {
    id: 'platform-demo',
    version: '1.0.0',
    status: 'experimental',
    dataVersion: 1,
    defaultEnabled: false,
    featureFlag: 'platform-demo',
    dependencies: [],
    capabilities: ['diagnostic-proof'],
  },
  async setup({ events }) {
    await events.emit('demo:started', { moduleId: 'platform-demo' });
    return async () => {
      await events.emit('demo:stopped', { moduleId: 'platform-demo' });
    };
  },
});
