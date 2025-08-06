import React, { useState, useEffect } from 'react';
import OnlineSessionManager from './OnlineSessionManager';
import { Input } from '../ui/Input';

interface Song {
  id: string;
  artist: string;
  title: string;
  fileName?: string;
  source: 'local' | 'youtube';
  duration?: string;
  thumbnail?: string;
  downloadStatus?: 'pending' | 'downloading' | 'ready' | 'error';
  downloadProgress?: number;
}

interface QueueEntry {
  id: string;
  song: Song;
  singerName: string;
  requestedAt: string;
  position: number;
  estimatedWaitTime?: string;
}

interface SessionData {
  sessionId: string;
  kjName?: string;
  venue?: string;
  status: 'active' | 'ended';
  hasLocalLibrary: boolean;
  allowYouTube: boolean;
  connectedClients: number;
  playerScreens: number;
}

/**
 * Online Singer View Component
 * Provides song request interface for singers in Online Mode
 */
const OnlineSingerView: React.FC = () => {
  const [singerName, setSingerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  // Load singer name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('kj-nomad-singer-name');
    if (savedName) {
      setSingerName(savedName);
    }
  }, []);

  // Save singer name to localStorage
  useEffect(() => {
    if (singerName) {
      localStorage.setItem('kj-nomad-singer-name', singerName);
    }
  }, [singerName]);

  // Listen for WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      const message = event.detail;
      
      switch (message.type) {
        case 'queue_updated':
          setQueue(message.payload || []);
          break;
        case 'song_request_confirmed':
          setRequestStatus('Song request confirmed! Check the queue below.');
          setTimeout(() => setRequestStatus(null), 5000);
          break;
        case 'song_request_error':
          setRequestStatus(`Error: ${message.payload?.error || 'Failed to request song'}`);
          setTimeout(() => setRequestStatus(null), 5000);
          break;
        case 'download_progress':
          // Update download progress for YouTube songs
          setSongs(prev => prev.map(song => 
            song.id === message.payload?.songId 
              ? { ...song, downloadProgress: message.payload.progress }
              : song
          ));
          break;
        case 'download_complete':
          // Mark YouTube song as ready
          setSongs(prev => prev.map(song => 
            song.id === message.payload?.songId 
              ? { ...song, downloadStatus: 'ready', downloadProgress: 100 }
              : song
          ));
          break;
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage as EventListener);
    
    return () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage as EventListener);
    };
  }, []);

  const searchSongs = async (query: string, sessionData: SessionData | null) => {
    if (!query.trim()) {
      setSongs([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Search both local library and YouTube if enabled
      const searchPromises = [];
      
      // Local library search
      searchPromises.push(
        fetch(`/api/songs?q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then((results: Song[]) => results.map((song) => ({
            ...song,
            source: 'local' as const
          })))
      );
      
      // YouTube search if enabled
      if (sessionData?.allowYouTube) {
        searchPromises.push(
          fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&limit=10`)
            .then(res => res.json())
            .then((results: { success: boolean; data: Song[] }) => (results.success ? results.data : []).map((song) => ({
              ...song,
              source: 'youtube' as const,
              downloadStatus: 'pending' as const
            })))
            .catch(() => []) // Fallback to empty array if YouTube search fails
        );
      }
      
      const results = await Promise.all(searchPromises);
      const combinedResults = results.flat();
      
      // Sort results: local songs first, then YouTube
      combinedResults.sort((a, b) => {
        if (a.source === 'local' && b.source === 'youtube') return -1;
        if (a.source === 'youtube' && b.source === 'local') return 1;
        return 0;
      });
      
      setSongs(combinedResults);
      
    } catch (error) {
      console.error('Search error:', error);
      setRequestStatus('Search failed. Please try again.');
      setTimeout(() => setRequestStatus(null), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  const requestSong = (song: Song, sessionData: SessionData | null) => {
    if (!singerName.trim()) {
      setRequestStatus('Please enter your name first.');
      setTimeout(() => setRequestStatus(null), 3000);
      return;
    }

    // Send song request via WebSocket
    const message = {
      type: 'request_song',
      payload: {
        songId: song.id,
        singerName: singerName.trim(),
        source: song.source,
        sessionId: sessionData?.sessionId
      }
    };

    // Dispatch custom event that will be picked up by OnlineSessionManager
    window.dispatchEvent(new CustomEvent('send-websocket-message', { 
      detail: message 
    }));

    setRequestStatus('Sending request...');
    
    // Clear search after successful request
    setSearchQuery('');
    setSongs([]);
  };

  const getQueuePosition = (singerName: string): number | null => {
    const singerEntries = queue.filter(entry => 
      entry.singerName.toLowerCase() === singerName.toLowerCase()
    );
    
    if (singerEntries.length === 0) return null;
    
    return Math.min(...singerEntries.map(entry => entry.position));
  };

  const getSingerSongsInQueue = (singerName: string): QueueEntry[] => {
    return queue.filter(entry => 
      entry.singerName.toLowerCase() === singerName.toLowerCase()
    );
  };

  return (
    <OnlineSessionManager>
      {(sessionData, isLoading, error) => {
        if (isLoading) {
          return (
            <div className="min-h-screen bg-bg-dark text-text-primary-dark flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink mx-auto mb-4"></div>
                <p>Connecting to session...</p>
              </div>
            </div>
          );
        }

        if (error) {
          return (
            <div className="min-h-screen bg-bg-dark text-text-primary-dark flex items-center justify-center">
              <div className="card max-w-md mx-auto p-6 bg-red-500/10 border-red-500">
                <h2 className="text-xl font-bold text-red-400 mb-4">Connection Error</h2>
                <p className="text-red-300 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn-primary w-full bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          );
        }

        if (!sessionData) {
          return (
            <div className="min-h-screen bg-bg-dark text-text-primary-dark flex items-center justify-center">
              <div className="card max-w-md mx-auto p-6">
                <h2 className="text-xl font-bold mb-4">Session Not Found</h2>
                <p className="text-text-secondary-dark mb-4">
                  The session you're looking for doesn't exist or has ended.
                </p>
                <button 
                  onClick={() => window.location.href = 'https://sing.nomadkaraoke.com'} 
                  className="btn-primary w-full"
                >
                  Enter New Session
                </button>
              </div>
            </div>
          );
        }

        const queuePosition = getQueuePosition(singerName);
        const mySongs = getSingerSongsInQueue(singerName);

        return (
          <div className="min-h-screen bg-bg-dark text-text-primary-dark">
            <div className="container mx-auto px-4 py-6">
              {/* Header */}
              <div className="mb-6">
                <h1 className="font-display text-4xl text-center mb-2">
                  🎤 Request a Song
                </h1>
                <div className="text-center text-text-secondary-dark">
                  <p>Session: <span className="text-brand-pink font-mono">{sessionData.sessionId}</span></p>
                  {sessionData.venue && (
                    <p>Venue: <span className="text-green-400">{sessionData.venue}</span></p>
                  )}
                </div>
              </div>

              {/* Singer Name Input */}
              <div className="card mb-6 p-4">
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={singerName}
                  onChange={(e) => setSingerName(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Queue Status */}
              {singerName && mySongs.length > 0 && (
                <div className="card mb-6 p-4 bg-green-500/10 border-green-500">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">
                    Your Songs in Queue
                  </h3>
                  {queuePosition && (
                    <p className="text-green-300 mb-3">
                      Next up at position #{queuePosition}
                    </p>
                  )}
                  <div className="space-y-2">
                    {mySongs.map((entry) => (
                      <div key={entry.id} className="flex justify-between items-center">
                        <span>
                          {entry.song.artist} - {entry.song.title}
                        </span>
                        <span className="text-green-400">#{entry.position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {requestStatus && (
                <div className="card mb-6 p-4 bg-brand-blue/20 border-brand-pink">
                  <p className="text-brand-pink">{requestStatus}</p>
                </div>
              )}

              {/* Song Search */}
              <div className="card mb-6 p-4">
                <label className="block text-sm font-medium mb-2">Search for Songs</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search by artist or song title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        searchSongs(searchQuery, sessionData);
                      }
                    }}
                    className="flex-1"
                  />
                  <button 
                    onClick={() => searchSongs(searchQuery, sessionData)}
                    disabled={isSearching || !searchQuery.trim()}
                    className="btn-primary px-6"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {sessionData.allowYouTube && (
                  <p className="text-sm text-text-secondary-dark mt-2">
                    💡 Searches both local library and YouTube
                  </p>
                )}
              </div>

              {/* Search Results */}
              {songs.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-lg font-semibold mb-4">Search Results</h3>
                  <div className="space-y-3">
                    {songs.map((song) => (
                      <div 
                        key={`${song.source}-${song.id}`}
                        className="flex items-center justify-between p-3 bg-card-dark rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{song.artist} - {song.title}</span>
                            {song.source === 'youtube' && (
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                                YouTube
                              </span>
                            )}
                            {song.source === 'local' && (
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                Local
                              </span>
                            )}
                          </div>
                          {song.duration && (
                            <p className="text-sm text-text-secondary-dark">{song.duration}</p>
                          )}
                          {song.downloadStatus === 'downloading' && song.downloadProgress && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${song.downloadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-text-secondary-dark mt-1">
                                Downloading... {song.downloadProgress}%
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => requestSong(song, sessionData)}
                          disabled={!singerName.trim() || song.downloadStatus === 'downloading'}
                          className="btn-primary ml-4"
                        >
                          {song.downloadStatus === 'downloading' ? 'Downloading...' : 'Request'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Queue Display */}
              {queue.length > 0 && (
                <div className="card mt-6 p-4">
                  <h3 className="text-lg font-semibold mb-4">Current Queue</h3>
                  <div className="space-y-2">
                    {queue.slice(0, 10).map((entry, index) => (
                      <div 
                        key={entry.id}
                        className={`flex justify-between items-center p-2 rounded ${
                          entry.singerName.toLowerCase() === singerName.toLowerCase()
                            ? 'bg-brand-blue/30 border border-brand-pink'
                            : 'bg-card-dark'
                        }`}
                      >
                        <div>
                          <span className="font-medium">
                            {entry.song.artist} - {entry.song.title}
                          </span>
                          <span className="text-text-secondary-dark ml-2">by {entry.singerName}</span>
                        </div>
                        <span className="text-text-secondary-dark">#{index + 1}</span>
                      </div>
                    ))}
                    {queue.length > 10 && (
                      <p className="text-center text-text-secondary-dark text-sm">
                        ... and {queue.length - 10} more songs
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </OnlineSessionManager>
  );
};

export default OnlineSingerView;
