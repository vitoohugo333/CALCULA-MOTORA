const EVENT_NAME_PATTERN = /^[a-z][a-z0-9]*(?::[a-z0-9-]+)+$/;

function validateEventName(eventName) {
  const normalized = String(eventName || '').trim();
  if (!EVENT_NAME_PATTERN.test(normalized)) {
    throw new Error(`Nome de evento inválido: ${normalized || '(vazio)'}.`);
  }
  return normalized;
}

export function createEventBus({ onError = () => {} } = {}) {
  const listeners = new Map();

  function on(eventName, listener) {
    const event = validateEventName(eventName);
    if (typeof listener !== 'function') throw new TypeError('Listener deve ser uma função.');

    const eventListeners = listeners.get(event) || new Set();
    eventListeners.add(listener);
    listeners.set(event, eventListeners);

    return () => {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) listeners.delete(event);
    };
  }

  function once(eventName, listener) {
    let unsubscribe = () => {};
    unsubscribe = on(eventName, async payload => {
      unsubscribe();
      return listener(payload);
    });
    return unsubscribe;
  }

  async function emit(eventName, payload = undefined) {
    const event = validateEventName(eventName);
    const eventListeners = [...(listeners.get(event) || [])];
    const failures = [];

    for (const listener of eventListeners) {
      try {
        await listener(payload);
      } catch (error) {
        failures.push(error);
        try {
          onError({ event, error });
        } catch {
          // O observador de erro nunca pode interromper o evento principal.
        }
      }
    }

    return Object.freeze({ delivered: eventListeners.length, failures: Object.freeze(failures) });
  }

  function listenerCount(eventName = null) {
    if (eventName !== null) return listeners.get(validateEventName(eventName))?.size || 0;
    return [...listeners.values()].reduce((total, eventListeners) => total + eventListeners.size, 0);
  }

  function clear(eventName = null) {
    if (eventName === null) listeners.clear();
    else listeners.delete(validateEventName(eventName));
  }

  return Object.freeze({ on, once, emit, listenerCount, clear });
}
