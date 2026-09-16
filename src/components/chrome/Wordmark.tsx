import { WORDMARK_TEXT } from '../../brand/tokens';
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
};

export function Wordmark({ href = '#top', home = false, oltre = false }: WordmarkProps) {
  const parola = WORDMARK_TEXT === 'always' || !home || oltre;

  return (
    <a
      href={href}
      aria-label="LockVFX"
      className="pointer-events-auto flex items-center gap-2.5 text-ink transition-opacity duration-200 hover:opacity-70"
    >
      {/* Il bersaglio del volo del loader: il marchio in volo arriva qui, e
          fino a quel momento questo resta invisibile — due lucchetti sullo
          schermo sarebbero due lucchetti (`rifinitura-spec.md` §2, fase E).
          Il Loader lo trova da qui e gli scrive la `visibility`. */}
      <span data-chrome-mark className="flex">
        <Mark size={18} />
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
