import { CAMERA, SETS, type SetId } from '../brand/tokens';
import { carrellataViva } from './carrellataViva';
import { quandoUsciti } from './loadProgress';
import { aScrollFermo, vaiAllaSezione } from './scrollProgrammato';

/**
 * Gli agganci: portare a un set da un link, e arrivarci da un'altra pagina.
 *
 * Un `href="#contact"` da solo non basta in nessuno dei due rami. Con la
 * carrellata i quattro set sono impilati nello stesso punto della pagina e
 * ciò che li separa è la posizione di scroll dentro il pin: il salto nativo
 * porta la barra su un'ancora che non è dove si crede. Sul telefono le
 * sezioni sono vere, ma c'è lo snap, e con `mandatory` una corsa programmata
 * viene riagganciata al punto di partenza (M11).
 *
 * Due modi, perché sono due gesti diversi:
 *
 * - **corsa**: si è già nel sito e si chiede di andare in un altro set — la
 *   camera ci porta, e il viaggio è parte di ciò che si sta guardando.
 * - **stacco**: si *arriva* dalla pagina Studio con `#studio` o `#contact`.
 *   Lì la carrellata non si riavvolge davanti a chi ha già scelto dove
 *   andare: si taglia, come in sala di montaggio (`rifinitura-spec.md` §7.7).
 */

/**
 * Il primo campo del form: chi ha chiesto di scrivere può cominciare.
 *
 * Un tentativo solo, ma al momento giusto: quando l'overlay del loader non
 * c'è più (prima la pagina è `inert`, e il fuoco non si posa) **e** la pagina
 * è ferma (con la carrellata la Stanza entra in scena quando la camera ci
 * arriva, e fino ad allora è `visibility: hidden`). Prima erano sei
 * fotogrammi di tentativi alla cieca, e dopo il loader lungo non bastavano:
 * alla prima visita su `/#contact` il fuoco restava sul `body` (QA, D14).
 */
function fuocoSulForm(): void {
  // Sulla pagina del telefono no. Un campo a fuoco spegne lo snap
  // (`.snap:has(input:focus)` in globals.css, per non incastrare chi scrive
  // con la tastiera aperta), e scorrere non toglie il fuoco: dopo «Scrivici»
  // la pagina restava senza magneti per tutto il resto della visita (Genna,
  // 9/10). E sul telefono il fuoco è la tastiera, che copre mezza Stanza
  // prima che si sia deciso di scrivere: il campo lo apre il dito.
  if (document.documentElement.classList.contains('snap')) return;
  quandoUsciti(() =>
    aScrollFermo(() => {
      const campo = document.querySelector<HTMLInputElement>('#contact input[name="name"]');
      // `preventScroll`: la posizione l'abbiamo appena decisa noi, il browser
      // non la deve correggere portandosi il campo a metà schermo.
      campo?.focus({ preventScroll: true });
    })
  );
}

export function vaiAlSet(id: SetId, modo: 'corsa' | 'stacco' = 'corsa'): void {
  const arrivato = () => {
    if (id === 'contact') fuocoSulForm();
  };

  // Con la camera in scena la corsa è sua: barra e camera insieme, ogni
  // fotogramma. Il come sta in `stage/carrellata.ts`, che è il chunk che sul
  // telefono non si scarica; il perché, in `inCima.ts`.
  const camera = carrellataViva();
  if (camera) {
    camera.vaiAlSet(id, modo, arrivato);
    return;
  }

  // Senza carrellata i set sono quattro sezioni vere, una sotto l'altra: ci
  // si va con lo scroll del browser, spegnendo lo snap per la durata della
  // corsa (`scrollProgrammato`).
  const el = document.getElementById(id);
  if (!el) return;
  vaiAllaSezione(el, modo === 'stacco' ? 'auto' : 'smooth');
  if (modo === 'stacco') arrivato();
  else window.setTimeout(arrivato, CAMERA.smooth * 1000);
}

/** L'indirizzo punta a un set? */
function setDa(hash: string): SetId | null {
  const id = hash.replace('#', '');
  return (SETS as readonly string[]).includes(id) ? (id as SetId) : null;
}

/**
 * Si è arrivati con `#studio` o `#contact` (da "Torna al sito", da uno
 * "Scrivici" della pagina Studio, o da un link condiviso): dopo il loader —
 * che a quel punto è quello breve, la visita è già segnata — si taglia sulla
 * sezione, senza rifare la carrellata.
 */
export function agganciDiArrivo(): void {
  const id = setDa(window.location.hash);
  if (!id || id === 'reel') return;
  vaiAlSet(id, 'stacco');
}

/** Il click su un link interno del sito: `href="#work"` diventa una corsa. */
export function segui(event: { preventDefault: () => void }, href: string): void {
  const id = setDa(href.slice(href.indexOf('#')));
  if (!id) return;
  event.preventDefault();
  vaiAlSet(id, 'corsa');
}
