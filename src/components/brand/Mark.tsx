import type { Ref } from 'react';

/**
 * Il marchio LockVFX, dal file ufficiale.
 *
 * I tre path sono quelli di `src/assets/brand/lockvfx-mark.svg`, copiati
 * senza toccarli: staffa, corpo (con le perforazioni della pellicola) e
 * serratura. Del file originale qui non entra il gradiente rosso — nel sito
 * il rosso e' un segnale, non un colore di superficie: il marchio prende
 * `currentColor` e lo decide chi lo usa. Il gradiente resta nella favicon e
 * nell'immagine OG, dove il marchio e' solo.
 *
 * Nel logo ufficiale il lucchetto e' **aperto**: la gamba destra della
 * staffa finisce 25 unita' sopra il corpo. `shackleOffset` misura quella
 * distanza in unita' di viewBox — 0 = aperto com'e' nel logo, 25 = chiuso —
 * cosi' chi anima (il Loader col progresso, la Stanza all'invio) lavora con
 * il numero del disegno e non con una conversione in px.
 *
 * Due modi: `solid` (pieno, per il wordmark e la favicon) e `outline`
 * (contorno di 1,5 px reali, per il Loader e la Stanza). Chiuso e pieno
 * sono la stessa cosa: e' il gesto della fine del caricamento e dell'invio.
 */

/**
 * Riquadro stretto sul marchio dentro il 1920x1920 del file originale.
 * Misurato con `getBBox()` sul disegno vero (743,6 / 611,7 / 433,8 / 690,9)
 * e arrotondato all'unita' verso l'esterno: cosi' il marchio riempie la sua
 * casella e chi lo usa ragiona sull'altezza, non sui margini del file.
 */
export const MARK_VIEWBOX = { x: 743, y: 611, w: 435, h: 692 } as const;

/** Quanto scende la staffa per chiudersi, in unita' di viewBox. */
export const SHACKLE_CLOSED = 25;

type MarkProps = {
  /** Altezza in px. La larghezza segue le proporzioni del riquadro. */
  size?: number;
  /** `solid` = pieno; `outline` = contorno di 1,5 px reali. */
  mode?: 'solid' | 'outline';
  /** 0 = aperto come nel logo, 25 = chiuso. Unita' di viewBox. */
  shackleOffset?: number;
  className?: string;
  /** Testo accessibile. Se assente il marchio e' decorativo (aria-hidden). */
  title?: string;
  /** Per animare la staffa dall'esterno (Loader, Stanza). */
  shackleRef?: Ref<SVGPathElement>;
};

/** Contorno: 1,5 px reali a qualsiasi dimensione. */
const STROKE = 1.5;

const SHACKLE =
  'M1114.06,765.27v98.2h-50.1v-98.2c0-57.05-46.41-103.47-103.46-103.47s-103.47,46.42-103.47,103.47v115.37c-6.26,2.76-12.35,5.83-18.25,9.19-11.36,6.47-22.02,14.05-31.85,22.55v-147.12c0-84.68,68.89-153.57,153.57-153.57s153.56,68.89,153.56,153.57Z';
const BODY =
  'M950.03,888.87c-37.04,0-71.83,9.81-101.92,26.96-15.33,8.74-29.44,19.39-42,31.62-38.54,37.52-62.51,89.93-62.51,147.84v207.28h227.38c113.82,0,206.42-92.61,206.42-206.43v-207.27h-227.37ZM783.62,1238.78c0,1.27-1.02,2.29-2.29,2.29h-12.78c-1.27,0-2.29-1.02-2.29-2.29v-20.74c0-1.26,1.02-2.29,2.29-2.29h12.78c1.27,0,2.29,1.03,2.29,2.29v20.74ZM783.62,1195.05c0,1.27-1.02,2.29-2.29,2.29h-12.78c-1.27,0-2.29-1.02-2.29-2.29v-20.74c0-1.26,1.02-2.29,2.29-2.29h12.78c1.27,0,2.29,1.03,2.29,2.29v20.74ZM783.62,1151.32c0,1.27-1.02,2.29-2.29,2.29h-12.78c-1.27,0-2.29-1.02-2.29-2.29v-20.74c0-1.26,1.02-2.29,2.29-2.29h12.78c1.27,0,2.29,1.03,2.29,2.29v20.74ZM783.62,1107.59c0,1.27-1.02,2.29-2.29,2.29h-12.78c-1.27,0-2.29-1.02-2.29-2.29v-20.74c0-1.26,1.02-2.29,2.29-2.29h12.78c1.27,0,2.29,1.03,2.29,2.29v20.74ZM1114.72,1096.09c0,79.95-65.04,144.98-144.98,144.98h-163.46v-145.73c0-25.4,6.58-49.28,18.08-70.07,9.37-16.87,22-31.7,37.04-43.62,24.72-19.58,55.95-31.28,89.86-31.28h163.46v145.72ZM1154.83,1104.59c0,1.26-1.03,2.29-2.29,2.29h-12.79c-1.26,0-2.28-1.03-2.28-2.29v-20.74c0-1.27,1.02-2.29,2.28-2.29h12.79c1.26,0,2.29,1.02,2.29,2.29v20.74ZM1154.83,1060.86c0,1.26-1.03,2.29-2.29,2.29h-12.79c-1.26,0-2.28-1.03-2.28-2.29v-20.74c0-1.27,1.02-2.29,2.28-2.29h12.79c1.26,0,2.29,1.02,2.29,2.29v20.74ZM1154.83,1017.13c0,1.26-1.03,2.29-2.29,2.29h-12.79c-1.26,0-2.28-1.03-2.28-2.29v-20.74c0-1.27,1.02-2.29,2.28-2.29h12.79c1.26,0,2.29,1.02,2.29,2.29v20.74ZM1154.83,973.4c0,1.26-1.03,2.29-2.29,2.29h-12.79c-1.26,0-2.28-1.03-2.28-2.29v-20.74c0-1.27,1.02-2.29,2.28-2.29h12.79c1.26,0,2.29,1.02,2.29,2.29v20.74Z';
const KEYHOLE =
  'M984.92,1103.05l18.32,75.93h-85.47l18.32-75.93c-14.46-8.41-24.17-24.07-24.17-42h0c0-26.84,21.75-48.59,48.58-48.59,13.42,0,25.57,5.44,34.36,14.23,8.79,8.79,14.23,20.93,14.23,34.35h0c0,17.94-9.71,33.6-24.17,42.01Z';

export function Mark({
  size = 24,
  mode = 'solid',
  shackleOffset = 0,
  className,
  title,
  shackleRef,
}: MarkProps) {
  const paint =
    mode === 'outline'
      ? {
          fill: 'none' as const,
          stroke: 'currentColor',
          strokeWidth: STROKE,
          vectorEffect: 'non-scaling-stroke' as const,
        }
      : { fill: 'currentColor' };

  return (
    <svg
      viewBox={`${MARK_VIEWBOX.x} ${MARK_VIEWBOX.y} ${MARK_VIEWBOX.w} ${MARK_VIEWBOX.h}`}
      height={size}
      width={(size * MARK_VIEWBOX.w) / MARK_VIEWBOX.h}
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
        id="shackle"
        data-mark="shackle"
        d={SHACKLE}
        transform={shackleOffset ? `translate(0 ${shackleOffset})` : undefined}
        {...paint}
      />
      <path id="body" data-mark="body" d={BODY} {...paint} />
      <path id="keyhole" data-mark="keyhole" d={KEYHOLE} {...paint} />
    </svg>
  );
}
