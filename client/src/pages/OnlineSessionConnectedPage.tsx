import React from 'react';
import { Card } from '../components/ui/Card';
import { Container } from '../components/ui/Layout';
import { CheckCircleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const OnlineSessionConnectedPage: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex items-center justify-center font-sans">
      <Container size="sm">
        <Card className="bg-gray-800 border border-gray-700 shadow-2xl">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Successfully Connected
            </h1>
            <p className="text-gray-400 mb-8">
              This app is now connected to your online session. You can now manage your show from the web admin interface.
            </p>
            <div className="p-4 bg-gray-900 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <GlobeAltIcon className="h-5 w-5 text-blue-400" />
                <span className="font-mono text-blue-300">kj.nomadkaraoke.com/admin</span>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default OnlineSessionConnectedPage;
