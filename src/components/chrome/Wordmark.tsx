import { Mark } from '../brand/Mark';

/**
 * Marchio + nome, in alto a sinistra, sempre presente: è l'unico elemento
 * che non cambia mai durante la carrellata, quindi è anche il punto fermo
 * dell'orientamento. Click = si torna in cima.
 */
export function Wordmark() {
  return (
    <a
      href="#top"
      className="pointer-events-auto flex items-center gap-2.5 text-ink transition-opacity duration-200 hover:opacity-70"
    >
      <Mark size={18} />
      <span className="text-[14px] font-medium tracking-[-0.01em]">LockVFX</span>
    </a>
  );
}
