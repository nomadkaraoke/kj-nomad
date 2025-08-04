import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/ui/Layout';
import { Navigation } from './components/Navigation';
import { websocketService } from './services/websocketService';
import { useAppStore } from './store/appStore';

// Import page components
import HomePage from './pages/HomePage';
import PlayerSetupPage from './pages/PlayerSetupPage';
import SetupWizardPage from './pages/SetupWizardPage';
import OfflineReadyPage from './pages/OfflineReadyPage';
import OnlineSessionConnectPage from './pages/OnlineSessionConnectPage';
import OnlineSessionConnectedPage from './pages/OnlineSessionConnectedPage';
import PlayerPage from './pages/PlayerPage';
import ControllerPage from './pages/ControllerPage';
import SingerPage from './pages/SingerPage';
import SingerProfilesPage from './pages/SingerProfilesPage';

import './App.css';

const MainLayout: React.FC = () => {
  const { mode, isSetupComplete, isSessionConnected, onlineSessionRequiresLibrary } = useAppStore();

  if (mode === 'unknown') {
    return <HomePage />;
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
    <Layout>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<OfflineReadyPage />} />
            <Route path="/controller" element={<ControllerPage />} />
            <Route path="/profiles" element={<SingerProfilesPage />} />
          </Routes>
        </main>
      </div>
    </Layout>
  );
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/player" element={<PlayerPage />} />
      <Route path="/player-setup" element={<PlayerSetupPage />} />
      <Route path="/singer" element={<SingerPage />} />
      <Route path="/connect-online" element={<OnlineSessionConnectPage />} />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    websocketService.connect();
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
