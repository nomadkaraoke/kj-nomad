const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, limited API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Send-only channel from renderer to main
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = ['start-mode'];
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
  selectDirectory: () => ipcRenderer.invoke('select-directory')
});
