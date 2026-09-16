import type { MouseEvent } from 'react';
import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { CAMERA } from '../brand/tokens';
import { scrollProgrammato } from './scrollProgrammato';

/**
 * Tornare in cima dal marchio, che è una cosa diversa in ogni ramo.
 *
 * `#top` sta **dentro** `#smooth-content`: con la carrellata il salto nativo
 * porta la barra di scorrimento a zero mentre la camera resta dov'è, e a
 * schermo non succede niente (Domanda 1 della Rifinitura, Lotto M ter). Con
 * lo smoother quindi si chiede allo smoother; sul ramo touch vale la stessa
 * cura di M11 — lo snap si spegne per la durata della corsa, altrimenti su
 * iOS la pagina ci arriva e mezzo secondo dopo torna indietro.
 *
 * Sta in un file suo, e non dentro `Wordmark`, per una ragione di peso: il
 * marchio è anche il chrome della pagina Studio, che di ScrollSmoother non
 * sa niente e non deve scaricarlo. Qui lo importa solo la home.
 */
export function inCima(event: MouseEvent<HTMLAnchorElement>): void {
  const smoother = ScrollSmoother.get();
  event.preventDefault();
  if (smoother) {
    /* `smoother.scrollTo(0, true)` qui non porta in cima, e il motivo è
       dentro GSAP: con `smooth` e lo smoother non in pausa si limita a
       spostare la **barra** e lascia che sia la camera a raggiungerla da
       sola. Con il pin da 560vh la camera non la raggiunge — misurato dalla
       Sala: barra a 0, contenuto fermo a −3 285, cioè la pagina non si
       muove di un pixel. Si anima quindi la posizione dello smoother, che è
       esattamente quello che GSAP stesso fa quando lo smoother è in pausa:
       ogni fotogramma scrive la barra e la camera insieme.

       Chi tocca lo scroll ha sempre ragione, come per i magneti: al primo
       gesto la corsa si stacca. */
    const corsa = gsap.to(smoother, {
      scrollTop: 0,
      duration: CAMERA.smooth,
      ease: CAMERA.t1,
      overwrite: 'auto',
      onComplete: () => stacca(),
    });
    const ferma = () => corsa.kill();
    const stacca = () => {
      window.removeEventListener('wheel', ferma);
      window.removeEventListener('touchstart', ferma);
      window.removeEventListener('keydown', ferma);
    };
    window.addEventListener('wheel', ferma, { passive: true, once: true });
    window.addEventListener('touchstart', ferma, { passive: true, once: true });
    window.addEventListener('keydown', ferma, { once: true });
    return;
  }
  scrollProgrammato(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
