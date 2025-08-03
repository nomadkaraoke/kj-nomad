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
  on: (channel, func) => {
    const validChannels = ['mode-selected'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
