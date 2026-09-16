/**
 * Progresso di caricamento reale e pesato.
 *
 * Non sa niente di React ne' del Loader: e' un contatore condiviso che
 * chiunque puo' far avanzare quando una risorsa e' davvero pronta. Il peso
 * dice quanto conta ogni pezzo — la reel vale meta' del totale perche' e' la
 * cosa che l'utente sta effettivamente aspettando.
 *
 * Niente progressi finti: se una risorsa non arriva, la barra non arriva a
 * fondo e a chiudere il loader e' il tetto dei 2,5 s.
 */
export const LOAD_WEIGHTS = {
  /** I woff2: finche' non ci sono, il sito e' un altro sito. */
  font: 0.1,
  /** Il marchio in linea: non e' una richiesta di rete, e' pronto al mount. */
  mark: 0.05,
  /** Poster della reel: e' l'LCP. */
  poster: 0.15,
  /** Il chunk JS: se questo codice gira, e' arrivato. */
  js: 0.2,
  /** Primo segmento della reel: `canplay` o >= 2 s bufferizzati. */
  reel: 0.5,
} as const;

export type LoadTask = keyof typeof LOAD_WEIGHTS;

/**
 * I tempi della coreografia (`rifinitura-spec.md` §2), in ms.
 *
 * Il tempo lo detta il gesto, non la rete: il progresso è solo un cancello —
 * la staffa non può *precedere* il caricamento, ma può aspettarlo. Il tetto
 * è il momento entro cui l'overlay **ha staccato**: oltre, il volo si vede
 * già sopra la pagina viva.
 */
export const LOADER_TIMING = {
  /** A — i tre path si tracciano, con 80 ms di scarto l'uno dall'altro. */
  draw: 400,
  /** Scarto fra un path e l'altro in A. */
  stagger: 80,
  /** B — la staffa scende, limitata dal progresso. */
  close: 1000,
  /** D — tenuta a lucchetto chiuso, rosso, pieno. */
  hold: 250,
  /** E — il volo verso il marchio del chrome. */
  fly: 500,
  /** Tetto dello stacco con la coreografia disegnata. */
  max: 3000,
  /** Tetto con l'animazione di LockVFX: dura 3,04 s e non si accelera. */
  maxVideo: 3600,
  /** Visita successiva nella sessione. */
  repeat: 300,
} as const;

/** Quanti secondi di buffer contano come "primo segmento". */
export const REEL_FIRST_SEGMENT_S = 2;

const done = new Set<LoadTask>();
const listeners = new Set<(value: number) => void>();

function value(): number {
  let sum = 0;
  for (const task of done) sum += LOAD_WEIGHTS[task];
  return Math.min(1, sum);
}

export const loadProgress = {
  value,
  /** Idempotente: chiamarla due volte non conta due volte. */
  complete(task: LoadTask): void {
    if (done.has(task)) return;
    done.add(task);
    const v = value();
    for (const listener of listeners) listener(v);
  },
  subscribe(listener: (value: number) => void): () => void {
    listeners.add(listener);
    listener(value());
    return () => listeners.delete(listener);
  },
  /** Solo per i test manuali in dev. */
  reset(): void {
    done.clear();
  },
};

/* --------------------------------------------------------------------- */

export function whenFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return document.fonts.ready.then(() => undefined);
}

/** Risolve quando l'immagine e' decodificata, o subito se fallisce: il
 *  loader non deve restare appeso a un asset rotto. */
export function whenImageReady(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
    if (img.complete) resolve();
  });
}

/**
 * Risolve al `canplay` o quando ci sono almeno `seconds` di buffer.
 * Se il video non ha sorgenti (oggi: lo showreel non esiste ancora) non
 * risolve mai da solo — chi chiama completa il task col poster.
 */
export function whenReelReady(
  video: HTMLVideoElement,
  seconds = REEL_FIRST_SEGMENT_S
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const onProgress = () => {
      const b = video.buffered;
      if (b.length && b.end(b.length - 1) >= seconds) finish();
    };
    function cleanup() {
      video.removeEventListener('canplay', finish);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('error', finish);
    }
    video.addEventListener('canplay', finish);
    video.addEventListener('progress', onProgress);
    video.addEventListener('error', finish);
    if (video.readyState >= 3) finish();
  });
}

/* --------------------------------------------------------------------- */

/**
 * Lo stacco: il momento in cui l'overlay se ne va e la pagina si vede.
 *
 * Serve a chi conta il tempo dell'**interfaccia** e non quello del
 * caricamento — l'indizio di scroll aspetta quattro secondi di pagina
 * ferma, e quattro secondi dal mount sarebbero quattro secondi di loader.
 */
let entrati = false;
const attese = new Set<() => void>();

export function segnaEntrata(): void {
  if (entrati) return;
  entrati = true;
  for (const fn of attese) fn();
  attese.clear();
}

/** Chiama `fn` allo stacco, o subito se è già avvenuto. Ritorna la disdetta. */
export function quandoEntrati(fn: () => void): () => void {
  if (entrati) {
    fn();
    return () => undefined;
  }
  attese.add(fn);
  return () => {
    attese.delete(fn);
  };
}

const VISIT_KEY = 'lockvfx:visited';

/** Il loader lungo si vede una volta per sessione, non a ogni navigazione. */
export function isReturningVisit(): boolean {
  try {
    return sessionStorage.getItem(VISIT_KEY) === '1';
  } catch {
    return false;
  }
}

export function markVisited(): void {
  try {
    sessionStorage.setItem(VISIT_KEY, '1');
  } catch {
    /* modalita' privata o storage bloccato: pazienza, si rivede il loader */
  }
}
