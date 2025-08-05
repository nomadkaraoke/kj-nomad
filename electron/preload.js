const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, limited API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Send-only channel from renderer to main
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = ['start-mode', 'log'];
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
    return () => {
      ipcRenderer.removeListener('server-discovered', handler);
    };
  },
  log: (message) => {
    ipcRenderer.send('log', message);
  }
});
