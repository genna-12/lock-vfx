/**
 * Uno scroll scritto in JavaScript, dentro una pagina che ha lo snap.
 *
 * Su iOS, con `scroll-snap-type: mandatory`, un
 * `scrollIntoView({ behavior: 'smooth' })` arriva a destinazione e mezzo
 * secondo dopo **torna indietro**: il motore di snap riaggancia il punto da
 * cui si era partiti e annulla la corsa. Visto sul telefono il 9/9 — i fori
 * della nav portavano alla sezione e rimbalzavano alla precedente.
 *
 * La regola, da qui in avanti per **qualunque** scroll programmato (nav,
 * agganci `#studio`/`#contact`, e qualsiasi altro): si spegne lo snap prima
 * di partire, si scorre, e lo si riaccende quando lo scroll è finito
 * davvero — `scrollend`, con un timer di riserva dove non c'è (Safari lo ha
 * dal 17.4; prima di allora vale il timer).
 *
 * Lo spegnimento è inline sull'elemento che scorre: batte la regola del
 * foglio senza `!important` e si toglie con `removeProperty`.
 */

/** Riserva per i browser senza `scrollend`: più lunga di una corsa smooth. */
const RISERVA_MS = 700;

let riaccendi: number | undefined;
let inCorsa: (() => void) | undefined;

export function scrollProgrammato(vai: () => void): void {
  const scroller = document.scrollingElement ?? document.documentElement;
  if (!(scroller instanceof HTMLElement)) {
    vai();
    return;
  }

  // Una corsa già in volo si chiude qui: due tap ravvicinati non devono
  // lasciare lo snap spento per sempre.
  inCorsa?.();

  scroller.style.scrollSnapType = 'none';

  const fine = () => {
    if (inCorsa !== fine) return;
    inCorsa = undefined;
    window.clearTimeout(riaccendi);
    window.removeEventListener('scrollend', fine);
    scroller.style.removeProperty('scroll-snap-type');
  };
  inCorsa = fine;

  window.addEventListener('scrollend', fine);
  riaccendi = window.setTimeout(fine, RISERVA_MS);

  vai();
}

/**
 * Portarsi a una sezione, dall'alto.
 *
 * Non `scrollIntoView`: quello misura il riquadro **trasformato**. Quando le
 * sezioni entravano con dodici pixel di salita si arrivava dodici pixel sotto
 * il punto d'aggancio — misurato 1700 invece di 1688. La salita è stata tolta
 * con M12, ma il modo giusto di calcolare una meta resta questo: `offsetTop`
 * le trasformazioni non le vede, e domani qualcuno rimetterà un `transform`
 * su una sezione senza pensare a questa funzione.
 */
export function vaiAllaSezione(el: HTMLElement): void {
  let top = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    top += n.offsetTop;
  }
  scrollProgrammato(() => window.scrollTo({ top, behavior: 'smooth' }));
}
