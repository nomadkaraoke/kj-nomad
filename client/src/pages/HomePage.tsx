import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/appStore';
import { 
  PlayIcon, 
  Cog6ToothIcon, 
  MicrophoneIcon,
  SparklesIcon,
  MusicalNoteIcon,
  UsersIcon,
  DevicePhoneMobileIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const { isConnected, queue } = useAppStore();
  
  const features = [
    {
      icon: SparklesIcon,
      title: 'Modern Interface',
      description: 'Beautiful, responsive design that works on any device with dark/light mode support.'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile KJ Control',
      description: 'Control everything from your phone. No more being tied to a laptop during your show.'
    },
    {
      icon: MusicalNoteIcon,
      title: 'Smart Queue Management',
      description: 'Automated singer rotation with drag-and-drop reordering and intelligent filler music.'
    },
    {
      icon: UsersIcon,
      title: 'Self-Service Requests',
      description: 'Singers can search and request songs directly from their phones via QR code.'
    },
    {
      icon: CloudIcon,
      title: 'Offline-First',
      description: 'Works completely offline with your local music collection. Online features optional.'
    },
    {
      icon: PlayIcon,
      title: 'Synchronized Players',
      description: 'Perfect sync between multiple screens with professional-grade timing control.'
    }
  ];
  
  const quickActions = [
    {
      to: '/player',
      icon: PlayIcon,
      title: 'Player View',
      description: 'Main video display for singers and audience',
      color: 'primary'
    },
    {
      to: '/controller',
      icon: Cog6ToothIcon,
      title: 'KJ Controller',
      description: 'Host controls and queue management',
      color: 'secondary'
    },
    {
      to: '/singer',
      icon: MicrophoneIcon,
      title: 'Song Requests',
      description: 'Singer self-service portal',
      color: 'accent'
    }
  ];
  
  return (
    <Container className="py-8">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="flex justify-center items-center space-x-3 mb-6">
          <MicrophoneIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white">
            KJ-Nomad
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Modern, offline-first, beautiful but reliable KJ software. Professional karaoke hosting made simple.
        </p>
        
        {/* Connection Status */}
        <div className="mb-8">
          {isConnected ? (
            <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">System Ready</span>
              {queue.length > 0 && (
                <span className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded text-sm">
                  {queue.length} in queue
                </span>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-medium">Server Connecting...</span>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.to} variant="elevated" className="text-center hover:scale-105 transition-transform duration-200">
                <Link to={action.to} className="block p-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      action.color === 'primary' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      action.color === 'secondary' ? 'bg-gray-100 dark:bg-dark-700' :
                      'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        action.color === 'primary' ? 'text-blue-600 dark:text-blue-400' :
                        action.color === 'secondary' ? 'text-gray-600 dark:text-gray-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {action.description}
                  </p>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Professional Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Getting Started */}
      <Card variant="glass" className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Choose your interface based on your role in the karaoke setup.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button as={Link} to="/controller" variant="primary" size="lg">
            I'm the KJ Host
          </Button>
          <Button as={Link} to="/singer" variant="secondary" size="lg">
            I want to sing
          </Button>
          <Button as={Link} to="/player" variant="ghost" size="lg">
            Display Setup
          </Button>
        </div>
      </Card>
    </Container>
  );
};

export default HomePage;