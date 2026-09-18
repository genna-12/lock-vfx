import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { COLORS, LOADER_REPEAT, LOADER_SOURCE, MOTION } from '../brand/tokens';
import { EASE } from '../lib/ease';
import {
  LOADER_TIMING,
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
 * Il caricamento è il lucchetto che si chiude, e poi va al suo posto.
 *
 * Il caricamento vero dura un decimo di secondo: se il gesto seguisse la
 * rete sarebbe un tic. Quindi il tempo lo detta una **coreografia**
 * (`rifinitura-spec.md` §2) e il progresso fa solo da cancello — la staffa
 * non può precedere il caricamento, ma può aspettarlo.
 *
 *   A · 0–400    i tre path si tracciano: corpo, serratura, staffa, 80 ms di
 *                scarto. Il lucchetto appare **aperto**, come nel logo.
 *   B · 400–1400 la staffa scende fino a 22 su 25 su una `power2.inOut`,
 *                limitata dal progresso: `y = min(curva(t), progresso) · 22`.
 *   C ·         gli ultimi 3 in `f2` lineare; nello stesso fotogramma il
 *                marchio diventa pieno e `crimson`, e **resta rosso**.
 *   D · +250     fermo. Si vede il lucchetto chiuso, rosso, pieno.
 *   E · 500      l'overlay stacca — sotto appare la reel — e il marchio rosso
 *                vola, rimpicciolendo, fino al marchio del chrome, passando
 *                da `crimson` a `ink`. È il gesto che dice: «il lucchetto è
 *                quello lassù».
 *
 * Con `LOADER_SOURCE = 'video'` le fasi A–C sono l'animazione di LockVFX e
 * il sito riprende da D. Dove il webm non si riproduce si torna a `drawn`:
 * la riserva non è un ripiego, è la stessa coreografia.
 *
 * Il fotogramma rosso e lo stacco stanno su `setTimeout`, non sul
 * `gsap.ticker`: sono le due cose che DEVONO succedere, e in una scheda in
 * secondo piano il ticker è fermo.
 */

/** Quanto è alto il marchio nell'overlay. */
const SIZE = 132;
const SIZE_MOBILE = 96;

/** Fine della fase B: gli ultimi 3 li fa lo scatto. */
const SHACKLE_B = SHACKLE_CLOSED - 3;

/**
 * Nella terza esportazione (65466d9) il lucchetto è già ritagliato e occupa
 * circa l'80% dell'altezza del fotogramma: per vederlo alla misura del
 * marchio (132px) basta disegnare il video 1,25 volte `size` (~165px). Il
 * fondo resta nero senza alpha, quindi il poco che avanza sparisce con
 * `screen`.
 */
const VIDEO_ZOOM = 1.25;

const BASE = import.meta.env.BASE_URL;
/**
 * Due file, come due `<source>`: `logo.webm` (VP9, con una traccia audio
 * muta) per chi lo apre, `logo.mp4` (H.264) per Safari/iPhone, che il webm
 * non lo riproduce. Il browser sceglie da solo la prima che sa aprire.
 */
const VIDEO_SRC_WEBM = `${BASE}loader/logo.webm`;
const VIDEO_SRC_MP4 = `${BASE}loader/logo.mp4`;

/** Uno dei due formati si riproduce? Se no, la coreografia disegnata. */
function videoRiproducibile(): boolean {
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('video');
  return (
    probe.canPlayType('video/webm; codecs="vp9"') !== '' ||
    probe.canPlayType('video/mp4; codecs="avc1.42E01E"') !== ''
  );
}

type Fase = 'gesto' | 'volo' | 'fine';
type Volo = { left: number; top: number; size: number; scale: number; dx: number; dy: number };

export function Loader({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [fase, setFase] = useState<Fase>('gesto');
  const [percent, setPercent] = useState(0);
  // Il riempimento è l'ultimo fotogramma del gesto, non uno stato del
  // caricamento: nasce falso e diventa vero una volta sola, alla chiusura.
  const [filled, setFilled] = useState(false);
  // Con il video, il marchio disegnato entra in scena solo alla fine: prima
  // c'è l'animazione di LockVFX, e due lucchetti sono due lucchetti.
  const [sorgente] = useState<'drawn' | 'video'>(() =>
    LOADER_SOURCE === 'video' && videoRiproducibile() ? 'video' : 'drawn'
  );
  const [videoInScena, setVideoInScena] = useState(sorgente === 'video');
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

  /* ---- il gesto: A–C (o il video), poi D e lo stacco ------------------- */
  useEffect(() => {
    const overlay = overlayRef.current;
    const shackle = shackleRef.current;
    if (!overlay || !shackle) return;

    const chrome = document.querySelector<HTMLElement>('[data-chrome-mark]');
    // Finché il marchio non è arrivato lassù, lassù non c'è niente.
    if (chrome) chrome.style.visibility = 'hidden';
    const accendiChrome = () => {
      if (chrome) chrome.style.removeProperty('visibility');
    };

    const short = reduce || isReturningVisit();
    const timers: number[] = [];
    const attesa = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    let via = false;
    /** E — lo stacco e il volo. Da qui in poi l'overlay non c'è più. */
    const stacca = (conVolo: boolean) => {
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
        size,
        scale: arrivo.height / partenza.height,
        dx: arrivo.left - partenza.left,
        dy: arrivo.top - partenza.top,
      });
      setFase('volo');
    };

    const ctx = gsap.context(() => {
      /* ---- seconda visita, o meno movimento --------------------------
         Il gesto lo si è già visto: marchio chiuso e pieno, e via. Con
         `LOADER_REPEAT = 'volo'` resta solo il volo. Reduced motion non
         vola mai. */
      if (short) {
        gsap.set(shackle, { y: SHACKLE_CLOSED });
        setVideoInScena(false);
        setFilled(true);
        setPercent(100);
        if (markRef.current) markRef.current.style.color = COLORS.crimson;
        const vola = !reduce && LOADER_REPEAT === 'volo';
        attesa(() => stacca(vola), vola ? 0 : LOADER_TIMING.repeat);
        return;
      }

      const unsubscribe = loadProgress.subscribe((value) => setPercent(Math.round(value * 100)));

      /** C — lo scatto, il fotogramma rosso, la tenuta, lo stacco. */
      let scattato = false;
      const scatta = () => {
        if (scattato) return;
        scattato = true;
        gsap.to(shackle, { y: SHACKLE_CLOSED, duration: MOTION.f2 / 1000, ease: EASE.cut });
        attesa(() => {
          // Chiuso: nello stesso fotogramma il marchio si riempie e diventa
          // rosso. Resta rosso fino all'arrivo lassù.
          setVideoInScena(false);
          setFilled(true);
          if (markRef.current) markRef.current.style.color = COLORS.crimson;
          attesa(() => stacca(true), LOADER_TIMING.hold);
        }, MOTION.f2);
      };

      const tetto = sorgente === 'video' ? LOADER_TIMING.maxVideo : LOADER_TIMING.max;
      // Il tetto non può vivere sul rAF: in una scheda in secondo piano il
      // ticker è fermo e il loader non staccherebbe mai. È il momento entro
      // cui l'overlay se ne va, qualunque cosa sia successa.
      attesa(() => {
        gsap.set(shackle, { y: SHACKLE_CLOSED });
        setVideoInScena(false);
        setFilled(true);
        if (markRef.current) markRef.current.style.color = COLORS.crimson;
        stacca(true);
      }, tetto);

      /* ---- l'animazione di LockVFX ---------------------------------- */
      if (sorgente === 'video') {
        const video = videoRef.current;
        gsap.set(shackle, { y: SHACKLE_CLOSED });
        // Finita l'animazione, il cancello: se il caricamento non è ancora
        // finito si aspetta lì, a lucchetto chiuso, come faceva la staffa.
        const finita = () => {
          if (loadProgress.value() >= 1) {
            scatta();
            return;
          }
          const stop = loadProgress.subscribe((v) => {
            if (v < 1) return;
            stop();
            scatta();
          });
        };
        video?.addEventListener('ended', finita);
        // Se il file non parte (rete, codec, autoplay negato) non si resta a
        // guardare un rettangolo nero: si chiude subito il gesto.
        video?.addEventListener('error', finita);
        void video?.play().catch(finita);
        return () => {
          unsubscribe();
          video?.removeEventListener('ended', finita);
          video?.removeEventListener('error', finita);
        };
      }

      /* ---- A — i tre path si tracciano ------------------------------- */
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
              // Tolta la maschera: da qui in poi il tratto è un tratto, e la
              // staffa può scendere senza portarsi dietro i trattini.
              p.style.removeProperty('stroke-dasharray');
              p.style.removeProperty('stroke-dashoffset');
            },
          }
        );
      });

      /* ---- B — la staffa scende, limitata dal progresso --------------- */
      const curva = gsap.parseEase('power2.inOut');
      const inizio = performance.now();
      // Il cancello non salta: insegue il progresso vero invece di copiarlo,
      // così i cinque task non si leggono come cinque scalini.
      let cancello = loadProgress.value();
      const passo = () => {
        const vero = loadProgress.value();
        cancello += (vero - cancello) * 0.12;
        const t = (performance.now() - inizio - LOADER_TIMING.draw) / LOADER_TIMING.close;
        const q = t <= 0 ? 0 : curva(Math.min(1, t));
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
  }, [reduce, size, sorgente]);

  /* ---- E — il volo ----------------------------------------------------- */
  useEffect(() => {
    const nodo = voloRef.current;
    if (fase !== 'volo' || !volo || !nodo) return;
    const chrome = document.querySelector<HTMLElement>('[data-chrome-mark]');
    const tween = gsap.to(nodo, {
      x: volo.dx,
      y: volo.dy,
      scale: volo.scale,
      color: COLORS.ink,
      duration: LOADER_TIMING.fly / 1000,
      ease: EASE.arrive,
      onComplete: () => {
        // Nello stesso fotogramma: quello lassù si accende, questo sparisce.
        if (chrome) chrome.style.removeProperty('visibility');
        nodo.style.visibility = 'hidden';
        setFase('fine');
      },
    });
    return () => {
      tween.kill();
    };
  }, [fase, volo]);

  return (
    <>
      {children}

      {fase === 'gesto' ? (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-void text-ink"
          role="progressbar"
          aria-label={t('loader.label')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          {sorgente === 'video' ? (
            // Fondo nero senza alpha: `screen` lo rende trasparente sul
            // `void` senza chiedere a nessuno di riesportare con l'alpha.
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                width: size * VIDEO_ZOOM,
                height: size * VIDEO_ZOOM,
                mixBlendMode: 'screen',
                visibility: videoInScena ? 'visible' : 'hidden',
              }}
            >
              <source src={VIDEO_SRC_WEBM} type="video/webm" />
              <source src={VIDEO_SRC_MP4} type="video/mp4" />
            </video>
          ) : null}
          <div ref={markRef} style={{ visibility: videoInScena ? 'hidden' : 'visible' }}>
            <Mark size={size} mode={filled ? 'solid' : 'outline'} shackleRef={shackleRef} />
          </div>
        </div>
      ) : null}

      {fase === 'volo' && volo ? (
        <div
          ref={voloRef}
          data-volo
          aria-hidden
          className="pointer-events-none fixed z-50 text-crimson"
          style={{ left: volo.left, top: volo.top, transformOrigin: 'top left' }}
        >
          <Mark size={volo.size} mode="solid" shackleOffset={SHACKLE_CLOSED} />
        </div>
      ) : null}
    </>
  );
}
