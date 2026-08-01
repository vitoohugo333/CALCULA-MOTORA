import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { monthContext, weekdaysForCount } from '../src/engine/calendar.js';
import { monthlyFixedCosts, normalizeCost, variableCostPerKm } from '../src/engine/costs.js';
import { calculatePlan, calculateRecord, summarizeRecords } from '../src/engine/finance.js';
import { monthProjection, weekProjection, personalRanking } from '../src/engine/projections.js';
import { createDefaultState, normalizeState, RELEASE } from '../src/storage/migrations.js';
import { renderShell } from '../src/views/shell.js';

test('calendário respeita escala e folgas extras', () => {
  assert.deepEqual(weekdaysForCount(5), [1,2,3,4,5]);
  const ref = new Date(2026, 7, 15, 12);
  const full = monthContext([1,2,3,4,5,6], 0, ref);
  const reduced = monthContext([1,2,3,4,5,6], 3, ref);
  assert.equal(full.workdays - reduced.workdays, 3);
});

test('custos mensais e por km são calculados separadamente', () => {
  const costs = [{ kind:'monthly', value:100, active:true },{ kind:'weekly', value:12, active:true },{ kind:'per_km', value:.2, active:true }];
  assert.equal(Math.round(monthlyFixedCosts(costs)), 152);
  assert.equal(variableCostPerKm(costs), .2);
});

test('nomes técnicos antigos nunca chegam à interface', () => {
  assert.equal(normalizeCost({ name:'Custos fixos migrados', kind:'monthly', value:650 }).name, 'Outros custos mensais');
});

test('plano e fechamento diário geram resultados coerentes', () => {
  const state = createDefaultState();
  const plan = calculatePlan(state, new Date(2026,7,1,12));
  const result = calculateRecord({ gross:300, km:100, fuel:0 }, state, new Date(2026,7,1,12));
  assert.ok(plan.gross > plan.targetNet);
  assert.ok(result.cost > 0);
  assert.equal(result.net, result.gross - result.cost);
});

test('dados atuais são preservados e versão é atualizada silenciosamente', () => {
  const state = normalizeState({ release:'3.1.0', records:[{id:'x',date:'2026-08-01',gross:100,km:40}], costs:[{id:'fixed-migrated',name:'Custos fixos migrados',kind:'monthly',category:'obligation',value:650,active:true}], migrationNotice:'legacy' });
  assert.equal(state.release, RELEASE);
  assert.equal(state.records.length, 1);
  assert.equal(state.costs[0].name, 'Outros custos mensais');
  assert.equal('migrationNotice' in state, false);
});

test('cinco telas e modal renderizam sem concatenação dinâmica', () => {
  const state = createDefaultState();
  state.activeView = 'settings';
  state.records = [{ id:'d1', date:'2026-08-01', gross:300, km:100, hours:8, fuel:30 }];
  const plan = calculatePlan(state, new Date(2026,7,1,12));
  const summary = summarizeRecords(state.records, state, new Date(2026,7,1,12));
  const html = renderShell({ state, ui:{costModal:true,installHelp:'',toast:'',costDraft:{id:'',name:'Seguro',kind:'monthly',category:'obligation',value:200,dueDay:10,month:''}}, plan, month:monthProjection(state,new Date(2026,7,1,12)), week:weekProjection(state,new Date(2026,7,1,12)), summary, preview:calculateRecord({date:'2026-08-01',gross:300,km:100},state,new Date(2026,7,1,12)), draft:{id:'',date:'2026-08-01',gross:300,km:100,hours:'',fuel:''}, comparison:{gasKm:.6,gnvKm:.35,saving:25}, ranking:personalRanking(state.records,state) });
  assert.match(html, /Salvar e recalcular a meta/);
  assert.match(html, /data-action="close-cost"/);
  assert.match(html, /VETTA 4\.0\.0/);
  assert.equal(html.includes('.part'), false);
});

test('entry point não contém loader de patches', async () => {
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.equal(app.includes('new Function'), false);
  assert.equal(app.includes('.part'), false);
  assert.equal(app.includes('patch-'), false);
});
