import { COST_KINDS } from '../engine/costs.js';
import { money, escapeHtml } from './format.js';

const dayLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function settingsView({ state, plan }) {
  return `
    <section class="view ${state.activeView === 'settings' ? '' : 'hidden'}" data-view-panel="settings">
      <article class="section-title dark"><h2>Ajustes</h2><p>Sua operação, seus custos e suas regras.</p></article>
      <article class="card">
        <span class="label">Dias em que pretende trabalhar</span>
        <div class="weekdays">${dayLabels.map((label, day) => `<button data-action="weekday" data-day="${day}" class="${state.workWeekdays.includes(day) ? 'active' : ''}">${label}</button>`).join('')}</div>
        <label class="field"><span>Folgas extras neste mês</span><input type="number" min="0" max="20" value="${state.extraDaysOff}" data-model="extraDaysOff" /></label>
        <p class="muted">Planejamento atual: ${plan.calendar.workdays} dias de trabalho.</p>
      </article>
      <article class="card form-grid">
        <div class="full card-header"><div><span class="label">Combustível das metas</span><p class="muted">${money(plan.fuelKm)}/km</p></div></div>
        <label class="full"><span>Tipo</span><select data-model="fuel.type"><option value="gnv" ${state.fuel.type === 'gnv' ? 'selected' : ''}>GNV</option><option value="gasoline" ${state.fuel.type === 'gasoline' ? 'selected' : ''}>Gasolina</option><option value="ethanol" ${state.fuel.type === 'ethanol' ? 'selected' : ''}>Etanol</option><option value="diesel" ${state.fuel.type === 'diesel' ? 'selected' : ''}>Diesel</option><option value="custom" ${state.fuel.type === 'custom' ? 'selected' : ''}>Personalizado</option></select></label>
        ${state.fuel.type === 'custom' ? `<label class="full"><span>Nome</span><input value="${escapeHtml(state.fuel.label)}" data-model="fuel.label" /></label>` : ''}
        <label><span>Preço por ${state.fuel.unit}</span><input type="number" step="0.01" value="${state.fuel.price}" data-model="fuel.price" /></label>
        <label><span>Rendimento km/${state.fuel.unit}</span><input type="number" step="0.1" value="${state.fuel.efficiency}" data-model="fuel.efficiency" /></label>
        <label class="full"><span>Receita média por km</span><input type="number" step="0.01" value="${state.revenueKm}" data-model="revenueKm" /></label>
      </article>
      <article class="card">
        <header class="card-header"><div><span class="label">Custos personalizados</span><p class="muted">Obrigações e reservas que entram na meta.</p></div><button class="small primary" data-action="open-cost">Adicionar</button></header>
        <div class="list compact">${state.costs.map(cost => `<article class="row"><div><strong>${escapeHtml(cost.name)}</strong><span>${COST_KINDS[cost.kind]} · ${cost.category === 'reserve' ? 'Reserva' : 'Obrigação'}</span></div><div class="row-actions"><strong>${cost.kind === 'per_km' ? `${money(cost.value)}/km` : money(cost.value)}</strong><button data-action="toggle-cost" data-id="${cost.id}">${cost.active === false ? 'Ativar' : 'Pausar'}</button><button data-action="edit-cost" data-id="${cost.id}">Editar</button><button data-action="delete-cost" data-id="${cost.id}">Excluir</button></div></article>`).join('')}</div>
      </article>
    </section>`;
}
