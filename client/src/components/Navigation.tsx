import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { ThemeToggle } from './ui/ThemeToggle';
import { useAppStore } from '../store/appStore';
import { 
  Cog6ToothIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { connectionStatus, error, serverInfo, checkServerInfo } = useAppStore();

  useEffect(() => {
    if (connectionStatus === 'connected') {
      checkServerInfo();
    }
  }, [connectionStatus, checkServerInfo]);
  
  const navItems = [
    { 
      path: '/', 
      label: 'KJ Control', 
      icon: Cog6ToothIcon,
      description: 'Host Interface'
    },
    { 
      path: '/profiles', 
      label: 'Profiles', 
      icon: UserGroupIcon,
      description: 'Singer Profiles'
    },
  ];
  
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="font-display text-2xl text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-brand-blue">
              KJ-NOMAD
            </Link>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' ? (
                <div className="flex items-center space-x-2 text-green-500">
                  <WifiIcon className="h-5 w-5" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium">Connected</span>
                    {serverInfo.localIps.length > 0 && (
                      <span className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
                        {serverInfo.localIps[0]}:{serverInfo.port}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-500">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">
                    {error || 'Disconnected'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand-blue/10 text-brand-pink'
                      : 'text-text-secondary-dark hover:text-brand-pink hover:bg-brand-blue/10'
                  )}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Mobile Navigation Menu */}
          <div className="md:hidden">
            <select 
              value={location.pathname}
              onChange={(e) => window.location.hash = `#${e.target.value}`}
              className="input-primary py-1"
            >
              {navItems.map((item) => (
                <option key={item.path} value={item.path}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
