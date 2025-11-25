import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'terra-dominus-theme';
const VALID_THEMES = ['light', 'dark'];

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'dark';

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (VALID_THEMES.includes(storedTheme)) {
    return storedTheme;
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getPreferredTheme);
  const [hasUserPreference, setHasUserPreference] = useState(() => {
    if (typeof window === 'undefined') return false;
    return VALID_THEMES.includes(window.localStorage.getItem(THEME_STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      if (!hasUserPreference) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [hasUserPreference]);

  useEffect(() => {
    document.body.dataset.theme = theme;

    if (hasUserPreference) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } else {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    }
  }, [theme, hasUserPreference]);

  const toggleTheme = () => {
    setHasUserPreference(true);
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);