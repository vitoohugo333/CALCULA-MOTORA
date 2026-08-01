import { money, number } from './format.js';

export function dashboardView({ state, month, week }) {
  const { plan, actual, projectedNet, remaining, progress, completed } = month;
  const status = actual.days === 0
    ? 'Comece registrando seu primeiro dia.'
    : completed
      ? `Meta mensal concluída. Você já acumulou ${money(actual.net)} líquidos.`
      : `Você acumulou ${money(actual.net)} líquidos no mês. Ainda faltam ${money(remaining)} para concluir a meta.`;

  return `
    <section class="view ${state.activeView === 'dashboard' ? '' : 'hidden'}" data-view-panel="dashboard">
      <article class="hero">
        <div class="eyebrow">Meta de faturamento por dia</div>
        <div class="hero-value">${money(plan.grossDaily, 0)}</div>
        <p>${plan.safe ? `Planejamento para ${plan.calendar.workdays} dias de trabalho.` : 'Revise receita por km e custos por km.'}</p>
        <div class="hero-grid"><div><span>Líquido planejado</span><strong>${money(plan.netDaily)}</strong></div><div><span>Rodagem estimada</span><strong>${number(plan.kmDaily, 0)} km</strong></div></div>
      </article>
      <button class="primary action-card" data-action="navigate" data-view="day"><span><small>Fechamento rápido</small><strong>Registrar meu dia</strong></span><b>→</b></button>
      <article class="card">
        <header class="card-header"><div><span class="label">Objetivo mensal líquido</span><h2>${money(state.targetProfit, 0)}</h2></div><strong>${state.extraDaysOff} folga(s)</strong></header>
        <input aria-label="Objetivo mensal líquido" type="range" min="500" max="15000" step="100" value="${state.targetProfit}" data-model="targetProfit" />
        <div class="segmented">${[5, 6, 7].map(days => `<button data-action="workdays" data-days="${days}" class="${state.workWeekdays.length === days ? 'active' : ''}">${days} dias</button>`).join('')}</div>
      </article>
      <article class="card">
        <header class="card-header"><div><span class="label">Situação do mês</span><h3>${actual.days ? (completed ? 'Meta concluída' : 'Meta em andamento') : 'Sem registros'}</h3></div><span class="pill ${completed ? 'positive' : 'neutral'}">${Math.round(progress)}%</span></header>
        <p class="muted">${status}</p><div class="progress"><span style="width:${progress}%"></span></div>
        <div class="metrics three"><div><span>Conquistado</span><strong>${money(actual.net, 0)}</strong></div><div><span>Projeção</span><strong>${money(projectedNet, 0)}</strong></div><div><span>Faltam</span><strong>${plan.calendar.remainingWorkdays} dias</strong></div></div>
      </article>
      <article class="card"><header class="card-header"><div><span class="label">Esta semana</span><h3>${week.actual.days ? 'Resultado semanal' : 'Planejamento semanal'}</h3></div></header><div class="metrics three"><div><span>Meta líquida</span><strong>${money(week.target, 0)}</strong></div><div><span>Realizado</span><strong>${money(week.actual.net, 0)}</strong></div><div><span>Média/km</span><strong>${money(week.actual.revenueKm)}</strong></div></div></article>
      <article class="card"><span class="label">Distribuição da meta</span><div class="stack"><div><span>Faturamento bruto</span><strong>${money(plan.gross)}</strong></div><div><span>Combustível</span><strong>${money(plan.fuelKm * plan.km)}</strong></div><div><span>Custos por km</span><strong>${money(plan.variableKm * plan.km)}</strong></div><div><span>Obrigações e reservas</span><strong>${money(plan.fixed)}</strong></div><div class="net"><span>Objetivo líquido</span><strong>${money(plan.targetNet)}</strong></div></div></article>
    </section>`;
}
