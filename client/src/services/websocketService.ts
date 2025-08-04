import { useAppStore, type QueueEntry, type SessionState, type PlayedSong } from '../store/appStore';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private maxReconnectInterval = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  connect(url: string = 'ws://localhost:8080') {
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
        
        // Update store
        useAppStore.getState().setSocket(this.ws);
        useAppStore.getState().setConnectionStatus('connected');
        useAppStore.getState().setError(null);
        
        // Request initial state
        this.send({ type: 'get_session_state' });
        this.send({ type: 'get_history' });
      };
      
      this.ws.onclose = (event) => {
        // Only log unexpected disconnections, not normal page reloads
        if (event.code !== 1001 && event.code !== 1000) {
          console.log('WebSocket disconnected:', event.code, event.reason);
        }
        
        // Update store
        useAppStore.getState().setSocket(null);
        useAppStore.getState().setConnectionStatus('idle');
        
        // Don't reconnect on page unload (1001) or normal close (1000)
        if (event.code !== 1000 && event.code !== 1001 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          useAppStore.getState().setConnectionStatus('error');
          useAppStore.getState().setError('Failed to connect after multiple attempts');
        }
      };
      
      this.ws.onerror = (error) => {
        // Only log errors that aren't connection-related during page loads
        if (this.ws?.readyState !== WebSocket.CONNECTING) {
          console.error('WebSocket error:', error);
        }
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
      // Only log connection errors if this is not a reconnection attempt
      if (this.reconnectAttempts === 0) {
        console.error('Failed to create WebSocket connection:', error);
      }
      useAppStore.getState().setConnectionStatus('error');
      useAppStore.getState().setError('Failed to create connection');
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    // Only log after first reconnection attempt to reduce noise
    if (this.reconnectAttempts > 1) {
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`);
    }
    
    useAppStore.getState().setConnectionStatus('connecting');
    useAppStore.getState().setError(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
    
    // Exponential backoff with jitter
    this.reconnectInterval = Math.min(
      this.maxReconnectInterval,
      this.reconnectInterval * 2 + Math.random() * 1000
    );
  }
  
  private handleMessage(message: { type: string; payload?: unknown }) {
    const { type, payload } = message;
    console.log('[WebSocketService] Received message:', { type, payload });
    const store = useAppStore.getState();
    
    switch (type) {
      case 'queue_updated':
        store.setQueue(payload as QueueEntry[]);
        break;
        
      case 'session_state_updated':
        if (payload && typeof payload === 'object') {
          const sessionState = payload as SessionState;
          console.log('[WebSocketService] Setting session state:', sessionState);
          store.setSessionState(sessionState);
          store.setPlaybackState(sessionState.playbackState);
          
          // Update nowPlaying from session state
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
          console.log('[WebSocketService] Setting session history:', payload);
          store.setSessionHistory(payload as PlayedSong[]);
        }
        break;
        
      case 'play':
        if (payload && typeof payload === 'object') {
          const playPayload = payload as { songId: string; fileName: string; singer?: string; restart?: boolean; replay?: boolean };
          console.log('[WebSocketService] Setting nowPlaying:', playPayload);
          store.setNowPlaying({
            songId: playPayload.songId,
            fileName: playPayload.fileName,
            isFiller: false,
            singer: playPayload.singer,
            startTime: Date.now()
          });
          store.setPlaybackState('playing');
          
          if (playPayload.restart) {
            console.log('[WebSocketService] Song restarted');
          } else if (playPayload.replay) {
            console.log('[WebSocketService] Song replayed from history');
          }
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
        console.log('[WebSocketService] Setting ticker text:', payload);
        store.setTickerText(payload as string);
        break;
        
      default:
        console.log('Unhandled message type:', type, payload);
    }
  }
  
  send(data: { type: string; payload?: unknown }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('WebSocket is not connected');
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

// Singleton instance
export const websocketService = new WebSocketService();
