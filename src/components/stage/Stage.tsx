import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { CAMERA, COLORS, type SetId } from '../../brand/tokens';
import { MOVE, SALA_LIVE, STAGE_VH, activeSetAt, amplitude } from '../../lib/camera';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { Lights } from './Lights';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

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
 * Contenuto: greybox. Reel, Statement, Sala e Stanza veri arrivano agli
 * step 3–6; qui si valida solo il movimento.
 */
type StageProps = {
  onActiveChange: (id: SetId) => void;
};

export function Stage({ onActiveChange }: StageProps) {
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
      const lines = q('[data-line]');
      const [sala] = q('[data-set="work"]');
      const [salaLeaf] = q('[data-leaf="sala"]');
      const [salaVeil] = q('[data-veil="sala"]');
      const [stanza] = q('[data-set="contact"]');

      // Stato di partenza. I valori che dipendono dal viewport sono funzioni:
      // `invalidateOnRefresh` le rivaluta a ogni refresh, così il resize non
      // lascia in giro pixel calcolati su un'altra finestra.
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
        .to(reelVeil, { opacity: 0.85, duration: 60 }, 60)
        .to(reelScreen, { opacity: 0, duration: 30 }, 120)
        .to(root, { backgroundColor: COLORS.obsidian, duration: 90 }, 60)
        .to(lightSala, { opacity: 1, duration: 60, ease: 'power1.out' }, 80)
        .to(lines, { z: 0, opacity: 1, duration: 60, stagger: 10, ease: 'power2.out' }, 90)

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

    return () => {
      ctx.revert();
      smoother.kill();
    };
  }, [reduce, notify]);

  return (
    <div ref={rootRef} className="stage">
      <Lights />

      <div className="camera">
        <div className="world">
          <section id="reel" data-set="reel" className="set" aria-label="Showreel">
            <div
              data-leaf="reel"
              className="absolute inset-0 grid place-items-center bg-obsidian ring-1 ring-dust/30 ring-inset"
            >
              <span className="u-cap text-stone">Reel</span>
              <div data-veil="reel" aria-hidden className="absolute inset-0 bg-void opacity-0" />
            </div>
          </section>

          <section
            id="studio"
            data-set="studio"
            className="set pointer-events-none grid place-items-center"
            aria-label="Studio"
          >
            <div data-statement className="u-pad flex w-full max-w-5xl flex-col gap-6 [transform-style:preserve-3d]">
              <div data-line className="h-16 w-[70%] bg-stone/20 md:h-20" />
              <div data-line className="h-10 w-[46%] bg-stone/20" />
              <div data-line className="u-cap text-dust">Studio</div>
            </div>
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
        <div
          data-leaf="sala"
          className="absolute inset-0 grid place-items-center bg-obsidian ring-1 ring-dust/30 ring-inset"
        >
          <span className="u-cap text-stone">Sala</span>
          <div data-veil="sala" aria-hidden className="absolute inset-0 bg-void" />
        </div>
      </section>

      {/* La Stanza non e' uno schermo: e' un ambiente. Niente fondo pieno,
          altrimenti coprirebbe la luce di taglio che deve batterle addosso
          da sinistra (nel design vero e' il marchio grande a riceverla). */}
      <section
        id="contact"
        data-set="contact"
        className="u-pad absolute inset-0 grid place-items-center"
        aria-label="Contatti"
      >
        <div className="grid h-[62%] w-full max-w-[1180px] place-items-center ring-1 ring-dust/30 ring-inset">
          <span className="u-cap text-stone">Stanza</span>
        </div>
      </section>
    </div>
  );
}
