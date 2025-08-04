import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export const DebugOverlay: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const { connectionStatus, mode, isSetupComplete, error, onlineSessionId, sessionState } = useAppStore();

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const captureLog = (method: 'log' | 'error' | 'warn', ...args: unknown[]) => {
      const message = args.map(arg => JSON.stringify(arg, null, 2)).join(' ');
      setLogs(prevLogs => [...prevLogs, `[${method.toUpperCase()}] ${new Date().toISOString()}: ${message}`].slice(-100));
      if (method === 'error') {
        originalError(...args);
      } else if (method === 'warn') {
        originalWarn(...args);
      } else {
        originalLog(...args);
      }
    };

    console.log = (...args) => captureLog('log', ...args);
    console.error = (...args) => captureLog('error', ...args);
    console.warn = (...args) => captureLog('warn', ...args);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <div className="fixed bottom-0 right-0 bg-gray-800 text-white text-xs p-4 rounded-tl-lg shadow-lg max-w-lg max-h-64 z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div><strong>Mode:</strong> {mode}</div>
        <div><strong>Setup Complete:</strong> {isSetupComplete ? 'Yes' : 'No'}</div>
        <div><strong>Connection:</strong> {connectionStatus}</div>
        <div><strong>Session ID:</strong> {onlineSessionId || 'N/A'}</div>
        {error && <div className="col-span-2 text-red-400"><strong>Error:</strong> {error}</div>}
        <div className="col-span-2">
          <strong>Session State:</strong>
          <pre className="text-xs bg-gray-700 p-1 rounded mt-1">
            {JSON.stringify(sessionState, null, 2)}
          </pre>
        </div>
      </div>
      <div className="bg-black p-2 rounded h-32 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="font-mono">{log}</div>
        ))}
      </div>
    </div>
  );
};
