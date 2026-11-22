import { useSyncExternalStore } from 'react';

type State<T> = { value: T; ready: boolean; saveFailed: boolean };

/**
 * Saves one piece of data in this browser and tells every screen when it changes.
 * `parse` re-checks the data on load, because saved data can be edited or damaged.
 */
export function createLocalStore<T>(key: string, empty: T, parse: (raw: string | null) => T) {
  const SERVER: State<T> = { value: empty, ready: false, saveFailed: false };
  let state = SERVER;
  const listeners = new Set<() => void>();

  function emit(next: State<T>) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function load() {
    try {
      emit({ value: parse(localStorage.getItem(key)), ready: true, saveFailed: false });
    } catch {
      emit({ value: empty, ready: true, saveFailed: true });
    }
  }

  // Keeps two open tabs in step with each other.
  function onStorage(event: StorageEvent) {
    if (event.key === key || event.key === null) load();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
      window.addEventListener('storage', onStorage);
      // If saving failed, memory holds the only copy, so reloading would lose it.
      if (!state.ready || !state.saveFailed) load();
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener('storage', onStorage);
    };
  }

  function update(change: (value: T) => T) {
    if (!state.ready) return;
    const value = change(state.value);
    if (value === state.value) return;
    let saveFailed = false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      saveFailed = true;
    }
    emit({ value, ready: true, saveFailed });
  }

  function reset() {
    let saveFailed = false;
    try {
      localStorage.removeItem(key);
    } catch {
      saveFailed = true;
    }
    emit({ value: empty, ready: true, saveFailed });
  }

  const use = () => useSyncExternalStore(subscribe, () => state, () => SERVER);

  return { use, update, reset };
}
