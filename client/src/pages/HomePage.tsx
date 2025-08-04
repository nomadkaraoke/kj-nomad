import React, { useState } from 'react';
import { Container, Layout } from '../components/ui/Layout';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
    <Layout>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          <Container size="xl" className="py-6 space-y-6">
            
            {/* Connection Status Alert */}
            {!isConnected && (
              <Card variant="bordered" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <div className="text-center text-red-800 dark:text-red-200">
                  <h3 className="font-semibold">Not Connected</h3>
                  <p className="text-sm">Reconnecting to server...</p>
                </div>
              </Card>
            )}
            
            {/* Quick Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ManualRequestForm />
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center space-x-2">
                    <Cog6ToothIcon className="h-5 w-5" />
                    <span>Playback Controls</span>
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Button
                      onClick={playNext}
                      disabled={!isConnected || queue.length === 0}
                      variant="primary"
                      size="lg"
                      className="flex flex-col items-center space-y-1 h-20"
                      data-testid="play-next-button"
                    >
                      <PlayIcon className="h-6 w-6" />
                      <span className="text-xs">Play Next</span>
                    </Button>
                    
                    <Button
                      onClick={playbackState === 'paused' ? resumePlayback : pausePlayback}
                      disabled={!isConnected || !nowPlaying}
                      variant="secondary"
                      size="lg"
                      className="flex flex-col items-center space-y-1 h-20"
                    >
                      <PauseIcon className="h-6 w-6" />
                      <span className="text-xs">{playbackState === 'paused' ? 'Resume' : 'Pause'}</span>
                    </Button>
                    
                    <Button
                      onClick={restartSong}
                      disabled={!isConnected || !nowPlaying}
                      variant="accent"
                      size="lg"
                      className="flex flex-col items-center space-y-1 h-20"
                    >
                      <ArrowPathIcon className="h-6 w-6" />
                      <span className="text-xs">Restart</span>
                    </Button>
                    
                    <Button
                      onClick={skipSong}
                      disabled={!isConnected || !nowPlaying}
                      variant="ghost"
                      size="lg"
                      className="flex flex-col items-center space-y-1 h-20"
                    >
                      <ForwardIcon className="h-6 w-6" />
                      <span className="text-xs">Skip</span>
                    </Button>
                    
                    <Button
                      onClick={stopPlayback}
                      disabled={!isConnected || !nowPlaying}
                      variant="ghost"
                      size="lg"
                      className="flex flex-col items-center space-y-1 h-20 text-red-600 hover:text-red-700"
                    >
                      <StopIcon className="h-6 w-6" />
                      <span className="text-xs">Stop</span>
                    </Button>
                    
                    <Button
                      onClick={() => setShowHistory(true)}
                      disabled={!isConnected}
                      variant="ghost"
                      size="lg"
                      className="flex flex-col items-center space-y-1 h-20"
                    >
                      <ClockIcon className="h-6 w-6" />
                      <span className="text-xs">History</span>
                      {sessionHistory.length > 0 && (
                        <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          {sessionHistory.length}
                        </span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Player Screen Management */}
            <PlayerScreenManager />

            {/* Now Playing */}
            {nowPlaying && (
              <Card variant="elevated" className={currentlyPlaying ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'} data-testid="now-playing">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {currentlyPlaying ? 'Now Singing' : 'Filler Music'}
                      </h3>
                      {nowPlaying.singer && (
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {nowPlaying.singer}
                        </p>
                      )}
                      <p className="text-gray-600 dark:text-gray-300">
                        {nowPlaying.fileName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        currentlyPlaying 
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                          : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {currentlyPlaying ? 'Live' : 'Filler'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Singer Queue */}
            <Card>
              <CardContent>
                <DraggableQueue
                  queue={queue}
                  onReorder={handleReorderQueue}
                  onPlay={handlePlaySong}
                  onRemove={handleRemoveSinger}
                />
              </CardContent>
            </Card>
            
            {/* Ticker Control */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Ticker Message</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Current Message"
                    value={newTickerText}
                    onChange={(e) => setNewTickerText(e.target.value)}
                    placeholder="Enter ticker message..."
                    hint="This message will scroll across the bottom of the player screen"
                    data-testid="ticker-input"
                  />
                  <Button
                    onClick={handleUpdateTicker}
                    disabled={!isConnected || newTickerText === tickerText}
                    variant="primary"
                    className="w-full"
                    data-testid="update-ticker-button"
                  >
                    Update Ticker
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Session Info */}
            {sessionState && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Session Info</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {sessionState.totalSongsPlayed}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Songs Played</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {sessionState.queueLength}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">In Queue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {sessionHistory.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">History</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {new Date(sessionState.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Session Started</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Session History Modal */}
            <SessionHistory />
          </Container>
        </main>
      </div>
    </Layout>
  );
};

export default HomePage;
