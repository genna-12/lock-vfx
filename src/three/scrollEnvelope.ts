import { smoothstep } from './mathUtils';

/**
 * Inviluppo 0..1 PURAMENTE funzione di `p` (lo scroll). Nessun damp, nessun
 * "inseguimento" nel tempo: a un dato `p` corrisponde sempre lo stesso
 * valore, quindi zero ritardo percepibile indipendentemente dalla velocità
 * di scroll.
 */
export function scrollEnvelope(p: number, inStart: number, inEnd: number, outStart: number, outEnd: number) {
  const easeIn = smoothstep(p, inStart, inEnd);
  const easeOut = 1 - smoothstep(p, outStart, outEnd);
  return Math.min(easeIn, easeOut);
}