// Session Management Types
export interface SessionData {
  sessionId: string;        // "1234" (4-digit)
  adminKey: string;         // Secure key for local server auth
  localServerIP: string;    // "192.168.1.34" 
  localServerPort: number;  // 8080
  kjName?: string;
  venue?: string;
  status: 'active' | 'ended';
  hasLocalLibrary: boolean;
  allowYouTube: boolean;
  createdAt: number;
  lastSeen: number;
}

// WebSocket Message Types
export interface WSMessage {
  type: string;
  payload?: unknown;
  sessionId?: string;
  clientType?: 'admin' | 'player' | 'singer' | 'local-server';
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  adminKey: string;
  localServerInstructions: string;
}

export interface SessionStatusResponse extends SessionData {
  connectedClients: number;
  playerScreens: number;
}

// Environment Bindings
export interface Env {
  SESSIONS_KV: KVNamespace;
  SESSION_RELAY: DurableObjectNamespace;
}

// Durable Object State
export interface RelayState {
  sessionId: string;
  connectedClients: Map<string, WebSocket>;
  clientTypes: Map<string, string>; // WebSocket ID -> client type
}
