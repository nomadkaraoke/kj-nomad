import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/ui/Layout';
import { Navigation } from './components/Navigation';
import { websocketService } from './services/websocketService';

// Import page components (we'll create these next)
import HomePage from './pages/HomePage';
import PlayerPage from './pages/PlayerPage';
import ControllerPage from './pages/ControllerPage';
import SingerPage from './pages/SingerPage';
import SingerProfilesPage from './pages/SingerProfilesPage';

import './App.css';

function App() {
  useEffect(() => {
    // Initialize WebSocket connection
    websocketService.connect();
    

    
    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/player" element={<PlayerPage />} />
                <Route path="/controller" element={<ControllerPage />} />
                <Route path="/singer" element={<SingerPage />} />
                <Route path="/profiles" element={<SingerProfilesPage />} />
              </Routes>
            </main>
          </div>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
