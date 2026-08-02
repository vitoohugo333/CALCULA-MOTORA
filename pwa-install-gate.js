import {
  detectInstallPlatform,
  detectIosBrowser,
  installInstructions,
  isStandaloneEnvironment,
  shouldLockApplication,
} from './src/pwa/install-gate-core.js';

const GATE_ID = 'vettaPwaInstallGate';
let promptEvent = null;
let gateState = null;

function lockBackground(gate) {
  document.body.classList.add('pwa-install-required');
  for (const node of [...document.body.children]) {
    if (node === gate || node.tagName === 'SCRIPT') continue;
    node.inert = true;
    node.setAttribute('aria-hidden', 'true');
  }
}

function updateStatus(message, tone = 'neutral') {
  const status = document.getElementById('vettaPwaGateStatus');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
  status.classList.remove('hidden');
}

function copyCurrentAddress() {
  const address = window.location.href.split('#')[0];
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(address);
  const textarea = document.createElement('textarea');
  textarea.value = address;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
  return Promise.resolve();
}

function renderGate() {
  const gate = document.getElementById(GATE_ID);
  if (!gate || !gateState) return;
  const availablePrompt = Boolean(promptEvent || window.__vettaApp?.deferredPrompt);
  const copy = installInstructions({
    platform: gateState.platform,
    iosBrowser: gateState.iosBrowser,
    promptAvailable: availablePrompt,
  });
  const outcome = copy.outcome
    ? `<p class="pwa-gate-outcome">${copy.outcome}</p>`
    : '';
  const benefits = copy.benefits
    .map(item => `<div><i class="fa-solid ${item.icon}"></i><span>${item.label}</span></div>`)
    .join('');
  const actionButton = copy.actionLabel
    ? `<button id="vettaPwaGateAction" class="pwa-gate-primary" type="button">${copy.actionLabel}</button>`
    : '';

  gate.innerHTML = `
    <section class="pwa-gate-card" data-platform="${gateState.platform}" role="dialog" aria-modal="true" aria-labelledby="vettaPwaGateTitle" aria-describedby="vettaPwaGateDescription" tabindex="-1">
      <div class="pwa-gate-brand" aria-hidden="true">V</div>
      <span class="pwa-gate-eyebrow">${copy.eyebrow}</span>
      <h1 id="vettaPwaGateTitle">${copy.title}</h1>
      <p id="vettaPwaGateDescription" class="pwa-gate-description">${copy.description}</p>
      ${outcome}
      <div class="pwa-gate-benefits">${benefits}</div>
      <div class="pwa-gate-instructions">
        <strong>${copy.browserHint}</strong>
        <ol>${copy.steps.map(step => `<li>${step}</li>`).join('')}</ol>
      </div>
      <p id="vettaPwaGateStatus" class="pwa-gate-status hidden" role="status" aria-live="polite"></p>
      ${actionButton}
      <p class="pwa-gate-important"><strong>Importante:</strong> ${copy.important}</p>
    </section>`;

  const primaryButton = document.getElementById('vettaPwaGateAction');
  primaryButton?.addEventListener('click', async () => {
    if (copy.action === 'copy-address') {
      try {
        await copyCurrentAddress();
        updateStatus('Endereço copiado. Abra o Safari, cole o endereço e siga os passos acima.', 'success');
      } catch {
        updateStatus('Não foi possível copiar. Use Compartilhar e toque em “Copiar”.', 'warning');
      }
      return;
    }

    const event = promptEvent || window.__vettaApp?.deferredPrompt;
    if (!event) {
      renderGate();
      updateStatus('Siga os passos mostrados acima para instalar o VETTA.', 'warning');
      return;
    }

    try {
      await event.prompt();
      const choice = await event.userChoice;
      promptEvent = null;
      if (window.__vettaApp) window.__vettaApp.deferredPrompt = null;
      if (choice?.outcome === 'accepted') {
        renderInstalledSuccess();
      } else {
        renderGate();
        updateStatus('Instalação cancelada. Para continuar, instale o VETTA.', 'warning');
      }
    } catch {
      promptEvent = null;
      if (window.__vettaApp) window.__vettaApp.deferredPrompt = null;
      renderGate();
      updateStatus('Não foi possível abrir a instalação. Siga os passos mostrados acima.', 'warning');
    }
  });

  (primaryButton || gate.querySelector('.pwa-gate-card'))?.focus({ preventScroll: true });
}

function renderInstalledSuccess() {
  const gate = document.getElementById(GATE_ID);
  if (!gate) return;
  gate.innerHTML = `
    <section class="pwa-gate-card pwa-gate-success" role="dialog" aria-modal="true" tabindex="-1">
      <div class="pwa-gate-success-icon"><i class="fa-solid fa-check"></i></div>
      <span class="pwa-gate-eyebrow">Instalação concluída</span>
      <h1>Abra o VETTA pelo novo ícone</h1>
      <p class="pwa-gate-description">Feche esta tela, volte à Tela de Início e toque no ícone do VETTA.</p>
    </section>`;
  gate.querySelector('.pwa-gate-card')?.focus({ preventScroll: true });
}

function initializeGate() {
  const installed = isStandaloneEnvironment({
    matchMedia: window.matchMedia.bind(window),
    navigatorLike: navigator,
  });
  const testMode = window.__VETTA_PWA_TEST_MODE__;
  if (!shouldLockApplication({ installed, testMode })) {
    document.documentElement.dataset.vettaPwaGate = 'unlocked';
    return;
  }

  gateState = {
    platform: detectInstallPlatform(navigator),
    iosBrowser: detectIosBrowser(navigator),
  };
  promptEvent = window.__vettaApp?.deferredPrompt || null;

  const gate = document.createElement('div');
  gate.id = GATE_ID;
  gate.className = 'pwa-gate-backdrop';
  document.body.appendChild(gate);
  lockBackground(gate);
  document.documentElement.dataset.vettaPwaGate = 'locked';
  renderGate();

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    promptEvent = event;
    renderGate();
  });
  window.addEventListener('appinstalled', renderInstalledSuccess);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGate, { once: true });
} else {
  initializeGate();
}
