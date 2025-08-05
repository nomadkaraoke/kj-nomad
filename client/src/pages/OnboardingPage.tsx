import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const mode = useAppStore((state) => state.mode);

  useEffect(() => {
    if (mode === 'offline') {
      navigate('/setup-wizard');
    } else if (mode === 'online') {
      navigate('/online-connect');
    } else if (mode === 'player') {
      navigate('/player');
    }
  }, [mode, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to KJ-Nomad</h1>
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default OnboardingPage;
