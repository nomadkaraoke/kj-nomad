import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Song {
  id: string;
  artist: string; // unused; kept for compatibility
  title: string;  // will mirror fileName for display
  fileName: string;
}

export interface QueueEntry {
  song: Song;
  singerName: string;
  queuedAt: number; // Updated to match server
  source?: 'local' | 'youtube';
  download?: {
    status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    videoId?: string;
    downloadId?: string;
    fileName?: string;
  };
  meta?: {
    channel?: string;
  };
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

export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  viewport: {
    width: number;
    height: number;
  };
  os: string;
  browser: string;
  isApp: boolean;
  isOnline: boolean;
  lastActivity: number;
  isAudioEnabled: boolean;
  isTickerVisible: boolean;
  isSidebarVisible: boolean;
  isVideoPlayerVisible: boolean;
}

export interface SessionState {
  serverAddress: string;
  startedAt: number;
  queue: QueueEntry[];
  nowPlaying: QueueEntry | null;
  playbackState: 'playing' | 'paused' | 'stopped';
  history: PlayedSong[];
  currentSongStartTime?: number;
  totalSongsPlayed: number;
  queueLength: number;
}

export type AppMode = 'offline' | 'online' | 'player' | 'unknown';

export interface AppState {
  // App mode
  mode: AppMode;

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
  waitingTitle?: string;
  waitingSubtitle?: string;
  waitingImageUrl?: string | null;
  currentView: 'home' | 'player' | 'controller' | 'singer';
  isLoading: boolean;
  showHistory: boolean;
  isSetupComplete: boolean;
  serverInfo: {
    port: number;
    localIps: string[];
  };
  devices: Device[];
  playerDeviceId: string | null;
  playerShowIdentify: boolean;
  playerIsDisconnected: boolean;
  playerDebugOverlay: boolean;
  // Per-player local volume preferences (applied on the Player client)
  playerKaraokeVolume?: number;
  playerFillerVolume?: number;
  // Feature flags
  autoDriftCorrectionEnabled?: boolean;
  // IDs for debugging
  playerConnectionId?: string | null;
  // Sync commands (from VideoSyncEngine)
  syncPreload: { commandId: string; videoUrl: string } | null;
  syncPlay: { commandId: string; scheduledTime: number; videoTime: number; videoUrl: string; timeDomain?: 'client' | 'server' } | null;
  syncPause: { commandId: string; scheduledTime: number } | null;
  // Last known clock sync stats (client view)
  lastClockLatencyMs?: number;
  lastClockOffsetMs?: number;
  // Filler fade
  fillerFadeRequestedAt?: number;
  
  // Search state
  searchQuery: string;
  searchResults: Song[];
  
  // Actions
  setMode: (mode: AppMode) => void;
  setSocket: (socket: WebSocket | null) => void;
  setConnectionStatus: (status: 'idle' | 'connecting' | 'connected' | 'error') => void;
  setError: (error: string | null) => void;
  setQueue: (queue: QueueEntry[]) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  addToQueue: (entry: QueueEntry) => void;
  removeFromQueue: (songId: string) => void;
  setNowPlaying: (nowPlaying: NowPlaying | null) => void;
  setTickerText: (text: string) => void;
  setCurrentView: (view: 'home' | 'player' | 'controller' | 'singer') => void;
  setIsLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Song[]) => void;
  
  // Session state actions
  setServerInfo: (serverInfo: AppState['serverInfo']) => void;
  setDevices: (devices: Device[]) => void;
  setSessionState: (sessionState: SessionState) => void;
  setSessionHistory: (history: PlayedSong[]) => void;
  setPlaybackState: (state: 'playing' | 'paused' | 'stopped') => void;
  setShowHistory: (show: boolean) => void;
  setIsSetupComplete: (isComplete: boolean) => void;
  setOnlineSessionRequiresLibrary: (requiresLibrary: boolean) => void;
  setIsSessionConnected: (isConnected: boolean) => void;
  setOnlineSessionId: (sessionId: string | null) => void;
  setPlayerDeviceId: (id: string | null) => void;
  setPlayerShowIdentify: (show: boolean) => void;
  setPlayerIsDisconnected: (disconnected: boolean) => void;
  setPlayerDebugOverlay: (visible: boolean) => void;
  setPlayerKaraokeVolume?: (v: number) => void;
  setPlayerFillerVolume?: (v: number) => void;
  setSyncPreload: (cmd: { commandId: string; videoUrl: string } | null) => void;
  setSyncPlay: (cmd: { commandId: string; scheduledTime: number; videoTime: number; videoUrl: string; timeDomain?: 'client' | 'server' } | null) => void;
  setSyncPause: (cmd: { commandId: string; scheduledTime: number } | null) => void;
  setPlayerConnectionId: (id: string | null) => void;
  setClockSyncStats: (latencyMs: number, offsetMs: number) => void;
  setFillerFadeRequestedAt: (at: number | undefined) => void;
  
  // Complex actions
  checkServerInfo: () => Promise<void>;
  checkSetupStatus: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  toggleDeviceAudio: (deviceId: string) => Promise<void>;
  toggleDeviceTicker: (deviceId: string) => Promise<void>;
  toggleDeviceSidebar: (deviceId: string) => Promise<void>;
  toggleDeviceVideoPlayer: (deviceId: string) => Promise<void>;
  toggleDeviceDebugOverlay: (deviceId: string, visible: boolean) => Promise<void>;
  identifyDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  connectToOnlineSession: (sessionId: string, adminKey: string) => void;
  requestSong: (song: Song, singerName: string) => void;
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
      waitingTitle: 'KJ-Nomad Ready',
      waitingSubtitle: 'Waiting for the next performance...',
      waitingImageUrl: null,
      currentView: 'home',
      isLoading: false,
      showHistory: false,
      isSetupComplete: false,
      playerDeviceId: null,
      playerShowIdentify: false,
      playerIsDisconnected: false,
      playerDebugOverlay: false,
      playerKaraokeVolume: 1,
      playerFillerVolume: 0.6,
      autoDriftCorrectionEnabled: true,
      playerConnectionId: null,
      // Sync commands
      syncPreload: null,
      syncPlay: null,
      syncPause: null,
      lastClockLatencyMs: 0,
      lastClockOffsetMs: 0,
      fillerFadeRequestedAt: undefined,
      serverInfo: { port: 0, localIps: [] },
      devices: [],
      
      // Search state
      searchQuery: '',
      searchResults: [],
      
      // Basic setters
      setMode: (mode) => set({ mode }),
      setSocket: (socket) => set({ socket }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      setError: (error) => set({ error }),
      setQueue: (queue) => set({ queue }),
      reorderQueue: (fromIndex, toIndex) => set(state => {
        const newQueue = [...state.queue];
        const [movedItem] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, movedItem);
        return { queue: newQueue };
      }),
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
      setServerInfo: (serverInfo) => set({ serverInfo }),
      setDevices: (devices) => set({ devices }),
      setSessionState: (sessionState) => set({ sessionState }),
      setSessionHistory: (sessionHistory) => set({ sessionHistory }),
      setPlaybackState: (playbackState) => set({ playbackState }),
      setShowHistory: (showHistory) => set({ showHistory }),
      setIsSetupComplete: (isSetupComplete) => set({ isSetupComplete }),
      setOnlineSessionRequiresLibrary: (onlineSessionRequiresLibrary) => set({ onlineSessionRequiresLibrary }),
      setIsSessionConnected: (isSessionConnected) => set({ isSessionConnected }),
      setOnlineSessionId: (onlineSessionId) => set({ onlineSessionId }),
      setPlayerDeviceId: (id) => set({ playerDeviceId: id }),
      setPlayerShowIdentify: (show) => set({ playerShowIdentify: show }),
      setPlayerIsDisconnected: (disconnected) => set({ playerIsDisconnected: disconnected }),
      setPlayerDebugOverlay: (visible) => set({ playerDebugOverlay: visible }),
      setPlayerKaraokeVolume: (v: number) => set({ playerKaraokeVolume: Math.max(0, Math.min(1, v)) }),
      setPlayerFillerVolume: (v: number) => set({ playerFillerVolume: Math.max(0, Math.min(1, v)) }),
      // toggle for auto drift correction
      toggleAutoDriftCorrection: () => set((state) => ({ autoDriftCorrectionEnabled: !state.autoDriftCorrectionEnabled })),
      setSyncPreload: (cmd) => set({ syncPreload: cmd }),
      setSyncPlay: (cmd) => set({ syncPlay: cmd }),
      setSyncPause: (cmd) => set({ syncPause: cmd }),
      setPlayerConnectionId: (id) => set({ playerConnectionId: id }),
      setClockSyncStats: (latencyMs, offsetMs) => set({ lastClockLatencyMs: latencyMs, lastClockOffsetMs: offsetMs }),
      setFillerFadeRequestedAt: (at) => set({ fillerFadeRequestedAt: at }),
      
      // Complex actions
      checkServerInfo: async () => {
        try {
          const response = await fetch('/api/setup/server-info');
          const data = await response.json();
          if (data.success) {
            set({ serverInfo: data.data });
          }
        } catch (error) {
          console.error('Failed to check server info:', error);
        }
        // Load waiting screen settings
        try {
          const ws = await fetch('/api/waiting-screen');
          const j = await ws.json();
          if (j?.success && j.data) set({ waitingTitle: j.data.title, waitingSubtitle: j.data.subtitle, waitingImageUrl: j.data.imageUrl });
        } catch {/* ignore */}
      },
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

      fetchDevices: async () => {
        try {
          const response = await fetch('/api/devices');
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            set({ devices: data.data });
          } else {
            set({ devices: [] });
          }
        } catch (error) {
          console.error('Failed to fetch devices:', error);
          set({ devices: [] });
        }
      },

      toggleDeviceAudio: async (deviceId: string) => {
        try {
          await fetch(`/api/devices/${deviceId}/toggle-audio`, { method: 'POST' });
          get().fetchDevices();
        } catch (error) {
          console.error(`Failed to toggle audio for device ${deviceId}:`, error);
        }
      },

      toggleDeviceTicker: async (deviceId: string) => {
        try {
          await fetch(`/api/devices/${deviceId}/toggle-ticker`, { method: 'POST' });
          get().fetchDevices();
        } catch (error) {
          console.error(`Failed to toggle ticker for device ${deviceId}:`, error);
        }
      },

      toggleDeviceSidebar: async (deviceId: string) => {
        try {
          await fetch(`/api/devices/${deviceId}/toggle-sidebar`, { method: 'POST' });
          get().fetchDevices();
        } catch (error) {
          console.error(`Failed to toggle sidebar for device ${deviceId}:`, error);
        }
      },

      toggleDeviceVideoPlayer: async (deviceId: string) => {
        try {
          await fetch(`/api/devices/${deviceId}/toggle-video`, { method: 'POST' });
          get().fetchDevices();
        } catch (error) {
          console.error(`Failed to toggle video player for device ${deviceId}:`, error);
        }
      },

      // Send a command to a specific device to toggle its debug overlay
      toggleDeviceDebugOverlay: async (deviceId: string, visible: boolean) => {
        try {
          await fetch(`/api/devices/${deviceId}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'toggle_debug_overlay', data: { visible } })
          });
        } catch (error) {
          console.error(`Failed to toggle debug overlay for device ${deviceId}:`, error);
        }
      },

      identifyDevice: async (deviceId: string) => {
        try {
          await fetch(`/api/devices/${deviceId}/identify`, { method: 'POST' });
        } catch (error) {
          console.error(`Failed to identify device ${deviceId}:`, error);
        }
      },

      disconnectDevice: async (deviceId: string) => {
        try {
          await fetch(`/api/devices/${deviceId}`, { method: 'DELETE' });
          get().fetchDevices();
        } catch (error) {
          console.error(`Failed to disconnect device ${deviceId}:`, error);
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

      requestSong: (song, singerName) => {
        const { socket, addToQueue } = get();

        // Optimistic update
        const newEntry: QueueEntry = {
          song,
          singerName,
          queuedAt: Date.now(),
        };
        addToQueue(newEntry);

        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'request_song',
            payload: { songId: song.id, singerName }
          }));
        }
      },
      
      playNext: () => {
        const { socket, queue } = get();
        if (socket && socket.readyState === WebSocket.OPEN && queue.length > 0) {
          const nextEntry = queue[0];
          // Trigger synchronized playback across player screens
          fetch('/api/sync/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoUrl: `/api/media/${nextEntry.song.fileName}`,
              startTime: 0,
            }),
          }).catch((err) => console.error('Failed to start sync play:', err));

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
