import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/ui/Layout';
import { Navigation } from './components/Navigation';
import { websocketService } from './services/websocketService';
import { useAppStore } from './store/appStore';

// Import page components
import OnlineSessionConnectPage from './pages/OnlineSessionConnectPage';
import PlayerPage from './pages/PlayerPage';
import ControllerPage from './pages/ControllerPage';
import SingerPage from './pages/SingerPage';
import SingerProfilesPage from './pages/SingerProfilesPage';

import './App.css';

const AppContent: React.FC = () => {
  const { mode, connectionStatus } = useAppStore();

  if (mode === 'unknown') {
    // We could show a loading spinner here while waiting for Electron to send the mode
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (mode === 'online' && connectionStatus !== 'connected') {
    return <OnlineSessionConnectPage />;
  }

  // For both 'offline' mode and 'online' mode once connected
  return (
    <Layout>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ControllerPage />} />
            <Route path="/player" element={<PlayerPage />} />
            <Route path="/controller" element={<ControllerPage />} />
            <Route path="/singer" element={<SingerPage />} />
            <Route path="/profiles" element={<SingerProfilesPage />} />
          </Routes>
        </main>
      </div>
    </Layout>
  );
};

function App() {
  useEffect(() => {
    websocketService.connect();

    let cleanup: (() => void) | undefined;

    if (window.electronAPI && window.electronAPI.onMode) {
      cleanup = window.electronAPI.onMode((mode) => {
        useAppStore.getState().setMode(mode);
      });
    }

    return () => {
      websocketService.disconnect();
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
