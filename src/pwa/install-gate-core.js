export const INSTALL_PLATFORMS = Object.freeze({
  IOS: 'ios',
  ANDROID: 'android',
  DESKTOP: 'desktop',
});

export function isStandaloneEnvironment({ matchMedia, navigatorLike = {} } = {}) {
  const standaloneMedia = typeof matchMedia === 'function'
    ? Boolean(matchMedia('(display-mode: standalone)')?.matches)
    : false;
  return standaloneMedia || navigatorLike.standalone === true;
}

export function detectInstallPlatform(navigatorLike = {}) {
  const userAgent = String(navigatorLike.userAgent || '');
  const platform = String(navigatorLike.platform || '');
  const maxTouchPoints = Number(navigatorLike.maxTouchPoints || 0);
  const ios = /iPad|iPhone|iPod/i.test(userAgent)
    || (platform === 'MacIntel' && maxTouchPoints > 1);
  if (ios) return INSTALL_PLATFORMS.IOS;
  if (/Android/i.test(userAgent)) return INSTALL_PLATFORMS.ANDROID;
  return INSTALL_PLATFORMS.DESKTOP;
}

export function detectIosBrowser(navigatorLike = {}) {
  const userAgent = String(navigatorLike.userAgent || '');
  if (!/iPad|iPhone|iPod/i.test(userAgent)
      && !(String(navigatorLike.platform || '') === 'MacIntel' && Number(navigatorLike.maxTouchPoints || 0) > 1)) {
    return 'not-ios';
  }
  if (/CriOS/i.test(userAgent)) return 'chrome-ios';
  if (/FxiOS/i.test(userAgent)) return 'firefox-ios';
  if (/EdgiOS/i.test(userAgent)) return 'edge-ios';
  if (/OPiOS/i.test(userAgent)) return 'opera-ios';
  return /Safari/i.test(userAgent) ? 'safari-ios' : 'other-ios';
}

export function shouldLockApplication({ installed, testMode } = {}) {
  if (testMode === 'installed') return false;
  return installed !== true;
}

export function installInstructions({ platform, iosBrowser = 'not-ios', promptAvailable = false } = {}) {
  if (platform === INSTALL_PLATFORMS.IOS) {
    const browserHint = iosBrowser === 'safari-ios'
      ? 'Você já está no Safari.'
      : 'Use o menu Compartilhar deste navegador. Se “Adicionar à Tela de Início” não aparecer, abra o link no Safari.';
    return Object.freeze({
      eyebrow: 'Instalação no iPhone',
      title: 'Adicione o VETTA à Tela de Início',
      description: 'No iPhone, a instalação é feita pelo menu Compartilhar. O aplicativo só será liberado quando você abrir pelo ícone criado na Tela de Início.',
      browserHint,
      steps: Object.freeze([
        'Toque no botão Compartilhar — o quadrado com uma seta para cima.',
        'Role a lista e toque em “Adicionar à Tela de Início”.',
        'Confirme o nome VETTA e toque em “Adicionar”.',
        'Feche esta aba e abra o VETTA pelo novo ícone da Tela de Início.',
      ]),
      actionLabel: 'Copiar link do VETTA',
      action: 'copy-link',
    });
  }

  if (platform === INSTALL_PLATFORMS.ANDROID) {
    return Object.freeze({
      eyebrow: 'Instalação no Android',
      title: 'Instale o VETTA para continuar',
      description: 'A instalação cria um ícone, melhora o funcionamento offline e mantém a experiência separada da aba do navegador.',
      browserHint: promptAvailable
        ? 'O instalador do navegador está pronto.'
        : 'Se o instalador não abrir, use o menu ⋮ e procure “Instalar app” ou “Adicionar à tela inicial”.',
      steps: Object.freeze([
        'Toque em “Instalar VETTA”.',
        'Confirme a instalação no navegador.',
        'Depois, abra o VETTA pelo ícone criado na tela inicial.',
      ]),
      actionLabel: promptAvailable ? 'Instalar VETTA' : 'Ver como instalar',
      action: promptAvailable ? 'prompt' : 'manual',
    });
  }

  return Object.freeze({
    eyebrow: 'Aplicativo instalável',
    title: 'Instale o VETTA para continuar',
    description: 'Abra o VETTA como aplicativo para liberar os recursos. Em navegadores compatíveis, a instalação aparece na barra de endereço ou no menu.',
    browserHint: promptAvailable
      ? 'O instalador do navegador está pronto.'
      : 'Use Chrome ou Edge e procure “Instalar VETTA” no menu do navegador.',
    steps: Object.freeze([
      'Clique em “Instalar VETTA”.',
      'Confirme no navegador.',
      'Abra o aplicativo pelo atalho instalado.',
    ]),
    actionLabel: promptAvailable ? 'Instalar VETTA' : 'Ver como instalar',
    action: promptAvailable ? 'prompt' : 'manual',
  });
}
