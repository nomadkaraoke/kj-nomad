import React, { useEffect, useState } from 'react';

const PlayerSetupPage: React.FC = () => {
  const [status, setStatus] = useState('Scanning for KJ-Nomad server on your network...');
  const [servers, setServers] = useState<string[]>([]);

  useEffect(() => {
    const cleanup = window.electronAPI.onServerDiscovered((serverUrl: string) => {
      setServers(prev => [...prev, serverUrl]);
      setStatus('Found servers! Select one to connect.');
    });

    const timer = setTimeout(() => {
      if (servers.length === 0) {
        setStatus('No servers found yet. Make sure your KJ-Nomad server is running.');
      }
    }, 10000);

    return () => {
      cleanup();
      clearTimeout(timer);
    };
  }, [servers.length]);

  const handleConnect = (serverUrl: string) => {
    // Redirect to the player page on the selected server
    window.location.href = `${serverUrl}/player`;
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Setting Up as Player Screen</h1>
        <p className="text-xl text-gray-400 mb-8">{status}</p>
        
        {servers.length > 0 ? (
          <div className="space-y-4">
            {servers.map(url => (
              <button 
                key={url}
                onClick={() => handleConnect(url)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
              >
                Connect to {url}
              </button>
            ))}
          </div>
        ) : (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-2/3 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSetupPage;
