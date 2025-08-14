import React, { useEffect, useState } from 'react';
import { Input } from '../components/ui/Input';
import { useAppStore } from '../store/appStore';
import SessionHistory from '../components/SessionHistory/SessionHistory';
import DraggableQueue from '../components/QueueManager/DraggableQueue';
import { ManualRequestForm } from '../components/KjController/ManualRequestForm';
import PlayerScreenManager from '../components/KjController/PlayerScreenManager';
import { Navigation } from '../components/Navigation';
import { 
  PlayIcon, 
  PauseIcon,
  ForwardIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ClockIcon,
  StopIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const { 
    queue, 
    nowPlaying, 
    tickerText, 
    connectionStatus,
    sessionState,
    sessionHistory,
    playbackState,
    playNext,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    restartSong,
    skipSong,
    updateTicker,
    removeFromQueue,
    reorderQueue,
    setShowHistory
  } = useAppStore();
  
  const [newTickerText, setNewTickerText] = useState(tickerText);
  // Filler music UI state
  const [fillerDir, setFillerDir] = useState('');
  const [fillerVolume, setFillerVolume] = useState(0.4);
  const [fillerFiles, setFillerFiles] = useState<string[]>([]);
  const [selectedFiller, setSelectedFiller] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  const handleUpdateTicker = () => {
    updateTicker(newTickerText);
  };
  
  const handleRemoveSinger = (songId: string) => {
    removeFromQueue(songId);
  };

  const handleReorderQueue = async (fromIndex: number, toIndex: number) => {
    // Optimistically update the UI
    reorderQueue(fromIndex, toIndex);

    // Then, send the update to the server
    try {
      const response = await fetch('/api/queue/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromIndex, toIndex }),
      });

      if (!response.ok) {
        console.error('Failed to reorder queue:', response.statusText);
        // TODO: Implement a rollback mechanism if the server fails
      }
    } catch (error) {
      console.error('Error reordering queue:', error);
      // TODO: Implement a rollback mechanism
    }
  };

  // Admin: media library management helpers
  const [newLibraryPath, setNewLibraryPath] = useState('');
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);

  // Load filler settings + list on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/filler/settings');
        const j = await r.json();
        if (j?.success && j.data) {
          setFillerDir(j.data.directory || '');
          setFillerVolume(typeof j.data.volume === 'number' ? j.data.volume : 0.4);
        }
      } catch { /* ignore */ }
      try {
        const r2 = await fetch('/api/filler/list');
        const j2 = await r2.json();
        if (j2?.success) {
          setFillerFiles(j2.data || []);
          if (j2.data?.length) setSelectedFiller(j2.data[0]);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const handlePlaySong = (songId: string, singerName: string) => {
    // Use the existing playNext function or create a custom play function
    // For now, we'll use a WebSocket message similar to the KjController
    const { socket } = useAppStore.getState();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'play', 
        payload: { songId, singer: singerName } 
      }));
    }
  };
  
  const currentlyPlaying = nowPlaying && !nowPlaying.isFiller;
  const isConnected = connectionStatus === 'connected';
  
  return (
    <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Connection Status Alert */}
          {!isConnected && (
            <div className="card border-red-500/50 bg-red-500/10 text-center text-red-700 dark:text-red-300">
              <h3 className="font-semibold">Not Connected</h3>
              <p className="text-sm">Reconnecting to server...</p>
            </div>
          )}
          
          {/* Quick Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ManualRequestForm />
            <div className="card">
              <h2 className="text-xl font-semibold flex items-center space-x-2 mb-4">
                <Cog6ToothIcon className="h-5 w-5" />
                <span>Playback Controls</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  onClick={playNext}
                  disabled={!isConnected || queue.length === 0}
                  className="btn-primary flex flex-col items-center space-y-1 h-20"
                  data-testid="play-next-button"
                >
                  <PlayIcon className="h-6 w-6" />
                  <span className="text-xs">Play Next</span>
                </button>
                
                <button
                  onClick={playbackState === 'paused' ? resumePlayback : pausePlayback}
                  disabled={!isConnected || !nowPlaying}
                  className="btn-secondary flex flex-col items-center space-y-1 h-20"
                >
                  <PauseIcon className="h-6 w-6" />
                  <span className="text-xs">{playbackState === 'paused' ? 'Resume' : 'Pause'}</span>
                </button>
                
                <button
                  onClick={restartSong}
                  disabled={!isConnected || !nowPlaying}
                  className="btn-tertiary flex flex-col items-center space-y-1 h-20"
                >
                  <ArrowPathIcon className="h-6 w-6" />
                  <span className="text-xs">Restart</span>
                </button>
                
                <button
                  onClick={skipSong}
                  disabled={!isConnected || !nowPlaying}
                  className="btn flex flex-col items-center space-y-1 h-20 bg-card-light dark:bg-card-dark hover:bg-gray-100 dark:hover:bg-border-dark"
                >
                  <ForwardIcon className="h-6 w-6" />
                  <span className="text-xs">Skip</span>
                </button>
                
                <button
                  onClick={stopPlayback}
                  disabled={!isConnected || !nowPlaying}
                  className="btn flex flex-col items-center space-y-1 h-20 text-red-600 hover:bg-red-500/10"
                >
                  <StopIcon className="h-6 w-6" />
                  <span className="text-xs">Stop</span>
                </button>
                
                <button
                  onClick={() => setShowHistory(true)}
                  disabled={!isConnected}
                  className="btn flex flex-col items-center space-y-1 h-20 bg-card-light dark:bg-card-dark hover:bg-gray-100 dark:hover:bg-border-dark"
                >
                  <ClockIcon className="h-6 w-6" />
                  <span className="text-xs">History</span>
                  {sessionHistory.length > 0 && (
                    <span className="text-xs bg-brand-blue text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {sessionHistory.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Now Playing */}
          {nowPlaying && (
            <div className={`card ${currentlyPlaying ? 'ring-2 ring-brand-pink bg-brand-pink/10' : 'bg-brand-yellow/10'}`} data-testid="now-playing">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {currentlyPlaying ? 'Now Singing' : 'Filler Music'}
                  </h3>
                  {nowPlaying.singer && (
                    <p className="text-2xl font-bold text-brand-blue dark:text-brand-pink">
                      {nowPlaying.singer}
                    </p>
                  )}
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    {nowPlaying.fileName}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    currentlyPlaying 
                      ? 'bg-brand-pink/20 text-brand-pink'
                      : 'bg-brand-yellow/20 text-yellow-800 dark:text-brand-yellow'
                  }`}>
                    {currentlyPlaying ? 'Live' : 'Filler'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Singer Queue */}
          <div className="card">
            <DraggableQueue
              queue={queue}
              onReorder={handleReorderQueue}
              onPlay={handlePlaySong}
              onRemove={handleRemoveSinger}
            />
          </div>
          
          {/* Ticker Control */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Ticker Message</h2>
            <div className="space-y-4">
              <Input
                label="Current Message"
                value={newTickerText}
                onChange={(e) => setNewTickerText(e.target.value)}
                placeholder="Enter ticker message..."
                hint="This message will scroll across the bottom of the player screen"
                data-testid="ticker-input"
              />
              <button
                onClick={handleUpdateTicker}
                disabled={!isConnected || newTickerText === tickerText}
                className="btn-primary w-full"
                data-testid="update-ticker-button"
              >
                Update Ticker
              </button>
            </div>
          </div>

          {/* Media Library Management */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Media Library</h2>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <input className="input flex-1 font-mono" placeholder="/absolute/path/to/your/karaoke/library" value={newLibraryPath} onChange={(e) => setNewLibraryPath(e.target.value)} />
                <button className="btn-tertiary" onClick={async () => {
                  setLibraryMessage(null);
                  if (!newLibraryPath.trim()) { setLibraryMessage('Enter a folder path'); return; }
                  try {
                    const v = await fetch('/api/setup/validate-media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: newLibraryPath.trim() }) });
                    const j = await v.json();
                    if (!j?.success || !j.data?.valid) { setLibraryMessage(j?.data?.error || 'Folder invalid'); return; }
                    await fetch('/api/setup/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaDirectory: newLibraryPath.trim() }) });
                    const scan = await fetch('/api/setup/scan', { method: 'POST' });
                    const sj = await scan.json();
                    if (sj?.success) setLibraryMessage(`Scan complete. Songs found: ${sj.data?.songCount ?? 0}`);
                    else setLibraryMessage(sj?.error || 'Scan failed');
                  } catch {
                    setLibraryMessage('Failed to update library');
                  }
                }}>Set & Rescan</button>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={async () => { try { const r = await fetch('/api/setup/scan', { method: 'POST' }); const j = await r.json(); setLibraryMessage(j?.success ? `Rescanned. Songs: ${j.data?.songCount ?? 0}` : (j?.error || 'Scan failed')); } catch { setLibraryMessage('Scan failed'); } }}>Rescan Library</button>
                <button className="btn-tertiary" onClick={async () => { try { await fetch('/api/setup/reset', { method: 'POST' }); location.reload(); } catch { /* ignore */ } }}>Reset Setup</button>
              </div>
              {libraryMessage && <div className="text-sm opacity-80">{libraryMessage}</div>}
            </div>
          </div>

          {/* Filler Music Panel */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Filler Music</h2>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="Filler directory" value={fillerDir} onChange={(e) => setFillerDir(e.target.value)} />
                <button className="btn-secondary" onClick={async () => {
                  await fetch('/api/filler/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ directory: fillerDir, volume: fillerVolume }) });
                  const resp = await fetch('/api/filler/list'); const data = await resp.json(); if (data?.success) { setFillerFiles(data.data || []); if (data.data?.length) setSelectedFiller(data.data[0]); }
                }}>Save</button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm opacity-80">Volume</label>
                <input type="range" min={0} max={1} step={0.01} value={fillerVolume} onChange={(e) => setFillerVolume(parseFloat(e.target.value))} onMouseUp={() => { fetch('/api/filler/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ directory: fillerDir, volume: fillerVolume }) }); }} />
                <span className="text-sm w-10 text-right">{Math.round(fillerVolume*100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" accept="video/*,audio/*" onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;
                  const file = e.target.files[0];
                  const form = new FormData(); form.append('file', file);
                  setUploading(true);
                  try { await fetch('/api/filler/upload', { method: 'POST', body: form }); const r = await fetch('/api/filler/list'); const j = await r.json(); if (j?.success) { setFillerFiles(j.data || []); if (j.data?.length) setSelectedFiller(j.data[0]); } } finally { setUploading(false); }
                }} />
                {uploading && <span className="text-sm opacity-80">Uploading...</span>}
              </div>
              {fillerFiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <select className="input" value={selectedFiller} onChange={(e) => setSelectedFiller(e.target.value)}>
                    {fillerFiles.map(f => (<option key={f} value={f}>{f}</option>))}
                  </select>
                  <button className="btn-tertiary" onClick={async () => { const r = await fetch('/api/filler/list'); const j = await r.json(); if (j?.success) setFillerFiles(j.data || []); }}>Refresh</button>
                  <button className="btn" onClick={async () => { if (selectedFiller) await fetch('/api/filler/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: selectedFiller }) }); }}>Play Selected</button>
                  <button className="btn-tertiary" onClick={() => { const ws = useAppStore.getState().socket; ws?.send(JSON.stringify({ type: 'stop_filler_manual' })); }}>Stop</button>
                </div>
              )}
            </div>
          </div>

          {/* Player Screen Management (moved below Queue/Ticker) */}
          <PlayerScreenManager />
          
          {/* Session Info */}
          {sessionState && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Session Info</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-brand-blue dark:text-brand-pink">
                    {sessionState.totalSongsPlayed}
                  </div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Songs Played</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {sessionState.queueLength}
                  </div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">In Queue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500">
                    {sessionHistory.length}
                  </div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">History</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-500">
                    {new Date(sessionState.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Session Started</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Session History Modal */}
          <SessionHistory />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
