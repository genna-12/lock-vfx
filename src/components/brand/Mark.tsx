import { useId, useLayoutEffect, useRef, type Ref } from 'react';
import { MARK_VIEWBOX } from '../../brand/mark';

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
 * cosi' chi anima (il Loader col progresso, il respiro del chrome) lavora con
 * il numero del disegno e non con una conversione in px.
 *
 * Dal 18/9 (§9.1) il marchio in pagina e' **sempre pieno**: nel chrome, nel
 * loader e nella conferma della Stanza. Il modo `outline` resta solo per la
 * riserva disegnata del loader (`LOADER_SOURCE = 'drawn'`), dove i tre path
 * si tracciano e un contorno e' l'unico modo per tracciare qualcosa.
 *
 * `flood` riempie il marchio di un colore che sale dal basso, come un
 * livello: oggi lo usa solo la conferma della Stanza (Genna, 9/10 — il
 * lucchetto resta aperto e diventa rosso). Senza `flood` il disegno e'
 * esattamente quello di prima, tre path e basta.
 */

type Flood = {
  /** Il colore che sale: un token (`var(--color-crimson)`), mai un hex. */
  color: string;
  /** Quanto ci mette a salire, in ms. 0 = gia' pieno (reduced motion). */
  duration: number;
  /** La curva della salita, dai token. */
  easing: string;
};

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
  /** Per animare la staffa dall'esterno (Loader, chrome). */
  shackleRef?: Ref<SVGPathElement>;
  /** Riempimento dal basso; con `flood` il marchio e' sempre pieno. */
  flood?: Flood;
};

/** Contorno: 1,5 px reali a qualsiasi dimensione. */
const STROKE = 1.5;

const SHACKLE =
  'M1114.06,765.27v98.2h-50.1v-98.2c0-57.05-46.41-103.47-103.46-103.47s-103.47,46.42-103.47,103.47v115.37c-6.26,2.76-12.35,5.83-18.25,9.19-11.36,6.47-22.02,14.05-31.85,22.55v-147.12c0-84.68,68.89-153.57,153.57-153.57s153.56,68.89,153.56,153.57Z';
const BODY =
  'M950.03,888.87c-37.04,0-71.83,9.81-101.92,26.96-15.33,8.74-29.44,19.39-42,31.62-38.54,37.52-62.51,89.93-62.51,147.84v207.28h227.38c113.82,0,206.42-92.61,206.42-206.43v-207.27h-227.37ZM783.62,1238.78c0,1.27-1.02,2.29-2.29,2.29h-12.78c-1.27,0-2.29-1.02-2.29-2.29v-20.74c0-1.26,1.02-2.29,2.29-2.29h12.78c1.27,0,2.29,1.03,2.29,2.29v20.74ZM783.62,1195.05c0,1.27-1.02,2.29-2.29,2.29h-12.78c-1.27,0-2.29-1.02-2.29-2.29v-20.74c0-1.26,1.02-2.29,2.29-2.29h12.78c1.27,0,2.29,1.03,2.29,2.29v20.74ZM783.62,1151.32c0,1.27-1.02,2.29-2.29,2.29h-12.78c-1.27,0-2.29-1.02-2.29-2.29v-20.74c0-1.26,1.02-2.29,2.29-2.29h12.78c1.27,0,2.29,1.03,2.29,2.29v20.74ZM783.62,1107.59c0,1.27-1.02,2.29-2.29,2.29h-12.78c-1.27,0-2.29-1.02-2.29-2.29v-20.74c0-1.26,1.02-2.29,2.29-2.29h12.78c1.27,0,2.29,1.03,2.29,2.29v20.74ZM1114.72,1096.09c0,79.95-65.04,144.98-144.98,144.98h-163.46v-145.73c0-25.4,6.58-49.28,18.08-70.07,9.37-16.87,22-31.7,37.04-43.62,24.72-19.58,55.95-31.28,89.86-31.28h163.46v145.72ZM1154.83,1104.59c0,1.26-1.03,2.29-2.29,2.29h-12.79c-1.26,0-2.28-1.03-2.28-2.29v-20.74c0-1.27,1.02-2.29,2.28-2.29h12.79c1.26,0,2.29,1.02,2.29,2.29v20.74ZM1154.83,1060.86c0,1.26-1.03,2.29-2.29,2.29h-12.79c-1.26,0-2.28-1.03-2.28-2.29v-20.74c0-1.27,1.02-2.29,2.28-2.29h12.79c1.26,0,2.29,1.02,2.29,2.29v20.74ZM1154.83,1017.13c0,1.26-1.03,2.29-2.29,2.29h-12.79c-1.26,0-2.28-1.03-2.28-2.29v-20.74c0-1.27,1.02-2.29,2.28-2.29h12.79c1.26,0,2.29,1.02,2.29,2.29v20.74ZM1154.83,973.4c0,1.26-1.03,2.29-2.29,2.29h-12.79c-1.26,0-2.28-1.03-2.28-2.29v-20.74c0-1.27,1.02-2.29,2.28-2.29h12.79c1.26,0,2.29,1.02,2.29,2.29v20.74Z';
/** Margine del livello oltre il riquadro: il bordo non deve sfiorare il disegno. */
const PAD = 2;
/** Altezza del livello, ed e' anche la sua corsa. */
const LEVEL_H = MARK_VIEWBOX.h + PAD * 2;

const KEYHOLE =
  'M984.92,1103.05l18.32,75.93h-85.47l18.32-75.93c-14.46-8.41-24.17-24.07-24.17-42h0c0-26.84,21.75-48.59,48.58-48.59,13.42,0,25.57,5.44,34.36,14.23,8.79,8.79,14.23,20.93,14.23,34.35h0c0,17.94-9.71,33.6-24.17,42.01Z';

export function Mark({
  size = 24,
  mode = 'solid',
  shackleOffset = 0,
  className,
  title,
  shackleRef,
  flood,
}: MarkProps) {
  // `useId` di React non e' garantito valido dentro `url(#…)`: si tiene solo
  // cio' che un `id` SVG accetta senza escape.
  const clipId = `mark-flood-${useId().replace(/[^\w-]/g, '')}`;
  const levelRef = useRef<SVGGElement>(null);
  const floodOn = Boolean(flood);
  const duration = flood?.duration ?? 0;
  const easing = flood?.easing ?? 'linear';

  // La salita. Lo stato di riposo del livello e' gia' "pieno" (nessun
  // `transform`): l'animazione va **da** vuoto a li', senza `fill`. Cosi'
  // con duration 0, a fine corsa, o se l'animazione viene annullata, quello
  // che resta in pagina e' sempre il marchio pieno — mai uno stato a meta'.
  // Web Animations e non una transizione: parte anche su un elemento appena
  // uscito da `display: none` (il telefono), senza fotogrammi d'attesa.
  useLayoutEffect(() => {
    const el = levelRef.current;
    if (!floodOn || !el || duration <= 0 || typeof el.animate !== 'function') return;
    const anim = el.animate(
      [{ transform: `translateY(${LEVEL_H}px)` }, { transform: 'none' }],
      { duration, easing }
    );
    return () => anim.cancel();
  }, [floodOn, duration, easing]);

  const box = {
    x: MARK_VIEWBOX.x - PAD,
    width: MARK_VIEWBOX.w + PAD * 2,
    height: LEVEL_H,
  };

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
      {flood ? (
        <>
          {/* Il disegno diventa una sagoma di ritaglio e dentro scorrono due
              rettangoli, il colore del marchio sopra e il livello sotto,
              mossi insieme. Non due copie del marchio sovrapposte: il bordo
              della copia di sotto resterebbe come un alone chiaro intorno al
              rosso. Qui il bordo si sfuma una volta sola. L'`id` e' unico
              (`useId`) ed esiste solo in questo caso. */}
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <path
                ref={shackleRef}
                data-mark="shackle"
                d={SHACKLE}
                transform={shackleOffset ? `translate(0 ${shackleOffset})` : undefined}
              />
              <path data-mark="body" d={BODY} />
              <path data-mark="keyhole" d={KEYHOLE} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <g ref={levelRef} data-mark="level">
              <rect {...box} y={MARK_VIEWBOX.y - PAD - LEVEL_H} fill="currentColor" />
              <rect {...box} y={MARK_VIEWBOX.y - PAD} fill={flood.color} />
            </g>
          </g>
        </>
      ) : (
        <>
          <path
            ref={shackleRef}
            data-mark="shackle"
            d={SHACKLE}
            transform={shackleOffset ? `translate(0 ${shackleOffset})` : undefined}
            {...paint}
          />
          {/* Niente `id`: il marchio sta in pagina più volte (chrome, Stanza,
              loader) e tre `id` ripetuti sono tre `id` doppi. Chi deve mettere le
              mani su un tratto usa `data-mark`, che è fatto per quello. */}
          <path data-mark="body" d={BODY} {...paint} />
          <path data-mark="keyhole" d={KEYHOLE} {...paint} />
        </>
      )}
    </svg>
  );
}
