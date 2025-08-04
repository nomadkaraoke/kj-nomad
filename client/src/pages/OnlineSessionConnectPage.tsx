import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Container } from '../components/ui/Layout';
import { Input } from '../components/ui/Input';
import { useAppStore } from '../store/appStore';

const OnlineSessionConnectPage: React.FC = () => {
  const [sessionId, setSessionId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const connectToOnlineSession = useAppStore((state) => state.connectToOnlineSession);
  const { connectionStatus, error } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId && adminKey) {
      connectToOnlineSession(sessionId, adminKey);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex items-center justify-center font-sans">
      <Container size="sm">
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
                type="text"
                placeholder="Session ID (e.g., 1234)"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="text-center text-lg"
                required
              />
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
