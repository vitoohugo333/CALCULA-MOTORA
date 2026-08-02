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
    const isSafari = iosBrowser === 'safari-ios';
    return Object.freeze({
      eyebrow: 'Instalação rápida',
      title: 'Instale o VETTA para continuar',
      description: 'Coloque o VETTA na Tela de Início do seu iPhone. Você só precisa fazer isso uma vez.',
      browserHint: isSafari
        ? 'Siga os passos abaixo:'
        : 'Se “Adicionar à Tela de Início” não aparecer, abra este link no Safari.',
      steps: Object.freeze([
        'Toque em Compartilhar — o quadrado com uma seta para cima.',
        'Toque em “Adicionar à Tela de Início”.',
        'Toque em “Adicionar”.',
        'Abra o VETTA pelo novo ícone.',
      ]),
      actionLabel: isSafari ? '' : 'Copiar link para abrir no Safari',
      action: isSafari ? 'instructions-only' : 'copy-link',
    });
  }

  if (platform === INSTALL_PLATFORMS.ANDROID) {
    return Object.freeze({
      eyebrow: 'Instalação rápida',
      title: 'Instale o VETTA para continuar',
      description: 'Instale o VETTA no seu celular para continuar. Você só precisa fazer isso uma vez.',
      browserHint: promptAvailable
        ? 'Toque no botão abaixo.'
        : 'Abra o menu ⋮ e toque em “Instalar app” ou “Adicionar à tela inicial”.',
      steps: Object.freeze([
        'Toque em “Instalar VETTA”.',
        'Confirme a instalação.',
        'Abra o VETTA pelo novo ícone.',
      ]),
      actionLabel: promptAvailable ? 'Instalar VETTA' : 'Ver como instalar',
      action: promptAvailable ? 'prompt' : 'manual',
    });
  }

  return Object.freeze({
    eyebrow: 'Instalação rápida',
    title: 'Instale o VETTA para continuar',
    description: 'Instale o VETTA neste dispositivo. Você só precisa fazer isso uma vez.',
    browserHint: promptAvailable
      ? 'Clique no botão abaixo.'
      : 'Abra o menu ⋮ e escolha “Instalar VETTA” ou “Instalar app”.',
    steps: Object.freeze([
      'Clique em “Instalar VETTA”.',
      'Confirme a instalação.',
      'Abra o VETTA pelo novo ícone.',
    ]),
    actionLabel: promptAvailable ? 'Instalar VETTA' : 'Ver como instalar',
    action: promptAvailable ? 'prompt' : 'manual',
  });
}
