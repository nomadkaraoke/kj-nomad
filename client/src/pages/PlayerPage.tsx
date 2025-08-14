import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { Device } from '../store/appStore';
import Ticker from '../components/Player/Ticker';
import { websocketService } from '../services/websocketService';
import { PlayIcon, SignalIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const PlayerPage: React.FC = () => {
  const { 
    nowPlaying, 
    tickerText, 
    queue, 
    devices, 
    connectionStatus,
    playerDeviceId,
    playerShowIdentify,
    playerIsDisconnected,
    playerDebugOverlay,
    syncPreload,
    syncPlay,
    syncPause,
  } = useAppStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [selfDriftMs, setSelfDriftMs] = useState<number>(0);
  const lastClockLatencyMs = useAppStore((s) => s.lastClockLatencyMs);
  const lastClockOffsetMs = useAppStore((s) => s.lastClockOffsetMs);
  const [deviceSettings, setDeviceSettings] = useState<Partial<Device>>({
    isAudioEnabled: true,
    isTickerVisible: true,
    isSidebarVisible: false,
    isVideoPlayerVisible: true,
  });
  const playerConnectionId = useAppStore((s) => s.playerConnectionId);

  useEffect(() => {
    websocketService.connect('player');
  }, []);

  useEffect(() => {
    const myDevice = devices.find(d => d.id === playerDeviceId);
    if (myDevice) {
      setDeviceSettings({
        isAudioEnabled: myDevice.isAudioEnabled,
        isTickerVisible: myDevice.isTickerVisible,
        isSidebarVisible: myDevice.isSidebarVisible,
        isVideoPlayerVisible: myDevice.isVideoPlayerVisible,
      });
    }
  }, [devices, playerDeviceId]);
  
  // Fallback-only nowPlaying handler: do NOT auto-play when sync engine is orchestrating
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // If sync protocol is active (preload/play present), skip fallback auto-play
    const syncActive = Boolean(syncPreload || syncPlay);

    if (nowPlaying && !syncActive) {
      setError(null);
      setIsVideoLoaded(false);
      video.src = `/api/media/${nowPlaying.fileName}`;
      
      const handleCanPlay = () => {
        // Mark loaded; actual playback is controlled strictly by sync_play schedule
        setIsVideoLoaded(true);
      };
      
      const handleError = () => {
        setError('Failed to load video');
        setIsVideoLoaded(false);
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    } else if (!nowPlaying && !syncActive) {
      video.pause();
      setIsPlaying(false);
      setIsVideoLoaded(false);
    }
  }, [nowPlaying, syncPreload, syncPlay]);

  // Handle sync preload: set src and buffer, then report readiness
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !syncPreload) return;
    console.log('[PlayerSync] sync_preload received', { commandId: syncPreload.commandId, videoUrl: syncPreload.videoUrl, now: Date.now() });
    setError(null);
    setIsVideoLoaded(false);
    video.src = syncPreload.videoUrl;
    const onCanPlay = () => {
      setIsVideoLoaded(true);
      const bufferedSecs = video.buffered.length > 0 ? (video.buffered.end(0) - video.currentTime) : 0;
      console.log('[PlayerSync] video canplay', { bufferedSecs, duration: isNaN(video.duration) ? null : video.duration, now: Date.now() });
      websocketService.send({ type: 'client_canplay', payload: { readyAt: Date.now(), bufferedSecs, duration: isNaN(video.duration) ? undefined : video.duration } });
      websocketService.send({
        type: 'sync_ready',
        payload: {
          commandId: syncPreload.commandId,
          bufferLevel: Math.min(1, (bufferedSecs) / 2),
          videoDuration: isNaN(video.duration) ? undefined : video.duration,
        },
      });
    };
    video.addEventListener('canplay', onCanPlay);
    return () => video.removeEventListener('canplay', onCanPlay);
  }, [syncPreload]);

  // Handle sync play: schedule exact start respecting scheduledTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !syncPlay) return;
    const { scheduledTime, videoTime, timeDomain } = syncPlay as { scheduledTime: number; videoTime: number; timeDomain?: 'client' | 'server' };
    // Compute delay depending on domain; default to client-local
    const targetTime = timeDomain === 'server' ? scheduledTime + (useAppStore.getState().lastClockOffsetMs || 0) - (useAppStore.getState().lastClockLatencyMs || 0) : scheduledTime;
    const delay = Math.max(0, targetTime - Date.now());
    console.log('[PlayerSync] sync_play schedule received', { timeDomain: timeDomain || 'client', scheduledTime, localTargetTime: targetTime, videoTime, delayMs: delay, now: Date.now() });
    const timer = window.setTimeout(() => {
      try {
        console.log('[PlayerSync] schedule fired', { now: Date.now() });
        if (!isNaN(videoTime)) {
          video.currentTime = videoTime;
        }
        const before = video.currentTime;
        websocketService.send({ type: 'client_schedule_fired', payload: { firedAt: Date.now(), beforeTime: before } });
        console.log('[PlayerSync] calling video.play()', { currentTime: video.currentTime, now: Date.now() });
        video.play().then(() => {
          console.log('[PlayerSync] video started', { currentTime: video.currentTime, now: Date.now() });
          websocketService.send({ type: 'client_started_playback', payload: { startedAt: Date.now(), videoTime: video.currentTime } });
        }).catch((err: unknown) => {
          const e = err as { name?: string };
          console.warn('[PlayerSync] video.play() rejected', e);
          websocketService.send({ type: 'client_play_rejected', payload: { at: Date.now(), name: e?.name } });
          if (e?.name === 'NotAllowedError') {
            setError('Click to enable video playback');
          } else {
            setError('Failed to play video');
          }
        });
      } catch {/* ignore */}
    }, delay);
    return () => window.clearTimeout(timer);
  }, [syncPlay]);

  // Handle sync pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !syncPause) return;
    const { scheduledTime } = syncPause;
    const delay = Math.max(0, scheduledTime - Date.now());
    console.log('[PlayerSync] sync_pause schedule received', { scheduledTime, delayMs: delay, now: Date.now() });
    const timer = window.setTimeout(() => {
      try {
        console.log('[PlayerSync] pause schedule fired', { now: Date.now(), currentTime: video.currentTime });
        video.pause();
        websocketService.send({ type: 'client_paused', payload: { pausedAt: Date.now(), currentTime: video.currentTime } });
      } catch {/* ignore */}
    }, delay);
    return () => window.clearTimeout(timer);
  }, [syncPause]);

  // Debug overlay updater (self drift vs baseline)
  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
      const video = videoRef.current;
      if (!video || !syncPlay) {
        setSelfDriftMs(0);
        return;
      }
      const s = (syncPlay as { videoTime: number; scheduledTime: number; timeDomain?: 'client' | 'server' });
      const baselineMs = s.timeDomain === 'server'
        ? s.scheduledTime + (useAppStore.getState().lastClockOffsetMs || 0) - (useAppStore.getState().lastClockLatencyMs || 0)
        : s.scheduledTime;
      const expected = s.videoTime + Math.max(0, (Date.now() - baselineMs) / 1000);
      const drift = (video.currentTime || 0) - expected;
      setSelfDriftMs(Math.round(drift * 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [syncPlay]);

  // One-time verbose video event logging to console
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const log = (evt: Event) => {
      const type = evt.type;
      // Log only a subset frequently
      if (type === 'timeupdate' || type === 'progress') return;
      console.log(`[PlayerSync] video event: ${type}`, { now: Date.now(), currentTime: v.currentTime, paused: v.paused, readyState: v.readyState });
    };
    const events = ['loadedmetadata','canplay','playing','pause','seeking','seeked','ended','stalled','suspend','waiting','emptied'];
    events.forEach(e => v.addEventListener(e, log));
    return () => { events.forEach(e => v.removeEventListener(e, log)); };
  }, []);

  const onEnded = () => {
    // Notify server and immediately reset the element so we don't freeze on the last frame
    websocketService.send({ type: 'song_ended' });
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
        // Clear src to release the resource and show the idle UI
        video.removeAttribute('src');
        video.load();
      } catch {/* ignore */}
    }
    setIsPlaying(false);
    setIsVideoLoaded(false);
  };
  

  
  // Get next few singers for display
  const upcomingSingers = queue.slice(0, 3);

  if (playerIsDisconnected) {
    return (
      <div className="player-container bg-gray-800 flex items-center justify-center text-white text-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Player Screen Disconnected</h1>
          <p className="text-xl">Thank you for using KJ-Nomad!</p>
        </div>
      </div>
    );
  }
  
  const ConnectionStatusIndicator = () => {
    const statusConfig = {
      connected: { color: 'bg-green-500', text: 'Connected', icon: <SignalIcon className="h-4 w-4" /> },
      connecting: { color: 'bg-yellow-500', text: 'Connecting...', icon: <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" /> },
      error: { color: 'bg-red-500', text: 'Connection Error', icon: <SignalSlashIcon className="h-4 w-4" /> },
      idle: { color: 'bg-gray-500', text: 'Disconnected', icon: <SignalSlashIcon className="h-4 w-4" /> },
    };
    const currentStatus = statusConfig[connectionStatus];

    return (
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm">
        <div className={clsx("h-3 w-3 rounded-full", currentStatus.color)}></div>
        <span>{currentStatus.text}</span>
      </div>
    );
  };

  return (
    <div className="player-container bg-gradient-to-br from-blue-900 to-slate-900">
      <ConnectionStatusIndicator />
      {playerShowIdentify && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-white text-9xl font-bold">
            {devices.findIndex(d => d.id === playerDeviceId) + 1}
          </div>
        </div>
      )}
      {/* Video Element */}
      {deviceSettings.isVideoPlayerVisible && (
        <video 
          ref={videoRef} 
          className="player-video"
          onEnded={onEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
          muted={!deviceSettings.isAudioEnabled}
          data-testid="video"
        />
      )}
      
      {/* Sidebar */}
      {deviceSettings.isSidebarVisible && (
        <div className="absolute top-0 right-0 h-full w-1/4 bg-black/50 backdrop-blur-md p-4 text-white overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Up Next</h2>
          <div className="space-y-3">
            {upcomingSingers.map((entry) => (
              <div key={entry.song.id} className="bg-white/10 p-3 rounded-lg">
                <p className="font-bold text-lg">{entry.singerName}</p>
                <p className="text-sm opacity-80">{entry.song.title}</p>
              </div>
            ))}
            {upcomingSingers.length === 0 && <p>Queue is empty</p>}
          </div>
        </div>
      )}

      {/* Debug overlay (toggle from KJ Controller) */}
      {playerDebugOverlay && (
        <div className="absolute top-0 left-0 right-0 p-2 text-[12px] font-mono text-green-300 bg-black/40 z-40">
          <div>Local time: {new Date(nowMs).toLocaleTimeString()}</div>
          <div>clientId: {playerConnectionId || 'n/a'}</div>
          <div>currentTime: {videoRef.current ? videoRef.current.currentTime.toFixed(3) : '0.000'} s</div>
          <div>expected: {syncPlay ? (syncPlay.videoTime + Math.max(0, (nowMs - syncPlay.scheduledTime)/1000)).toFixed(3) : 'n/a'} s</div>
          <div>self drift: {selfDriftMs} ms</div>
          {syncPlay && (
            <div>
              schedule: t={new Date((syncPlay.timeDomain === 'server' ? (syncPlay.scheduledTime + (lastClockOffsetMs||0) - (lastClockLatencyMs||0)) : syncPlay.scheduledTime)).toLocaleTimeString()} ({syncPlay.scheduledTime}) v={syncPlay.videoTime.toFixed(3)} d={syncPlay.timeDomain||'client'}
            </div>
          )}
          <div>clock sync: lat={lastClockLatencyMs ?? 0}ms offset={lastClockOffsetMs ?? 0}ms</div>
        </div>
      )}

      {/* Overlay for when no video is playing */}
      {(!nowPlaying || !deviceSettings.isVideoPlayerVisible) && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
                <PlayIcon className="w-16 h-16" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                KJ-Nomad Ready
              </h1>
              <p className="text-xl md:text-2xl text-white/80">
                Waiting for the next performance...
              </p>
            </div>
            
            {upcomingSingers.length > 0 && (
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-semibold mb-4">Up Next:</h2>
                <div className="space-y-2">
                  {upcomingSingers.map((entry) => (
                    <div 
                      key={entry.song.id}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">
                            {entry.singerName}
                          </div>
                          <div className="text-white/80">
                            {entry.song.artist} - {entry.song.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {nowPlaying && !isVideoLoaded && !error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="loading-spinner mb-4"></div>
            <p className="text-xl">Loading video...</p>
            {nowPlaying.singer && (
              <p className="text-lg text-white/80 mt-2">
                Get ready, {nowPlaying.singer}!
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Playback Error</h2>
            <p className="text-lg mb-4">{error}</p>
            {error.includes('Click to enable') && (
              <button 
                onClick={() => {
                  const video = videoRef.current;
                  if (video) {
                    setError(null);
                    video.play().catch((err) => {
                      console.error('Manual play failed:', err);
                      setError('Failed to play video');
                    });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Click to Play
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Now Playing Info */}
      {nowPlaying && isVideoLoaded && nowPlaying.singer && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg" data-testid="now-playing">
          <div className="font-semibold text-lg">
            Now Singing: {nowPlaying.singer}
          </div>
          {!nowPlaying.isFiller && (
            <div className="text-sm text-white/80">
              Song #{queue.length > 0 ? queue.length + 1 : 1}
            </div>
          )}
        </div>
      )}
      
      {/* Filler Music Indicator */}
      {nowPlaying?.isFiller && (
        <div className="absolute top-4 right-4 bg-yellow-500/80 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-lg font-semibold">
          Intermission Music
        </div>
      )}
      
      {/* Ticker */}
      {deviceSettings.isTickerVisible && <Ticker text={tickerText} />}
    </div>
  );
};

export default PlayerPage;
