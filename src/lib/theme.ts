export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'st_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const v = localStorage.getItem(KEY) as ThemeMode | null;
  return v ?? 'system';
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const wantDark =
    mode === 'dark' || (mode === 'system' && prefersDark);

  root.classList.toggle('dark', wantDark);
}

export function setTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, mode);
  applyTheme(mode);
}

/** Run ASAP on first paint to avoid FOUC */
export function inlineThemeInitScript(): string {
  return `
(function(){
  try {
    var key='${KEY}';
    var m = localStorage.getItem(key) || 'system';
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var wantDark = (m === 'dark') || (m === 'system' && prefersDark);
    var el = document.documentElement;
    if (wantDark) el.classList.add('dark'); else el.classList.remove('dark');
  } catch(e){}
})();`.trim();
}
