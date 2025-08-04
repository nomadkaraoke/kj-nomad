import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exec } from 'child_process';
import { platform } from 'os';

// Mock dependencies before any imports
vi.mock('child_process');
vi.mock('os');

const mockExec = vi.mocked(exec);
const mockPlatform = vi.mocked(platform);

// Now import browserLauncher after mocks are set up
import {
  launchBrowser,
  launchAdminInterface,
  shouldAutoLaunch,
  displayStartupInstructions,
} from '../browserLauncher.js';

describe('BrowserLauncher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock timers to control setTimeout behavior
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Platform Detection', () => {
    describe('macOS platform', () => {
      it('should use "open" command for macOS', async () => {
        mockPlatform.mockReturnValue('darwin');
        mockExec.mockImplementation((_command, callback: any) => {
          if (callback && typeof callback === 'function') callback(null, '', '');
          return {} as any;
        });

        const promise = launchBrowser({ url: 'http://localhost:8080' });
        vi.advanceTimersByTime(2000);
        const result = await promise;

        expect(result).toBe(true);
        expect(mockExec).toHaveBeenCalledWith('open "http://localhost:8080"', expect.any(Function));
      });
    });

    describe('Windows platform', () => {
      it('should use "start" command for Windows', async () => {
        mockPlatform.mockReturnValue('win32');
        mockExec.mockImplementation((_command, callback: any) => {
          if (callback && typeof callback === 'function') callback(null, '', '');
          return {} as any;
        });

        const promise = launchBrowser({ url: 'http://localhost:8080' });
        vi.advanceTimersByTime(2000);
        const result = await promise;

        expect(result).toBe(true);
        expect(mockExec).toHaveBeenCalledWith('start "" "http://localhost:8080"', expect.any(Function));
      });
    });

    describe('Linux platform', () => {
      it('should use "xdg-open" command for Linux', async () => {
        mockPlatform.mockReturnValue('linux');
        mockExec.mockImplementation((_command, callback: any) => {
          if (callback && typeof callback === 'function') callback(null, '', '');
          return {} as any;
        });

        const promise = launchBrowser({ url: 'http://localhost:8080' });
        vi.advanceTimersByTime(2000);
        const result = await promise;

        expect(result).toBe(true);
        expect(mockExec).toHaveBeenCalledWith('xdg-open "http://localhost:8080"', expect.any(Function));
      });
    });

    describe('Unsupported platform', () => {
      it('should handle unsupported platform gracefully', async () => {
        mockPlatform.mockReturnValue('unsupported' as any);

        const promise = launchBrowser({ url: 'http://localhost:8080', suppressErrors: false });
        vi.advanceTimersByTime(2000);
        const result = await promise;

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('[BrowserLauncher] Error launching browser:', expect.any(Error));
      });

      it('should suppress errors when suppressErrors is true', async () => {
        mockPlatform.mockReturnValue('unsupported' as any);

        const promise = launchBrowser({ url: 'http://localhost:8080', suppressErrors: true });
        vi.advanceTimersByTime(2000);
        const result = await promise;

        expect(result).toBe(false);
        expect(console.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('launchBrowser Function', () => {
    beforeEach(() => {
      mockPlatform.mockReturnValue('darwin'); // Default to macOS for consistency
    });

    it('should launch browser successfully', async () => {
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, '', '');
        return {} as any;
      });

      const promise = launchBrowser({ url: 'http://localhost:8080' });
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('[BrowserLauncher] Opening browser: http://localhost:8080');
      expect(console.log).toHaveBeenCalledWith('[BrowserLauncher] Browser launched successfully');
    });

    it('should handle browser launch failure', async () => {
      const error = new Error('Browser not found');
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(error, '', '');
        return {} as any;
      });

      const promise = launchBrowser({ url: 'http://localhost:8080', suppressErrors: false });
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[BrowserLauncher] Failed to open browser:', 'Browser not found');
    });

    it('should suppress error messages when suppressErrors is true', async () => {
      const error = new Error('Browser not found');
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(error, '', '');
        return {} as any;
      });

      const promise = launchBrowser({ url: 'http://localhost:8080', suppressErrors: true });
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(false);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should respect custom delay', async () => {
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, '', '');
        return {} as any;
      });

      const promise = launchBrowser({ url: 'http://localhost:8080', delay: 5000 });
      
      // Advance timers by less than the delay
      vi.advanceTimersByTime(3000);
      expect(mockExec).not.toHaveBeenCalled();
      
      // Advance to the full delay
      vi.advanceTimersByTime(2000);
      await promise;
      
      expect(mockExec).toHaveBeenCalled();
    });

    it('should use default delay when not specified', async () => {
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, '', '');
        return {} as any;
      });

      const promise = launchBrowser({ url: 'http://localhost:8080' });
      
      // Default delay is 2000ms
      vi.advanceTimersByTime(1999);
      expect(mockExec).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(1);
      await promise;
      
      expect(mockExec).toHaveBeenCalled();
    });

    it('should properly escape URLs with spaces and special characters', async () => {
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, '', '');
        return {} as any;
      });

      const url = 'http://localhost:8080/path with spaces?param=value&other=test';
      const promise = launchBrowser({ url });
      vi.advanceTimersByTime(2000);
      await promise;

      expect(mockExec).toHaveBeenCalledWith(`open "${url}"`, expect.any(Function));
    });
  });

  describe('launchAdminInterface Function', () => {
    beforeEach(() => {
      mockPlatform.mockReturnValue('darwin');
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, '', '');
        return {} as any;
      });
    });

    it('should launch admin interface with default settings', async () => {
      const promise = launchAdminInterface(8080);
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith('open "http://localhost:8080"', expect.any(Function));
    });

    it('should launch admin interface with custom path', async () => {
      const promise = launchAdminInterface(8080, { path: '/admin' });
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith('open "http://localhost:8080/admin"', expect.any(Function));
    });

    it('should launch admin interface with custom delay', async () => {
      const promise = launchAdminInterface(8080, { delay: 3000 });
      
      vi.advanceTimersByTime(2000);
      expect(mockExec).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(1000);
      await promise;
      
      expect(mockExec).toHaveBeenCalled();
    });

    it('should launch admin interface with both custom path and delay', async () => {
      const promise = launchAdminInterface(8080, { path: '/controller', delay: 1000 });
      vi.advanceTimersByTime(1000);
      const result = await promise;

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith('open "http://localhost:8080/controller"', expect.any(Function));
    });

    it('should handle different port numbers', async () => {
      const promise = launchAdminInterface(3000, { path: '/dashboard' });
      vi.advanceTimersByTime(2000);
      await promise;

      expect(mockExec).toHaveBeenCalledWith('open "http://localhost:3000/dashboard"', expect.any(Function));
    });
  });

  describe('shouldAutoLaunch Function', () => {
          let originalEnv: typeof process.env;
    let originalArgv: string[];

    beforeEach(() => {
      originalEnv = { ...process.env };
      originalArgv = [...process.argv];
      
      // Clear environment variables
      delete process.env.NO_AUTO_LAUNCH;
      delete process.env.SESSION_ID;
      delete process.env.CI;
      delete process.env.NODE_ENV;
      delete process.env.DISPLAY;
      
      // Reset process.argv
      process.argv = ['node', 'script.js'];
    });

    afterEach(() => {
      process.env = originalEnv;
      process.argv = originalArgv;
    });

    it('should return true by default for local mode', () => {
      mockPlatform.mockReturnValue('darwin');
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(true);
    });

    it('should return false when NO_AUTO_LAUNCH is set', () => {
      process.env.NO_AUTO_LAUNCH = 'true';
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(false);
    });

    it('should return false when session ID is in command line arguments', () => {
      process.argv = ['node', 'script.js', '--session=1234'];
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(false);
    });

    it('should return false when SESSION_ID environment variable is set', () => {
      process.env.SESSION_ID = '1234';
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(false);
    });

    it('should return false when running in CI environment', () => {
      process.env.CI = 'true';
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(false);
    });

    it('should return false when running headless on Linux', () => {
      mockPlatform.mockReturnValue('linux');
      process.env.DISPLAY = '';
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(false);
    });

    it('should return true when DISPLAY is set on Linux', () => {
      mockPlatform.mockReturnValue('linux');
      process.env.DISPLAY = ':0.0';
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(true);
    });

    it('should return true on macOS even with empty DISPLAY', () => {
      mockPlatform.mockReturnValue('darwin');
      process.env.DISPLAY = '';
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(true);
    });

    it('should return true on Windows even with empty DISPLAY', () => {
      mockPlatform.mockReturnValue('win32');
      process.env.DISPLAY = '';
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(true);
    });

    it('should handle multiple conditions - prioritize NO_AUTO_LAUNCH', () => {
      process.env.NO_AUTO_LAUNCH = 'true';
      process.env.CI = 'true';
      process.argv = ['node', 'script.js', '--session=1234'];
      
      const result = shouldAutoLaunch();
      
      expect(result).toBe(false);
    });
  });

  describe('displayStartupInstructions Function', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should display local mode instructions by default', () => {
      displayStartupInstructions(8080);

      expect(console.log).toHaveBeenCalledWith('\n🎤 ===== KJ-NOMAD SERVER READY ===== 🎤\n');
      expect(console.log).toHaveBeenCalledWith('🏠 LOCAL MODE - Offline Operation');
      expect(console.log).toHaveBeenCalledWith('📱 Admin Interface: http://localhost:8080');
      expect(console.log).toHaveBeenCalledWith('🖥️  Player Screens: http://localhost:8080/player');
    });

    it('should display local mode instructions with local IP', () => {
      displayStartupInstructions(8080, { localIP: '192.168.1.100' });

      expect(console.log).toHaveBeenCalledWith('🌐 Network Access: http://192.168.1.100:8080');
      expect(console.log).toHaveBeenCalledWith('🖥️  Network Players: http://192.168.1.100:8080/player');
    });

    it('should display cloud mode instructions', () => {
      displayStartupInstructions(8080, { 
        cloudMode: true, 
        sessionId: '1234',
        localIP: '192.168.1.100'
      });

      expect(console.log).toHaveBeenCalledWith('🌐 CLOUD MODE - Session:', '1234');
      expect(console.log).toHaveBeenCalledWith('📱 Admin Interface: http://localhost:8080');
      expect(console.log).toHaveBeenCalledWith('🖥️  Player Screens: kj.nomadkaraoke.com/player?session=1234');
      expect(console.log).toHaveBeenCalledWith('🎵 Singer Requests: sing.nomadkaraoke.com?session=1234');
      expect(console.log).toHaveBeenCalledWith('🏠 Local Network: http://192.168.1.100:8080');
    });

    it('should display cloud mode instructions without local IP', () => {
      displayStartupInstructions(8080, { 
        cloudMode: true, 
        sessionId: '5678'
      });

      expect(console.log).toHaveBeenCalledWith('🌐 CLOUD MODE - Session:', '5678');
      expect(console.log).toHaveBeenCalledWith('📱 Admin Interface: http://localhost:8080');
      expect(console.log).toHaveBeenCalledWith('🖥️  Player Screens: kj.nomadkaraoke.com/player?session=5678');
      expect(console.log).toHaveBeenCalledWith('🎵 Singer Requests: sing.nomadkaraoke.com?session=5678');
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('🏠 Local Network:'));
    });

    it('should display setup checklist', () => {
      displayStartupInstructions(8080);

      expect(console.log).toHaveBeenCalledWith('\n🎯 SETUP CHECKLIST:');
      expect(console.log).toHaveBeenCalledWith('  ✅ Media library scanned');
      expect(console.log).toHaveBeenCalledWith('  ✅ Server running and ready');
      expect(console.log).toHaveBeenCalledWith('  📂 Add video files to: server/media/');
      expect(console.log).toHaveBeenCalledWith('  🎵 Add filler music: server/media/filler-*');
    });

    it('should display player screen instructions for local mode', () => {
      displayStartupInstructions(8080, { localIP: '192.168.1.100' });

      expect(console.log).toHaveBeenCalledWith('\n🖥️  CONNECT PLAYER SCREENS:');
      expect(console.log).toHaveBeenCalledWith('  1. Open browser on each screen');
      expect(console.log).toHaveBeenCalledWith('  2. Navigate to: http://192.168.1.100:8080/player');
      expect(console.log).toHaveBeenCalledWith('  3. Each screen will auto-sync video playback');
    });

    it('should not display player screen instructions for cloud mode', () => {
      displayStartupInstructions(8080, { 
        cloudMode: true, 
        sessionId: '1234',
        localIP: '192.168.1.100'
      });

      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('🖥️  CONNECT PLAYER SCREENS:'));
    });

    it('should display controls section', () => {
      displayStartupInstructions(8080);

      expect(console.log).toHaveBeenCalledWith('\n⌨️  CONTROLS:');
      expect(console.log).toHaveBeenCalledWith('  • Ctrl+C to stop server');
      expect(console.log).toHaveBeenCalledWith('  • Admin interface will open automatically');
      expect(console.log).toHaveBeenCalledWith('');
    });

    it('should handle different port numbers', () => {
      displayStartupInstructions(3000, { localIP: '10.0.0.50' });

      expect(console.log).toHaveBeenCalledWith('📱 Admin Interface: http://localhost:3000');
      expect(console.log).toHaveBeenCalledWith('🖥️  Player Screens: http://localhost:3000/player');
      expect(console.log).toHaveBeenCalledWith('🌐 Network Access: http://10.0.0.50:3000');
      expect(console.log).toHaveBeenCalledWith('🖥️  Network Players: http://10.0.0.50:3000/player');
    });

    it('should use localhost for player screen instructions when no localIP provided', () => {
      displayStartupInstructions(8080);

      expect(console.log).toHaveBeenCalledWith('  2. Navigate to: http://localhost:8080/player');
    });

    it('should handle cloud mode without session ID', () => {
      displayStartupInstructions(8080, { cloudMode: true });

      expect(console.log).toHaveBeenCalledWith('🏠 LOCAL MODE - Offline Operation');
      // Should fall back to local mode display when session ID is missing
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      mockPlatform.mockReturnValue('darwin');
    });

    it('should handle exec callback with null parameters', async () => {
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, null as any, null as any);
        return {} as any;
      });

      const promise = launchBrowser({ url: 'http://localhost:8080' });
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should handle synchronous errors during command execution', async () => {
      mockExec.mockImplementation(() => {
        throw new Error('Synchronous error');
      });

      const promise = launchBrowser({ url: 'http://localhost:8080', suppressErrors: false });
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[BrowserLauncher] Error launching browser:', expect.any(Error));
    });

    it('should handle empty URL', async () => {
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, '', '');
        return {} as any;
      });

      const promise = launchBrowser({ url: '' });
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith('open ""', expect.any(Function));
    });

    it('should handle zero delay', async () => {
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, '', '');
        return {} as any;
      });

      const promise = launchBrowser({ url: 'http://localhost:8080', delay: 0 });
      // Zero delay should execute immediately
      vi.runAllTimers();
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should handle negative delay (treated as zero)', async () => {
      mockExec.mockImplementation((_command, callback: any) => {
        if (callback && typeof callback === 'function') callback(null, '', '');
        return {} as any;
      });

      const promise = launchBrowser({ url: 'http://localhost:8080', delay: -1000 });
      // Negative delay should execute with setTimeout behavior
      vi.runAllTimers();
      const result = await promise;

      expect(result).toBe(true);
    });
  });
});
