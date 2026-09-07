import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { CAMERA, COLORS, STAGE_BG, type SetId } from '../../brand/tokens';
import {
  MOVE,
  SALA_LIVE,
  SNAP,
  STAGE_VH,
  T1,
  activeSetAt,
  amplitude,
  snapProgress,
} from '../../lib/camera';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { Lights } from './Lights';
import { Reel } from './Reel';
import { Statement } from './Statement';
import { Sala } from './Sala';
import { Stanza } from './Stanza';
import { loadWorks } from '../../data/works';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/**
 * Quando lo Statement è in scena: dalla fine di T1 (le righe sono arrivate)
 * all'inizio di T2 (la camera comincia ad attraversarlo). Fuori di qui è
 * `inert`, altrimenti il link alla pagina Studio resterebbe cliccabile e
 * raggiungibile col tab anche a opacità 0.
 */
const STUDIO_LIVE = { from: 150 / STAGE_VH, to: 300 / STAGE_VH } as const;


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
  const reduce = useReducedMotion();

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

    // Reduced motion: nessuna camera, nessuno smoother. I set tornano in
    // flusso normale (le regole `.static` in globals.css) e la nav resta una
    // lista di ancore. Il listener di useReducedMotion rifà questo effetto se
    // l'utente cambia impostazione a pagina aperta.
    if (reduce) {
      html.classList.add('static');
      notify('reel');
      return () => html.classList.remove('static');
    }
    html.classList.remove('static');

    // Su mobile la barra degli indirizzi che entra ed esce cambia innerHeight
    // in continuazione: senza questo, ogni scroll rifà il layout di un pin da
    // 560vh.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // `smoothTouch` resta 0 (default): su touch lo scroll è quello nativo.
    const smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: CAMERA.smooth,
      effects: false,
    });

    let lastId: SetId | null = null;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const [lightSala] = q('[data-light="sala"]');
      const [lightTaglio] = q('[data-light="taglio"]');
      const [reelScreen] = q('[data-leaf="reel"]');
      const [reelVeil] = q('[data-veil="reel"]');
      const [statement] = q('[data-statement]');
      const [studio] = q('[data-set="studio"]');
      const lines = q('[data-line]');
      const [sala] = q('[data-set="work"]');
      const [salaLeaf] = q('[data-leaf="sala"]');
      const [salaVeil] = q('[data-veil="sala"]');
      const [stanza] = q('[data-set="contact"]');

      // Stato di partenza. I valori che dipendono dal viewport sono funzioni:
      // `invalidateOnRefresh` le rivaluta a ogni refresh, così il resize non
      // lascia in giro pixel calcolati su un'altra finestra.
      // Fuori dal suo momento lo Statement e' invisibile ma presente: senza
      // `inert` il link alla pagina Studio resterebbe cliccabile e
      // raggiungibile col tab anche a opacita' 0.
      studio.inert = true;

      gsap.set(lines, { z: () => MOVE.statementZ * amplitude(), opacity: 0 });
      gsap.set(stanza, { yPercent: 100 });
      gsap.set(salaLeaf, { scale: MOVE.salaScaleIn });
      gsap.set(salaVeil, { opacity: 1 });
      gsap.set(sala, { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'stage',
          trigger: root,
          start: 'top top',
          end: `+=${STAGE_VH}%`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // I magneti. `snapTo` è una funzione e non l'elenco delle quattro
          // posizioni perché dentro un HOLD non si deve muovere niente:
          // l'elenco tirerebbe al foro successivo anche chi si è fermato a
          // leggere. La direzione la dà ScrollTrigger.
          snap: {
            snapTo: (value: number, self?: { direction: number }) =>
              snapProgress(value, self?.direction ?? 1),
            directional: true,
            delay: SNAP.delay,
            duration: SNAP.duration,
            ease: SNAP.ease,
          },
          onUpdate: (self) => {
            const id = activeSetAt(self.progress);
            if (id !== lastId) {
              lastId = id;
              notify(id);
            }
            // Stile inline e non una classe: `pointer-events-auto` e
            // `pointer-events-none` hanno la stessa specificita', vincerebbe
            // quella piu' in basso nel foglio, non quella aggiunta dopo.
            const live = self.progress > SALA_LIVE.from && self.progress < SALA_LIVE.to;
            sala.style.pointerEvents = live ? 'auto' : 'none';
            studio.inert = !(self.progress > STUDIO_LIVE.from && self.progress < STUDIO_LIVE.to);
          },
        },
      });

      tl
        /* ---- T1 · DOLLY BACK (60 → 150) ------------------------------
           La reel arretra e si vela; lo statement viene avanti dal buio;
           il fondo passa a obsidian e si accende la luce di sala. */
        .to(reelScreen, {
          z: () => MOVE.reelZ * amplitude(),
          y: () => window.innerHeight * MOVE.reelY * amplitude(),
          duration: 90,
          ease: CAMERA.t1,
        }, 60)
        .to(reelVeil, { opacity: T1.veil.to, duration: T1.veil.duration }, T1.veil.at)
        .to(reelScreen, { opacity: 0, duration: 30 }, 120)
        // Il colore del fondo dello Studio e' una prova aperta: con
        // `STAGE_BG = 'void'` questo tratto non cambia niente e lo spazio
        // resta nero da cima a fondo.
        .to(root, { backgroundColor: COLORS[STAGE_BG], duration: 90 }, 60)
        .to(lightSala, { opacity: 1, duration: 60, ease: 'power1.out' }, 80)
        .to(
          lines,
          { z: 0, opacity: 1, duration: T1.lines.duration, stagger: T1.lines.stagger, ease: 'power2.out' },
          T1.lines.at
        )

        /* ---- T2 · PUSH IN (230 → 310) --------------------------------
           La camera avanza ATTRAVERSO lo statement ed entra nella sala.
           L'opacità va sulle righe, non sul wrapper: il wrapper è quello
           che sta viaggiando in z. */
        .to(statement, {
          z: () => MOVE.statementPush * amplitude(),
          duration: 80,
          ease: CAMERA.t2In,
        }, 230)
        .to(lines, { opacity: 0, duration: 50, ease: 'power1.in' }, 250)
        .to(lightSala, { opacity: 0, duration: 50 }, 240)
        .to(root, { backgroundColor: COLORS.void, duration: 60 }, 240)
        .to(sala, { opacity: 1, duration: 30 }, 260)
        .to(salaLeaf, { scale: 1, duration: 70, ease: CAMERA.t2Out }, 250)
        .to(salaVeil, { opacity: 0, duration: 60, ease: 'power1.out' }, 260)

        /* ---- T3 · CRANE DOWN (420 → 500) -----------------------------
           La camera scende: la sala sale, si vela e sparisce; la stanza
           sale da sotto con la luce di taglio. */
        .to(salaLeaf, {
          yPercent: () => MOVE.salaRiseY * amplitude(),
          scale: MOVE.salaScaleOut,
          duration: 80,
          ease: CAMERA.t3,
        }, 420)
        .to(salaVeil, { opacity: 0.7, duration: 50 }, 420)
        .to(sala, { opacity: 0, duration: 30 }, 465)
        .to(stanza, { yPercent: 0, duration: 80, ease: CAMERA.t3 }, 420)
        .to(lightTaglio, { opacity: 1, duration: 60, ease: 'power1.out' }, 450)

        /* Coda: la timeline deve durare esattamente 560 come lo stage. */
        .to({}, { duration: 1 }, STAGE_VH - 1);
    }, root);

    ScrollTrigger.refresh();

    // Maniglia di sviluppo: serve per ispezionare la carrellata dalla console
    // (e per le verifiche degli step). `import.meta.env.DEV` la fa sparire
    // dal build di produzione insieme al ramo.
    if (import.meta.env.DEV) {
      (window as unknown as { __lock?: unknown }).__lock = {
        ScrollTrigger,
        ScrollSmoother,
        smoother,
        get timeline() {
          return ScrollTrigger.getById('stage')?.animation;
        },
      };
    }

    return () => {
      ctx.revert();
      smoother.kill();
      if (import.meta.env.DEV) delete (window as unknown as { __lock?: unknown }).__lock;
    };
  }, [reduce, notify]);

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
