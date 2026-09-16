import type { SetId } from '../brand/tokens';

/**
 * Chi sa muovere la camera — quando c'è una camera.
 *
 * ScrollTrigger, ScrollSmoother e la timeline pesano 23,5 kB compressi e
 * servono a **una cosa sola**: la carrellata del desktop. Sul
 * telefono la carrellata non esiste (`mobile-semplice-spec.md` §1), quindi
 * quel codice non deve nemmeno essere scaricato: la Stage lo chiede con un
 * `import()` e solo nel ramo non-touch.
 *
 * Il problema che questo file risolve è l'altro capo del filo. Il marchio,
 * la nav e i link interni devono sapere *sul momento*, dentro un handler di
 * click, se la camera c'è: non possono aspettare una promessa — un
 * `preventDefault` dopo un `await` arriva troppo tardi e il browser ha già
 * saltato all'ancora. Quindi la carrellata, quando si monta, **si annuncia
 * qui**, e chi chiama legge una variabile sincrona: se c'è, la camera porta;
 * se non c'è, valgono le quattro sezioni vere e lo scroll del browser.
 *
 * Nessun import di gsap in questo file, ed è il punto: resta nel chunk
 * iniziale, mentre tutto ciò che sa di gsap sta dall'altra parte.
 */
export type CarrellataViva = {
  /** Il marchio: torna in cima muovendo barra e camera insieme. */
  inCima: () => void;
  /** La nav: salta all'HOLD `id` come faceva `smoother.scrollTo(…, true)`. */
  vaiAllHold: (id: SetId) => void;
  /** Un link interno (`corsa`) o un arrivo da un'altra pagina (`stacco`). */
  vaiAlSet: (id: SetId, modo: 'corsa' | 'stacco', arrivato: () => void) => void;
};

let viva: CarrellataViva | null = null;

/** La carrellata si annuncia al montaggio e si ritira allo smontaggio. */
export function annunciaCarrellata(api: CarrellataViva | null): void {
  viva = api;
}

/** `null` quando la pagina è quella semplice: niente camera, niente gsap. */
export function carrellataViva(): CarrellataViva | null {
  return viva;
}
