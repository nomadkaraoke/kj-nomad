import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Container } from '../components/ui/Layout';
import { useAppStore } from '../store/appStore';
import { 
  SparklesIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

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
    if (!mediaDirectory) return;
    setScanStatus({ scanning: true, progress: 0, total: 0, complete: false, songCount: 0 });
    setError(null);

    try {
      // 1. Set the media directory
      const setDirResponse = await fetch('/api/setup/media-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: mediaDirectory }),
      });

      if (!setDirResponse.ok) {
        const { error } = await setDirResponse.json();
        throw new Error(error || 'Failed to set media directory.');
      }

      // 2. Start the scan
      const scanResponse = await fetch('/api/setup/scan', { method: 'POST' });
      if (!scanResponse.ok) throw new Error('Failed to start scan.');

      // 3. Poll for status
      const interval = setInterval(async () => {
        const statusResponse = await fetch('/api/setup/scan-status');
        const status = await statusResponse.json();
        
        setScanStatus({
          scanning: status.scanning,
          progress: status.progress,
          total: status.totalFiles,
          complete: status.isComplete,
          songCount: status.songCount,
        });

        if (status.isComplete) {
          clearInterval(interval);
          setTimeout(() => setStep('complete'), 1000);
        }
      }, 1000);

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

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <SparklesIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to KJ-Nomad
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              This setup wizard will guide you through configuring your local media library for your karaoke show.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep('select_media')}
            >
              Get Started
            </Button>
          </div>
        );
      case 'select_media':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <FolderOpenIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Select Media Library
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Choose the folder on your computer that contains your karaoke video files.
            </p>
            
            <div className="mb-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleSelectDirectory}
                className="w-full"
              >
                <FolderOpenIcon className="h-5 w-5 mr-2" />
                Choose Folder
              </Button>
              {mediaDirectory && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-dark-800 rounded-lg text-sm text-left">
                  <p className="font-mono truncate">{mediaDirectory}</p>
                </div>
              )}
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('welcome')}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep('scan_media')}
                disabled={!mediaDirectory}
              >
                Next: Scan Library
              </Button>
            </div>
          </div>
        );
      case 'scan_media':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <MagnifyingGlassIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Scanning Library
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please wait while we scan your media files...
            </p>
            
            <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-4 mb-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${scanStatus.total > 0 ? (scanStatus.progress / scanStatus.total) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {scanStatus.progress} / {scanStatus.total} files scanned
            </p>
            {error && (
              <div className="mt-4 text-red-500">
                <p>An error occurred: {error}</p>
                <Button variant="ghost" onClick={() => setStep('select_media')}>
                  Go Back
                </Button>
              </div>
            )}
          </div>
        );
      case 'complete':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Setup Complete!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              We found <span className="font-bold text-green-500">{scanStatus.songCount}</span> songs in your library. You're all set to start your show.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsSetupComplete(true)}
            >
              Finish Setup
            </Button>
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-dark-900 flex items-center justify-center font-sans">
      <Container size="sm">
        <Card className="shadow-2xl">
          <div className="p-8">
            {renderStep()}
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default SetupWizardPage;
