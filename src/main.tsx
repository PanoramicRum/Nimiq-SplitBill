import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Set --app-height to the actual visible viewport height.
// visualViewport.height is the most reliable value (excludes browser chrome, on-screen keyboard, etc.)
function setAppHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${h}px`);
}
setAppHeight();
window.visualViewport?.addEventListener('resize', setAppHeight);
window.addEventListener('resize', setAppHeight);

// Detect Nimiq Pay webview — it injects window.nimiq asynchronously
function detectNimiqPay() {
  if (window.nimiq) {
    document.documentElement.classList.add('nimiq-pay');
    return;
  }
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (window.nimiq) {
      document.documentElement.classList.add('nimiq-pay');
      clearInterval(interval);
    } else if (attempts >= 6) {
      clearInterval(interval);
    }
  }, 500);
}
detectNimiqPay();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
