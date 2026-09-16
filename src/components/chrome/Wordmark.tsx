import { useRef, type MouseEvent } from 'react';
import { WORDMARK_TEXT } from '../../brand/tokens';
import { useCoarsePointer, useReducedMotion } from '../../lib/useReducedMotion';
import { Mark } from '../brand/Mark';

/**
 * Il marchio in alto a sinistra: l'unico elemento che non cambia mai durante
 * la carrellata, quindi anche il punto fermo dell'orientamento. Click = si
 * torna in cima; dalla pagina Studio si torna alla home.
 *
 * La parola accanto **non c'è sulla prima schermata** e compare quando la
 * prima schermata è passata (`WORDMARK_TEXT`, `mobile-semplice-spec.md` §7):
 * lì lo schermo è del video, dopo il sito può dire come si chiama. Nelle
 * altre pagine c'è sempre.
 *
 * La parola non viene tolta dall'albero ma solo resa trasparente: così il
 * marchio non si sposta di un pixel quando arriva, e il nome accessibile del
 * link è sempre lo stesso — l'`aria-label` lo fissa comunque, che la parola
 * si veda o no.
 */
type WordmarkProps = {
  href?: string;
  /** Nella home la parola dipende da dove si è; altrove c'è sempre. */
  home?: boolean;
  /** Home: la prima schermata è passata. */
  oltre?: boolean;
  /**
   * Cosa vuol dire "in cima" in questa pagina. Nella home lo sa `inCima`
   * (`lib/inCima.ts`): con la carrellata il salto nativo a `#top` non porta
   * da nessuna parte, perché l'ancora è dentro il contenuto trasformato
   * dallo smoother. Senza, il link resta un link e funziona da solo.
   */
  onTop?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/** Di quanto si solleva la staffa sotto il puntatore, in unità di viewBox. */
const RESPIRO = 3;

export function Wordmark({ href = '#top', home = false, oltre = false, onTop }: WordmarkProps) {
  const parola = WORDMARK_TEXT === 'always' || !home || oltre;
  const shackleRef = useRef<SVGPathElement>(null);
  const coarse = useCoarsePointer();
  const reduce = useReducedMotion();

  /**
   * Il lucchetto respira quando lo tocchi: la staffa si solleva di tre unità
   * e torna (`rifinitura-spec.md` §3). È gratis, e insegna che quello lassù
   * è un oggetto — quindi che ci si può fare click.
   *
   * Niente su touch: lì "hover" vuol dire "ho già premuto", e un lucchetto
   * che si apre mentre si torna in cima direbbe la cosa sbagliata.
   */
  const respira = (su: boolean) => {
    if (coarse || reduce) return;
    const el = shackleRef.current;
    if (el) el.style.transform = su ? `translateY(-${RESPIRO}px)` : '';
  };

  return (
    <a
      href={href}
      onClick={onTop}
      onPointerEnter={() => respira(true)}
      onPointerLeave={() => respira(false)}
      onBlur={() => respira(false)}
      aria-label="LockVFX"
      className="pointer-events-auto flex items-center gap-2.5 text-ink transition-opacity duration-200 hover:opacity-70"
    >
      {/* Il bersaglio del volo del loader: il marchio in volo arriva qui, e
          fino a quel momento questo resta invisibile — due lucchetti sullo
          schermo sarebbero due lucchetti (`rifinitura-spec.md` §2, fase E).
          Il Loader lo trova da qui e gli scrive la `visibility`. */}
      <span data-chrome-mark className="flex">
        <Mark size={18} shackleRef={shackleRef} />
      </span>
      <span
        aria-hidden
        className="text-[14px] font-medium tracking-[-0.01em] transition-opacity duration-[var(--f5)]"
        style={{ opacity: parola ? 1 : 0 }}
      >
        LockVFX
      </span>
    </a>
  );
}
