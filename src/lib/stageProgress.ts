import { useSyncExternalStore } from 'react';

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
let isStatic = false;
const listeners = new Set<() => void>();

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

/** `true` quando la camera è dentro la finestra (estremi esclusi). */
export function useStageWindow(from: number, to: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isStatic || (progress > from && progress < to),
    () => false
  );
}
