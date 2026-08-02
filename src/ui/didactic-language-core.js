export const PRODUCT_GLOSSARY = Object.freeze([
  Object.freeze({ term: 'Quanto você quer que sobre', meaning: 'Valor que você deseja ter depois de pagar os custos do trabalho.' }),
  Object.freeze({ term: 'Total recebido antes dos custos', meaning: 'Todo o dinheiro recebido antes de descontar combustível, contas e reservas.' }),
  Object.freeze({ term: 'Quanto sobrou', meaning: 'Valor restante depois de descontar os custos considerados pelo VETTA.' }),
  Object.freeze({ term: 'Estimativa para o fim do período', meaning: 'Previsão feita com os dias já registrados. O valor pode mudar conforme novos dias forem incluídos.' }),
  Object.freeze({ term: 'Contas do trabalho', meaning: 'Gastos que existem mesmo quando você roda pouco, como seguro, parcela ou aluguel.' }),
  Object.freeze({ term: 'Gastos que aumentam quando você roda', meaning: 'Valores calculados por quilômetro, como manutenção, pneus e combustível.' }),
  Object.freeze({ term: 'Dinheiro reservado', meaning: 'Valor separado para manutenção, impostos ou outros gastos futuros.' }),
  Object.freeze({ term: 'Quanto você recebe por km', meaning: 'Média calculada dividindo o total recebido pelos quilômetros rodados.' }),
]);

// O dashboard é uma superfície visual estabilizada. Esta lista deve conter
// apenas elementos de jornadas explicativas, nunca KPIs ou cartões da visão geral.
export const STATIC_TEXT_REPLACEMENTS = Object.freeze([
  Object.freeze({ selector: '#recordGross', relation: 'label', text: 'Quanto você recebeu no dia?' }),
  Object.freeze({ selector: '#recordKm', relation: 'label', text: 'Quantos quilômetros você rodou?' }),
  Object.freeze({ selector: '#recordHours', relation: 'label', text: 'Quantas horas ficou online? (opcional)' }),
  Object.freeze({ selector: '#recordFuel', relation: 'label', text: 'Quanto gastou com combustível? (opcional)' }),
  Object.freeze({ selector: '#previewCost', relation: 'label', text: 'Gastos estimados' }),
  Object.freeze({ selector: '#previewNet', relation: 'label', text: 'Quanto sobrou no dia' }),
  Object.freeze({ selector: '#previewRevenueKm', relation: 'label', text: 'Quanto recebeu por km' }),
  Object.freeze({ selector: '#previewDelta', relation: 'label', text: 'Diferença para a meta' }),
  Object.freeze({ selector: '#historyRevenueKm', relation: 'label', text: 'Média recebida por km' }),
  Object.freeze({ selector: '#historyNet', relation: 'label', text: 'Total que sobrou' }),
]);

export function readableFuelUnit(unit, label = '') {
  if (unit === 'L') return 'litro';
  if (unit === 'm³') return label ? `m³ de ${label}` : 'm³ de GNV';
  return unit && unit !== 'un.' ? unit : 'unidade de combustível';
}

export function buildFuelFieldCopy({ unit = 'L', label = '' } = {}) {
  const readableUnit = readableFuelUnit(unit, label);
  return Object.freeze({
    priceLabel: `Quanto custa 1 ${readableUnit}?`,
    priceHelp: `Informe o preço atual de 1 ${readableUnit}.`,
    efficiencyLabel: `Quantos quilômetros o veículo faz com 1 ${readableUnit}?`,
    efficiencyHelp: `Exemplo: se percorre aproximadamente 10 km usando 1 ${readableUnit}, informe 10.`,
    revenueLabel: 'Quanto você recebe por km rodado?',
    revenueHelp: 'Exemplo: R$ 240 recebidos ÷ 120 km rodados = R$ 2,00 por km.',
  });
}

export function buildOnboardingCopy({ fuelType = 'gasoline' } = {}) {
  const unit = fuelType === 'gnv' ? 'm³' : 'L';
  const label = fuelType === 'gnv' ? 'GNV' : '';
  const fuel = buildFuelFieldCopy({ unit, label });
  return Object.freeze({
    targetLabel: 'Quanto você quer que sobre por mês?',
    targetHelp: 'Pense no valor que deseja colocar no bolso depois de pagar os custos do trabalho.',
    daysLabel: 'Quantos dias pretende trabalhar por semana?',
    fuelIntro: 'Esses dois dados ajudam o VETTA a calcular quanto cada quilômetro custa.',
    priceLabel: fuel.priceLabel,
    priceHelp: fuel.priceHelp,
    efficiencyLabel: fuel.efficiencyLabel,
    efficiencyHelp: fuel.efficiencyHelp,
    revenueLabel: 'Quanto você costuma receber por km rodado?',
    revenueHelp: 'Ainda não sabe? Use uma estimativa inicial. Você poderá corrigir depois.',
    fixedLabel: 'Quanto paga por mês em contas do trabalho?',
    fixedHelp: 'Exemplos: parcela ou aluguel do veículo, seguro, internet e outras contas fixas.',
  });
}

export function validationMessage(code, context = {}) {
  const unit = readableFuelUnit(context.unit || 'L', context.label || '');
  return ({
    recordDate: 'Escolha a data do dia que deseja salvar.',
    recordGross: 'Informe quanto você recebeu no dia.',
    recordKm: 'Informe quantos quilômetros você rodou.',
    costName: 'Dê um nome para esse gasto ou dinheiro reservado.',
    costValue: 'Informe um valor maior que zero.',
    costMonth: 'Escolha o mês em que esse gasto aconteceu.',
    onboardingTarget: 'Informe quanto você quer que sobre por mês.',
    onboardingFuelPrice: `Informe quanto custa 1 ${unit}.`,
    onboardingFuelEfficiency: `Informe quantos quilômetros o veículo faz com 1 ${unit}.`,
  })[code] || 'Confira os dados informados e tente novamente.';
}

export function containsTechnicalJargon(text) {
  const normalized = String(text || '').toLocaleLowerCase('pt-BR');
  return ['rendimento', 'receita/km', 'meta líquida', 'projeção'].some(term => normalized.includes(term));
}
