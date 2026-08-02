import { runLegacyParityChecks } from './parity.js';

function waitForLegacyApp({ timeoutMs = 5000, intervalMs = 20 } = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (window.__vettaApp) return resolve(window.__vettaApp);
      if (Date.now() - startedAt >= timeoutMs) {
        return reject(new Error('O aplicativo legado não ficou disponível dentro do tempo esperado.'));
      }
      setTimeout(check, intervalMs);
    };
    check();
  });
}

async function initializeViteRuntime() {
  try {
    const app = await waitForLegacyApp();

    await import('../../didactic-language.js');
    await import('../../onboarding-experience.js');
    await import('../../pwa-install-gate.js');

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
    document.documentElement.dataset.vettaViteRuntime = 'ready';
  } catch (error) {
    document.documentElement.dataset.vettaBuildSystem = 'vite';
    document.documentElement.dataset.vettaViteRuntime = 'error';
    document.documentElement.dataset.vettaViteParity = 'unavailable';
    console.error('Falha ao iniciar o runtime Vite do VETTA.', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeViteRuntime, { once: true });
} else {
  initializeViteRuntime();
}
