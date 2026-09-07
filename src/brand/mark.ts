/**
 * Le misure del marchio.
 *
 * Stanno fuori da `Mark.tsx` perché un file che esporta un componente non
 * deve esportare anche costanti: il fast refresh smette di funzionare e il
 * lint lo dice. Qui in `brand/` sono anche nel posto giusto — sono dati del
 * marchio, come i colori e la tipografia.
 */

/**
 * Riquadro stretto sul marchio dentro il 1920x1920 del file originale.
 * Misurato con `getBBox()` sul disegno vero (743,6 / 611,7 / 433,8 / 690,9)
 * e arrotondato all'unità verso l'esterno: così il marchio riempie la sua
 * casella e chi lo usa ragiona sull'altezza, non sui margini del file.
 */
export const MARK_VIEWBOX = { x: 743, y: 611, w: 435, h: 692 } as const;

/** Quanto scende la staffa per chiudersi, in unità di viewBox. */
export const SHACKLE_CLOSED = 25;
