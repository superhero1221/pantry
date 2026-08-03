import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Boundary } from './ui/Boundary';
import { installCrashNet } from './lib/crash';
import './styles.css';

// Before anything renders. A net that goes up after the fall is decoration.
installCrashNet();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The outer boundary. usePantry() runs inside App's own render, so if the
        state layer throws there is no shell to render a message into — this
        one brings its own .pg-page/.pg-shell. The inner one, in App, keeps the
        shell and the nav when it is only a screen that broke. */}
    <Boundary shell>
      <App />
    </Boundary>
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
