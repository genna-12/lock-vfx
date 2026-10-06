import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './config/i18n';
import './styles/globals.css';
import { modoIniziale } from './lib/useReducedMotion';

// Il sito si apre sempre dalla cima: niente ripristino dello scroll del
// browser (un reload a 190 vh con loader breve scoprirebbe la carrellata a
// metà). Con un hash (`/#studio`, `/#contact`) lo scroll lo decide `agganci`.
try {
  history.scrollRestoration = 'manual';
} catch {
  /* ambienti senza History API: il ripristino resta quello del browser */
}
if (!window.location.hash && window.scrollY > 0) window.scrollTo(0, 0);

// Pagina semplice o carrellata si decide **prima** del primo render: le
// classi sull'`html` le rimette poi lo Stage (e le cambia se l'utente gira il
// telefono o cambia impostazione), ma il primo layout dev'essere già quello
// giusto, o sotto il loader la pagina salta (CLS, QA D20).
{
  const { flat, coarse } = modoIniziale();
  document.documentElement.classList.toggle('static', flat);
  document.documentElement.classList.toggle('snap', coarse);
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento root non trovato nel DOM.');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
