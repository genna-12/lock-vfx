import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { useEntrati, useSetVisibile, useStageStatic, useStageWindow } from '../../lib/stageProgress';
import { loadProgress, whenImageReady, whenReelReady } from '../../lib/loadProgress';
import { POSTER_TELEFONO, REEL, REEL_MOBILE, risparmioDati, sorgente } from '../../lib/media';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Il primo set: lo showreel a piena pagina.
 *
 * Nessun testo sopra il video — quello che c'è da dire è dentro al girato.
 * L'unica interfaccia è la linea rossa del tempo, che è reale e scrubbabile,
 * e l'icona dell'audio: due elementi, nessuna etichetta.
 *
 * Lo showreel non esiste ancora. Il componente regge la sua assenza senza
 * fingere: monta le `<source>` solo se `VITE_REEL` dice che il file c'è
 * (default `none`), altrimenti resta il poster fermo e nessun 404. Quando il
 * video arriva bastano i due file in `public/video` e `VITE_REEL=on`.
 */
/**
 * Quale showreel, e in quale versione. Lo decide `lib/media.ts` una volta
 * per visita: dove abitano i file (il sito, come oggi, o R2 quando
 * `VITE_MEDIA_URL` è pieno), quale delle due qualità regge la rete di chi
 * guarda, e — sul telefono — il montaggio verticale invece del 16:9, che in
 * `cover` su uno schermo in piedi mostrerebbe un quarto del fotogramma.
 *
 * Un formato solo, MP4 (`rifinitura-spec.md` §8): il WebM raddoppiava i file
 * da produrre per risparmiare una banda che su R2 è gratis.
 */
const VERTICALE =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const RENDITION = VERTICALE ? REEL_MOBILE : REEL;
/* Il poster segue lo schermo, non il puntatore: quello verticale è per il
   telefono in piedi, e su un iPad coricato in `cover` sarebbe ingrandito
   quasi del doppio. La condizione è quella del preload in `index.html`. */
const POSTER =
  typeof window !== 'undefined' && window.matchMedia(POSTER_TELEFONO).matches
    ? REEL_MOBILE.poster
    : REEL.poster;
const SOURCES = [{ src: sorgente(RENDITION), type: 'video/mp4' }];
const HAS_VIDEO = (import.meta.env.VITE_REEL ?? 'none') !== 'none';

/** Oltre questa progress della carrellata la reel è fuori scena: si mette in
 *  pausa. Il numero è nella tabella di `momento-1` (la reel sparisce a 150vh
 *  su 560 ≈ 0,27). */
const PAUSE_AFTER = 0.27;

export function Reel() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  const videoRef = useRef<HTMLVideoElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [manualPlay, setManualPlay] = useState(false);
  /* L'icona dell'audio non sta sempre lì: si sveglia al primo movimento del
     puntatore sulla reel, con la stessa salita di 16 px dell'HUD della Sala
     (`rifinitura-spec.md` §3). I due schermi del sito si comportano allo
     stesso modo, e la prima schermata resta quello che deve essere: il
     girato, e nient'altro. Chi arriva col tastierino la trova comunque, al
     fuoco. */
  const [audioSveglio, setAudioSveglio] = useState(false);

  // Reduced motion o risparmio dati: il poster resta fermo e il video parte
  // solo se lo si chiede. Sono due utenti diversi con lo stesso bisogno.
  const [lightMode] = useState(risparmioDati);
  // Senza showreel non c'e' niente da far partire: il poster e' gia' tutto
  // quello che c'e', e un pulsante che non fa nulla e' peggio di nessun
  // pulsante.
  const still = HAS_VIDEO && (reduce || lightMode) && !manualPlay;
  // La reel è in scena fino a quando la camera non l'ha lasciata indietro.
  // La progress la dà lo Stage: qui non si crea un secondo trigger.
  const inFinestra = useStageWindow(-1, PAUSE_AFTER);
  // Senza carrellata la reel non è più uno schermo a piena pagina: è la
  // prima sezione di una pagina che scorre. Lì è in scena quando è a
  // schermo, e solo dopo il loader (QA, D11).
  const flat = useStageStatic();
  const visibile = useSetVisibile('reel');
  const entrati = useEntrati();
  const inScene = flat ? visibile && entrati : inFinestra;
  // Una pausa data col tap resta: rientrando nella sezione il video non
  // riparte da solo contro la volontà di chi l'ha fermato.
  const pausaVolutaRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [segno, setSegno] = useState<'play' | 'pause' | null>(null);
  const segnoTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(segnoTimer.current), []);

  /* ---- progresso di caricamento --------------------------------------- */
  useEffect(() => {
    let alive = true;
    void whenImageReady(POSTER).then(() => {
      if (!alive) return;
      loadProgress.complete('poster');
      // Senza sorgenti non c'è nessun "primo segmento" da aspettare: il
      // poster È la reel, per ora.
      if (!HAS_VIDEO) loadProgress.complete('reel');
    });
    const video = videoRef.current;
    if (HAS_VIDEO && video) {
      void whenReelReady(video).then(() => {
        if (alive) loadProgress.complete('reel');
      });
    }
    return () => {
      alive = false;
    };
  }, []);

  /* ---- pausa fuori dall'HOLD ------------------------------------------ */
  useEffect(() => {
    const video = videoRef.current;
    if (!HAS_VIDEO || !video || still) return;

    // Fuori scena il girato si ferma: un video che continua a girare dietro
    // a un altro set è lavoro della GPU per niente.
    if (inScene) {
      if (video.paused && !pausaVolutaRef.current) void video.play().catch(() => undefined);
    } else if (!video.paused) {
      video.pause();
    }
  }, [still, inScene]);

  /* ---- linea del tempo ------------------------------------------------ */
  useEffect(() => {
    const video = videoRef.current;
    const fill = fillRef.current;
    if (!HAS_VIDEO || !video || !fill) return;
    // Un tick di GSAP invece di `timeupdate`: quello scatta 4 volte al
    // secondo e la linea si vedrebbe muovere a gradini.
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

  /** Il tap sul video, nella pagina semplice: pausa e riprendi (§5). Con
   *  reduced motion o il risparmio dati è anche l'unico modo di farlo
   *  partire, e basta: nessun pulsante in più (QA, D12). */
  const tapSulVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const inPausa = video.paused;
    pausaVolutaRef.current = !inPausa;
    if (inPausa) {
      setManualPlay(true);
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
    setSegno(inPausa ? 'play' : 'pause');
    window.clearTimeout(segnoTimer.current);
    segnoTimer.current = window.setTimeout(() => setSegno(null), 700);
  }, []);

  const toggleAudio = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
  }, []);

  /* ---- la prima schermata, quando non c'è la carrellata ----------------
     Pieno schermo e nient'altro (`mobile-semplice-spec.md` §2.1). Non un
     riquadro con la frase sotto: l'immagine riempie la sezione, e sopra non
     c'è **nessun testo**. A schermo restano tre cose sole — il marchio in
     alto a sinistra, la lingua in alto a destra, la nav in basso.

     L'`h1` resta, invisibile: è l'unico posto in cui la pagina dice cosa fa,
     e lo dice ai motori e agli screen reader, non agli occhi. Niente
     controlli del browser sopra il video, che sarebbero l'unica cosa scritta
     sullo schermo; il video, se c'è, parte da solo — muto, in loop, dopo il
     loader e solo finché è a schermo — e sta fermo se è stato chiesto meno
     movimento o di risparmiare dati. Un tap lo mette in pausa e lo
     riprende, ed è anche il modo di farlo partire quando sta fermo.

     È l'unica sezione la cui altezza non viene dal contenuto: una schermata
     piena, sempre. */
  if (flat) {
    return (
      <>
        <h1 className="u-sr-only">{t('reel.h1')}</h1>
        <div className="relative h-[100lvh] w-full overflow-hidden bg-void">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            poster={POSTER}
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            aria-hidden
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            {HAS_VIDEO ? SOURCES.map((s) => <source key={s.src} src={s.src} type={s.type} />) : null}
          </video>
          {HAS_VIDEO ? (
            <button
              type="button"
              onClick={tapSulVideo}
              aria-label={t(playing ? 'sala.pause' : 'sala.play')}
              className="absolute inset-0 grid place-items-center"
            >
              <span
                aria-hidden
                className="grid h-14 w-14 place-items-center rounded-full bg-void/60 text-ink transition-opacity duration-[var(--f5)]"
                style={{ opacity: segno ? 1 : 0 }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {segno === 'pause' ? <path d="M9 5v14M15 5v14" /> : <path d="M7 4l13 8-13 8V4z" />}
                </svg>
              </span>
            </button>
          ) : null}
        </div>
      </>
    );
  }

  // Niente `overflow` sul contenitore: sta dentro `.world` e appiattirebbe il
  // preserve-3d (la regola è in globals.css). Il video lo taglia `object-cover`.
  return (
    <>
      {/* L'h1 della pagina sta FUORI dal blocco che diventa `inert`: il
          titolo del sito non deve sparire dall'albero di accessibilita'
          quando la camera lascia la reel. */}
      <h1 className="u-sr-only">{t('reel.h1')}</h1>

      {/* Come la sala e la stanza: fuori scena i controlli escono dal giro
          del Tab, altrimenti si arriva col tastierino sul play di un set
          alle spalle della camera. */}
      <div
        className="absolute inset-0 bg-void"
        inert={!inScene}
        onPointerMove={() => setAudioSveglio(true)}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover [object-position:50%_50%]"
          poster={POSTER}
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
          aria-hidden
        >
          {HAS_VIDEO ? SOURCES.map((s) => <source key={s.src} src={s.src} type={s.type} />) : null}
        </video>

        {still ? (
          <button
            type="button"
            onClick={() => setManualPlay(true)}
            className="u-cap absolute inset-0 grid place-items-center text-ink"
          >
            <span className="rounded-frame border border-dust/50 bg-void/60 px-5 py-3">
              {t('reel.play')}
            </span>
          </button>
        ) : null}

        {/* Audio: un'icona sola, in basso a destra, area di tocco 44. */}
        {HAS_VIDEO && !still ? (
          <button
            type="button"
            onClick={toggleAudio}
            onFocus={() => setAudioSveglio(true)}
            aria-pressed={!muted}
            aria-label={t(muted ? 'reel.audioOn' : 'reel.audioOff')}
            className="absolute right-[var(--pad)] bottom-8 grid h-11 w-11 place-items-center text-ink/80 transition-colors duration-200 hover:text-ink"
            style={{
              opacity: audioSveglio ? 1 : 0,
              transform: audioSveglio ? 'none' : 'translateY(16px)',
              pointerEvents: audioSveglio ? 'auto' : 'none',
              transition: 'opacity var(--f5) linear, transform var(--f5) var(--ease-arrive)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
              <path d="M4 9v6h3.5L13 19V5L7.5 9H4z" />
              {muted ? (
                <path d="M17 9.5l4 5m0-5l-4 5" />
              ) : (
                <>
                  <path d="M16.5 8.8a4.2 4.2 0 0 1 0 6.4" />
                  <path d="M19 6.5a7.5 7.5 0 0 1 0 11" />
                </>
              )}
            </svg>
          </button>
        ) : null}

        {/* La linea del tempo: 1 px visibile, 22 px cliccabili. */}
        <div
          onClick={scrub}
          role="presentation"
          className="absolute inset-x-0 bottom-0 flex h-[22px] items-end"
          style={{ cursor: HAS_VIDEO ? 'pointer' : 'default' }}
        >
          <div className="h-px w-full bg-dust/40">
            <div ref={fillRef} className="h-px w-0 bg-crimson" />
          </div>
        </div>
      </div>
    </>
  );
}
