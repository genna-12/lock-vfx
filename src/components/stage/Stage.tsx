import { useCallback, useEffect, useRef, useState } from 'react';
import { type SetId } from '../../brand/tokens';
import { setStageStatic } from '../../lib/stageProgress';
import { useCoarsePointer, useReducedMotion, useShortLandscape } from '../../lib/useReducedMotion';
import { Lights } from './Lights';
import { Reel } from './Reel';
import { Statement } from './Statement';
import { Sala } from './Sala';
import { Stanza } from './Stanza';
import { loadWorks } from '../../data/works';

/**
 * Lo spazio, e la camera che lo attraversa.
 *
 * Un solo stage pinnato di 560vh: le quattro sezioni sono set nello stesso
 * spazio buio e lo scroll è una carrellata. Timeline e luci seguono
 * `momento-1-lo-spazio.md`; l'unità di tempo della timeline è il vh di
 * scroll, quindi i numeri qui sotto sono quelli della tabella.
 *
 * Regola del 3D, imparata rompendola: dentro `.world` niente `will-change`,
 * niente `opacity` < 1 sui contenitori e niente `overflow` diverso da
 * `visible` — ognuna di queste tre cose appiattisce il `preserve-3d` e la
 * profondità sparisce. L'opacità si anima sulle foglie: sullo `screen` della
 * reel e sulle singole righe dello statement, mai sui loro wrapper (il
 * wrapper dello statement è proprio l'elemento che viaggia in z durante T2).
 *
 * Lo Stage possiede anche lo ScrollSmoother: va creato PRIMA dei
 * ScrollTrigger che lo useranno, e in React gli effetti dei figli girano
 * prima di quelli del genitore — tenerli insieme qui è l'unico modo semplice
 * di garantire l'ordine.
 *
 * I quattro set sono i componenti veri: la Stanza, ultima ad arrivare,
 * entra da sotto in T3 e vive nell'HOLD 4.
 */
type StageProps = {
  onActiveChange: (id: SetId) => void;
};

export function Stage({ onActiveChange }: StageProps) {
  // La Sala riceve i lavori e non sa da dove vengono: oggi un array, domani
  // un `works.json` pubblicato dalla dashboard.
  const [works] = useState(loadWorks);
  const rootRef = useRef<HTMLDivElement>(null);
  /* Tre strade portano allo stesso posto: chi ha chiesto meno movimento, lo
     schermo troppo basso, e — da questo lotto — **il telefono**.

     Su un telefono la carrellata non ci sta, e non per come è scritta: le tre
     cose chieste dalla Direzione (schermo intero dietro le barre di Safari,
     niente glitch in salita, niente conflitti di scroll) sono incompatibili
     con un pin a scrub su touch, una per una
     (`mobile-semplice-spec.md` §1). Quindi lì si monta la pagina semplice:
     quattro sezioni in flusso, snap del browser, nessuna seconda mano sulla
     barra di scorrimento. Il desktop non cambia di una riga.

     Tre chiamate separate e poi l'or: `a() || b()` salterebbe gli hook dopo
     il primo `true`. */
  const reduce = useReducedMotion();
  const landscape = useShortLandscape();
  const coarse = useCoarsePointer();
  const flat = reduce || landscape || coarse;

  // La timeline si costruisce una volta sola: se `onActiveChange` finisse
  // nelle dipendenze, un render del genitore smonterebbe e rimonterebbe pin,
  // smoother e carrellata. Passa da un ref, non dall'array.
  const notifyRef = useRef(onActiveChange);
  useEffect(() => {
    notifyRef.current = onActiveChange;
  }, [onActiveChange]);
  const notify = useCallback((id: SetId) => notifyRef.current(id), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const html = document.documentElement;

    // Flusso statico: nessuna camera, nessuno smoother. I set tornano in
    // flusso normale (le regole `.static` in globals.css) e la nav resta una
    // lista di ancore. I listener dei due media query rifanno questo effetto
    // se l'utente cambia impostazione o gira il telefono a pagina aperta.
    if (flat) {
      html.classList.add('static');
      // La pagina semplice del telefono è la pagina statica **più** lo snap
      // e le dissolvenze d'ingresso: una classe in più, non un altro albero.
      if (coarse) html.classList.add('snap');
      // Niente carrellata: i set sono tutti in scena e si comportano di
      // conseguenza (video, HUD, `inert`).
      setStageStatic(true);
      notify('reel');

      /* ---- le transizioni, quando non c'è la camera -------------------
         Una sola dissolvenza corta all'ingresso di ogni sezione, e la luce
         che le tocca. La soglia è 0,55: più della metà della sezione a
         schermo vuol dire "è questa che si sta guardando", ed è la stessa
         che fa seguire il foro attivo della nav. Niente scrub, niente
         parallasse: il movimento sul telefono è quello del dito. */
      const sets = Array.from(root.querySelectorAll<HTMLElement>('[data-set]'));
      const luci = {
        sala: root.querySelector<HTMLElement>('[data-light="sala"]'),
        taglio: root.querySelector<HTMLElement>('[data-light="taglio"]'),
      };
      const acceso = (id: SetId) => {
        if (luci.sala) luci.sala.style.opacity = id === 'studio' ? '1' : '0';
        if (luci.taglio) luci.taglio.style.opacity = id === 'contact' ? '1' : '0';
      };
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            // Vista una volta, vista per sempre: la dissolvenza è un
            // ingresso, non un effetto che si ripete a ogni passaggio.
            el.dataset.seen = 'true';
            const id = el.id as SetId;
            notify(id);
            acceso(id);
          }
        },
        { threshold: 0.55 }
      );
      for (const set of sets) io.observe(set);

      return () => {
        io.disconnect();
        for (const light of Object.values(luci)) light?.style.removeProperty('opacity');
        html.classList.remove('static');
        html.classList.remove('snap');
      };
    }
    html.classList.remove('static');
    setStageStatic(false);

    /* ---- la carrellata, e solo qui ------------------------------------
       GSAP, ScrollTrigger e ScrollSmoother servono a una cosa sola: la
       camera che attraversa lo spazio. Sul telefono quella camera non
       esiste — sopra c'è il ramo `flat`, quattro sezioni vere e lo scroll
       del browser — e fino a ieri quei kB si scaricavano lo stesso, per non
       essere mai eseguiti (R24). Ora la carrellata arriva con un `import()`
       e solo da questo ramo: chi apre il sito da un telefono non la vede
       nemmeno passare.

       L'attesa non si vede: il loader è davanti per tre secondi buoni, e il
       chunk parte al montaggio dello Stage — molto prima che ci sia
       qualcosa da scorrere. Se lo Stage se ne va nel frattempo (una
       rotazione, `prefers-reduced-motion` cambiato a pagina aperta), la
       carrellata montata viene smontata subito dopo: `smontata` è la
       staffetta fra le due cose. */
    let smonta: (() => void) | undefined;
    let smontata = false;
    void import('./carrellata').then(({ montaCarrellata }) => {
      if (smontata) return;
      smonta = montaCarrellata(root, notify);
    });

    return () => {
      smontata = true;
      smonta?.();
    };
  }, [coarse, flat, notify]);

  return (
    <div ref={rootRef} className="stage">
      <Lights />

      <div className="camera">
        <div className="world">
          <section id="reel" data-set="reel" className="set" aria-label="Showreel">
            <div data-leaf="reel" className="absolute inset-0">
              <Reel />
              <div
                data-veil="reel"
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-void opacity-0"
              />
            </div>
          </section>

          <section
            id="studio"
            data-set="studio"
            className="set pointer-events-none grid place-items-center"
            aria-label="Studio"
          >
            <Statement />
          </section>
        </div>
      </div>

      {/* Sala e Stanza stanno FUORI dal mondo: non hanno profondità, si
          muovono in 2D. Qui l'opacità sul contenitore è innocua. */}
      <section
        id="work"
        data-set="work"
        className="pointer-events-none absolute inset-0"
        aria-label="Lavori"
      >
        <div data-leaf="sala" className="absolute inset-0">
          <Sala works={works} />
          {/* Il velo è una decorazione: se prende i click, la Sala smette di
              rispondere al mouse e al dito anche quando è invisibile. */}
          <div
            data-veil="sala"
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-void"
          />
        </div>
      </section>

      {/* La Stanza non e' uno schermo: e' un ambiente. Niente fondo pieno,
          altrimenti coprirebbe la luce di taglio che deve batterle addosso
          da sinistra: e' il marchio grande a riceverla. */}
      <section
        id="contact"
        data-set="contact"
        className="u-pad absolute inset-0"
        aria-label="Contatti"
      >
        <Stanza />
      </section>
    </div>
  );
}
