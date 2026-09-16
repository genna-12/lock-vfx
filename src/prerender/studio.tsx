import { renderToString } from 'react-dom/server';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { StudioPage } from '../components/studio/StudioPage';
import it from '../locales/it.json';

/**
 * La pagina Studio, scritta nell'HTML.
 *
 * Perché. `/studio/` è l'unica pagina di parole del sito: è quella che i
 * motori leggeranno davvero, ed è quella da cui si copia un paragrafo per
 * infilarlo in un preventivo. Oggi il testo arriva quando arriva React, e
 * chi legge la pagina senza eseguire JavaScript — un crawler, un'anteprima
 * di WhatsApp, un "mostra sorgente" — trova un `<div>` vuoto. Con il
 * prerender il testo è già lì, e il JavaScript lo raggiunge dopo
 * (`rifinitura-spec.md` §4). Non è una questione di kB: la pagina pesa
 * uguale, e i kB in più dell'HTML sono testo, che è quello che si voleva.
 *
 * Come. Una sola pagina, una sola lingua — l'italiano, che è anche quella
 * della `description` statica e dell'`og:locale`. Il montaggio in
 * `studio.tsx` resta un `createRoot`, non un'idratazione: React ridisegna
 * il suo albero sopra questo, e se la lingua rilevata è l'inglese lo
 * ridisegna in inglese senza nessun disallineamento da riconciliare.
 * Un'idratazione qui vorrebbe dire *due* versioni statiche da tenere
 * allineate e un mismatch a ogni visitatore inglese, per risparmiare un
 * primo render che dura un millisecondo.
 *
 * Nessuna libreria nuova: `react-dom/server` è dentro `react-dom`, e
 * l'istanza di i18next è la stessa libreria del sito con un'altra
 * configurazione — quella del browser (`config/i18n.ts`) qui non si può
 * usare, perché il suo rilevatore va a cercare `localStorage`.
 */
export function renderStudio(): string {
  const i18n = createInstance();
  void i18n.use(initReactI18next).init({
    resources: { it: { translation: it } },
    lng: 'it',
    fallbackLng: 'it',
    interpolation: { escapeValue: false },
  });

  return renderToString(
    <I18nextProvider i18n={i18n}>
      <StudioPage />
    </I18nextProvider>
  );
}
