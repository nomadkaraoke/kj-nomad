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
  queuedAt: number; // Updated to match server
}

export interface NowPlaying {
  songId?: string;
  fileName: string;
  isFiller: boolean;
  singer?: string;
  startTime?: number;
}

export interface PlayedSong extends QueueEntry {
  playedAt: number;
  completedAt?: number;
}

export interface SessionState {
  startedAt: number;
  queue: QueueEntry[];
  nowPlaying: QueueEntry | null;
  playbackState: 'playing' | 'paused' | 'stopped';
  history: PlayedSong[];
  currentSongStartTime?: number;
  totalSongsPlayed: number;
  queueLength: number;
}

export interface AppState {
  // App mode
  mode: 'offline' | 'online' | 'unknown';

  // Connection state
  socket: WebSocket | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  error: string | null;
  
  // Queue state
  queue: QueueEntry[];
  nowPlaying: NowPlaying | null;
  
  // Session state
  sessionState: SessionState | null;
  sessionHistory: PlayedSong[];
  playbackState: 'playing' | 'paused' | 'stopped';
  onlineSessionRequiresLibrary: boolean;
  isSessionConnected: boolean;
  onlineSessionId: string | null;
  
  // UI state
  tickerText: string;
  currentView: 'home' | 'player' | 'controller' | 'singer';
  isLoading: boolean;
  showHistory: boolean;
  isSetupComplete: boolean;
  
  // Search state
  searchQuery: string;
  searchResults: Song[];
  
  // Actions
  setMode: (mode: 'offline' | 'online') => void;
  setSocket: (socket: WebSocket | null) => void;
  setConnectionStatus: (status: 'idle' | 'connecting' | 'connected' | 'error') => void;
  setError: (error: string | null) => void;
  setQueue: (queue: QueueEntry[]) => void;
  addToQueue: (entry: QueueEntry) => void;
  removeFromQueue: (songId: string) => void;
  setNowPlaying: (nowPlaying: NowPlaying | null) => void;
  setTickerText: (text: string) => void;
  setCurrentView: (view: 'home' | 'player' | 'controller' | 'singer') => void;
  setIsLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Song[]) => void;
  
  // Session state actions
  setSessionState: (sessionState: SessionState) => void;
  setSessionHistory: (history: PlayedSong[]) => void;
  setPlaybackState: (state: 'playing' | 'paused' | 'stopped') => void;
  setShowHistory: (show: boolean) => void;
  setIsSetupComplete: (isComplete: boolean) => void;
  setOnlineSessionRequiresLibrary: (requiresLibrary: boolean) => void;
  setIsSessionConnected: (isConnected: boolean) => void;
  setOnlineSessionId: (sessionId: string | null) => void;
  
  // Complex actions
  checkSetupStatus: () => Promise<void>;
  connectToOnlineSession: (sessionId: string, adminKey: string) => void;
  requestSong: (songId: string, singerName: string) => void;
  playNext: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  stopPlayback: () => void;
  restartSong: () => void;
  replaySong: (songId: string, singerName?: string) => void;
  skipSong: () => void;
  updateTicker: (text: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      mode: 'unknown',
      socket: null,
      connectionStatus: 'idle',
      error: null,
      queue: [],
      nowPlaying: null,
      
      // Session state
      sessionState: null,
      sessionHistory: [],
      playbackState: 'stopped',
      onlineSessionRequiresLibrary: false,
      isSessionConnected: false,
      onlineSessionId: null,
      
      // UI state
      tickerText: 'Welcome to KJ-Nomad! 🎤 Professional Karaoke System',
      currentView: 'home',
      isLoading: false,
      showHistory: false,
      isSetupComplete: false,
      
      // Search state
      searchQuery: '',
      searchResults: [],
      
      // Basic setters
      setMode: (mode) => set({ mode }),
      setSocket: (socket) => set({ socket }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      setError: (error) => set({ error }),
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
      
      // Session state setters
      setSessionState: (sessionState) => set({ sessionState }),
      setSessionHistory: (sessionHistory) => set({ sessionHistory }),
      setPlaybackState: (playbackState) => set({ playbackState }),
      setShowHistory: (showHistory) => set({ showHistory }),
      setIsSetupComplete: (isSetupComplete) => set({ isSetupComplete }),
      setOnlineSessionRequiresLibrary: (onlineSessionRequiresLibrary) => set({ onlineSessionRequiresLibrary }),
      setIsSessionConnected: (isSessionConnected) => set({ isSessionConnected }),
      setOnlineSessionId: (onlineSessionId) => set({ onlineSessionId }),
      
      // Complex actions
      checkSetupStatus: async () => {
        try {
          const response = await fetch('/api/setup/status');
          const data = await response.json();
          if (data.success) {
            set({ isSetupComplete: !data.data.setupRequired });
          } else {
            set({ isSetupComplete: false });
          }
        } catch (error) {
          console.error('Failed to check setup status:', error);
          set({ isSetupComplete: false });
        }
      },

      connectToOnlineSession: (sessionId, adminKey) => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
          set({ connectionStatus: 'connecting', error: null });
          socket.send(JSON.stringify({
            type: 'connect_online_session',
            payload: { sessionId, adminKey }
          }));
        } else {
          set({ connectionStatus: 'error', error: 'WebSocket is not connected.' });
        }
      },

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
          socket.send(JSON.stringify({ type: 'pause_playback' }));
        }
      },
      
      resumePlayback: () => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'resume_playback' }));
        }
      },
      
      stopPlayback: () => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'stop_playback' }));
        }
      },
      
      restartSong: () => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'restart_song' }));
        }
      },
      
      replaySong: (songId, singerName) => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ 
            type: 'replay_song', 
            payload: { songId, singerName } 
          }));
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
