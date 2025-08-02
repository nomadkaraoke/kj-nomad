import { WSMessage } from './types';

export class SessionRelay {
  private sessions: Map<string, Map<string, WebSocket>> = new Map();
  private clientTypes: Map<string, string> = new Map();

  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/')[2]; // /sessions/{sessionId}/ws

    if (request.headers.get("upgrade") === "websocket") {
      return this.handleWebSocket(request, sessionId);
    }

    return new Response("Expected WebSocket", { status: 400 });
  }

  private async handleWebSocket(request: Request, sessionId: string): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    const clientId = crypto.randomUUID();
    
    // Parse client type from URL params
    const url = new URL(request.url);
    const clientType = url.searchParams.get('type') || 'unknown';
    
    // Initialize session if not exists
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Map());
    }
    
    const sessionClients = this.sessions.get(sessionId)!;
    sessionClients.set(clientId, server as WebSocket);
    this.clientTypes.set(clientId, clientType);

    (server as WebSocket).accept();

    (server as WebSocket).addEventListener('message', (event: any) => {
      try {
        const message: WSMessage = JSON.parse(event.data as string);
        message.sessionId = sessionId;
        
        console.log(`[SessionRelay] Message from ${clientType}:`, message);
        
        // Broadcast to all other clients in the session
        this.broadcast(sessionId, message, clientId);
      } catch (error) {
        console.error('[SessionRelay] Failed to process message:', error);
        (server as WebSocket).send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' }
        }));
      }
    });

    (server as WebSocket).addEventListener('close', () => {
      console.log(`[SessionRelay] Client disconnected: ${clientType}`);
      sessionClients.delete(clientId);
      this.clientTypes.delete(clientId);
      
      // Clean up empty sessions
      if (sessionClients.size === 0) {
        this.sessions.delete(sessionId);
      }
      
      // Notify remaining clients about disconnection
      this.broadcast(sessionId, {
        type: 'client_disconnected',
        payload: { clientType, clientId }
      });
    });

    (server as WebSocket).addEventListener('error', (error: any) => {
      console.error(`[SessionRelay] WebSocket error for ${clientType}:`, error);
    });

    // Send welcome message
    (server as WebSocket).send(JSON.stringify({
      type: 'connected',
      payload: { 
        clientId, 
        sessionId,
        connectedClients: sessionClients.size 
      }
    }));

    // Notify other clients about new connection
    this.broadcast(sessionId, {
      type: 'client_connected', 
      payload: { clientType, clientId }
    }, clientId);

    return new Response(null, { status: 101, webSocket: client });
  }

  private broadcast(sessionId: string, message: WSMessage, excludeClientId?: string) {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) return;

    const messageStr = JSON.stringify(message);
    
    for (const [clientId, ws] of sessionClients) {
      if (clientId === excludeClientId) continue;
      
      if (ws.readyState === 1) { // WebSocket OPEN state
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error(`[SessionRelay] Failed to send to client ${clientId}:`, error);
          // Remove problematic client
          sessionClients.delete(clientId);
          this.clientTypes.delete(clientId);
        }
      }
    }
  }

  // Get session statistics
  getSessionStats(sessionId: string) {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) return null;

    const clientTypeCounts = new Map<string, number>();
    for (const [clientId] of sessionClients) {
      const type = this.clientTypes.get(clientId) || 'unknown';
      clientTypeCounts.set(type, (clientTypeCounts.get(type) || 0) + 1);
    }

    return {
      totalClients: sessionClients.size,
      clientTypes: Object.fromEntries(clientTypeCounts)
    };
  }
}