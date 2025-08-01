import React from 'react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => (
  <div className={clsx('min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300', className)}>
    {children}
  </div>
);

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  size = 'lg',
  className 
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
  };
  
  return (
    <div className={clsx(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
};

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  children, 
  className,
  sticky = false 
}) => (
  <header className={clsx(
    'bg-white/90 dark:bg-dark-800/90 backdrop-blur-md border-b border-gray-200 dark:border-dark-700 z-50',
    sticky && 'sticky top-0',
    className
  )}>
    {children}
  </header>
);

interface MainProps {
  children: React.ReactNode;
  className?: string;
}

export const Main: React.FC<MainProps> = ({ children, className }) => (
  <main className={clsx('flex-1', className)}>
    {children}
  </main>
);

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  position?: 'left' | 'right';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  children, 
  className,
  position = 'left' 
}) => (
  <aside className={clsx(
    'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700',
    position === 'left' ? 'border-r' : 'border-l',
    className
  )}>
    {children}
  </aside>
);