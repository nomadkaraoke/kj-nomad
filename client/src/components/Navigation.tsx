import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Header, Container } from './ui/Layout';
import { ThemeToggle } from './ui/ThemeToggle';
import { useAppStore } from '../store/appStore';
import { 
  HomeIcon, 
  PlayIcon, 
  Cog6ToothIcon, 
  MicrophoneIcon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { isConnected, connectionError } = useAppStore();
  
  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: HomeIcon,
      description: 'Welcome & Setup'
    },
    { 
      path: '/player', 
      label: 'Player', 
      icon: PlayIcon,
      description: 'Main Display'
    },
    { 
      path: '/controller', 
      label: 'KJ Control', 
      icon: Cog6ToothIcon,
      description: 'Host Interface'
    },
    { 
      path: '/singer', 
      label: 'Song Request', 
      icon: MicrophoneIcon,
      description: 'Singer Portal'
    },
  ];
  
  return (
    <Header sticky>
      <Container>
        <div className="flex items-center justify-between py-4">
          {/* Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
              <MicrophoneIcon className="h-8 w-8" />
              <span>KJ-Nomad</span>
            </Link>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <WifiIcon className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">
                    {connectionError || 'Disconnected'}
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
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-700'
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
              className="bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1 text-sm"
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
      </Container>
    </Header>
  );
};