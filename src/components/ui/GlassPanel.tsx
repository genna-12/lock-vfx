import { useRef, type PointerEvent, type ReactNode } from 'react';
import { FOOTER_CARD, MOTION } from '../../brand/tokens';
import { useCoarsePointer, useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Il pannello che si inclina sotto il puntatore, con la luce che lo segue.
 *
 * È il pezzo del sito precedente che LockVFX ha chiesto di rivedere
 * (`rifinitura-spec.md` §7.6): torna **solo qui**, sulla card dell'invito a
 * scrivere, come pezzo unico. La Direzione lo ha ammesso a queste condizioni
 * (§4): rotazione massima ±4° — un cenno, non una giostra —, luce al 14 %,
 * e **niente vetro**: la card è opaca `obsidian` con il suo filo di bordo,
 * nessun `backdrop-filter`. Un footer sfocato costa un repaint a fotogramma
 * e non dice niente che il bordo non dica già.
 *
 * Si spegne dove il gesto non esiste o non è gradito: su touch «hover» vuol
 * dire «ho già premuto», e a chi ha chiesto meno movimento non si inclina
 * niente. In tutti e due i casi resta la card ferma, identica a quella di
 * `v2` più il fondo opaco: nessun listener, nessun nodo in più.
 *
 * Costa un `transform` e un gradiente su un layer che non è mai animato dal
 * browser: si scrive sullo stile del nodo, senza passare dallo stato, così
 * muovere il mouse non fa render a React.
 */
type GlassPanelProps = {
  children: ReactNode;
  /** Le classi della card. Restano quelle del footer: qui non si decide la forma. */
  className?: string;
};

/** Gradi di inclinazione al massimo dello spostamento, sui due assi. */
const TILT = 4;
/** Quanto è lontano l'occhio: più è grande, più l'inclinazione è discreta. */
const PERSPECTIVE = 900;
/** Il raggio della luce che segue il puntatore. */
const SPOT = 420;

export function GlassPanel({ children, className = '' }: GlassPanelProps) {
  const cardRef = useRef<HTMLElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const coarse = useCoarsePointer();
  const reduce = useReducedMotion();
  const vivo = FOOTER_CARD === 'glass' && !coarse && !reduce;

  const muovi = (event: PointerEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    // Il centro non si inclina; i bordi arrivano a ±4°. L'asse X è invertito
    // perché alzare il puntatore deve alzare il bordo alto, non abbassarlo.
    // Mentre il puntatore è dentro la card lo segue senza transizione: con
    // una durata addosso arriverebbe sempre un terzo di secondo dopo la mano.
    card.style.transitionDuration = '0ms';
    card.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${(0.5 - y) * 2 * TILT}deg) rotateY(${(x - 0.5) * 2 * TILT}deg)`;
    const spot = spotRef.current;
    if (spot) {
      spot.style.background = `radial-gradient(${SPOT}px circle at ${event.clientX - box.left}px ${event.clientY - box.top}px, color-mix(in srgb, var(--color-ink) 14%, transparent), transparent 62%)`;
      spot.style.opacity = '1';
    }
  };

  const esci = () => {
    const card = cardRef.current;
    if (card) {
      // Il ritorno sì: la card si raddrizza in `f8`, come tutto ciò che
      // arriva in questo sito.
      card.style.transitionDuration = '';
      card.style.transform = '';
    }
    const spot = spotRef.current;
    if (spot) spot.style.opacity = '0';
  };

  if (!vivo) return <section className={className}>{children}</section>;

  return (
    <section
      ref={cardRef}
      onPointerMove={muovi}
      onPointerLeave={esci}
      onBlur={esci}
      // `bg-obsidian`: opaca, non traslucida. La card si stacca dal fondo
      // perché è un volume, non perché ci si vede attraverso.
      className={`relative isolate bg-obsidian ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        // Solo il ritorno è animato: mentre il puntatore è dentro, la card lo
        // segue fotogramma per fotogramma, e una transizione lo farebbe
        // arrivare in ritardo.
        transition: `transform ${MOTION.f8}ms ${MOTION.easeArrive}`,
      }}
    >
      {/* La luce: un solo layer sopra la card e sotto il testo, che non
          intercetta niente. Eredita il raggio della card dal genitore. */}
      <div
        ref={spotRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0"
        style={{ transition: `opacity ${MOTION.f5}ms linear` }}
      />
      {children}
    </section>
  );
}
