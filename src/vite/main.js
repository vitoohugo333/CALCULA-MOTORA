import { runLegacyParityChecks } from './parity.js';

function initializeParity() {
  const app = window.__vettaApp;
  if (!app) {
    document.documentElement.dataset.vettaViteParity = 'unavailable';
    return;
  }

  const run = () => runLegacyParityChecks(app);
  run();

  if (!app.__vettaViteRenderPatched) {
    const originalRender = app.render;
    app.render = function parityAwareRender(...args) {
      const result = originalRender.apply(this, args);
      queueMicrotask(run);
      return result;
    };
    app.__vettaViteRenderPatched = true;
  }

  document.documentElement.dataset.vettaBuildSystem = 'vite';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeParity, { once: true });
} else {
  initializeParity();
}
