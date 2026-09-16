import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { CAMERA, COLORS, LIGHTS, STAGE_BG, type SetId } from '../../brand/tokens';
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
import { publishProgress, setStageStatic } from '../../lib/stageProgress';
import { useCoarsePointer, useReducedMotion, useShortLandscape } from '../../lib/useReducedMotion';
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

    // L'intensità della luce SALA dipende dal fondo dello spazio: si scrive
    // qui, sul nodo dello stage, così `:root` resta quello di `globals.css`
    // e le luci — che stanno qui dentro — la ereditano. Con `STAGE_BG =
    // 'obsidian'` riscrive lo stesso valore che c'era.
    root.style.setProperty('--light-sala', LIGHTS.sala);

    /* ---- la sonda ------------------------------------------------------
       `?probe=1` nell'indirizzo, e nient'altro: un pannello che dice i
       numeri veri del telefono — finestra, `svh`/`lvh`/`dvh` misurate,
       altezza del palco, `isTouch`, `normalizeScroll`, e le ultime otto
       posizioni di scroll con il loro istante, che è come si legge un
       glitch. Import dinamico: in produzione è un file a parte, e chi non
       lo chiede non lo scarica. */
    let probeOff: (() => void) | undefined;
    let probeMorta = false;
    if (new URLSearchParams(window.location.search).get('probe') === '1') {
      void import('../../lib/probe').then(({ mountProbe }) => {
        if (probeMorta) return;
        probeOff = mountProbe({
          isTouch: ScrollTrigger.isTouch,
          normalizzato: () => Boolean(ScrollTrigger.normalizeScroll()),
          vh: () => Math.round((ScrollTrigger.getById('stage')?.progress ?? 0) * STAGE_VH),
        });
      });
    }
    const spegniSonda = () => {
      probeMorta = true;
      probeOff?.();
    };

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
        spegniSonda();
        io.disconnect();
        for (const light of Object.values(luci)) light?.style.removeProperty('opacity');
        html.classList.remove('static');
        html.classList.remove('snap');
      };
    }
    html.classList.remove('static');
    setStageStatic(false);

    // Su mobile la barra degli indirizzi che entra ed esce cambia innerHeight
    // in continuazione: senza questo, ogni scroll rifà il layout di un pin da
    // 560vh.
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* ---- quanto è alto il palco ---------------------------------------
       Lo dice `window.innerHeight`, non il CSS: su iOS è l'unico numero che
       corrisponde sempre a quello che si vede, mentre `svh` è l'altezza con
       tutte le barre aperte, `lvh` quella con tutte chiuse e `dvh` cambia
       mentre si scorre. Tre lotti, tre unità, tre volte sbagliato.

       Si riscrive quando lo schermo cambia davvero — una rotazione, il
       ritorno da un player a pieno schermo — e **non** a ogni `resize`: con
       `normalizeScroll` le barre non si muovono, e `ignoreMobileResize` è lì
       apposta perché un pin da 560vh non si rifaccia a ogni pixel. */
    const misuraPalco = () => {
      html.style.setProperty('--stage-h', `${window.innerHeight}px`);
    };
    const rimisura = () => {
      misuraPalco();
      ScrollTrigger.refresh();
    };
    misuraPalco();
    window.addEventListener('orientationchange', rimisura);
    document.addEventListener('fullscreenchange', rimisura);
    // iOS non manda `fullscreenchange` per il player nativo: manda questo, sul
    // `<video>`, e non risale — quindi si ascolta in cattura.
    document.addEventListener('webkitendfullscreen', rimisura, true);

    /* ---- Lo scroll del telefono --------------------------------------
       Due cose rendevano la carrellata inservibile su un telefono vero, e
       nessuna delle due si vede nel pannello a 390×844.

       L'inerzia nativa: dopo che il dito si è alzato il browser continua a
       scorrere per centinaia di ms, e in quel mentre il magnete scriveva la
       sua posizione — due mani sulla stessa barra, la pagina che scatta su
       e giù finché non arriva alla sezione dopo.

       La barra degli indirizzi che si ritira: la finestra si allunga sotto
       un palco alto `100svh` e in fondo resta scoperta una striscia, che si
       legge come una sezione tagliata.

       `normalizeScroll` toglie tutte e due: lo scroll passa in JavaScript,
       l'inerzia la governa GSAP e la barra non si muove più. È quello che
       GSAP prescrive per i pin con scrub su iOS. La deck resta fuori
       (`ignore`): lì il dito trascina le card, e sotto il dito la pagina
       deve continuare a scorrere come prima. */
    const normalized =
      ScrollTrigger.isTouch === 1
        ? ScrollTrigger.normalizeScroll({
            type: 'touch',
            allowNestedScroll: true,
            ignore: '.deck',
          })
        : undefined;

    // `smoothTouch` resta 0 (default): su touch lo scroll è quello nativo.
    const smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: CAMERA.smooth,
      effects: false,
    });

    let lastId: SetId | null = null;

    /* ---- I magneti ---------------------------------------------------
       `ScrollTrigger.snap` qui non si può usare: con ScrollSmoother lo
       scroller è il wrapper, e il tween dello snap scrive su `st.scroll()`,
       che con lo smoother non muove la pagina — misurato: gli si chiede
       1709, finisce a 2 e si porta dietro tutto a zero. Il magnete quindi è
       nostro, ma i numeri sono quelli di `momento-1`: 0,15 s di attesa,
       0,4–0,9 s di corsa, `power2.inOut`, e dentro un HOLD non si muove
       niente (lo decide `snapProgress`).

       La durata cresce con la distanza: completare gli ultimi dieci vh di
       una transizione e attraversarne novanta non sono lo stesso gesto. */
    const magnet = { at: 0 };
    let pull: gsap.core.Tween | undefined;
    let wait: gsap.core.Tween | undefined;

    const release = () => {
      wait?.kill();
      wait = undefined;
      pull?.kill();
      pull = undefined;
    };

    const attract = () => {
      if (!SNAP.touch && ScrollTrigger.isTouch === 1) return;
      const st = ScrollTrigger.getById('stage');
      if (!st || pull) return;
      const target = snapProgress(st.progress, st.direction);
      if (Math.abs(target - st.progress) < 0.001) return;
      const to = st.start + target * (st.end - st.start);
      magnet.at = smoother.scrollTop();
      const far = Math.min(1, Math.abs(to - magnet.at) / (window.innerHeight * 1.5));
      pull = gsap.to(magnet, {
        at: to,
        duration: SNAP.duration.min + far * (SNAP.duration.max - SNAP.duration.min),
        ease: SNAP.ease,
        onUpdate: () => smoother.scrollTop(magnet.at),
        onComplete: () => {
          pull = undefined;
        },
      });
    };

    /* Quando parte il magnete.

       Servono due condizioni, e ci vogliono tutte e due. `scrollEnd` dice
       che l'input è finito — il dito, la rotella —, ed è quello che mancava
       su touch: prima il magnete partiva da un timer di 0,15 s riarmato a
       ogni aggiornamento, e quel timer scadeva *dentro* l'inerzia del
       browser, con due mani sulla stessa barra.

       Ma `scrollEnd` da solo non basta su desktop: lì lo smoother continua
       a muovere la camera per un altro secondo dopo che la barra si è
       fermata, e un magnete che parte in quel mentre legge una progress
       vecchia e tira verso l'HOLD sbagliato (misurato: fermandosi a 460vh
       non partiva affatto, perché a `scrollEnd` la camera era ancora a
       365). Quindi dopo `scrollEnd` si aspetta che si fermi anche la
       camera: si guarda la progress ogni 0,15 s finché due letture di fila
       non sono uguali. */
    /** Meno di un vh e mezzo fra un controllo e l'altro (≈ 37 vh al
     *  secondo): la camera sta finendo di posarsi, e il magnete può
     *  prendere il suo posto senza strappi — il tratto che sceglie è già
     *  quello giusto. Più fine di così si aspetta mezzo secondo di coda
     *  esponenziale dello smoother per niente. */
    const STILL = 1.5 / STAGE_VH;
    let seen = -1;
    const settled = () => {
      const st = ScrollTrigger.getById('stage');
      if (!st) return;
      if (Math.abs(st.progress - seen) > STILL) {
        seen = st.progress;
        wait = gsap.delayedCall(SNAP.check, settled);
        return;
      }
      attract();
    };
    const onScrollEnd = () => {
      wait?.kill();
      seen = -1;
      wait = gsap.delayedCall(SNAP.delay, settled);
    };
    ScrollTrigger.addEventListener('scrollEnd', onScrollEnd);

    // Chi tocca lo scroll ha sempre ragione: il magnete si stacca subito.
    const interrupt = () => release();
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt);

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

      // `autoAlpha` e non `opacity`: a opacità 0 un set resta nel layout, si
      // fa toccare e — se il suo contenuto è più alto dello schermo — sborda
      // dal proprio riquadro e si vede lo stesso. Sul telefono era così che
      // "Parliamone." compariva in fondo a ogni sezione. `autoAlpha` porta
      // con sé `visibility: hidden`, che toglie il set da tutto e non
      // appiattisce il 3D come farebbe un `display: none`.
      gsap.set(lines, { z: () => MOVE.statementZ * amplitude(), autoAlpha: 0 });
      // La stanza non ha opacità: è solo tradotta sotto il bordo. Finché non
      // comincia a salire (T3) resta nascosta anche lei.
      gsap.set(stanza, { yPercent: 100, visibility: 'hidden' });
      gsap.set(salaLeaf, { scale: MOVE.salaScaleIn });
      gsap.set(salaVeil, { opacity: 1 });
      gsap.set(sala, { autoAlpha: 0 });

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
            // Un trigger solo: la progress la calcola questo, gli altri set
            // se la fanno dare (`lib/stageProgress`).
            publishProgress(self.progress);
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
        .to(reelScreen, { autoAlpha: 0, duration: 30 }, 120)
        // Il colore del fondo dello Studio e' una prova aperta: con
        // `STAGE_BG = 'void'` questo tratto non cambia niente e lo spazio
        // resta nero da cima a fondo.
        .to(root, { backgroundColor: COLORS[STAGE_BG], duration: 90 }, 60)
        .to(lightSala, { opacity: 1, duration: 60, ease: 'power1.out' }, 80)
        .to(
          lines,
          { z: 0, autoAlpha: 1, duration: T1.lines.duration, stagger: T1.lines.stagger, ease: 'power2.out' },
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
        .to(lines, { autoAlpha: 0, duration: 50, ease: 'power1.in' }, 250)
        .to(lightSala, { opacity: 0, duration: 50 }, 240)
        .to(root, { backgroundColor: COLORS.void, duration: 60 }, 240)
        .to(sala, { autoAlpha: 1, duration: 30 }, 260)
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
        .to(sala, { autoAlpha: 0, duration: 30 }, 465)
        .set(stanza, { visibility: 'visible' }, 420)
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
      spegniSonda();
      window.removeEventListener('orientationchange', rimisura);
      document.removeEventListener('fullscreenchange', rimisura);
      document.removeEventListener('webkitendfullscreen', rimisura, true);
      html.style.removeProperty('--stage-h');
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('keydown', interrupt);
      ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
      release();
      ctx.revert();
      smoother.kill();
      if (normalized) ScrollTrigger.normalizeScroll(false);
      if (import.meta.env.DEV) delete (window as unknown as { __lock?: unknown }).__lock;
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
