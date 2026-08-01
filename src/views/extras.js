import { money } from './format.js';

export function extrasView({ state, comparison, ranking, month }) {
  return `
    <section class="view ${state.activeView === 'extras' ? '' : 'hidden'}" data-view-panel="extras">
      <article class="section-title"><h2>Mais</h2><p>Comparação, fechamento e segurança dos seus dados.</p></article>
      <article class="card form-grid">
        <div class="full"><span class="label">Comparar combustíveis</span></div>
        <label><span>Gasolina — preço</span><input type="number" step="0.01" value="${state.compare.gasPrice}" data-model="compare.gasPrice" /></label>
        <label><span>Gasolina — km/L</span><input type="number" step="0.1" value="${state.compare.gasEff}" data-model="compare.gasEff" /></label>
        <label><span>GNV — preço</span><input type="number" step="0.01" value="${state.compare.gnvPrice}" data-model="compare.gnvPrice" /></label>
        <label><span>GNV — km/m³</span><input type="number" step="0.1" value="${state.compare.gnvEff}" data-model="compare.gnvEff" /></label>
        <div class="full comparison"><div><span>Gasolina</span><strong>${money(comparison.gasKm)}/km</strong></div><div><span>GNV</span><strong>${money(comparison.gnvKm)}/km</strong></div><p>${comparison.saving > 0 ? `GNV economiza ${money(comparison.saving)} a cada 100 km.` : `Gasolina economiza ${money(Math.abs(comparison.saving))} a cada 100 km.`}</p></div>
        <button class="secondary" data-action="apply-fuel" data-fuel="gasoline">Usar gasolina</button><button class="secondary" data-action="apply-fuel" data-fuel="gnv">Usar GNV</button>
      </article>
      <article class="card"><span class="label">Fechamento mensal</span><div class="metrics two"><div><span>Faturamento</span><strong>${money(month.actual.gross)}</strong></div><div><span>Custos</span><strong>${money(month.actual.cost)}</strong></div><div><span>Líquido</span><strong class="success">${money(month.actual.net)}</strong></div><div><span>Meta</span><strong>${money(month.plan.targetNet)}</strong></div></div></article>
      <article class="card"><span class="label">Ranking pessoal</span><div class="list compact">${ranking.length ? ranking.slice(0, 5).map(item => `<div class="ranking"><b>#${item.rank}</b><span>${new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR')}</span><strong>${money(item.result.net)}</strong></div>`).join('') : '<div class="empty">Registre dias para montar seu ranking.</div>'}</div></article>
      <article class="card actions"><button class="secondary" data-action="export">Exportar backup</button><label class="secondary file-label">Importar backup<input id="importBackup" type="file" accept="application/json" /></label><button class="danger" data-action="reset">Apagar dados locais</button></article>
      <article class="card app-card"><div><span class="label">Aplicativo</span><h3>VETTA ${state.release}</h3><p class="muted">Dados salvos somente neste aparelho.</p></div><button class="primary small" data-action="install">Instalar</button></article>
    </section>`;
}
