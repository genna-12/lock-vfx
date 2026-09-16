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

/**
 * Riserva per i browser senza `scrollend` (Safari < 17.4).
 *
 * Non un tempo fisso: un tempo fisso è una scommessa sulla lunghezza della
 * corsa, e la si perde. Misurato il 16/9: dalla cima al foro "Contact" —
 * 2 532 px — lo scroll finisce a 726 ms e `scrollend` arriva a 738, cioè un
 * timer di 700 ms riaccendeva lo snap **prima della fine della corsa**, che è
 * esattamente il rimbalzo che M11 doveva chiudere. E le corse del Lotto 2
 * (l'arrivo con `#studio`/`#contact`, il ritorno in cima) sono più lunghe.
 *
 * Quindi il timer si **riarma**: finché `scrollY` continua a cambiare si
 * rimanda, e scatta solo quando la pagina è ferma da `FERMO_MS`. Il tetto è
 * una rete di sicurezza — se qualcosa tiene viva la pagina per sempre, lo
 * snap deve tornare comunque.
 */
const FERMO_MS = 180;
const TETTO_MS = 4000;

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

  let y = window.scrollY;
  let riserva = 0;
  let tetto = 0;

  const fine = () => {
    if (inCorsa !== fine) return;
    inCorsa = undefined;
    window.clearTimeout(riserva);
    window.clearTimeout(tetto);
    window.removeEventListener('scrollend', fine);
    window.removeEventListener('scroll', muove);
    scroller.style.removeProperty('scroll-snap-type');
  };
  /** Ogni volta che la pagina si muove la riserva riparte da capo. */
  const arma = () => {
    window.clearTimeout(riserva);
    riserva = window.setTimeout(fine, FERMO_MS);
  };
  const muove = () => {
    if (window.scrollY === y) return;
    y = window.scrollY;
    arma();
  };
  inCorsa = fine;

  window.addEventListener('scrollend', fine);
  window.addEventListener('scroll', muove, { passive: true });
  arma();
  tetto = window.setTimeout(fine, TETTO_MS);

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
export function vaiAllaSezione(el: HTMLElement, comportamento: ScrollBehavior = 'smooth'): void {
  let top = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    top += n.offsetTop;
  }
  // `auto` è lo stacco: si arriva da un'altra pagina già sapendo dove si va,
  // e non si guarda scorrere mezzo sito per arrivarci.
  scrollProgrammato(() => window.scrollTo({ top, behavior: comportamento }));
}
