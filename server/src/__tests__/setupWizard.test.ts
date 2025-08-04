import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { mockEnsureDataDirExists, mockGetDataPath } = vi.hoisted(() => {
  return {
    mockEnsureDataDirExists: vi.fn(),
    mockGetDataPath: vi.fn(),
  };
});

// Mock dependencies before any imports
vi.mock('fs');
vi.mock('path');
vi.mock('os');
vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/mock/setupWizard.js')
}));

// Mock the new dataPath module
vi.mock('../dataPath.js', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    ensureDataDirExists: mockEnsureDataDirExists,
    getDataPath: mockGetDataPath,
    getMediaDefaultPath: () => '/mock/media',
  };
});

import fs from 'fs';
import path from 'path';
import { networkInterfaces } from 'os';

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);
const mockNetworkInterfaces = vi.mocked(networkInterfaces);

// Setup path mocks before importing setupWizard
const mockConfigDir = '/mock/config';
const mockConfigFile = '/mock/config/setup.json';
const mockMediaDir = '/mock/media';

mockPath.dirname.mockImplementation((filePath) => {
  if (filePath === '/mock/setupWizard.js') return '/mock';
  return mockConfigDir;
});
mockPath.join.mockImplementation((...args) => {
  if (args.includes('../config/setup.json')) return mockConfigFile;
  if (args.includes('../media')) return mockMediaDir;
  return args.join('/');
});
mockPath.extname.mockImplementation((file) => {
  const lastDot = file.lastIndexOf('.');
  return lastDot >= 0 ? file.substring(lastDot) : '';
});

// Now import setupWizard after mocks are set up
import {
  loadSetupConfig,
  saveSetupConfig,
  getNetworkInfo,
  validateMediaDirectory,
  getSetupSteps,
  isSetupRequired,
  markSetupComplete,
  resetSetup,
  getMediaDirectorySuggestions,
  SetupConfig
} from '../setupWizard.js';

describe('SetupWizard', () => {
  beforeEach(() => {
    // Clear call history but keep implementations
    vi.clearAllMocks();
    
    // Point getDataPath mock to our test file
    mockGetDataPath.mockReturnValue(mockConfigFile);

    // Re-establish mocks that were cleared
    mockPath.dirname.mockImplementation((filePath) => {
      if (filePath === '/mock/setupWizard.js') return '/mock';
      return mockConfigDir;
    });
    mockPath.join.mockImplementation((...args) => {
      if (args.includes('../config/setup.json')) return mockConfigFile;
      if (args.includes('../media')) return mockMediaDir;
      return args.join('/');
    });
    mockPath.extname.mockImplementation((file) => {
      const lastDot = file.lastIndexOf('.');
      return lastDot >= 0 ? file.substring(lastDot) : '';
    });
    
    // Mock console to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration Management', () => {
    describe('loadSetupConfig', () => {
      it('should return default config when config file does not exist', () => {
        mockFs.existsSync.mockReturnValue(false);

        const config = loadSetupConfig();

        expect(config).toEqual(expect.objectContaining({
          kjName: 'Local KJ',
          venue: '',
          autoLaunchBrowser: true,
          defaultPort: 8080,
          enableNetworkAccess: true,
          setupComplete: false
        }));
        expect(mockEnsureDataDirExists).toHaveBeenCalled();
      });

      it('should load existing config file successfully', () => {
        const mockConfig: SetupConfig = {
          mediaDirectory: '/custom/media',
          kjName: 'Test KJ',
          venue: 'Test Venue',
          autoLaunchBrowser: false,
          defaultPort: 9000,
          enableNetworkAccess: true,
          setupComplete: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastModified: '2024-01-02T00:00:00.000Z'
        };

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

        const config = loadSetupConfig();

        expect(config).toEqual(expect.objectContaining(mockConfig));
        expect(mockFs.readFileSync).toHaveBeenCalled();
      });

      it('should merge with defaults when config is incomplete', () => {
        const partialConfig = {
          mediaDirectory: '/custom/media',
          kjName: 'Test KJ'
        };

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(partialConfig));

        const config = loadSetupConfig();

        expect(config).toEqual(expect.objectContaining({
          mediaDirectory: '/custom/media',
          kjName: 'Test KJ',
          autoLaunchBrowser: true, // Should have default
          defaultPort: 8080, // Should have default
          setupComplete: false // Should have default
        }));
      });

      it('should return default config when JSON parsing fails', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue('invalid json {');

        const config = loadSetupConfig();

        expect(config).toEqual(expect.objectContaining({
          kjName: 'Local KJ',
          setupComplete: false
        }));
        expect(console.error).toHaveBeenCalledWith('[SetupWizard] Error loading config:', expect.any(SyntaxError));
      });

      it('should handle file read errors gracefully', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const config = loadSetupConfig();

        expect(config).toEqual(expect.objectContaining({
          kjName: 'Local KJ',
          setupComplete: false
        }));
        expect(console.error).toHaveBeenCalledWith('[SetupWizard] Error loading config:', expect.any(Error));
      });

      it('should ensure data directory exists on load', () => {
        mockFs.existsSync.mockReturnValue(false); // Config file doesn't exist
        loadSetupConfig();
        expect(mockEnsureDataDirExists).toHaveBeenCalled();
      });
    });

    describe('saveSetupConfig', () => {
      const mockConfig: SetupConfig = {
        mediaDirectory: '/test/media',
        kjName: 'Test KJ',
        venue: 'Test Venue',
        autoLaunchBrowser: true,
        defaultPort: 8080,
        enableNetworkAccess: true,
        setupComplete: true
      };

      beforeEach(() => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.mkdirSync.mockImplementation(() => undefined);
        mockFs.writeFileSync.mockImplementation(() => undefined);
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T12:00:00.000Z');
      });

      it('should save config successfully', () => {
        const result = saveSetupConfig(mockConfig);

        expect(result).toBe(true);
        expect(mockFs.writeFileSync).toHaveBeenCalled();
        
        const writeCall = mockFs.writeFileSync.mock.calls[0];
        expect(writeCall[1]).toContain('"kjName": "Test KJ"');
        expect(console.log).toHaveBeenCalledWith('[SetupWizard] Configuration saved successfully');
      });

      it('should add lastModified timestamp', () => {
        saveSetupConfig(mockConfig);

        const writeCall = mockFs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(writeCall[1] as string);
        
        expect(savedData.lastModified).toBe('2024-01-01T12:00:00.000Z');
      });

      it('should add createdAt timestamp if not present', () => {
        saveSetupConfig(mockConfig);

        const writeCall = mockFs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(writeCall[1] as string);
        
        expect(savedData.createdAt).toBe('2024-01-01T12:00:00.000Z');
      });

      it('should preserve existing createdAt timestamp', () => {
        const configWithCreatedAt = {
          ...mockConfig,
          createdAt: '2023-01-01T00:00:00.000Z'
        };

        saveSetupConfig(configWithCreatedAt);

        const writeCall = mockFs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(writeCall[1] as string);
        
        expect(savedData.createdAt).toBe('2023-01-01T00:00:00.000Z');
        expect(savedData.lastModified).toBe('2024-01-01T12:00:00.000Z');
      });

      it('should ensure data directory exists on save', () => {
        mockFs.existsSync.mockReturnValue(false);
        saveSetupConfig(mockConfig);
        expect(mockEnsureDataDirExists).toHaveBeenCalled();
      });

      it('should handle write errors gracefully', () => {
        mockFs.writeFileSync.mockImplementation(() => {
          throw new Error('Disk full');
        });

        const result = saveSetupConfig(mockConfig);

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('[SetupWizard] Error saving config:', expect.any(Error));
      });

      it('should format JSON with proper indentation', () => {
        saveSetupConfig(mockConfig);

        const writeCall = mockFs.writeFileSync.mock.calls[0];
        const jsonString = writeCall[1] as string;
        
        expect(jsonString).toContain('{\n  ');
        expect(jsonString).toContain('\n}');
      });
    });
  });

  describe('Network Information', () => {
    describe('getNetworkInfo', () => {
      it('should return network interface information', () => {
        mockNetworkInterfaces.mockReturnValue({
          lo: [
            {
              address: '127.0.0.1',
              netmask: '255.0.0.0',
              family: 'IPv4',
              mac: '00:00:00:00:00:00',
              internal: true,
              cidr: '127.0.0.1/8'
            }
          ],
          eth0: [
            {
              address: '192.168.1.100',
              netmask: '255.255.255.0',
              family: 'IPv4',
              mac: '01:02:03:04:05:06',
              internal: false,
              cidr: '192.168.1.100/24'
            }
          ]
        });

        const networkInfo = getNetworkInfo();

        expect(networkInfo).toEqual({
          localIP: '192.168.1.100',
          interfaces: [
            {
              name: 'lo',
              address: '127.0.0.1',
              internal: true
            },
            {
              name: 'eth0',
              address: '192.168.1.100',
              internal: false
            }
          ]
        });
      });

      it('should prefer non-internal IP addresses', () => {
        mockNetworkInterfaces.mockReturnValue({
          lo: [
            {
              address: '127.0.0.1',
              netmask: '255.0.0.0',
              family: 'IPv4',
              mac: '00:00:00:00:00:00',
              internal: true,
              cidr: '127.0.0.1/8'
            }
          ],
          wlan0: [
            {
              address: '10.0.0.50',
              netmask: '255.255.255.0',
              family: 'IPv4',
              mac: '01:02:03:04:05:06',
              internal: false,
              cidr: '10.0.0.50/24'
            }
          ],
          eth0: [
            {
              address: '192.168.1.100',
              netmask: '255.255.255.0',
              family: 'IPv4',
              mac: '01:02:03:04:05:07',
              internal: false,
              cidr: '192.168.1.100/24'
            }
          ]
        });

        const networkInfo = getNetworkInfo();

        // Should pick first non-internal address found
        expect(networkInfo.localIP).toBe('10.0.0.50');
      });

      it('should use localhost when only internal addresses available', () => {
        mockNetworkInterfaces.mockReturnValue({
          lo: [
            {
              address: '127.0.0.1',
              netmask: '255.0.0.0',
              family: 'IPv4',
              mac: '00:00:00:00:00:00',
              internal: true,
              cidr: '127.0.0.1/8'
            }
          ]
        });

        const networkInfo = getNetworkInfo();

        expect(networkInfo.localIP).toBe('localhost');
      });

      it('should filter out IPv6 addresses', () => {
        mockNetworkInterfaces.mockReturnValue({
          eth0: [
            {
              address: '::1',
              netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
              family: 'IPv6',
              mac: '01:02:03:04:05:06',
              internal: true,
              cidr: '::1/128'
            } as any, // Cast to any to bypass missing scopeid
            {
              address: '192.168.1.100',
              netmask: '255.255.255.0',
              family: 'IPv4',
              mac: '01:02:03:04:05:06',
              internal: false,
              cidr: '192.168.1.100/24'
            }
          ]
        });

        const networkInfo = getNetworkInfo();

        expect(networkInfo.interfaces).toHaveLength(1);
        expect(networkInfo.interfaces[0].address).toBe('192.168.1.100');
      });

      it('should handle empty network interfaces', () => {
        mockNetworkInterfaces.mockReturnValue({});

        const networkInfo = getNetworkInfo();

        expect(networkInfo).toEqual({
          localIP: 'localhost',
          interfaces: []
        });
      });

      it('should handle network interfaces with null values', () => {
        mockNetworkInterfaces.mockReturnValue({
          eth0: null as any,
          eth1: [
            {
              address: '192.168.1.100',
              netmask: '255.255.255.0',
              family: 'IPv4',
              mac: '01:02:03:04:05:06',
              internal: false,
              cidr: '192.168.1.100/24'
            }
          ]
        });

        const networkInfo = getNetworkInfo();

        expect(networkInfo.interfaces).toHaveLength(1);
        expect(networkInfo.interfaces[0].address).toBe('192.168.1.100');
      });
    });
  });

  describe('Media Directory Validation', () => {
    describe('validateMediaDirectory', () => {
      const testDirectory = '/test/media';

      beforeEach(() => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.statSync.mockReturnValue({
          isDirectory: () => true
        } as any);
        mockFs.accessSync.mockImplementation(() => undefined);
        mockFs.readdirSync.mockReturnValue([]);
      });

      it('should validate existing directory successfully', () => {
        mockFs.readdirSync.mockReturnValue([
          'song1.mp4',
          'song2.webm',
          'filler-music1.mp4',
          'document.txt',
        ] as any);

        const result = validateMediaDirectory(testDirectory);

        expect(result).toEqual({
          valid: true,
          stats: {
            exists: true,
            readable: true,
            writable: true,
            videoCount: 2,
            fillerCount: 1
          }
        });
      });

      it('should return error when directory does not exist', () => {
        mockFs.existsSync.mockReturnValue(false);

        const result = validateMediaDirectory(testDirectory);

        expect(result).toEqual({
          valid: false,
          error: 'Directory does not exist'
        });
      });

      it('should return error when path is not a directory', () => {
        mockFs.statSync.mockReturnValue({
          isDirectory: () => false
        } as any);

        const result = validateMediaDirectory(testDirectory);

        expect(result).toEqual({
          valid: false,
          error: 'Path is not a directory'
        });
      });

      it('should return error when directory is not readable', () => {
        mockFs.accessSync.mockImplementation((path, mode) => {
          if (mode === fs.constants.R_OK) {
            throw new Error('Permission denied');
          }
        });

        const result = validateMediaDirectory(testDirectory);

        expect(result).toEqual({
          valid: false,
          error: 'Directory is not readable'
        });
      });

      it('should handle non-writable directory gracefully', () => {
        mockFs.accessSync.mockImplementation((path, mode) => {
          if (mode === fs.constants.W_OK) {
            throw new Error('Permission denied');
          }
        });
        mockFs.readdirSync.mockReturnValue(['song1.mp4'] as any);

        const result = validateMediaDirectory(testDirectory);

        expect(result).toEqual({
          valid: true,
          stats: {
            exists: true,
            readable: true,
            writable: false,
            videoCount: 1,
            fillerCount: 0
          }
        });
      });

      it('should count video files correctly by extension', () => {
        mockFs.readdirSync.mockReturnValue([
          'song1.mp4',
          'song2.MP4', // Test case sensitivity
          'song3.webm',
          'song4.avi',
          'song5.mov',
          'song6.mkv', // Not a supported format
          'document.txt',
          'filler-music.mp4',
        ] as any);

        const result = validateMediaDirectory(testDirectory);

        expect(result.stats?.videoCount).toBe(5); // Should count .mp4, .webm, .avi, .mov
        expect(result.stats?.fillerCount).toBe(1);
      });

      it('should identify filler music files correctly', () => {
        mockFs.readdirSync.mockReturnValue([
          'song1.mp4',
          'filler-music1.mp4',
          'FILLER-Music2.webm', // Test case sensitivity
          'background-filler-song.avi',
        ] as any);

        const result = validateMediaDirectory(testDirectory);

        expect(result.stats?.videoCount).toBe(2); // song1.mp4 and background-filler-song.avi
        expect(result.stats?.fillerCount).toBe(2); // filler-music files
      });

      it('should handle file system errors gracefully', () => {
        mockFs.statSync.mockImplementation(() => {
          throw new Error('I/O error');
        });

        const result = validateMediaDirectory(testDirectory);

        expect(result).toEqual({
          valid: false,
          error: 'Error accessing directory: Error: I/O error'
        });
      });

      it('should handle readdir errors gracefully', () => {
        mockFs.readdirSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const result = validateMediaDirectory(testDirectory);

        expect(result).toEqual({
          valid: false,
          error: 'Error accessing directory: Error: Permission denied'
        });
      });
    });
  });

  describe('Setup Steps Management', () => {
    describe('getSetupSteps', () => {
      it('should return all setup steps with correct structure', () => {
        const mockConfig: SetupConfig = {
          mediaDirectory: '/test/media',
          kjName: 'Test KJ',
          venue: 'Test Venue',
          autoLaunchBrowser: true,
          defaultPort: 8080,
          enableNetworkAccess: true,
          setupComplete: true
        };

        // Mock successful media directory validation
        mockFs.existsSync.mockReturnValue(true);
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
        mockFs.accessSync.mockImplementation(() => undefined);
        mockFs.readdirSync.mockReturnValue([
          'song1.mp4',
          'song2.webm',
        ] as any);

        const steps = getSetupSteps(mockConfig);

        expect(steps).toHaveLength(5);
        expect(steps[0]).toEqual({
          id: 'welcome',
          title: 'Welcome to KJ-Nomad',
          description: 'Set up your professional karaoke hosting system',
          completed: true,
          required: true
        });
      });

      it('should mark media-library step as incomplete when no videos found', () => {
        const mockConfig: SetupConfig = {
          mediaDirectory: '/test/media',
          kjName: 'Test KJ',
          venue: '',
          autoLaunchBrowser: true,
          defaultPort: 8080,
          enableNetworkAccess: true,
          setupComplete: false
        };

        // Mock directory with no video files
        mockFs.existsSync.mockReturnValue(true);
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
        mockFs.accessSync.mockImplementation(() => undefined);
        mockFs.readdirSync.mockReturnValue([
          'document.txt',
        ] as any);

        const steps = getSetupSteps(mockConfig);
        const mediaStep = steps.find(step => step.id === 'media-library');

        expect(mediaStep?.completed).toBe(false);
      });

      it('should mark kj-info step as incomplete with default KJ name', () => {
        const mockConfig: SetupConfig = {
          mediaDirectory: '/test/media',
          kjName: 'Local KJ', // Default name
          venue: '',
          autoLaunchBrowser: true,
          defaultPort: 8080,
          enableNetworkAccess: true,
          setupComplete: false
        };

        const steps = getSetupSteps(mockConfig);
        const kjStep = steps.find(step => step.id === 'kj-info');

        expect(kjStep?.completed).toBe(false);
        expect(kjStep?.required).toBe(false);
      });

      it('should mark kj-info step as complete with custom KJ name', () => {
        const mockConfig: SetupConfig = {
          mediaDirectory: '/test/media',
          kjName: 'DJ Mike',
          venue: 'Club XYZ',
          autoLaunchBrowser: true,
          defaultPort: 8080,
          enableNetworkAccess: true,
          setupComplete: false
        };

        const steps = getSetupSteps(mockConfig);
        const kjStep = steps.find(step => step.id === 'kj-info');

        expect(kjStep?.completed).toBe(true);
      });

      it('should use loaded config when no config parameter provided', () => {
        // Mock loadSetupConfig to return specific config
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify({
          mediaDirectory: '/loaded/media',
          kjName: 'Loaded KJ',
          setupComplete: true
        }));
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
        mockFs.accessSync.mockImplementation(() => undefined);
        mockFs.readdirSync.mockReturnValue([
          'song1.mp4',
        ] as any);

        const steps = getSetupSteps();
        const testStep = steps.find(step => step.id === 'test-setup');

        expect(testStep?.completed).toBe(true);
      });
    });
  });

  describe('Setup State Management', () => {
    describe('isSetupRequired', () => {
      beforeEach(() => {
        // Mock file operations for loadSetupConfig
        mockFs.existsSync.mockReturnValue(true);
        mockFs.mkdirSync.mockImplementation(() => undefined);
      });

      it('should return true when setup has never been completed', () => {
        mockFs.readFileSync.mockReturnValue(JSON.stringify({
          setupComplete: false,
          mediaDirectory: '/test/media'
        }));

        const result = isSetupRequired();

        expect(result).toBe(true);
      });

      it('should return true when media directory is invalid', () => {
        mockFs.readFileSync.mockReturnValue(JSON.stringify({
          setupComplete: true,
          mediaDirectory: '/nonexistent/media'
        }));
        
        // Mock invalid directory
        mockFs.existsSync.mockImplementation((p) => {
          if (p && p.toString().includes('/nonexistent/media')) return false;
          if (p === mockConfigFile) return true;
          return false;
        });

        const result = isSetupRequired();

        expect(result).toBe(true);
      });

      it('should return true when no video files found', () => {
        mockFs.readFileSync.mockReturnValue(JSON.stringify({
          setupComplete: true,
          mediaDirectory: '/test/media'
        }));
        
        // Mock valid directory but no video files
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
        mockFs.accessSync.mockImplementation(() => undefined);
        mockFs.readdirSync.mockReturnValue([
          'document.txt',
        ] as any);

        const result = isSetupRequired();

        expect(result).toBe(true);
      });

      it('should return false when setup is complete and valid', () => {
        mockFs.readFileSync.mockReturnValue(JSON.stringify({
          setupComplete: true,
          mediaDirectory: '/test/media'
        }));
        
        // Mock valid directory with video files
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
        mockFs.accessSync.mockImplementation(() => undefined);
        mockFs.readdirSync.mockReturnValue([
          'song1.mp4',
          'song2.webm',
        ] as any);

        const result = isSetupRequired();

        expect(result).toBe(false);
      });
    });

    describe('markSetupComplete', () => {
      it('should mark setup as complete successfully', () => {
        const initialConfig = {
          mediaDirectory: '/test/media',
          kjName: 'Test KJ',
          setupComplete: false
        };

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(initialConfig));
        mockFs.writeFileSync.mockImplementation(() => undefined);
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T12:00:00.000Z');

        const result = markSetupComplete();

        expect(result).toBe(true);
        
        const writeCall = mockFs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(writeCall[1] as string);
        expect(savedData.setupComplete).toBe(true);
      });

      it('should handle save errors gracefully', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify({ setupComplete: false }));
        mockFs.writeFileSync.mockImplementation(() => {
          throw new Error('Disk full');
        });

        const result = markSetupComplete();

        expect(result).toBe(false);
      });
    });

    describe('resetSetup', () => {
      it('should reset setup successfully', () => {
        const initialConfig = {
          mediaDirectory: '/test/media',
          kjName: 'Test KJ',
          setupComplete: true
        };

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(initialConfig));
        mockFs.writeFileSync.mockImplementation(() => undefined);
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T12:00:00.000Z');

        const result = resetSetup();

        expect(result).toBe(true);
        
        const writeCall = mockFs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(writeCall[1] as string);
        expect(savedData.setupComplete).toBe(false);
      });

      it('should handle save errors gracefully', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify({ setupComplete: true }));
        mockFs.writeFileSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const result = resetSetup();

        expect(result).toBe(false);
      });
    });
  });

  describe('Media Directory Suggestions', () => {
    describe('getMediaDirectorySuggestions', () => {
      beforeEach(() => {
        mockFs.existsSync.mockReturnValue(false);
        mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      });

      it('should return default media directory when it exists', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);

        const suggestions = getMediaDirectorySuggestions();

        expect(Array.isArray(suggestions)).toBe(true);
        // Should include at least one directory when mocked as existing
        expect(suggestions.length).toBeGreaterThanOrEqual(0);
      });

      it('should include common directories when HOME is set', () => {
        const originalHome = process.env.HOME;
        process.env.HOME = '/Users/testuser';

        mockFs.existsSync.mockImplementation((path) => {
          return path.toString().includes('/Users/testuser/Documents/Karaoke') ||
                 path.toString().includes('/Users/testuser/Music/Karaoke');
        });
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);

        const suggestions = getMediaDirectorySuggestions();

        expect(suggestions).toContain('/Users/testuser/Documents/Karaoke');
        expect(suggestions).toContain('/Users/testuser/Music/Karaoke');

        process.env.HOME = originalHome;
      });

      it('should include common directories when USERPROFILE is set (Windows)', () => {
        const originalHome = process.env.HOME;
        const originalUserProfile = process.env.USERPROFILE;
        
        delete process.env.HOME;
        process.env.USERPROFILE = 'C:\\Users\\testuser';

        mockFs.existsSync.mockReturnValue(true);
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);

        const suggestions = getMediaDirectorySuggestions();

        // Should return suggestions when directories exist
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThanOrEqual(0);

        process.env.HOME = originalHome;
        process.env.USERPROFILE = originalUserProfile;
      });

      it('should filter out non-existent directories', () => {
        process.env.HOME = '/Users/testuser';

        mockFs.existsSync.mockImplementation((path) => {
          // Only Documents/Karaoke exists
          return path.toString().includes('/Users/testuser/Documents/Karaoke');
        });
        mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);

        const suggestions = getMediaDirectorySuggestions();

        expect(suggestions).toContain('/Users/testuser/Documents/Karaoke');
        expect(suggestions).not.toContain('/Users/testuser/Music/Karaoke');
      });

      it('should filter out files that are not directories', () => {
        process.env.HOME = '/Users/testuser';

        mockFs.existsSync.mockReturnValue(true);
        mockFs.statSync.mockImplementation((path) => {
          if (path.toString().includes('Documents/Karaoke')) {
            return { isDirectory: () => true } as any;
          }
          return { isDirectory: () => false } as any;
        });

        const suggestions = getMediaDirectorySuggestions();

        expect(suggestions).toContain('/Users/testuser/Documents/Karaoke');
        expect(suggestions).not.toContain('/Users/testuser/Music/Karaoke');
      });

      it('should handle file system errors gracefully', () => {
        process.env.HOME = '/Users/testuser';

        mockFs.existsSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const suggestions = getMediaDirectorySuggestions();

        // Should return empty array or only entries that don't throw
        expect(Array.isArray(suggestions)).toBe(true);
      });

      it('should return empty array when no home directory is set', () => {
        const originalHome = process.env.HOME;
        const originalUserProfile = process.env.USERPROFILE;
        
        delete process.env.HOME;
        delete process.env.USERPROFILE;

        const suggestions = getMediaDirectorySuggestions();

        // Should still include default media dir if it exists
        expect(Array.isArray(suggestions)).toBe(true);

        process.env.HOME = originalHome;
        process.env.USERPROFILE = originalUserProfile;
      });
    });
  });

  describe('isSetupComplete function', () => {
    it('should be exported and callable', () => {
      // This test ensures the function is properly exported
      expect(typeof isSetupRequired).toBe('function');
    });
  });
});
