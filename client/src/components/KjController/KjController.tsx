import React, { useState } from 'react';
import DraggableQueue from '../QueueManager/DraggableQueue';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface Song {
    id: string;
    artist: string;
    title: string;
    fileName: string;
}

interface QueueEntry {
    song: Song;
    singerName: string;
}

interface SessionState {
  startedAt: number;
  queue: QueueEntry[];
  nowPlaying: QueueEntry | null;
  playbackState: 'playing' | 'paused' | 'stopped';
  history: QueueEntry[];
  currentSongStartTime?: number;
  totalSongsPlayed: number;
  queueLength: number;
}

interface KjControllerProps {
  socket: WebSocket | { send: (data: string) => void } | null;
  queue: QueueEntry[];
  sessionState?: SessionState;
}

const KjController: React.FC<KjControllerProps> = ({ socket, queue, sessionState }) => {
  const [tickerText, setTickerText] = useState('');

  const playNextSong = () => {
    const nextSong = queue[0];
    if (socket && nextSong) {
      socket.send(JSON.stringify({ 
        type: 'play', 
        payload: { 
          songId: nextSong.song.id, 
          fileName: nextSong.song.fileName,
          singer: nextSong.singerName
        } 
      }));
    }
  };

  const handlePlaySong = (songId: string, singerName: string) => {
    if (socket) {
      socket.send(JSON.stringify({ 
        type: 'play', 
        payload: { songId, singer: singerName } 
      }));
    }
  };

  const handleRemoveSong = (songId: string) => {
    if (socket) {
      socket.send(JSON.stringify({ 
        type: 'remove_from_queue', 
        payload: { songId } 
      }));
    }
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

  const handlePause = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'pause_playback' }));
    }
  };

  const handleResume = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'resume_playback' }));
    }
  };

  const handleStop = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'stop_playback' }));
    }
  };

  const handleRestart = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'restart_song' }));
    }
  };

  const updateTicker = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'ticker_updated', payload: tickerText }));
    }
  };

  const nowPlaying = sessionState?.nowPlaying;
  const playbackState = sessionState?.playbackState || 'stopped';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          KJ Controller
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {sessionState?.totalSongsPlayed || 0} songs played
        </div>
      </div>

      {/* Now Playing Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Now Playing
        </h2>
        
        {nowPlaying ? (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                {nowPlaying.song.artist} - {nowPlaying.song.title}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Singer: {nowPlaying.singerName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Status: <span className="capitalize font-medium">{playbackState}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {playbackState === 'playing' && (
                <Button onClick={handlePause} variant="secondary">
                  ⏸️ Pause
                </Button>
              )}
              {playbackState === 'paused' && (
                <Button onClick={handleResume} variant="secondary">
                  ▶️ Resume
                </Button>
              )}
              <Button onClick={handleRestart} variant="secondary">
                🔄 Restart
              </Button>
              <Button onClick={handleStop} variant="secondary">
                ⏹️ Stop
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🎵</div>
            <div>No song currently playing</div>
            {queue.length > 0 && (
              <Button onClick={playNextSong} className="mt-4">
                ▶️ Play Next Song
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Queue Management Section */}
      <Card className="p-6">
        <DraggableQueue
          queue={queue}
          onReorder={handleReorderQueue}
          onPlay={handlePlaySong}
          onRemove={handleRemoveSong}
        />
      </Card>

      {/* Ticker Control Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Ticker Control
        </h2>
        <div className="flex gap-2">
          <Input
            type="text"
            value={tickerText}
            onChange={(e) => setTickerText(e.target.value)}
            placeholder="Enter ticker message..."
            className="flex-grow"
            data-testid="ticker-input"
          />
          <Button onClick={updateTicker} data-testid="update-ticker-button">
            Update Ticker
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default KjController;
