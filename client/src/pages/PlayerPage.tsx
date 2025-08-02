import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import Ticker from '../components/Player/Ticker';
import { 
  PlayIcon
} from '@heroicons/react/24/outline';

const PlayerPage: React.FC = () => {
  const { nowPlaying, tickerText, queue } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  return (
    <div className="player-container">
      {/* Video Element */}
      <video 
        ref={videoRef} 
        className="player-video"
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        muted={false}
        data-testid="video"
      />
      
      {/* Overlay for when no video is playing */}
      {!nowPlaying && (
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
                  {upcomingSingers.map((entry, index) => (
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
                        <div className="text-2xl font-bold text-yellow-400">
                          #{index + 1}
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
      <Ticker text={tickerText} />
    </div>
  );
};

export default PlayerPage;