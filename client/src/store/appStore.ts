import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Song {
  id: string;
  artist: string;
  title: string;
  fileName: string;
}

export interface QueueEntry {
  song: Song;
  singerName: string;
  timestamp: number;
}

export interface NowPlaying {
  songId?: string;
  fileName: string;
  isFiller: boolean;
  singer?: string;
  startTime?: number;
}

interface AppState {
  // Connection state
  socket: WebSocket | null;
  isConnected: boolean;
  connectionError: string | null;
  
  // Queue state
  queue: QueueEntry[];
  nowPlaying: NowPlaying | null;
  
  // UI state
  tickerText: string;
  currentView: 'home' | 'player' | 'controller' | 'singer';
  isLoading: boolean;
  
  // Search state
  searchQuery: string;
  searchResults: Song[];
  
  // Actions
  setSocket: (socket: WebSocket | null) => void;
  setIsConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setQueue: (queue: QueueEntry[]) => void;
  addToQueue: (entry: QueueEntry) => void;
  removeFromQueue: (songId: string) => void;
  setNowPlaying: (nowPlaying: NowPlaying | null) => void;
  setTickerText: (text: string) => void;
  setCurrentView: (view: 'home' | 'player' | 'controller' | 'singer') => void;
  setIsLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Song[]) => void;
  
  // Complex actions
  requestSong: (songId: string, singerName: string) => void;
  playNext: () => void;
  pausePlayback: () => void;
  skipSong: () => void;
  updateTicker: (text: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      socket: null,
      isConnected: false,
      connectionError: null,
      queue: [],
      nowPlaying: null,
      tickerText: 'Welcome to KJ-Nomad! 🎤 Professional Karaoke System',
      currentView: 'home',
      isLoading: false,
      searchQuery: '',
      searchResults: [],
      
      // Basic setters
      setSocket: (socket) => set({ socket }),
      setIsConnected: (isConnected) => set({ isConnected }),
      setConnectionError: (connectionError) => set({ connectionError }),
      setQueue: (queue) => set({ queue }),
      addToQueue: (entry) => set((state) => ({ 
        queue: [...state.queue, entry] 
      })),
      removeFromQueue: (songId) => set((state) => ({
        queue: state.queue.filter(entry => entry.song.id !== songId)
      })),
      setNowPlaying: (nowPlaying) => set({ nowPlaying }),
      setTickerText: (tickerText) => set({ tickerText }),
      setCurrentView: (currentView) => set({ currentView }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSearchResults: (searchResults) => set({ searchResults }),
      
      // Complex actions that send WebSocket messages
      requestSong: (songId, singerName) => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'request_song',
            payload: { songId, singerName }
          }));
        }
      },
      
      playNext: () => {
        const { socket, queue } = get();
        if (socket && socket.readyState === WebSocket.OPEN && queue.length > 0) {
          const nextEntry = queue[0];
          socket.send(JSON.stringify({
            type: 'play',
            payload: { 
              songId: nextEntry.song.id, 
              fileName: nextEntry.song.fileName,
              singer: nextEntry.singerName
            }
          }));
          socket.send(JSON.stringify({
            type: 'remove_from_queue',
            payload: { songId: nextEntry.song.id }
          }));
        }
      },
      
      pausePlayback: () => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'pause' }));
        }
      },
      
      skipSong: () => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'song_ended' }));
        }
      },
      
      updateTicker: (text) => {
        const { socket } = get();
        set({ tickerText: text });
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'ticker_updated',
            payload: text
          }));
        }
      },
    }),
    { name: 'kj-nomad-store' }
  )
);