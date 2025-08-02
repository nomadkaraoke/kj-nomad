/**
 * Cloud Connector Module
 * Handles connection between local server and Cloudflare session management
 */

import WebSocket from 'ws';
import { networkInterfaces } from 'os';

interface CloudConfig {
  sessionId?: string;
  cloudApiUrl: string;
  cloudWsUrl: string;
  enableCloud: boolean;
}

interface SessionRegistration {
  sessionId: string;
  localServerIP: string;
  localServerPort: number;
  kjName?: string;
  venue?: string;
  hasLocalLibrary: boolean;
  allowYouTube: boolean;
}

export class CloudConnector {
  private config: CloudConfig;
  private cloudWs: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000; // 5 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Callback for broadcasting messages to local clients
  private localBroadcast: ((data: any) => void) | null = null;

  constructor(config: CloudConfig) {
    this.config = config;
  }

  /**
   * Set the local broadcast function
   */
  setLocalBroadcast(broadcastFn: (data: any) => void) {
    this.localBroadcast = broadcastFn;
  }

  /**
   * Get local server IP address
   */
  private getLocalIP(): string {
    const nets = networkInterfaces();
    
    // Prefer WiFi/Ethernet over other interfaces
    for (const name of Object.keys(nets)) {
      const netInterface = nets[name];
      if (!netInterface) continue;
      
      for (const net of netInterface) {
        // Skip over non-IPv4 and internal addresses
        if (net.family === 'IPv4' && !net.internal) {
          // Prefer common private network ranges
          if (net.address.startsWith('192.168.') || 
              net.address.startsWith('10.') || 
              net.address.startsWith('172.')) {
            return net.address;
          }
        }
      }
    }
    
    return 'localhost'; // Fallback
  }

  /**
   * Register local server with cloud session
   */
  async registerWithSession(sessionId: string, port: number, options?: {
    kjName?: string;
    venue?: string;
    allowYouTube?: boolean;
  }): Promise<boolean> {
    if (!this.config.enableCloud) {
      console.log('[CloudConnector] Cloud mode disabled');
      return false;
    }

    try {
      const registration: SessionRegistration = {
        sessionId,
        localServerIP: this.getLocalIP(),
        localServerPort: port,
        kjName: options?.kjName,
        venue: options?.venue,
        hasLocalLibrary: true, // Always true for local server
        allowYouTube: options?.allowYouTube || false
      };

      console.log('[CloudConnector] Registering with session:', registration);

      const response = await fetch(`${this.config.cloudApiUrl}/api/sessions/${sessionId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registration)
      });

      if (!response.ok) {
        console.error('[CloudConnector] Registration failed:', response.status, response.statusText);
        return false;
      }

      const result = await response.json();
      console.log('[CloudConnector] Registration successful:', result);

      // Connect to WebSocket relay
      this.config.sessionId = sessionId;
      return this.connectToCloudRelay();

    } catch (error) {
      console.error('[CloudConnector] Registration error:', error);
      return false;
    }
  }

  /**
   * Connect to Cloudflare WebSocket relay
   */
  private connectToCloudRelay(): boolean {
    if (!this.config.sessionId) {
      console.error('[CloudConnector] No session ID configured');
      return false;
    }

    try {
      const wsUrl = `${this.config.cloudWsUrl}/sessions/${this.config.sessionId}/ws?type=local-server`;
      console.log('[CloudConnector] Connecting to WebSocket relay:', wsUrl);

      this.cloudWs = new WebSocket(wsUrl);

      this.cloudWs.on('open', () => {
        console.log('[CloudConnector] Connected to cloud relay');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      });

      this.cloudWs.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('[CloudConnector] Received from cloud:', message);
          
          // Relay message to local clients
          if (this.localBroadcast) {
            this.localBroadcast(message);
          }
        } catch (error) {
          console.error('[CloudConnector] Failed to process cloud message:', error);
        }
      });

      this.cloudWs.on('close', () => {
        console.log('[CloudConnector] Disconnected from cloud relay');
        this.isConnected = false;
        this.stopHeartbeat();
        this.attemptReconnect();
      });

      this.cloudWs.on('error', (error) => {
        console.error('[CloudConnector] WebSocket error:', error);
      });

      return true;
    } catch (error) {
      console.error('[CloudConnector] Connection error:', error);
      return false;
    }
  }

  /**
   * Send message to cloud relay
   */
  sendToCloud(message: any): boolean {
    if (!this.isConnected || !this.cloudWs) {
      console.warn('[CloudConnector] Not connected to cloud, message dropped:', message);
      return false;
    }

    try {
      this.cloudWs.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[CloudConnector] Failed to send to cloud:', error);
      return false;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.cloudWs && this.isConnected) {
        this.sendToCloud({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect to cloud relay
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[CloudConnector] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[CloudConnector] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

    setTimeout(() => {
      this.connectToCloudRelay();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 60000); // Max 1 minute
  }

  /**
   * Disconnect from cloud
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.cloudWs) {
      this.cloudWs.close();
      this.cloudWs = null;
    }
    this.isConnected = false;
    console.log('[CloudConnector] Disconnected from cloud');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      sessionId: this.config.sessionId,
      reconnectAttempts: this.reconnectAttempts,
      localIP: this.getLocalIP()
    };
  }

  /**
   * Check if cloud mode is enabled and connected
   */
  isCloudMode(): boolean {
    return this.config.enableCloud && this.isConnected;
  }
}

// Export singleton instance
export const cloudConnector = new CloudConnector({
  enableCloud: process.env.ENABLE_CLOUD === 'true' || process.env.NODE_ENV === 'production',
  cloudApiUrl: process.env.CLOUD_API_URL || 'https://kj.nomadkaraoke.com',
  cloudWsUrl: process.env.CLOUD_WS_URL || 'wss://kj.nomadkaraoke.com'
});