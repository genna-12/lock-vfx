import type { MouseEvent } from 'react';
import { carrellataViva } from './carrellataViva';
import { scrollProgrammato } from './scrollProgrammato';

/**
 * Tornare in cima dal marchio, che è una cosa diversa in ogni ramo.
 *
 * `#top` sta **dentro** `#smooth-content`: con la carrellata il salto nativo
 * porta la barra di scorrimento a zero mentre la camera resta dov'è, e a
 * schermo non succede niente (Domanda 1 della Rifinitura, Lotto M ter). Con
 * lo smoother quindi si chiede allo smoother — e quel pezzo di codice vive
 * nel chunk della carrellata (`stage/carrellata.ts`), che sul telefono non
 * si scarica: qui si guarda solo se la camera c'è. Sul ramo senza camera
 * vale la stessa cura di M11 — lo snap si spegne per la durata della corsa,
 * altrimenti su iOS la pagina ci arriva e mezzo secondo dopo torna indietro.
 *
 * Sta in un file suo, e non dentro `Wordmark`, perché il marchio è anche il
 * chrome della pagina Studio, che di scroll programmato non ha bisogno.
 */
export function inCima(event: MouseEvent<HTMLAnchorElement>): void {
  // Prima di tutto e senza `await`: dentro un handler di click il
  // `preventDefault` non può aspettare una promessa.
  event.preventDefault();
  const camera = carrellataViva();
  if (camera) {
    camera.inCima();
    return;
  }
  scrollProgrammato(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
