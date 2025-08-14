import React, { useRef, useEffect, useState } from 'react';
import Ticker from './Ticker';
import { useAppStore } from '../../store/appStore';

interface PlayerProps {
  nowPlaying: { songId?: string, fileName: string, isFiller: boolean } | null;
  socket: WebSocket | null;
  tickerText: string;
}

const Player: React.FC<PlayerProps> = ({ nowPlaying, socket, tickerText }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugOverlay = useAppStore((s) => s.playerDebugOverlay);
  const syncPlay = useAppStore((s) => s.syncPlay);
  const [selfDriftMs, setSelfDriftMs] = useState<number>(0);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (nowPlaying) {
      video.src = `/api/media/${nowPlaying.fileName}`;
      video.play().catch((err) => {
        console.error('Failed to play video:', err);
      });
    } else {
      video.pause();
    }
  }, [nowPlaying]);

  useEffect(() => {
    const id = setInterval(() => {
      const video = videoRef.current;
      setNowMs(Date.now());
      if (!video) return;
      if (syncPlay) {
        const expected = syncPlay.videoTime + Math.max(0, (Date.now() - syncPlay.scheduledTime) / 1000);
        const drift = (video.currentTime || 0) - expected;
        setSelfDriftMs(Math.round(drift * 1000));
      } else {
        setSelfDriftMs(0);
      }
    }, 250);
    return () => clearInterval(id);
  }, [syncPlay]);

  const onEnded = () => {
    if(socket) {
        if(nowPlaying?.isFiller) {
            socket.send(JSON.stringify({ type: 'song_ended' }));
        } else {
            socket.send(JSON.stringify({ type: 'song_ended' }));
        }
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%'}}>
      <video ref={videoRef} width="100%" height="100%" onEnded={onEnded}></video>
      {debugOverlay && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px', fontFamily: 'monospace', fontSize: 12, color: 'lime', background: 'rgba(0,0,0,0.35)' }}>
          <div>Local time: {new Date(nowMs).toLocaleTimeString()}</div>
          <div>currentTime: {videoRef.current ? videoRef.current.currentTime.toFixed(3) : '0.000'} s</div>
          <div>expected: {syncPlay ? (syncPlay.videoTime + Math.max(0, (nowMs - syncPlay.scheduledTime)/1000)).toFixed(3) : 'n/a'} s</div>
          <div>self drift: {selfDriftMs} ms</div>
        </div>
      )}
      {nowPlaying && (
        <div data-testid="now-playing" style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px' }}>
          Now Playing: {nowPlaying.fileName}
        </div>
      )}
      <Ticker text={tickerText} />
    </div>
  );
};

export default Player;
