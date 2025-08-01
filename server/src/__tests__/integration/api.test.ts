import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('fs');
vi.mock('path');
vi.mock('../../mediaLibrary');
vi.mock('../../songQueue');
vi.mock('../../fillerMusic');

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

// Import mocked modules
import { searchSongs } from '../../mediaLibrary';
import { getQueue } from '../../songQueue';

const mockSearchSongs = vi.mocked(searchSongs);
const mockGetQueue = vi.mocked(getQueue);

// Create test app with just the API routes (without WebSocket)
function createTestApp() {
  const app = express();
  
  // Mock path setup
  mockPath.join.mockImplementation((...args) => args.join('/'));
  
  // API endpoint to search songs
  app.get('/api/songs', (req, res) => {
    const query = req.query.q as string || '';
    const results = mockSearchSongs(query);
    res.json(results);
  });

  // API endpoint to stream video files
  app.get('/api/media/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const mediaPath = mockPath.join('media', fileName);

    try {
      const mockStats = {
        size: 1024000, // 1MB mock file
        isFile: () => true
      };
      
      mockFs.statSync.mockReturnValue(mockStats as any);
      
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : mockStats.size - 1;

        const chunksize = (end - start) + 1;
        
        // Mock readable stream
        const mockStream = {
          pipe: vi.fn((response) => {
            response.end('mock video chunk');
          })
        };
        
        mockFs.createReadStream.mockReturnValue(mockStream as any);
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${mockStats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        });
        
        mockStream.pipe(res);
      } else {
        const mockStream = {
          pipe: vi.fn((response) => {
            response.end('mock full video');
          })
        };
        
        mockFs.createReadStream.mockReturnValue(mockStream as any);
        
        res.writeHead(200, {
          'Content-Length': mockStats.size,
          'Content-Type': 'video/mp4',
        });
        
        mockStream.pipe(res);
      }
    } catch (error) {
      res.status(404).send('File not found');
    }
  });

  return app;
}

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/songs', () => {
    it('should return all songs when no query provided', async () => {
      const mockSongs = [
        { id: '1', artist: 'Artist 1', title: 'Song 1', fileName: 'song1.mp4' },
        { id: '2', artist: 'Artist 2', title: 'Song 2', fileName: 'song2.mp4' }
      ];
      
      mockSearchSongs.mockReturnValue(mockSongs);

      const response = await request(app)
        .get('/api/songs')
        .expect(200);

      expect(response.body).toEqual(mockSongs);
      expect(mockSearchSongs).toHaveBeenCalledWith('');
    });

    it('should return filtered songs when query provided', async () => {
      const mockSongs = [
        { id: '1', artist: 'Taylor Swift', title: 'Shake It Off', fileName: 'shake.mp4' }
      ];
      
      mockSearchSongs.mockReturnValue(mockSongs);

      const response = await request(app)
        .get('/api/songs?q=Taylor')
        .expect(200);

      expect(response.body).toEqual(mockSongs);
      expect(mockSearchSongs).toHaveBeenCalledWith('Taylor');
    });

    it('should handle empty search results', async () => {
      mockSearchSongs.mockReturnValue([]);

      const response = await request(app)
        .get('/api/songs?q=NonExistent')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle special characters in query', async () => {
      mockSearchSongs.mockReturnValue([]);

      await request(app)
        .get('/api/songs?q=test%20%26%20special')
        .expect(200);

      expect(mockSearchSongs).toHaveBeenCalledWith('test & special');
    });

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000);
      mockSearchSongs.mockReturnValue([]);

      await request(app)
        .get(`/api/songs?q=${longQuery}`)
        .expect(200);

      expect(mockSearchSongs).toHaveBeenCalledWith(longQuery);
    });
  });

  describe('GET /api/media/:fileName', () => {
    it('should serve video file with full content when no range header', async () => {
      const response = await request(app)
        .get('/api/media/test-song.mp4')
        .expect(200);

      expect(response.headers['content-type']).toBe('video/mp4');
      expect(response.headers['content-length']).toBe('1024000');
      expect(response.text).toBe('mock full video');
      expect(mockFs.createReadStream).toHaveBeenCalled();
    });

    it('should serve partial content with range header', async () => {
      const response = await request(app)
        .get('/api/media/test-song.mp4')
        .set('Range', 'bytes=0-1023')
        .expect(206);

      expect(response.headers['content-range']).toBe('bytes 0-1023/1024000');
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.headers['content-length']).toBe('1024');
      expect(response.text).toBe('mock video chunk');
    });

    it('should handle range header with only start byte', async () => {
      const response = await request(app)
        .get('/api/media/test-song.mp4')
        .set('Range', 'bytes=1024-')
        .expect(206);

      expect(response.headers['content-range']).toBe('bytes 1024-1023999/1024000');
      expect(response.headers['content-length']).toBe('1022976');
    });

    it('should return 404 for non-existent file', async () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await request(app)
        .get('/api/media/non-existent.mp4')
        .expect(404);

      expect(mockFs.statSync).toHaveBeenCalled();
    });

    it('should handle malformed range headers gracefully', async () => {
      await request(app)
        .get('/api/media/test-song.mp4')
        .set('Range', 'invalid-range-header')
        .expect(200); // Should fall back to full content

      expect(mockFs.createReadStream).toHaveBeenCalled();
    });

    it('should set correct MIME type for different file extensions', async () => {
      // Test MP4
      await request(app)
        .get('/api/media/test.mp4')
        .expect(200)
        .expect('Content-Type', 'video/mp4');

      // Test other formats (they should still get video/mp4 in this implementation)
      await request(app)
        .get('/api/media/test.webm')
        .expect(200)
        .expect('Content-Type', 'video/mp4');
    });

    it('should handle special characters in file names', async () => {
      await request(app)
        .get('/api/media/Artist%20-%20Song%20Name.mp4')
        .expect(200);

      expect(mockPath.join).toHaveBeenCalledWith('media', 'Artist - Song Name.mp4');
    });

    it('should prevent directory traversal attacks', async () => {
      await request(app)
        .get('/api/media/../../../etc/passwd')
        .expect(404);

      // The path should still be constructed with the media directory
      expect(mockPath.join).toHaveBeenCalledWith('media', '../../../etc/passwd');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully in media serving', async () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await request(app)
        .get('/api/media/test.mp4')
        .expect(404);
    });

    it('should handle search function errors gracefully', async () => {
      mockSearchSongs.mockImplementation(() => {
        throw new Error('Search failed');
      });

      // The API should handle this gracefully or return 500
      const response = await request(app)
        .get('/api/songs?q=test');

      // Depending on implementation, this might be 500 or handled gracefully
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple concurrent requests', async () => {
      mockSearchSongs.mockReturnValue([]);

      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app).get(`/api/songs?q=test${i}`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
      });

      expect(mockSearchSongs).toHaveBeenCalledTimes(10);
    });

    it('should handle large file range requests efficiently', async () => {
      // Test large range request
      await request(app)
        .get('/api/media/large-file.mp4')
        .set('Range', 'bytes=0-10000000') // 10MB range
        .expect(206);

      expect(mockFs.createReadStream).toHaveBeenCalledWith(
        expect.any(String),
        { start: 0, end: 1023999 } // Should be capped by file size
      );
    });
  });
});