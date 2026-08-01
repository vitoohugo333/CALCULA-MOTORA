import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const app = readFileSync('app.js', 'utf8');
const index = readFileSync('index.html', 'utf8');
const sw = readFileSync('sw.js', 'utf8');

assert.equal((app.match(/app\.init\(\);/g) || []).length, 1);
assert.equal((app.match(/saveCostButton'\)\.addEventListener\('click'/g) || []).length, 1);
for (const forbidden of ["'./parts/", 'new Function', 'stopImmediatePropagation', "const RELEASE = '3.1.0'", "const RELEASE = '3.2.0'", "const RELEASE = '3.3.0'", 'vettaPatchStyles', 'Custos fixos migrados']) {
  assert.ok(!app.includes(forbidden), `Conteúdo proibido: ${forbidden}`);
}
assert.ok(app.includes('type="button" id="saveCostButton"'));
assert.ok(app.includes('type="button" id="closeCostModal"'));
assert.ok(app.includes("const APP_RELEASE = '3.5.1'"));
assert.ok(index.includes('app.js?v=3.5.1'));
assert.ok(!index.includes('appRoot'));
assert.ok(sw.includes("vetta-v3.5.1"));
console.log('VETTA 3.5.1 production verification passed');
