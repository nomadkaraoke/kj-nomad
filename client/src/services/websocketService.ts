import { useAppStore, type QueueEntry, type SessionState, type PlayedSong, type Device } from '../store/appStore';
import { UAParser } from 'ua-parser-js';

class WebSocketService {
  private ws: WebSocket | null = null;
  private isConnecting = false;
  private clientType: 'player' | 'admin' | 'singer' | 'unknown' = 'unknown';
  private reconnectAttempts = 0;
  private reconnectInterval = 1000;
  private maxReconnectInterval = 10000; // Try again every 10 seconds max
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
          this.scheduleReconnect();
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
    const result = parser.getResult();
    this.send({
      type: 'client_identify',
      payload: {
        type: 'player',
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
  
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    // Only log the initial disconnection message
    if (this.reconnectAttempts === 1) {
      console.log('Disconnected from server. Retrying every 10 seconds indefinitely...');
    }

    useAppStore.getState().setConnectionStatus('connecting');
    useAppStore.getState().setError('Disconnected. Reconnecting...');

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.clientType); // Reconnect with the same client type
    }, this.reconnectInterval);

    // Exponential backoff with jitter
    this.reconnectInterval = Math.min(
      this.maxReconnectInterval,
      this.reconnectInterval * 2 + Math.random() * 1000
    );
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
