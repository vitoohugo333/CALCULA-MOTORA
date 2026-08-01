import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const app = readFileSync('app.js', 'utf8');
const index = readFileSync('index.html', 'utf8');
const sw = readFileSync('sw.js', 'utf8');
const netlify = readFileSync('netlify.toml', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');

const modularFoundation = [
  'src/platform/manifest.js',
  'src/platform/event-bus.js',
  'src/platform/feature-flags.js',
  'src/platform/module-registry.js',
  'src/platform/diagnostics.js',
  'src/platform/index.js',
  'src/app/platform-runtime.js',
  'src/modules/platform-demo/index.js',
  'tests/platform.test.mjs',
];

for (const file of modularFoundation) {
  assert.ok(existsSync(file), `Arquivo obrigatório ausente: ${file}`);
}

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
assert.ok(netlify.includes('mkdir -p _site'));
assert.ok(!netlify.includes('edge_functions'));
assert.ok(!netlify.includes('access-gate'));
assert.equal(existsSync('netlify/edge-functions/access-gate.js'), false);

assert.ok(packageJson.includes('"check:platform"'));
assert.ok(packageJson.includes('tests/platform.test.mjs'));
assert.ok(!packageJson.includes('access-gate.test.mjs'));

const runtime = readFileSync('src/app/platform-runtime.js', 'utf8');
const registry = readFileSync('src/platform/module-registry.js', 'utf8');
assert.ok(runtime.includes('createVettaPlatform'));
assert.ok(runtime.includes("'platform-demo': false"));
assert.ok(registry.includes('register'));
assert.ok(registry.includes('enable'));
assert.ok(registry.includes('disable'));
assert.ok(registry.includes('remove'));

console.log('VETTA 3.5.1 public, offline and modular production verification passed');
