import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app';

const container = document.querySelector('#root');
if (!container) {
  throw new Error('Missing #root element in document.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
