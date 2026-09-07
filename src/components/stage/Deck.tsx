import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { Work } from '../../data/works';

/**
 * Il selettore dei lavori: un anello di card in coverflow.
 *
 * La card centrale È il lavoro in riproduzione. Girare l'anello non cambia
 * il video: cambia solo quando una card si ferma al centro (`commit`). Così
 * si può sfogliare senza far ripartire niente.
 *
 * Tre lavori fanno tre card, non nove: l'anello non si riempie di duplicati
 * per sembrare più pieno. La card che passa dietro si dissolve prima di
 * ricomparire dall'altro lato, e con tre card il salto non si vede.
 *
 * CSS 3D e non WebGL: sono rettangoli con una rotazione, e una `<img>` in
 * una card è anche selezionabile, accessibile e leggera.
 */
export type DeckHandle = {
  /** Gira l'anello di `delta` card e committa. */
  step: (delta: number) => void;
};

type DeckProps = {
  works: Work[];
  /** Lavoro in riproduzione. */
  index: number;
  onCommit: (index: number) => void;
  /** Ogni gesto sulla deck tiene sveglio l'HUD. */
  onWake: () => void;
  /** Trascinamento in corso: l'HUD non deve sparire a mano ferma. */
  onDrag: (active: boolean) => void;
  /** Fuori dall'HOLD la rotella non si tocca: la pagina deve scorrere. */
  interceptWheel: boolean;
  reduced: boolean;
  /** Parametri ridotti: mobile, o telefono ruotato. */
  compact: boolean;
  className?: string;
};

const GEOMETRY = {
  wide: { stepRatio: 0.66, gap: 18, depth: 90, rot: 42, bump: 36 },
  compact: { stepRatio: 0.64, gap: 12, depth: 70, rot: 38, bump: 28 },
} as const;

/** Rotella: soglia, azzeramento dell'accumulo, minimo fra due scatti. */
const WHEEL = { threshold: 45, resetAfter: 180, minGap: 260 } as const;
/** Drag: px oltre i quali il gesto è dichiarato orizzontale, e finestra
 *  su cui si campiona la velocità. */
const DRAG = { decide: 4, sampleMs: 90, friction: 0.92, launch: 1.2, stop: 0.5 } as const;

export const Deck = forwardRef<DeckHandle, DeckProps>(function Deck(
  { works, index, onCommit, onWake, onDrag, interceptWheel, reduced, compact, className = '' },
  ref
) {
  const { t } = useTranslation();
  const deckRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // `cur` e `live` non sono stato di React: cambiano a ogni frame durante il
  // drag, e farli passare da un render sarebbe un render per fotogramma.
  const curRef = useRef(index);
  const liveRef = useRef(0);
  const inertiaRef = useRef<number | null>(null);
  // L'accumulo e l'ultimo scatto della rotella stanno fuori dall'effetto:
  // ogni cambio di lavoro ricrea l'effetto, e se vivessero lì dentro il
  // limite fra due scatti si azzererebbe proprio dopo uno scatto — cioè
  // esattamente quando serve.
  const wheelRef = useRef({ acc: 0, last: 0 });

  const n = works.length;
  const norm = useCallback((v: number) => ((v % n) + n) % n, [n]);

  const geometry = useCallback(() => {
    const g = compact ? GEOMETRY.compact : GEOMETRY.wide;
    const width = cardsRef.current[0]?.offsetWidth ?? 160;
    return { ...g, step: g.stepRatio * width };
  }, [compact]);

  /** Scrive la posizione di ogni card. Nessun render: solo stile. */
  const layout = useCallback(
    (live: number) => {
      const g = geometry();
      const ring = n > 2;
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        const raw = i - curRef.current - live;
        const pos = ring
          ? (((raw + n / 2) % n) + n) % n - n / 2
          : Math.max(-1, Math.min(1, raw));
        const a = Math.abs(pos);
        const cl = Math.max(-1, Math.min(1, pos));

        const x = pos * g.step + cl * g.gap;
        const z = -a * g.depth + Math.max(0, 1 - a) * g.bump;
        const ry = -cl * g.rot;

        let opacity = Math.max(0, 1 - 0.22 * a);
        if (ring) {
          // La card che sta girando dietro l'anello si spegne prima di
          // ricomparire dall'altro lato.
          const edge = n / 2 - a;
          if (edge < 0.45) opacity *= Math.max(0, edge / 0.45);
        }
        if (a > 3.5) opacity = 0;

        card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${ry}deg)`;
        card.style.zIndex = String(100 - Math.round(10 * a));
        // Stringa vuota, non 'auto': così la card eredita dall'HUD, che è
        // inerte quando dorme. Con 'auto' una card invisibile resterebbe
        // cliccabile sopra il video.
        card.style.pointerEvents = opacity === 0 ? 'none' : '';
        card.style.setProperty('--card-op', String(opacity));
        card.style.setProperty('--card-sat', a >= 0.5 ? '0.6' : '1');
        // `is-center` è visivo e segue il gesto; `aria-selected` no: dice
        // qual è il lavoro scelto, e lo scrive il JSX da `index`. Mentre
        // l'anello gira il lavoro non è ancora cambiato.
        card.classList.toggle('is-center', a < 0.5);
      });
    },
    [geometry, n]
  );

  const commit = useCallback(() => {
    const next = norm(curRef.current);
    curRef.current = next;
    liveRef.current = 0;
    layout(0);
    onCommit(next);
  }, [layout, norm, onCommit]);

  const stopInertia = useCallback(() => {
    if (inertiaRef.current !== null) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }
  }, []);

  const stepBy = useCallback(
    (delta: number) => {
      stopInertia();
      deckRef.current?.classList.remove('is-dragging');
      curRef.current += delta;
      commit();
    },
    [commit, stopInertia]
  );

  useImperativeHandle(ref, () => ({ step: stepBy }), [stepBy]);

  // L'indice arriva anche da fuori (tastiera, fine video). Se coincide con
  // quello che la deck già mostra non si muove nulla.
  useEffect(() => {
    if (norm(curRef.current) !== index) {
      curRef.current = index;
      liveRef.current = 0;
    }
    layout(liveRef.current);
  }, [index, layout, norm, compact, works]);

  /* ---- drag con inerzia ------------------------------------------------ */
  const drag = useRef({
    active: false,
    startX: 0,
    startY: 0,
    offset: 0,
    horizontal: null as boolean | null,
    moved: 0,
    samples: [] as { x: number; t: number }[],
  });

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || n < 2) return;
    stopInertia();
    onWake();
    const d = drag.current;
    d.active = true;
    d.startX = event.clientX;
    d.startY = event.clientY;
    d.offset = 0;
    d.horizontal = null;
    d.moved = 0;
    d.samples = [{ x: event.clientX, t: performance.now() }];
    try {
      // Il browser può rifiutare la cattura (puntatore già sparito, o un
      // ambiente di prova): il trascinamento deve partire lo stesso.
      deckRef.current?.setPointerCapture(event.pointerId);
    } catch {
      /* niente cattura: si va avanti con gli eventi normali */
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = d.startX - event.clientX;
    const dy = d.startY - event.clientY;
    d.moved = Math.max(d.moved, Math.abs(dx));

    // I primi 4 px decidono di chi è il gesto: se è verticale la pagina
    // deve poter scorrere anche partendo dalla deck.
    if (d.horizontal === null && (Math.abs(dx) > DRAG.decide || Math.abs(dy) > DRAG.decide)) {
      d.horizontal = Math.abs(dx) >= Math.abs(dy);
      if (d.horizontal) {
        deckRef.current?.classList.add('is-dragging');
        onDrag(true);
      }
    }
    if (d.horizontal !== true) return;

    onWake();
    d.offset = dx;
    const g = geometry();
    let live = d.offset / g.step;
    if (n <= 2) live = Math.max(-1, Math.min(1, live));
    liveRef.current = live;
    layout(live);

    const now = performance.now();
    d.samples.push({ x: event.clientX, t: now });
    while (d.samples.length > 2 && d.samples[0].t < now - DRAG.sampleMs) d.samples.shift();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    try {
      if (deckRef.current?.hasPointerCapture(event.pointerId)) {
        deckRef.current.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* il puntatore era già sparito */
    }
    if (d.horizontal !== true) {
      deckRef.current?.classList.remove('is-dragging');
      onDrag(false);
      return;
    }

    const g = geometry();
    let velocity = 0;
    if (d.samples.length >= 2) {
      const first = d.samples[0];
      const last = d.samples[d.samples.length - 1];
      const dt = last.t - first.t;
      if (dt > 8) velocity = ((first.x - last.x) / dt) * 16;
    }

    const settle = () => {
      deckRef.current?.classList.remove('is-dragging');
      onDrag(false);
      curRef.current += Math.round(liveRef.current);
      commit();
    };

    if (!reduced && n > 2 && Math.abs(velocity) > DRAG.launch) {
      const run = () => {
        velocity *= DRAG.friction;
        d.offset += velocity;
        let live = d.offset / g.step;
        // Superata una card intera si sposta l'indice e si normalizza, così
        // `live` resta piccolo e la matematica non deriva.
        if (Math.abs(live) >= 1) {
          const shift = Math.trunc(live);
          curRef.current += shift;
          d.offset -= shift * g.step;
          live = d.offset / g.step;
        }
        liveRef.current = live;
        layout(live);
        if (Math.abs(velocity) > DRAG.stop) {
          inertiaRef.current = requestAnimationFrame(run);
        } else {
          inertiaRef.current = null;
          settle();
        }
      };
      inertiaRef.current = requestAnimationFrame(run);
    } else {
      settle();
    }
  };

  /* ---- rotella --------------------------------------------------------- */
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const w = wheelRef.current;
    let reset: number | undefined;

    const onWheel = (event: WheelEvent) => {
      // Fuori dall'HOLD la deck non esiste per la rotella: scorre la pagina.
      if (!interceptWheel) return;
      event.preventDefault();
      onWake();
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      w.acc += delta;
      const now = performance.now();
      if (Math.abs(w.acc) > WHEEL.threshold && now - w.last > WHEEL.minGap) {
        stepBy(w.acc > 0 ? 1 : -1);
        w.acc = 0;
        w.last = now;
      }
      window.clearTimeout(reset);
      reset = window.setTimeout(() => {
        w.acc = 0;
      }, WHEEL.resetAfter);
    };

    deck.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      deck.removeEventListener('wheel', onWheel);
      window.clearTimeout(reset);
    };
  }, [interceptWheel, onWake, stepBy]);

  useEffect(() => stopInertia, [stopInertia]);

  const cardHeightVar = compact ? '150px' : 'clamp(140px, 13vw, 190px)';

  return (
    <div
      ref={deckRef}
      role="listbox"
      tabIndex={0}
      aria-label={t('sala.deck')}
      className={`deck mx-auto w-full ${reduced ? 'is-flat' : ''} ${className}`}
      style={
        {
          '--card-w': cardHeightVar,
          height: `calc(${cardHeightVar} * 9 / 16 + 44px)`,
        } as React.CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {works.map((work, i) => (
        <div
          key={work.id}
          ref={(el) => {
            cardsRef.current[i] = el;
          }}
          className="deck-card"
          role="option"
          aria-selected={i === index}
          style={{ top: '22px' }}
        >
          <span className="deck-title u-cap text-ink">{work.title}</span>
          <button
            type="button"
            className="deck-face"
            tabIndex={-1}
            aria-hidden
            onClick={() => {
              // Un click che arriva dopo un trascinamento non è un click.
              if (drag.current.moved > DRAG.decide) return;
              if (norm(curRef.current) === i) return;
              onWake();
              curRef.current = i;
              commit();
            }}
          >
            <img src={work.poster} alt="" draggable={false} />
          </button>
        </div>
      ))}
    </div>
  );
});
