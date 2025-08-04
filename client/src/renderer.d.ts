export {};

declare global {
  interface Window {
    electronAPI: {
      send: (channel: 'start-mode', data: 'offline' | 'online') => void;
      onMode: (callback: (mode: 'offline' | 'online') => void) => () => void;
      selectDirectory: () => Promise<string | null>;
    };
  }
}
