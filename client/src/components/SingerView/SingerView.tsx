import React, { useState, useEffect } from 'react';

interface Song {
  id: string;
  artist: string;
  title: string;
  fileName: string;
}

interface SingerViewProps {
    socket: WebSocket | { send: (data: string) => void } | null;
}

const SingerView: React.FC<SingerViewProps> = ({ socket }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [singerName, setSingerName] = useState('');

  useEffect(() => {
    const fetchSongs = async () => {
      const response = await fetch(`/api/songs?q=${searchQuery}`);
      const data = await response.json();
      setSongs(data);
    };

    fetchSongs();
  }, [searchQuery]);

  const requestSong = (songId: string) => {
    if (socket && singerName) {
        socket.send(JSON.stringify({ type: 'request_song', payload: { songId, singerName } }));
    } else {
        alert('Please enter your name');
    }
  };

  return (
    <div>
      <h2>Singer Request View</h2>
      <input
        type="text"
        placeholder="Your Name"
        value={singerName}
        onChange={(e) => setSingerName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Search for a song..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <ul>
        {songs.map((song) => (
          <li key={song.id}>
            {song.artist} - {song.title}
            <button onClick={() => requestSong(song.id)}>Request</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SingerView;
