/**
 * Setup Wizard Module
 * Helps KJs configure their local server for the first time
 */

import fs from 'fs';
import path from 'path';
import { networkInterfaces } from 'os';
import express, { Request, Response } from 'express';

// __dirname is automatically available in CommonJS modules

export interface SetupConfig {
  mediaDirectory: string;
  fillerMusicDirectory?: string;
  kjName: string;
  venue?: string;
  autoLaunchBrowser: boolean;
  defaultPort: number;
  enableNetworkAccess: boolean;
  setupComplete: boolean;
  createdAt?: string;
  lastModified?: string;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface NetworkInfo {
  localIP: string;
  networkName?: string;
  interfaces: Array<{
    name: string;
    address: string;
    internal: boolean;
  }>;
}

const CONFIG_FILE = path.join(__dirname, '../config/setup.json');
const DEFAULT_MEDIA_DIR = path.join(__dirname, '../media');
const DEFAULT_CONFIG: SetupConfig = {
  mediaDirectory: DEFAULT_MEDIA_DIR,
  fillerMusicDirectory: DEFAULT_MEDIA_DIR,
  kjName: 'Local KJ',
  venue: '',
  autoLaunchBrowser: true,
  defaultPort: 8080,
  enableNetworkAccess: true,
  setupComplete: false
};

/**
 * Ensure config directory exists
 */
function ensureConfigDirectory() {
  const configDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Load setup configuration
 */
export function loadSetupConfig(): SetupConfig {
  ensureConfigDirectory();
  
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData) as SetupConfig;
      
      // Merge with defaults to handle new properties
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.error('[SetupWizard] Error loading config:', error);
  }
  
  return { ...DEFAULT_CONFIG };
}

/**
 * Save setup configuration
 */
export function saveSetupConfig(config: SetupConfig): boolean {
  ensureConfigDirectory();
  
  try {
    const configToSave = {
      ...config,
      lastModified: new Date().toISOString()
    };
    
    if (!configToSave.createdAt) {
      configToSave.createdAt = configToSave.lastModified;
    }
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
    console.log('[SetupWizard] Configuration saved successfully');
    return true;
  } catch (error) {
    console.error('[SetupWizard] Error saving config:', error);
    return false;
  }
}

/**
 * Get network information for setup
 */
export function getNetworkInfo(): NetworkInfo {
  try {
    const nets = networkInterfaces();
    const interfaces: Array<{ name: string; address: string; internal: boolean }> = [];
    let localIP = 'localhost';
    
    if (!nets) {
      return { localIP, interfaces };
    }
    
    for (const name of Object.keys(nets)) {
      const netInterface = nets[name];
      if (!netInterface) continue;
      
      for (const net of netInterface) {
        if (net.family === 'IPv4') {
          interfaces.push({
            name,
            address: net.address,
            internal: net.internal
          });
          
          // Prefer non-internal addresses for localIP
          if (!net.internal && (localIP === 'localhost' || localIP.startsWith('127.'))) {
            localIP = net.address;
          }
        }
      }
    }
    
    return {
      localIP,
      interfaces
    };
  } catch (error) {
    console.error('[SetupWizard] Error getting network info:', error);
    return {
      localIP: 'localhost',
      interfaces: []
    };
  }
}

/**
 * Validate media directory
 */
export function validateMediaDirectory(directory: string): {
  valid: boolean;
  error?: string;
  stats?: {
    exists: boolean;
    readable: boolean;
    writable: boolean;
    videoCount: number;
    fillerCount: number;
  };
} {
  try {
    // Check if directory is provided
    if (!directory) {
      return {
        valid: false,
        error: 'Directory path is required'
      };
    }
    
    // Check if directory exists
    if (!fs.existsSync(directory)) {
      return {
        valid: false,
        error: 'Directory does not exist'
      };
    }
    
    // Check if it's actually a directory
    const stat = fs.statSync(directory);
    if (!stat.isDirectory()) {
      return {
        valid: false,
        error: 'Path is not a directory'
      };
    }
    
    // Check permissions
    try {
      fs.accessSync(directory, fs.constants.R_OK);
    } catch {
      return {
        valid: false,
        error: 'Directory is not readable'
      };
    }
    
    let writable = true;
    try {
      fs.accessSync(directory, fs.constants.W_OK);
    } catch {
      writable = false;
    }
    
    // Count video files and filler music
    const files = fs.readdirSync(directory);
    const videoExtensions = ['.mp4', '.webm', '.avi', '.mov'];
    const videoFiles = files.filter(file => {
      // Convert file to string and ensure it's a valid string before calling string methods
      const fileName = String(file);
      if (!fileName || fileName === 'undefined' || fileName === 'null') {
        return false;
      }
      const ext = path.extname(fileName).toLowerCase();
      return videoExtensions.includes(ext) && !fileName.toLowerCase().startsWith('filler-');
    });
    
    const fillerFiles = files.filter(file => {
      // Convert file to string and ensure it's a valid string before calling string methods
      const fileName = String(file);
      if (!fileName || fileName === 'undefined' || fileName === 'null') {
        return false;
      }
      const ext = path.extname(fileName).toLowerCase();
      return videoExtensions.includes(ext) && fileName.toLowerCase().startsWith('filler-');
    });
    
    return {
      valid: true,
      stats: {
        exists: true,
        readable: true,
        writable,
        videoCount: videoFiles.length,
        fillerCount: fillerFiles.length
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: `Error accessing directory: ${error instanceof Error ? `Error: ${error.message}` : String(error)}`
    };
  }
}

/**
 * Get setup steps and their completion status
 */
export function getSetupSteps(config?: SetupConfig): SetupStep[] {
  const currentConfig = config || loadSetupConfig();
  const mediaValidation = validateMediaDirectory(currentConfig.mediaDirectory);
  
  return [
    {
      id: 'welcome',
      title: 'Welcome to KJ-Nomad',
      description: 'Set up your professional karaoke hosting system',
      completed: true, // Always completed when viewed
      required: true
    },
    {
      id: 'media-library',
      title: 'Configure Media Library',
      description: 'Select the folder containing your karaoke video files',
      completed: mediaValidation.valid && (mediaValidation.stats?.videoCount || 0) > 0,
      required: true
    },
    {
      id: 'kj-info',
      title: 'KJ Information',
      description: 'Enter your name and venue details',
      completed: currentConfig.kjName !== '' && currentConfig.kjName !== 'Local KJ',
      required: false
    },
    {
      id: 'network-setup',
      title: 'Network Configuration',
      description: 'Configure network access for player screens',
      completed: currentConfig.enableNetworkAccess !== undefined,
      required: true
    },
    {
      id: 'test-setup',
      title: 'Test Your Setup',
      description: 'Verify everything works correctly',
      completed: currentConfig.setupComplete,
      required: true
    }
  ];
}

/**
 * Check if setup is required
 */
export function isSetupRequired(): boolean {
  const config = loadSetupConfig();
  
  // Setup is required if:
  // 1. Setup has never been completed
  // 2. Media directory is invalid
  // 3. No video files found
  
  if (!config.setupComplete) {
    return true;
  }
  
  const mediaValidation = validateMediaDirectory(config.mediaDirectory);
  if (!mediaValidation.valid || (mediaValidation.stats?.videoCount || 0) === 0) {
    return true;
  }
  
  return false;
}

/**
 * Mark setup as complete
 */
export function markSetupComplete(): boolean {
  const config = loadSetupConfig();
  config.setupComplete = true;
  return saveSetupConfig(config);
}

/**
 * Reset setup (force setup wizard on next startup)
 */
export function resetSetup(): boolean {
  const config = loadSetupConfig();
  config.setupComplete = false;
  return saveSetupConfig(config);
}

/**
 * Apply setup routes to the Express app
 */
export function applySetupRoutes(app: express.Application): void {
  // Ensure config directory exists
  ensureConfigDirectory();

  // Get setup status
  app.get('/api/setup/status', (req, res) => {
    console.log('[API] GET /api/setup/status - Get setup status');
    const config = loadSetupConfig();
    const required = isSetupRequired();
    const steps = getSetupSteps(config);
    const networkInfo = getNetworkInfo();
    
    res.json({
      success: true,
      data: {
        setupRequired: required,
        steps,
        networkInfo
      }
    });
  });

  // Get setup configuration
  app.get('/api/setup/config', (req, res) => {
    console.log('[API] GET /api/setup/config - Get setup configuration');
    const config = loadSetupConfig();
    res.json({ success: true, data: config });
  });

  // Update setup configuration
  app.post('/api/setup/config', (req: Request, res: Response) => {
    console.log('[API] POST /api/setup/config - Update setup configuration');
    try {
      const config = req.body;
      const success = saveSetupConfig(config);
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Configuration saved successfully',
          data: config 
        });
      } else {
        res.status(500).json({ success: false, error: 'Failed to save configuration' });
      }
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Validate media directory
  app.post('/api/setup/validate-media', (req: Request, res: Response) => {
    console.log('[API] POST /api/setup/validate-media - Validate media directory');
    const { path: directory } = req.body;
    
    if (!directory) {
      return res.status(400).json({ 
        success: false, 
        error: 'Directory path is required' 
      });
    }
    
    const validation = validateMediaDirectory(directory);
    res.json({ success: true, data: validation });
  });

  // Get directory suggestions
  app.get('/api/setup/directory-suggestions', (req: Request, res: Response) => {
    console.log('[API] GET /api/setup/directory-suggestions - Get directory suggestions');
    const suggestions = getMediaDirectorySuggestions();
    res.json({ success: true, data: suggestions });
  });

  // Mark setup as complete
  app.post('/api/setup/complete', (req: Request, res: Response) => {
    console.log('[API] POST /api/setup/complete - Mark setup as complete');
    const success = markSetupComplete();
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Setup completed successfully',
        data: { setupComplete: true }
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to mark setup as complete' });
    }
  });

  // Reset setup wizard
  app.post('/api/setup/reset', (req: Request, res: Response) => {
    console.log('[API] POST /api/setup/reset - Reset setup wizard');
    const success = resetSetup();
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Setup reset successfully',
        data: { setupComplete: false }
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to reset setup' });
    }
  });

  // Get network information
  app.get('/api/setup/network', (req: Request, res: Response) => {
    console.log('[API] GET /api/setup/network - Get network information');
    const networkInfo = getNetworkInfo();
    res.json({ success: true, data: networkInfo });
  });
}

/**
 * Get default media directory suggestions
 */
export function getMediaDirectorySuggestions(): string[] {
  const suggestions: string[] = [];
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  
  // Add current default
  suggestions.push(DEFAULT_MEDIA_DIR);
  
  // Common locations
  if (homeDir) {
    suggestions.push(
      path.join(homeDir, 'Documents', 'Karaoke'),
      path.join(homeDir, 'Music', 'Karaoke'),
      path.join(homeDir, 'Videos', 'Karaoke'),
      path.join(homeDir, 'Desktop', 'Karaoke')
    );
  }
  
  // Filter to only existing directories
  return suggestions.filter(dir => {
    try {
      return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
    } catch {
      return false;
    }
  });
}
