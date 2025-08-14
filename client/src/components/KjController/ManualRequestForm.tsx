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
  const [ytQuery, setYtQuery] = useState('');
  const [ytResults, setYtResults] = useState<Array<{ id: string; title: string; channel: string }>>([]);
  const [ytUrl, setYtUrl] = useState('');
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
    // Show raw filename to avoid implying any naming convention
    setSearchQuery(song.fileName);
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

  const searchYouTube = useMemo(
    () => debounce(async (q: string) => {
      if (!q.trim()) { setYtResults([]); return; }
      try {
        const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}&limit=5`);
        type YtItem = { id: string; title: string; channel: string };
        type YtSearchResponse = { success?: boolean; data?: YtItem[] };
        const data = (await resp.json()) as unknown as YtSearchResponse;
        if (data?.success && Array.isArray(data.data)) {
          setYtResults(data.data.map((r) => ({ id: r.id, title: r.title, channel: r.channel })));
        } else {
          setYtResults([]);
        }
      } catch { setYtResults([]); }
    }, 300),
    []
  );

  const requestYouTubeById = (videoId: string) => {
    const ws = useAppStore.getState().socket;
    if (!ws || ws.readyState !== WebSocket.OPEN || !singerName.trim()) return;
    ws.send(JSON.stringify({ type: 'request_youtube_song', payload: { videoId, singerName } }));
    setYtResults([]);
    setYtQuery('');
    setYtUrl('');
    setSingerName('');
  };

  const extractYouTubeId = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
      if (u.hostname === 'youtu.be') return u.pathname.replace('/', '') || null;
    } catch {/* ignore */}
    return null;
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
                  {song.fileName}
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

        <hr className="my-4 opacity-20" />
        <h3 className="text-lg font-semibold">YouTube</h3>
        <div className="grid gap-2">
          <input
            type="text"
            value={ytQuery}
            onChange={(e) => { setYtQuery(e.target.value); searchYouTube(e.target.value); }}
            placeholder="Search YouTube (channel: title)"
            className="input-primary w-full"
          />
          {ytResults.length > 0 && (
            <ul className="bg-card-light dark:bg-card-dark rounded border max-h-56 overflow-auto">
              {ytResults.map(r => (
                <li key={r.id} className="px-3 py-2 hover:bg-bg-light dark:hover:bg-bg-dark cursor-pointer" onClick={() => requestYouTubeById(r.id)}>
                  {r.channel}: {r.title}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              placeholder="Or paste a YouTube link"
              className="input-primary flex-1"
            />
            <button
              className="btn-secondary"
              disabled={!singerName.trim() || !extractYouTubeId(ytUrl)}
              onClick={() => { const id = extractYouTubeId(ytUrl); if (id) requestYouTubeById(id); }}
            >
              Add from Link
            </button>
          </div>
          <p className="text-xs opacity-70">Assign to singer above, then search or paste a link.</p>
        </div>
      </div>
    </div>
  );
};
