import React, { useState } from 'react';
import DraggableQueue from '../QueueManager/DraggableQueue';
import { Input } from '../ui/Input';
import { useAppStore } from '../../store/appStore';
import { useEffect } from 'react';

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
  const autoCorrectionEnabled = useAppStore((s) => s.autoDriftCorrectionEnabled ?? true);
  const toggleAuto = useAppStore((s) => (s as unknown as { toggleAutoDriftCorrection: () => void }).toggleAutoDriftCorrection);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [fillerDir, setFillerDir] = useState('');
  const [fillerVolume, setFillerVolume] = useState(0.4);
  const [fillerFiles, setFillerFiles] = useState<string[]>([]);
  const [selectedFiller, setSelectedFiller] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load persisted filler settings
    fetch('/api/filler/settings').then(r => r.json()).then((resp) => {
      if (resp?.success && resp.data) {
        setFillerDir(resp.data.directory || '');
        setFillerVolume(typeof resp.data.volume === 'number' ? resp.data.volume : 0.4);
      }
    }).catch(() => void 0);
    // Load file list
    const loadList = () => fetch('/api/filler/list').then(r => r.json()).then((resp) => { if (resp?.success) { setFillerFiles(resp.data || []); setSelectedFiller((resp.data && resp.data[0]) || ''); } });
    loadList().catch(() => void 0);
  }, []);

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
                {nowPlaying.song.fileName}
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
          onRetryYouTube={(entry) => {
            if (!socket || entry.source !== 'youtube' || !entry.download?.videoId) return;
            socket.send(JSON.stringify({
              type: 'request_youtube_song',
              payload: { videoId: entry.download.videoId, title: entry.song.fileName, singerName: entry.singerName }
            }));
          }}
        />
      </div>

      {/* Sync Options */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Synchronization Options</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={!!autoCorrectionEnabled}
            onChange={() => {
              // Toggle locally for immediate UI feedback
              toggleAuto();
              // Tell server to toggle correction engine
              if (socket) {
                const next = !autoCorrectionEnabled;
                socket.send(JSON.stringify({ type: 'set_auto_drift_correction', payload: { enabled: next } }));
              }
            }}
          />
          <span>Enable automatic drift correction</span>
        </label>
        <div className="mt-4 space-y-2">
          <div className="text-sm opacity-80">Anchor device (unmuted audio screen): corrections will bias other screens to match this one.</div>
          <div className="flex gap-2">
            <input className="input flex-grow" placeholder="Enter deviceId (stable id)" value={anchorId ?? ''} onChange={(e) => setAnchorId(e.target.value || null)} />
            <button className="btn-secondary" onClick={() => { if (socket) socket.send(JSON.stringify({ type: 'set_sync_anchor', payload: { clientId: anchorId } })); }}>Set Anchor</button>
            <button className="btn-tertiary" onClick={() => { if (socket) socket.send(JSON.stringify({ type: 'clear_sync_anchor' })); setAnchorId(null); }}>Clear</button>
          </div>
        </div>
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

      {/* Filler Music Management */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Filler Music</h2>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <input className="input flex-1" placeholder="Filler directory" value={fillerDir} onChange={(e) => setFillerDir(e.target.value)} />
            <button className="btn-secondary" onClick={async () => {
              await fetch('/api/filler/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ directory: fillerDir, volume: fillerVolume }) }).then(() => fetch('/api/filler/list').then(r=>r.json()).then(resp => { if (resp?.success) setFillerFiles(resp.data || []); })).catch(()=>void 0);
            }}>Save</button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm opacity-80">Volume</label>
            <input type="range" min={0} max={1} step={0.01} value={fillerVolume} onChange={(e) => setFillerVolume(parseFloat(e.target.value))} onMouseUp={() => { socket?.send?.(JSON.stringify({ type: 'set_filler_volume', payload: { volume: fillerVolume } })); fetch('/api/filler/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ directory: fillerDir, volume: fillerVolume }) }); }} />
            <span className="text-sm w-10 text-right">{Math.round(fillerVolume*100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" accept="video/*,audio/*" onChange={async (e) => {
              if (!e.target.files || e.target.files.length === 0) return;
              const file = e.target.files[0];
              const form = new FormData();
              form.append('file', file);
              setUploading(true);
              try {
                await fetch('/api/filler/upload', { method: 'POST', body: form });
                const resp = await fetch('/api/filler/list');
                const data = await resp.json();
                if (data?.success) { setFillerFiles(data.data || []); if (data.data?.length) setSelectedFiller(data.data[0]); }
              } finally { setUploading(false); }
            }} />
            {uploading && <span className="text-sm opacity-80">Uploading...</span>}
          </div>
          {fillerFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <select className="input" value={selectedFiller} onChange={(e) => setSelectedFiller(e.target.value)}>
                {fillerFiles.map(f => (<option key={f} value={f}>{f}</option>))}
              </select>
              <button className="btn-tertiary" onClick={async () => { const r = await fetch('/api/filler/list'); const d = await r.json(); if (d?.success) setFillerFiles(d.data || []); }}>Refresh</button>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn" onClick={async () => { if (selectedFiller) { await fetch('/api/filler/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: selectedFiller }) }); } }}>Play Selected</button>
            <button className="btn-tertiary" onClick={() => socket?.send?.(JSON.stringify({ type: 'stop_filler_manual' }))}>Stop</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KjController;
