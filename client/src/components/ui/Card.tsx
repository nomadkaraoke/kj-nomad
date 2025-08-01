import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className
}) => {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700',
    glass: 'bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm border border-white/20 dark:border-dark-700/50',
    bordered: 'bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700',
    elevated: 'bg-white dark:bg-dark-800 shadow-lg border border-gray-200 dark:border-dark-700 hover:shadow-xl',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };
  
  return (
    <div className={clsx(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={clsx('pb-4 border-b border-gray-200 dark:border-dark-700', className)}>
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={clsx('py-4', className)}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={clsx('pt-4 border-t border-gray-200 dark:border-dark-700', className)}>
    {children}
  </div>
);