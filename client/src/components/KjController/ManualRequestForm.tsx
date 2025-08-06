import React, { useState, useMemo } from 'react';
import { useAppStore, type Song } from '../../store/appStore';

// A fully generic debounce function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = <F extends (...args: any[]) => any>(
  func: F,
  delay: number,
): ((...args: Parameters<F>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export const ManualRequestForm: React.FC = () => {
  const [singerName, setSingerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const { requestSong } = useAppStore();

  // useMemo is used here to ensure that the debounced function is created only once
  // and persists across re-renders. This provides a stable function reference,
  // resolving the exhaustive-deps linting rule.
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.trim() === '') {
          setSearchResults([]);
          return;
        }
        try {
          const response = await fetch(
            `/api/songs?q=${encodeURIComponent(query)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
          } else {
            console.error('Search failed:', response.statusText);
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Search request failed:', error);
          setSearchResults([]); // Clear results on error
        }
      }, 300),
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    debouncedSearch(newQuery);
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setSearchQuery(`${song.artist} - ${song.title}`);
    setSearchResults([]);
  };

  const handleAddToQueue = () => {
    if (selectedSong && singerName.trim() !== '') {
      requestSong(selectedSong, singerName);
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
            onChange={handleSearchChange}
            placeholder="Search for a song..."
            className="input-primary w-full"
          />
          {searchResults.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-10 w-full bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg mt-1 max-h-60 overflow-y-auto"
            >
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
