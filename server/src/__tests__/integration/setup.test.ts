import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { applySetupRoutes } from '../../setupWizard';

// Mock modules before importing
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    statSync: vi.fn(),
    accessSync: vi.fn(),
    readdirSync: vi.fn(),
    constants: {
      R_OK: 4,
      W_OK: 2
    }
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn(),
  accessSync: vi.fn(),
  readdirSync: vi.fn(),
  constants: {
    R_OK: 4,
    W_OK: 2
  }
}));

vi.mock('path', () => ({
  default: {
    dirname: vi.fn(),
    join: vi.fn(),
    extname: vi.fn()
  },
  dirname: vi.fn(),
  join: vi.fn(),
  extname: vi.fn()
}));

vi.mock('os', () => ({
  networkInterfaces: vi.fn(() => ({
    eth0: [{ address: '192.168.1.100', family: 'IPv4', internal: false }]
  }))
}));

vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/mock/setupWizard.js')
}));

import fs from 'fs';
import path from 'path';
const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

// Setup path mocks
const mockConfigDir = '/mock/config';
const mockConfigFile = '/mock/config/setup.json';

mockPath.dirname.mockImplementation((filePath) => {
  if (filePath === '/mock/setupWizard.js') return '/mock';
  if (filePath === mockConfigFile) return mockConfigDir;
  return mockConfigDir;
});
mockPath.join.mockImplementation((...args) => {
  if (args.includes('../config/setup.json')) return mockConfigFile;
  return args.join('/');
});
mockPath.extname.mockImplementation((filePath) => {
  if (filePath.endsWith('.mp4')) return '.mp4';
  if (filePath.endsWith('.avi')) return '.avi';
  if (filePath.endsWith('.mkv')) return '.mkv';
  if (filePath.endsWith('.mov')) return '.mov';
  return '';
});

function createTestApp() {
  const app = express();
  app.use(express.json());
  applySetupRoutes(app);
  return app;
}

describe('Setup API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Re-establish path mocks that were cleared
    mockPath.dirname.mockImplementation((filePath) => {
      if (filePath === '/mock/setupWizard.js') return '/mock';
      if (filePath === mockConfigFile) return mockConfigDir;
      return mockConfigDir;
    });
    mockPath.join.mockImplementation((...args) => {
      if (args.includes('../config/setup.json')) return mockConfigFile;
      return args.join('/');
    });
    mockPath.extname.mockImplementation((filePath) => {
      if (filePath.endsWith('.mp4')) return '.mp4';
      if (filePath.endsWith('.avi')) return '.avi';
      if (filePath.endsWith('.mkv')) return '.mkv';
      if (filePath.endsWith('.mov')) return '.mov';
      return '';
    });
    
    // Mock fs operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    
    app = createTestApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/setup/config', () => {
    it('should return default config when no config file exists', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const response = await request(app)
        .get('/api/setup/config')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          kjName: 'Local KJ',
          setupComplete: false
        })
      }));
    });
  });

  describe('POST /api/setup/config', () => {
    it('should save the configuration', async () => {
      const newConfig = {
        kjName: 'Test KJ',
        venue: 'Test Venue'
      };

      mockFs.writeFileSync.mockImplementation(() => {});

      const response = await request(app)
        .post('/api/setup/config')
        .send(newConfig)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining(newConfig)
      }));
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('GET /api/setup/network', () => {
    it('should return network information', async () => {
      const response = await request(app)
        .get('/api/setup/network')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          localIP: expect.any(String),
          interfaces: expect.any(Array)
        })
      }));
    });
  });

  describe('POST /api/setup/validate-media', () => {
    it('should validate the media directory', async () => {
      // Mock all required fs operations
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => true
      } as any);
      mockFs.accessSync.mockImplementation(() => {}); // Can read
      mockFs.readdirSync.mockReturnValue(['song.mp4'] as any);

      const response = await request(app)
        .post('/api/setup/validate-media')
        .send({ path: '/media' })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          valid: true,
          stats: expect.objectContaining({
            videoCount: 1,
            exists: true,
            readable: true
          })
        })
      }));
    });

    it('should handle directory that does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .post('/api/setup/validate-media')
        .send({ path: '/nonexistent' })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          valid: false,
          error: 'Directory does not exist'
        })
      }));
    });

    it('should handle path that is not a directory', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => false
      } as any);

      const response = await request(app)
        .post('/api/setup/validate-media')
        .send({ path: '/file.txt' })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          valid: false,
          error: 'Path is not a directory'
        })
      }));
    });

    it('should handle unreadable directory', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => true
      } as any);
      mockFs.accessSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const response = await request(app)
        .post('/api/setup/validate-media')
        .send({ path: '/restricted' })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          valid: false,
          error: 'Directory is not readable'
        })
      }));
    });

    it('should handle writable directory', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => true
      } as any);
      mockFs.accessSync.mockImplementation((path: fs.PathLike, mode: number | undefined) => {
        if (mode === fs.constants.W_OK) {
          throw new Error('Not writable');
        }
        return; // Readable
      });
      mockFs.readdirSync.mockReturnValue(['song.mp4'] as any);

      const response = await request(app)
        .post('/api/setup/validate-media')
        .send({ path: '/readonly' })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          valid: true,
          stats: expect.objectContaining({
            videoCount: 1,
            exists: true,
            readable: true,
            writable: false
          })
        })
      }));
    });
  });
});
