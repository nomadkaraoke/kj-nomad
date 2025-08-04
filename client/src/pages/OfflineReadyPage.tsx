import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';

const OfflineReadyPage: React.FC = () => {
  const serverInfo = useAppStore((state) => state.serverInfo);
  const checkServerInfo = useAppStore((state) => state.checkServerInfo);
  const navigate = useNavigate();

  useEffect(() => {
    checkServerInfo();
  }, [checkServerInfo]);

  const handleContinue = () => {
    navigate('/controller');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg mx-auto border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-green-500 dark:text-green-400 mb-4">✅ Setup Complete!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">Your local server is running and your media library is ready.</p>
        
        <div className="bg-gray-100 dark:bg-gray-900/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Connect Your Player Screens</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">On your TV or projector's web browser, navigate to one of these addresses:</p>
          
          {serverInfo.localIps.length > 0 ? (
            <div className="space-y-2">
              {serverInfo.localIps.map((ip: string) => (
                <div key={ip} className="bg-black text-lg font-mono text-yellow-300 p-3 rounded-md">
                  http://{ip}:{serverInfo.port}/player
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-black text-lg font-mono text-gray-500 p-3 rounded-md">
              Loading network info...
            </div>
          )}
        </div>

        <button 
          onClick={handleContinue}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go to KJ Controller
        </button>
      </div>
    </div>
  );
};

export default OfflineReadyPage;
