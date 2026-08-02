import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INSTALL_PLATFORMS,
  detectInstallPlatform,
  detectIosBrowser,
  installInstructions,
  isStandaloneEnvironment,
  shouldLockApplication,
} from '../src/pwa/install-gate-core.js';

const visibleCopy = copy => [
  copy.eyebrow,
  copy.title,
  copy.description,
  copy.outcome,
  copy.browserHint,
  ...copy.benefits.map(item => item.label),
  ...copy.steps,
  copy.actionLabel,
  copy.important,
].filter(Boolean).join(' ');

test('detecta execução instalada por display-mode ou navigator.standalone', () => {
  assert.equal(isStandaloneEnvironment({ matchMedia: () => ({ matches: true }), navigatorLike: {} }), true);
  assert.equal(isStandaloneEnvironment({ matchMedia: () => ({ matches: false }), navigatorLike: { standalone: true } }), true);
  assert.equal(isStandaloneEnvironment({ matchMedia: () => ({ matches: false }), navigatorLike: {} }), false);
});

test('classifica iPhone, Android e desktop', () => {
  assert.equal(detectInstallPlatform({ userAgent: 'Mozilla/5.0 (iPhone)', platform: 'iPhone' }), INSTALL_PLATFORMS.IOS);
  assert.equal(detectInstallPlatform({ userAgent: 'Mozilla/5.0 CriOS/151.0 Mobile/15E148 Safari/604.1' }), INSTALL_PLATFORMS.IOS);
  assert.equal(detectInstallPlatform({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' }), INSTALL_PLATFORMS.IOS);
  assert.equal(detectInstallPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 15)' }), INSTALL_PLATFORMS.ANDROID);
  assert.equal(detectInstallPlatform({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' }), INSTALL_PLATFORMS.DESKTOP);
  assert.equal(detectInstallPlatform({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }), INSTALL_PLATFORMS.IOS);
});

test('identifica Safari e navegadores alternativos no iPhone', () => {
  assert.equal(detectIosBrowser({ userAgent: 'Mozilla/5.0 (iPhone) Version/18.0 Mobile Safari/604.1' }), 'safari-ios');
  assert.equal(detectIosBrowser({ userAgent: 'Mozilla/5.0 CriOS/151.0 Mobile/15E148 Safari/604.1' }), 'chrome-ios');
  assert.equal(detectIosBrowser({ userAgent: 'Mozilla/5.0 (Linux; Android 15)' }), 'not-ios');
});

test('bloqueia somente quando não está instalado', () => {
  assert.equal(shouldLockApplication({ installed: false }), true);
  assert.equal(shouldLockApplication({ installed: true }), false);
  assert.equal(shouldLockApplication({ installed: false, testMode: 'installed' }), false);
});

test('iPhone apresenta instalação como aplicativo com o fluxo aprovado', () => {
  const ios = installInstructions({ platform: INSTALL_PLATFORMS.IOS, iosBrowser: 'safari-ios' });

  assert.equal(ios.title, 'Instale o VETTA no seu iPhone');
  assert.equal(ios.action, 'instructions-only');
  assert.equal(ios.actionLabel, '');
  assert.match(ios.description, /Adicionar à Tela de Início/);
  assert.match(ios.outcome, /como qualquer aplicativo/);
  assert.deepEqual(ios.benefits.map(item => item.label), [
    'Instala o aplicativo',
    'Ícone próprio na Tela de Início',
    'Você só precisa instalar uma vez',
  ]);
  assert.deepEqual(ios.steps, [
    'Toque em Compartilhar.',
    'Toque em “Adicionar à Tela de Início”.',
    'Confirme em “Adicionar”.',
    'Abra o VETTA pelo novo ícone.',
  ]);
  assert.match(ios.important, /feche esta tela/);
  assert.doesNotMatch(visibleCopy(ios), /\bPWA\b|offline|navegador|\baba\b/i);
});

test('Chrome no iPhone orienta pelo Compartilhar sem cair no menu Android', () => {
  const chromeIos = installInstructions({
    platform: INSTALL_PLATFORMS.IOS,
    iosBrowser: 'chrome-ios',
  });

  assert.equal(chromeIos.action, 'instructions-only');
  assert.equal(chromeIos.actionLabel, '');
  assert.match(chromeIos.browserHint, /No Chrome, use o botão Compartilhar/);
  assert.doesNotMatch(chromeIos.steps.join(' '), /menu ⋮|Instalar app/);
});

test('outro navegador no iPhone oferece apenas o fallback necessário', () => {
  const iosAlternative = installInstructions({
    platform: INSTALL_PLATFORMS.IOS,
    iosBrowser: 'other-ios',
  });

  assert.equal(iosAlternative.action, 'copy-address');
  assert.equal(iosAlternative.actionLabel, 'Copiar endereço para abrir no Safari');
  assert.match(iosAlternative.browserHint, /abra esta página no Safari/);
  assert.match(iosAlternative.outcome, /como qualquer aplicativo/);
});

test('Android usa botão nativo quando disponível e instrução curta como fallback', () => {
  const androidPrompt = installInstructions({
    platform: INSTALL_PLATFORMS.ANDROID,
    promptAvailable: true,
  });
  assert.equal(androidPrompt.action, 'prompt');
  assert.equal(androidPrompt.actionLabel, 'Instalar VETTA');
  assert.deepEqual(androidPrompt.steps, [
    'Toque em “Instalar VETTA”.',
    'Confirme em “Instalar”.',
    'Abra o VETTA pelo novo ícone.',
  ]);

  const androidFallback = installInstructions({
    platform: INSTALL_PLATFORMS.ANDROID,
    promptAvailable: false,
  });
  assert.equal(androidFallback.action, 'instructions-only');
  assert.equal(androidFallback.actionLabel, '');
  assert.match(androidFallback.steps.join(' '), /menu ⋮/);
  assert.doesNotMatch(visibleCopy(androidFallback), /\bPWA\b|offline|navegador|\baba\b/i);
});
