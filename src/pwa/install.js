let deferredPrompt = null;

export function setupInstall({ onStatus } = {}) {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    onStatus?.('ready');
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    onStatus?.('installed');
  });
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export async function requestInstall() {
  if (isStandalone()) return { status: 'installed' };
  if (deferredPrompt) {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return { status: choice.outcome };
  }
  if (isIos()) return { status: 'ios-help' };
  return { status: 'browser-help' };
}
