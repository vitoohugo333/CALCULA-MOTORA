import {
  PRODUCT_GLOSSARY,
  STATIC_TEXT_REPLACEMENTS,
  buildFuelFieldCopy,
  buildOnboardingCopy,
  validationMessage,
} from './src/ui/didactic-language-core.js';

const HELP_CLASS = 'vetta-field-help';
const PATCH_FLAG = Symbol.for('vetta.didactic-language.patched');

function directLabel(container) {
  return [...(container?.children || [])].find(child => child.tagName === 'LABEL') || null;
}

function fieldContainer(input) {
  const wrapper = input?.closest('.input-wrapper');
  return wrapper?.parentElement || input?.parentElement || null;
}

function ensureLabel(input, text, { create = false } = {}) {
  if (!input) return null;
  const container = fieldContainer(input);
  if (!container) return null;
  let label = input.id ? container.querySelector(`label[for="${input.id}"]`) : null;
  if (!label && !create) label = directLabel(container);
  if (!label && create) {
    label = document.createElement('label');
    label.className = 'label-micro';
    const anchor = input.closest('.input-wrapper') || input;
    anchor.before(label);
  }
  if (!label) return null;
  if (input.id) label.setAttribute('for', input.id);
  label.textContent = text;
  return label;
}

function ensureHelp(input, text) {
  if (!input) return null;
  const container = fieldContainer(input);
  if (!container) return null;
  const key = input.id || input.dataset.model || 'field';
  let help = container.querySelector(`[data-didactic-help="${key}"]`);
  if (!help) {
    help = document.createElement('p');
    help.dataset.didacticHelp = key;
    help.className = `${HELP_CLASS} text-[11px] text-slate-500 mt-2 leading-relaxed`;
    container.appendChild(help);
  }
  help.textContent = text;
  if (!help.id) help.id = `help-${key}`;
  input.setAttribute('aria-describedby', help.id);
  return help;
}

function setFieldCopy(input, label, help, options = {}) {
  ensureLabel(input, label, options);
  ensureHelp(input, help);
}

function setOptionText(select, value, text) {
  const option = select?.querySelector(`option[value="${value}"]`);
  if (option) option.textContent = text;
}

function relatedNode(element, relation) {
  if (!element) return null;
  if (relation === 'previous') return element.previousElementSibling;
  if (relation === 'label') {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) return ensureLabel(element, '');
    return directLabel(element.parentElement)
      || element.parentElement?.querySelector('.label-micro, span')
      || null;
  }
  return null;
}

function applyStaticText() {
  for (const item of STATIC_TEXT_REPLACEMENTS) {
    const target = relatedNode(document.querySelector(item.selector), item.relation);
    if (target) target.textContent = item.text;
  }

  const replacements = new Map([
    ['Evolução do líquido', 'Quanto sobrou ao longo do tempo'],
    ['Objetivo mensal líquido', 'Quanto você quer que sobre no mês'],
    ['Líquido planejado', 'Quanto deve sobrar por dia'],
    ['Líquido gerado', 'Quanto já sobrou'],
    ['Projeção', 'Estimativa para o fim do mês'],
    ['Meta líquida', 'Quanto deve sobrar'],
    ['Média/km', 'Recebido por km'],
    ['Receita/km', 'Quanto recebeu por km'],
    ['Custo estimado', 'Gastos estimados'],
    ['Líquido do dia', 'Quanto sobrou no dia'],
    ['Objetivo líquido', 'Quanto você quer que sobre'],
    ['Faturamento bruto necessário', 'Total necessário antes dos custos'],
    ['Rodagem mensal estimada', 'Quilômetros estimados no mês'],
    ['Custos por km', 'Gastos que aumentam quando você roda'],
    ['Taxas percentuais', 'Taxas sobre o que você recebe'],
    ['Obrigações e reservas', 'Contas e dinheiro reservado'],
  ]);
  document.querySelectorAll('.label-micro, #view-dashboard span, #view-day span').forEach(node => {
    const replacement = replacements.get(node.textContent.trim());
    if (replacement) node.textContent = replacement;
  });
}

function currentFuelContext() {
  const app = window.__vettaApp;
  return {
    unit: app?.state?.fuel?.unit || document.getElementById('fuelEfficiencyUnit')?.textContent || 'L',
    label: app?.state?.fuel?.label || '',
  };
}

function applySettingsCopy() {
  const fuel = buildFuelFieldCopy(currentFuelContext());
  setFieldCopy(document.getElementById('fuelPrice'), fuel.priceLabel, fuel.priceHelp);
  setFieldCopy(document.getElementById('fuelEfficiency'), fuel.efficiencyLabel, fuel.efficiencyHelp);
  setFieldCopy(document.querySelector('[data-model="revenueKm"]'), fuel.revenueLabel, fuel.revenueHelp);

  const fuelCard = document.getElementById('fuelType')?.closest('.card-vetta');
  const fuelTitle = fuelCard?.querySelector('.label-micro');
  const fuelDescription = fuelTitle?.parentElement?.querySelector('p');
  if (fuelTitle) fuelTitle.textContent = 'Combustível usado nos cálculos';
  if (fuelDescription) fuelDescription.textContent = 'Esses dados definem quanto o combustível custa em cada quilômetro.';

  setFieldCopy(
    document.querySelector('[data-model="extraDaysOff"]'),
    'Quantos dias a mais você não trabalhará neste mês?',
    'Não conte as folgas semanais habituais. Informe apenas férias, compromissos ou outros dias extras.',
  );

  const costCard = document.getElementById('addCostButton')?.closest('.card-vetta');
  const costTitle = costCard?.querySelector('.label-micro');
  const costDescription = costTitle?.parentElement?.querySelector('p');
  if (costTitle) costTitle.textContent = 'Contas e dinheiro reservado';
  if (costDescription) costDescription.textContent = 'Inclua contas fixas, gastos por quilômetro e valores que deseja separar.';

  const categoryLabel = document.getElementById('costCategory')?.parentElement?.querySelector('label');
  const kindLabel = document.getElementById('costKind')?.parentElement?.querySelector('label');
  if (categoryLabel) categoryLabel.textContent = 'Esse valor é uma conta ou dinheiro reservado?';
  if (kindLabel) kindLabel.textContent = 'Como esse valor é calculado?';

  const category = document.getElementById('costCategory');
  setOptionText(category, 'obligation', 'Conta ou gasto');
  setOptionText(category, 'reserve', 'Dinheiro reservado');

  const kind = document.getElementById('costKind');
  setOptionText(kind, 'monthly', 'Todo mês');
  setOptionText(kind, 'weekly', 'Toda semana');
  setOptionText(kind, 'per_km', 'A cada km rodado');
  setOptionText(kind, 'percent', 'Percentual do que você recebe');
  setOptionText(kind, 'one_time', 'Apenas neste mês');
}

function applyDayCopy() {
  setFieldCopy(
    document.getElementById('recordGross'),
    'Quanto você recebeu no dia?',
    'Informe o total recebido em todas as plataformas antes de descontar os gastos.',
  );
  setFieldCopy(
    document.getElementById('recordKm'),
    'Quantos quilômetros você rodou?',
    'Use a quilometragem total do trabalho, incluindo deslocamentos entre corridas.',
  );
  setFieldCopy(
    document.getElementById('recordHours'),
    'Quantas horas ficou online? (opcional)',
    'Esse valor ajuda a acompanhar quanto você recebe por hora.',
  );
  setFieldCopy(
    document.getElementById('recordFuel'),
    'Quanto gastou com combustível? (opcional)',
    'Preencha quando souber o gasto real. Caso deixe vazio, o VETTA fará uma estimativa.',
  );
}

function applyOnboardingCopy() {
  const app = window.__vettaApp;
  const step = app?.onboardingStep || 1;
  const titles = ['Quanto você quer que sobre?', 'Quanto seu combustível custa?', 'Só mais dois dados'];
  const title = document.getElementById('onboardingTitle');
  if (title) title.textContent = titles[step - 1] || titles[0];

  const copy = buildOnboardingCopy({
    fuelType: document.getElementById('onboardingFuelType')?.value || 'gasoline',
  });
  setFieldCopy(document.getElementById('onboardingTarget'), copy.targetLabel, copy.targetHelp, { create: true });
  const daysLabel = document.querySelector('#onboardingStep1 > label:not([for="onboardingTarget"])');
  if (daysLabel) daysLabel.textContent = copy.daysLabel;

  const fuelIntro = document.querySelector('#onboardingStep2 > p');
  if (fuelIntro) fuelIntro.textContent = copy.fuelIntro;
  setFieldCopy(document.getElementById('onboardingFuelPrice'), copy.priceLabel, copy.priceHelp);
  setFieldCopy(document.getElementById('onboardingFuelEff'), copy.efficiencyLabel, copy.efficiencyHelp);
  setFieldCopy(document.getElementById('onboardingRevenue'), copy.revenueLabel, copy.revenueHelp);
  setFieldCopy(document.getElementById('onboardingFixed'), copy.fixedLabel, copy.fixedHelp);

  const finalIntro = document.querySelector('#onboardingStep3 > p');
  if (finalIntro) finalIntro.textContent = 'Use uma estimativa inicial. Você poderá corrigir tudo depois.';
}

function glossaryMarkup() {
  const items = PRODUCT_GLOSSARY
    .map(item => `<div class="didactic-glossary-item"><dt>${item.term}</dt><dd>${item.meaning}</dd></div>`)
    .join('');
  return `
    <details id="didacticGlossary" class="card-vetta didactic-glossary">
      <summary>
        <span><strong>Entenda os valores do VETTA</strong><small>Explicações rápidas dos termos usados no aplicativo</small></span>
        <i class="fas fa-chevron-down" aria-hidden="true"></i>
      </summary>
      <dl>${items}</dl>
    </details>`;
}

function ensureGlossary() {
  const settings = document.getElementById('view-settings');
  if (settings && !document.getElementById('didacticGlossary')) {
    settings.insertAdjacentHTML('beforeend', glossaryMarkup());
  }
}

function applyCostModalCopy() {
  const kind = document.getElementById('costKind')?.value;
  const valueLabel = document.getElementById('costValueLabel');
  if (valueLabel) {
    valueLabel.textContent = kind === 'per_km'
      ? 'Quanto separar a cada km rodado?'
      : kind === 'percent'
        ? 'Qual percentual do que você recebe?'
        : 'Qual é o valor?';
  }
  const monthLabel = document.getElementById('costMonth')?.parentElement?.querySelector('label');
  if (monthLabel) monthLabel.textContent = 'Em qual mês esse gasto aconteceu?';
}

function applyLearningCopy() {
  const container = document.getElementById('learningActions');
  const app = window.__vettaApp;
  if (!container || !app) return;
  container.querySelectorAll('[data-learning]').forEach(button => {
    const paragraph = button.parentElement?.querySelector('p');
    const value = Number(button.dataset.value || 0);
    if (button.dataset.learning === 'revenue') {
      button.textContent = 'USAR ESTA MÉDIA';
      if (paragraph) paragraph.innerHTML = `Com base nos seus dias, você recebeu em média <strong>${app.money(value)}/km</strong>. Hoje o VETTA usa ${app.money(app.state.revenueKm)}/km.`;
    }
    if (button.dataset.learning === 'efficiency') {
      button.textContent = 'USAR ESTE CONSUMO';
      if (paragraph) paragraph.innerHTML = `Com base nos abastecimentos informados, o veículo faz aproximadamente <strong>${value.toFixed(1)} km/${app.state.fuel.unit}</strong>.`;
    }
  });
}

function patchApp() {
  const app = window.__vettaApp;
  if (!app || app[PATCH_FLAG]) return;
  app[PATCH_FLAG] = true;

  const originalToast = app.toast;
  app.toast = function didacticToast(message) {
    const replacements = new Map([
      ['Parâmetro atualizado com seus dados reais.', 'Valor atualizado com seus dados reais.'],
      ['Informe faturamento e quilômetros maiores que zero.', 'Confira quanto recebeu e quantos quilômetros rodou.'],
      ['Informe nome e valor do custo.', 'Confira o nome e o valor informado.'],
      ['Informe um nome claro e um valor maior que zero.', 'Confira o nome e o valor informado.'],
      ['Informe uma meta mensal.', validationMessage('onboardingTarget')],
      ['Informe preço e rendimento.', 'Confira o preço do combustível e quantos quilômetros o veículo faz.'],
    ]);
    return originalToast.call(this, replacements.get(message) || message);
  };

  const originalSaveDay = app.saveDay;
  app.saveDay = function didacticSaveDay() {
    const draft = this.recordDraft();
    if (!draft.date) return this.toast(validationMessage('recordDate'));
    if (draft.gross <= 0) return this.toast(validationMessage('recordGross'));
    if (draft.km <= 0) return this.toast(validationMessage('recordKm'));
    return originalSaveDay.call(this);
  };

  const originalSaveCost = app.saveCost;
  app.saveCost = function didacticSaveCost() {
    const name = this.$('costName').value.trim();
    const value = this.number(this.$('costValue').value);
    const kind = this.$('costKind').value;
    if (!name) return this.toast(validationMessage('costName'));
    if (value <= 0) return this.toast(validationMessage('costValue'));
    if (kind === 'one_time' && !this.$('costMonth').value) return this.toast(validationMessage('costMonth'));
    return originalSaveCost.call(this);
  };

  const originalNextOnboarding = app.nextOnboarding;
  app.nextOnboarding = function didacticNextOnboarding() {
    if (this.onboardingStep === 1 && this.number(this.$('onboardingTarget').value) <= 0) {
      return this.toast(validationMessage('onboardingTarget'));
    }
    if (this.onboardingStep === 2) {
      const context = this.$('onboardingFuelType').value === 'gnv'
        ? { unit: 'm³', label: 'GNV' }
        : { unit: 'L', label: '' };
      if (this.number(this.$('onboardingFuelPrice').value) <= 0) {
        return this.toast(validationMessage('onboardingFuelPrice', context));
      }
      if (this.number(this.$('onboardingFuelEff').value) <= 0) {
        return this.toast(validationMessage('onboardingFuelEfficiency', context));
      }
    }
    return originalNextOnboarding.call(this);
  };

  const originalRender = app.render;
  app.render = function didacticRender(...args) {
    const result = originalRender.apply(this, args);
    queueMicrotask(applyAll);
    return result;
  };

  if (typeof app.syncCostModal === 'function') {
    const originalSyncCostModal = app.syncCostModal;
    app.syncCostModal = function didacticSyncCostModal(...args) {
      const result = originalSyncCostModal.apply(this, args);
      applyCostModalCopy();
      return result;
    };
  }

  if (typeof app.renderOnboardingStep === 'function') {
    const originalRenderOnboardingStep = app.renderOnboardingStep;
    app.renderOnboardingStep = function didacticRenderOnboardingStep(...args) {
      const result = originalRenderOnboardingStep.apply(this, args);
      applyOnboardingCopy();
      return result;
    };
  }

  if (typeof app.renderLearning === 'function') {
    const originalRenderLearning = app.renderLearning;
    app.renderLearning = function didacticRenderLearning(...args) {
      const result = originalRenderLearning.apply(this, args);
      applyLearningCopy();
      return result;
    };
  }
}

function applyAll() {
  applyStaticText();
  applyDayCopy();
  applySettingsCopy();
  applyOnboardingCopy();
  applyCostModalCopy();
  applyLearningCopy();
  ensureGlossary();
  document.documentElement.dataset.vettaDidacticLanguage = 'ready';
}

function initialize() {
  try {
    patchApp();
    applyAll();
    document.getElementById('fuelType')?.addEventListener('change', () => queueMicrotask(applyAll));
    document.getElementById('onboardingFuelType')?.addEventListener('change', () => queueMicrotask(applyOnboardingCopy));
    document.getElementById('costKind')?.addEventListener('change', () => queueMicrotask(applyCostModalCopy));
  } catch (error) {
    document.documentElement.dataset.vettaDidacticLanguage = 'error';
    console.error('Falha ao aplicar linguagem didática do VETTA.', error);
    throw error;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
