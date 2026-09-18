import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { COLORS, LOADER_REPEAT, LOADER_SOURCE, MOTION } from '../brand/tokens';
import { EASE } from '../lib/ease';
import {
  LOADER_TIMING,
  LOADER_V3,
  isReturningVisit,
  loadProgress,
  markVisited,
  segnaEntrata,
  whenFontsReady,
} from '../lib/loadProgress';
import { useReducedMotion } from '../lib/useReducedMotion';
import { SHACKLE_CLOSED } from '../brand/mark';
import { Mark } from './brand/Mark';

/**
 * Il caricamento è il loro lucchetto che si chiude, e poi va al suo posto.
 *
 * Due coreografie, una sola forma. Con `LOADER_SOURCE = 'video'` (il default)
 * vale la **v3** di `rifinitura-spec.md` §9.2: il tempo non insegue la rete,
 * la aspetta.
 *
 *   0 attesa    finché il video è scaricato (`canplaythrough`), tetto 6 s.
 *               È il cancello che mancava: a cache vuota il video partiva, si
 *               bloccava, il loader staccava e non si vedeva niente.
 *   A · 300     il video entra in dissolvenza, fermo sul primo fotogramma.
 *   B · 3 033   l'animazione di LockVFX, velocità 1×. Non si accelera.
 *   C · 400     l'ultimo fotogramma, tenuto.
 *   D · 400     **innesto**: dissolvenza incrociata dall'ultimo fotogramma al
 *               marchio vettoriale, alla stessa misura e nello stesso punto
 *               (le costanti qui sotto). È il passaggio dal 3D al 2D, e prima
 *               era uno stacco: si vedeva il salto.
 *   E · 300     respiro.
 *   F · 900     il marchio vola in alto a sinistra mentre l'overlay si
 *               dissolve: sotto la reel è già in riproduzione. All'arrivo,
 *               swap secco col marchio del chrome, stesso pixel.
 *
 * Dove il video non si riproduce resta la coreografia disegnata (§2, A–E):
 * la riserva non è un ripiego, è lo stesso gesto fatto dal sito.
 *
 * Loader pieno **a ogni sessione nuova** del browser (`sessionStorage`);
 * dentro la stessa sessione il marchio è già al suo posto e l'overlay si
 * limita a dissolversi. Reduced motion: marchio fermo, stacco, niente volo.
 *
 * I passaggi di fase stanno su `setTimeout` e non sul `gsap.ticker`: in una
 * scheda in secondo piano il ticker è fermo, e il loader non staccherebbe.
 */

/** Il lato del riquadro in cui il video viene disegnato, prima dello zoom. */
const SIZE = 132;
const SIZE_MOBILE = 96;

/** Fine della fase B disegnata: gli ultimi 3 li fa lo scatto. */
const SHACKLE_B = SHACKLE_CLOSED - 3;

/** Nella terza esportazione (65466d9) il lucchetto è già ritagliato. */
const VIDEO_ZOOM = 1.25;

/**
 * L'ultimo fotogramma di `logo.mp4`, misurato una volta sul file (512×512,
 * soglia di luminanza 24): il lucchetto sta in un riquadro **alto 328 px**,
 * centrato in **(256,5 · 254)**. Sono i due numeri che rendono possibile
 * l'innesto — senza, il marchio vettoriale arriva a una misura sua e il
 * passaggio si legge come un salto.
 */
const FRAME = { side: 512, lockH: 328, cx: 256.5, cy: 254 } as const;

/** Il marchio dell'innesto è alto quanto il lucchetto del video. */
const MARK_RATIO = (VIDEO_ZOOM * FRAME.lockH) / FRAME.side;
/** …e sta nel suo stesso centro: il video è centrato, il lucchetto no, di un pelo. */
const MARK_DX = ((FRAME.cx - FRAME.side / 2) / FRAME.side) * VIDEO_ZOOM;
const MARK_DY = ((FRAME.cy - FRAME.side / 2) / FRAME.side) * VIDEO_ZOOM;

const BASE = import.meta.env.BASE_URL;
/**
 * Due file, come due `<source>`. L'**mp4 per primo**: è quello che tutti
 * sanno aprire, Safari compreso, ed è quello che abbiamo ricevuto per
 * ultimo. Il webm resta per chi preferisce VP9.
 */
const VIDEO_SRC_MP4 = `${BASE}loader/logo.mp4`;
const VIDEO_SRC_WEBM = `${BASE}loader/logo.webm`;

/** Uno dei due formati si riproduce? Se no, la coreografia disegnata. */
function videoRiproducibile(): boolean {
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('video');
  return (
    probe.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '' ||
    probe.canPlayType('video/webm; codecs="vp9"') !== ''
  );
}

type Fase = 'gesto' | 'volo' | 'fine';
type Volo = {
  left: number;
  top: number;
  size: number;
  scale: number;
  dx: number;
  dy: number;
  durata: number;
  ease: gsap.EaseString | gsap.EaseFunction;
  /** Col video la staffa è aperta come nell'ultimo fotogramma; disegnata, chiusa. */
  chiuso: boolean;
};

export function Loader({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [fase, setFase] = useState<Fase>('gesto');
  const [percent, setPercent] = useState(0);
  // Il riempimento è l'ultimo fotogramma del gesto disegnato, non uno stato
  // del caricamento: nasce falso e diventa vero una volta sola.
  const [filled, setFilled] = useState(false);
  const [sorgente, setSorgente] = useState<'drawn' | 'video'>(() =>
    LOADER_SOURCE === 'video' && videoRiproducibile() ? 'video' : 'drawn'
  );
  // Si legge una volta sola, al primo render: `markVisited()` arriva dopo, e
  // da lì in poi la risposta sarebbe sempre sì.
  const [ritorno] = useState(() => isReturningVisit());
  const [size] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? SIZE_MOBILE
      : SIZE
  );
  const [volo, setVolo] = useState<Volo | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const shackleRef = useRef<SVGPathElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voloRef = useRef<HTMLDivElement>(null);

  const conVideo = sorgente === 'video' && !ritorno && !reduce;
  /** Quanto è alto il marchio nell'overlay: col video, quanto il suo lucchetto. */
  const markSize = conVideo ? size * MARK_RATIO : size;

  // I task di competenza del Loader. `mark` e `js` sono già veri quando
  // questo codice gira: il marchio è in linea e il chunk è arrivato, dirlo
  // dopo un timeout finto sarebbe solo teatro. Il poster e la reel li
  // completa il componente Reel, che è quello che li possiede davvero.
  useEffect(() => {
    loadProgress.complete('mark');
    loadProgress.complete('js');
    let alive = true;
    void whenFontsReady().then(() => {
      if (alive) loadProgress.complete('font');
    });
    return () => {
      alive = false;
    };
  }, []);

  /* ---- il gesto, e poi il volo ----------------------------------------- */
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const chrome = document.querySelector<HTMLElement>('[data-chrome-mark]');
    // Nella stessa sessione il marchio **è già al suo posto**: non lo si
    // nasconde, non lo si fa volare. Altrimenti lassù non c'è niente finché
    // il volo non atterra: due lucchetti sullo schermo sono due lucchetti.
    if (chrome && !ritorno) chrome.style.visibility = 'hidden';
    const accendiChrome = () => {
      if (chrome) chrome.style.removeProperty('visibility');
    };

    const timers: number[] = [];
    const attesa = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    let via = false;
    /** F — il volo, o lo stacco secco per chi non vola. */
    const stacca = (conVolo: boolean, durata: number, ease: Volo['ease']) => {
      if (via) return;
      via = true;
      markVisited();
      // Da qui in poi la pagina si vede: chi conta i tempi dell'interfaccia
      // (l'indizio di scroll) parte adesso, non dal mount.
      segnaEntrata();
      const partenza = markRef.current?.getBoundingClientRect();
      const arrivo = chrome?.getBoundingClientRect();
      if (!conVolo || !partenza || !arrivo || !arrivo.height) {
        accendiChrome();
        setFase('fine');
        return;
      }
      // FLIP: si misura dove il marchio è adesso e dove deve arrivare, e si
      // muove un nodo solo — niente layout durante il volo.
      setVolo({
        left: partenza.left,
        top: partenza.top,
        size: markSize,
        scale: arrivo.height / partenza.height,
        dx: arrivo.left - partenza.left,
        dy: arrivo.top - partenza.top,
        durata,
        ease,
        chiuso: !conVideo,
      });
      // Misurato il punto di partenza, quello fermo se ne va: l'overlay si
      // dissolve in 900 ms e due marchi sovrapposti si vedrebbero tutti e due.
      if (markRef.current) markRef.current.style.visibility = 'hidden';
      setFase('volo');
    };

    const ctx = gsap.context(() => {
      /* ---- stessa sessione: il marchio è già lassù --------------------- */
      if (ritorno) {
        setPercent(100);
        // `LOADER_REPEAT = 'volo'` resta come prova: il solo volo, senza il
        // resto. Il default è la dissolvenza, che è quella decisa in §9.2.
        const vola = !reduce && LOADER_REPEAT === 'volo';
        if (vola) {
          if (chrome) chrome.style.visibility = 'hidden';
          setFilled(true);
          attesa(() => stacca(true, LOADER_TIMING.fly, EASE.arrive), 0);
        } else {
          // Niente stacco secco: quello che si vede è il nero che se ne va,
          // e sotto c'è già tutto al suo posto.
          gsap.to(overlay, {
            opacity: 0,
            duration: LOADER_TIMING.repeat / 1000,
            ease: EASE.cut,
          });
          attesa(() => stacca(false, 0, EASE.cut), LOADER_TIMING.repeat);
        }
        return;
      }

      /* ---- meno movimento: il marchio, fermo, e via -------------------- */
      if (reduce) {
        gsap.set(shackleRef.current, { y: SHACKLE_CLOSED });
        setFilled(true);
        setPercent(100);
        if (markRef.current) markRef.current.style.color = COLORS.crimson;
        attesa(() => stacca(false, 0, EASE.cut), LOADER_TIMING.repeat);
        return;
      }

      const unsubscribe = loadProgress.subscribe((value) => setPercent(Math.round(value * 100)));

      /* ---- v3: l'animazione di LockVFX -------------------------------- */
      if (sorgente === 'video') {
        const video = videoRef.current;
        const mark = markRef.current;
        if (!video || !mark) return;

        /** D → E → F: l'innesto, il respiro, il volo. */
        let innestato = false;
        const innesta = () => {
          if (innestato) return;
          innestato = true;
          video.pause();
          gsap.to(video, { opacity: 0, duration: LOADER_V3.innesto / 1000, ease: EASE.cut });
          gsap.to(mark, { opacity: 1, duration: LOADER_V3.innesto / 1000, ease: EASE.cut });
          attesa(
            () => stacca(true, LOADER_V3.volo, EASE.volo),
            LOADER_V3.innesto + LOADER_V3.respiro
          );
        };

        /** A → B → C. Da qui in poi è tutto tempo di montaggio. */
        let partito = false;
        const parti = () => {
          if (partito) return;
          partito = true;
          gsap.to(video, { opacity: 1, duration: LOADER_V3.ingresso / 1000, ease: EASE.cut });
          attesa(() => {
            void video.play().catch(innesta);
          }, LOADER_V3.ingresso);
          // C — la fine dell'animazione la dice il file, e l'ultimo fotogramma
          // resta lì per la tenuta. Il timer è la rete di sicurezza per
          // quando `ended` non arriva (scheda nascosta, codec che tronca):
          // chi arriva primo vince, `innestato` fa da lucchetto.
          video.addEventListener('ended', finita, { once: true });
          attesa(innesta, LOADER_V3.ingresso + LOADER_V3.animazione + LOADER_V3.tenuta);
        };
        const finita = () => attesa(innesta, LOADER_V3.tenuta);

        // 0 — il cancello. Non si guarda un rettangolo nero che si riempie a
        // pezzi: o il video c'è tutto, o si passa alla riserva disegnata.
        // Il tetto vale **solo** finché il video non è partito: una volta in
        // scena, l'animazione va fino in fondo. Senza questa guardia una rete
        // lenta la troncava a metà per andare alla riserva — che è il difetto
        // opposto a quello che il cancello doveva curare.
        const rinuncia = () => {
          if (partito) return;
          setSorgente('drawn');
        };
        if (video.readyState >= 4) {
          parti();
        } else {
          video.addEventListener('canplaythrough', parti, { once: true });
          video.addEventListener('error', rinuncia, { once: true });
          attesa(rinuncia, LOADER_V3.attesa);
        }

        return () => {
          unsubscribe();
          video.removeEventListener('canplaythrough', parti);
          video.removeEventListener('ended', finita);
          video.removeEventListener('error', rinuncia);
        };
      }

      /* ---- la riserva disegnata (§2, A–E) ------------------------------ */
      const shackle = shackleRef.current;
      if (!shackle) return;

      /** C — lo scatto, il fotogramma rosso, la tenuta, lo stacco. */
      let scattato = false;
      const scatta = () => {
        if (scattato) return;
        scattato = true;
        gsap.to(shackle, { y: SHACKLE_CLOSED, duration: MOTION.f2 / 1000, ease: EASE.cut });
        attesa(() => {
          setFilled(true);
          if (markRef.current) markRef.current.style.color = COLORS.crimson;
          attesa(() => stacca(true, LOADER_TIMING.fly, EASE.arrive), LOADER_TIMING.hold);
        }, MOTION.f2);
      };

      attesa(() => {
        gsap.set(shackle, { y: SHACKLE_CLOSED });
        setFilled(true);
        if (markRef.current) markRef.current.style.color = COLORS.crimson;
        stacca(true, LOADER_TIMING.fly, EASE.arrive);
      }, LOADER_TIMING.max);

      /* ---- A — i tre path si tracciano -------------------------------- */
      gsap.set(shackle, { y: 0 });
      const paths = Array.from(overlay.querySelectorAll<SVGPathElement>('svg path'));
      // Corpo, serratura, staffa: il lucchetto si costruisce da terra, e la
      // staffa — che è quella che poi si muove — arriva per ultima.
      const ordine = ['body', 'keyhole', 'shackle'];
      const tratti = ordine
        .map((n) => paths.find((p) => p.dataset.mark === n))
        .filter((p): p is SVGPathElement => Boolean(p));
      const durata = (LOADER_TIMING.draw - LOADER_TIMING.stagger * 2) / 1000;
      tratti.forEach((p, i) => {
        const len = p.getTotalLength();
        gsap.fromTo(
          p,
          { strokeDasharray: len, strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            duration: durata,
            delay: (LOADER_TIMING.stagger * i) / 1000,
            ease: EASE.arrive,
            onComplete: () => {
              p.style.removeProperty('stroke-dasharray');
              p.style.removeProperty('stroke-dashoffset');
            },
          }
        );
      });

      /* ---- B — la staffa scende, limitata dal progresso --------------- */
      const curva = gsap.parseEase('power2.inOut');
      const inizio = performance.now();
      let cancello = loadProgress.value();
      const passo = () => {
        const vero = loadProgress.value();
        cancello += (vero - cancello) * 0.12;
        const tt = (performance.now() - inizio - LOADER_TIMING.draw) / LOADER_TIMING.close;
        const q = tt <= 0 ? 0 : curva(Math.min(1, tt));
        gsap.set(shackle, { y: Math.min(q, cancello) * SHACKLE_B });
        if (q >= 1 && vero >= 1) {
          gsap.ticker.remove(passo);
          scatta();
        }
      };
      gsap.ticker.add(passo);

      return () => {
        unsubscribe();
        gsap.ticker.remove(passo);
      };
    }, overlay);

    return () => {
      for (const id of timers) window.clearTimeout(id);
      ctx.revert();
      accendiChrome();
    };
    // `conVideo` e `markSize` derivano dalle altre quattro: stanno qui perché
    // il lint le conta, non perché possano cambiare da sole.
  }, [reduce, ritorno, size, sorgente, conVideo, markSize]);

  /* ---- F — il volo, e l'overlay che si dissolve insieme ---------------- */
  useEffect(() => {
    const nodo = voloRef.current;
    if (fase !== 'volo' || !volo || !nodo) return;
    const chrome = document.querySelector<HTMLElement>('[data-chrome-mark]');
    const overlay = overlayRef.current;
    // L'overlay se ne va **mentre** il marchio vola: sotto la reel è già in
    // riproduzione, e il volo la attraversa invece di arrivare su un nero
    // che sparisce dopo.
    const tende = overlay
      ? gsap.to(overlay, { opacity: 0, duration: volo.durata / 1000, ease: EASE.cut })
      : null;
    const tween = gsap.to(nodo, {
      x: volo.dx,
      y: volo.dy,
      scale: volo.scale,
      duration: volo.durata / 1000,
      ease: volo.ease,
      onComplete: () => {
        // Nello stesso fotogramma: quello lassù si accende, questo sparisce.
        if (chrome) chrome.style.removeProperty('visibility');
        nodo.style.visibility = 'hidden';
        setFase('fine');
      },
    });
    return () => {
      tween.kill();
      tende?.kill();
    };
  }, [fase, volo]);

  const inGesto = fase === 'gesto';

  return (
    <>
      {children}

      {fase !== 'fine' ? (
        <div
          ref={overlayRef}
          data-loader
          className={`fixed inset-0 z-50 overflow-hidden bg-void text-ink ${
            inGesto ? '' : 'pointer-events-none'
          }`}
          role={inGesto ? 'progressbar' : undefined}
          aria-hidden={inGesto ? undefined : true}
          aria-label={inGesto ? t('loader.label') : undefined}
          aria-valuemin={inGesto ? 0 : undefined}
          aria-valuemax={inGesto ? 100 : undefined}
          aria-valuenow={inGesto ? percent : undefined}
        >
          {conVideo ? (
            // Fondo nero senza alpha: `screen` lo rende trasparente sul
            // `void` senza chiedere a nessuno di riesportare con l'alpha.
            <div className="absolute inset-0 grid place-items-center">
              <video
                ref={videoRef}
                muted
                playsInline
                preload="auto"
                aria-hidden
                className="pointer-events-none"
                style={{
                  width: size * VIDEO_ZOOM,
                  height: size * VIDEO_ZOOM,
                  mixBlendMode: 'screen',
                  opacity: 0,
                }}
              >
                <source src={VIDEO_SRC_MP4} type="video/mp4" />
                <source src={VIDEO_SRC_WEBM} type="video/webm" />
              </video>
            </div>
          ) : null}

          {/* Nella stessa sessione l'overlay è solo un nero che si dissolve:
              il marchio non ci entra proprio, perché è già in alto a
              sinistra. */}
          {!ritorno || LOADER_REPEAT === 'volo' ? (
            <div
              className="absolute inset-0 grid place-items-center"
              style={{ transform: `translate(${size * MARK_DX}px, ${size * MARK_DY}px)` }}
            >
              <div
                ref={markRef}
                className={`flex ${conVideo ? 'text-crimson' : ''}`}
                style={{ opacity: conVideo ? 0 : 1 }}
              >
                <Mark
                  size={markSize}
                  mode={filled || conVideo ? 'solid' : 'outline'}
                  shackleRef={shackleRef}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {fase === 'volo' && volo ? (
        <div
          ref={voloRef}
          data-volo
          aria-hidden
          className="pointer-events-none fixed z-50 flex text-crimson"
          style={{ left: volo.left, top: volo.top, transformOrigin: 'top left' }}
        >
          <Mark size={volo.size} shackleOffset={volo.chiuso ? SHACKLE_CLOSED : 0} />
        </div>
      ) : null}
    </>
  );
}
