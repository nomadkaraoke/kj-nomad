import React, { useEffect, useState } from 'react';
import { ThemeContext } from './theme';
import type { Theme, ThemeContextType } from './theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then default to system
    const savedTheme = localStorage.getItem('kj-nomad-theme') as Theme;
    return savedTheme || 'system';
  });

  const [isDark, setIsDark] = useState(false);

  const updateTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let shouldBeDark = false;
    
    if (theme === 'dark') {
      shouldBeDark = true;
    } else if (theme === 'light') {
      shouldBeDark = false;
    } else {
      // system theme
      shouldBeDark = mediaQuery.matches;
    }
    
    setIsDark(shouldBeDark);
    
    // Update DOM
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    updateTheme();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    
    // Save theme preference
    localStorage.setItem('kj-nomad-theme', theme);
    console.log('Theme set to:', theme);
    
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

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
