import React, { useState } from 'react';
import { useAppStore, type Song } from '../../store/appStore';

export const ManualRequestForm: React.FC = () => {
  const [singerName, setSingerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const { requestSong } = useAppStore();

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const response = await fetch(`/api/songs?q=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();
    setSearchResults(data);
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setSearchQuery(`${song.artist} - ${song.title}`);
    setSearchResults([]);
  };

  const handleAddToQueue = () => {
    if (selectedSong && singerName.trim() !== '') {
      requestSong(selectedSong.id, singerName);
      setSingerName('');
      setSearchQuery('');
      setSelectedSong(null);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Add Manual Request</h2>
      <div className="space-y-4">
        <input
          type="text"
          value={singerName}
          onChange={(e) => setSingerName(e.target.value)}
          placeholder="Singer Name"
          className="input-primary w-full"
        />
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch();
            }}
            placeholder="Search for a song..."
            className="input-primary w-full"
          />
          {searchResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg mt-1 max-h-60 overflow-y-auto">
              {searchResults.map((song) => (
                <li
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className="px-4 py-2 hover:bg-bg-light dark:hover:bg-bg-dark cursor-pointer"
                >
                  {song.artist} - {song.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={handleAddToQueue}
          disabled={!selectedSong || singerName.trim() === ''}
          className="btn-primary w-full"
        >
          Add to Queue
        </button>
      </div>
    </div>
  );
};
