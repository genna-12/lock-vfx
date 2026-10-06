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
  holdScroll,
  snapProgress,
} from '../../lib/camera';
import { annunciaCarrellata } from '../../lib/carrellataViva';
import { publishProgress, setStageStatic } from '../../lib/stageProgress';
import { aScrollFermo } from '../../lib/scrollProgrammato';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/**
 * La carrellata: la camera che attraversa lo spazio, e tutto ciò che sa di
 * GSAP.
 *
 * Perché sta in un file suo. Questo modulo — ScrollTrigger, ScrollSmoother e
 * la timeline — vale **23,5 kB compressi**, e serve *solo* al ramo
 * non-touch: sul telefono la carrellata non c'è affatto
 * (`mobile-semplice-spec.md` §1), e fino a ieri quei kB si scaricavano lo
 * stesso per non essere mai eseguiti. Ora lo Stage lo chiede con un
 * `import()` e solo dove serve; chi apre il sito da un telefono non lo vede
 * passare (R24).
 *
 * Il **core** di gsap resta invece nel chunk iniziale, e non per
 * distrazione: lo usano il Loader — che è la prima cosa che si vede, su
 * qualunque schermo — e i `gsap.ticker` della Reel e della Sala. Toglierlo
 * vorrebbe dire riscrivere il gesto del lucchetto, che è la cosa più
 * misurata del sito: non è una rifinitura.
 *
 * Il contenuto è quello di prima, riga per riga: timeline, magneti,
 * `normalizeScroll`, lo smoother. L'unica aggiunta è l'annuncio in
 * `carrellataViva`, che è il modo in cui il marchio, la nav e i link interni
 * scoprono *sul momento* — dentro un handler di click, senza aspettare una
 * promessa — che qui c'è una camera da muovere.
 *
 * Regola del 3D, imparata rompendola: dentro `.world` niente `will-change`,
 * niente `opacity` < 1 sui contenitori e niente `overflow` diverso da
 * `visible` — ognuna di queste tre cose appiattisce il `preserve-3d` e la
 * profondità sparisce. L'opacità si anima sulle foglie: sullo `screen` della
 * reel e sulle singole righe dello statement, mai sui loro wrapper (il
 * wrapper dello statement è proprio l'elemento che viaggia in z durante T2).
 *
 * Lo smoother va creato PRIMA dei ScrollTrigger che lo useranno: è l'altra
 * ragione per cui tutto questo sta in una funzione sola.
 */

/**
 * Quando lo Statement è in scena: dalla fine di T1 (le righe sono arrivate)
 * all'inizio di T2 (la camera comincia ad attraversarlo). Fuori di qui è
 * `inert`, altrimenti il link alla pagina Studio resterebbe cliccabile e
 * raggiungibile col tab anche a opacità 0.
 */
const STUDIO_LIVE = { from: 150 / STAGE_VH, to: 300 / STAGE_VH } as const;

/** Monta la carrellata su `root`. Ritorna la disdetta. */
export function montaCarrellata(root: HTMLElement, notify: (id: SetId) => void): () => void {
  const html = document.documentElement;
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
     una transizione e attraversarne novanta non sono lo stesso gesto.

     Il magnete muove la **barra**, non il contenuto: `scrollTo(v, true)`,
     e la camera la raggiunge con la stessa scia della rotella. Prima
     scriveva `smoother.scrollTop(v)` a ogni fotogramma, che è il salto
     secco: dentro GSAP alza `isProxyScrolling`, e al fotogramma dopo lo
     smoother uccide la propria scia e resta dov'è. Un tacco di rotella
     arrivato durante la trazione veniva così ingoiato — misurato il 5/10:
     barra a 732, contenuto fermo a 632 per 1,2 s — e la trazione dopo,
     partendo dal contenuto, riportava indietro la barra (746 → 632): il
     tacco cancellato. */
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
    magnet.at = window.scrollY;
    const far = Math.min(1, Math.abs(to - magnet.at) / (window.innerHeight * 1.5));
    pull = gsap.to(magnet, {
      at: to,
      duration: SNAP.duration.min + far * (SNAP.duration.max - SNAP.duration.min),
      ease: SNAP.ease,
      onUpdate: () => smoother.scrollTo(magnet.at, true),
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
  /** L'ultimo gesto sullo scroll (`interrupt`, qui sotto). */
  let lastInput = 0;
  const settled = () => {
    const st = ScrollTrigger.getById('stage');
    if (!st) return;
    // E la mano dev'essere ferma da `SNAP.idle`: senza, il magnete partiva
    // nella pausa fra due tacchi di una rotella lenta (`camera.ts`).
    const handBusy = performance.now() - lastInput < SNAP.idle * 1000;
    if (Math.abs(st.progress - seen) > STILL || handBusy) {
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
  const interrupt = () => {
    lastInput = performance.now();
    release();
  };
  window.addEventListener('wheel', interrupt, { passive: true });
  window.addEventListener('touchstart', interrupt, { passive: true });
  // Dalla tastiera interrompono solo i tasti che scorrono: Tab, Invio o una
  // lettera non sono un gesto sullo scroll e non devono fermare la corsa.
  const TASTI_SCROLL = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);
  const interruptTasto = (e: KeyboardEvent) => {
    if (TASTI_SCROLL.has(e.key)) interrupt();
  };
  window.addEventListener('keydown', interruptTasto);

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

    /* Due layer suoi, e il conto dei fotogrammi torna.

       Con lo smoother `#smooth-content` è un unico layer alto 6 769 px che
       si muove in `matrix3d`, e il palco ci resta fermo sopra perché il pin
       gli scrive a ogni fotogramma una `translate` uguale e contraria. Una
       `translate` 2D Chrome non la promuove: il palco veniva ridipinto e
       **ri-rasterizzato** dentro il layer del contenuto a ogni fotogramma,
       HOLD compresi. Misurato il 5/10 da 160 a 380 vh: 9 896 tile in 4,8 s
       contro 16 con lo scroll nativo. Lo stesso per le luci, che sono
       opacità animate da GSAP e quindi ridipinte, non composte.

       `.stage` e le luci stanno FUORI da `.world`: qui `will-change` non
       appiattisce niente. Su `.world` e dentro resta vietato (sopra). */
    gsap.set(root, { willChange: 'transform' });
    gsap.set([lightSala, lightTaglio], { willChange: 'opacity' });

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

  /* ---- la corsa: marchio → in cima, link del footer, «Scrivici» ------
     Come il magnete: si anima un numero e a ogni fotogramma si sposta la
     **barra** (`scrollTo(v, true)`), e la camera la segue con la sua scia.
     Prima si animava `scrollTop` dello smoother, che è il salto secco: alza
     `isProxyScrolling`, e dopo la corsa una barra trascinata (o «trova
     nella pagina», o uno `scrollTo`) muoveva la barra ma non la pagina —
     misurato dalla QA: barra a 300 vh, contenuto fermo a 0 (D3).

     La corsa occupa il posto del magnete (`pull`): finché va, il magnete
     non parte, e il primo gesto sullo scroll la stacca con lo stesso
     `interrupt` — chi tocca lo scroll ha sempre ragione. */
  const corsa = (meta: number, arrivato?: () => void) => {
    release();
    const proxy = { at: window.scrollY };
    pull = gsap.to(proxy, {
      at: meta,
      duration: CAMERA.smooth,
      ease: CAMERA.t1,
      onUpdate: () => smoother.scrollTo(proxy.at, true),
      onComplete: () => {
        pull = undefined;
        arrivato?.();
      },
    });
  };

  /* ---- chi muove la camera, per chi non sa che esista ----------------
     Il marchio, la nav e i link interni chiedono qui. Le tre funzioni sono
     quelle di prima, spostate: `inCima.ts` e `agganci.ts` non importano più
     gsap, e restano nel chunk iniziale. */
  annunciaCarrellata({
    inCima: () => corsa(0),
    vaiAllHold: (id) => {
      const st = ScrollTrigger.getById('stage');
      if (!st) return;
      smoother.scrollTo(holdScroll(st, id), true);
    },
    vaiAlSet: (id, modo, arrivato) => {
      const st = ScrollTrigger.getById('stage');
      if (!st) {
        arrivato();
        return;
      }
      const meta = holdScroll(st, id);
      if (modo === 'stacco') {
        smoother.scrollTop(meta);
        /* Il bersaglio si ricontrolla a pagina ferma. Una volta su cinque
           la QA ha visto l'arrivo su `#contact` finire a 620 vh, col footer
           in vista: qualcosa — un refresh delle misure dopo i font, il
           salto all'ancora del browser — sposta la barra dopo lo stacco.
           Se nel frattempo nessuno ha toccato lo scroll e la barra non è
           dove deve, si rifà lo stacco: l'HOLD è il posto, non un'ipotesi. */
        let toccato = false;
        const tocca = () => {
          toccato = true;
        };
        const eventi = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
        for (const e of eventi) window.addEventListener(e, tocca, { passive: true, once: true });
        aScrollFermo(() => {
          for (const e of eventi) window.removeEventListener(e, tocca);
          const ora = ScrollTrigger.getById('stage');
          if (!toccato && ora) {
            const giusto = holdScroll(ora, id);
            if (Math.abs(window.scrollY - giusto) > 2) smoother.scrollTop(giusto);
          }
          arrivato();
        });
        return;
      }
      corsa(meta, arrivato);
    },
  });

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
    annunciaCarrellata(null);
    window.removeEventListener('orientationchange', rimisura);
    document.removeEventListener('fullscreenchange', rimisura);
    document.removeEventListener('webkitendfullscreen', rimisura, true);
    html.style.removeProperty('--stage-h');
    window.removeEventListener('wheel', interrupt);
    window.removeEventListener('touchstart', interrupt);
    window.removeEventListener('keydown', interruptTasto);
    ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
    release();
    ctx.revert();
    smoother.kill();
    if (normalized) ScrollTrigger.normalizeScroll(false);
    if (import.meta.env.DEV) delete (window as unknown as { __lock?: unknown }).__lock;
  };
}
