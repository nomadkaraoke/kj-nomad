import React, { useState } from 'react';
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
    setShowHistory
  } = useAppStore();
  
  const [newTickerText, setNewTickerText] = useState(tickerText);
  
  const handleUpdateTicker = () => {
    updateTicker(newTickerText);
  };
  
  const handleRemoveSinger = (songId: string) => {
    removeFromQueue(songId);
  };

  const handleReorderQueue = async (fromIndex: number, toIndex: number) => {
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
      }
    } catch (error) {
      console.error('Error reordering queue:', error);
    }
  };

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
          
          {/* Player Screen Management */}
          <PlayerScreenManager />

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
