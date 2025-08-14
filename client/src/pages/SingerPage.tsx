import React, { useState, useEffect } from 'react';
import { Input } from '../components/ui/Input';
import { useAppStore } from '../store/appStore';
import { 
  MicrophoneIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Song {
  id: string;
  artist: string;
  title: string;
  fileName: string;
}

const SingerPage: React.FC = () => {
  const { connectionStatus, requestSong, queue } = useAppStore();
  const [singerName, setSingerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  // Load singer name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('kj-nomad-singer-name');
    if (savedName) {
      setSingerName(savedName);
    }
  }, []);
  
  // Save singer name to localStorage
  useEffect(() => {
    if (singerName.trim()) {
      localStorage.setItem('kj-nomad-singer-name', singerName.trim());
    }
  }, [singerName]);
  
  // Search for songs
  useEffect(() => {
    const searchSongs = async () => {
      if (!searchQuery.trim()) {
        setSongs([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const response = await fetch(`/api/songs?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const results = await response.json();
          setSongs(results);
        } else {
          setSongs([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSongs([]);
      }
      setIsSearching(false);
    };
    
    const debounceTimer = setTimeout(searchSongs, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);
  
  const isConnected = connectionStatus === 'connected';

  const handleRequestSong = (songId: string, songTitle: string, artist: string) => {
    if (!singerName.trim()) {
      setRequestStatus({
        type: 'error',
        message: 'Please enter your name first!'
      });
      return;
    }
    
    if (!isConnected) {
      setRequestStatus({
        type: 'error',
        message: 'Not connected to server. Please try again.'
      });
      return;
    }
    
    // Check if singer is already in queue
    const existingEntry = queue.find(entry => 
      entry.singerName.toLowerCase() === singerName.trim().toLowerCase()
    );
    
    if (existingEntry) {
      setRequestStatus({
        type: 'error',
        message: 'You already have a song in the queue!'
      });
      return;
    }
    
    requestSong(songId, singerName.trim());
    
    setRequestStatus({
      type: 'success',
      message: `"${songTitle}" by ${artist} has been added to the queue!`
    });
    
    // Clear search and show success
    setSearchQuery('');
    setSongs([]);
    
    // Clear status after 5 seconds
    setTimeout(() => {
      setRequestStatus({ type: null, message: '' });
    }, 5000);
  };
  
  const myQueuePosition = queue.findIndex(entry => 
    entry.singerName.toLowerCase() === singerName.trim().toLowerCase()
  );
  
  const hasActiveRequest = myQueuePosition !== -1;
  
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-full">
            <MicrophoneIcon className="h-12 w-12 text-brand-blue dark:text-brand-pink" />
          </div>
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-2">
          Search for a song
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Search for your favorite karaoke songs and add yourself to the queue
        </p>
      </div>
      
      {/* Connection Status */}
      {!isConnected && (
        <div className="card border-red-500/50 bg-red-500/10">
          <div className="flex items-center space-x-3 text-red-700 dark:text-red-300">
            <ExclamationCircleIcon className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Connection Issue</h3>
              <p className="text-sm">Unable to connect to the karaoke system. Please try again later.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Request Status */}
      {requestStatus.type && (
        <div className={`card ${
          requestStatus.type === 'success' 
            ? 'border-green-500/50 bg-green-500/10'
            : 'border-red-500/50 bg-red-500/10'
        }`}>
          <div className={`flex items-center space-x-3 ${
            requestStatus.type === 'success' 
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {requestStatus.type === 'success' ? (
              <CheckCircleIcon className="h-6 w-6" />
            ) : (
              <ExclamationCircleIcon className="h-6 w-6" />
            )}
            <p className="font-medium">{requestStatus.message}</p>
          </div>
        </div>
      )}
      
      {/* Your Queue Status */}
      {hasActiveRequest && (
        <div className="card border-2 border-brand-yellow bg-brand-yellow/10">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-yellow mb-2">
              #{myQueuePosition + 1}
            </div>
            <h3 className="text-lg font-semibold">
              You're in the queue!
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              {myQueuePosition === 0 ? "You're up next!" : `${myQueuePosition} singers ahead of you`}
            </p>
            <div className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Song: {queue[myQueuePosition]?.song.fileName}
            </div>
          </div>
        </div>
      )}
      
      {/* Singer Info */}
      <div className="card">
        <h2 className="text-xl font-semibold flex items-center space-x-2 mb-4">
          <UserIcon className="h-5 w-5" />
          <span>Singer Information</span>
        </h2>
        <Input
          label="Your Name"
          value={singerName}
          onChange={(e) => setSingerName(e.target.value)}
          placeholder="Enter your name..."
          hint="This will be displayed when you sing"
          leftIcon={<UserIcon className="h-5 w-5" />}
          data-testid="singer-name-input"
        />
      </div>
      
      {/* Song Search */}
      {!hasActiveRequest && (
        <div className="card">
          <h2 className="text-xl font-semibold flex items-center space-x-2 mb-4">
            <MusicalNoteIcon className="h-5 w-5" />
            <span>Find Your Song</span>
          </h2>
          <div className="space-y-4">
            <Input
              label="Search Songs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artist or song title..."
              hint="Start typing to see available songs"
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              disabled={!isConnected || !singerName.trim()}
              data-testid="song-search-input"
            />
            
            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-4">
                <div className="loading-spinner mx-auto mb-2"></div>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">Searching...</p>
              </div>
            )}
            
            {!isSearching && searchQuery && songs.length === 0 && (
              <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No songs found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
            
            {songs.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {songs.map((song) => (
                  <div
                    key={song.id}
                    data-testid="song-result"
                    className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {song.fileName}
                        </h4>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark truncate">
                          
                        </p>
                      </div>
                      <button
                        onClick={() => handleRequestSong(song.id, song.title, song.artist)}
                        className="btn-primary text-sm py-2 px-4"
                        disabled={!singerName.trim() || !isConnected}
                        data-testid="request-song-button"
                      >
                        Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Current Queue Preview */}
      {queue.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Current Queue ({queue.length} singers)</h2>
          <div className="space-y-2">
            {queue.slice(0, 5).map((entry, index) => (
              <div
                key={`${entry.song.id}-${entry.queuedAt}`}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  index === 0 
                    ? 'bg-brand-yellow/20 border border-brand-yellow/50'
                    : 'bg-bg-light dark:bg-card-dark'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0
                    ? 'bg-brand-yellow text-bg-dark'
                    : 'bg-gray-300 dark:bg-border-dark text-text-secondary-light dark:text-text-secondary-dark'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {entry.singerName}
                  </p>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                   {entry.song.fileName}
                  </p>
                </div>
                {index === 0 && (
                  <span className="text-xs font-medium text-brand-yellow bg-brand-yellow/20 px-2 py-1 rounded">
                    Up Next
                  </span>
                )}
              </div>
            ))}
            
            {queue.length > 5 && (
              <div className="text-center text-text-secondary-light dark:text-text-secondary-dark text-sm py-2">
                ... and {queue.length - 5} more singers
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingerPage;
