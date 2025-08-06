import React, { useState } from 'react';
import DraggableQueue from '../QueueManager/DraggableQueue';
import { Input } from '../ui/Input';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">
          KJ Controller
        </h1>
        <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {sessionState?.totalSongsPlayed || 0} songs played
        </div>
      </div>

      {/* Now Playing Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          Now Playing
        </h2>
        
        {nowPlaying ? (
          <div className="space-y-4">
            <div className="bg-brand-blue/10 dark:bg-brand-blue/20 p-4 rounded-lg">
              <div className="font-semibold text-lg">
                {nowPlaying.song.artist} - {nowPlaying.song.title}
              </div>
              <div className="text-text-secondary-light dark:text-text-secondary-dark">
                Singer: {nowPlaying.singerName}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                Status: <span className="capitalize font-medium">{playbackState}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {playbackState === 'playing' && (
                <button onClick={handlePause} className="btn-secondary">
                  ⏸️ Pause
                </button>
              )}
              {playbackState === 'paused' && (
                <button onClick={handleResume} className="btn-secondary">
                  ▶️ Resume
                </button>
              )}
              <button onClick={handleRestart} className="btn-tertiary">
                🔄 Restart
              </button>
              <button onClick={handleStop} className="btn text-red-500 hover:bg-red-500/10">
                ⏹️ Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
            <div className="text-4xl mb-2">🎵</div>
            <div>No song currently playing</div>
            {queue.length > 0 && (
              <button onClick={playNextSong} className="btn-primary mt-4">
                ▶️ Play Next Song
              </button>
            )}
          </div>
        )}
      </div>

      {/* Queue Management Section */}
      <div className="card">
        <DraggableQueue
          queue={queue}
          onReorder={handleReorderQueue}
          onPlay={handlePlaySong}
          onRemove={handleRemoveSong}
        />
      </div>

      {/* Ticker Control Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
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
          <button onClick={updateTicker} data-testid="update-ticker-button" className="btn-primary">
            Update Ticker
          </button>
        </div>
      </div>
    </div>
  );
};

export default KjController;
