import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The service worker is what makes the cook screen work with no signal. Only
// in a real build — in dev it would serve yesterday's bundle back to you.
// The single-file build has no origin to register against.
const standalone = import.meta.env.VITE_STANDALONE === '1';

if (import.meta.env.PROD && !standalone && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch((e) => {
      console.warn('service worker registration failed', e);
    });
  });
}
