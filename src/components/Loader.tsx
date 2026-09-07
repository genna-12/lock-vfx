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
import { Mark } from './brand/Mark';

/**
 * Il caricamento è il lucchetto che si chiude.
 *
 * Non è una barra travestita da logo: la staffa si disegna e scende in
 * proporzione al progresso vero (`loadProgress`), e al 100% fa gli ultimi
 * 3 px di scatto in `f2`, un fotogramma rosso, e stacco secco — nessuna
 * dissolvenza, perché in sala non si dissolve, si stacca.
 *
 * Pavimento di 800 ms perché un lampo non si legge, tetto di 2 500 ms perché
 * oltre non è più un'attesa, è un muro: se una risorsa non arriva, si entra
 * lo stesso. Alla seconda visita della sessione dura 300 ms: il gesto lo si è
 * già visto.
 */
const SIZE = 132;
/** Un px reale in unità del viewBox del marchio. */
const U = 692 / SIZE;
/** Staffa sollevata: 6 px a vuoto, 3 px a carico pieno, 0 = chiusa. */
const LIFT_EMPTY = 6;
const LIFT_FULL = 3;

export function Loader({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [gone, setGone] = useState(false);
  const [percent, setPercent] = useState(0);

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
        // Marchio completo, 300 ms, stacco. Nessun disegno, nessuna discesa.
        gsap.set(shackle, { strokeDashoffset: 0, y: 0 });
        setPercent(100);
        const id = window.setTimeout(cut, LOADER_TIMING.repeat);
        return () => window.clearTimeout(id);
      }

      const length = shackle.getTotalLength();
      gsap.set(shackle, {
        strokeDasharray: length,
        strokeDashoffset: length,
        y: -LIFT_EMPTY * U,
      });

      // La staffa insegue il progresso invece di saltarci sopra: i task sono
      // cinque, a scatti si vedrebbero cinque scalini.
      const unsubscribe = loadProgress.subscribe((value) => {
        setPercent(Math.round(value * 100));
        gsap.to(shackle, {
          strokeDashoffset: length * (1 - value),
          y: -(LIFT_FULL + (LIFT_EMPTY - LIFT_FULL) * (1 - value)) * U,
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
        gsap
          .timeline({ onComplete: cut })
          // gli ultimi 3 px: il lucchetto si chiude
          .to(shackle, {
            strokeDashoffset: 0,
            y: 0,
            duration: MOTION.f2 / 1000,
            ease: EASE.cut,
          })
          // un fotogramma rosso, poi il taglio
          .call(() => {
            if (markRef.current) markRef.current.style.color = 'var(--color-crimson)';
          })
          .to({}, { duration: MOTION.f2 / 1000 });
      };

      const watch = () => {
        const elapsed = performance.now() - startedAt;
        if ((loadProgress.value() >= 1 && elapsed >= LOADER_TIMING.min) || elapsed >= LOADER_TIMING.max) {
          close();
        }
      };
      gsap.ticker.add(watch);

      return () => {
        unsubscribe();
        gsap.ticker.remove(watch);
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
            <Mark size={SIZE} strokeWidth={1.5} shackleRef={shackleRef} />
          </div>
        </div>
      )}
    </>
  );
}
