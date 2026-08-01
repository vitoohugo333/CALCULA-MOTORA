import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const app = readFileSync('app.js', 'utf8');
const index = readFileSync('index.html', 'utf8');
const sw = readFileSync('sw.js', 'utf8');
const netlify = readFileSync('netlify.toml', 'utf8');
const accessGate = readFileSync('netlify/edge-functions/access-gate.js', 'utf8');

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

assert.ok(sw.includes("vetta-v3.5.1-offline"));
assert.ok(sw.includes('const APP_SHELL = ['));
assert.ok(sw.includes('cache.addAll(APP_SHELL)'));
assert.ok(sw.includes('cache.put(event.request, response.clone())'));
assert.ok(sw.includes('caches.match(event.request, { ignoreSearch: true })'));
assert.ok(sw.includes("caches.match('./index.html')"));

assert.ok(netlify.includes('publish = "_site"'));
assert.ok(netlify.includes('edge_functions = "netlify/edge-functions"'));
assert.ok(netlify.includes('function = "access-gate"'));
assert.ok(accessGate.includes("runtimeEnv('VETTA_ACCESS_CREDENTIALS_JSON')"));
assert.ok(accessGate.includes("runtimeEnv('VETTA_ACCESS_SESSION_SECRET')"));
assert.ok(accessGate.includes("data-vetta-access-gate=\"true\""));
assert.equal(accessGate.match(/\b[a-f0-9]{64}\b/gi), null, 'hash real não pode estar no repositório');

console.log('VETTA 3.5.1 protected and offline production verification passed');
