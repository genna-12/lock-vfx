import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './config/i18n';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento root non trovato nel DOM.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);