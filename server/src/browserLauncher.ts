/**
 * Browser Launcher Module
 * Automatically opens the admin interface in the default browser
 */

import { exec } from 'child_process';
import { platform } from 'os';

interface LaunchOptions {
  url: string;
  delay?: number; // Delay in milliseconds before launching
  suppressErrors?: boolean;
}

/**
 * Get the command to open a URL based on the operating system
 */
function getOpenCommand(): string {
  const os = platform();
  
  switch (os) {
    case 'darwin':  // macOS
      return 'open';
    case 'win32':   // Windows
      return 'start ""';
    case 'linux':   // Linux
      return 'xdg-open';
    default:
      throw new Error(`Unsupported operating system: ${os}`);
  }
}

/**
 * Launch a URL in the default browser
 */
export function launchBrowser(options: LaunchOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const { url, delay = 2000, suppressErrors = true } = options;
    
    setTimeout(() => {
      try {
        const command = getOpenCommand();
        const fullCommand = `${command} "${url}"`;
        
        console.log(`[BrowserLauncher] Opening browser: ${url}`);
        
        exec(fullCommand, (error) => {
          if (error) {
            if (!suppressErrors) {
              console.error('[BrowserLauncher] Failed to open browser:', error.message);
            }
            resolve(false);
          } else {
            console.log('[BrowserLauncher] Browser launched successfully');
            resolve(true);
          }
        });
      } catch (error) {
        if (!suppressErrors) {
          console.error('[BrowserLauncher] Error launching browser:', error);
        }
        resolve(false);
      }
    }, delay);
  });
}

/**
 * Launch the admin interface for local mode
 */
export function launchAdminInterface(port: number, options?: {
  delay?: number;
  path?: string;
}): Promise<boolean> {
  const { delay = 2000, path = '' } = options || {};
  const url = `http://localhost:${port}${path}`;
  
  return launchBrowser({
    url,
    delay,
    suppressErrors: true
  });
}

/**
 * Check if auto-launch should be enabled
 */
export function shouldAutoLaunch(): boolean {
  // Don't auto-launch in these conditions:
  
  // 1. If explicitly disabled via environment variable
  if (process.env.NO_AUTO_LAUNCH === 'true') {
    return false;
  }
  
  // 2. If running in cloud mode (has session ID)
  const hasSessionId = process.argv.some(arg => arg.startsWith('--session=')) || 
                      process.env.SESSION_ID;
  if (hasSessionId) {
    return false;
  }
  
  // 3. If running in CI/testing environment
  if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
    return false;
  }
  
  // 4. If running headless (no display)
  if (process.env.DISPLAY === '' && platform() === 'linux') {
    return false;
  }
  
  // Auto-launch by default for local mode
  return true;
}

/**
 * Display startup instructions
 */
export function displayStartupInstructions(port: number, options?: {
  sessionId?: string;
  localIP?: string;
  cloudMode?: boolean;
}) {
  const { sessionId, localIP, cloudMode } = options || {};
  
  console.log('\n🎤 ===== KJ-NOMAD SERVER READY ===== 🎤\n');
  
  if (cloudMode && sessionId) {
    console.log('🌐 CLOUD MODE - Session:', sessionId);
    console.log(`📱 Admin Interface: http://localhost:${port}`);
    console.log(`🖥️  Player Screens: kj.nomadkaraoke.com/player?session=${sessionId}`);
    console.log(`🎵 Singer Requests: sing.nomadkaraoke.com?session=${sessionId}`);
    if (localIP) {
      console.log(`🏠 Local Network: http://${localIP}:${port}`);
    }
  } else {
    console.log('🏠 LOCAL MODE - Offline Operation');
    console.log(`📱 Admin Interface: http://localhost:${port}`);
    console.log(`🖥️  Player Screens: http://localhost:${port}/player`);
    if (localIP) {
      console.log(`🌐 Network Access: http://${localIP}:${port}`);
      console.log(`🖥️  Network Players: http://${localIP}:${port}/player`);
    }
    console.log('💡 To enable cloud mode: ENABLE_CLOUD=true npm start -- --session=XXXX');
  }
  
  console.log('\n🎯 SETUP CHECKLIST:');
  console.log('  ✅ Media library scanned');
  console.log('  ✅ Server running and ready');
  console.log('  📂 Add video files to: server/media/');
  console.log('  🎵 Add filler music: server/media/filler-*');
  
  if (!cloudMode) {
    console.log('\n🖥️  CONNECT PLAYER SCREENS:');
    console.log(`  1. Open browser on each screen`);
    console.log(`  2. Navigate to: http://${localIP || 'localhost'}:${port}/player`);
    console.log(`  3. Each screen will auto-sync video playback`);
  }
  
  console.log('\n⌨️  CONTROLS:');
  console.log('  • Ctrl+C to stop server');
  console.log('  • Admin interface will open automatically');
  console.log('');
}