import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StudioPage } from './components/studio/StudioPage';
import './config/i18n';
import './styles/globals.css';

/**
 * Il secondo ingresso del sito: `/studio/`.
 *
 * Stessa base di codice, stessi token, stesso i18n — ma niente Stage,
 * niente GSAP, niente ScrollSmoother: qui non c'è una carrellata da
 * montare, c'è del testo da leggere.
 */
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento root non trovato nel DOM.');

createRoot(rootElement).render(
  <StrictMode>
    <StudioPage />
  </StrictMode>
);
