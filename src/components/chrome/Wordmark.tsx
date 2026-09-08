import { WORDMARK_TEXT } from '../../brand/tokens';
import { Mark } from '../brand/Mark';

/**
 * Il marchio in alto a sinistra: l'unico elemento che non cambia mai durante
 * la carrellata, quindi anche il punto fermo dell'orientamento. Click = si
 * torna in cima; dalla pagina Studio si torna alla home, che per chi legge
 * è la stessa cosa.
 *
 * La parola accanto c'è nelle altre pagine e **non nella home**
 * (`WORDMARK_TEXT`): lì lo schermo è del video, e il nome lo dirà il video.
 * Quando la parola non c'è il nome resta comunque nel link, per chi legge
 * con uno screen reader: sparisce dagli occhi, non dalla pagina.
 */
export function Wordmark({ href = '#top', home = false }: { href?: string; home?: boolean }) {
  const parola = WORDMARK_TEXT === 'always' || !home;

  return (
    <a
      href={href}
      aria-label={parola ? undefined : 'LockVFX'}
      className="pointer-events-auto flex items-center gap-2.5 text-ink transition-opacity duration-200 hover:opacity-70"
    >
      <Mark size={18} />
      {parola ? (
        <span className="text-[14px] font-medium tracking-[-0.01em]">LockVFX</span>
      ) : null}
    </a>
  );
}
