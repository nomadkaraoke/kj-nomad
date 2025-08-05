const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, limited API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Send-only channel from renderer to main
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = ['start-mode', 'log', 'select-server', 'manual-connect', 'scan-for-servers', 'connect-to-server'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Receive-only channel from main to renderer
  onMode: (callback) => {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on('mode-selected', handler);
    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('mode-selected', handler);
    };
  },
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  onConnectWithAdminKey: (callback) => {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on('connect-with-admin-key', handler);
    return () => {
      ipcRenderer.removeListener('connect-with-admin-key', handler);
    };
  },
  onSetModeOnline: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('set-mode-online', handler);
    return () => {
      ipcRenderer.removeListener('set-mode-online', handler);
    };
  },
  onServerDiscovered: (callback) => {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on('server-discovered', handler);
    return () => ipcRenderer.removeListener('server-discovered', handler);
  },
  onServerDiscoveryFailed: (callback) => {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on('server-discovery-failed', handler);
    return () => ipcRenderer.removeListener('server-discovery-failed', handler);
  },
  onServerDiscoveryMultiple: (callback) => {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on('server-discovery-multiple', handler);
    return () => ipcRenderer.removeListener('server-discovery-multiple', handler);
  },
  onServerDiscoveryStatus: (callback) => {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on('server-discovery-status', handler);
    return () => ipcRenderer.removeListener('server-discovery-status', handler);
  },
  onLogMessage: (callback) => {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on('log-message', handler);
    return () => ipcRenderer.removeListener('log-message', handler);
  },
  log: (message) => {
    ipcRenderer.send('log', message);
  }
});
