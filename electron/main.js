const { app, BrowserWindow, Menu, Tray, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// Keep a global reference of the window object
let mainWindow;
let serverProcess;
let tray;
let isQuitting = false;

// Server configuration - match the server's port logic
const SERVER_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const SERVER_HOST = 'localhost';

class KJNomadApp {
  constructor() {
    this.serverReady = false;
    this.setupApp();
  }

  setupApp() {
    // Handle app events
    app.whenReady().then(() => this.createWindow());
    app.on('window-all-closed', () => this.handleWindowsClosed());
    app.on('activate', () => this.handleActivate());
    app.on('before-quit', () => this.handleBeforeQuit());
  }

  async createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: this.getAppIcon(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true
      },
      show: false, // Don't show until server is ready
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Set up window events
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    mainWindow.on('close', (event) => {
      if (!isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    // Create system tray
    this.createTray();

    // Start the server and load the app
    await this.startServer();
    await this.loadApp();
  }

  getAppIcon() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
    return undefined;
  }

  createTray() {
    const trayIconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    const trayIcon = fs.existsSync(trayIconPath) ? trayIconPath : undefined;
    
    if (trayIcon) {
      tray = new Tray(trayIcon);
      
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show KJ-Nomad',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        },
        {
          label: 'Open Admin Interface',
          click: () => shell.openExternal(`http://${SERVER_HOST}:${SERVER_PORT}`)
        },
        {
          label: 'Open Player Screen',
          click: () => shell.openExternal(`http://${SERVER_HOST}:${SERVER_PORT}/player`)
        },
        { type: 'separator' },
        {
          label: 'Quit KJ-Nomad',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]);
      
      tray.setContextMenu(contextMenu);
      tray.setToolTip('KJ-Nomad - Professional Karaoke Hosting');
      
      tray.on('double-click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
    }
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting KJ-Nomad server...');
      
      // Determine if we're in development or packaged mode
      const isDev = !app.isPackaged;
      let serverPath;
      let nodeExecutable = process.execPath;
      
      if (isDev) {
        // Development mode - use simple test server
        serverPath = path.join(__dirname, '..', 'server', 'src', 'index-electron-test-simple.cjs');
      } else {
        // Packaged mode - extract server file from asar to temp location
        const asarServerPath = path.join(process.resourcesPath, 'app.asar', 'server', 'src', 'index-electron-test-simple.cjs');
        const tempDir = os.tmpdir();
        const tempServerPath = path.join(tempDir, `kj-nomad-server-${Date.now()}.cjs`);
        
        console.log('🔍 Checking asar server path:', asarServerPath);
        console.log('🔍 Asar file exists:', fs.existsSync(asarServerPath));
        
        try {
          // Check if the asar file exists first
          if (!fs.existsSync(asarServerPath)) {
            throw new Error(`Server file not found in asar: ${asarServerPath}`);
          }
          
          // Extract server file from asar archive
          console.log('📦 Reading server content from asar...');
          const serverContent = fs.readFileSync(asarServerPath, 'utf8');
          console.log('📦 Server content length:', serverContent.length);
          
          console.log('📦 Writing to temp file:', tempServerPath);
          fs.writeFileSync(tempServerPath, serverContent);
          
          // Verify the temp file was created
          if (!fs.existsSync(tempServerPath)) {
            throw new Error(`Failed to create temp server file: ${tempServerPath}`);
          }
          
          serverPath = tempServerPath;
          console.log('✅ Successfully extracted server from asar to:', tempServerPath);
        } catch (error) {
          console.error('❌ Failed to extract server from asar:', error);
          console.error('❌ Asar path:', asarServerPath);
          console.error('❌ Temp path:', tempServerPath);
          reject(new Error(`Failed to extract server: ${error.message}`));
          return;
        }
        
        // CRITICAL FIX: In packaged mode, we need to use Node.js, not the Electron executable
        // The Electron executable is at process.execPath, but we need the bundled Node.js
        const electronDir = path.dirname(process.execPath);
        
        // Try to find the bundled Node.js executable
        let possibleNodePaths = [];
        
        if (process.platform === 'darwin') {
          // On macOS, Node.js might be bundled in the Frameworks directory
          possibleNodePaths = [
            path.join(electronDir, '..', 'Frameworks', 'Electron Framework.framework', 'Versions', 'A', 'Resources', 'node'),
            path.join(electronDir, '..', 'Resources', 'node'),
            '/usr/local/bin/node',
            '/opt/homebrew/bin/node',
            '/usr/bin/node'
          ];
        } else if (process.platform === 'win32') {
          possibleNodePaths = [
            path.join(electronDir, 'node.exe'),
            path.join(electronDir, '..', 'node.exe'),
            'C:\\Program Files\\nodejs\\node.exe',
            'C:\\nodejs\\node.exe'
          ];
        } else {
          // Linux
          possibleNodePaths = [
            path.join(electronDir, 'node'),
            path.join(electronDir, '..', 'node'),
            '/usr/bin/node',
            '/usr/local/bin/node'
          ];
        }
        
        // Find the first existing Node.js executable
        nodeExecutable = possibleNodePaths.find(nodePath => {
          try {
            return fs.existsSync(nodePath);
          } catch (error) {
            return false;
          }
        });
        
        // If no Node.js found, fall back to system node (risky but better than infinite loop)
        if (!nodeExecutable) {
          console.warn('⚠️  No bundled Node.js found, falling back to system node');
          nodeExecutable = 'node';
        }
      }
      
      console.log('📂 Server path:', serverPath);
      console.log('🔧 Node executable:', nodeExecutable);
      
      // Set up environment for the server process
      const serverEnv = {
        ...process.env,
        NODE_ENV: 'production',
        ELECTRON_MODE: 'true',
        AUTO_LAUNCH: 'false',
        PORT: SERVER_PORT.toString(),
        HEADLESS: 'true'
      };
      
      // Start server as child process
      serverProcess = spawn(nodeExecutable, [serverPath], {
        env: serverEnv,
        stdio: ['ignore', 'pipe', 'pipe'], // Ignore stdin to prevent EPIPE
        cwd: isDev ? path.join(__dirname, '..') : process.resourcesPath
      });
      
      let serverOutput = '';
      let serverReady = false;
      
      // Set up timeout for server startup
      const startupTimeout = setTimeout(() => {
        if (!serverReady) {
          console.error('❌ Server startup timeout');
          this.showErrorDialog('Server Startup Timeout', 'The server took too long to start');
          reject(new Error('Server startup timeout'));
        }
      }, 15000); // 15 second timeout
      
      // Monitor server output
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        console.log('📡 Server:', output.trim());
        
        // Look for server ready indicators
        if (output.includes('SERVER READY') || 
            output.includes('listening on port') ||
            output.includes('KJ-Nomad is ready') ||
            output.includes(`server listening on port ${SERVER_PORT}`) ||
            output.includes('🎤 ===== KJ-NOMAD SERVER READY ===== 🎤') ||
            output.includes('🌐 Server listening on port')) {
          
          if (!serverReady) {
            serverReady = true;
            clearTimeout(startupTimeout);
            console.log('✅ Server started successfully');
            this.serverReady = true;
            
            // Give server a moment to fully initialize
            setTimeout(() => resolve(), 1000);
          }
        }
      });
      
      // Monitor server errors
      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('📡 Server error:', error.trim());
        serverOutput += error;
        
        // Don't treat all stderr as fatal - some are just warnings
        if (error.includes('EADDRINUSE') || error.includes('EACCES')) {
          clearTimeout(startupTimeout);
          this.showErrorDialog('Server Port Error', `Port ${SERVER_PORT} is already in use or access denied`);
          reject(new Error(`Port ${SERVER_PORT} error: ${error}`));
        }
      });
      
      // Handle server process exit
      serverProcess.on('exit', (code, signal) => {
        clearTimeout(startupTimeout);
        console.log(`📡 Server process exited with code ${code}, signal ${signal}`);
        
        if (!serverReady && code !== 0) {
          console.error('❌ Server failed to start');
          const debugInfo = {
            exitCode: code,
            signal: signal,
            serverPath: serverPath,
            nodeExecutable: nodeExecutable,
            serverOutput: serverOutput,
            isDev: isDev,
            serverEnv: serverEnv
          };
          this.showErrorDialog('Server Startup Failed', 
            `Server process exited unexpectedly with code ${code}`, 
            debugInfo);
          reject(new Error(`Server startup failed with code ${code}`));
        }
      });
      
      // Handle spawn errors
      serverProcess.on('error', (error) => {
        clearTimeout(startupTimeout);
        console.error('❌ Failed to spawn server process:', error);
        this.showErrorDialog('Server Spawn Error', `Failed to start server process: ${error.message}`);
        reject(error);
      });
    });
  }

  async loadApp() {
    const url = `http://${SERVER_HOST}:${SERVER_PORT}`;
    
    try {
      console.log(`🌐 Loading app from ${url}`);
      await mainWindow.loadURL(url);
      
      // Show window once loaded
      mainWindow.show();
      mainWindow.focus();
      
      console.log('✅ KJ-Nomad is ready!');
      
      // Show success notification
      if (process.platform !== 'darwin') {
        this.showInfoDialog('KJ-Nomad Ready', 
          `KJ-Nomad is now running!\n\nAdmin Interface: ${url}\nPlayer Screens: ${url}/player`);
      }
      
    } catch (error) {
      console.error('❌ Failed to load app:', error);
      this.showErrorDialog('App Loading Error', `Failed to load the application: ${error.message}`);
    }
  }

  showErrorDialog(title, message, details = null) {
    // Create a detailed error message with debug info
    let fullMessage = message;
    
    if (details) {
      fullMessage += '\n\n--- Debug Information ---\n';
      if (typeof details === 'object') {
        fullMessage += JSON.stringify(details, null, 2);
      } else {
        fullMessage += details.toString();
      }
    }
    
    // Add system information
    fullMessage += '\n\n--- System Information ---\n';
    fullMessage += `Platform: ${process.platform}\n`;
    fullMessage += `Architecture: ${process.arch}\n`;
    fullMessage += `Electron Version: ${process.versions.electron}\n`;
    fullMessage += `Node Version: ${process.versions.node}\n`;
    fullMessage += `App Version: ${app.getVersion()}\n`;
    fullMessage += `Packaged: ${app.isPackaged}\n`;
    fullMessage += `Server Port: ${SERVER_PORT}\n`;
    fullMessage += `Server Ready: ${this.serverReady}\n`;
    
    // Add server process info if available
    if (serverProcess) {
      fullMessage += `Server PID: ${serverProcess.pid}\n`;
      fullMessage += `Server Killed: ${serverProcess.killed}\n`;
    }
    
    console.error(`❌ ${title}: ${message}`);
    if (details) console.error('Details:', details);
    
    dialog.showErrorBox(title, fullMessage);
  }

  showInfoDialog(title, message) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: title,
      message: message,
      buttons: ['OK']
    });
  }

  handleWindowsClosed() {
    // On macOS, keep the app running even when all windows are closed
    if (process.platform !== 'darwin') {
      this.cleanup();
      app.quit();
    }
  }

  handleActivate() {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  }

  handleBeforeQuit() {
    isQuitting = true;
    this.cleanup();
  }

  cleanup() {
    console.log('🧹 Cleaning up...');
    
    // Kill server process gracefully
    if (serverProcess && !serverProcess.killed) {
      console.log('🛑 Stopping server...');
      
      // Remove all listeners to prevent EPIPE errors
      serverProcess.stdout.removeAllListeners();
      serverProcess.stderr.removeAllListeners();
      serverProcess.removeAllListeners();
      
      // Kill the process
      serverProcess.kill('SIGTERM');
      
      // Force kill after 3 seconds (reduced timeout)
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          console.log('🔥 Force killing server...');
          serverProcess.kill('SIGKILL');
        }
      }, 3000);
    }
    
    // Destroy tray
    if (tray) {
      tray.destroy();
    }
  }
}

// Create the app instance
new KJNomadApp();

// Handle uncaught exceptions with detailed error reporting
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    timestamp: new Date().toISOString()
  };
  
  // Create detailed error message
  let fullMessage = `An unexpected error occurred: ${error.message}`;
  fullMessage += '\n\n--- Error Details ---\n';
  fullMessage += JSON.stringify(errorDetails, null, 2);
  
  // Add system information
  fullMessage += '\n\n--- System Information ---\n';
  fullMessage += `Platform: ${process.platform}\n`;
  fullMessage += `Architecture: ${process.arch}\n`;
  fullMessage += `Electron Version: ${process.versions.electron}\n`;
  fullMessage += `Node Version: ${process.versions.node}\n`;
  fullMessage += `App Packaged: ${app.isPackaged}\n`;
  
  // Add server status if available
  if (serverProcess) {
    fullMessage += `Server PID: ${serverProcess.pid}\n`;
    fullMessage += `Server Killed: ${serverProcess.killed}\n`;
  }
  
  dialog.showErrorBox('Unexpected Error', fullMessage);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  
  const rejectionDetails = {
    reason: reason,
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  };
  
  let fullMessage = `An unhandled promise rejection occurred`;
  if (reason && reason.message) {
    fullMessage += `: ${reason.message}`;
  }
  
  fullMessage += '\n\n--- Rejection Details ---\n';
  fullMessage += JSON.stringify(rejectionDetails, null, 2);
  
  dialog.showErrorBox('Unhandled Promise Rejection', fullMessage);
});
