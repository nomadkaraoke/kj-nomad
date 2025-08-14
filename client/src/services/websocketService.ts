import { useAppStore, type QueueEntry, type SessionState, type PlayedSong, type Device } from '../store/appStore';
import { UAParser } from 'ua-parser-js';

class WebSocketService {
  private ws: WebSocket | null = null;
  private isConnecting = false;
  private clientType: 'player' | 'admin' | 'singer' | 'unknown' = 'unknown';
  private reconnectAttempts = 0;
  private reconnectInterval = 1000;
  private maxReconnectInterval = 3000; // Cap retries at 3s to avoid long "Connecting..." states
  private reconnectTimer: NodeJS.Timeout | null = null;

  connect(type: 'player' | 'admin' | 'singer' | 'unknown' = 'unknown') {
    this.clientType = type;
    
    if (this.ws || this.isConnecting) {
      return;
    }
    this.isConnecting = true;
    useAppStore.getState().setConnectionStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const url = `${protocol}//${host}${port}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;

        // Update store
        useAppStore.getState().setSocket(this.ws);
        useAppStore.getState().setConnectionStatus('connected');
        useAppStore.getState().setError(null);
        try { useAppStore.getState().setPlayerConnectionId?.(this.ws?.url || null); } catch { /* ignore */ }

        // Identify the client type
        if (this.clientType === 'player') {
          this.identifyAsPlayer();
        } else {
          // Generic identification for other client types can go here
          this.send({ type: 'client_identify', payload: { type: this.clientType } });
        }
        
        // Request initial state
        this.send({ type: 'get_session_state' });
        this.send({ type: 'get_history' });
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.ws = null;
        
        if (event.code !== 1001 && event.code !== 1000) {
          console.log('WebSocket disconnected:', event.code, event.reason);
        }

        useAppStore.getState().setSocket(null);

        // Reconnect indefinitely if the disconnection was unexpected
        if (event.code !== 1000 && event.code !== 1001) {
          this.scheduleReconnect(event);
        } else {
          useAppStore.getState().setConnectionStatus('idle');
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        console.error('WebSocket error:', error);
        useAppStore.getState().setConnectionStatus('error');
        useAppStore.getState().setError('Connection error occurred');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      this.isConnecting = false;
      if (this.reconnectAttempts === 0) {
        console.error('Failed to create WebSocket connection:', error);
      }
      useAppStore.getState().setConnectionStatus('error');
      useAppStore.getState().setError('Failed to create connection');
    }
  }

  identifyAsPlayer() {
    const parser = new UAParser(navigator.userAgent);
    // Persist a stable ID in localStorage to survive reloads (incognito/new profile will generate a new one)
    let stableId = localStorage.getItem('kj_nomad_player_id');
    if (!stableId) {
      stableId = `pl_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      try { localStorage.setItem('kj_nomad_player_id', stableId); } catch { /* ignore */ }
    }
    const result = parser.getResult();
    this.send({
      type: 'client_identify',
      payload: {
        type: 'player',
        stableId,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        os: `${result.os.name} ${result.os.version}`,
        browser: `${result.browser.name} ${result.browser.version}`,
        isApp: 'kj-nomad' in window,
      },
    });
  }
  
  private scheduleReconnect(closeEvent?: CloseEvent) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    // Only log the initial disconnection message
    if (this.reconnectAttempts === 1) {
      console.log('Disconnected from server. Retrying every 10 seconds indefinitely...');
    }

    useAppStore.getState().setConnectionStatus('connecting');
    const nextInMs = Math.min(this.maxReconnectInterval, this.reconnectInterval * 2 + Math.random() * 1000);
    const reason = closeEvent?.reason || `code ${closeEvent?.code ?? 'unknown'}`;
    useAppStore.getState().setError(`Disconnected (${reason}). Reconnecting in ${Math.round(nextInMs/1000)}s...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.clientType); // Reconnect with the same client type
    }, this.reconnectInterval);

    // Exponential backoff with jitter
    this.reconnectInterval = nextInMs;
  }

  private handleMessage(message: { type: string; payload?: unknown }) {
    const { type, payload } = message;
    // console.log('[WebSocketService] Received message:', { type, payload }); // Too noisy
    const store = useAppStore.getState();

    switch (type) {
      case 'queue_updated':
        store.setQueue(payload as QueueEntry[]);
        break;

      case 'devices_updated':
        if (payload && Array.isArray(payload)) {
          store.setDevices(payload as Device[]);
        }
        break;

      case 'session_state_updated':
        if (payload && typeof payload === 'object') {
          const sessionState = payload as SessionState;
          store.setSessionState(sessionState);
          store.setPlaybackState(sessionState.playbackState);
          // Clear sync state only when fully stopped; keep baseline during pause so clients don't reload src
          if (sessionState.playbackState === 'stopped') {
            try { store.setSyncPlay(null); } catch { /* ignore */ }
            try { store.setSyncPreload(null); } catch { /* ignore */ }
            try { store.setSyncPause(null); } catch { /* ignore */ }
          }

          if (sessionState.nowPlaying) {
            store.setNowPlaying({
              songId: sessionState.nowPlaying.song.id,
              fileName: sessionState.nowPlaying.song.fileName,
              isFiller: false,
              singer: sessionState.nowPlaying.singerName,
              startTime: sessionState.currentSongStartTime
            });
          } else {
            store.setNowPlaying(null);
          }
        }
        break;

      case 'history_updated':
        if (payload && Array.isArray(payload)) {
          store.setSessionHistory(payload as PlayedSong[]);
        }
        break;

      case 'play':
        if (payload && typeof payload === 'object') {
          const playPayload = payload as { songId: string; fileName: string; singer?: string; restart?: boolean; replay?: boolean };
          store.setNowPlaying({
            songId: playPayload.songId,
            fileName: playPayload.fileName,
            isFiller: false,
            singer: playPayload.singer,
            startTime: Date.now()
          });
          store.setPlaybackState('playing');
        }
        break;

      case 'play_filler_music':
        if (payload && typeof payload === 'object') {
          const fillerPayload = payload as { fileName: string };
          // Clear any sync schedules; filler plays locally without sync engine
          try { store.setSyncPlay(null); } catch { /* ignore */ }
          try { store.setSyncPreload(null); } catch { /* ignore */ }
          try { store.setSyncPause(null); } catch { /* ignore */ }
          store.setNowPlaying({
            fileName: fillerPayload.fileName,
            isFiller: true,
            startTime: Date.now()
          });
          store.setPlaybackState('playing');
        }
        break;

      case 'pause':
        store.setNowPlaying(null);
        store.setPlaybackState('stopped');
        break;

      case 'resume':
        store.setPlaybackState('playing');
        break;

      case 'ticker_updated':
        store.setTickerText(payload as string);
        break;

      // Sync engine protocol
      case 'clock_sync_ping': {
        if (payload && typeof payload === 'object') {
          const { pingId, serverTime } = payload as { pingId: string; serverTime: number };
          const clientSendTime = Date.now();
          this.send({
            type: 'clock_sync_response',
            payload: {
              pingId,
              serverTime,
              clientTime: clientSendTime,
              responseTime: Date.now(),
            },
          });
          // Client-side estimate (mirrors server calc):
          const rtt = Date.now() - serverTime;
          const latency = rtt / 2;
          const offset = clientSendTime - (serverTime + latency);
          store.setClockSyncStats?.(Math.round(latency), Math.round(offset));
          // Also surface to sync log for admin
          this.send({ type: 'client_clock_ping_received', payload: { pingId, serverTime, clientNow: Date.now(), estLatencyMs: Math.round(latency), estOffsetMs: Math.round(offset) } });
        }
        break;
      }

      case 'sync_preload': {
        {
          const data = (payload && typeof payload === 'object') ? payload as { commandId: string; videoUrl: string } : (message as { commandId?: string; videoUrl?: string });
          if (data && data.commandId && data.videoUrl) {
            const { commandId, videoUrl } = data as { commandId: string; videoUrl: string };
            try { console.log('[PlayerSync] WS sync_preload', { commandId, videoUrl, now: Date.now() }); } catch { /* noop */ }
            store.setSyncPreload({ commandId, videoUrl });
            this.send({ type: 'client_preload_received', payload: { commandId, videoUrl, clientNow: Date.now() } });
            this.send({ type: 'client_video_loaded', payload: { clientReceivedAt: Date.now(), phase: 'preloading' } });
          }
        }
        break;
      }

      case 'sync_play': {
        {
          const data = (payload && typeof payload === 'object') ? payload as { commandId: string; scheduledTime: number; videoTime: number; videoUrl: string; timeDomain?: 'client' | 'server' } : (message as { commandId?: string; scheduledTime?: number; videoTime?: number; videoUrl?: string; timeDomain?: 'client' | 'server' });
          if (data && data.commandId != null && data.scheduledTime != null && data.videoTime != null && data.videoUrl) {
            const { commandId, scheduledTime, videoTime, videoUrl, timeDomain } = data as { commandId: string; scheduledTime: number; videoTime: number; videoUrl: string; timeDomain?: 'client' | 'server' };
            try { console.log('[PlayerSync] WS sync_play', { commandId, scheduledTime, videoTime, videoUrl, timeDomain: timeDomain || 'client', now: Date.now() }); } catch { /* noop */ }
            store.setSyncPlay({ commandId, scheduledTime, videoTime, videoUrl, timeDomain });
            // Clear any previous pause baseline on a new play/resume schedule
            try { useAppStore.getState().setSyncPause(null); } catch { /* noop */ }
            this.send({ type: 'client_schedule_received', payload: { commandId, scheduledTime, videoTime, clientNow: Date.now() } });
            const video = document.querySelector('video') as HTMLVideoElement | null;
            if (video) {
              try {
                const currentPath = new URL(video.src, window.location.origin).pathname;
                const targetPath = new URL(videoUrl, window.location.origin).pathname;
                if (currentPath !== targetPath) {
                  video.src = videoUrl;
                }
              } catch { /* ignore */ }
            }
          }
        }
        break;
      }

      case 'sync_pause': {
        {
          const data = (payload && typeof payload === 'object') ? payload as { commandId: string; scheduledTime: number } : (message as { commandId?: string; scheduledTime?: number });
          if (data && data.commandId != null && data.scheduledTime != null) {
            const { commandId, scheduledTime } = data as { commandId: string; scheduledTime: number };
            try { console.log('[PlayerSync] WS sync_pause', { commandId, scheduledTime, now: Date.now() }); } catch { /* noop */ }
            store.setSyncPause({ commandId, scheduledTime });
            this.send({ type: 'client_pause_schedule_received', payload: { commandId, scheduledTime, clientNow: Date.now() } });
            // If this is a hard stop (no nowPlaying afterwards), clear src when it fires
          }
        }
        break;
      }

       case 'sync_check_position': {
        // Respond with current playback time if available
        const video = document.querySelector('video');
        const currentTime = video && !isNaN(video.currentTime) ? video.currentTime : 0;
         this.send({ type: 'sync_report_position', payload: { currentTime, reportedAt: Date.now() } });
         // Optional: low-rate periodic client position tick when debug overlay visible
         const dbg = store.playerDebugOverlay;
         if (dbg) {
           this.send({ type: 'client_position_tick', payload: { currentTime, clientNow: Date.now() } });
         }
        break;
      }

      // Player-specific messages
      case 'device_registered':
        if (this.clientType === 'player' && payload && typeof payload === 'object' && 'deviceId' in payload) {
          store.setPlayerDeviceId((payload as { deviceId: string }).deviceId);
        }
        break;

      case 'heartbeat':
        if (this.clientType === 'player' && payload && typeof payload === 'object' && 'serverTime' in payload) {
          this.send({
            type: 'heartbeat_response',
            payload: {
              serverTime: (payload as { serverTime: number }).serverTime,
              clientTime: Date.now(),
            },
          });
        }
        break;

      case 'identify_screen':
        if (this.clientType === 'player' && payload && typeof payload === 'object' && 'deviceId' in payload && (payload as { deviceId: string }).deviceId === store.playerDeviceId) {
          store.setPlayerShowIdentify(true);
          setTimeout(() => store.setPlayerShowIdentify(false), 5000);
        }
        break;

      case 'toggle_debug_overlay': {
        if (this.clientType === 'player' && payload && typeof payload === 'object' && 'visible' in (payload as { visible: boolean })) {
          store.setPlayerDebugOverlay(Boolean((payload as { visible: boolean }).visible));
        }
        break;
      }

      case 'disconnect_screen':
        if (this.clientType === 'player' && payload && typeof payload === 'object' && 'deviceId' in payload && (payload as { deviceId: string }).deviceId === store.playerDeviceId) {
          store.setPlayerIsDisconnected(true);
          this.disconnect();
        }
        break;

      case 'online_session_connected':
        if (payload && typeof payload === 'object') {
          const { requiresLocalLibrary } = payload as { requiresLocalLibrary: boolean };
          store.setIsSessionConnected(true);
          store.setConnectionStatus('connected');
          store.setOnlineSessionRequiresLibrary(requiresLocalLibrary);
          if (!requiresLocalLibrary) {
            store.setIsSetupComplete(true);
          }
        }
        break;

      case 'connected':
        if (payload && typeof payload === 'object') {
          const { clientId, sessionId, connectedClients } = payload as { clientId: string; sessionId: string; connectedClients: number };
          console.log(`[WebSocketService] Confirmed connection to session ${sessionId} with client ID ${clientId}. Total clients: ${connectedClients}`);
          store.setIsSessionConnected(true);
          store.setOnlineSessionId(sessionId);
          store.setConnectionStatus('connected');
          // also record the server-issued connection id for overlay
          store.setPlayerConnectionId?.(clientId);
        }
        break;
        
      default:
        // console.log('Unhandled message type:', type, payload); // Too noisy
    }
  }

  send(data: { type: string; payload?: unknown }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      // console.warn('WebSocket is not connected'); // Too noisy
      return false;
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    useAppStore.getState().setSocket(null);
    useAppStore.getState().setConnectionStatus('idle');
  }

  getConnectionState() {
    return this.ws?.readyState || WebSocket.CLOSED;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
