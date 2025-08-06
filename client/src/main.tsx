import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAppStore } from './store/appStore';

// Expose the store to the window for E2E testing
if (import.meta.env.MODE === 'development') {
  // @ts-expect-error - This is for E2E testing purposes
  window.useAppStore = useAppStore;
}

createRoot(document.getElementById('root')!).render(
  <App />
)
