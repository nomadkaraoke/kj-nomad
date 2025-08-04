import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Container } from '../components/ui/Layout';
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
    <div className="h-screen w-screen bg-gray-900 text-white flex items-center justify-center font-sans">
      <Container size="md">
        <Card className="bg-gray-800 border border-gray-700 shadow-2xl">
          <div className="p-8 text-center">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 mb-4">
              Connect to Online Session
            </h1>
            <p className="text-gray-400 mb-8">
              Enter the Session ID and Admin Key from your browser to link this app to your online session.
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </Button>
            </form>

            {error && (
              <p className="text-red-400 mt-4">{error}</p>
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default OnlineSessionConnectPage;
