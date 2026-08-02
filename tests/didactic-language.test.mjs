import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCT_GLOSSARY,
  buildFuelFieldCopy,
  buildOnboardingCopy,
  containsTechnicalJargon,
  readableFuelUnit,
  validationMessage,
} from '../src/ui/didactic-language-core.js';

test('traduz unidades de combustível para linguagem natural', () => {
  assert.equal(readableFuelUnit('L'), 'litro');
  assert.equal(readableFuelUnit('m³', 'GNV'), 'm³ de GNV');
  assert.equal(readableFuelUnit('un.'), 'unidade de combustível');
});

test('gera labels, unidades e exemplos para combustível', () => {
  const gasoline = buildFuelFieldCopy({ unit: 'L', label: 'Gasolina' });
  assert.equal(gasoline.priceLabel, 'Quanto custa 1 litro?');
  assert.match(gasoline.efficiencyLabel, /Quantos quilômetros/);
  assert.match(gasoline.efficiencyHelp, /10 km/);
  assert.match(gasoline.revenueHelp, /R\$ 240/);

  const gnv = buildFuelFieldCopy({ unit: 'm³', label: 'GNV' });
  assert.match(gnv.priceLabel, /m³ de GNV/);
  assert.match(gnv.efficiencyLabel, /m³ de GNV/);
});

test('onboarding apresenta perguntas completas e ajuda contextual', () => {
  const copy = buildOnboardingCopy({ fuelType: 'gnv' });
  assert.equal(copy.targetLabel, 'Quanto você quer que sobre por mês?');
  assert.match(copy.targetHelp, /depois de pagar os custos/);
  assert.match(copy.priceLabel, /m³ de GNV/);
  assert.match(copy.fixedHelp, /seguro/);
});

test('mensagens de validação apontam o campo que precisa ser corrigido', () => {
  assert.equal(validationMessage('recordGross'), 'Informe quanto você recebeu no dia.');
  assert.equal(validationMessage('recordKm'), 'Informe quantos quilômetros você rodou.');
  assert.match(validationMessage('onboardingFuelPrice', { unit: 'm³', label: 'GNV' }), /m³ de GNV/);
  assert.match(validationMessage('costName'), /nome/);
});

test('glossário cobre conceitos financeiros sem depender do termo técnico', () => {
  assert.ok(PRODUCT_GLOSSARY.length >= 8);
  const text = PRODUCT_GLOSSARY.map(item => `${item.term} ${item.meaning}`).join(' ');
  assert.match(text, /depois de pagar os custos/);
  assert.match(text, /quilômetros rodados/);
  assert.equal(containsTechnicalJargon(text), false);
});

test('detector identifica os termos que a fase deve remover da interface', () => {
  assert.equal(containsTechnicalJargon('Rendimento do veículo'), true);
  assert.equal(containsTechnicalJargon('Receita/km'), true);
  assert.equal(containsTechnicalJargon('Meta líquida'), true);
  assert.equal(containsTechnicalJargon('Projeção mensal'), true);
  assert.equal(containsTechnicalJargon('Quanto você quer que sobre'), false);
});
