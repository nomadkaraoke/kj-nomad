import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-text-secondary-light dark:text-text-secondary-dark">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          id={inputId}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
            'bg-card-light dark:bg-card-dark',
            'text-text-primary-light dark:text-text-primary-dark',
            'placeholder-text-secondary-light dark:placeholder-text-secondary-dark',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            error 
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
              : 'border-border-light dark:border-border-dark focus:border-brand-pink focus:ring-brand-pink',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-text-secondary-light dark:text-text-secondary-dark">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {hint && !error && (
        <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
          {hint}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};