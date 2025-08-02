import { SessionRelay } from './session-relay';
import { SessionData, Env, ApiResponse, CreateSessionResponse, SessionStatusResponse } from './types';

export { SessionRelay };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Add CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route API endpoints
      if (path.startsWith('/api/sessions')) {
        const response = await handleSessionAPI(request, env, path);
        return addCorsHeaders(response, corsHeaders);
      }

      // WebSocket endpoints  
      if (path.startsWith('/sessions/') && path.endsWith('/ws')) {
        return handleWebSocket(request, env, path);
      }

      // Health check
      if (path === '/health') {
        return new Response('OK', { headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ 
        success: false, 
        error: 'Internal server error' 
      }, 500, corsHeaders);
    }
  }
};

async function handleSessionAPI(request: Request, env: Env, path: string): Promise<Response> {
  const segments = path.split('/');
  
  if (segments[3] === undefined) {
    // /api/sessions
    if (request.method === 'POST') {
      return createSession(request, env);
    } else if (request.method === 'GET') {
      return listActiveSessions(env);
    }
  } else {
    const sessionId = segments[3];
    
    if (segments[4] === undefined) {
      // /api/sessions/{id}
      if (request.method === 'GET') {
        return getSession(sessionId, env);
      } else if (request.method === 'DELETE') {
        return endSession(sessionId, env);
      }
    } else if (segments[4] === 'register') {
      // /api/sessions/{id}/register
      if (request.method === 'POST') {
        return registerLocalServer(sessionId, request, env);
      }
    } else if (segments[4] === 'heartbeat') {
      // /api/sessions/{id}/heartbeat
      if (request.method === 'POST') {
        return updateHeartbeat(sessionId, env);
      }
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
}

async function createSession(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Partial<SessionData>;
  
  // Generate unique 4-digit session ID
  const sessionId = await generateUniqueSessionId(env);
  
  const sessionData: SessionData = {
    sessionId,
    localServerIP: '',
    localServerPort: 8080,
    kjName: body.kjName || '',
    venue: body.venue || '',
    status: 'active',
    hasLocalLibrary: body.hasLocalLibrary || false,
    allowYouTube: body.allowYouTube || false,
    createdAt: Date.now(),
    lastSeen: Date.now()
  };

  // Store in KV
  await env.SESSIONS_KV.put(`session:${sessionId}`, JSON.stringify(sessionData));
  
  // Add to active sessions list
  const activeSessions = await getActiveSessionsList(env);
  activeSessions.push(sessionId);
  await env.SESSIONS_KV.put('active_sessions', JSON.stringify(activeSessions));

  const response: CreateSessionResponse = {
    sessionId,
    localServerInstructions: `To connect your local server, run it with session ID ${sessionId} or visit the admin interface at kj.nomadkaraoke.com/admin`
  };

  return jsonResponse({ success: true, data: response });
}

async function getSession(sessionId: string, env: Env): Promise<Response> {
  const sessionData = await env.SESSIONS_KV.get(`session:${sessionId}`);
  
  if (!sessionData) {
    return jsonResponse({ success: false, error: 'Session not found' }, 404);
  }

  const session: SessionData = JSON.parse(sessionData);
  
  // Get connection stats from Durable Object
  const durableObjectId = env.SESSION_RELAY.idFromName(sessionId);
  const durableObject = env.SESSION_RELAY.get(durableObjectId);
  
  // Note: We'd need to add a method to get stats, for now return basic info
  const response: SessionStatusResponse = {
    ...session,
    connectedClients: 0, // TODO: Get from Durable Object
    playerScreens: 0     // TODO: Count player clients
  };

  return jsonResponse({ success: true, data: response });
}

async function registerLocalServer(sessionId: string, request: Request, env: Env): Promise<Response> {
  const { localIP, port } = await request.json() as { localIP: string; port?: number };
  
  const sessionData = await env.SESSIONS_KV.get(`session:${sessionId}`);
  if (!sessionData) {
    return jsonResponse({ success: false, error: 'Session not found' }, 404);
  }

  const session: SessionData = JSON.parse(sessionData);
  session.localServerIP = localIP;
  session.localServerPort = port || 8080;
  session.lastSeen = Date.now();

  await env.SESSIONS_KV.put(`session:${sessionId}`, JSON.stringify(session));

  return jsonResponse({ success: true, data: { message: 'Local server registered successfully' } });
}

async function updateHeartbeat(sessionId: string, env: Env): Promise<Response> {
  const sessionData = await env.SESSIONS_KV.get(`session:${sessionId}`);
  if (!sessionData) {
    return jsonResponse({ success: false, error: 'Session not found' }, 404);
  }

  const session: SessionData = JSON.parse(sessionData);
  session.lastSeen = Date.now();

  await env.SESSIONS_KV.put(`session:${sessionId}`, JSON.stringify(session));

  return jsonResponse({ success: true, data: { lastSeen: session.lastSeen } });
}

async function endSession(sessionId: string, env: Env): Promise<Response> {
  const sessionData = await env.SESSIONS_KV.get(`session:${sessionId}`);
  if (!sessionData) {
    return jsonResponse({ success: false, error: 'Session not found' }, 404);
  }

  const session: SessionData = JSON.parse(sessionData);
  session.status = 'ended';

  await env.SESSIONS_KV.put(`session:${sessionId}`, JSON.stringify(session));
  
  // Remove from active sessions
  const activeSessions = await getActiveSessionsList(env);
  const updatedSessions = activeSessions.filter(id => id !== sessionId);
  await env.SESSIONS_KV.put('active_sessions', JSON.stringify(updatedSessions));

  return jsonResponse({ success: true, data: { message: 'Session ended' } });
}

async function listActiveSessions(env: Env): Promise<Response> {
  const activeSessions = await getActiveSessionsList(env);
  return jsonResponse({ success: true, data: activeSessions });
}

async function handleWebSocket(request: Request, env: Env, path: string): Promise<Response> {
  const sessionId = path.split('/')[2];
  
  const durableObjectId = env.SESSION_RELAY.idFromName(sessionId);
  const durableObject = env.SESSION_RELAY.get(durableObjectId);
  
  return durableObject.fetch(request);
}

// Helper functions
async function generateUniqueSessionId(env: Env): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const sessionId = Math.floor(1000 + Math.random() * 9000).toString();
    const existing = await env.SESSIONS_KV.get(`session:${sessionId}`);
    
    if (!existing) {
      return sessionId;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique session ID');
}

async function getActiveSessionsList(env: Env): Promise<string[]> {
  const activeSessionsData = await env.SESSIONS_KV.get('active_sessions');
  return activeSessionsData ? JSON.parse(activeSessionsData) : [];
}

function jsonResponse<T>(data: ApiResponse<T>, status: number = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

function addCorsHeaders(response: Response, corsHeaders: Record<string, string>): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}