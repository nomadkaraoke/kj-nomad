import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Layout';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
  const { isConnected, requestSong, queue } = useAppStore();
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
    <Container size="md" className="py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            <MicrophoneIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Song Requests
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Search for your favorite karaoke songs and add yourself to the queue
        </p>
      </div>
      
      {/* Connection Status */}
      {!isConnected && (
        <Card variant="bordered" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent>
            <div className="flex items-center space-x-3 text-red-800 dark:text-red-200">
              <ExclamationCircleIcon className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Connection Issue</h3>
                <p className="text-sm">Unable to connect to the karaoke system. Please try again later.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Request Status */}
      {requestStatus.type && (
        <Card variant="bordered" className={
          requestStatus.type === 'success' 
            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
            : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
        }>
          <CardContent>
            <div className={`flex items-center space-x-3 ${
              requestStatus.type === 'success' 
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {requestStatus.type === 'success' ? (
                <CheckCircleIcon className="h-6 w-6" />
              ) : (
                <ExclamationCircleIcon className="h-6 w-6" />
              )}
              <p className="font-medium">{requestStatus.message}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Your Queue Status */}
      {hasActiveRequest && (
        <Card variant="elevated" className="border-2 border-accent-300 dark:border-accent-600 bg-accent-50 dark:bg-accent-900/20">
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600 dark:text-accent-400 mb-2">
                #{myQueuePosition + 1}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                You're in the queue!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {myQueuePosition === 0 ? "You're up next!" : `${myQueuePosition} singers ahead of you`}
              </p>
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Song: {queue[myQueuePosition]?.song.artist} - {queue[myQueuePosition]?.song.title}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Singer Info */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <UserIcon className="h-5 w-5" />
            <span>Singer Information</span>
          </h2>
        </CardHeader>
        <CardContent>
          <Input
            label="Your Name"
            value={singerName}
            onChange={(e) => setSingerName(e.target.value)}
            placeholder="Enter your name..."
            hint="This will be displayed when you sing"
            leftIcon={<UserIcon className="h-5 w-5" />}
            data-testid="singer-name-input"
          />
        </CardContent>
      </Card>
      
      {/* Song Search */}
      {!hasActiveRequest && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <MusicalNoteIcon className="h-5 w-5" />
              <span>Find Your Song</span>
            </h2>
          </CardHeader>
          <CardContent>
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
                  <p className="text-gray-500 dark:text-gray-400">Searching...</p>
                </div>
              )}
              
              {!isSearching && searchQuery && songs.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                      className="p-4 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {song.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 truncate">
                            by {song.artist}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRequestSong(song.id, song.title, song.artist)}
                          variant="primary"
                          size="sm"
                          disabled={!singerName.trim() || !isConnected}
                          data-testid="request-song-button"
                        >
                          Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Current Queue Preview */}
      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Current Queue ({queue.length} singers)</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queue.slice(0, 5).map((entry, index) => (
                <div
                  key={`${entry.song.id}-${entry.timestamp}`}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    index === 0 
                      ? 'bg-accent-100 dark:bg-accent-900/30 border border-accent-200 dark:border-accent-700'
                      : 'bg-gray-50 dark:bg-dark-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-accent-500 text-white'
                      : 'bg-gray-300 dark:bg-dark-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {entry.singerName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {entry.song.artist} - {entry.song.title}
                    </p>
                  </div>
                  {index === 0 && (
                    <span className="text-xs font-medium text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/50 px-2 py-1 rounded">
                      Up Next
                    </span>
                  )}
                </div>
              ))}
              
              {queue.length > 5 && (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                  ... and {queue.length - 5} more singers
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SingerPage;