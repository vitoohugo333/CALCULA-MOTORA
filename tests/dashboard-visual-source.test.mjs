import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { STATIC_TEXT_REPLACEMENTS } from '../src/ui/didactic-language-core.js';

const didacticRuntime = await readFile(new URL('../didactic-language.js', import.meta.url), 'utf8');
const viteRuntime = await readFile(new URL('../src/vite/main.js', import.meta.url), 'utf8');

test('dicionário didático não contém seletores do dashboard', () => {
  assert.equal(
    STATIC_TEXT_REPLACEMENTS.some(item => String(item.selector).includes('kpi')
      || String(item.selector).includes('targetProfitDisplay')
      || String(item.selector).includes('projectedNet')
      || String(item.selector).includes('weekTarget')
      || String(item.selector).includes('dre')),
    false,
  );
});

test('runtime didático não percorre os rótulos da visão geral', () => {
  assert.equal(didacticRuntime.includes('#view-dashboard span'), false);
  assert.match(didacticRuntime, /closest\('#view-dashboard'\)/);
});

test('runtime Vite usa a view original sem módulo compensatório', () => {
  assert.match(viteRuntime, /original-dashboard-view\.js/);
  assert.equal(viteRuntime.includes('dashboard-visual-contract.js'), false);
  assert.equal(viteRuntime.includes('restoreDashboardVisualContract'), false);
});
