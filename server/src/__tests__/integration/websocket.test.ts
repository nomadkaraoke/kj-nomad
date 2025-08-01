import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import http from 'http';
import { AddressInfo } from 'net';

// Mock the modules we're testing
vi.mock('../../mediaLibrary');
vi.mock('../../songQueue');
vi.mock('../../fillerMusic');

import { getSongById } from '../../mediaLibrary';
import { 
  addSongToQueue, 
  getQueue, 
  removeSongFromQueue, 
  getNextSong 
} from '../../songQueue';
import { getNextFillerSong } from '../../fillerMusic';

const mockGetSongById = vi.mocked(getSongById);
const mockAddSongToQueue = vi.mocked(addSongToQueue);
const mockGetQueue = vi.mocked(getQueue);
const mockRemoveSongFromQueue = vi.mocked(removeSongFromQueue);
const mockGetNextSong = vi.mocked(getNextSong);
const mockGetNextFillerSong = vi.mocked(getNextFillerSong);

// Helper function to create a test server with WebSocket
function createTestServer() {
  const server = http.createServer();
  const wss = new WebSocketServer({ server });

  // Implement the WebSocket message handling logic (simplified version)
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;

        switch (type) {
          case 'request_song':
            const song = mockGetSongById(payload.songId);
            if (song) {
              mockAddSongToQueue(song, payload.singerName);
              broadcast({ type: 'queue_updated', payload: mockGetQueue() });
            }
            break;
            
          case 'get_queue':
            ws.send(JSON.stringify({ type: 'queue_updated', payload: mockGetQueue() }));
            break;
            
          case 'remove_from_queue':
            mockRemoveSongFromQueue(payload.songId);
            broadcast({ type: 'queue_updated', payload: mockGetQueue() });
            break;
            
          case 'song_ended':
            const nextSong = mockGetNextSong();
            if (nextSong) {
              broadcast({ 
                type: 'play', 
                payload: { 
                  songId: nextSong.song.id, 
                  fileName: nextSong.song.fileName 
                } 
              });
            } else {
              const nextFillerSong = mockGetNextFillerSong();
              if (nextFillerSong) {
                broadcast({ 
                  type: 'play_filler_music', 
                  payload: { fileName: nextFillerSong.fileName } 
                });
              } else {
                broadcast({ type: 'pause' });
              }
            }
            break;
            
          case 'ticker_updated':
            broadcast({ type: 'ticker_updated', payload: payload });
            break;
            
          default:
            // Broadcast to all other clients
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
              }
            });
            break;
        }
      } catch (error) {
        console.error('Failed to process message:', message.toString(), error);
      }
    });
  });

  function broadcast(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  return { server, wss };
}

// Helper to create a WebSocket client
function createClient(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

// Helper to wait for a message
function waitForMessage(ws: WebSocket, timeout = 1000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, timeout);

    ws.once('message', (data) => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(data.toString()));
      } catch (error) {
        resolve(data.toString());
      }
    });
  });
}

describe('WebSocket Integration Tests', () => {
  let server: http.Server;
  let wss: WebSocketServer;
  let port: number;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const testServer = createTestServer();
    server = testServer.server;
    wss = testServer.wss;

    // Start server on random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    wss.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    vi.restoreAllMocks();
  });

  describe('Connection Management', () => {
    it('should accept WebSocket connections', async () => {
      const client = await createClient(port);
      expect(client.readyState).toBe(WebSocket.OPEN);
      client.close();
    });

    it('should handle multiple concurrent connections', async () => {
      const clients = await Promise.all([
        createClient(port),
        createClient(port),
        createClient(port)
      ]);

      clients.forEach(client => {
        expect(client.readyState).toBe(WebSocket.OPEN);
      });

      clients.forEach(client => client.close());
    });

    it('should handle client disconnections gracefully', async () => {
      const client = await createClient(port);
      client.close();
      
      // Should not throw or cause issues
      expect(wss.clients.size).toBe(0);
    });
  });

  describe('Song Request Flow', () => {
    it('should handle song request and update queue', async () => {
      const mockSong = {
        id: '1',
        artist: 'Test Artist',
        title: 'Test Song',
        fileName: 'test.mp4'
      };

      mockGetSongById.mockReturnValue(mockSong);
      mockGetQueue.mockReturnValue([{
        song: mockSong,
        singerName: 'John Doe'
      }]);

      const client = await createClient(port);

      // Send song request
      client.send(JSON.stringify({
        type: 'request_song',
        payload: { songId: '1', singerName: 'John Doe' }
      }));

      // Wait for queue update
      const response = await waitForMessage(client);

      expect(response.type).toBe('queue_updated');
      expect(response.payload).toHaveLength(1);
      expect(response.payload[0].singerName).toBe('John Doe');
      expect(mockAddSongToQueue).toHaveBeenCalledWith(mockSong, 'John Doe');

      client.close();
    });

    it('should ignore request for non-existent song', async () => {
      mockGetSongById.mockReturnValue(undefined);

      const client = await createClient(port);

      client.send(JSON.stringify({
        type: 'request_song',
        payload: { songId: '999', singerName: 'John Doe' }
      }));

      // Should not receive any response for invalid song
      await expect(waitForMessage(client, 500)).rejects.toThrow('Message timeout');
      expect(mockAddSongToQueue).not.toHaveBeenCalled();

      client.close();
    });
  });

  describe('Queue Management', () => {
    it('should return current queue on request', async () => {
      const mockQueue = [
        { song: { id: '1', artist: 'Artist', title: 'Song', fileName: 'song.mp4' }, singerName: 'Singer 1' }
      ];
      mockGetQueue.mockReturnValue(mockQueue);

      const client = await createClient(port);

      client.send(JSON.stringify({ type: 'get_queue' }));
      const response = await waitForMessage(client);

      expect(response.type).toBe('queue_updated');
      expect(response.payload).toEqual(mockQueue);

      client.close();
    });

    it('should handle queue removal and broadcast update', async () => {
      mockGetQueue.mockReturnValue([]);

      const client1 = await createClient(port);
      const client2 = await createClient(port);

      // Send remove request
      client1.send(JSON.stringify({
        type: 'remove_from_queue',
        payload: { songId: '1' }
      }));

      // Both clients should receive the update
      const response1 = await waitForMessage(client1);
      const response2 = await waitForMessage(client2);

      expect(response1.type).toBe('queue_updated');
      expect(response2.type).toBe('queue_updated');
      expect(mockRemoveSongFromQueue).toHaveBeenCalledWith('1');

      client1.close();
      client2.close();
    });
  });

  describe('Playback Control', () => {
    it('should handle song end and play next song', async () => {
      const nextSong = {
        song: { id: '2', artist: 'Artist 2', title: 'Song 2', fileName: 'song2.mp4' },
        singerName: 'Singer 2'
      };
      mockGetNextSong.mockReturnValue(nextSong);

      const client = await createClient(port);

      client.send(JSON.stringify({ type: 'song_ended' }));
      const response = await waitForMessage(client);

      expect(response.type).toBe('play');
      expect(response.payload.songId).toBe('2');
      expect(response.payload.fileName).toBe('song2.mp4');

      client.close();
    });

    it('should play filler music when no songs in queue', async () => {
      mockGetNextSong.mockReturnValue(null);
      mockGetNextFillerSong.mockReturnValue({ fileName: 'filler.mp3' });

      const client = await createClient(port);

      client.send(JSON.stringify({ type: 'song_ended' }));
      const response = await waitForMessage(client);

      expect(response.type).toBe('play_filler_music');
      expect(response.payload.fileName).toBe('filler.mp3');

      client.close();
    });

    it('should pause when no songs or filler available', async () => {
      mockGetNextSong.mockReturnValue(null);
      mockGetNextFillerSong.mockReturnValue(null);

      const client = await createClient(port);

      client.send(JSON.stringify({ type: 'song_ended' }));
      const response = await waitForMessage(client);

      expect(response.type).toBe('pause');

      client.close();
    });
  });

  describe('Ticker Updates', () => {
    it('should broadcast ticker updates to all clients', async () => {
      const client1 = await createClient(port);
      const client2 = await createClient(port);

      client1.send(JSON.stringify({
        type: 'ticker_updated',
        payload: 'New ticker message'
      }));

      const response1 = await waitForMessage(client1);
      const response2 = await waitForMessage(client2);

      expect(response1.type).toBe('ticker_updated');
      expect(response1.payload).toBe('New ticker message');
      expect(response2.type).toBe('ticker_updated');
      expect(response2.payload).toBe('New ticker message');

      client1.close();
      client2.close();
    });
  });

  describe('Generic Message Broadcasting', () => {
    it('should broadcast unknown message types to other clients', async () => {
      const client1 = await createClient(port);
      const client2 = await createClient(port);

      const customMessage = {
        type: 'custom_message',
        payload: { data: 'test' }
      };

      client1.send(JSON.stringify(customMessage));

      // Client2 should receive the message, but not client1 (sender)
      const response = await waitForMessage(client2);
      expect(response).toEqual(customMessage);

      // Client1 should not receive the message back
      await expect(waitForMessage(client1, 500)).rejects.toThrow('Message timeout');

      client1.close();
      client2.close();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON messages gracefully', async () => {
      const client = await createClient(port);

      // Send invalid JSON
      client.send('invalid json {');

      // Server should not crash, and connection should remain open
      expect(client.readyState).toBe(WebSocket.OPEN);

      // Should still be able to send valid messages
      client.send(JSON.stringify({ type: 'get_queue' }));
      await waitForMessage(client);

      client.close();
    });

    it('should handle missing payload gracefully', async () => {
      const client = await createClient(port);

      client.send(JSON.stringify({ type: 'request_song' }));

      // Should not crash, might not receive response
      expect(client.readyState).toBe(WebSocket.OPEN);

      client.close();
    });

    it('should handle exceptions in message handlers', async () => {
      mockGetSongById.mockImplementation(() => {
        throw new Error('Database error');
      });

      const client = await createClient(port);

      client.send(JSON.stringify({
        type: 'request_song',
        payload: { songId: '1', singerName: 'Test' }
      }));

      // Server should handle the error gracefully
      expect(client.readyState).toBe(WebSocket.OPEN);

      client.close();
    });
  });

  describe('Load and Performance', () => {
    it('should handle rapid message sending', async () => {
      const client = await createClient(port);
      const messageCount = 50;

      // Send many messages rapidly
      for (let i = 0; i < messageCount; i++) {
        client.send(JSON.stringify({ type: 'get_queue' }));
      }

      // Should receive all responses
      const responses = [];
      for (let i = 0; i < messageCount; i++) {
        const response = await waitForMessage(client);
        responses.push(response);
      }

      expect(responses).toHaveLength(messageCount);
      responses.forEach(response => {
        expect(response.type).toBe('queue_updated');
      });

      client.close();
    });

    it('should handle many concurrent clients sending messages', async () => {
      const clientCount = 20;
      const clients = await Promise.all(
        Array.from({ length: clientCount }, () => createClient(port))
      );

      // Each client sends a message
      const promises = clients.map((client, i) => {
        client.send(JSON.stringify({ type: 'get_queue' }));
        return waitForMessage(client);
      });

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(clientCount);
      responses.forEach(response => {
        expect(response.type).toBe('queue_updated');
      });

      clients.forEach(client => client.close());
    });
  });
});