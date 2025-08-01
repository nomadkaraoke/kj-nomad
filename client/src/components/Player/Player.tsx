import React, { useRef, useEffect } from 'react';

interface PlayerProps {
  nowPlaying: { songId: string } | null;
}

const Player: React.FC<PlayerProps> = ({ nowPlaying }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (nowPlaying) {
        // This assumes a predictable mapping from songId to fileName
        // A better approach would be to get the fileName from the song object
      video.src = `/api/media/${nowPlaying.fileName}`;
      video.play();
    } else {
      video.pause();
    }
  }, [nowPlaying]);

  return (
    <div>
      <h2>Player View</h2>
      <video ref={videoRef} width="100%"></video>
    </div>
  );
};

export default Player;
