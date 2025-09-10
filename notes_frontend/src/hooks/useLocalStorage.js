import { useCallback, useEffect, useState } from 'react';

/**
 * React hook that persists a value to localStorage.
 * @param {string} key storage key
 * @param {*} initial initial value
 */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  }, [key, value]);

  return [value, setValue];
}
