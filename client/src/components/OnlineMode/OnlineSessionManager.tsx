import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface SessionData {
  sessionId: string;
  kjName?: string;
  venue?: string;
  status: 'active' | 'ended';
  hasLocalLibrary: boolean;
  allowYouTube: boolean;
  connectedClients: number;
  playerScreens: number;
}

interface OnlineSessionManagerProps {
  children: (sessionData: SessionData | null, isLoading: boolean, error: string | null) => React.ReactNode;
}

/**
 * Online Session Manager Component
 * Handles session discovery, validation, and WebSocket connection for Online Mode
 */
const OnlineSessionManager: React.FC<OnlineSessionManagerProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const sessionId = searchParams.get('session');

  const connectToSession = useCallback((sessionId: string) => {
    try {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/sessions/${sessionId}/ws`;
      
      console.log('[OnlineSession] Connecting to WebSocket:', wsUrl);
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('[OnlineSession] WebSocket connected');
        
        // Identify client type based on current path
        const path = window.location.pathname;
        let clientType = 'admin';
        
        if (path.includes('/player')) {
          clientType = 'player';
        } else if (path.includes('/singer')) {
          clientType = 'singer';
        }
        
        // Send client identification
        websocket.send(JSON.stringify({
          type: 'client_identify',
          payload: {
            type: clientType,
            name: `${clientType} Client`,
            sessionId,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            capabilities: {
              video: clientType === 'player',
              audio: clientType === 'player',
              touch: 'ontouchstart' in window
            }
          }
        }));
      };
      
      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[OnlineSession] Received message:', message);
          
          // Handle session-specific messages
          switch (message.type) {
            case 'session_updated':
              setSessionData(prev => prev ? { ...prev, ...message.payload } : null);
              break;
            case 'client_connected':
              setSessionData(prev => prev ? { 
                ...prev, 
                connectedClients: prev.connectedClients + 1 
              } : null);
              break;
            case 'client_disconnected':
              setSessionData(prev => prev ? { 
                ...prev, 
                connectedClients: Math.max(0, prev.connectedClients - 1) 
              } : null);
              break;
          }
          
          // Forward message to global WebSocket service if needed
          window.dispatchEvent(new CustomEvent('websocket-message', { 
            detail: message 
          }));
          
        } catch (error) {
          console.error('[OnlineSession] Failed to parse WebSocket message:', error);
        }
      };
      
      websocket.onclose = () => {
        console.log('[OnlineSession] WebSocket disconnected');
        setWs(null);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (sessionId) {
            connectToSession(sessionId);
          }
        }, 3000);
      };
      
      websocket.onerror = (error) => {
        console.error('[OnlineSession] WebSocket error:', error);
      };
      
      setWs(websocket);
      
    } catch (error) {
      console.error('[OnlineSession] WebSocket connection failed:', error);
      setError('Failed to connect to session. Please try again.');
    }
  }, [setError, setWs]);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch session data from Cloudflare Workers API
      const response = await fetch(`/api/sessions/${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found. Please check your session ID.');
        }
        throw new Error(`Failed to fetch session data: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch session data');
      }

      setSessionData(result.data);
      
      // Connect to WebSocket relay
      connectToSession(sessionId);
      
    } catch (err) {
      console.error('Session fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, connectToSession]);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setIsLoading(false);
      return;
    }

    // Validate session ID format (4 digits)
    if (!/^\d{4}$/.test(sessionId)) {
      setError('Invalid session ID format. Must be 4 digits.');
      setIsLoading(false);
      return;
    }

    fetchSessionData();
  }, [sessionId, fetchSessionData]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  return <>{children(sessionData, isLoading, error)}</>;
};

export default OnlineSessionManager;
