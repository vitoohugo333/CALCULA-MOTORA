const DASHBOARD_COPY = new Map([
  ['Quanto sobrou ao longo do tempo', 'Evolução do líquido'],
  ['Quanto você quer que sobre no mês', 'Objetivo mensal líquido'],
  ['Quanto deve sobrar por dia', 'Líquido planejado'],
  ['Quanto já sobrou', 'Líquido gerado'],
  ['Estimativa para o fim do mês', 'Projeção'],
  ['Quanto deve sobrar', 'Meta líquida'],
  ['Recebido por km', 'Média/km'],
  ['Quanto recebeu por km', 'Receita/km'],
  ['Gastos estimados', 'Custo estimado'],
]);

export function restoreDashboardVisualContract(root = document) {
  const dashboard = root.getElementById?.('view-dashboard')
    || root.querySelector?.('#view-dashboard');
  if (!dashboard) return 0;

  let restored = 0;
  dashboard.querySelectorAll('span').forEach(node => {
    const original = DASHBOARD_COPY.get(node.textContent.trim());
    if (!original) return;
    node.textContent = original;
    restored += 1;
  });

  dashboard.dataset.vettaVisualContract = 'preserved';
  return restored;
}
