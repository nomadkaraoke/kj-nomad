import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  SparklesIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '../components/ui/ThemeToggle';

type WizardStep = 'welcome' | 'select_media' | 'scan_media' | 'complete';

const SetupWizardPage: React.FC = () => {
  const [step, setStep] = useState<WizardStep>('welcome');
  const setIsSetupComplete = useAppStore((state) => state.setIsSetupComplete);
  const [mediaDirectory, setMediaDirectory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<{
    scanning: boolean;
    progress: number;
    total: number;
    complete: boolean;
    songCount: number;
  }>({ scanning: false, progress: 0, total: 0, complete: false, songCount: 0 });

  const startScan = useCallback(async () => {
    if (!mediaDirectory) return;
    setScanStatus({ scanning: true, progress: 0, total: 0, complete: false, songCount: 0 });
    setError(null);

    try {
      // Call the single endpoint to set the directory and trigger a scan
      const response = await fetch('/api/setup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaDirectory }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to scan library.');
      }
      
      // Since the backend doesn't provide progress, we'll just show completion
      // A more advanced implementation would use WebSockets for progress
      setScanStatus({
        scanning: false,
        progress: 100,
        total: 100,
        complete: true,
        songCount: result.data.songCount || 0, // Assuming the backend returns this
      });

      setTimeout(() => setStep('complete'), 1000);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      setScanStatus({ scanning: false, progress: 0, total: 0, complete: false, songCount: 0 });
    }
  }, [mediaDirectory]);

  useEffect(() => {
    if (step === 'scan_media' && mediaDirectory) {
      startScan();
    }
  }, [step, mediaDirectory, startScan]);

  const handleSelectDirectory = async () => {
    setError(null);
    if (window.electronAPI) {
      const path = await window.electronAPI.selectDirectory();
      if (path) {
        // Here, we would normally validate the directory by calling a backend API
        // For now, we'll just set the path
        setMediaDirectory(path);
      }
    } else {
      setError('Directory selection is not available in this environment.');
    }
  };

  const handleSkip = () => {
    setMediaDirectory(null);
    // Directly go to the complete step, as no scanning is needed
    setStep('complete');
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-full">
                <SparklesIcon className="h-12 w-12 text-brand-blue dark:text-brand-pink" />
              </div>
            </div>
            <h1 className="font-display text-5xl mb-4">
              Welcome to KJ-Nomad
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8 max-w-md mx-auto">
              This setup wizard will guide you through configuring your local media library for your karaoke show.
            </p>
            <button
              className="btn-primary"
              onClick={() => setStep('select_media')}
            >
              Get Started
            </button>
          </div>
        );
      case 'select_media':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-full">
                <FolderOpenIcon className="h-12 w-12 text-brand-blue dark:text-brand-pink" />
              </div>
            </div>
            <h1 className="font-display text-4xl mb-4">
              Select Media Library
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Choose the folder on your computer that contains your karaoke video files.
            </p>
            
            <div className="mb-6">
              <button
                className="btn-secondary w-full"
                onClick={handleSelectDirectory}
              >
                <FolderOpenIcon className="h-5 w-5 mr-2" />
                Choose Folder
              </button>
              {mediaDirectory && (
                <div className="mt-4 p-3 bg-bg-light dark:bg-bg-dark rounded-lg text-sm text-left border border-border-light dark:border-border-dark">
                  <p className="font-mono truncate text-text-secondary-light dark:text-text-secondary-dark">{mediaDirectory}</p>
                </div>
              )}
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button className="btn-tertiary" onClick={() => setStep('welcome')}>
                Back
              </button>
              <div className="flex items-center space-x-4">
                <button className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-brand-pink" onClick={handleSkip}>
                  Skip for now
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setStep('scan_media')}
                  disabled={!mediaDirectory}
                >
                  Next: Scan Library
                </button>
              </div>
            </div>
          </div>
        );
      case 'scan_media':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-full">
                <MagnifyingGlassIcon className="h-12 w-12 text-brand-blue dark:text-brand-pink animate-pulse" />
              </div>
            </div>
            <h1 className="font-display text-4xl mb-4">
              Scanning Library
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Please wait while we scan your media files...
            </p>
            
            <div className="w-full bg-card-dark rounded-full h-2.5 mb-4">
              <div
                className="bg-brand-pink h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${scanStatus.complete ? 100 : 50}%` }} // Simulate progress
              ></div>
            </div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {scanStatus.complete ? `Scan Complete!` : `Scanning...`}
            </p>
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 rounded-lg text-red-500">
                <p className="font-bold">An error occurred:</p>
                <p className="text-sm mb-4">{error}</p>
                <div className="flex justify-center space-x-4">
                  <button className="btn-tertiary" onClick={() => setStep('select_media')}>
                    Go Back
                  </button>
                  <a href="/api/debug/download" download>
                    <button className="btn-secondary">
                      Download Debug Log
                    </button>
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      case 'complete':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-500/10 rounded-full">
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h1 className="font-display text-4xl mb-4">
              Setup Complete!
            </h1>
            <div className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
              {mediaDirectory ? (
                <p>
                  We found <span className="font-bold text-brand-pink">{scanStatus.songCount}</span> songs in your library. You're all set to start your show.
                </p>
              ) : (
                <div className="space-y-2">
                  <p>You've skipped selecting a local media library.</p>
                  <p className="text-sm text-brand-yellow bg-brand-yellow/10 p-3 rounded-lg">
                    <strong>Note:</strong> No local files will be available for playback. You can add a library later in the application settings.
                  </p>
                </div>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={() => setIsSetupComplete(true)}
            >
              Finish Setup
            </button>
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="h-screen w-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center text-text-primary-light dark:text-text-primary-dark">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="card w-full max-w-2xl">
        <div className="p-4 sm:p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default SetupWizardPage;
