import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { storeRepo } from './lib/storage';
import './index.css';

// Load shared data from the server (if reachable) before the first render
storeRepo.init().finally(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
