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

const standardBenefits = Object.freeze([
  Object.freeze({ icon: 'fa-download', label: 'Instala o aplicativo' }),
  Object.freeze({ icon: 'fa-mobile-screen-button', label: 'Ícone próprio na Tela de Início' }),
  Object.freeze({ icon: 'fa-check', label: 'Você só precisa instalar uma vez' }),
]);

export function installInstructions({ platform, iosBrowser = 'not-ios', promptAvailable = false } = {}) {
  if (platform === INSTALL_PLATFORMS.IOS) {
    const isSafari = iosBrowser === 'safari-ios';
    return Object.freeze({
      eyebrow: 'Instalação no iPhone',
      title: 'Instale o VETTA no seu iPhone',
      description: 'No iPhone, a instalação é feita pela opção “Adicionar à Tela de Início”.',
      outcome: 'Depois disso, o VETTA criará um ícone próprio e funcionará normalmente, como qualquer aplicativo.',
      benefits: standardBenefits,
      browserHint: isSafari
        ? 'Siga estes passos:'
        : 'Siga estes passos. Se a opção não aparecer, abra esta página no Safari.',
      steps: Object.freeze([
        'Toque em Compartilhar.',
        'Toque em “Adicionar à Tela de Início”.',
        'Confirme em “Adicionar”.',
        'Abra o VETTA pelo novo ícone.',
      ]),
      actionLabel: isSafari ? '' : 'Copiar endereço para abrir no Safari',
      action: isSafari ? 'instructions-only' : 'copy-address',
      important: 'Depois da instalação, feche esta tela e abra o VETTA pelo ícone criado.',
    });
  }

  if (platform === INSTALL_PLATFORMS.ANDROID) {
    const steps = promptAvailable
      ? [
          'Toque em “Instalar VETTA”.',
          'Confirme em “Instalar”.',
          'Abra o VETTA pelo novo ícone.',
        ]
      : [
          'Toque no menu ⋮.',
          'Toque em “Instalar app” ou “Adicionar à tela inicial”.',
          'Confirme a instalação.',
          'Abra o VETTA pelo novo ícone.',
        ];
    return Object.freeze({
      eyebrow: 'Instalação no celular',
      title: 'Instale o VETTA para continuar',
      description: 'Instale o VETTA no seu celular para continuar.',
      outcome: 'Depois disso, ele terá um ícone próprio na sua Tela de Início.',
      benefits: standardBenefits,
      browserHint: promptAvailable ? 'Toque no botão abaixo:' : 'Siga estes passos:',
      steps: Object.freeze(steps),
      actionLabel: promptAvailable ? 'Instalar VETTA' : '',
      action: promptAvailable ? 'prompt' : 'instructions-only',
      important: 'Depois de instalar, abra o VETTA pelo novo ícone.',
    });
  }

  const steps = promptAvailable
    ? [
        'Clique em “Instalar VETTA”.',
        'Confirme a instalação.',
        'Abra o VETTA pelo novo ícone.',
      ]
    : [
        'Abra o menu ⋮.',
        'Escolha “Instalar VETTA” ou “Instalar app”.',
        'Confirme a instalação.',
        'Abra o VETTA pelo novo ícone.',
      ];
  return Object.freeze({
    eyebrow: 'Instalação',
    title: 'Instale o VETTA para continuar',
    description: 'Instale o VETTA neste dispositivo para continuar.',
    outcome: 'Depois disso, ele ficará disponível por um ícone próprio.',
    benefits: standardBenefits,
    browserHint: promptAvailable ? 'Clique no botão abaixo:' : 'Siga estes passos:',
    steps: Object.freeze(steps),
    actionLabel: promptAvailable ? 'Instalar VETTA' : '',
    action: promptAvailable ? 'prompt' : 'instructions-only',
    important: 'Depois de instalar, abra o VETTA pelo novo ícone.',
  });
}
