import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { useStageStatic, useStageWindow } from '../../lib/stageProgress';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { WORKS_HAVE_VIDEO, type Work } from '../../data/works';
import { Deck, type DeckHandle } from './Deck';

/**
 * La sala di proiezione.
 *
 * A riposo c'è solo il video e la linea rossa del tempo: nient'altro. Al
 * primo movimento del puntatore sale l'HUD — deck, didascalia, controlli —
 * e dopo due seconi e mezzo di immobilità se ne va. La cosa grande della
 * sala è il film, non l'interfaccia.
 *
 * Un solo `<video>` per tutti i lavori: cambiare lavoro è cambiare sorgente
 * dietro due fotogrammi di nero, come uno stacco di montaggio. Mai
 * dissolvenze.
 *
 * I breakdown non esistono ancora: senza `VITE_WORKS` non si monta nessuna
 * `<source>` e resta il poster, senza 404 e senza finzioni.
 */
type SalaProps = {
  works: Work[];
};

/** Il video vive solo dentro l'HOLD 3 della carrellata. */
const HOLD = { from: 0.55, to: 0.88 } as const;
/** Immobilità dopo la quale l'HUD se ne va. */
const AWAKE_MS = 2500;
/** Un fotogramma a 24 fps: la durata del nero fra due lavori. */
const FRAME_MS = 83;
/** Dodici fotogrammi di nero alla fine di un video. */
const END_BLACK_MS = 500;

export function Sala({ works }: SalaProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<DeckHandle>(null);
  const awakeTimer = useRef<number | undefined>(undefined);
  // Mentre la mano tiene una card l'HUD non se ne va, anche se la mano si
  // ferma: sparire a metà gesto è come spegnere la luce mentre si sfoglia.
  const draggingRef = useRef(false);
  // Specchi per gli effetti che non devono rieseguirsi quando questi valori
  // cambiano (il caricamento del video, per esempio).
  const inHoldRef = useRef(false);
  const reducedRef = useRef(false);

  const [index, setIndex] = useState(0);
  const [awake, setAwake] = useState(false);
  // Dentro il suo HOLD o no: lo dice lo Stage, che la progress ce l'ha già.
  const inHold = useStageWindow(HOLD.from, HOLD.to);
  // Senza carrellata la sala non è una sala: è una sezione di pagina con un
  // riquadro e l'elenco dei lavori (`rifinitura-spec.md` §6.4.3 e §6.4.4).
  const flat = useStageStatic();
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [compact, setCompact] = useState(false);

  const work = works[index];

  /* ---- forma dello schermo -------------------------------------------- */
  useEffect(() => {
    const isPortrait = window.matchMedia('(max-width: 767px) and (orientation: portrait)');
    // Telefono, in piedi o girato: un telefono in orizzontale è largo ma
    // basso, e la deck deve restare quella piccola.
    const isCompact = window.matchMedia('(max-width: 767px), (max-height: 500px)');
    const sync = () => {
      setPortrait(isPortrait.matches);
      setCompact(isCompact.matches);
    };
    sync();
    isPortrait.addEventListener('change', sync);
    isCompact.addEventListener('change', sync);
    return () => {
      isPortrait.removeEventListener('change', sync);
      isCompact.removeEventListener('change', sync);
    };
  }, []);

  /* ---- l'HUD si sveglia al movimento ---------------------------------- */
  const wake = useCallback(() => {
    setAwake(true);
    window.clearTimeout(awakeTimer.current);
    const sleep = () => {
      if (draggingRef.current) {
        // Ancora in mano: si riprova più tardi, non si spegne.
        awakeTimer.current = window.setTimeout(sleep, AWAKE_MS);
        return;
      }
      setAwake(false);
    };
    awakeTimer.current = window.setTimeout(sleep, AWAKE_MS);
  }, []);

  const onDeckDrag = useCallback(
    (active: boolean) => {
      draggingRef.current = active;
      wake();
    },
    [wake]
  );

  useEffect(() => () => window.clearTimeout(awakeTimer.current), []);

  // In verticale su telefono l'HUD non si nasconde: lì è impaginazione, non
  // un velo che copre il film.
  const hudVisible = portrait || reduced || awake;

  // Fuori dall'HOLD il video si ferma e l'HUD sparisce: durante T2 e T3 la
  // sala è un oggetto che si muove nello spazio, non un player.
  useEffect(() => {
    const video = videoRef.current;
    if (!inHold) {
      if (video && !video.paused) video.pause();
      // Lo stato si azzera dal callback del timer, non dal corpo
      // dell'effetto: React vuole che gli effetti parlino verso l'esterno,
      // non che rimettano mano allo stato appena renderizzato.
      window.clearTimeout(awakeTimer.current);
      awakeTimer.current = window.setTimeout(() => setAwake(false), 0);
      return;
    }
    if (!WORKS_HAVE_VIDEO || reduced || !video) return;
    void video.play().catch(() => undefined);
  }, [inHold, reduced]);

  /* ---- linea del tempo ------------------------------------------------ */
  useEffect(() => {
    const video = videoRef.current;
    const fill = fillRef.current;
    if (!video || !fill) return;
    const tick = () => {
      const d = video.duration;
      fill.style.width = d > 0 ? `${(video.currentTime / d) * 100}%` : '0%';
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  const scrub = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !(video.duration > 0)) return;
    const box = event.currentTarget.getBoundingClientRect();
    video.currentTime = ((event.clientX - box.left) / box.width) * video.duration;
  }, []);

  /* ---- cambio lavoro: due fotogrammi di nero --------------------------- */
  const commit = useCallback(
    (next: number) => {
      const black = blackRef.current;
      if (next === index) {
        // Con un solo lavoro pubblicato l'anello torna sullo stesso indice:
        // `onEnded` ha gia' acceso il nero e nessuno lo spegnerebbe piu'.
        // Qui il film riparte da capo dietro al nero, poi il nero se ne va.
        if (black && black.style.opacity === '1') {
          const video = videoRef.current;
          if (video) {
            video.currentTime = 0;
            if (inHoldRef.current && WORKS_HAVE_VIDEO && !reducedRef.current) {
              void video.play().catch(() => undefined);
            }
          }
          if (fillRef.current) fillRef.current.style.width = '0%';
          black.style.opacity = '0';
        }
        return;
      }
      if (reduced || !black) {
        setIndex(next);
        return;
      }
      // Due fotogrammi di nero con `setTimeout` e non con una timeline di
      // GSAP: il ticker si ferma quando la scheda va in secondo piano, e uno
      // stacco che resta a metà lascerebbe lo schermo nero. Qui il nero è
      // portante, non decorativo.
      black.style.opacity = '1';
      window.setTimeout(() => {
        setIndex(next);
        window.setTimeout(() => {
          black.style.opacity = '0';
        }, FRAME_MS);
      }, FRAME_MS);
    },
    [index, reduced]
  );

  useEffect(() => {
    inHoldRef.current = inHold;
    reducedRef.current = reduced;
  }, [inHold, reduced]);

  // Solo il cambio di lavoro ricarica la sorgente. Entrare e uscire
  // dall'HOLD mette in pausa e riprende: non riavvolge il film.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    if (fillRef.current) fillRef.current.style.width = '0%';
    if (inHoldRef.current && WORKS_HAVE_VIDEO && !reducedRef.current) {
      void video.play().catch(() => undefined);
    }
  }, [index]);

  /* ---- controlli ------------------------------------------------------- */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
    wake();
  }, [wake]);

  const toggleAudio = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    wake();
  }, [wake]);

  /**
   * Schermo intero.
   *
   * Su un telefono è quello del **telefono**: il player nativo ruota da
   * solo, ha i suoi comandi, la sua barra e uno schermo intero vero — e su
   * iOS è anche l'unico possibile, perché lì lo schermo intero si concede
   * al `<video>` e mai a un `div`. Prima chiedevamo il pieno schermo al
   * contenitore e poi provavamo a bloccare l'orientamento: su iPhone non ha
   * mai funzionato, e chiedere di girare il telefono per dare in cambio una
   * pagina che non torna è la peggiore delle due cose (`rifinitura-spec.md`
   * §6.4).
   *
   * Su desktop resta il pieno schermo del contenitore: lì il riquadro con
   * l'HUD del sito è meglio del player di sistema.
   */
  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (touch) {
      if (!video) return;
      const native = video as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
        webkitSupportsFullscreen?: boolean;
      };
      // I comandi sono del telefono, e solo lì dentro: al ritorno la sala
      // torna a essere la sala.
      video.controls = true;
      if (video.requestFullscreen) {
        void video.requestFullscreen().catch(() => {
          video.controls = false;
        });
      } else if (native.webkitSupportsFullscreen && native.webkitEnterFullscreen) {
        native.webkitEnterFullscreen();
      } else {
        video.controls = false;
      }
      wake();
      return;
    }

    if (!root) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    void root.requestFullscreen().catch(() => undefined);
    wake();
  }, [wake]);

  /* ---- ritorno dal player nativo --------------------------------------
     `webkitendfullscreen` è l'unico segnale che dà iOS quando si esce dal
     suo player; altrove basta `fullscreenchange`. In tutti e due i casi i
     comandi nativi si spengono: fuori dal player comandano la linea del
     tempo e l'HUD. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const off = () => {
      if (!document.fullscreenElement) video.controls = false;
    };
    video.addEventListener('webkitendfullscreen', off);
    document.addEventListener('fullscreenchange', off);
    return () => {
      video.removeEventListener('webkitendfullscreen', off);
      document.removeEventListener('fullscreenchange', off);
    };
  }, []);

  /* ---- tastiera -------------------------------------------------------- */
  useEffect(() => {
    if (!inHold) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          deckRef.current?.step(1);
          wake();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          deckRef.current?.step(-1);
          wake();
          break;
        case ' ':
          event.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          toggleAudio();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inHold, toggleAudio, toggleFullscreen, togglePlay, wake]);

  /* ---- fine video: gira l'anello --------------------------------------- */
  const onEnded = useCallback(() => {
    // Il nero comincia subito: dodici fotogrammi di buio, non dodici
    // fotogrammi dell'ultimo fotogramma congelato.
    const black = blackRef.current;
    if (black && !reducedRef.current) black.style.opacity = '1';
    window.setTimeout(() => deckRef.current?.step(1), END_BLACK_MS);
  }, []);

  const context = [work.client, String(work.year), ...work.disciplines].join(' · ');

  /* ---- la pagina, quando non c'è la carrellata -------------------------
     La deck coverflow è un oggetto della carrellata: vive di profondità e di
     trascinamento, e in una pagina che scorre non ha senso. Qui i lavori
     sono tre righe — poster, titolo, ruolo — e il riquadro in alto mostra
     quello scelto. Il pulsante di riproduzione apre il player: sul telefono
     è quello nativo (M4), su desktop il pieno schermo del riquadro. */
  if (flat) {
    return (
      <div ref={rootRef} className="u-pad mx-auto flex w-full max-w-[1180px] flex-col gap-7">
        <div className="relative aspect-video w-full overflow-hidden rounded-frame bg-void">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={work.poster}
            muted
            loop={false}
            playsInline
            preload="metadata"
            aria-label={work.title}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <button
            type="button"
            onClick={() => {
              const video = videoRef.current;
              if (video && WORKS_HAVE_VIDEO) void video.play().catch(() => undefined);
              toggleFullscreen();
            }}
            aria-label={t('sala.play')}
            className="u-cap absolute inset-0 grid place-items-center text-ink"
          >
            <span className="rounded-frame border border-dust/50 bg-void/60 px-5 py-3">
              {t('sala.play')}
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="u-display m-0 text-[clamp(20px,2vw,26px)] text-ink">{work.title}</h2>
          <p className="m-0 text-t4 text-stone">{context}</p>
        </div>

        {works.length > 1 ? (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {works.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => commit(i)}
                  aria-current={i === index || undefined}
                  className={`flex w-full items-center gap-4 text-left transition-opacity duration-[var(--f5)] ${
                    i === index ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={item.poster}
                    alt=""
                    className="aspect-video w-[108px] shrink-0 rounded-[4px] object-cover"
                  />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[15px] text-ink">{item.title}</span>
                    <span className="text-t4 text-stone">{item.disciplines.join(' · ')}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      // Fuori dalla sua finestra la sala esce anche dal giro del Tab: il
      // puntatore lo ferma già lo Stage, ma un `pointer-events: none` non
      // ferma la tastiera, e chi naviga a tastiera si troverebbe dentro un
      // set che non sta guardando.
      inert={!inHold}
      className={`absolute inset-0 bg-void ${portrait ? 'flex flex-col' : ''}`}
      onPointerMove={portrait ? undefined : wake}
      onPointerDown={portrait ? undefined : wake}
      onTouchStart={portrait ? undefined : wake}
    >
      {/* Lo schermo. In verticale non è più a piena pagina: è un 16:9 in alto,
          e sotto ci sta l'impaginazione. */}
      <div
        className={
          portrait
            // `min-h-0`: senza, il minimo automatico dei flex item gonfia il
            // riquadro e il 16:9 non è più un 16:9.
            ? 'relative mt-[76px] aspect-video w-full min-h-0 shrink-0'
            : 'absolute inset-0'
        }
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={work.poster}
          muted
          loop={false}
          playsInline
          preload="metadata"
          tabIndex={-1}
          aria-label={work.title}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
        >
          {WORKS_HAVE_VIDEO ? (
            <>
              {work.video.webm ? <source src={work.video.webm} type="video/webm" /> : null}
              <source src={work.video.mp4} type="video/mp4" />
            </>
          ) : null}
        </video>

        {/* Lo stacco fra due lavori. */}
        <div ref={blackRef} aria-hidden className="pointer-events-none absolute inset-0 bg-void opacity-0" />

        {/* La linea del tempo: 1 px visibile, 22 px cliccabili. Sempre. */}
        <div
          onClick={scrub}
          role="presentation"
          className="absolute inset-x-0 bottom-0 flex h-[22px] items-end"
          style={{ cursor: WORKS_HAVE_VIDEO ? 'pointer' : 'default' }}
        >
          <div className="h-px w-full bg-dust/40">
            <div ref={fillRef} className="h-px w-0 bg-crimson" />
          </div>
        </div>

      </div>

      {/* Il velo che rende leggibile l'HUD. Solo quando l'HUD c'è. */}
      {!portrait ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] transition-opacity"
          style={{
            background: 'linear-gradient(to top, rgb(2 2 2 / 0.82), rgb(2 2 2 / 0))',
            opacity: hudVisible ? 1 : 0,
            transitionDuration: 'var(--f5)',
          }}
        />
      ) : null}

      {/* HUD: deck e didascalia, centrati e modesti. */}
      <div
        className={
          portrait
            ? 'u-pad flex flex-col gap-5 pt-6'
            : 'u-pad absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-10'
        }
        style={
          portrait
            ? undefined
            : {
                opacity: hudVisible ? 1 : 0,
                transform: hudVisible ? 'none' : 'translateY(16px)',
                pointerEvents: hudVisible ? 'auto' : 'none',
                transition: `opacity var(--f5) linear, transform var(--f5) var(--ease-arrive)`,
              }
        }
      >
        {/* In orizzontale la didascalia sta sotto la deck, in verticale sopra:
            lì la deck è impaginazione, non un velo sopra il film. */}
        <div
          className={
            portrait
              ? 'order-1 flex flex-col gap-1'
              : 'order-2 flex flex-col items-center gap-1'
          }
        >
          {/* Con Outfit il titolo di un lavoro non e' piu' display: a 18 px il
              peso 300 si sgrana sul video. E' un nome, e i nomi sono 500. */}
          <h2
            className={`font-medium text-ink ${
              portrait ? 'text-[18px]' : 'text-[clamp(17px,1.4vw,20px)]'
            }`}
          >
            {work.title}
          </h2>
          <p className={`text-t4 text-stone ${portrait ? '' : 'text-center'}`}>
            {context}
            {work.fullUrl ? (
              <>
                {' · '}
                <a
                  href={work.fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline-offset-4 hover:underline"
                >
                  {t('sala.full')}
                </a>
              </>
            ) : null}
          </p>
        </div>

        <Deck
          ref={deckRef}
          works={works}
          index={index}
          onCommit={commit}
          onWake={wake}
          onDrag={onDeckDrag}
          interceptWheel={inHold && !portrait}
          reduced={reduced}
          compact={compact}
          className={portrait ? 'order-2' : 'order-1'}
        />
      </div>

      {/* Controlli: in basso a destra, icone da 20 in area da 40. */}
      <div
        className={
          portrait
            ? 'u-pad flex justify-end gap-1 pt-2'
            : 'absolute right-[var(--pad)] bottom-10 flex gap-1'
        }
        style={
          portrait
            ? undefined
            : {
                opacity: hudVisible ? 1 : 0,
                pointerEvents: hudVisible ? 'auto' : 'none',
                transition: 'opacity var(--f5) linear',
              }
        }
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={t(playing ? 'sala.pause' : 'sala.play')}
          aria-pressed={playing}
          className="grid h-10 w-10 place-items-center text-ink/80 transition-colors duration-200 hover:text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {playing ? <path d="M9 5v14M15 5v14" /> : <path d="M7 4l13 8-13 8V4z" />}
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleAudio}
          aria-label={t(muted ? 'sala.audioOn' : 'sala.audioOff')}
          aria-pressed={!muted}
          className="grid h-10 w-10 place-items-center text-ink/80 transition-colors duration-200 hover:text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 9v6h3.5L13 19V5L7.5 9H4z" />
            {muted ? <path d="M17 9.5l4 5m0-5l-4 5" /> : <path d="M16.5 8.8a4.2 4.2 0 0 1 0 6.4M19 6.5a7.5 7.5 0 0 1 0 11" />}
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={t('sala.fullscreen')}
          className="grid h-10 w-10 place-items-center text-ink/80 transition-colors duration-200 hover:text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
