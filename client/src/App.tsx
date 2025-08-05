import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { websocketService } from './services/websocketService';
import { useAppStore } from './store/appStore';

// Import page components
import HomePage from './pages/HomePage';
import PlayerSetupPage from './pages/PlayerSetupPage';
import SetupWizardPage from './pages/SetupWizardPage';
import OnlineSessionConnectPage from './pages/OnlineSessionConnectPage';
import OnlineSessionConnectedPage from './pages/OnlineSessionConnectedPage';
import PlayerPage from './pages/PlayerPage';
import SingerPage from './pages/SingerPage';

import './App.css';

import type { AppMode } from './store/appStore';

const AppContent: React.FC = () => {
  const { mode, isSetupComplete, isSessionConnected, onlineSessionRequiresLibrary } = useAppStore();

  // Player and Singer routes should be available regardless of setup status
  if (mode === 'player') {
    return <PlayerSetupPage />;
  }
  if (window.location.pathname === '/player') {
    return <PlayerPage />;
  }
  if (window.location.pathname === '/singer') {
    return <SingerPage />;
  }

  if (mode === 'online') {
    if (!isSessionConnected) {
      return <OnlineSessionConnectPage />;
    }
    if (onlineSessionRequiresLibrary && !isSetupComplete) {
      return <SetupWizardPage />;
    }
    return <OnlineSessionConnectedPage />;
  }

  // Offline mode
  if (!isSetupComplete) {
    return <SetupWizardPage />;
  }
  
  return (
    <Routes>
      <Route path="/player-setup" element={<PlayerSetupPage />} />
      <Route path="/connect-online" element={<OnlineSessionConnectPage />} />
      <Route path="/*" element={<HomePage />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    // Determine mode from URL first
    const urlParams = new URLSearchParams(window.location.search);
    const modeFromUrl = urlParams.get('mode');
    if (modeFromUrl && ['offline', 'online', 'player', 'unknown'].includes(modeFromUrl)) {
      useAppStore.getState().setMode(modeFromUrl as AppMode);
    }

    // Don't connect if we are on a dedicated page like player or singer
    const path = window.location.pathname;
    if (!path.startsWith('/player') && !path.startsWith('/singer')) {
      websocketService.connect('admin');
    }
    
    useAppStore.getState().checkSetupStatus();

    let modeCleanup: (() => void) | undefined;
    let onlineModeCleanup: (() => void) | undefined;

    if (window.electronAPI) {
      if (window.electronAPI.onMode) {
        modeCleanup = window.electronAPI.onMode((mode) => {
          useAppStore.getState().setMode(mode);
        });
      }
      if (window.electronAPI.onSetModeOnline) {
        onlineModeCleanup = window.electronAPI.onSetModeOnline(() => {
          useAppStore.getState().setMode('online');
        });
      }
    }

    return () => {
      websocketService.disconnect();
      if (modeCleanup) {
        modeCleanup();
      }
      if (onlineModeCleanup) {
        onlineModeCleanup();
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
