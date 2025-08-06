import React from 'react';
import { CheckCircleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const OnlineSessionConnectedPage: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center font-sans text-text-primary-light dark:text-text-primary-dark">
      <div className="card w-full max-w-lg text-center">
        <div className="p-4 sm:p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-500/10 rounded-full">
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <h1 className="font-display text-4xl mb-4">
            Successfully Connected
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
            This app is now connected to your online session. You can now manage your show from the web admin interface.
          </p>
          <div className="p-4 bg-bg-light dark:bg-bg-dark rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center justify-center space-x-2">
              <GlobeAltIcon className="h-5 w-5 text-brand-blue dark:text-brand-pink" />
              <span className="font-mono text-brand-blue dark:text-brand-pink">kj.nomadkaraoke.com/admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineSessionConnectedPage;
