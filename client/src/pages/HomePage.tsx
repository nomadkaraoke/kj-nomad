import React from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { setMode } = useAppStore();
  const navigate = useNavigate();

  const handleSelectMode = (mode: 'offline' | 'online') => {
    setMode(mode);
    if (mode === 'offline') {
      // The main layout will handle showing the setup wizard or ready page
      navigate('/'); 
    } else {
      navigate('/connect-online');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="text-center p-10">
        <h1 className="text-5xl font-bold mb-2">Welcome to KJ-Nomad</h1>
        <p className="text-xl text-gray-300 mb-10">Your professional karaoke hosting solution.</p>
        
        <div className="space-y-4 max-w-sm mx-auto">
          <button 
            onClick={() => handleSelectMode('offline')}
            className="w-full text-left p-6 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm border border-white/20 transition-all duration-300"
          >
            <h2 className="text-2xl font-semibold">Start an Offline Session</h2>
            <p className="text-gray-300">Run a self-contained show from your laptop. Perfect for venues with no internet.</p>
          </button>
          
          <button 
            onClick={() => handleSelectMode('online')}
            className="w-full text-left p-6 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm border border-white/20 transition-all duration-300"
          >
            <h2 className="text-2xl font-semibold">Connect to an Online Session</h2>
            <p className="text-gray-300">Join a cloud-coordinated session for singer self-service and YouTube integration.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
