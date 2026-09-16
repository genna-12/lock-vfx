import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION, SETS, type SetId } from '../../brand/tokens';
import { holdScroll } from '../../lib/camera';
import { isReturningVisit, quandoEntrati } from '../../lib/loadProgress';
import { vaiAllaSezione } from '../../lib/scrollProgrammato';
import { Mark } from '../brand/Mark';
import { useCoarsePointer, useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Navigazione = quattro perforazioni di pellicola, una per HOLD.
 *
 * La forma non è decorativa: è la stessa perforazione che sta sul bordo del
 * marchio. Il foro attivo è pieno `crimson` (l'unico rosso persistente del
 * sito); l'etichetta compare a sinistra su hover o quando il foro è attivo.
 *
 * Sono àncore vere: senza JS la nav resta una lista di link funzionante.
 * Lo step 2 sostituisce il salto nativo con `smoother.scrollTo()` e collega
 * `active` alla progress della carrellata.
 *
 * Sul footer la nav svanisce: indica dove si è NELLO SPAZIO, e il footer è
 * fuori dallo spazio. Marchio e lingua invece restano sempre.
 */
type PerfNavProps = {
  /** HOLD attualmente inquadrato. Allo step 2 arriva dalla progress. */
  active?: SetId;
};

/**
 * L'indizio di scroll (`rifinitura-spec.md` §3).
 *
 * Nessuna freccia, nessuna scritta "scroll": se dopo quattro secondi di
 * pagina ferma non si è scorso, il **secondo foro** fa due lampi `ink` — è
 * la nav stessa che dice che ce n'è dell'altra, sotto. Si ripete una volta
 * dopo altri otto secondi, e poi mai più: un invito che insiste è un
 * cartello.
 */
const INDIZIO = { primo: 4000, secondo: 12000 } as const;

export function PerfNav({ active = 'reel' }: PerfNavProps) {
  const { t } = useTranslation();
  const [onFooter, setOnFooter] = useState(false);
  const reduce = useReducedMotion();
  // Si legge al primo render, prima che il Loader segni la visita: da lì in
  // poi `isReturningVisit()` direbbe di sì a tutti.
  const [primaVisita] = useState(() => !isReturningVisit());
  const [indizio, setIndizio] = useState(false);
  // "Poi mai più": una volta che l'invito è servito — o che è stato spento da
  // uno scroll — non torna, nemmeno risalendo alla prima sezione.
  const finito = useRef(false);
  // Sul telefono la nav va in basso al centro: sul bordo destro finisce
  // addosso ai comandi del video ed è dove passa il pollice tutto il tempo
  // (`mobile-semplice-spec.md` §2 e §3).
  const coarse = useCoarsePointer();

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return;
    // `rootMargin` in negativo sul fondo: il footer deve essere entrato per
    // ottanta pixel, non essere semplicemente arrivato al bordo. Senza,
    // sul telefono — dove i contatti finiscono esattamente dove comincia il
    // footer — la nav spariva già nei contatti, e da lì non si poteva più
    // navigare. Su desktop non cambia niente di visibile.
    const io = new IntersectionObserver(([entry]) => setOnFooter(entry.isIntersecting), {
      threshold: 0,
      rootMargin: '0px 0px -80px 0px',
    });
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  /* ---- l'indizio di scroll -------------------------------------------- */
  useEffect(() => {
    // Solo alla prima visita, solo nella prima sezione, e solo a chi non ha
    // chiesto meno movimento: a quello un lampeggio non si fa.
    if (!primaVisita || reduce || active !== 'reel' || finito.current) return;

    const timers: number[] = [];
    let spento = false;
    /** Chiude l'indizio qui e ora (anche solo perché il componente se ne va). */
    const spegni = () => {
      if (spento) return;
      spento = true;
      for (const id of timers) window.clearTimeout(id);
      setIndizio(false);
      for (const tipo of ['scroll', 'wheel', 'touchstart', 'keydown'] as const) {
        window.removeEventListener(tipo, basta);
      }
    };

    /** L'invito è servito: non si ripropone. */
    const basta = () => {
      finito.current = true;
      spegni();
    };

    // Due lampi: `f5` acceso, `f5` spento, due volte.
    const lampeggia = (da: number) => {
      [true, false, true, false].forEach((acceso, i) => {
        timers.push(window.setTimeout(() => setIndizio(acceso), da + i * MOTION.f5));
      });
    };

    // I quattro secondi contano da quando la pagina si vede, non dal mount:
    // prima c'è il loader, e quello non è tempo di attesa dell'utente.
    const disdici = quandoEntrati(() => {
      if (spento) return;
      lampeggia(INDIZIO.primo);
      lampeggia(INDIZIO.secondo);
      timers.push(window.setTimeout(basta, INDIZIO.secondo + 4 * MOTION.f5));
      // Qualunque scroll — la rotella, un dito, una freccia della tastiera —
      // vuol dire che l'invito non serve più.
      for (const tipo of ['scroll', 'wheel', 'touchstart', 'keydown'] as const) {
        window.addEventListener(tipo, basta, { passive: true });
      }
    });

    return () => {
      disdici();
      spegni();
    };
  }, [active, primaVisita, reduce]);

  // Con la carrellata attiva il salto nativo non serve a niente: i quattro
  // set sono impilati nello stesso punto della pagina, e cio' che li separa
  // e' la posizione di scroll dentro il pin. Se lo smoother non c'e'
  // (reduced motion, JS a terra) non si intercetta il click: l'ancora resta
  // un'ancora e funziona da sola.
  function goToHold(event: MouseEvent<HTMLAnchorElement>, id: SetId) {
    const stage = ScrollTrigger.getById('stage');
    const smoother = ScrollSmoother.get();
    if (stage && smoother) {
      event.preventDefault();
      smoother.scrollTo(holdScroll(stage, id), true);
      return;
    }
    // Senza carrellata le sezioni sono quattro blocchi veri, uno sotto
    // l'altro: ci si va con lo scroll del browser, che è anche quello che
    // conosce lo snap.
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // `vaiAllaSezione` fa due cose che qui servono tutte e due: spegne lo snap
    // per la durata della corsa (con `mandatory`, su iOS, una corsa smooth
    // viene riagganciata al punto di partenza e torna indietro) e calcola la
    // meta senza guardare le trasformazioni.
    vaiAllaSezione(target);
  }

  return (
    <nav
      aria-label={t('nav.label')}
      aria-hidden={onFooter || undefined}
      inert={onFooter || undefined}
      style={{ transitionDuration: 'var(--f5)' }}
      className={`fixed z-30 transition-opacity ${
        coarse
          ? 'inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] flex justify-center'
          : 'right-[var(--pad)] bottom-[max(var(--pad),env(safe-area-inset-bottom,0px))] md:bottom-auto md:top-1/2 md:-translate-y-1/2'
      } ${onFooter ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'}`}
    >
      {/* Su mobile i 44px di target si toccano: lo spazio ce lo mette già il target. */}
      <ul className={coarse ? 'flex flex-row gap-0' : 'flex flex-col gap-0 md:gap-4'}>
        {SETS.map((id, i) => {
          const isActive = id === active;
          // Il lampo è del **secondo** foro: è quello che dice dove si va
          // scorrendo, non quello dove si è.
          const lampo = indizio && i === 1;
          return (
            <li key={id} className={coarse ? 'flex justify-center' : 'flex justify-end'}>
              <a
                href={`#${id}`}
                onClick={(event) => goToHold(event, id)}
                aria-current={isActive ? 'true' : undefined}
                // Sotto i 768 px l'etichetta e' `display: none` e il foro e'
                // `aria-hidden`: senza questo il link non avrebbe nessun nome
                // da leggere. E' la stessa parola che si vede da desktop, non
                // una seconda etichetta.
                aria-label={t(`nav.${id}`)}
                className={`group flex min-h-11 min-w-11 items-center gap-3 ${
                  coarse ? 'justify-center' : 'justify-end md:min-h-0 md:min-w-0'
                }`}
              >
                <span
                  className={`u-cap whitespace-nowrap transition-opacity duration-200 ${
                    coarse ? 'hidden' : 'hidden md:block'
                  } ${
                    isActive ? 'text-stone opacity-100' : 'text-stone opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {t(`nav.${id}`)}
                </span>
                {/* Dove si è, la perforazione **diventa il marchio**: 12 px,
                    rosso, al posto del rettangolo pieno
                    (`rifinitura-spec.md` §4). È uno dei quattro posti in cui
                    il lucchetto rosso è ammesso, ed è quello che lavora di
                    più: dice dove si è e, dicendolo, ripete il marchio. Il
                    riquadro resta 9x13 perché la fila non si muova quando
                    l'attivo cambia. */}
                {isActive ? (
                  <span
                    aria-hidden
                    className="grid h-[13px] w-[9px] place-items-center text-crimson"
                  >
                    <Mark size={12} />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={`block h-[13px] w-[9px] rounded-[2px] border transition-colors duration-200 ${
                      lampo
                        ? 'border-ink bg-ink'
                        : 'border-dust bg-transparent group-hover:border-stone'
                    }`}
                  />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
