import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
}

export const THEME_VARIABLES = {
  light: {
    '--bg-page': '#F8FAFC',
    '--bg-surface': '#FFFFFF',
    '--bg-surface-elevated': '#F1F5F9',
    '--bg-surface-subtle': '#F8FAFC',
    '--bg-surface-hover': '#F1F5F9',
    '--border-subtle': 'rgba(0, 0, 0, 0.08)',
    '--border-medium': 'rgba(0, 0, 0, 0.14)',
    '--border-strong': 'rgba(0, 0, 0, 0.22)',
    '--text-primary': '#0F172A',
    '--text-secondary': '#475569',
    '--text-muted': '#64748B',
    '--text-faint': '#94A3B8',
    '--shadow-subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
    '--shadow-card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
    '--shadow-elevated': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
    '--accent': '#0D9488',
    '--accent-light': '#14B8A6',
    '--accent-subtle': 'rgba(13, 148, 136, 0.08)',
    '--accent-border': 'rgba(13, 148, 136, 0.22)',
    '--sev1-red': '#DC2626',
    '--sev1-subtle': 'rgba(220, 38, 38, 0.08)',
    '--sev1-border': 'rgba(220, 38, 38, 0.22)',
    '--sev2-orange': '#EA580C',
    '--sev2-subtle': 'rgba(234, 88, 12, 0.08)',
    '--sev2-border': 'rgba(234, 88, 12, 0.22)',
    '--sev3-yellow': '#CA8A04',
    '--sev3-subtle': 'rgba(202, 138, 4, 0.08)',
    '--sev3-border': 'rgba(202, 138, 4, 0.22)',
    '--sev4-teal': '#0891B2',
    '--sev4-subtle': 'rgba(8, 145, 178, 0.08)',
    '--sev4-border': 'rgba(8, 145, 178, 0.22)',
    '--success-green': '#059669',
    '--success-subtle': 'rgba(5, 150, 105, 0.08)',
  },
  dark: {
    '--bg-page': '#0C1015',
    '--bg-surface': '#121820',
    '--bg-surface-elevated': '#18202A',
    '--bg-surface-subtle': '#0F141B',
    '--bg-surface-hover': '#1A232E',
    '--border-subtle': 'rgba(255, 255, 255, 0.07)',
    '--border-medium': 'rgba(255, 255, 255, 0.12)',
    '--border-strong': 'rgba(255, 255, 255, 0.2)',
    '--text-primary': '#F1F5F9',
    '--text-secondary': '#94A3B8',
    '--text-muted': '#64748B',
    '--text-faint': '#475569',
    '--shadow-subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
    '--shadow-card': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
    '--shadow-elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    '--accent': '#14B8A6',
    '--accent-light': '#2DD4BF',
    '--accent-subtle': 'rgba(20, 184, 166, 0.12)',
    '--accent-border': 'rgba(20, 184, 166, 0.28)',
    '--sev1-red': '#EF4444',
    '--sev1-subtle': 'rgba(239, 68, 68, 0.12)',
    '--sev1-border': 'rgba(239, 68, 68, 0.28)',
    '--sev2-orange': '#F97316',
    '--sev2-subtle': 'rgba(249, 115, 22, 0.12)',
    '--sev2-border': 'rgba(249, 115, 22, 0.28)',
    '--sev3-yellow': '#EAB308',
    '--sev3-subtle': 'rgba(234, 179, 8, 0.12)',
    '--sev3-border': 'rgba(234, 179, 8, 0.28)',
    '--sev4-teal': '#06B6D4',
    '--sev4-subtle': 'rgba(6, 182, 212, 0.12)',
    '--sev4-border': 'rgba(6, 182, 212, 0.28)',
    '--success-green': '#10B981',
    '--success-subtle': 'rgba(16, 185, 129, 0.12)',
  },
} as const;

export function applyThemeTokens(active: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (active === 'dark') {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  // Synchronize CSS custom properties directly onto documentElement style
  const vars = THEME_VARIABLES[active];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

function resolveActiveTheme(themeChoice: Theme): 'dark' | 'light' {
  if (themeChoice === 'dark') return 'dark';
  if (themeChoice === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('resolveiq-theme') as Theme | null;
      if (saved && ['dark', 'light', 'system'].includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }

    // Check what index.html script has already established on <html>
    if (document.documentElement.classList.contains('light')) {
      return 'light';
    }
    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }

    // Default to system preference
    return 'system';
  }
  return 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() =>
    resolveActiveTheme(getInitialTheme())
  );

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('resolveiq-theme', newTheme);
    } catch {
      // Ignore storage errors
    }

    const active = resolveActiveTheme(newTheme);
    setResolvedTheme(active);
    applyThemeTokens(active);
  }, []);

  useEffect(() => {
    const active = resolveActiveTheme(theme);
    setResolvedTheme(active);
    applyThemeTokens(active);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        const sysActive = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(sysActive);
        applyThemeTokens(sysActive);
      };

      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Synchronize across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'resolveiq-theme' && e.newValue) {
        const nextTheme = e.newValue as Theme;
        if (['dark', 'light', 'system'].includes(nextTheme)) {
          setThemeState(nextTheme);
          const active = resolveActiveTheme(nextTheme);
          setResolvedTheme(active);
          applyThemeTokens(active);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
