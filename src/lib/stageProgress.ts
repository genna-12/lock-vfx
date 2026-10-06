import { useSyncExternalStore } from 'react';
import { modoIniziale } from './useReducedMotion';
import { giaEntrati, quandoEntrati } from './loadProgress';

/**
 * La progress della carrellata, distribuita da un posto solo.
 *
 * Reel, Sala e Stanza hanno bisogno di sapere quando tocca a loro. Prima
 * ognuna se lo chiedeva da sé creando un `ScrollTrigger` di sola lettura
 * sugli stessi identici estremi del pin: quattro trigger per un'unica
 * informazione, ricalcolata quattro volte a ogni frame di scroll.
 *
 * Adesso lo Stage — che il trigger ce l'ha davvero, perché muove la camera —
 * pubblica qui la progress, e i set si iscrivono alla **finestra** che li
 * riguarda. Il componente si rirenderizza quando quel booleano cambia (tre
 * o quattro volte in tutta la carrellata), non a ogni pixel.
 *
 * In flusso statico (reduced motion) non c'è nessuna carrellata e nessuna
 * finestra: i set sono tutti in scena, e `useStageWindow` risponde `true`.
 */
let progress = 0;
// Deciso prima del primo render, non dall'effetto dello Stage: così Reel,
// Sala e Stanza nascono già nella forma giusta (QA, D20).
let isStatic = modoIniziale().flat;
const listeners = new Set<() => void>();
/** In flusso statico: le sezioni che hanno almeno un pixel a schermo. */
const visibili = new Set<string>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** La chiama lo Stage, dall'`onUpdate` del trigger che possiede. */
export function publishProgress(value: number): void {
  if (value === progress) return;
  progress = value;
  emit();
}

/** Flusso statico: niente carrellata, tutti i set in scena. */
export function setStageStatic(value: boolean): void {
  if (value === isStatic) return;
  isStatic = value;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * `true` quando non c'è nessuna carrellata: `prefers-reduced-motion`, o il
 * telefono coricato. Non è un dettaglio di rendering — in quella modalità i
 * set non sono più riquadri a schermo intero ma sezioni di una pagina che
 * scorre, e si disegnano in un altro modo (`rifinitura-spec.md` §6.4.3).
 */
export function useStageStatic(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isStatic,
    () => false
  );
}

/**
 * La chiama lo Stage in flusso statico, dal suo `IntersectionObserver`: una
 * sezione è entrata o uscita dallo schermo.
 */
export function publishVisibile(id: string, visibile: boolean): void {
  if (visibili.has(id) === visibile) return;
  if (visibile) visibili.add(id);
  else visibili.delete(id);
  emit();
}

/**
 * La sezione `id` è a schermo? Con la carrellata la risposta la dà la
 * finestra della camera (`useStageWindow`), e qui è sempre `true`; nella
 * pagina semplice è l'`IntersectionObserver` dello Stage. Serve ai video:
 * una Reel che gira mentre si guarda la Sala è batteria e banda per niente
 * (QA, D11).
 */
export function useSetVisibile(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !isStatic || visibili.has(id),
    () => false
  );
}

/**
 * Il loader ha staccato? I video della pagina semplice partono dopo, non
 * sotto l'overlay (`mobile-semplice-spec.md` §5).
 */
export function useEntrati(): boolean {
  return useSyncExternalStore(quandoEntrati, giaEntrati, () => false);
}

/** `true` quando la camera è dentro la finestra (estremi esclusi). */
export function useStageWindow(from: number, to: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isStatic || (progress > from && progress < to),
    () => false
  );
}
