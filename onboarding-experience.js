import {
  ONBOARDING_PROGRESS_KEY,
  mergeOnboardingResult,
  normalizeOnboardingProgress,
  onboardingCompletionSummary,
  progressFromState,
  validateOnboardingStep,
} from './src/onboarding/onboarding-core.js';

const PATCH_FLAG = Symbol.for('vetta.onboarding-experience.patched');
let saveTimer = null;

function app() {
  return window.__vettaApp;
}

function readProgress() {
  try {
    const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
    return raw ? normalizeOnboardingProgress(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn('Rascunho do onboarding ignorado.', error);
    return null;
  }
}

function writeProgress(progress) {
  const normalized = normalizeOnboardingProgress({
    ...progress,
    updatedAt: new Date().toISOString(),
  });
  localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(normalized));
  updateResumeCard(normalized);
  return normalized;
}

function clearProgress() {
  localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
  document.getElementById('onboardingResumeCard')?.remove();
}

function numberValue(id) {
  const value = Number(document.getElementById(id)?.value || 0);
  return Number.isFinite(value) ? value : 0;
}

function captureProgress(overrides = {}) {
  const instance = app();
  const existing = readProgress() || progressFromState(instance?.state || {});
  return normalizeOnboardingProgress({
    ...existing,
    step: instance?.onboardingStep || existing.step,
    days: instance?.onboardingDays || existing.days,
    target: numberValue('onboardingTarget'),
    fuelType: document.getElementById('onboardingFuelType')?.value || existing.fuelType,
    fuelPrice: numberValue('onboardingFuelPrice'),
    fuelEfficiency: numberValue('onboardingFuelEff'),
    revenueKm: numberValue('onboardingRevenue'),
    fixedMonthly: numberValue('onboardingFixed'),
    ...overrides,
  });
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeProgress(captureProgress()), 120);
}

function setActiveDays(days) {
  document.querySelectorAll('[data-onboarding-days]').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.onboardingDays) === Number(days));
  });
}

function fillForm(progress) {
  const instance = app();
  if (!instance) return;
  instance.onboardingStep = progress.step;
  instance.onboardingDays = progress.days;
  document.getElementById('onboardingTarget').value = progress.target || '';
  document.getElementById('onboardingFuelType').value = progress.fuelType;
  document.getElementById('onboardingFuelPrice').value = progress.fuelPrice || '';
  document.getElementById('onboardingFuelEff').value = progress.fuelEfficiency || '';
  document.getElementById('onboardingRevenue').value = progress.revenueKm || '';
  document.getElementById('onboardingFixed').value = progress.fixedMonthly || '';
  setActiveDays(progress.days);
}

function ensureOnboardingControls() {
  const modalSheet = document.querySelector('#onboardingModal .onboarding-sheet');
  if (!modalSheet) return;

  const heading = modalSheet.querySelector('.flex.justify-between.items-center');
  if (heading && !document.getElementById('onboardingLater')) {
    const later = document.createElement('button');
    later.id = 'onboardingLater';
    later.type = 'button';
    later.className = 'onboarding-later';
    later.textContent = 'Fazer depois';
    heading.insertAdjacentElement('afterend', later);
    later.addEventListener('click', dismissOnboarding);
  }

  const step3 = document.getElementById('onboardingStep3');
  if (step3 && !document.getElementById('onboardingSkipOptional')) {
    const skip = document.createElement('button');
    skip.id = 'onboardingSkipOptional';
    skip.type = 'button';
    skip.className = 'onboarding-skip-optional';
    skip.textContent = 'Pular estes campos por enquanto';
    step3.appendChild(skip);
    skip.addEventListener('click', () => {
      document.getElementById('onboardingRevenue').value = '';
      document.getElementById('onboardingFixed').value = '';
      completeOnboarding(captureProgress({ revenueKm: 0, fixedMonthly: 0 }));
    });
  }
}

function updateControlCopy(progress) {
  const later = document.getElementById('onboardingLater');
  if (later) later.textContent = progress.mode === 'redo' ? 'Continuar depois' : 'Fazer depois';
  const badge = document.querySelector('#onboardingModal .label-micro');
  if (badge) badge.textContent = progress.mode === 'redo' ? 'Revisar configuração' : 'Configuração inicial';
  const optional = document.getElementById('onboardingSkipOptional');
  if (optional) optional.classList.toggle('hidden', progress.step !== 3);
}

function openOnboarding(rawProgress = null) {
  const instance = app();
  if (!instance) return;
  ensureOnboardingControls();
  const progress = writeProgress(normalizeOnboardingProgress({
    ...(rawProgress || readProgress() || progressFromState(instance.state)),
    dismissed: false,
  }));
  fillForm(progress);
  instance.renderOnboardingStep();
  updateControlCopy(progress);
  document.getElementById('onboardingModal').classList.remove('hidden');
  document.getElementById('onboardingTarget')?.focus({ preventScroll: true });
}

function dismissOnboarding() {
  const progress = writeProgress(captureProgress({ dismissed: true }));
  app()?.closeModal('onboardingModal');
  updateResumeCard(progress);
  app()?.toast('Configuração salva. Você pode continuar quando quiser.');
}

function resumeOnboarding() {
  const progress = readProgress();
  if (!progress) return openOnboarding(progressFromState(app()?.state || {}));
  openOnboarding({ ...progress, dismissed: false });
}

function ensureResumeCard(progress = readProgress()) {
  if (!progress) return;
  const dashboard = document.getElementById('view-dashboard');
  if (!dashboard) return;
  let card = document.getElementById('onboardingResumeCard');
  if (!card) {
    card = document.createElement('section');
    card.id = 'onboardingResumeCard';
    card.className = 'card-vetta onboarding-resume-card';
    const firstCard = dashboard.firstElementChild;
    firstCard?.insertAdjacentElement('afterend', card);
  }
  card.innerHTML = `
    <div>
      <span>${progress.mode === 'redo' ? 'Revisão salva' : 'Configuração incompleta'}</span>
      <strong>${progress.mode === 'redo' ? 'Continue revisando seus dados' : 'Termine de preparar seu VETTA'}</strong>
      <p>Você parou na etapa ${progress.step} de 3. O que já foi preenchido está salvo.</p>
    </div>
    <button id="resumeOnboardingButton" type="button">Continuar configuração</button>`;
  document.getElementById('resumeOnboardingButton')?.addEventListener('click', resumeOnboarding, { once: true });
}

function updateResumeCard(progress) {
  if (!progress) return document.getElementById('onboardingResumeCard')?.remove();
  if (progress.dismissed || progress.mode === 'redo') ensureResumeCard(progress);
  else document.getElementById('onboardingResumeCard')?.remove();
}

function ensureRestartCard() {
  const settings = document.getElementById('view-settings');
  if (!settings || document.getElementById('restartOnboardingCard')) return;
  const card = document.createElement('section');
  card.id = 'restartOnboardingCard';
  card.className = 'card-vetta onboarding-restart-card';
  card.innerHTML = `
    <div>
      <span>Configuração inicial</span>
      <strong>Revisar minhas respostas</strong>
      <p>Refaça as três etapas sem apagar os dias, eventos ou gastos que você já registrou.</p>
    </div>
    <button id="restartOnboardingButton" type="button">Refazer configuração</button>`;
  const glossary = document.getElementById('didacticGlossary');
  if (glossary) glossary.insertAdjacentElement('beforebegin', card);
  else settings.appendChild(card);
  document.getElementById('restartOnboardingButton')?.addEventListener('click', () => {
    const progress = progressFromState(app()?.state || {}, {
      mode: 'redo',
      step: 1,
      dismissed: false,
    });
    openOnboarding(progress);
  });
}

function firstActionMarkup(summary, money) {
  return `
    <div id="onboardingFirstAction" class="onboarding-first-action-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboardingFirstActionTitle">
      <section class="onboarding-first-action-card" tabindex="-1">
        <div class="onboarding-first-action-icon"><i class="fas fa-check"></i></div>
        <span>Configuração concluída</span>
        <h2 id="onboardingFirstActionTitle">${summary.title}</h2>
        <p>Seu objetivo é fazer sobrar <strong>${money(summary.target)}</strong> por mês. Agora registre um dia de trabalho para o VETTA começar a comparar sua meta com a realidade.</p>
        <button id="onboardingFirstActionPrimary" type="button">${summary.primaryAction}</button>
        <button id="onboardingFirstActionSecondary" type="button">${summary.secondaryAction}</button>
      </section>
    </div>`;
}

function showFirstAction(progress) {
  document.getElementById('onboardingFirstAction')?.remove();
  const instance = app();
  const summary = onboardingCompletionSummary(progress);
  document.body.insertAdjacentHTML('beforeend', firstActionMarkup(summary, value => instance.money(value)));
  document.getElementById('onboardingFirstActionPrimary')?.addEventListener('click', () => {
    document.getElementById('onboardingFirstAction')?.remove();
    instance.showView('day');
    document.getElementById('recordGross')?.focus({ preventScroll: true });
  });
  document.getElementById('onboardingFirstActionSecondary')?.addEventListener('click', () => {
    document.getElementById('onboardingFirstAction')?.remove();
    instance.showView('dashboard');
  });
  document.querySelector('#onboardingFirstAction .onboarding-first-action-card')?.focus({ preventScroll: true });
}

function completeOnboarding(rawProgress = captureProgress()) {
  const instance = app();
  const progress = normalizeOnboardingProgress(rawProgress);
  const validation1 = validateOnboardingStep(progress, 1);
  const validation2 = validateOnboardingStep(progress, 2);
  if (!validation1.valid) return instance.toast(validation1.message);
  if (!validation2.valid) return instance.toast(validation2.message);

  instance.state = mergeOnboardingResult(instance.state, progress);
  instance.onboardingStep = 1;
  instance.save();
  clearProgress();
  instance.closeModal('onboardingModal');
  instance.syncInputs();
  instance.render();
  showFirstAction(progress);
}

function patchApp() {
  const instance = app();
  if (!instance || instance[PATCH_FLAG]) return;
  instance[PATCH_FLAG] = true;

  instance.prepareOnboarding = function persistentPrepareOnboarding() {
    const progress = readProgress();
    if (progress?.mode === 'redo') {
      if (progress.dismissed) return updateResumeCard(progress);
      return openOnboarding(progress);
    }
    if (this.state.onboardingComplete) return;
    const initial = progress || progressFromState(this.state, { mode: 'initial' });
    if (initial.dismissed) return updateResumeCard(initial);
    openOnboarding(initial);
  };

  instance.nextOnboarding = function persistentNextOnboarding() {
    const progress = captureProgress();
    const validation = validateOnboardingStep(progress, this.onboardingStep);
    if (!validation.valid) return this.toast(validation.message);
    if (this.onboardingStep < 3) {
      this.onboardingStep += 1;
      const next = writeProgress({ ...progress, step: this.onboardingStep, dismissed: false });
      this.renderOnboardingStep();
      updateControlCopy(next);
      return;
    }
    completeOnboarding(progress);
  };

  instance.previousOnboarding = function persistentPreviousOnboarding() {
    if (this.onboardingStep <= 1) return;
    this.onboardingStep -= 1;
    const progress = writeProgress({ ...captureProgress(), step: this.onboardingStep, dismissed: false });
    this.renderOnboardingStep();
    updateControlCopy(progress);
  };

  const originalRenderOnboardingStep = instance.renderOnboardingStep;
  instance.renderOnboardingStep = function persistentRenderOnboardingStep(...args) {
    const result = originalRenderOnboardingStep.apply(this, args);
    const progress = readProgress() || captureProgress();
    updateControlCopy({ ...progress, step: this.onboardingStep });
    return result;
  };

  const originalRender = instance.render;
  instance.render = function onboardingAwareRender(...args) {
    const result = originalRender.apply(this, args);
    queueMicrotask(() => {
      ensureRestartCard();
      updateResumeCard(readProgress());
    });
    return result;
  };
}

function bindProgressInputs() {
  ['onboardingTarget', 'onboardingFuelPrice', 'onboardingFuelEff', 'onboardingRevenue', 'onboardingFixed']
    .forEach(id => document.getElementById(id)?.addEventListener('input', scheduleSave));
  document.getElementById('onboardingFuelType')?.addEventListener('change', () => queueMicrotask(scheduleSave));
  document.querySelectorAll('[data-onboarding-days]').forEach(button => {
    button.addEventListener('click', () => queueMicrotask(scheduleSave));
  });
}

function reconcileInitialState() {
  const instance = app();
  const progress = readProgress();
  if (progress?.mode === 'redo') {
    if (progress.dismissed) {
      instance.closeModal('onboardingModal');
      updateResumeCard(progress);
    } else {
      openOnboarding(progress);
    }
    return;
  }
  if (instance.state.onboardingComplete) {
    instance.closeModal('onboardingModal');
    updateResumeCard(null);
    return;
  }
  const initial = progress || progressFromState(instance.state, { mode: 'initial' });
  if (initial.dismissed) {
    instance.closeModal('onboardingModal');
    updateResumeCard(initial);
  } else {
    openOnboarding(initial);
  }
}

function initialize() {
  const instance = app();
  if (!instance) return;
  ensureOnboardingControls();
  patchApp();
  bindProgressInputs();
  ensureRestartCard();
  reconcileInitialState();
  document.documentElement.dataset.vettaOnboardingExperience = 'ready';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
