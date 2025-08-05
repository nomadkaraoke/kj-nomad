import React, { useEffect, useState } from 'react';
import { ThemeContext } from './theme';
import type { Theme, ThemeContextType } from './theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('kj-nomad-theme') as Theme;
    return savedTheme || 'system';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const isSystemDark = mediaQuery.matches;
      const shouldBeDark = theme === 'dark' || (theme === 'system' && isSystemDark);

      setIsDark(shouldBeDark);
      document.documentElement.classList.toggle('dark', shouldBeDark);
    };

    updateTheme();

    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('kj-nomad-theme', newTheme);
    console.log('Theme set to:', newTheme);
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
