import { SETS, type SetId } from '../brand/tokens';

/**
 * La carrellata, come dati.
 *
 * L'unità di tempo della timeline È il vh di scroll: la timeline dura 560 e
 * la posizione `60` significa "a 60vh di scroll". Così i numeri del codice
 * sono gli stessi della tabella in `momento-1-lo-spazio.md` e si controllano
 * a vista, senza conversioni mentali.
 */
export const STAGE_VH = 560;

/** Dove porta il click su un foro della nav (vh). */
export const HOLDS: Record<SetId, number> = {
  reel: 0,
  studio: 190,
  work: 365,
  contact: 530,
};

/** Soglie di progress (0..1) fra un foro attivo e il successivo. */
const NAV_STEPS = [0.17, 0.46, 0.82] as const;

export function activeSetAt(progress: number): SetId {
  let i = 0;
  while (i < NAV_STEPS.length && progress >= NAV_STEPS[i]) i++;
  return SETS[i];
}

/** La Sala è interattiva solo dentro il suo HOLD. */
export const SALA_LIVE = { from: 0.55, to: 0.88 } as const;

/**
 * Ampiezze dei tre movimenti. Su mobile sono le stesse ridotte da un solo
 * fattore: la spec chiede "stessi movimenti, ampiezze ridotte" senza dare
 * numeri, quindi c'è una manopola sola da girare invece di dieci.
 */
export const MOVE = {
  /** T1 · dolly back: la reel arretra. */
  reelZ: -900,
  /** Frazione di viewport, non px: si ricalcola al resize. */
  reelY: -0.08,
  /** T1 · lo statement viene avanti dal buio. */
  statementZ: -520,
  /** T2 · push in: la camera attraversa lo statement. */
  statementPush: 640,
  /** T2 · la sala arriva da dietro. */
  salaScaleIn: 0.82,
  /** T3 · crane down: la sala sale e si allontana. */
  salaRiseY: -55,
  salaScaleOut: 0.9,
} as const;

/**
 * Tempi interni di T1 (Regola di T1 in `momento-1`, decisione della
 * Direzione del 7/9): nessuna riga di testo sopra la fotografia. Il velo
 * scurisce la reel PRIMA che arrivino le parole, e le righe partono a reel
 * già velata. Il dolly back non cambia: si deve vedere per intero.
 *
 * Con questi numeri la prima riga supera 0,3 di opacità a ~110vh, quando il
 * velo è al massimo da cinque vh — il vincolo («niente sopra 0,3 finché il
 * velo non è ≥ 0,7», cioè da 97vh) è rispettato con margine.
 */
export const T1 = {
  /** Velo della reel: 0 → 0,85 su 60–105. */
  veil: { at: 60, duration: 45, to: 0.85 },
  /** Righe dello statement: da 105, 30vh ciascuna, stagger 8vh. */
  lines: { at: 105, duration: 30, stagger: 8 },
} as const;

const MOBILE_AMPLITUDE = 0.68;

/** Fattore di ampiezza corrente. Valutato a ogni refresh di ScrollTrigger. */
export function amplitude(): number {
  return window.matchMedia('(max-width: 767px)').matches ? MOBILE_AMPLITUDE : 1;
}

/**
 * Posizione di scroll assoluta di un HOLD, dato il ScrollTrigger dello stage.
 * Va ricalcolata a ogni click: `start` ed `end` cambiano al resize.
 */
export function holdScroll(st: { start: number; end: number }, id: SetId): number {
  return st.start + (st.end - st.start) * (HOLDS[id] / STAGE_VH);
}
