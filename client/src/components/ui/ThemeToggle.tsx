import React from 'react';
import { useTheme } from '../../hooks/useTheme';

import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="h-4 w-4" />;
      case 'dark':
        return <MoonIcon className="h-4 w-4" />;
      case 'system':
        return <ComputerDesktopIcon className="h-4 w-4" />;
    }
  };
  
  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'Auto';
    }
  };
  
  return (
    <button
      onClick={cycleTheme}
      className="btn bg-card-light dark:bg-card-dark hover:bg-bg-light dark:hover:bg-bg-dark text-text-primary-light dark:text-text-primary-dark"
      title={`Current theme: ${getLabel()}. Click to cycle themes.`}
      data-testid="theme-toggle"
    >
      {getIcon()}
      <span className="hidden sm:inline ml-2">{getLabel()}</span>
    </button>
  );
};
