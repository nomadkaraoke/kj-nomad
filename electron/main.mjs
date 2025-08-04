import { app, BrowserWindow, Menu, Tray, dialog, shell, ipcMain, utilityProcess } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    this.isCleaningUp = false;
    this.setupApp();
  }

  setupApp() {
    // Handle app events
    if (process.env.HEADLESS === 'true') {
      // In headless/test mode, bypass window creation and start the server directly
      console.log('HEADLESS mode detected. Starting server directly for testing.');
      app.whenReady().then(async () => {
        // In test mode, we'll default to 'offline' as the UI isn't there to choose.
        await this.startServer('offline');
      });
    } else {
      // Normal GUI startup
      this.setupProtocolHandler();
      app.whenReady().then(() => this.createWindow());
    }
    
    app.on('window-all-closed', () => this.handleWindowsClosed());
    app.on('activate', () => this.handleActivate());
    app.on('before-quit', () => this.handleBeforeQuit());
  }

  setupProtocolHandler() {
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('kj-nomad', process.execPath, [path.resolve(process.argv[1])]);
      }
    } else {
      app.setAsDefaultProtocolClient('kj-nomad');
    }

    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleUrl(url);
    });

    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
    } else {
      app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
        this.handleUrl(commandLine.pop());
      });
    }
  }

  handleUrl(url) {
    if (!url || !url.startsWith('kj-nomad://')) return;
    const urlObj = new URL(url);
    if (urlObj.hostname === 'connect') {
      const adminKey = urlObj.searchParams.get('adminKey');
      if (adminKey && mainWindow) {
        // When the app is launched via URL, we want to go straight to the online connect page
        // and pre-fill the key.
        mainWindow.webContents.send('set-mode-online');
        mainWindow.webContents.send('connect-with-admin-key', adminKey);
      }
    }
  }

  async createWindow() {
    this.createMenu();
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
        webSecurity: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: true, // Show immediately for onboarding
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Load the onboarding HTML file first
    await mainWindow.loadFile(path.join(__dirname, 'onboarding.html'));

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

    // Listen for the mode selection from the onboarding page
    ipcMain.on('start-mode', async (event, mode) => {
      console.log(`Received start-mode event: ${mode}`);
      // Once a mode is chosen, start the server and load the main app
      await this.startServer(mode);
      await this.loadApp(mode); // Pass mode to loadApp
    });

    ipcMain.handle('select-directory', async () => {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      });
      if (result.canceled) {
        return null;
      } else {
        return result.filePaths[0];
      }
    });
  }

  createMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Download Debug Logs',
            click: async () => {
              if (mainWindow) {
                const { filePath } = await dialog.showSaveDialog(mainWindow, {
                  title: 'Save Debug Logs',
                  defaultPath: `kj-nomad-debug-logs-${Date.now()}.zip`,
                  filters: [{ name: 'Zip Files', extensions: ['zip'] }]
                });

                if (filePath) {
                  // This is a bit of a hack, but it's the easiest way to trigger the download
                  // without a lot of extra IPC communication.
                  mainWindow.webContents.downloadURL(`http://${SERVER_HOST}:${SERVER_PORT}/api/debug/download`);
                  mainWindow.webContents.session.once('will-download', (event, item, webContents) => {
                    item.setSavePath(filePath);
                  });
                }
              }
            }
          },
          { type: 'separator' },
          process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          ...(process.platform === 'darwin' ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ] : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(process.platform === 'darwin' ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ] : [
            { role: 'close' }
          ])
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: async () => {
              await shell.openExternal('https://github.com/nomadkaraoke/kj-nomad');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
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

  async startServer(mode) {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting KJ-Nomad server in ${mode} mode...`);
      
      const isDev = !app.isPackaged;
      let serverPath;
      
      if (isDev) {
        serverPath = path.join(__dirname, '..', 'server', 'dist', 'index.js');
      } else {
        serverPath = path.join(process.resourcesPath, 'app.asar', 'server', 'dist', 'index.js');
      }
      
      console.log('📂 Server path:', serverPath);
      
      const serverEnv = {
        ...process.env,
        NODE_ENV: 'production',
        ELECTRON_MODE: 'true',
        AUTO_LAUNCH: 'false',
        PORT: SERVER_PORT.toString(),
        HEADLESS: 'true',
        START_MODE: mode,
        KJ_NOMAD_USER_DATA_PATH: app.getPath('userData')
      };
      
      serverProcess = utilityProcess.fork(serverPath, [], {
        env: serverEnv,
        stdio: 'pipe',
        serviceName: 'kj-nomad-server'
      });
      
      let serverOutput = '';
      let serverReady = false;
      
      const startupTimeout = setTimeout(() => {
        if (!serverReady) {
          console.error('❌ Server startup timeout');
          this.showErrorDialog('Server Startup Timeout', 'The server took too long to start');
          reject(new Error('Server startup timeout'));
        }
      }, 15000);
      
      serverProcess.stdout.on('data', (data) => {
        if (this.isCleaningUp) return;
        const output = data.toString();
        serverOutput += output;
        console.log('📡 Server:', output.trim());
        
        if (output.includes('SERVER READY') || output.includes('listening on port')) {
          if (!serverReady && !this.isCleaningUp) {
            serverReady = true;
            clearTimeout(startupTimeout);
            console.log('✅ Server started successfully');
            this.serverReady = true;
            setTimeout(() => resolve(), 1000);
          }
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        if (this.isCleaningUp) return;
        const error = data.toString();
        console.error('📡 Server error:', error.trim());
        serverOutput += error;
        
        if (error.includes('EADDRINUSE') || error.includes('EACCES')) {
          clearTimeout(startupTimeout);
          this.showErrorDialog('Server Port Error', `Port ${SERVER_PORT} is already in use or access denied`);
          reject(new Error(`Port ${SERVER_PORT} error: ${error}`));
        }
      });
      
      serverProcess.on('exit', (code) => {
        clearTimeout(startupTimeout);
        console.log(`📡 Server process exited with code ${code}`);
        
        if (!serverReady && code !== 0) {
          console.error('❌ Server failed to start');
          const debugInfo = {
            exitCode: code,
            serverPath: serverPath,
            serverOutput: serverOutput,
            isDev: isDev,
            serverEnv: serverEnv
          };
          this.showErrorDialog('Server Startup Failed', `Server process exited unexpectedly with code ${code}`, debugInfo);
          reject(new Error(`Server startup failed with code ${code}`));
        }
      });
    });
  }

  async loadApp(mode) { // Receive mode here
    if (this.isCleaningUp) return;
    
    const url = `http://${SERVER_HOST}:${SERVER_PORT}`;
    
    try {
      if (!this.isCleaningUp) console.log(`🌐 Loading app from ${url}`);
      await mainWindow.loadURL(url);
      if (this.isCleaningUp) return;

      // Send the selected mode to the renderer process
      mainWindow.webContents.send('mode-selected', mode);
      
      mainWindow.show();
      mainWindow.focus();
      
      if (!this.isCleaningUp) console.log('✅ KJ-Nomad is ready!');
      
      if (process.platform !== 'darwin' && !this.isCleaningUp) {
        this.showInfoDialog('KJ-Nomad Ready', `KJ-Nomad is now running!\n\nAdmin Interface: ${url}\nPlayer Screens: ${url}/player`);
      }
    } catch (error) {
      if (!this.isCleaningUp) {
        console.error('❌ Failed to load app:', error);
        this.showErrorDialog('App Loading Error', `Failed to load the application: ${error.message}`);
      }
    }
  }

  showErrorDialog(title, message, details = null) {
    let fullMessage = message;
    if (details) fullMessage += `\n\n--- Debug Information ---\n${JSON.stringify(details, null, 2)}`;
    fullMessage += `\n\n--- System Information ---\nPlatform: ${process.platform}\nArchitecture: ${process.arch}\nElectron Version: ${process.versions.electron}\nNode Version: ${process.versions.node}\nApp Version: ${app.getVersion()}\nPackaged: ${app.isPackaged}\nServer Port: ${SERVER_PORT}\nServer Ready: ${this.serverReady}`;
    if (serverProcess) fullMessage += `\nServer PID: ${serverProcess.pid}\nServer Killed: ${serverProcess.killed}`;
    
    console.error(`❌ ${title}: ${message}`);
    if (details) console.error('Details:', details);
    dialog.showErrorBox(title, fullMessage);
  }

  showInfoDialog(title, message) {
    dialog.showMessageBox(mainWindow, { type: 'info', title, message, buttons: ['OK'] });
  }

  handleWindowsClosed() {
    if (process.platform !== 'darwin') {
      this.cleanup();
      app.quit();
    }
  }

  handleActivate() {
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
    this.isCleaningUp = true;
    console.log('🧹 Cleaning up...');
    
    if (serverProcess && !serverProcess.killed) {
      console.log('🛑 Stopping server...');
      serverProcess.stdout.removeAllListeners();
      serverProcess.stderr.removeAllListeners();
      serverProcess.removeAllListeners();
      serverProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          console.log('🔥 Force killing server...');
          serverProcess.kill('SIGKILL');
        }
      }, 3000);
    }
    
    if (tray) tray.destroy();
  }
}

new KJNomadApp();

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  const errorDetails = { message: error.message, stack: error.stack, name: error.name, code: error.code, errno: error.errno, syscall: error.syscall, timestamp: new Date().toISOString() };
  let fullMessage = `An unexpected error occurred: ${error.message}\n\n--- Error Details ---\n${JSON.stringify(errorDetails, null, 2)}`;
  fullMessage += `\n\n--- System Information ---\nPlatform: ${process.platform}\nArchitecture: ${process.arch}\nElectron Version: ${process.versions.electron}\nNode Version: ${process.versions.node}\nApp Packaged: ${app.isPackaged}`;
  if (serverProcess) fullMessage += `\nServer PID: ${serverProcess.pid}\nServer Killed: ${serverProcess.killed}`;
  dialog.showErrorBox('Unexpected Error', fullMessage);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  const rejectionDetails = { reason: reason, promise: promise.toString(), timestamp: new Date().toISOString() };
  let fullMessage = `An unhandled promise rejection occurred${reason && reason.message ? `: ${reason.message}` : ''}\n\n--- Rejection Details ---\n${JSON.stringify(rejectionDetails, null, 2)}`;
  dialog.showErrorBox('Unhandled Promise Rejection', fullMessage);
});
