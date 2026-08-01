export async function registerUpdates({ onUpdated, onError } = {}) {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    await registration.update();
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem('vetta-reloading') === '1') return;
      sessionStorage.setItem('vetta-reloading', '1');
      onUpdated?.();
      window.location.reload();
    });
    return registration;
  } catch (error) {
    onError?.(error);
    return null;
  }
}
