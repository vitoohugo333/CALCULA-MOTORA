import { money } from './format.js';

export function dayView({ state, plan, preview, draft }) {
  return `
    <section class="view ${state.activeView === 'day' ? '' : 'hidden'}" data-view-panel="day">
      <article class="section-title dark"><span class="eyebrow">Fechamento diário</span><h2>Como foi seu dia?</h2><p>Informe faturamento e quilômetros. O restante é calculado automaticamente.</p></article>
      <article class="card form-grid">
        <label class="full"><span>Data</span><input id="recordDate" type="date" value="${draft.date}" /></label>
        <label><span>Faturamento</span><input id="recordGross" type="number" inputmode="decimal" step="0.01" value="${draft.gross}" placeholder="0,00" /></label>
        <label><span>Quilômetros</span><input id="recordKm" type="number" inputmode="decimal" step="0.1" value="${draft.km}" placeholder="0" /></label>
        <label><span>Horas online</span><input id="recordHours" type="number" inputmode="decimal" step="0.1" value="${draft.hours}" placeholder="Opcional" /></label>
        <label><span>Combustível gasto</span><input id="recordFuel" type="number" inputmode="decimal" step="0.01" value="${draft.fuel}" placeholder="Opcional" /></label>
      </article>
      <article class="card"><span class="label">Prévia do fechamento</span><div class="metrics two"><div><span>Custo estimado</span><strong>${money(preview.cost)}</strong></div><div><span>Líquido do dia</span><strong class="success">${money(preview.net)}</strong></div><div><span>Receita/km</span><strong>${money(preview.revenueKm)}</strong></div><div><span>Comparação com meta</span><strong>${money(preview.net - plan.netDaily)}</strong></div></div></article>
      <button class="primary wide" data-action="save-day">${draft.id ? 'Atualizar dia' : 'Fechar e salvar o dia'}</button>
      <button class="text-button wide" data-action="clear-day">Limpar formulário</button>
    </section>`;
}
