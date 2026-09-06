import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './config/i18n';
import './styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento root non trovato nel DOM.');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
