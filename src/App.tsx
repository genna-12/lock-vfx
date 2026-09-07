import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { assertTokensInSync, type SetId } from './brand/tokens';
import { applyHead } from './lib/head';
import { Loader } from './components/Loader';
import { Wordmark } from './components/chrome/Wordmark';
import { LangPill } from './components/chrome/LangPill';
import { PerfNav } from './components/chrome/PerfNav';
import { Stage } from './components/stage/Stage';
import { Footer } from './components/Footer';
import { PrivacyDialog } from './components/ui/PrivacyDialog';

/**
 * Struttura della pagina.
 *
 * Il chrome (marchio, lingua, nav) sta FUORI da `#smooth-wrapper`: gli
 * elementi `fixed` dentro il wrapper di ScrollSmoother vengono trascinati
 * dal transform e smettono di essere fissi. Lo smoother vero viene montato
 * allo step 2; qui esistono già i due nodi che gli servono.
 */
export default function App() {
  const { i18n, t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? 'it';

  // Quale HOLD e' inquadrato: lo Stage lo comunica solo quando cambia, quindi
  // qui si rirenderizza tre volte in tutta la carrellata, non a ogni frame.
  const [active, setActive] = useState<SetId>('reel');
  const handleActiveChange = useCallback((id: SetId) => setActive(id), []);

  useEffect(() => assertTokensInSync(), []);
  useEffect(() => {
    applyHead({
      title: t('meta.title'),
      description: t('meta.description'),
      path: '/',
      lang,
      imageAlt: t('meta.ogAlt'),
    });
  }, [lang, t]);

  return (
    <Loader>
      <a
        href="#top"
        className="u-sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:bg-obsidian focus-visible:px-4 focus-visible:py-2"
      >
        {t('a11y.skip')}
      </a>

      <header className="u-pad pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between py-[var(--pad)]">
        <Wordmark />
        <LangPill />
      </header>
      <PerfNav active={active} />

      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main id="top">
            <Stage onActiveChange={handleActiveChange} />
          </main>
          <Footer />
        </div>
      </div>

      {/* Fuori dallo smooth wrapper e fuori dallo stage: è modale, e la sua
          posizione non deve dipendere dalle trasformazioni della camera. */}
      <PrivacyDialog />
    </Loader>
  );
}
