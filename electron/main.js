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

// Server configuration
const SERVER_PORT = process.env.PORT || 8080;
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
      
      if (isDev) {
        // Development mode - use source files
        serverPath = path.join(__dirname, '..', 'server', 'dist', 'index.js');
      } else {
        // Packaged mode - server is bundled in the app.asar
        serverPath = path.join(process.resourcesPath, 'app.asar', 'server', 'dist', 'index.js');
      }
      
      console.log('📂 Server path:', serverPath);
      
      try {
        // Set environment variables for the server
        process.env.NODE_ENV = 'production';
        process.env.ELECTRON_MODE = 'true';
        process.env.AUTO_LAUNCH = 'false';
        process.env.PORT = SERVER_PORT.toString();
        
        // Import and start the server directly in this process
        // This avoids the spawn ENOTDIR issue with asar files
        const serverModule = require(serverPath);
        
        // Give the server a moment to start
        setTimeout(() => {
          console.log('✅ Server started successfully');
          this.serverReady = true;
          resolve();
        }, 2000);
        
      } catch (error) {
        console.error('❌ Failed to start server:', error);
        this.showErrorDialog('Server Startup Error', error.message);
        reject(error);
      }
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

  showErrorDialog(title, message) {
    dialog.showErrorBox(title, message);
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
    
    // Kill server process
    if (serverProcess && !serverProcess.killed) {
      console.log('🛑 Stopping server...');
      serverProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (!serverProcess.killed) {
          console.log('🔥 Force killing server...');
          serverProcess.kill('SIGKILL');
        }
      }, 5000);
    }
    
    // Destroy tray
    if (tray) {
      tray.destroy();
    }
  }
}

// Create the app instance
new KJNomadApp();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  dialog.showErrorBox('Unexpected Error', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
