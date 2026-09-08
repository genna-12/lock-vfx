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

/**
 * I magneti (richiesta di LockVFX, 7/9).
 *
 * La camera non si ferma mai a metà di un movimento: quando lo scroll si
 * arresta dentro una transizione, la carrellata completa da sola il tratto
 * verso l'HOLD successivo **nella direzione in cui si stava andando**.
 * Dentro un HOLD invece lo scroll è libero: lì non c'è niente da
 * completare, e uno scatto sarebbe solo un dispetto a chi sta leggendo.
 *
 * Sono i quattro tratti di riposo della tabella di `momento-1`, con la
 * posizione a cui il magnete porta.
 */
export const HOLD_SPANS: ReadonlyArray<{ from: number; to: number; at: number }> = [
  { from: 0, to: 60, at: HOLDS.reel },
  { from: 150, to: 230, at: HOLDS.studio },
  { from: 310, to: 420, at: HOLDS.work },
  { from: 500, to: STAGE_VH, at: HOLDS.contact },
];

/** Tempi del magnete: `momento-1`, sezione Magneti. */
export const SNAP = {
  /**
   * Il magnete su touch: **spento**.
   *
   * L'uscita era gia' decisa dalla Direzione al primo giro
   * (`rifinitura-spec.md` §6.1 punto 1, ultima riga) e adesso serve: sul
   * telefono lo scroll veloce verso l'alto va su e giu' finche' non arriva
   * alla sezione dopo — il magnete riparte mentre la corsa e' ancora in
   * corso e tira all'indietro. Su desktop invece funziona ed e' misurato
   * (una corsa sola, 0,65 s), quindi resta li'.
   *
   * L'interruttore esiste per questo: quando la sonda (`?probe=1`) dira'
   * chi litiga con chi, si riaccende con un `true` e non con un lotto.
   */
  touch: false,
  /** Attesa dopo che lo scroll si e' fermato **davvero** (`scrollEnd`). */
  delay: 0.15,
  /**
   * Ogni quanto si ricontrolla se anche la camera si e' fermata. Corto: e'
   * un controllo, non un'attesa — l'attesa e' `delay`, e a farla due volte
   * il magnete attaccava mezzo secondo tardi.
   */
  check: 0.04,
  duration: { min: 0.4, max: 0.9 },
  ease: 'power2.inOut',
} as const;

/**
 * Dove porta il magnete, in progress. `direction` è quella di
 * ScrollTrigger: 1 se si stava scendendo, −1 se si stava risalendo.
 * Restituire il valore ricevuto significa "non spostarti".
 */
export function snapProgress(progress: number, direction: number): number {
  const vh = progress * STAGE_VH;
  if (HOLD_SPANS.some((span) => vh >= span.from && vh <= span.to)) return progress;
  const target =
    direction >= 0
      ? HOLD_SPANS.find((span) => span.from > vh)
      : [...HOLD_SPANS].reverse().find((span) => span.to < vh);
  return target ? target.at / STAGE_VH : progress;
}

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
