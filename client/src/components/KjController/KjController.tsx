import React from 'react';

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

interface KjControllerProps {
  socket: WebSocket | null;
  queue: QueueEntry[];
}

const KjController: React.FC<KjControllerProps> = ({ socket, queue }) => {
  const playNextSong = () => {
    const nextSong = queue[0];
    if (socket && nextSong) {
      socket.send(JSON.stringify({ type: 'play', payload: { songId: nextSong.song.id, fileName: nextSong.song.fileName } }));
      // Optimistically remove from queue
      socket.send(JSON.stringify({ type: 'remove_from_queue', payload: { songId: nextSong.song.id } }));
    }
  };

  return (
    <div>
      <h2>KJ Controller</h2>
      <button onClick={playNextSong}>Play Next</button>
      <button onClick={() => socket?.send(JSON.stringify({ type: 'pause' }))}>Pause</button>
      <h3>Queue</h3>
      <ul>
        {queue.map((entry, index) => (
          <li key={index}>
            {entry.song.artist} - {entry.song.title} ({entry.singerName})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KjController;
