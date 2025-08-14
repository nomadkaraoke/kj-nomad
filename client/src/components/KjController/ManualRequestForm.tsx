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
  const [selectedYt, setSelectedYt] = useState<{ id: string; title?: string; channel?: string } | null>(null);
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
    if (!singerName.trim()) return;
    if (selectedSong) {
      requestSong(selectedSong, singerName);
      setSingerName('');
      setSearchQuery('');
      setSelectedSong(null);
      setSelectedYt(null);
      setYtQuery('');
      return;
    }
    if (selectedYt) {
      const ws = useAppStore.getState().socket;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'request_youtube_song', payload: { videoId: selectedYt.id, singerName } }));
      }
      setSingerName('');
      setYtQuery('');
      setSelectedYt(null);
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

  const selectYouTubeById = (videoId: string, label?: { title?: string; channel?: string }) => {
    setSelectedYt({ id: videoId, title: label?.title, channel: label?.channel });
    setYtResults([]);
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
            onBlur={() => setTimeout(() => setSearchResults([]), 120)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddToQueue(); }}
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
        <hr className="my-4 opacity-20" />
        <h3 className="text-lg font-semibold">YouTube</h3>
        <div className="grid gap-2">
          <input
            type="text"
            value={ytQuery}
            onChange={(e) => {
              const v = e.target.value; setYtQuery(v); const id = extractYouTubeId(v); if (id) { setSelectedYt({ id }); setYtResults([]); } else { searchYouTube(v); setSelectedYt(null); }
            }}
            placeholder="Search YouTube (channel: title) or paste URL"
            className="input-primary w-full"
            onBlur={() => setTimeout(() => setYtResults([]), 120)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddToQueue(); }}
          />
          {ytResults.length > 0 && (
            <ul className="bg-card-light dark:bg-card-dark rounded border max-h-56 overflow-auto">
              {ytResults.map(r => (
                <li key={r.id} className="px-3 py-2 hover:bg-bg-light dark:hover:bg-bg-dark cursor-pointer" onClick={() => selectYouTubeById(r.id, { title: r.title, channel: r.channel })}>
                  {r.channel}: {r.title}
                </li>
              ))}
            </ul>
          )}
          {selectedYt && (
            <div className="text-sm opacity-80">Selected YouTube: {selectedYt.channel ? `${selectedYt.channel}: ` : ''}{selectedYt.title || selectedYt.id}</div>
          )}
        </div>

        <button
          onClick={handleAddToQueue}
          disabled={(singerName.trim() === '') || (!selectedSong && !selectedYt)}
          className="btn-primary w-full"
        >
          Add to Queue
        </button>
      </div>
    </div>
  );
};
