import type { Ref } from 'react';

/**
 * Marchio LockVFX — PLACEHOLDER.
 *
 * Tracciato sul PNG in `src/assets/logo.png`: il lucchetto è un fotogramma
 * di pellicola (perforazioni sui due bordi, buco della serratura al centro,
 * due angoli opposti raccordati) e la staffa è aperta sul lato destro.
 * Geometria misurata sul PNG, non ridisegnata a occhio: corpo 434×415 con
 * raccordi r=200, finestra interna con bordo 62 e raccordi r=138,
 * perforazioni 19×27 al centro del bordo, staffa r=153/104 centrata sul corpo.
 *
 * ⚠ Da sostituire con l'SVG definitivo di LockVFX. Serve un file con la
 * staffa come path separato dal corpo: qui è `data-mark="shackle"` ed è ciò
 * che il Loader anima e che la Stanza solleva all'invio del form.
 */

type MarkProps = {
  /** Altezza in px. La larghezza segue le proporzioni (0.627 × altezza). */
  size?: number;
  className?: string;
  /** Testo accessibile. Se assente il marchio è decorativo (aria-hidden). */
  title?: string;
  /**
   * Di quanti px la staffa è sollevata rispetto al corpo. 0 = lucchetto
   * chiuso. Il Loader la fa scendere col caricamento, la Stanza la tiene a 6
   * e la chiude all'invio del form.
   */
  shackleOffset?: number;
  /**
   * Se presente, il marchio è disegnato a tratto di questo spessore in px
   * reali (`vector-effect`), non a pieno. È così che lo vuole il Loader.
   */
  strokeWidth?: number;
  /** Per animare la staffa dall'esterno (dasharray, scatto finale). */
  shackleRef?: Ref<SVGPathElement>;
};

const SHACKLE =
  'M64,300 L64,153 A153,153 0 0 1 370,153 L370,252 L321,252 L321,153 ' +
  'A104,104 0 0 0 113,153 L113,265 Q113,300 64,300 Z';

const BODY = [
  // sagoma esterna: angoli raccordati in alto a sinistra e in basso a destra
  'M200,277 L434,277 L434,492 A200,200 0 0 1 234,692 L0,692 L0,477 A200,200 0 0 1 200,277 Z',
  // finestra interna
  'M201,339 L372,339 L372,493 A138,138 0 0 1 234,631 L63,631 L63,477 A138,138 0 0 1 201,339 Z',
  // perforazioni: quattro in alto a destra, quattro in basso a sinistra
  ...([339, 382.7, 426.3, 470] as const).map((y) => perf(394, y)),
  ...([473, 516.7, 560.3, 604] as const).map((y) => perf(22, y)),
  // buco della serratura
  'M190,489 L175,568 L259,568 L244,489 A48.5,48.5 0 1 0 190,489 Z',
].join(' ');

/** Perforazione 19×27 con angoli da 3. */
function perf(x: number, y: number): string {
  return `M${x + 3},${y} h13 a3,3 0 0 1 3,3 v21 a3,3 0 0 1 -3,3 h-13 a3,3 0 0 1 -3,-3 v-21 a3,3 0 0 1 3,-3 z`;
}

export function Mark({
  size = 24,
  className,
  title,
  shackleOffset = 0,
  strokeWidth,
  shackleRef,
}: MarkProps) {
  const outlined = strokeWidth !== undefined;
  // Il viewBox è alto 692 unità e sullo schermo è alto `size` px: per
  // sollevare la staffa di N px reali servono N × 692 / size unità.
  const lift = shackleOffset ? (shackleOffset * 692) / size : 0;
  const paint = outlined
    ? {
        fill: 'none' as const,
        stroke: 'currentColor',
        strokeWidth,
        vectorEffect: 'non-scaling-stroke' as const,
      }
    : { fill: 'currentColor' };

  return (
    <svg
      viewBox="0 0 434 692"
      height={size}
      width={size * (434 / 692)}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      overflow="visible"
    >
      {title ? <title>{title}</title> : null}
      <path
        ref={shackleRef}
        data-mark="shackle"
        d={SHACKLE}
        transform={lift ? `translate(0 ${-lift})` : undefined}
        {...paint}
      />
      <path data-mark="body" d={BODY} fillRule="evenodd" {...paint} />
    </svg>
  );
}
