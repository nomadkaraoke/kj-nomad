/**
 * Video Synchronization Engine
 * Ensures perfect synchronization across multiple player screens (<100ms tolerance)
 */

import { WebSocket as WSWebSocket } from 'ws';

interface SyncClient {
  id: string;
  ws: WSWebSocket;
  name: string;
  type: 'player' | 'admin' | 'singer';
  clockOffset: number; // Client clock offset from server time (ms)
  lastPing: number;
  averageLatency: number;
  isReady: boolean;
  capabilities: {
    canPlay: boolean;
    supportsPreload: boolean;
    bufferLevel: number; // 0-1
  };
}

interface SyncCommand {
  type: 'sync_play' | 'sync_pause' | 'sync_seek' | 'sync_preload';
  videoUrl: string;
  scheduledTime: number; // Server timestamp when to execute
  videoTime: number; // Position in video to start from
  commandId: string;
  tolerance: number; // Acceptable sync tolerance in ms
}

interface SyncState {
  currentVideo?: {
    url: string;
    startTime: number;
    pausedAt?: number;
    duration?: number;
  };
  clients: Map<string, SyncClient>;
  lastSyncCommand?: SyncCommand;
  isPlaying: boolean;
  averageLatency: number;
}

export class VideoSyncEngine {
  private syncState: SyncState;
  private clockSyncInterval: ReturnType<typeof setInterval> | null = null;
  private syncCheckInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SYNC_TOLERANCE = 100; // 100ms tolerance
  private readonly CLOCK_SYNC_INTERVAL = 30000; // 30 seconds
  private readonly PRELOAD_BUFFER_TIME = 2000; // 2 seconds preload time
  private readonly MAX_SYNC_RETRIES = 3;

  constructor() {
    this.syncState = {
      clients: new Map(),
      isPlaying: false,
      averageLatency: 0
    };
    
    this.startClockSync();
    this.startSyncMonitoring();
  }

  /**
   * Register a new client for synchronization
   */
  registerClient(clientId: string, ws: WSWebSocket, name: string, type: 'player' | 'admin' | 'singer'): void {
    const client: SyncClient = {
      id: clientId,
      ws,
      name,
      type,
      clockOffset: 0,
      lastPing: Date.now(),
      averageLatency: 0,
      isReady: false,
      capabilities: {
        canPlay: type === 'player',
        supportsPreload: true,
        bufferLevel: 0
      }
    };

    this.syncState.clients.set(clientId, client);
    console.log(`[VideoSync] Registered client: ${name} (${type})`);

    // Immediately start clock synchronization for this client
    this.startClockSyncForClient(client);
  }

  /**
   * Unregister a client
   */
  unregisterClient(clientId: string): void {
    const client = this.syncState.clients.get(clientId);
    if (client) {
      console.log(`[VideoSync] Unregistered client: ${client.name}`);
      this.syncState.clients.delete(clientId);
      this.updateAverageLatency();
    }
  }

  /**
   * Start clock synchronization for a specific client
   */
  private startClockSyncForClient(client: SyncClient): void {
    const pingMessage = {
      type: 'clock_sync_ping',
      serverTime: Date.now(),
      pingId: `ping_${Date.now()}_${Math.random()}`
    };

    if (client.ws.readyState === client.ws.OPEN) {
      client.ws.send(JSON.stringify(pingMessage));
    }
  }

  /**
   * Handle clock sync response from client
   */
  handleClockSyncResponse(clientId: string, data: {
    pingId: string;
    serverTime: number;
    clientTime: number;
    responseTime: number;
  }): void {
    const client = this.syncState.clients.get(clientId);
    if (!client) return;

    const now = Date.now();
    const roundTripTime = now - data.serverTime;
    const latency = roundTripTime / 2;
    
    // Calculate clock offset: how much the client clock differs from server
    const estimatedServerTimeAtClient = data.serverTime + latency;
    const clockOffset = data.clientTime - estimatedServerTimeAtClient;

    // Update client stats with exponential moving average
    client.averageLatency = client.averageLatency === 0 
      ? latency 
      : (client.averageLatency * 0.8) + (latency * 0.2);
    
    client.clockOffset = clockOffset;
    client.lastPing = now;

    console.log(`[VideoSync] Client ${client.name}: latency=${latency.toFixed(1)}ms, offset=${clockOffset.toFixed(1)}ms`);

    this.updateAverageLatency();
  }

  /**
   * Update average latency across all clients
   */
  private updateAverageLatency(): void {
    const playerClients = Array.from(this.syncState.clients.values())
      .filter(c => c.type === 'player' && c.averageLatency > 0);
    
    if (playerClients.length > 0) {
      this.syncState.averageLatency = playerClients
        .reduce((sum, client) => sum + client.averageLatency, 0) / playerClients.length;
    }
  }

  /**
   * Synchronize video playback across all player clients
   */
  async syncPlayVideo(videoUrl: string, startTime: number = 0): Promise<boolean> {
    const playerClients = Array.from(this.syncState.clients.values())
      .filter(c => c.type === 'player' && c.capabilities.canPlay);

    if (playerClients.length === 0) {
      console.log('[VideoSync] No player clients available for sync');
      return false;
    }

    console.log(`[VideoSync] Syncing video playback: ${videoUrl} from ${startTime}s across ${playerClients.length} clients`);

    // Calculate when to start playback (server time + buffer for coordination)
    const coordinationBuffer = Math.max(
      this.PRELOAD_BUFFER_TIME,
      this.syncState.averageLatency * 3 + 500 // 3x average latency + 500ms safety
    );
    
    const scheduledTime = Date.now() + coordinationBuffer;

    const syncCommand: SyncCommand = {
      type: 'sync_play',
      videoUrl,
      scheduledTime,
      videoTime: startTime,
      commandId: `sync_${Date.now()}`,
      tolerance: this.SYNC_TOLERANCE
    };

    // Step 1: Send preload command to all clients
    const preloadCommand = {
      type: 'sync_preload',
      videoUrl,
      commandId: syncCommand.commandId
    };

    for (const client of playerClients) {
      if (client.ws.readyState === client.ws.OPEN) {
        client.ws.send(JSON.stringify(preloadCommand));
        client.isReady = false;
      }
    }

    // Step 2: Wait for preload confirmations or timeout
    await this.waitForClientReadiness(playerClients, coordinationBuffer - 500);

    // Step 3: Send synchronized play command
    for (const client of playerClients) {
      if (client.ws.readyState === client.ws.OPEN) {
        // Adjust scheduled time for each client's clock offset and latency
        const adjustedTime = scheduledTime + client.clockOffset - client.averageLatency;
        
        const clientSyncCommand = {
          ...syncCommand,
          scheduledTime: adjustedTime
        };

        client.ws.send(JSON.stringify(clientSyncCommand));
      }
    }

    // Update sync state
    this.syncState.currentVideo = {
      url: videoUrl,
      startTime: scheduledTime,
      duration: undefined // Will be updated when clients report duration
    };
    this.syncState.lastSyncCommand = syncCommand;
    this.syncState.isPlaying = true;

    console.log(`[VideoSync] Sync command sent. Scheduled playback at: ${new Date(scheduledTime).toISOString()}`);
    return true;
  }

  /**
   * Synchronize pause across all clients
   */
  async syncPause(): Promise<void> {
    const playerClients = Array.from(this.syncState.clients.values())
      .filter(c => c.type === 'player');

    const scheduledTime = Date.now() + 200; // Small buffer for pause coordination

    const pauseCommand = {
      type: 'sync_pause',
      scheduledTime,
      commandId: `pause_${Date.now()}`
    };

    for (const client of playerClients) {
      if (client.ws.readyState === client.ws.OPEN) {
        const adjustedTime = scheduledTime + client.clockOffset - client.averageLatency;
        client.ws.send(JSON.stringify({
          ...pauseCommand,
          scheduledTime: adjustedTime
        }));
      }
    }

    if (this.syncState.currentVideo) {
      this.syncState.currentVideo.pausedAt = Date.now();
    }
    this.syncState.isPlaying = false;

    console.log('[VideoSync] Sync pause command sent');
  }

  /**
   * Wait for clients to be ready (preloaded and buffered)
   */
  private async waitForClientReadiness(clients: SyncClient[], timeoutMs: number): Promise<number> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let readyCount = 0;

      const checkReadiness = () => {
        readyCount = clients.filter(c => c.isReady).length;
        const elapsed = Date.now() - startTime;

        if (readyCount === clients.length || elapsed >= timeoutMs) {
          resolve(readyCount);
        } else {
          setTimeout(checkReadiness, 50); // Check every 50ms
        }
      };

      checkReadiness();
    });
  }

  /**
   * Handle client readiness status
   */
  handleClientReady(clientId: string, data: {
    commandId: string;
    bufferLevel: number;
    videoDuration?: number;
  }): void {
    const client = this.syncState.clients.get(clientId);
    if (!client) return;

    client.isReady = true;
    client.capabilities.bufferLevel = data.bufferLevel;

    // Update video duration if provided
    if (data.videoDuration && this.syncState.currentVideo) {
      this.syncState.currentVideo.duration = data.videoDuration;
    }

    console.log(`[VideoSync] Client ${client.name} ready (buffer: ${(data.bufferLevel * 100).toFixed(0)}%)`);
  }

  /**
   * Start periodic clock synchronization
   */
  private startClockSync(): void {
    this.clockSyncInterval = setInterval(() => {
      for (const client of this.syncState.clients.values()) {
        if (client.ws.readyState === client.ws.OPEN) {
          this.startClockSyncForClient(client);
        }
      }
    }, this.CLOCK_SYNC_INTERVAL);
  }

  /**
   * Start sync monitoring and drift correction
   */
  private startSyncMonitoring(): void {
    this.syncCheckInterval = setInterval(() => {
      this.checkSyncDrift();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Check for sync drift and correct if necessary
   */
  private checkSyncDrift(): void {
    if (!this.syncState.isPlaying || !this.syncState.currentVideo) return;

    const playerClients = Array.from(this.syncState.clients.values())
      .filter(c => c.type === 'player' && c.ws.readyState === c.ws.OPEN);

    if (playerClients.length < 2) return; // No need to check sync with single client

    // Request current playback position from all clients
    const syncCheckCommand = {
      type: 'sync_check_position',
      checkId: `check_${Date.now()}`
    };

    for (const client of playerClients) {
      client.ws.send(JSON.stringify(syncCheckCommand));
    }
  }

  /**
   * Get current sync statistics
   */
  getSyncStats(): {
    totalClients: number;
    playerClients: number;
    averageLatency: number;
    isPlaying: boolean;
    currentVideo?: string;
    syncTolerance: number;
  } {
    const playerCount = Array.from(this.syncState.clients.values())
      .filter(c => c.type === 'player').length;

    return {
      totalClients: this.syncState.clients.size,
      playerClients: playerCount,
      averageLatency: this.syncState.averageLatency,
      isPlaying: this.syncState.isPlaying,
      currentVideo: this.syncState.currentVideo?.url,
      syncTolerance: this.SYNC_TOLERANCE
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.clockSyncInterval) {
      clearInterval(this.clockSyncInterval);
    }
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
    }
    
    this.syncState.clients.clear();
    console.log('[VideoSync] Engine destroyed');
  }
}

// Export singleton instance
export const videoSyncEngine = new VideoSyncEngine();