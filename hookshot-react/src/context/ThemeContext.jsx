import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { themeTransition } from '../lib/themeTransition';

const STORAGE_KEY = 'hookshot-theme';
const FORCE_DARK_PATHS = ['/login', '/signup'];

const ThemeContext = createContext(null);

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme);
  const { pathname } = useLocation();

  // Login and signup are always dark, whatever the saved preference is
  const resolvedTheme = FORCE_DARK_PATHS.includes(pathname) ? 'dark' : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(
    (e) => {
      const next = theme === 'dark' ? 'light' : 'dark';
      const rect = e?.currentTarget?.getBoundingClientRect?.();
      const origin = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : undefined;

      themeTransition({
        origin,
        apply: () => {
          const root = document.documentElement;
          root.classList.toggle('dark', next === 'dark');
          root.style.colorScheme = next;
          // flushSync makes React re-render now, so the browser's "new" snapshot
          // already has the new theme in the rays, grid and cards
          flushSync(() => setTheme(next));
        },
      });
    },
    [theme]
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, toggleTheme }),
    [theme, resolvedTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used inside <ThemeProvider>');
  return ctx;
}