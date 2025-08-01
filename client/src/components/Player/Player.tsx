import React, { useRef, useEffect } from 'react';
import Ticker from './Ticker';

interface PlayerProps {
  nowPlaying: { songId?: string, fileName: string, isFiller: boolean } | null;
  socket: WebSocket | null;
  tickerText: string;
}

const Player: React.FC<PlayerProps> = ({ nowPlaying, socket, tickerText }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (nowPlaying) {
      video.src = `/api/media/${nowPlaying.fileName}`;
      video.play();
    } else {
      video.pause();
    }
  }, [nowPlaying]);

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
      <Ticker text={tickerText} />
    </div>
  );
};

export default Player;
