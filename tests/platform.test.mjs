import test from 'node:test';
import assert from 'node:assert/strict';
import { createVettaPlatform } from '../src/app/platform-runtime.js';
import {
  createEventBus,
  createFeatureFlags,
  createModuleRegistry,
  defineModule,
  defineModuleManifest,
} from '../src/platform/index.js';

const fixedClock = () => new Date('2026-08-01T23:39:00.000Z');

test('manifesto valida identidade, versão e dependências', () => {
  const manifest = defineModuleManifest({
    id: 'daily-records',
    version: '1.0.0',
    status: 'core',
    dataVersion: 1,
    defaultEnabled: true,
    dependencies: [],
  });
  assert.equal(manifest.id, 'daily-records');
  assert.throws(() => defineModuleManifest({ id: 'X', version: '1', status: 'core' }), /ID de módulo inválido/);
  assert.throws(() => defineModuleManifest({ id: 'self-module', version: '1.0.0', status: 'stable', dependencies: ['self-module'] }), /depender de si mesmo/);
});

test('event bus isola falhas de observadores', async () => {
  const captured = [];
  const events = createEventBus({ onError: entry => captured.push(entry) });
  let delivered = 0;
  events.on('record:created', () => { throw new Error('falha isolada'); });
  events.on('record:created', () => { delivered += 1; });

  const result = await events.emit('record:created', { id: 'record-1' });
  assert.equal(result.delivered, 2);
  assert.equal(result.failures.length, 1);
  assert.equal(delivered, 1);
  assert.equal(captured.length, 1);
});

test('módulo experimental pode ser ativado, desativado e removido sem alterar o núcleo', async () => {
  const platform = createVettaPlatform({ appVersion: '3.5.1', clock: fixedClock });
  assert.equal(platform.modules.get('platform-demo').status, 'registered');
  await assert.rejects(() => platform.modules.enable('platform-demo'), /bloqueado pela flag/);

  const lifecycle = [];
  platform.events.on('demo:started', payload => lifecycle.push(`start:${payload.moduleId}`));
  platform.events.on('demo:stopped', payload => lifecycle.push(`stop:${payload.moduleId}`));

  platform.flags.set('platform-demo', true);
  await platform.modules.enable('platform-demo');
  assert.equal(platform.modules.get('platform-demo').status, 'enabled');

  await platform.modules.disable('platform-demo');
  assert.equal(platform.modules.get('platform-demo').status, 'registered');
  assert.deepEqual(lifecycle, ['start:platform-demo', 'stop:platform-demo']);

  assert.equal(platform.modules.remove('platform-demo'), true);
  assert.equal(platform.modules.diagnostics().registered, 0);
});

test('registro respeita dependências e bloqueia remoção insegura', async () => {
  const events = createEventBus();
  const flags = createFeatureFlags({ 'child-module': true });
  const registry = createModuleRegistry({ eventBus: events, featureFlags: flags });
  const sequence = [];

  registry.register(defineModule({
    manifest: { id: 'base-module', version: '1.0.0', status: 'core', defaultEnabled: false },
    setup: () => { sequence.push('base:on'); return () => sequence.push('base:off'); },
  }));
  registry.register(defineModule({
    manifest: {
      id: 'child-module', version: '1.0.0', status: 'experimental', defaultEnabled: false,
      featureFlag: 'child-module', dependencies: ['base-module'],
    },
    setup: () => { sequence.push('child:on'); return () => sequence.push('child:off'); },
  }));

  await registry.enable('child-module');
  assert.deepEqual(sequence, ['base:on', 'child:on']);
  assert.throws(() => registry.remove('base-module'), /Desative/);
  await assert.rejects(() => registry.disable('base-module'), /módulos ativos dependem dele/);
  await registry.disable('base-module', { cascade: true });
  assert.deepEqual(sequence, ['base:on', 'child:on', 'child:off', 'base:off']);
  assert.throws(() => registry.remove('base-module'), /módulos registrados dependem dele/);
});

test('diagnóstico é serializável e não contém estado mutável interno', () => {
  const platform = createVettaPlatform({ appVersion: '3.5.1', clock: fixedClock });
  const diagnostic = platform.diagnostics.snapshot();
  assert.equal(diagnostic.generatedAt, '2026-08-01T23:39:00.000Z');
  assert.equal(diagnostic.app.mode, 'local-first');
  assert.equal(diagnostic.modules.registered, 1);
  assert.equal(diagnostic.modules.enabled, 0);
  assert.equal(diagnostic.modules.modules[0].id, 'platform-demo');
  assert.doesNotThrow(() => JSON.parse(platform.diagnostics.serialize()));
});
