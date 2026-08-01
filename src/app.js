import { calculatePlan, calculateRecord, summarizeRecords } from './engine/finance.js';
import { monthProjection, weekProjection, personalRanking } from './engine/projections.js';
import { dateKey, weekdaysForCount } from './engine/calendar.js';
import { normalizeCost } from './engine/costs.js';
import { loadState, saveState, resetState } from './storage/database.js';
import { downloadBackup, parseBackup } from './storage/backup.js';
import { fuelPresets } from './storage/migrations.js';
import { setupInstall, requestInstall } from './pwa/install.js';
import { registerUpdates } from './pwa/updates.js';
import { renderShell } from './views/shell.js';

const root = document.getElementById('app');
let state = loadState();
state.activeView = 'dashboard';

const ui = {
  toast: '',
  toastTimer: null,
  costModal: false,
  installHelp: '',
  costDraft: emptyCost(),
  dayDraft: emptyDay()
};

function emptyCost() {
  return { id: '', name: '', kind: 'monthly', category: 'obligation', value: '', dueDay: '', month: '' };
}

function emptyDay() {
  return { id: '', date: dateKey(new Date()), gross: '', km: '', hours: '', fuel: '' };
}

function numberValue(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function comparison() {
  const gasKm = numberValue(state.compare.gasPrice) / Math.max(0.01, numberValue(state.compare.gasEff));
  const gnvKm = numberValue(state.compare.gnvPrice) / Math.max(0.01, numberValue(state.compare.gnvEff));
  return { gasKm, gnvKm, saving: (gasKm - gnvKm) * 100 };
}

function model() {
  const plan = calculatePlan(state);
  const month = monthProjection(state);
  const week = weekProjection(state);
  const history = summarizeRecords(state.records, state);
  const preview = calculateRecord(ui.dayDraft, state, new Date(`${ui.dayDraft.date || dateKey(new Date())}T12:00:00`));
  return { state, ui, plan, month, week, summary: history, preview, draft: ui.dayDraft, comparison: comparison(), ranking: personalRanking(state.records, state) };
}

function render() {
  root.innerHTML = renderShell(model());
}

function persist(message = '') {
  state = saveState(state);
  state.activeView ||= 'dashboard';
  render();
  if (message) toast(message);
}

function toast(message) {
  ui.toast = message;
  render();
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    ui.toast = '';
    render();
  }, 2600);
}

function setPath(path, value) {
  const [group, key] = path.split('.');
  if (key) state[group] = { ...state[group], [key]: value };
  else state[group] = value;
}

function readCostForm() {
  const byId = id => document.getElementById(id);
  return {
    ...ui.costDraft,
    name: byId('costName')?.value.trim() || '',
    kind: byId('costKind')?.value || 'monthly',
    category: byId('costCategory')?.value || 'obligation',
    value: numberValue(byId('costValue')?.value),
    dueDay: byId('costDueDay')?.value || null,
    month: byId('costMonth')?.value || null,
    active: ui.costDraft.active !== false
  };
}

function saveCost() {
  const cost = normalizeCost(readCostForm());
  if (!cost.name || cost.value <= 0) {
    toast('Informe um nome e um valor maior que zero.');
    return;
  }
  const index = state.costs.findIndex(item => item.id === cost.id);
  if (index >= 0) state.costs[index] = cost;
  else state.costs.push(cost);
  ui.costModal = false;
  ui.costDraft = emptyCost();
  persist('Custo salvo. A meta foi recalculada.');
}

function saveDay() {
  const draft = { ...ui.dayDraft, gross: numberValue(ui.dayDraft.gross), km: numberValue(ui.dayDraft.km), hours: numberValue(ui.dayDraft.hours), fuel: numberValue(ui.dayDraft.fuel) };
  if (!draft.date || draft.gross <= 0 || draft.km <= 0) {
    toast('Informe data, faturamento e quilômetros.');
    return;
  }
  const record = { ...draft, id: draft.id || `day-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  const index = state.records.findIndex(item => item.id === record.id);
  if (index >= 0) state.records[index] = record;
  else state.records.push(record);
  state.records.sort((a, b) => a.date.localeCompare(b.date));
  ui.dayDraft = emptyDay();
  persist(index >= 0 ? 'Dia atualizado. O progresso foi recalculado.' : 'Dia salvo. O progresso foi atualizado.');
}

async function install() {
  const result = await requestInstall();
  if (result.status === 'ios-help') ui.installHelp = 'ios';
  if (result.status === 'browser-help') ui.installHelp = 'browser';
  render();
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'navigate') {
    state.activeView = target.dataset.view;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (action === 'workdays') {
    state.workWeekdays = weekdaysForCount(Number(target.dataset.days));
    persist();
  }
  if (action === 'weekday') {
    const day = Number(target.dataset.day);
    state.workWeekdays = state.workWeekdays.includes(day) ? state.workWeekdays.filter(item => item !== day) : [...state.workWeekdays, day].sort();
    if (!state.workWeekdays.length) state.workWeekdays = [day];
    persist();
  }
  if (action === 'open-cost') {
    ui.costDraft = emptyCost();
    ui.costModal = true;
    render();
  }
  if (action === 'edit-cost') {
    ui.costDraft = { ...state.costs.find(item => item.id === target.dataset.id) };
    ui.costModal = true;
    render();
  }
  if (action === 'close-cost' || (action === 'modal-backdrop' && event.target === target)) {
    ui.costModal = false;
    render();
  }
  if (action === 'save-cost') saveCost();
  if (action === 'toggle-cost') {
    const cost = state.costs.find(item => item.id === target.dataset.id);
    if (cost) cost.active = cost.active === false;
    persist('Custo atualizado.');
  }
  if (action === 'delete-cost' && confirm('Excluir este custo?')) {
    state.costs = state.costs.filter(item => item.id !== target.dataset.id);
    persist('Custo excluído.');
  }
  if (action === 'save-day') saveDay();
  if (action === 'clear-day') {
    ui.dayDraft = emptyDay();
    render();
  }
  if (action === 'edit-day') {
    const record = state.records.find(item => item.id === target.dataset.id);
    if (record) {
      ui.dayDraft = { ...record };
      state.activeView = 'day';
      render();
    }
  }
  if (action === 'delete-day' && confirm('Excluir este registro?')) {
    state.records = state.records.filter(item => item.id !== target.dataset.id);
    persist('Registro excluído.');
  }
  if (action === 'apply-fuel') {
    const type = target.dataset.fuel;
    const preset = fuelPresets[type];
    state.fuel = { type, ...preset, price: type === 'gasoline' ? state.compare.gasPrice : state.compare.gnvPrice, efficiency: type === 'gasoline' ? state.compare.gasEff : state.compare.gnvEff };
    persist(`${preset.label} agora é o combustível das metas.`);
  }
  if (action === 'export') downloadBackup(state);
  if (action === 'reset' && confirm('Apagar todos os dados locais do VETTA?')) {
    state = resetState();
    state.activeView = 'dashboard';
    ui.dayDraft = emptyDay();
    persist('Dados locais apagados.');
  }
  if (action === 'install') install();
  if (action === 'close-install') {
    ui.installHelp = '';
    render();
  }
});

document.addEventListener('input', event => {
  const element = event.target;
  if (['recordDate', 'recordGross', 'recordKm', 'recordHours', 'recordFuel'].includes(element.id)) {
    const key = element.id.replace('record', '').toLowerCase();
    ui.dayDraft[key] = element.value;
    render();
    document.getElementById(element.id)?.focus();
  }
  if (ui.costModal && ['costName', 'costValue', 'costDueDay', 'costMonth'].includes(element.id)) {
    const map = { costName: 'name', costValue: 'value', costDueDay: 'dueDay', costMonth: 'month' };
    ui.costDraft[map[element.id]] = element.value;
  }
  const modelPath = element.dataset.model;
  if (modelPath && element.type !== 'range') {
    setPath(modelPath, element.type === 'number' ? numberValue(element.value) : element.value);
    persist();
  }
});

document.addEventListener('change', event => {
  const element = event.target;
  if (element.id === 'costKind') {
    ui.costDraft.kind = element.value;
    render();
  }
  if (element.id === 'costCategory') ui.costDraft.category = element.value;
  if (element.dataset.model) {
    let value = element.value;
    if (element.type === 'range' || element.type === 'number') value = numberValue(value);
    if (element.dataset.model === 'fuel.type') {
      const preset = fuelPresets[value] || fuelPresets.custom;
      state.fuel = { type: value, ...preset };
    } else setPath(element.dataset.model, value);
    persist();
  }
  if (element.id === 'importBackup') {
    const file = element.files?.[0];
    if (!file) return;
    file.text().then(text => {
      state = parseBackup(text);
      state.activeView = 'extras';
      persist('Backup importado com sucesso.');
    }).catch(() => toast('Não foi possível importar este arquivo.'));
  }
});

document.addEventListener('pointerup', event => {
  const slider = event.target.closest('input[type="range"][data-model]');
  if (!slider) return;
  setPath(slider.dataset.model, numberValue(slider.value));
  persist();
});

setupInstall();
registerUpdates({ onError: error => console.warn('Service worker indisponível', error) });
render();
