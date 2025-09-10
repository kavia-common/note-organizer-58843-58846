import { useEffect, useState } from 'react';

/**
 * Persisted theme hook for light/dark mode.
 */
// PUBLIC_INTERFACE
export function useLocalTheme(defaultTheme = 'light') {
  /** Provides theme and toggleTheme with localStorage persistence. */
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app_theme') || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
