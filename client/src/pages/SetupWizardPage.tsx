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
  const [isValidPath, setIsValidPath] = useState<boolean>(false);
  const [fillerDirectory, setFillerDirectory] = useState<string>('');
  const [youtubeDirectory, setYoutubeDirectory] = useState<string>('');
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
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
      // 1) Save config with selected mediaDirectory and optional filler/YouTube directories
      const saveResp = await fetch('/api/setup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mediaDirectory,
          ...(fillerDirectory ? { fillerMusicDirectory: fillerDirectory } : {}),
          ...(youtubeDirectory ? { youtubeCacheDirectory: youtubeDirectory } : {})
        }),
      });
      const saveJson = await saveResp.json();
      if (!saveResp.ok || !saveJson.success) {
        throw new Error(saveJson.error || 'Failed to save configuration.');
      }

      // 2) Trigger a scan (server returns songCount)
      const scanResp = await fetch('/api/setup/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });
      const scanJson = await scanResp.json();
      if (!scanResp.ok || !scanJson.success) {
        throw new Error(scanJson.error || 'Failed to scan library.');
      }

      const songCount = (scanJson?.data?.songCount ?? 0) as number;
      setScanStatus({ scanning: false, progress: 100, total: 100, complete: true, songCount });

      setTimeout(() => setStep('complete'), 1000);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      setScanStatus({ scanning: false, progress: 0, total: 0, complete: false, songCount: 0 });
    }
  }, [mediaDirectory, fillerDirectory, youtubeDirectory]);

  useEffect(() => {
    if (step === 'scan_media' && mediaDirectory) {
      startScan();
    }
  }, [step, mediaDirectory, startScan]);

  // No suggestions: external volumes vary widely; user should provide their own absolute path

  const handleSelectDirectory = async () => {
    setError(null);
    if (window.electronAPI) {
      const path = await window.electronAPI.selectDirectory();
      if (path) {
        // Here, we would normally validate the directory by calling a backend API
        // For now, we'll just set the path
        setMediaDirectory(path);
        try {
          const resp = await fetch('/api/setup/validate-media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
          const json = await resp.json();
          if (json?.success && json.data?.valid) {
            setIsValidPath(true);
            setValidationMsg(null);
          } else {
            setIsValidPath(false);
            setValidationMsg(json?.data?.error || 'Directory is not valid');
          }
        } catch {
          setIsValidPath(false);
          setValidationMsg('Failed to validate folder');
        }
      }
    } else {
      // In web dev mode, fall back to manual entry; we keep the UI visible below
      setError(null);
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
              Select Media Library (optional)
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              If you have a local collection of karaoke files, select the folder that contains them. If not,
              you can still run KJ‑Nomad using YouTube downloads only and add a library later in Settings.
            </p>
            
            <div className="mb-6 space-y-3 text-left">
              <button
                className="btn-secondary w-full"
                onClick={handleSelectDirectory}
              >
                <FolderOpenIcon className="h-5 w-5 mr-2" />
                Choose Folder
              </button>
              {!window.electronAPI && (
                <p className="text-xs opacity-80">Tip: Running in browser mode. Paste an absolute folder path below and click Validate.</p>
              )}
              <input
                className="input w-full font-mono"
                placeholder="/absolute/path/to/your/karaoke/library"
                value={mediaDirectory || ''}
                onChange={(e) => { setMediaDirectory(e.target.value.trim()); setIsValidPath(false); setValidationMsg(null); }}
              />
              <div className="flex gap-2">
                <button
                  className="btn-tertiary"
                  onClick={async () => {
                    if (!mediaDirectory) { setValidationMsg('Enter a folder path'); setIsValidPath(false); return; }
                    try {
                      const resp = await fetch('/api/setup/validate-media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: mediaDirectory }) });
                      const json = await resp.json();
                      if (json?.success && json.data?.valid) {
                        setIsValidPath(true);
                        // Directory validation checks readability; counts may be 0 if videos are nested
                        setValidationMsg('Looks good. Directory is readable.');
                      } else {
                        setIsValidPath(false);
                        setValidationMsg(json?.data?.error || 'Folder is not valid');
                      }
                    } catch { setIsValidPath(false); setValidationMsg('Failed to validate folder'); }
                  }}
                >Validate</button>
                {validationMsg && <span className={"text-sm " + (isValidPath ? 'text-green-600' : 'text-red-500')}>{validationMsg}</span>}
              </div>
              {/* suggestions removed intentionally: paths are highly environment-specific */}
              {mediaDirectory && (
                <div className="p-3 bg-bg-light dark:bg-bg-dark rounded-lg text-sm text-left border border-border-light dark:border-border-dark">
                  <p className="font-mono truncate text-text-secondary-light dark:text-text-secondary-dark">{mediaDirectory}</p>
                </div>
              )}

              {/* Optional: Filler Music Directory */}
              <div className="mt-4">
                <label className="block text-sm mb-1">Filler Music folder (optional)</label>
                <input
                  className="input w-full font-mono"
                  placeholder="/absolute/path/to/filler/music (defaults to Media Library)"
                  value={fillerDirectory}
                  onChange={(e) => setFillerDirectory(e.target.value.trim())}
                />
              </div>

              {/* Optional: YouTube Downloads Directory */}
              <div className="mt-4">
                <label className="block text-sm mb-1">YouTube downloads folder (optional)</label>
                <input
                  className="input w-full font-mono"
                  placeholder="/absolute/path/to/youtube/downloads"
                  value={youtubeDirectory}
                  onChange={(e) => setYoutubeDirectory(e.target.value.trim())}
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
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
                  disabled={!mediaDirectory || !isValidPath}
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
              onClick={async () => {
                try { await fetch('/api/setup/complete', { method: 'POST' }); } catch (e) { console.warn('setup complete POST failed', e); }
                setIsSetupComplete(true);
              }}
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
