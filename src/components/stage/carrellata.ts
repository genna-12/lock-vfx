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

  /* ---- chi muove la camera, per chi non sa che esista ----------------
     Il marchio, la nav e i link interni chiedono qui. Le tre funzioni sono
     quelle di prima, spostate: `inCima.ts` e `agganci.ts` non importano più
     gsap, e restano nel chunk iniziale. */
  annunciaCarrellata({
    inCima: () => {
      /* `smoother.scrollTo(0, true)` qui non porta in cima, e il motivo è
         dentro GSAP: con `smooth` e lo smoother non in pausa si limita a
         spostare la **barra** e lascia che sia la camera a raggiungerla da
         sola. Con il pin da 560vh la camera non la raggiunge — misurato
         dalla Sala: barra a 0, contenuto fermo a −3 285, cioè la pagina non
         si muove di un pixel. Si anima quindi la posizione dello smoother,
         che è esattamente quello che GSAP stesso fa quando lo smoother è in
         pausa: ogni fotogramma scrive la barra e la camera insieme.

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
    },
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
        arrivato();
        return;
      }
      gsap.to(smoother, {
        scrollTop: meta,
        duration: CAMERA.smooth,
        ease: CAMERA.t1,
        overwrite: 'auto',
        onComplete: arrivato,
      });
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
    window.removeEventListener('keydown', interrupt);
    ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
    release();
    ctx.revert();
    smoother.kill();
    if (normalized) ScrollTrigger.normalizeScroll(false);
    if (import.meta.env.DEV) delete (window as unknown as { __lock?: unknown }).__lock;
  };
}
