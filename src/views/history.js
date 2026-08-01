import { money, number } from './format.js';

export function historyView({ state, summary }) {
  return `
    <section class="view ${state.activeView === 'history' ? '' : 'hidden'}" data-view-panel="history">
      <article class="section-title"><h2>Histórico</h2><p>Resultado real, sem confundir faturamento com lucro.</p></article>
      <div class="metrics three cards"><div><span>Dias</span><strong>${summary.days}</strong></div><div><span>Média/km</span><strong>${money(summary.revenueKm)}</strong></div><div><span>Líquido</span><strong class="success">${money(summary.net)}</strong></div></div>
      <article class="card"><span class="label">Leitura do período</span><p class="muted">${summary.days ? `Sua média líquida foi ${money(summary.netPerDay)} por dia em ${number(summary.km, 0)} km registrados.` : 'Registre um dia para começar a leitura do seu histórico.'}</p></article>
      <div class="list">
        ${summary.items.length ? [...summary.items].reverse().map(item => `<article class="row"><div><strong>${new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR')}</strong><span>${money(item.result.gross)} · ${number(item.result.km, 0)} km</span></div><div class="row-actions"><strong class="success">${money(item.result.net)}</strong><button data-action="edit-day" data-id="${item.id}">Editar</button><button data-action="delete-day" data-id="${item.id}">Excluir</button></div></article>`).join('') : '<div class="empty">Nenhum dia registrado.</div>'}
      </div>
    </section>`;
}
