import {
  INSTALL_PLATFORMS,
  detectInstallPlatform,
  detectIosBrowser,
  installInstructions,
  isStandaloneEnvironment,
  shouldLockApplication,
} from './src/pwa/install-gate-core.js';

const GATE_ID = 'vettaPwaInstallGate';
const HELP_CLASS = 'vetta-field-help';
let promptEvent = null;
let gateState = null;

function fieldFor(input) {
  const wrapper = input?.closest('.input-wrapper');
  return wrapper?.parentElement || input?.parentElement || null;
}

function setFieldCopy(input, labelText, helpText) {
  const field = fieldFor(input);
  if (!field) return;
  const label = field.querySelector('label');
  if (label) label.textContent = labelText;
  let help = field.querySelector(`.${HELP_CLASS}`);
  if (!help) {
    help = document.createElement('p');
    help.className = `${HELP_CLASS} text-[11px] text-slate-500 mt-2 leading-relaxed`;
    field.appendChild(help);
  }
  help.textContent = helpText;
}

function readableFuelUnit(unit) {
  if (unit === 'L') return 'litro';
  if (unit === 'm³') return 'm³ de GNV';
  return unit || 'unidade de combustível';
}

function applyDidacticCopy() {
  const app = window.__vettaApp;
  const fuelInput = document.getElementById('fuelEfficiency');
  const unit = app?.state?.fuel?.unit || document.getElementById('fuelEfficiencyUnit')?.textContent || 'un.';
  setFieldCopy(
    fuelInput,
    `Quantos quilômetros faz com 1 ${readableFuelUnit(unit)}?`,
    `Exemplo: se o veículo percorre 10 km usando 1 ${readableFuelUnit(unit)}, informe 10.`,
  );

  const revenueInput = document.querySelector('[data-model="revenueKm"]');
  setFieldCopy(
    revenueInput,
    'Quanto você recebe por km rodado?',
    'Exemplo: R$ 240 de faturamento ÷ 120 km rodados = R$ 2,00 por km.',
  );

  const onboardingFuel = document.getElementById('onboardingFuelType');
  const onboardingEfficiency = document.getElementById('onboardingFuelEff');
  const onboardingUnit = onboardingFuel?.value === 'gnv' ? 'm³ de GNV' : 'litro';
  setFieldCopy(
    onboardingEfficiency,
    `Quantos quilômetros faz com 1 ${onboardingUnit}?`,
    `Informe a distância média percorrida com 1 ${onboardingUnit}. Você poderá corrigir depois.`,
  );

  const onboardingRevenue = document.getElementById('onboardingRevenue');
  setFieldCopy(
    onboardingRevenue,
    'Quanto você costuma receber por km rodado?',
    'Ainda não sabe? Use uma estimativa inicial; os registros reais ajudarão a ajustar esse número.',
  );
}

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

function copyCurrentUrl() {
  const url = window.location.href.split('#')[0];
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(url);
  const textarea = document.createElement('textarea');
  textarea.value = url;
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

  gate.innerHTML = `
    <section class="pwa-gate-card" role="dialog" aria-modal="true" aria-labelledby="vettaPwaGateTitle" aria-describedby="vettaPwaGateDescription">
      <div class="pwa-gate-brand" aria-hidden="true">V</div>
      <span class="pwa-gate-eyebrow">${copy.eyebrow}</span>
      <h1 id="vettaPwaGateTitle">${copy.title}</h1>
      <p id="vettaPwaGateDescription" class="pwa-gate-description">${copy.description}</p>
      <div class="pwa-gate-benefits">
        <div><i class="fa-solid fa-mobile-screen-button"></i><span>Ícone na tela inicial</span></div>
        <div><i class="fa-solid fa-wifi"></i><span>Uso mais confiável e offline</span></div>
        <div><i class="fa-solid fa-shield-halved"></i><span>Dados mantidos neste aparelho</span></div>
      </div>
      <div class="pwa-gate-instructions">
        <strong>${copy.browserHint}</strong>
        <ol>${copy.steps.map(step => `<li>${step}</li>`).join('')}</ol>
      </div>
      <p id="vettaPwaGateStatus" class="pwa-gate-status hidden" role="status" aria-live="polite"></p>
      <button id="vettaPwaGateAction" class="pwa-gate-primary" type="button">${copy.actionLabel}</button>
      <button id="vettaPwaGateCheck" class="pwa-gate-secondary" type="button">Já instalei. Como liberar?</button>
      <p class="pwa-gate-footnote">O conteúdo continuará bloqueado nesta aba. Depois da instalação, abra o VETTA pelo ícone criado.</p>
    </section>`;

  const actionButton = document.getElementById('vettaPwaGateAction');
  actionButton?.addEventListener('click', async () => {
    if (copy.action === 'copy-link') {
      try {
        await copyCurrentUrl();
        updateStatus('Link copiado. Abra no Safari caso a opção de instalar não apareça neste navegador.', 'success');
      } catch {
        updateStatus('Não foi possível copiar automaticamente. Use o endereço exibido na barra do navegador.', 'warning');
      }
      return;
    }

    const event = promptEvent || window.__vettaApp?.deferredPrompt;
    if (!event) {
      updateStatus('Abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.', 'warning');
      return;
    }

    try {
      await event.prompt();
      const choice = await event.userChoice;
      promptEvent = null;
      if (window.__vettaApp) window.__vettaApp.deferredPrompt = null;
      if (choice?.outcome === 'accepted') {
        updateStatus('Instalação aceita. Aguarde o ícone aparecer e abra o VETTA por ele.', 'success');
      } else {
        updateStatus('A instalação foi cancelada. O VETTA continuará bloqueado até ser instalado.', 'warning');
      }
      renderGate();
    } catch {
      updateStatus('O navegador não conseguiu abrir o instalador. Use o menu e procure “Instalar app”.', 'warning');
    }
  });

  document.getElementById('vettaPwaGateCheck')?.addEventListener('click', () => {
    if (isStandaloneEnvironment({ matchMedia: window.matchMedia.bind(window), navigatorLike: navigator })) {
      window.location.reload();
      return;
    }
    updateStatus('Esta aba ainda é o navegador. Feche-a e abra o VETTA pelo ícone da Tela de Início.', 'neutral');
  });

  actionButton?.focus({ preventScroll: true });
}

function renderInstalledSuccess() {
  const gate = document.getElementById(GATE_ID);
  if (!gate) return;
  gate.innerHTML = `
    <section class="pwa-gate-card pwa-gate-success" role="dialog" aria-modal="true">
      <div class="pwa-gate-success-icon"><i class="fa-solid fa-check"></i></div>
      <span class="pwa-gate-eyebrow">Instalação concluída</span>
      <h1>Agora abra pelo ícone do VETTA</h1>
      <p class="pwa-gate-description">O aplicativo foi instalado, mas esta aba continuará bloqueada. Volte à Tela de Início e toque no novo ícone do VETTA.</p>
    </section>`;
}

function initializeGate() {
  applyDidacticCopy();
  document.getElementById('fuelType')?.addEventListener('change', () => queueMicrotask(applyDidacticCopy));
  document.getElementById('onboardingFuelType')?.addEventListener('change', () => queueMicrotask(applyDidacticCopy));

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
