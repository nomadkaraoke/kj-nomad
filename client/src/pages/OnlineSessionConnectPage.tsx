import React, { useState, useEffect } from 'react';
import { Input } from '../components/ui/Input';
import { useAppStore } from '../store/appStore';

const OnlineSessionConnectPage: React.FC = () => {
  const [sessionId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const connectToOnlineSession = useAppStore((state) => state.connectToOnlineSession);
  const { connectionStatus, error } = useAppStore();

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onConnectWithAdminKey((key: string) => {
        setAdminKey(key);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey) {
      if (sessionId) {
        connectToOnlineSession(sessionId, adminKey);
      } else {
        // If only admin key is provided, fetch session id first
        try {
          const response = await fetch(`https://kj.nomadkaraoke.com/api/sessions/by-admin-key/${adminKey}`);
          const data = await response.json();
          if (data.success) {
            connectToOnlineSession(data.data.sessionId, adminKey);
          } else {
            useAppStore.setState({ error: data.error || 'Failed to find session for this admin key.' });
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            useAppStore.setState({ error: err.message });
          } else {
            useAppStore.setState({ error: 'Failed to connect to the server.' });
          }
        }
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center font-sans text-text-primary-light dark:text-text-primary-dark">
      <div className="card w-full max-w-md">
        <div className="p-8 text-center">
          <h1 className="font-display text-4xl mb-4 bg-gradient-to-r from-brand-pink to-brand-blue text-transparent bg-clip-text">
            Connect to Online Session
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
            Enter the Admin Key from your browser to link this app to your online session.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="password"
              placeholder="Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="text-center text-lg"
              required
            />
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
            </button>
          </form>

          {error && (
            <p className="text-red-500 mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineSessionConnectPage;
