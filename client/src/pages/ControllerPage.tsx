import React, { useState } from 'react';
import { Container } from '../components/ui/Layout';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAppStore } from '../store/appStore';
import SessionHistory from '../components/SessionHistory/SessionHistory';
import { 
  PlayIcon, 
  PauseIcon,
  ForwardIcon,
  QueueListIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ClockIcon,
  StopIcon
} from '@heroicons/react/24/outline';

const ControllerPage: React.FC = () => {
  const { 
    queue, 
    nowPlaying, 
    tickerText, 
    isConnected,
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
  
  const currentlyPlaying = nowPlaying && !nowPlaying.isFiller;
  
  return (
    <Container size="xl" className="py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          KJ Controller
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your karaoke show from your phone or tablet
        </p>
      </div>
      
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <QueueListIcon className="h-5 w-5" />
              <span>Singer Queue ({queue.length})</span>
            </h2>
            <Button variant="ghost" size="sm">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <QueueListIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No singers in queue</p>
              <p className="text-sm">Share the singer portal for requests!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((entry, index) => (
                <div
                  key={`${entry.song.id}-${entry.queuedAt}`}
                  data-testid="queue-item"
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    index === 0 
                      ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                      : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                            {entry.singerName}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 truncate">
                            {entry.song.artist} - {entry.song.title}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Reorder buttons */}
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={index === 0}
                        >
                          <ArrowUpIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={index === queue.length - 1}
                        >
                          <ArrowDownIcon className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Remove button */}
                      <Button
                        onClick={() => handleRemoveSinger(entry.song.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {index === 0 && (
                    <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-700">
                      <Button
                        onClick={playNext}
                        variant="primary"
                        size="sm"
                        className="w-full"
                        disabled={!isConnected}
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Start This Song
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
  );
};

export default ControllerPage;