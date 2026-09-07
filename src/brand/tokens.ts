/// <reference types="vite/client" />
/**
 * LockVFX — tavola dei token.
 *
 * Questo file è la fonte di verità per il lato JS: GSAP, le timeline della
 * carrellata, la camera, tutto ciò che ha bisogno di un numero e non di una
 * classe. Gli stessi valori vivono come custom properties in
 * `src/styles/globals.css` (blocco `@theme` + `:root`), che è ciò che
 * consumano i componenti.
 *
 * Regola: nessun componente contiene un hex o una durata scritta a mano.
 * O usa una classe Tailwind generata dal `@theme`, o importa da qui.
 *
 * In sviluppo `assertTokensInSync()` confronta i due elenchi e stampa un
 * avviso in console se qualcuno ne ha cambiato uno solo dei due.
 */

/** Colori, con il ruolo che spiega DOVE vanno usati (non solo come appaiono). */
export const COLORS = {
  /** Fondo primario: il nero prima che il girato cominci. */
  void: '#020202',
  /** Superfici e volumi appena staccati dal fondo. */
  obsidian: '#0b0b0e',
  /** Testo primario. Neutro caldo, non bianco puro. */
  ink: '#f2efea',
  /** Testo secondario: paragrafi, contesto. */
  stone: '#b9b2a8',
  /** Etichette, bordi, tutto ciò che deve essere quasi muto. */
  dust: '#6e685f',
  /** Unico accento. Uno persistente (foro attivo della nav) + al massimo uno transitorio. */
  crimson: '#e60b18',
} as const;

/** Una sola famiglia variabile, due registri di larghezza. */
export const TYPE = {
  display: "'Outfit', ui-sans-serif, system-ui, sans-serif",
  text: "'Outfit', ui-sans-serif, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, 'SFMono-Regular', monospace",
  /**
   * Asse wght del file variabile. Quattro pesi e basta: `air` e' riservato
   * alla frase dello Statement, `display` e' il registro delle misure
   * grandi, `text` il corpo, `medium` i nomi, le cap e i pulsanti.
   */
  weight: { air: 200, display: 300, text: 400, medium: 500 },
} as const;

/**
 * Peso della frase dello Statement. La Direzione vuole vedere le due
 * versioni prima di scegliere: 300 e' quella in pagina, 200 la prova.
 */
export const STATEMENT_WEIGHT: 200 | 300 = 300;

/**
 * Durate espresse in fotogrammi a 24 fps: il vocabolario è quello del
 * montaggio, non quello del web. `cut` è lo stacco, non una dissolvenza.
 */
export const MOTION = {
  cut: 0,
  f2: 83,
  f5: 208,
  f8: 333,
  f12: 500,
  easeCut: 'none',
  easeArrive: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

/** Camera della carrellata (vedi `momento-1-lo-spazio.md`). */
export const CAMERA = {
  /** ScrollSmoother su desktop; su touch resta lo scroll nativo. */
  smooth: 1.2,
  t1: 'power2.inOut',
  t2In: 'power2.in',
  t2Out: 'power2.out',
  t3: 'power2.inOut',
} as const;

/**
 * Le luci sono opacità di layer, mai `filter` — un filtro in animazione
 * costa un repaint per fotogramma e appiattisce i figli 3D.
 */
export const LIGHTS = {
  /** Schermo: nessuna luce, il video è la sorgente. */
  schermo: null,
  /** Sala: luce dall'alto, fredda solo quanto basta. */
  sala: 'rgb(255 246 232 / 0.1)',
  /** Taglio: key calda da sinistra. */
  taglio: 'rgb(255 236 214 / 0.15)',
} as const;

/** Solo due raggi in tutto il sito. Nient'altro è arrotondato. */
export const RADIUS = { frame: 2, card: 6 } as const;

export const SPACE = {
  pad: 'clamp(20px, 3.4vw, 48px)',
  sectionGap: 'clamp(96px, 12vh, 160px)',
} as const;

/** I quattro HOLD della carrellata, nell'ordine in cui si attraversano. */
export const SETS = ['reel', 'studio', 'work', 'contact'] as const;
export type SetId = (typeof SETS)[number];

/* ------------------------------------------------------------------------ */

const CSS_MIRROR: Array<[string, string]> = [
  ['--color-void', COLORS.void],
  ['--color-obsidian', COLORS.obsidian],
  ['--color-ink', COLORS.ink],
  ['--color-stone', COLORS.stone],
  ['--color-dust', COLORS.dust],
  ['--color-crimson', COLORS.crimson],
  ['--f2', `${MOTION.f2}ms`],
  ['--f5', `${MOTION.f5}ms`],
  ['--f8', `${MOTION.f8}ms`],
  ['--f12', `${MOTION.f12}ms`],
  ['--smooth', `${CAMERA.smooth}s`],
  ['--light-sala', LIGHTS.sala],
  ['--light-taglio', LIGHTS.taglio],
  ['--pad', SPACE.pad],
  ['--gap-section', SPACE.sectionGap],
];

/** Solo in dev: avvisa se `globals.css` e questo file si sono disallineati. */
export function assertTokensInSync(): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;
  const computed = getComputedStyle(document.documentElement);
  const drift = CSS_MIRROR.filter(([name, expected]) => {
    const actual = computed.getPropertyValue(name).trim();
    return actual !== '' && actual.replace(/\s+/g, ' ') !== expected.replace(/\s+/g, ' ');
  });
  if (drift.length) {
    console.warn(
      '[tokens] globals.css e tokens.ts non coincidono:',
      drift.map(([name, expected]) => `${name} = ${computed.getPropertyValue(name).trim()} (atteso ${expected})`)
    );
  }
}
