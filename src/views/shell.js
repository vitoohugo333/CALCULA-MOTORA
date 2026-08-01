import { dashboardView } from './dashboard.js';
import { dayView } from './day.js';
import { historyView } from './history.js';
import { settingsView } from './settings.js';
import { extrasView } from './extras.js';
import { escapeHtml, money } from './format.js';

function costModal(ui) {
  if (!ui.costModal) return '';
  const cost = ui.costDraft;
  return `<div class="modal" data-action="modal-backdrop"><div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="costModalTitle">
    <header class="card-header"><div><span class="label">Planejamento</span><h2 id="costModalTitle">${cost.id ? 'Editar custo' : 'Adicionar custo'}</h2></div><button class="icon-button" data-action="close-cost" aria-label="Fechar">×</button></header>
    <div class="form-grid">
      <label class="full"><span>Nome</span><input id="costName" value="${escapeHtml(cost.name)}" placeholder="Ex.: Seguro do veículo" /></label>
      <label><span>Tipo</span><select id="costKind"><option value="monthly" ${cost.kind === 'monthly' ? 'selected' : ''}>Mensal</option><option value="weekly" ${cost.kind === 'weekly' ? 'selected' : ''}>Semanal</option><option value="per_km" ${cost.kind === 'per_km' ? 'selected' : ''}>Por quilômetro</option><option value="one_time" ${cost.kind === 'one_time' ? 'selected' : ''}>Pontual</option></select></label>
      <label><span>Categoria</span><select id="costCategory"><option value="obligation" ${cost.category === 'obligation' ? 'selected' : ''}>Obrigação</option><option value="reserve" ${cost.category === 'reserve' ? 'selected' : ''}>Reserva</option></select></label>
      <label class="full"><span>Valor</span><input id="costValue" type="number" step="0.01" value="${cost.value || ''}" /></label>
      ${cost.kind === 'monthly' ? `<label class="full"><span>Dia de vencimento (opcional)</span><input id="costDueDay" type="number" min="1" max="31" value="${cost.dueDay || ''}" /></label>` : ''}
      ${cost.kind === 'one_time' ? `<label class="full"><span>Mês</span><input id="costMonth" type="month" value="${cost.month || ''}" /></label>` : ''}
    </div>
    <div class="impact">Impacto aproximado: <strong>${cost.kind === 'per_km' ? `${money(Number(cost.value) || 0)}/km` : money(Number(cost.value) || 0)}</strong></div>
    <button class="primary wide" data-action="save-cost">Salvar e recalcular a meta</button>
  </div></div>`;
}

function installModal(ui) {
  if (!ui.installHelp) return '';
  return `<div class="modal"><div class="modal-sheet"><header class="card-header"><h2>Instalar VETTA</h2><button class="icon-button" data-action="close-install">×</button></header><p class="muted">${ui.installHelp === 'ios' ? 'No Safari, toque em Compartilhar → Adicionar à Tela de Início → Abrir como App da Web.' : 'Abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial.'}</p></div></div>`;
}

export function renderShell(model) {
  const { state, ui } = model;
  return `
    <header class="topbar"><div class="brand"><span>V</span><div><strong>VETTA</strong><small>INTELLIGENCE</small></div></div><button class="install-chip" data-action="install">Instalar</button></header>
    <main class="content">${dashboardView(model)}${dayView(model)}${historyView(model)}${settingsView(model)}${extrasView(model)}</main>
    <nav class="bottom-nav">${[['dashboard','Início','⌂'],['day','Dia','＋'],['history','Histórico','▤'],['settings','Ajustes','⚙'],['extras','Mais','•••']].map(([view,label,icon]) => `<button data-action="navigate" data-view="${view}" class="${state.activeView === view ? 'active' : ''}"><b>${icon}</b><span>${label}</span></button>`).join('')}</nav>
    ${costModal(ui)}${installModal(ui)}${ui.toast ? `<div class="toast">${escapeHtml(ui.toast)}</div>` : ''}
  `;
}
