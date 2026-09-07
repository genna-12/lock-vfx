import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { MOTION } from '../brand/tokens';
import { EASE } from '../lib/ease';
import {
  LOADER_TIMING,
  isReturningVisit,
  loadProgress,
  markVisited,
  whenFontsReady,
} from '../lib/loadProgress';
import { useReducedMotion } from '../lib/useReducedMotion';
import { Mark, SHACKLE_CLOSED } from './brand/Mark';

/**
 * Il caricamento è il lucchetto che si chiude.
 *
 * Non è una barra travestita da logo: il marchio è a contorno e aperto come
 * nel logo ufficiale, e la staffa scende verso il corpo in proporzione al
 * progresso vero (`loadProgress`). Al 100% fa l'ultimo tratto in `f2` e
 * nello stesso istante il marchio si riempie con un fotogramma rosso, poi
 * stacco secco — nessuna dissolvenza, perché in sala non si dissolve, si
 * stacca. Chiuso e pieno sono la stessa cosa.
 *
 * Pavimento di 800 ms perché un lampo non si legge, tetto di 2 500 ms perché
 * oltre non è più un'attesa, è un muro: se una risorsa non arriva, si entra
 * lo stesso. Alla seconda visita della sessione dura 300 ms: il gesto lo si è
 * già visto.
 */
const SIZE = 132;

export function Loader({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [gone, setGone] = useState(false);
  const [percent, setPercent] = useState(0);
  // Il riempimento è l'ultimo fotogramma del gesto, non uno stato del
  // caricamento: nasce falso e diventa vero una volta sola, alla chiusura.
  const [filled, setFilled] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const shackleRef = useRef<SVGPathElement>(null);

  // I task di competenza del Loader. `mark` e `js` sono già veri quando
  // questo codice gira: il marchio è in linea e il chunk è arrivato, dirlo
  // dopo un timeout finto sarebbe solo teatro. Il poster e la reel li
  // completa il componente Reel, che è quello che li possiede davvero.
  useEffect(() => {
    loadProgress.complete('mark');
    loadProgress.complete('js');
    let alive = true;
    void whenFontsReady().then(() => {
      if (alive) loadProgress.complete('font');
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    const shackle = shackleRef.current;
    if (!overlay || !shackle) return;

    const short = reduce || isReturningVisit();
    const ctx = gsap.context(() => {
      const cut = () => {
        markVisited();
        setGone(true);
      };

      if (short) {
        // Marchio completo — chiuso e pieno — 300 ms, stacco. Nessuna discesa.
        gsap.set(shackle, { y: SHACKLE_CLOSED });
        setFilled(true);
        setPercent(100);
        const id = window.setTimeout(cut, LOADER_TIMING.repeat);
        return () => window.clearTimeout(id);
      }

      gsap.set(shackle, { y: 0 });

      // La staffa insegue il progresso invece di saltarci sopra: i task sono
      // cinque, a scatti si vedrebbero cinque scalini. `y` è in unità di
      // viewBox, le stesse in cui il disegno misura l'apertura.
      const unsubscribe = loadProgress.subscribe((value) => {
        setPercent(Math.round(value * 100));
        gsap.to(shackle, {
          y: SHACKLE_CLOSED * value,
          duration: MOTION.f8 / 1000,
          ease: EASE.arrive,
          overwrite: 'auto',
        });
      });

      const startedAt = performance.now();
      let closing = false;
      const close = () => {
        if (closing) return;
        closing = true;
        gsap.ticker.remove(watch);
        window.clearTimeout(ceiling);
        // L'animazione può stare su GSAP: è decorazione. Il fotogramma rosso
        // e lo stacco no — sono le due cose che DEVONO succedere, e in una
        // scheda in secondo piano il ticker è fermo. Vanno sui timer.
        gsap.to(shackle, {
          y: SHACKLE_CLOSED,
          duration: MOTION.f2 / 1000,
          ease: EASE.cut,
        });
        window.setTimeout(() => {
          // Chiuso: nello stesso fotogramma il marchio si riempie e passa
          // dal rosso. Poi lo stacco se lo porta via.
          setFilled(true);
          if (markRef.current) markRef.current.style.color = 'var(--color-crimson)';
          window.setTimeout(cut, MOTION.f2);
        }, MOTION.f2);
      };

      const watch = () => {
        const elapsed = performance.now() - startedAt;
        if ((loadProgress.value() >= 1 && elapsed >= LOADER_TIMING.min) || elapsed >= LOADER_TIMING.max) {
          close();
        }
      };
      gsap.ticker.add(watch);
      // Il tetto non puo' vivere solo sul rAF: in una tab in secondo piano il
      // ticker si ferma e il loader non chiuderebbe mai.
      const ceiling = window.setTimeout(close, LOADER_TIMING.max);

      return () => {
        unsubscribe();
        gsap.ticker.remove(watch);
        window.clearTimeout(ceiling);
      };
    }, overlay);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <>
      {children}
      {gone ? null : (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 grid place-items-center bg-void text-ink"
          role="progressbar"
          aria-label={t('loader.label')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div ref={markRef}>
            <Mark size={SIZE} mode={filled ? 'solid' : 'outline'} shackleRef={shackleRef} />
          </div>
        </div>
      )}
    </>
  );
}
