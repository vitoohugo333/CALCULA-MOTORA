import './original-dashboard-view.css';

const READY_ATTRIBUTE = 'data-vetta-original-dashboard';

function findText(root, text) {
  return [...(root?.querySelectorAll('span, label, h1, h2, h3, p') || [])]
    .find(node => node.textContent.trim() === text) || null;
}

function currencyValue(element) {
  const normalized = String(element?.textContent || '')
    .replace(/[^0-9,.-]/g, '')
    .replaceAll('.', '')
    .replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function applyHeader() {
  const header = document.querySelector('body > nav.sticky');
  if (!header) return;
  header.classList.add('vetta-original-header');

  const inner = header.firstElementChild;
  inner?.classList.add('vetta-original-header-inner');
  const brand = inner?.firstElementChild;
  brand?.classList.add('vetta-original-brand');

  const logo = brand?.firstElementChild;
  if (logo) {
    logo.className = 'vetta-original-logo';
    logo.textContent = 'V';
  }

  const brandCopy = brand?.children?.[1];
  brandCopy?.classList.add('vetta-original-brand-copy');
  const title = brandCopy?.querySelector('h1');
  const subtitle = brandCopy?.querySelector('span');
  if (title) title.textContent = 'VETTA';
  if (subtitle) subtitle.textContent = 'DRIVER INTELLIGENCE';

  const install = document.getElementById('installButton');
  install?.classList.add('vetta-original-install');
  const installIcon = install?.querySelector('i');
  if (installIcon) {
    installIcon.className = 'vetta-original-install-icon';
    installIcon.textContent = '⬇';
  }
}

function applyHero(dashboard) {
  const hero = dashboard?.firstElementChild;
  if (!hero) return null;
  hero.classList.add('vetta-original-hero');

  const gross = document.getElementById('kpiGrossDaily');
  const grossBlock = gross?.parentElement?.parentElement;
  const eyebrow = grossBlock?.querySelector('span:not(#kpiGrossDaily)');
  if (eyebrow) eyebrow.textContent = 'Meta diária de faturamento';

  const fuelBadge = document.getElementById('navFuelPrice')?.parentElement;
  if (fuelBadge) fuelBadge.hidden = true;
  const status = document.getElementById('heroStatus');
  if (status) status.hidden = true;

  const net = document.getElementById('kpiNetDaily');
  const netLabel = [...(net?.parentElement?.querySelectorAll('span') || [])]
    .find(node => node !== net);
  if (netLabel) netLabel.textContent = 'Lucro líquido diário';
  net?.parentElement?.classList.add('vetta-original-mini');

  const km = document.getElementById('kpiKmDaily');
  const kmLabel = [...(km?.parentElement?.querySelectorAll('span') || [])]
    .find(node => node !== km);
  if (kmLabel) kmLabel.textContent = 'Rodagem diária';
  km?.parentElement?.classList.add('vetta-original-mini');

  return hero;
}

function applyObjectiveCard() {
  const target = document.getElementById('targetProfitDisplay');
  const card = target?.closest('.card-vetta');
  if (!card) return null;
  card.classList.add('vetta-original-objective');

  let intro = card.querySelector('[data-vetta-objective-intro]');
  if (!intro) {
    intro = document.createElement('div');
    intro.dataset.vettaObjectiveIntro = 'true';
    intro.className = 'vetta-original-card-intro';
    intro.innerHTML = '<h2>Objetivo mensal</h2><p>Ajuste quanto deseja colocar no bolso.</p>';
    card.prepend(intro);
  }

  const row = target.parentElement?.parentElement;
  row?.classList.add('vetta-original-objective-row');
  const label = target.previousElementSibling;
  if (label) label.textContent = 'Lucro líquido';
  const extraDays = row?.children?.[1];
  if (extraDays) extraDays.hidden = true;

  card.querySelector('input[type="range"]')?.classList.add('vetta-original-range');
  target.classList.add('vetta-original-target-value');
  const days = card.querySelector('[data-days]')?.parentElement;
  days?.classList.add('vetta-original-days');
  return card;
}

function buildDistributionBar(card) {
  let visual = card.querySelector('[data-vetta-distribution-visual]');
  if (!visual) {
    visual = document.createElement('div');
    visual.dataset.vettaDistributionVisual = 'true';
    visual.className = 'vetta-original-distribution-visual';
    visual.innerHTML = `
      <div class="vetta-original-distribution-bar" aria-label="Distribuição estimada do faturamento">
        <span data-segment="net"></span><span data-segment="fuel"></span>
        <span data-segment="maintenance"></span><span data-segment="fixed"></span>
      </div>
      <div class="vetta-original-legend">
        <span><i data-dot="net"></i>Líquido</span><span><i data-dot="fuel"></i>Combustível</span>
        <span><i data-dot="maintenance"></i>Manutenção</span><span><i data-dot="fixed"></i>Fixos</span>
      </div>`;
    const content = card.children[1] || null;
    content?.prepend(visual);
  }
  return visual;
}

function updateDistributionBar(card) {
  const visual = buildDistributionBar(card);
  const values = {
    net: currencyValue(document.getElementById('dreNet')),
    fuel: currencyValue(document.getElementById('dreFuel')),
    maintenance: currencyValue(document.getElementById('dreVariable'))
      + currencyValue(document.getElementById('drePercent')),
    fixed: currencyValue(document.getElementById('dreFixed')),
  };
  const total = Math.max(1, Object.values(values).reduce((sum, value) => sum + Math.max(0, value), 0));
  Object.entries(values).forEach(([key, value]) => {
    const segment = visual.querySelector(`[data-segment="${key}"]`);
    if (segment) segment.style.width = `${Math.max(0, value) / total * 100}%`;
  });
}

function applyDistributionCard() {
  const chart = document.getElementById('revenueChart');
  const card = chart?.closest('.card-vetta');
  if (!card) return null;
  card.classList.add('vetta-original-distribution');

  const header = card.firstElementChild;
  if (header) {
    header.classList.add('vetta-original-distribution-header');
    header.innerHTML = '<div><h2>Distribuição mensal</h2><p>Estimativa de custos para alcançar a meta.</p></div>';
  }
  chart.parentElement?.classList.add('vetta-original-chart-hidden');
  updateDistributionBar(card);

  const observer = new MutationObserver(() => updateDistributionBar(card));
  ['dreNet', 'dreFuel', 'dreVariable', 'drePercent', 'dreFixed'].forEach(id => {
    const element = document.getElementById(id);
    if (element) observer.observe(element, { childList: true, characterData: true, subtree: true });
  });
  return card;
}

function applyNavigation(app) {
  const nav = document.querySelector('nav.fixed.bottom-0');
  if (!nav) return;
  nav.classList.add('vetta-original-nav');
  nav.firstElementChild?.classList.add('vetta-original-nav-inner');

  const dashboard = nav.querySelector('[data-view="dashboard"]');
  const day = nav.querySelector('[data-view="day"]');
  const history = nav.querySelector('[data-view="history"]');
  const settings = nav.querySelector('[data-view="settings"]');
  const more = nav.querySelector('[data-view="more"]');

  [day, history].forEach(button => { if (button) button.hidden = true; });
  [[dashboard, 'Visão geral'], [more, 'Comparar'], [settings, 'Ajustes']].forEach(([button, label]) => {
    if (!button) return;
    button.classList.add('vetta-original-nav-item');
    const text = button.querySelector('span');
    if (text) text.textContent = label;
  });
  dashboard?.style.setProperty('order', '1');
  more?.style.setProperty('order', '2');
  settings?.style.setProperty('order', '3');

  const dashboardView = document.getElementById('view-dashboard');
  const dayAction = dashboardView?.querySelector('button[data-view="day"]');
  dayAction?.classList.add('vetta-original-day-action');

  if (dayAction && !document.getElementById('vettaHistoryAction')) {
    const historyAction = document.createElement('button');
    historyAction.id = 'vettaHistoryAction';
    historyAction.type = 'button';
    historyAction.className = 'vetta-original-history-action';
    historyAction.textContent = 'Ver histórico dos dias';
    historyAction.addEventListener('click', () => app?.showView?.('history'));
    dayAction.after(historyAction);
  }
}

function reorderDashboard(dashboard) {
  if (!dashboard) return;
  const hero = dashboard.firstElementChild;
  const objective = document.getElementById('targetProfitDisplay')?.closest('.card-vetta');
  const distribution = document.getElementById('revenueChart')?.closest('.card-vetta');
  const dayAction = dashboard.querySelector('button[data-view="day"]');
  const month = document.getElementById('monthStatusTitle')?.closest('.card-vetta');
  const week = document.getElementById('weekStatusTitle')?.closest('.card-vetta');
  const insight = document.getElementById('insightTitle')?.closest('.card-vetta');

  [hero, objective, distribution, dayAction, month, week, insight]
    .filter(Boolean)
    .forEach(element => dashboard.appendChild(element));
}

export function applyOriginalDashboardView(app = window.__vettaApp) {
  if (document.documentElement.getAttribute(READY_ATTRIBUTE) === 'ready') return;
  const dashboard = document.getElementById('view-dashboard');
  if (!dashboard) throw new Error('Dashboard do VETTA não encontrado para estabilização visual.');

  applyHeader();
  applyHero(dashboard);
  applyObjectiveCard();
  applyDistributionCard();
  reorderDashboard(dashboard);
  applyNavigation(app);

  dashboard.dataset.vettaVisualBaseline = '889d8d5';
  document.documentElement.setAttribute(READY_ATTRIBUTE, 'ready');
}
