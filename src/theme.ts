export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'notes:theme';
const EVENT_NAME = 'notes-theme-change';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

export const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(raw) ? raw : null;
  } catch {
    return null;
  }
};

export const getTheme = (): Theme => getStoredTheme() ?? getSystemTheme();

export const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  // Helps native form controls, scrollbars, etc.
  (document.documentElement.style as any).colorScheme = theme;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: theme }));
  }
};

export const setTheme = (theme: Theme) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }
  applyTheme(theme);
};

export const toggleTheme = (): Theme => {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
};

export const initTheme = () => {
  const theme = getTheme();
  applyTheme(theme);

  // If user hasn't chosen a theme explicitly, follow OS changes.
  const stored = getStoredTheme();
  if (stored) return;

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => applyTheme(getSystemTheme());

  // Safari fallback
  if (typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
  else (mql as any).addListener?.(handler);
};

export const subscribeTheme = (listener: (theme: Theme) => void) => {
  const handler = (e: Event) => {
    const theme = (e as CustomEvent).detail;
    if (isTheme(theme)) listener(theme);
  };

  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
};
