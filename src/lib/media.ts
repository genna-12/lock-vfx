/// <reference types="vite/client" />

/**
 * Dove stanno i video, e quale versione scaricare.
 *
 * La decisione è in `rifinitura-spec.md` §8 e i nomi dei file in
 * `deploy-e-anteprima.md` («R2 per i video», punto 2). In breve: il peso di
 * un file non è più un costo — su R2 la banda in uscita è gratis — e ciò che
 * conta è il **bitrate** e **quando** parte il download. Quindi due versioni
 * per ogni video, non dieci, e il sito ne sceglie una sola volta per visita:
 * è l'adattivo dei poveri, e per quattro video basta e avanza.
 *
 * Un formato solo, H.264/MP4: il WebM risparmierebbe banda su Chrome, ma
 * raddoppia i file da produrre e la banda qui non si paga.
 */

/** Le due versioni di un video, più il suo poster. */
export type Rendition = {
  /** 1080p, CRF 19, tetto 10 Mbit/s. */
  hd: string;
  /** 720p, CRF 22, tetto 3,5 Mbit/s. */
  sd: string;
  /** WebP 1280×720, ≤ 150 kB. È l'immagine che si vede prima del video. */
  poster: string;
};

const BASE = import.meta.env.BASE_URL;

/**
 * Il prefisso dei media. Vuoto = i file stanno nel sito, come oggi; pieno =
 * stanno su R2 (`https://media.lockvfx.com/`, o l'indirizzo `r2.dev` finché
 * il dominio non c'è). Con la barra finale o senza, funziona lo stesso.
 */
const MEDIA = (import.meta.env.VITE_MEDIA_URL ?? '').replace(/\/+$/, '');

/** Un percorso dentro il deposito dei media (`reel/reel-hd.mp4`, …). */
function suR2(path: string): string {
  return `${MEDIA}/${path}`;
}

/**
 * Le versioni del video, quando il deposito non c'è ancora.
 *
 * Con `VITE_MEDIA_URL` vuoto non esistono un HD e un SD: esiste il file di
 * oggi, e tutte e due puntano lì. Non è un ripiego provvisorio da ricordarsi
 * di togliere — è la ragione per cui questo lotto si può fare **prima** che i
 * master arrivino: il sito si comporta esattamente come ieri, e il giorno in
 * cui il deposito esiste cambia una variabile d'ambiente e nient'altro.
 */
function riserva(file: string, poster: string): Rendition {
  const src = `${BASE}${file}`;
  return { hd: src, sd: src, poster: `${BASE}${poster}` };
}

const POSTER_DI_OGGI = 'images/showreel-poster.webp';

/** Lo showreel, 16:9. */
export const REEL: Rendition = MEDIA
  ? { hd: suR2('reel/reel-hd.mp4'), sd: suR2('reel/reel-sd.mp4'), poster: suR2('reel/reel-poster.webp') }
  : riserva('video/reel.mp4', POSTER_DI_OGGI);

/**
 * Lo showreel per il telefono: il montaggio verticale.
 *
 * Non è lo stesso file ritagliato — uno showreel 16:9 in `cover` su un
 * telefono mostra circa un quarto del fotogramma, cioè quasi sempre la parte
 * sbagliata. Il montaggio 9:16 è un **master da chiedere a LockVFX**; finché
 * non c'è, qui vale la riserva e sul telefono si vede quello che si vede
 * oggi.
 */
export const REEL_MOBILE: Rendition = MEDIA
  ? {
      hd: suR2('reel/reel-mobile-hd.mp4'),
      sd: suR2('reel/reel-mobile-sd.mp4'),
      poster: suR2('reel/reel-mobile-poster.webp'),
    }
  : riserva('video/reel.mp4', POSTER_DI_OGGI);

/** Il breakdown di un lavoro, dal suo slug. */
export function workRendition(slug: string): Rendition {
  return MEDIA
    ? {
        hd: suR2(`works/${slug}-hd.mp4`),
        sd: suR2(`works/${slug}-sd.mp4`),
        poster: suR2(`works/${slug}.webp`),
      }
    : riserva(`video/works/${slug}.mp4`, POSTER_DI_OGGI);
}

/* --------------------------------------------------------------------- */

type Connessione = { saveData?: boolean; effectiveType?: string };

/** Le tre cose che il browser sa dire sulla rete e sullo schermo. */
function ambiente(): { saveData: boolean; rete: string | undefined; larghezza: number } {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return { saveData: false, rete: undefined, larghezza: 0 };
  }
  const conn = (navigator as Navigator & { connection?: Connessione }).connection;
  return {
    saveData: conn?.saveData === true,
    rete: conn?.effectiveType,
    larghezza: window.innerWidth,
  };
}

/** Le reti su cui un file da 10 Mbit/s si ferma a metà. */
const LENTE = new Set(['slow-2g', '2g', '3g']);

/**
 * Quale delle due versioni, e perché.
 *
 * Tre regole, in quest'ordine (§8): chi ha chiesto di risparmiare dati o sta
 * su una rete lenta ha l'SD, qualunque schermo abbia; su uno schermo largo e
 * una rete che regge — `4g`, o sconosciuta, che è il caso di Safari, dove
 * l'API non esiste — l'HD; in tutti gli altri casi l'SD, che è la scelta che
 * non si rimpiange mai.
 *
 * Esportata a parte dalla decisione vera perché è una funzione pura: si può
 * ragionarci sopra senza avere un browser intorno.
 */
export function decidiQualita(env: ReturnType<typeof ambiente>): 'hd' | 'sd' {
  if (env.saveData) return 'sd';
  if (env.rete && LENTE.has(env.rete)) return 'sd';
  if (env.larghezza >= 1024 && (env.rete === '4g' || env.rete === undefined)) return 'hd';
  return 'sd';
}

let scelta: 'hd' | 'sd' | undefined;

/**
 * La qualità di questa visita. **Una volta sola**: cambiare versione a metà
 * pagina vorrebbe dire ricominciare un download da capo per un video che si
 * sta già guardando, e nessuno ci guadagna.
 */
export function pickRendition(): 'hd' | 'sd' {
  scelta ??= decidiQualita(ambiente());
  return scelta;
}

/** Il file da mettere in `<source>`, per questa visita. */
export function sorgente(r: Rendition): string {
  return r[pickRendition()];
}
