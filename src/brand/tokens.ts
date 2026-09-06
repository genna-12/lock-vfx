/**
 * Fondamenta di identità di brand per LockVFX.
 *
 * Lo studio è appena nato e non ha ancora un'identità propria — questo
 * file NON è solo un elenco di costanti tecniche, è la prima bozza di
 * quell'identità, espressa attraverso il sito. Da qui in avanti, ogni
 * nuovo componente (non solo la home) dovrebbe attingere da qui invece
 * di reinventare colori/font/curve a mano — è quello che rende un sito
 * "un brand" invece di "una serie di pagine che si assomigliano".
 */

export const BRAND = {
  name: 'LockVFX',
  tagline: 'Precisione in ogni fotogramma',
  voice: 'Tecnica ma calda: frasi brevi, dichiarative, mai gergo fine a sé stesso.',
};

// Palette "Obsidian & Crimson" con un ruolo dichiarato per ogni colore,
// non solo un hex — aiuta a decidere DOVE va usato, non solo come appare.
export const COLORS = {
  void: '#020202', // sfondo primario — il "nulla" prima che il girato inizi
  obsidian: '#08090C', // superfici, pannelli, il corpo del lucchetto
  crimson: '#E60B18', // UNICO accento: marchio, azione, il calore umano nel tecnico
  ink: '#F3F4F6', // testo primario
  slate: '#9CA3AF', // testo secondario
  graphite: '#6B7280', // label, testo terziario, timecode
};

// Coppia tipografica come scelta di voce, non solo di leggibilità:
// un display leggero per i titoli (voce "cinematica", umana), un
// monospace per tutto ciò che è "sistema" — HUD, timecode, label, nav.
// (Sostituire con i font reali scelti — suggerimento: Space Grotesk +
// JetBrains Mono, entrambi gratuiti, entrambi coerenti col tono tecnico.)
export const TYPE = {
  display: "'Space Grotesk', ui-sans-serif, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// Curve di easing CON UN NOME — vocabolario condiviso per chi lavora sul
// progetto dopo di te, invece di numeri magici ripetuti ovunque.
export const EASE = {
  shutterOpen: [0.16, 1, 0.3, 1] as const, // scatto secco, come un otturatore
  driftSlow: [0.4, 0, 0.2, 1] as const, // ambientale, lentissimo
  focusPull: { type: 'spring' as const, stiffness: 170, damping: 20 }, // reveal testo/lente
};

// Il motivo visivo ricorrente del sito: l'estetica da "monitor di regia"
// (bracket ai bordi del frame, timecode, scanline sottili). NON è
// decorazione — è la firma visiva del brand: va riusata ovunque serva un
// accento tecnico riconoscibile (nav, footer, loading state, pagine
// progetto future), non solo nella home.
export const HUD_MOTIF = {
  bracketSize: 24, // px
  frameRate: 25, // fps "immaginari" per il timecode scenico
};