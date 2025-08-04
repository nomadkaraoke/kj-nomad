import React, { useRef, useEffect, useState } from 'react';
import { UAParser } from 'ua-parser-js';
import { useAppStore } from '../store/appStore';
import type { Device } from '../store/appStore';
import Ticker from '../components/Player/Ticker';
import { websocketService } from '../services/websocketService';
import { PlayIcon } from '@heroicons/react/24/outline';

const PlayerPage: React.FC = () => {
  const { nowPlaying, tickerText, queue, devices, connectionStatus } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceSettings, setDeviceSettings] = useState<Partial<Device>>({
    isAudioEnabled: true,
    isTickerVisible: true,
    isSidebarVisible: false,
    isVideoPlayerVisible: true,
  });
  const [showIdentify, setShowIdentify] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      const parser = new UAParser(navigator.userAgent);
      const result = parser.getResult();
      
      websocketService.send({
        type: 'client_identify',
        payload: {
          type: 'player',
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          os: `${result.os.name} ${result.os.version}`,
          browser: `${result.browser.name} ${result.browser.version}`,
          isApp: 'kj-nomad' in window,
        },
      });
    }
  }, [connectionStatus]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.type === 'device_registered') {
        setDeviceId(message.payload.deviceId);
      } else if (message.type === 'identify_screen' && message.payload.deviceId === deviceId) {
        setShowIdentify(true);
        setTimeout(() => setShowIdentify(false), 5000);
      } else if (message.type === 'disconnect_screen' && message.payload.deviceId === deviceId) {
        setIsDisconnected(true);
        websocketService.disconnect();
      }
    };

    const socket = useAppStore.getState().socket;
    socket?.addEventListener('message', handleMessage);
    return () => {
      socket?.removeEventListener('message', handleMessage);
    };
  }, [deviceId]);

  useEffect(() => {
    const myDevice = devices.find(d => d.id === deviceId);
    if (myDevice) {
      setDeviceSettings({
        isAudioEnabled: myDevice.isAudioEnabled,
        isTickerVisible: myDevice.isTickerVisible,
        isSidebarVisible: myDevice.isSidebarVisible,
        isVideoPlayerVisible: myDevice.isVideoPlayerVisible,
      });
    }
  }, [devices, deviceId]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (nowPlaying) {
      setError(null);
      setIsVideoLoaded(false);
      video.src = `/api/media/${nowPlaying.fileName}`;
      
      const handleCanPlay = () => {
        setIsVideoLoaded(true);
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.error('Failed to play video:', err);
          if (err.name === 'NotAllowedError') {
            setError('Click to enable video playback');
          } else {
            setError('Failed to play video');
          }
        });
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
    } else {
      video.pause();
      setIsPlaying(false);
      setIsVideoLoaded(false);
    }
  }, [nowPlaying]);

  const onEnded = () => {
    if (nowPlaying) {
      // Send song ended event to trigger next song or filler
      // This should be handled by the WebSocket service
      console.log('Song ended, should trigger next song');
    }
    setIsPlaying(false);
  };
  

  
  // Get next few singers for display
  const upcomingSingers = queue.slice(0, 3);

  if (isDisconnected) {
    return (
      <div className="player-container bg-gray-800 flex items-center justify-center text-white text-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Player Screen Disconnected</h1>
          <p className="text-xl">Thanks for using KJ-Nomad.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="player-container bg-gradient-to-br from-blue-900 to-slate-900">
      {showIdentify && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-white text-9xl font-bold">
            {devices.findIndex(d => d.id === deviceId) + 1}
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
