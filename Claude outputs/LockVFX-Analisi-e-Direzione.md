# LockVFX Studio — Analisi del progetto e direzione creativa (v2)

*v2 — 6 settembre 2026. Rispetto alla v1: (1) corretto il bias da campione ridotto — LockVFX è uno studio VFX completo a 360° per cinema e spot (compositing, 3D/CGI, matte painting, environment, cleanup, simulation, finishing), le immagini in `public/images/lens` sono solo un frame campione; tutto ciò che nella v1 ruotava attorno a "giorno → notte" è stato rimosso. (2) Il wipe prima/dopo è confermato come signature principale, in quanto linguaggio universale della post-produzione. (3) Aggiunto il passaggio visivo dal vivo su `localhost:5173` (desktop 1230×694 e mobile 375×812), che ha confermato la diagnosi e fatto emergere un bug reale. (4) Direzioni creative riscritte di conseguenza.*

*Fase 0 — solo analisi, nessuna modifica al codice. Base: repository `lock-vfx` (stato working tree al 6 settembre 2026, inclusi i file non committati), asset in `public/` e `src/assets/`, `reference/glassreference.txt`.*

*Nota di metodo: il codice è stato letto integralmente (≈2.000 righe TSX/TS, config, locales, asset, modello GLB) e il sito è stato guardato dal vivo nel browser (vedi sezione B, "Il sito dal vivo").*

---

## A. Executive Summary

Il progetto oggi è **un prototipo di scena scrollytelling molto curato, non ancora un sito**: esiste solo la Home (una sequenza sticky di 600vh con lucchetto 3D, lente RAW/EDITED, polaroid e pellicola clienti) più un footer. Portfolio, About e Contatti non esistono (la versione precedente li aveva, ma erano template generici con clienti finti e sono stati cancellati, correttamente).

Il problema principale non è tecnico e non è di "quantità di effetti": è che **il sito non dice mai chi è LockVFX, cosa fa e per chi**, e lo fa con un linguaggio visivo che somma sei metafore diverse (monitor di regia, tubo catodico, polaroid, pellicola 35mm, vetro iOS, glitch sci-fi) senza che nessuna sia davvero *di* LockVFX. Il protagonista della Home è il logo (il lucchetto 3D), non il lavoro. E il lavoro di LockVFX — VFX a 360° per cinema e spot, dal compositing invisibile alla CGI, dal matte painting alle simulazioni — è per sua natura **fotografico**: deve reggere accanto al girato. Il registro "cyber/HUD/glitch" che il sito sta costruendo è quello del gaming e del motion design, non quello di uno studio che lavora dentro il fotogramma. (Il frame campione in `public/images/lens`, un day-for-night, lo conferma — ma è solo un campione: la direzione non deve dipendere da quel tipo di shot.)

La buona notizia: dentro il progetto ci sono già i tre elementi giusti, solo che sono trattati come dettagli. La **lente RAW→EDITED** è l'unica interazione che *significa* qualcosa (è letteralmente il prodotto). Il **logo** (un lucchetto il cui corpo è una pellicola con le perforazioni) contiene un sistema grafico ownable che nessuno sta usando. E il **nome** — Lock — vive già nel vocabolario del cinema: *picture lock* è il momento in cui il montaggio viene bloccato e il lavoro di VFX, color e finishing comincia. Nessuno nel progetto ha ancora usato questo significato: il lucchetto è trattato come un oggetto di sicurezza (easter egg "si sblocca", entrata "dalla serratura").

**Raccomandazione in una riga:** non buttare via, ma ribaltare le priorità. Evolvere "Obsidian & Crimson" in una direzione che chiamo **"Picture Lock"**: il lavoro in primo piano, il *reveal prima/dopo* come linguaggio di interazione di tutto il sito, un sistema grafico derivato dalle perforazioni del logo, tipografia con carattere (oggi il sito usa i font di sistema), il rosso usato come *segnale* e non come atmosfera, il 3D ridotto a due momenti di firma invece che a 600vh di mascotte. Il Director's Monitor così com'è (bracket, REC, timecode, scanline) va ritirato: è la grammatica più generica dei siti "cinematici" e appartiene al reparto camera, non alla post-produzione.

---

## B. Cosa abbiamo oggi

### Struttura e architettura

- **Stack**: React 19, TypeScript 6, Vite 8 (rolldown), Tailwind v4 (via plugin, nessun `@theme` custom), Framer Motion 12, GSAP + ScrollTrigger, R3F 9 + Drei 10 + Three 0.185, maath, react-router 7, i18next, lucide-react. `tsc -b` passa pulito.
- **Routing**: `App.tsx` definisce una sola route (`/`). La navbar linka `/portfolio`, `/about`, `/contact`: oggi portano a una pagina vuota (solo navbar e cursore).
- **Pagine**: `HomePage` = `<MasterLockScene/>` + `<SiteFooter/>`. Fine.
- **Componenti** (≈2.000 righe totali):
  - `sections/MasterLockScene.tsx` (418 righe): il cuore. Contenitore `h-[600vh]` con figlio sticky `h-screen`. Cinque stage su `scrollYProgress` (showreel 0–0.15, ingress 0.15–0.35, lens 0.35–0.6, clients 0.6–0.85, footer 0.85–1). Contiene il `<Canvas>` (luci, `Environment preset="city"`, `<Float>` che avvolge lucchetto **e** pannello lente), gli overlay DOM di ogni stage, il `DirectorHUD`, le barre letterbox che pulsano ai confini di stage, e il magnete di scroll GSAP su `[0, 0.08, 0.47, 0.72, 1]`.
  - `three/LockModel.tsx`: carica `lock-vfx-studio.glb` (nodi `Body`, `Shackle`), materiali sostituiti (Body crimson emissivo pulsante, Shackle argento). `three/GlassLensPanel.tsx`: piano con immagine EDITED + disco con shader custom che campiona la RAW sotto il puntatore, rifrazione+aberrazione cromatica solo sul bordo. `scrollEnvelope.ts`, `mathUtils.ts` (smoothstep, edgeFollow): piccoli, puliti, riusabili. `AmbientParticles.tsx`: **non usato da nessuno**.
  - `ui/DirectorHUD.tsx`: 4 bracket crimson agli angoli, pallino "REC" pulsante, timecode SMPTE finto (`p * 5999` frame), due scanline che scorrono.
  - `ui/GlassPanel.tsx`: pannello vetro con tilt 3D + spotlight che segue il mouse. Usato solo dalla CTA del footer.
  - `ui/CustomCursor.tsx`: cursore custom (anello crimson, modalità default/lens/click/grab), nasconde il cursore nativo con `cursor: none !important` globale.
  - `ui/PolaroidCard.tsx` (5 istanze, riquadro grigio placeholder, nomi clienti inventati, evidenziatore rosso randomizzato all'hover, "nudge" magnetico verso il mouse con listener `mousemove` globale per card), `ui/FilmStripMarquee.tsx` (pellicola 35mm con 7 loghi placeholder), `ui/StageReveal.tsx` (reveal a cascata blur+spring, ben fatto), `ui/AmbientBackground.tsx` (blob crimson + blob ciano sfocati 140–160px animati, grana SVG feTurbulence full-screen).
  - `layout/LockVfxNavbar.tsx` (301 righe, 13 commit "navbar v3…v9"): dock a pillola glass con icone lucide, toggle lock/unlock, auto-collasso dopo 3,5 s di inattività e in scroll verso il basso, variante mobile in basso. `ui/LanguageSwitcher.tsx`: pillola glass con codice lingua. `layout/SiteFooter.tsx`: CTA glass "Parliamone su info@lockvfx.com", colonne, social placeholder, riga "Obsidian & Crimson".
- **Brand**: `src/brand/tokens.ts` dichiara palette, coppia tipografica (Space Grotesk + JetBrains Mono), easing con nome, `HUD_MOTIF`. **È importato solo da `DirectorHUD`** (per `HUD_MOTIF`); i colori sono hardcoded 28 volte (`#E60B18`) nei componenti; i font dichiarati **non vengono caricati da nessuna parte** (nessun `@font-face`, nessun link Google Fonts, nessun `@theme`): il sito gira sui font di sistema di Tailwind (`font-sans` = stack ui-sans-serif, `font-mono` = ui-monospace).
- **i18n**: `it.json` e `en.json` esistono (con copy tipo "Plasmiamo la Realtà Cinematografica" / "We Craft Cinematic Reality"), ma **nessun componente usa `t()`**: tutti i testi sono hardcoded in italiano. Il language switcher cambia lingua e non succede nulla. (Il francese citato in passato non esiste.)
- **Asset**: `logo.png` 1920² (**mai usato nel sito**); `showreel-poster.webp` 2560×1782 (313 KB, un frame notturno dall'alto, presumibilmente dello stesso progetto); 2 coppie RAW/EDITED 2560×1781 (52–98 KB ciascuna, ottime); `lock-vfx-studio.glb` 1,19 MB non compresso, 21k triangoli, nessuna texture, entrambi i materiali rosso piatto. `favicon.svg` è **l'icona viola di React Bits**, `icons.svg` contiene icone Bluesky/Discord: avanzi di template. `index.html` ha `<title>lock-vfx</title>`, nessun meta, `lang="en"`. `README.md` è quello del template Vite.
- **Reference**: `glassreference.txt` è il componente `FluidGlass` di React Bits (MeshTransmissionMaterial + FBO). La lente attuale ne è una derivazione semplificata e migliore (niente FBO: campiona direttamente la texture).
- **Git**: ultimo commit "navbar v9"; **tutto il lavoro attuale (scene, three, brand, hooks, asset) è non committato**, insieme alla cancellazione di 15 file della versione precedente. Un crash del disco oggi cancellerebbe la Home.

### Il modello 3D, visto da vicino

Ho analizzato la geometria: il `Body` è **un'estrusione letterale del logo 2D** (contorno a "D" con foro serratura e perforazioni, spesso 2 unità), il `Shackle` è un tubo. Non è un lucchetto scolpito: di fronte è il logo, di profilo è una lastra. Questo conta per la direzione: ruotarlo di 360° per 600vh (come fa oggi) ne mostra i limiti; usarlo di fronte, con rotazioni contenute, come *marchio con profondità* lo valorizza. Le perforazioni sono modellate: una luce radente le rende leggibili — è il dettaglio più bello del modello.

### Le immagini reali

Le coppie RAW/EDITED sono un frame campione casuale di lavoro reale (un day-for-night: plate diurno piatto trasformato in notte con luna, luci pratiche, calore sui volti). Non rappresentano la specializzazione dello studio — LockVFX fa VFX completi, dal compositing alla CGI alle simulazioni — ma dicono due cose utili: che il lavoro deve reggere *accanto al girato*, e che il materiale prima/dopo esiste e funziona. Il portfolio dovrà mostrare la **gamma**: environment/matte painting, integrazione CG, cleanup, FX/simulation, finishing — con la stessa interazione per tutti. (Attenzione ai diritti: i frame includono una persona riconoscibile e appartengono a una produzione; prima del lancio serve l'ok di produzione/talent per l'uso promozionale.)

### Il sito dal vivo

Il passaggio nel browser (desktop 1230×694, mobile 375×812) ha confermato la lettura del codice e aggiunto quattro cose che dal codice non si vedevano:

1. **Il lucchetto copre il testo.** Nello stage "Vision" la posizione del lucchetto è interpolata su tutto lo stage, quindi per la maggior parte dello scroll (e nel punto di snap 0.47) sta esattamente sopra "Precisione nel compositing". Su mobile è anche mezzo fuori schermo, e il pannello lente appare come una striscia tagliata sul bordo destro.
2. **Il materiale del lucchetto legge come plastica lucida**, non come oggetto cinematografico: rosso saturo, riflessi netti dell'HDR "city", staffa cromata. Di profilo (stage clienti, stage footer) si vede chiaramente la lastra dell'estrusione.
3. **La lente circolare è ambigua.** Il disco RAW dentro il comp sembra una macchia di nebbia, non un "prima": niente lo etichetta, e un disco non ha una direzione di lettura. Il wipe lineare — con una linea e due etichette — è immediatamente comprensibile. Questa osservazione pesa sulla scelta della signature (vedi G/I).
4. **Bug reale: il poster dello showreel resta visibile per tutta la scena.** Misurato: a `p=0.47` l'opacità computata del wrapper è 0,376, a `p=1` torna a 1 (dovrebbe essere 0 da `p=0.15` in poi). Sull'elemento c'è una Web Animation nativa con `ViewTimeline` creata da Framer Motion (`useScroll` + `useTransform` → `style.opacity`), e il suo range non coincide con il `scrollYProgress` JS calcolato sull'offset `['start start','end end']` del contenitore sticky di 600vh. Risultato: il girato "fantasma" dietro tutti gli stage (si vede nello stage clienti e nel footer-stage). Da verificare in Fase 0; il fix probabile è non affidare a Framer l'animazione nativa degli overlay di stage (scrivere l'opacità via `useMotionValueEvent` su ref, o usare `useTransform` con un MotionValue non collegato allo ScrollTimeline).

Anche a schermo, il primo frame è un fermo immagine al 70% con un pulsante-lucchetto a sinistra, una pillola "IT" a destra, "REC" e un timecode: nessuna parola, nessun nome. Il footer è corretto ma anonimo. Le console non riporta errori dell'app (solo i tentativi di HMR di Vite dal pannello browser).

---

## C. Cosa funziona (da preservare e sviluppare)

1. **La lente RAW → EDITED.** È l'unica cosa nel sito che racconta *cosa fa LockVFX* senza parole. Tecnicamente è anche la parte migliore del codice: shader piccolo e sensato (nucleo nitido, rifrazione solo sul bordo), niente FBO, `edgeFollow` per il comportamento al bordo. Va promossa da "dettaglio dello stage 2" a **linguaggio di interazione di tutto il sito**.
2. **Il logo.** Lucchetto + pellicola in un unico segno, rosso su nero. Contiene già la tavolozza e un pattern (la colonna di perforazioni) da cui derivare l'intero sistema grafico. Oggi non appare nemmeno nel sito.
3. **Il modello 3D reale** con `Body`/`Shackle` separati: consente l'unico gesto 3D che ha senso narrativo (la staffa che si chiude = *lock*).
4. **L'impianto scroll**: contenitore alto + figlio sticky + `useScroll` + `useFrame` con damping maath è la tecnica giusta, leggera e controllabile. `scrollEnvelope`/`smoothstep` puramente funzione di `p` (nessun ritardo) è una scelta corretta.
5. **`StageReveal`** (blur + molla a cascata, con il fix del filter in tween): un buon pezzo di motion di sistema, riusabile ovunque.
6. **`tokens.ts` come intenzione**: l'idea di dichiarare ruoli per i colori, easing con nome, una voce di brand è giusta. Va solo *collegata* al resto (Tailwind `@theme`, font reali).
7. **Igiene del codice**: TypeScript stretto passa, componenti piccoli e con responsabilità chiare, commenti che spiegano i *perché* (a volte troppo, e un paio sono ormai contraddittori, es. i due commenti sui bracket in `DirectorHUD`). Le fondamenta non richiedono riscrittura.
8. **La decisione di cancellare la v1** (glass card, clienti finti "Warner/Netflix", video mixkit): era il sito che avrebbe potuto essere di chiunque. L'istinto è stato quello giusto.

---

## D. Cosa non funziona

### Concettuale e di brand

- **Zero posizionamento.** Nessun `<h1>`, nessuna frase che dica "studio di effetti visivi per il cinema, [dove], facciamo X". Il primo schermo è un fermo immagine al 70% di opacità con bracket rossi, "REC" e un timecode: chi arriva non sa cosa sta guardando né di chi è. Il nome LockVFX compare solo nel footer.
- **Sei metafore in una pagina.** Monitor di regia (bracket/REC/timecode), tubo catodico (scanline), polaroid su bacheca, pellicola 35mm, vetro liquido iOS, glitch cromatico sci-fi (+ blob ciano e grana). Ognuna è "cinematica" a modo suo; insieme non descrivono un'epoca, un materiale o un'idea. Questa è la definizione operativa di "sembra generato dall'AI": accumulo di trend riconoscibili.
- **Il logo è il protagonista, non il lavoro.** Il lucchetto entra volando, gira, si apre, migra da un angolo all'altro per l'intera Home; le immagini reali sono relegate a un riquadro 3,6×2,5 unità a destra nello stage 2, nascosto su mobile.
- **Il registro è sbagliato rispetto al lavoro reale.** Emissivo rosso pulsante, glitch, HUD: il vocabolario del gaming/sci-fi. Il lavoro reale è naturalistico e invisibile. Chi decide (produttori, VFX supervisor, DoP) legge il registro come segnale di *che tipo* di studio sei.
- **Contenuti finti e placeholder esposti**: "Northlight Films", "Reel Eight", "Orbital Studio" nelle polaroid e nella pellicola. Per uno studio appena nato una "parete clienti" con loghi è la sezione più rischiosa: o è vuota, o è finta. Meglio non averla che averla così.
- **Il lucchetto come "sicurezza"** (easter egg "si sblocca", entrata dalla serratura, nav con toggle lock/unlock): è il significato più ovvio e meno cinematografico del nome.

### UX

- **Orientamento**: nav a sole icone che si nasconde da sola dopo 3,5 s e allo scroll; per un sito di 4 pagine è un ostacolo, non un'eleganza. Ha assorbito 13 commit.
- **Scroll hijack**: snap direzionale su tutta la timeline (0→1). Il magnete "accompagna" ma toglie controllo; su trackpad e mobile queste cose spesso vengono percepite come scatti.
- **600vh di scroll per ~3 informazioni** (una frase di vision, due coppie di immagini, clienti finti). La densità è bassissima: il rapporto tra scroll richiesto e contenuto ricevuto è sbilanciato.
- **Nessun percorso verso portfolio/about/contatti**: le route non esistono; il footer è l'unico contatto (mailto).
- **Mobile**: lente, frecce, polaroid e pellicola sono `hidden md:*`; il Canvas 3D però gira lo stesso, e con fov 40 a z=7 la larghezza di viewport su uno schermo verticale è ≈2,5 unità: il lucchetto a x=±2,6 e la lente a x=2,9 **escono dal frame**. Su mobile la Home è: poster, testo, lucchetto che sparisce di lato, footer.
- **Cursore nativo eliminato** con `!important` ovunque: l'anello rosso è una firma debole e un costo di accessibilità/usabilità certo (utenti con problemi di precisione, screen recording, form).

### Visivo/tipografico

- **Nessuna identità tipografica**: font di sistema (Segoe UI su Windows, SF su Mac). I "titoli leggeri" in `font-light` con una parola in `font-semibold` rosso sono il pattern più comune del web dark del 2024–26.
- **Il rosso è ovunque** (blob, cursore, bracket, REC, particelle, emissivo, linee, evidenziatore, glitch): quando un accento è ovunque non è più un accento. In più compare un **ciano** non dichiarato (blob, bordo destro dei glass panel, split cromatico): due tinte sature = estetica "RGB gaming".
- **Vetro senza ragione**: nav, switcher, tooltip, CTA footer sono di vetro; ma non c'è nulla di significativo dietro da rifrangere (fondo #020202). Il vetro ha senso *solo* dove è una lente su un'immagine.

### Tecnico

- **Dipendenze esterne a runtime**: `Environment preset="city"` scarica `potsdamer_platz_1k.hdr` (≈1,5 MB) da `raw.githack.com` a ogni visita fredda. Un sito di produzione non può dipendere da un CDN GitHub di terzi.
- **GLB 1,19 MB non compresso** (Draco/meshopt lo porterebbero a ~150–250 KB) e Shackle con normali non saldate (28k vertici per 15k triangoli).
- **Un solo bundle**: three + drei + gsap + framer + router + i18n caricati subito, anche per pagine future senza 3D. Nessun `React.lazy`, nessun preload reale (il loader immaginato non esiste).
- **Canvas sempre attivo** (`frameloop` default) con `Float` + `Environment` + 3 luci + `easing.damp*` ogni frame anche a scroll fermo; il `Float` avvolge anche il pannello lente, che quindi ondeggia (effetto collaterale, non scelta).
- **Costi di paint**: `backdrop-blur` su nav, language switcher, tooltip e CTA del footer, due blob da 60–70vw con `blur(140–160px)` animati, grana `feTurbulence` full-screen in `mix-blend-overlay`, letterbox che cambia `height` (layout) ai confini. Su laptop integrati e mobile è la ricetta per i 30 fps.
- **Reduced motion parziale**: CSS spegne le keyframe (con un `*` che azzera anche `animate-pulse`) e lo snap si disattiva, ma tutta l'esperienza (opacità degli stage, lucchetto, lente, reveal) resta guidata dal motion: chi chiede meno movimento riceve lo stesso sito, senza snap.
- **Accessibilità**: nessun `h1`; testi degli stage sempre nel DOM con `opacity: 0` (letti dagli screen reader fuori contesto); `lang="en"` con contenuti in italiano; contrasto del testo terziario `#6B7280` su `#020202` al limite per le label a 10 px.
- **Listener globali moltiplicati**: 5 polaroid × `mousemove` con `getBoundingClientRect`, navbar con `mousemove` che riarma un timer, cursore con `querySelector` throttled. Nessuno è grave; insieme sono rumore.
- **Tokens scollegati** (vedi B), i18n scollegato, `AmbientParticles` morto, favicon/icone/README/title da template, lavoro non committato.

---

## E. Valutazione di "Obsidian & Crimson"

**Cosa regge.** Il *fondo scuro* è giusto: il girato si guarda al buio, e un portfolio di frame lo pretende. Il *rosso* è giusto per una ragione semplice: è il colore del logo, e un brand appena nato non deve introdurre un secondo colore principale. La *coppia neutra* (ink/slate/graphite) è sensata. L'idea di dare a ogni colore un ruolo (`tokens.ts`) è corretta.

**Cosa non regge.** Nero + rosso non è un'identità: è la palette di default di streaming, gaming, motorsport e di metà dei siti "cinematici". Ciò che oggi caratterizza O&C non è la palette ma *l'uso* che ne fa — rosso come luce diffusa (blob, emissivo, glow) e il corredo HUD/glitch/vetro. Ed è proprio questo uso a renderla generica. Il ciano di contrasto è un'intrusione. Il "void" #020202 puro va bene come fondo del girato, meno bene come fondo di lettura per i testi lunghi (pagine About/Portfolio): serve un secondo nero leggermente sollevato (l'`obsidian` #08090C c'è già, va usato davvero).

**Verdetto: evolvere, non abbandonare — ma cambiando il *ruolo* del rosso.** Da atmosfera a **segnale**: il rosso è la tally light, il pallino "locked", la linea del wipe, il marchio. Compare in un punto per volta, sempre a piena saturazione, mai sfocato, mai come glow. Tutto il resto è neutro e lascia il colore alle immagini. Il nome "Obsidian & Crimson" può restare come nome della palette; non è il nome dell'identità.

---

## F. Valutazione del Director's Monitor

**Non è una firma, è un cliché.** Bracket agli angoli, REC pulsante, timecode, scanline, letterbox: è esattamente il kit che qualunque generatore produce alla parola "cinematic". Non c'è nulla che, coprendo il logo, lasci capire che si tratta di LockVFX. In più il vocabolario è quello sbagliato: REC e monitor sono il reparto camera *sul set*; LockVFX lavora in post. Il timecode è finto (`p × 5999`), e le cose finte, in un sito che vende precisione, sono un debito.

**Cosa può sopravvivere, trasformato.** L'intuizione sotto il Director's Monitor — "un accento tecnico riconoscibile che dice che qui si lavora sui frame" — è giusta. Ma va reso *vero e di post-produzione*: una riga di metadati di shot, in monospace, che appare solo sulle immagini reali e dice cose reali: `SH010 · plate → comp · 24 fps · LOCKED`. Un contatore di frame che conta i frame veri del video showreel (guidato da `currentTime`, non dallo scroll). Le crop mark dei bracket possono restare **solo** come bordo dell'area del wipe, dove "frame" significa qualcosa. Scanline e blob spariscono: il CRT non c'entra con un comp in ACES.

In sintesi: ritirare il Director's Monitor come cornice permanente; tenerne un erede — **la "slate"** (vedi G) — come dettaglio puntuale e autentico.

---

## G. Brand & Creative Opportunities

1. **Il nome è già un concetto: *picture lock*.** In post-produzione "picture lock" è il momento in cui il taglio è definitivo e VFX/color/finishing portano il film alla versione finale. Anche "lock-off" (inquadratura bloccata, quella su cui si girano i plate) è vocabolario del mestiere. LockVFX può possedere questa idea: *"dal picture lock al final"*, "we finish locked pictures". Il lucchetto smette di essere un oggetto di sicurezza e diventa un gesto di mestiere: **la staffa che si chiude = il frame è locked, finito, consegnato.** Nessun altro studio VFX può appropriarsene con la stessa naturalezza.
2. **Prima/dopo come linguaggio, non come feature.** Il wipe (la linea verticale che rivela il comp sopra il plate) è l'interazione più onesta e più universale della VFX: ogni shot ha un prima e un dopo, che sia un matte painting, una creatura CG o un cleanup invisibile. Se diventa *il modo in cui il sito rivela le cose* — hero, card del portfolio, hover, transizioni di pagina — l'interazione stessa diventa riconoscibile. La forma primaria è la **linea** (leggibile, direzionale, etichettabile: `PLATE | COMP`); il disco-lente attuale resta come forma secondaria, una *loupe* per ispezionare i dettagli nella pagina progetto, dove "guardare più da vicino" ha senso.
3. **Le perforazioni del logo come sistema grafico.** La colonna di rettangolini è: indice di scroll, divisore di sezione, tab del portfolio ("un frame per shot"), pattern nella pagina 404, texture del footer. È derivata dal marchio, quindi *nostra*; non è un'icona presa da lucide.
4. **La gamma dimostrata con un solo gesto.** Uno studio a 360° ha un problema di comunicazione preciso: dire "facciamo tutto" senza sembrare generici. La soluzione è *non dirlo*: lo stesso wipe, applicato in sequenza a uno shot di environment, uno di CG integration, uno di cleanup, uno di FX. La ripetizione del gesto costruisce la firma; la varietà degli shot costruisce la credibilità. La slate sotto ogni shot nomina la disciplina (`ENVIRONMENT`, `CG INTEGRATION`, `CLEANUP`, `FX`) — è così che il visitatore impara l'offerta senza leggere una lista di servizi.
5. **Cultura dei credits.** Il cinema ha una tipografia propria: il billing block (condensato, gerarchie strette), le slate, le shot list. Trattare ogni lavoro con *titolo, regia, DoP, anno, cosa abbiamo fatto* — invece di "clienti" — è più credibile per uno studio giovane e più cinematografico di qualunque bracket.
6. **La linea rossa.** Un unico segno derivato dal wipe: una hairline verticale crimson. Diventa cursore di reveal, indicatore di nav attiva, divisore, sottolineatura. Un solo gesto, ripetuto, è ciò che rende un brand riconoscibile a 20 metri.
7. **Grammatica del montaggio come motion language.** Stacchi netti e wipe invece di dissolvenze e blur; durate multiple di 1/24 s; "hold" prima dei cambi. Un sito che *si muove come un montaggio* si distingue da uno che si muove come un'app.
8. **Il breakdown scrubbabile.** Il contenuto più potente che uno studio VFX possa mostrare è il breakdown (plate → roto → CG → comp). Reso come sequenza di layer che si compongono con lo scroll è spettacolare *e* dice cosa fai. È il candidato naturale a sostituire il lucchetto come "pezzo tecnologico" della Home — e va prodotto da LockVFX (vedi sezione asset).

---

## H. Problemi ad alto impatto

In ordine di quanto bloccano il livello agency-grade:

1. **Manca il messaggio.** Nessuna frase di posizionamento, nessun h1, nessuna descrizione dei servizi, nessuna città, nessuna persona. Un'agenzia risolve questo prima di aprire Figma.
2. **Incoerenza del linguaggio visivo** (sei metafore) e registro sbagliato rispetto al lavoro reale.
3. **Il lavoro non è protagonista**: la lente è un dettaglio, il lucchetto è la star.
4. **Tre pagine su quattro non esistono** e la nav le promette.
5. **Nessuna tipografia** (font di sistema) → nessuna identità a livello di testo, che è dove si legge il 90% del brand.
6. **Non responsive nella sostanza**: su mobile l'esperienza perde i contenuti e tiene i costi (3D).
7. **Orientamento compromesso** da nav auto-nascosta a icone + scroll snap totale.
8. **Placeholder finti in produzione** (clienti, loghi).
9. **Fragilità tecnica di produzione**: HDR da CDN esterno, GLB pesante, bundle unico, reduced-motion solo di facciata, tutto non committato.
10. **i18n e tokens dichiarati ma non collegati**: il sistema esiste solo sulla carta.

Le piccole cose (favicon React Bits, README template, `AmbientParticles` morto, contrasto delle label) sono reali ma seguono da sole quando si sistemano le dieci sopra.

---

## I. Tre direzioni creative

Tutte e tre partono da un punto fermo, deciso: **il wipe prima/dopo è la signature d'interazione**, come linguaggio universale della post-produzione. Ciò che cambia tra le direzioni è *il mondo* in cui il wipe vive — quale idea di cinema, quale tipografia, quale ruolo per il 3D e per il marchio. La 1 è l'evoluzione di ciò che esiste; la 2 e la 3 sono alternative che spingono in due versi opposti (più cinema, più processo). L'attuale "Director's Monitor" non è più una direzione candidata: è valutato in F, e il confronto in fondo lo include solo come riferimento.

### Direzione 1 — "Picture Lock"

- **Concept**: LockVFX è lo studio che prende un'immagine *bloccata* e la finisce. Il sito è una sequenza di frame che vengono rivelati e poi *locked*.
- **Idea centrale**: il wipe come unico modo di rivelare; il lucchetto come gesto conclusivo (la staffa si chiude quando il frame è finito), non come mascotte. La gamma dello studio si dimostra ripetendo lo stesso gesto su shot di discipline diverse.
- **Atmosfera**: sala di grading dopo la consegna. Buio, silenzio, un'immagine grande, una riga di metadati. Calma sicura.
- **Personalità**: precisa, sobria, "invisibile per scelta". Parla poco, mostra molto. Vocabolario di post (plate, comp, lock, final) usato con parsimonia, mai come gergo decorativo.
- **Linguaggio visivo**: girato full-bleed; superfici neutre nere e quasi-nere; una hairline crimson; la colonna di perforazioni come indice; slate in monospace. Nessun glow, blob, grana o scanline.
- **Composizione**: griglia a 12 colonne con margini generosi; immagini che rompono la griglia a piena larghezza; testo allineato a sinistra su colonna stretta; molto vuoto verticale; sezioni separate da stacchi netti.
- **Tipografia**: un sans **condensato/stretto** con carattere da billing block cinematografico per titoli e nomi dei film (candidati liberi: *Archivo* variabile in larghezza; in alternativa *Instrument Sans* o *Sora*, meno spigolosi); un **monospace** sobrio (*Geist Mono*, *IBM Plex Mono*, *JetBrains Mono*) per slate, credits tecnici, nav secondaria; testo corrente nello stesso sans a larghezza normale. Titoli in medium/semibold a dimensioni contenute: la scala grande la fanno le immagini.
- **Palette**: `void #020202` (girato), `obsidian #0B0B0E` (lettura), `ink` off-white leggermente caldo `#F2EFEA`, `slate #9A9CA3`, `graphite #5F6168`, `crimson #E60B18` come *segnale* (≤1 elemento rosso per volta). Il ciano sparisce.
- **Materiali**: schermo (l'immagine), carta nera opaca (le superfici), un solo vetro (la loupe). Lucchetto 3D con materiale opaco, rosso profondo, luce radente sulle perforazioni — niente cromo, niente emissivo.
- **Uso del vetro**: solo nella loupe di dettaglio sulla pagina progetto. Nav e pannelli opachi, senza blur.
- **Uso del 3D**: due momenti. (a) Apertura: il marchio con profondità compie il gesto di *lock* e cede il posto al girato. (b) Footer/Contatti: lo stesso oggetto, fermo, con la staffa che si chiude in fondo alla pagina. Il resto è DOM/CSS.
- **Motion**: grammatica di montaggio. Stacchi (0 ms) per i cambi di sezione, wipe (250–400 ms, ease quasi lineare) per i reveal, hold prima dei cambi. Scroll nativo, non hijackato. Sequenze pinnate brevi (≤200vh).
- **Scrollytelling**: l'hero (sequenza di wipe su 3–4 shot di discipline diverse, poi lock) e, quando LockVFX produrrà i layer, un breakdown scrubbabile. Il resto è pagina normale.
- **Interazioni**: wipe che segue il puntatore (desktop) e il drag (touch); hover che mostra la slate; tap che alterna prima/dopo su mobile; nav sempre visibile.
- **Tecnologia ↔ cinema**: la tecnologia è nascosta nel risultato, come la VFX buona.
- **Signature visiva**: la **linea rossa del wipe** + il **click del lock** + la **colonna di perforazioni**.
- **Punti di forza**: coerente con qualunque tipo di shot (invisibile o spettacolare, il wipe funziona uguale); parla al committente giusto; riusa l'80% delle fondamenta esistenti; leggero e responsive per natura; invecchia bene.
- **Punti deboli**: chiede contenuto vero (6–10 shot di discipline diverse con diritti, credits, copy). Meno "wow" nei primi 3 secondi per chi si aspetta effetti.
- **Rischi**: "minimalismo sterile" se si sbaglia la tipografia o si usa il rosso timidamente; dipendenza dal footage disponibile.
- **Difficoltà tecnica**: media. Il wipe è CSS; il 3D si riduce; la complessità si sposta su tipografia, layout e pagine.
- **Distinguibilità**: alta, perché il concept nasce dal nome e dal logo, non da un trend.

### Direzione 2 — "Title Sequence"

- **Concept**: il sito come *sequenza di titoli* di un film. LockVFX non si presenta come fornitore tecnico ma come parte della cultura del cinema: title card, credits, aspect ratio, il frame come oggetto sacro.
- **Idea centrale**: la tipografia è la protagonista quanto le immagini. Ogni sezione si apre con una title card (nero, una riga, un taglio) e ogni lavoro è presentato come nei titoli di coda — *film, regia, fotografia, VFX by LockVFX*. Il wipe rivela i frame dentro un formato 2.39 che è la griglia stessa del sito.
- **Atmosfera**: sala cinematografica, i primi trenta secondi di un film. Solenne, ritmata, con silenzi.
- **Personalità**: colta, autoriale, un po' orgogliosa. Meno "studio", più "casa di produzione".
- **Linguaggio visivo**: letterbox 2.39 come struttura (non come effetto ai confini): tutto vive nel frame, e le barre nere sono margini reali di layout; tipografia grande ma rara; wipe; perforazioni come indice; crimson solo nel marchio e nella linea del wipe.
- **Composizione**: frame centrato, testo centrato *solo* nelle title card, allineato a sinistra altrove; molto nero attorno all'immagine; rapporti fissi.
- **Tipografia**: una **display con carattere forte** (un grotesk stretto ad alto contrasto, o un serif moderno per le title card — es. *Instrument Serif* o *Fraunces* — abbinato al sans dei credits) + monospace per la slate. È la direzione dove la scelta tipografica pesa di più.
- **Palette**: come la 1; l'off-white più caldo (`#F3EEE6`) per evocare la proiezione.
- **Materiali**: schermo e nero. Nessun vetro.
- **Uso del 3D**: il marchio come "logo di apertura" — il tipo di animazione di logo che precede un film (2–3 s, una volta per sessione): è l'unico 3D, e qui ha un motivo culturale preciso. Niente lucchetto nel footer.
- **Motion**: ritmo da titoli: apparizione secca, hold di 1–2 s, taglio. Wipe per i frame. Transizioni di pagina come dissolvenza al nero (l'unica dissolvenza ammessa).
- **Scrollytelling**: la Home è una sequenza di title card + frame; una sola sezione pinnata (hero).
- **Interazioni**: wipe; hover minimale; la nav diventa una "shot list" numerata.
- **Tecnologia ↔ cinema**: il cinema domina; la tecnologia sparisce del tutto.
- **Signature visiva**: le title card + il wipe nel frame 2.39.
- **Punti di forza**: fortemente cinematografico senza un solo cliché da HUD; molto distinguibile tra gli studi VFX (che tendono al "tech"); ottima cornice per i credits, che per uno studio giovane sono la valuta principale.
- **Punti deboli**: rischia di sembrare una casa di produzione o un festival, non uno studio VFX: la capacità tecnica si vede solo nei wipe. Il formato 2.39 spreca spazio su mobile e mal si adatta a shot in 16:9 o verticali (spot, social). Le title card centrate sono un pattern facile da fare male.
- **Rischi**: solennità che scivola nel pretenzioso; ritmo lento per chi cerca "cosa fate e quanto costate".
- **Difficoltà tecnica**: bassa-media (è quasi tutto tipografia e layout), ma il layout a frame fisso su mobile richiede una seconda logica.
- **Distinguibilità**: alta.

### Direzione 3 — "Layers"

- **Concept**: LockVFX come *processo*. Ogni immagine finita è una pila di layer — plate, tracking, roto, CG, FX, grade — e il sito li mostra assemblarsi. È la direzione "process-forward": non solo prima/dopo, ma *come*.
- **Idea centrale**: il breakdown come contenuto principale. Il wipe è il livello base (prima/dopo); sopra, il breakdown scrubbabile mostra le discipline una per una — che è esattamente il modo più credibile per uno studio a 360° di mostrare la gamma.
- **Atmosfera**: la pipeline, di notte, con il lavoro ancora aperto. Concentrata, tecnica, onesta.
- **Personalità**: competente, trasparente, "vi facciamo vedere come si fa".
- **Linguaggio visivo**: struttura a livelli visibile: pannelli sovrapposti con offset, etichette di layer, linee di connessione sottili; monospace più presente; griglia modulare esplicita; crimson come "layer attivo".
- **Composizione**: griglia tecnica a moduli, immagini in stack sfalsati, metadati sempre presenti.
- **Tipografia**: sans neutro (*Inter*/*Geist*) + monospace forte; il mono è quasi la voce principale.
- **Palette**: come la 1, con un grigio freddo in più per i pannelli di layer.
- **Materiali**: pannelli opachi, nessun vetro, nessun glow.
- **Uso del 3D**: potenzialmente più ampio — layer disposti nello spazio (parallasse Z reale con R3F) per il breakdown scrubbabile; il lucchetto come layer finale che "chiude" la pila.
- **Motion**: layer che scivolano in Z e si allineano; scroll pinnato per i breakdown; il resto secco.
- **Scrollytelling**: intenso: ogni progetto in evidenza è una sequenza pinnata.
- **Interazioni**: scrub dei layer, toggle di visibilità, wipe.
- **Tecnologia ↔ cinema**: la tecnologia è il racconto; il cinema è il contesto.
- **Signature visiva**: la pila di layer che si compone.
- **Punti di forza**: comunica *tutte* le discipline in un colpo; molto convincente per VFX supervisor e post supervisor; sfrutta al meglio R3F.
- **Punti deboli**: è la più affamata di asset (layer esportati per ogni shot: senza, la Home è vuota); rischia di somigliare a un'interfaccia di Nuke o a un sito di tool per sviluppatori — cioè di ricadere nell'estetica tecnica da cui vogliamo uscire; meno emozione, più spiegazione; pesante.
- **Rischi**: gergo; performance; tempi di produzione degli asset che bloccano il lancio.
- **Difficoltà tecnica**: alta.
- **Distinguibilità**: media-alta (esistono studi che mostrano breakdown, ma pochi lo fanno come struttura del sito).

### Confronto rapido

| | 1 · Picture Lock | 2 · Title Sequence | 3 · Layers | (rif.) Director's Monitor |
|---|---|---|---|---|
| Coerenza con uno studio VFX a 360° | alta | media | alta | bassa |
| Distinguibilità | alta | alta | media-alta | bassa |
| Riuso dell'esistente | alto | medio | medio | massimo |
| Peso / performance | leggero | leggero | pesante | pesante |
| Responsive per natura | sì | con lavoro | con lavoro | no |
| Dipendenza da contenuti | alta | alta | molto alta | bassa |
| Rischio "gimmick" | basso | basso | medio | alto |
| Rischio "sterile" / "pretenzioso" | medio | medio-alto | basso | basso |
| Rischio "troppo tech" | basso | nullo | alto | alto |
| Invecchiamento | lento | lento | medio | rapido |

---

## J. Direzione raccomandata

**Direzione 1, "Picture Lock", con due innesti precisi.** Dalla 2 prende la **disciplina dei credits e delle title card**: ogni lavoro presentato come nei titoli di un film (titolo, regia, fotografia, anno, *VFX by LockVFX* con le discipline svolte), e una title card tipografica come apertura di ciascuna sezione — senza però adottare il frame 2.39 come griglia. Dalla 3 prende il **breakdown scrubbabile** come modulo *opzionale* della pagina progetto e di una sezione della Home, da attivare shot per shot man mano che LockVFX esporta i layer — senza farne la struttura del sito.

Perché la 1 e non la 2: la 2 è la più "cinema", ma per uno studio VFX a 360° rischia di nascondere proprio la cosa da vendere — la gamma tecnica. E il frame 2.39 come griglia è un vincolo che si paga su mobile e su ogni shot non in scope. Perché non la 3: è la più convincente per un supervisor, ma è ostaggio degli asset (senza layer esportati non c'è sito) e riporta dentro l'estetica tecnica da cui stiamo uscendo; le sue idee migliori si possono aggiungere alla 1 senza cambiarne la natura.

La 1 è la sola delle tre che regge con *qualsiasi* tipo di shot — un matte painting spettacolare o un cleanup invisibile hanno lo stesso prima/dopo — ed è la sola che nasce da cose che sono già di LockVFX: il nome (picture lock), il logo (pellicola + lucchetto), il gesto (il wipe, che avete già costruito). Mette il lavoro davanti al marchio, che è l'unica cosa che convince un produttore, e conserva l'80% delle fondamenta tecniche riducendo peso e fragilità.

Che cosa **si conserva** dell'attuale: fondo scuro, il rosso del logo, la logica della lente RAW/EDITED (che diventa il wipe lineare, e resta come loupe nella pagina progetto), l'impianto sticky+`useScroll`+`useFrame`, `StageReveal`, `scrollEnvelope`, `tokens.ts` (collegato), il modello 3D (con materiale nuovo e due momenti), il footer nella struttura. Che cosa **si ritira**: bracket/REC/timecode/scanline come cornice permanente, blob e ciano, polaroid, pellicola-marquee, glitch cromatico, letterbox pulsante, nav auto-nascosta a icone, cursore custom, tilt/spotlight, easter egg, vetro sui pannelli. Che cosa **si aggiunge**: messaggio e copy, tipografia, slate e title card, perforazioni, wipe DOM, pagine.

### Nota sulle idee in cantiere (mi hai chiesto di essere diretto)

- *Preloader: logo che si disegna col caricamento, poi il lucchetto viene incontro e si entra "dalla serratura", poi showreel.* La prima metà è buona **se il caricamento è reale** (una barra travestita da logo che finge di caricare è il timecode finto di nuovo). La seconda metà — entrare dalla serratura — è un cliché (è il gesto di ogni intro "spy"), dura troppo, e costringe chi torna a rivederlo. Versione forte: il marchio chiude la staffa (*click*, ≤1 s), e quel click *è* il taglio sul primo frame. Mostrato una volta per sessione, saltabile.
- *Finale: il lucchetto gira fortissimo, si ferma dritto, si appiattisce nel logo 2D e scivola nell'angolo del footer.* L'idea di chiudere sul marchio è giusta. Il "gira fortissimo" è spettacolo fine a sé stesso e dichiara che il modello è un'estrusione (di profilo è una lastra). Versione forte: il lucchetto arriva fermo, di fronte, e la staffa si chiude quando si tocca il fondo pagina. *Locked.* Poi si appiattisce nel logo del footer, se vuoi, ma il momento è il click, non la giravolta.
- *Nav liquid glass "come la tab bar iOS", con rifrazione vera.* Sconsigliata. È il pezzo di UI più riconoscibile del 2025–26 e quindi il più datante, non c'è nulla di significativo dietro da rifrangere, e non dice LockVFX. Il vetro va tenuto per la lente, dove è la metafora giusta.
- *Pellicola clienti come componente separato.* Il lavoro fatto sulle proporzioni è accurato, ma la pellicola è ridondante con il logo (che *è* già pellicola) e la sezione clienti è quella da non avere finché non ci sono nomi veri. Se vuoi tenere la pellicola come oggetto, la sua forma migliore è la colonna di perforazioni del logo usata come indice, non una marquee con loghi.
- *Costruire la Home partendo dall'animazione 3D e poi metterci intorno la UI.* È il workflow che ha prodotto l'attuale squilibrio. L'ordine giusto è: messaggio → struttura → tipografia/sistema → contenuti reali → e solo dopo i due momenti 3D, che a quel punto hanno un posto preciso.
- *La lente RAW/EDITED da rifinire e integrare.* Sì, ed è l'idea migliore che hai avuto: va promossa a sistema.

---

## K. Homepage Narrative

Una Home a scroll nativo, circa 5–6 schermate, con una sola sequenza pinnata all'inizio. Il filo: **plate → comp → lock**, ripetuto a scale diverse, su shot di discipline diverse.

**0. Slate (opzionale, ≤1 s, prima visita).** Fondo nero. Il marchio, in linea sottile, chiude la staffa: un *click* visivo (uno scatto di 2–3 frame, nessuna molla). Il click è il taglio sull'hero. Se il caricamento reale è finito prima, si salta.

**1. Hero — "i frame".** Full-bleed: il primo shot, lato *plate*. In alto a sinistra, piccolo: `LockVFX`. Su una colonna a sinistra, l'h1: *"Effetti visivi per il cinema e la pubblicità. Dal picture lock al final."* (struttura: chi + per chi + il concetto; copy da chiudere con lo studio). Sotto, la slate in mono: `SH010 · ENVIRONMENT · plate`. Scroll o puntatore: la hairline crimson attraversa il frame e lascia dietro di sé il comp; la slate diventa `SH010 · ENVIRONMENT · comp · LOCKED`. Continuando a scrollare, *stacco*: secondo shot (`CG INTEGRATION`), stesso wipe; terzo (`CLEANUP`); quarto (`FX`). Quattro discipline, un gesto, ~40 secondi di scroll: chi arriva ha capito la gamma senza leggere un elenco. Questa è l'unica sequenza pinnata (≈200vh). Su mobile: wipe legato allo scroll e tap per alternare.

**2. Dichiarazione — "chi siamo in tre righe".** Title card tipografica, poi testo su colonna stretta: cosa fa lo studio (l'elenco vero: compositing, 3D/CGI, matte painting, environment, cleanup, simulation, finishing), dove è, per chi (lungometraggi, serie, spot). Link: *Studio →*. Nessuna immagine: è il momento della voce.

**3. Selected work — "i credits".** Tre-cinque progetti, ognuno un frame largo con wipe su hover/drag; a sinistra la colonna di perforazioni come indice. Sotto ogni frame la billing line in condensato: *Titolo · regia · fotografia · anno* e, in mono, *VFX by LockVFX — environment, CG, cleanup*. Link: *Tutti i lavori →*.

**4. Come lavoriamo — "la pipeline".** Cinque tappe orizzontali con la perforazione come asse: *plate → tracking/roto → CG & FX → comp → lock*. Una frase per tappa. Quando LockVFX esporterà i layer di uno shot, questa sezione diventa il breakdown scrubbabile (i layer si compongono con lo scroll fino al frame finale, che si *locka*). Fino ad allora, sezione statica ben tipografata.

**5. Studio — "le persone".** Una fotografia vera dello studio o del team (asset da produrre), due righe, link a About. Un produttore vuole sapere chi chiama.

**6. Contatto + footer — "il lock".** *"Hai un taglio da finire?"* Email in chiaro, link al form. Il lucchetto 3D, fermo, di fronte, opaco; toccando il fondo pagina la staffa si chiude. Colonne, perforazioni come divisore, marchio.

Percorso rispetto alle fasi richieste: *prima impressione* = un frame vero e la frase (chi/cosa/per chi in 2 secondi); *orientamento* = nav visibile, h1, slate; *curiosità* = il primo wipe; *esplorazione* = quattro discipline in sequenza; *interazione* = wipe/tap su ogni frame; *portfolio* = sezione 3 + pagina; *comprensione dello studio* = sezioni 2, 4, 5; *percezione del brand* = linea rossa, perforazioni, tipografia, click; *contatto* = sezione 6, ripetuto nella nav.

### Struttura delle altre pagine (per coerenza, senza dettagli)

- **Portfolio**: lista di shot/progetti come frame con wipe, filtri per tipo di lavoro (non per "categoria" astratta), pagina progetto con shot list, breakdown se disponibile, credits completi, "next project" come stacco.
- **About**: le persone, la pipeline reale (software veri, ACES ecc. detti una volta, senza marquee), la storia in poche righe, il *perché* del nome (picture lock: qui si può dire).
- **Contatti**: form breve (nome, produzione, tipo di lavoro, link al materiale), email, città. Il lucchetto in stato "aperto" (il lavoro non è ancora locked) sarebbe il solo altro uso 3D sensato.

---

## L. Strategia tecnica

**Principio**: spostare la complessità dal Canvas alla tipografia e al sistema. Meno WebGL, più CSS; tutto ciò che è brand deve stare in un posto solo.

1. **Fondazioni**
   - `tokens.ts` diventa la fonte di verità e alimenta Tailwind v4 via `@theme` in `globals.css` (colori, font, easing, spacing). Zero hex nei componenti.
   - Font self-hosted (woff2 in `public/fonts`, `@font-face` con `font-display: swap`, preload del display). Scala tipografica dichiarata (6–7 taglie), non `text-4xl md:text-6xl` a mano.
   - `index.html`: title, meta, OG, `lang` dinamico, favicon dal logo. Rimuovere `icons.svg`, README del template, `AmbientParticles`.
   - Commit immediato dello stato attuale (branch `exploration/obsidian-crimson`), poi lavorare su `main`.
2. **Sistema di componenti (piccolo, con nome)**
   - `Wipe` — DOM: due `<img>`/`<video>` sovrapposti, il "dopo" con `clip-path: inset(0 X% 0 0)`; controllato da puntatore, drag (Pointer Events), scroll (`useScroll`) o tap. Zero WebGL, responsive, accessibile (i due stati esistono nel DOM). Il disco-lente WebGL attuale resta come *variante* per l'hero se si vuole la rifrazione.
   - `Slate` — riga di metadati mono; riceve dati veri (shot, stato, fps).
   - `Perforations` — colonna/riga SVG derivata dal logo; varianti indice, divisore, progress.
   - `Frame` — contenitore 16:9 / 2.39 con billing line; `Billing` — tipografia credits.
   - `Nav` — testuale, sempre visibile, indicatore hairline crimson; mobile: stessa nav compatta in alto, niente dock che si nasconde.
   - `Reveal` — l'attuale `StageReveal` rinominato, con una versione "cut" (senza blur) per il linguaggio di montaggio.
   - `LockMark` — il marchio SVG con la staffa come path separato (per il click 2D) e `LockObject` — il GLB (per i due momenti 3D).
3. **3D**
   - Il `<Canvas>` esiste solo dove serve (hero, footer), caricato con `React.lazy` + `Suspense`, `frameloop="demand"` e `invalidate()` sugli aggiornamenti, `dpr` limitato a `[1, 1.5]`.
   - GLB compresso (gltf-transform: meshopt o Draco, normali saldate) → obiettivo <250 KB; niente `Environment preset` da CDN: un HDR piccolo self-hosted (≤200 KB) o solo luci.
   - Materiale del lucchetto: opaco, rosso profondo, roughness alta, luce radente laterale per le perforazioni. Nessun emissivo pulsante.
   - Fallback: se `prefers-reduced-motion`, WebGL non disponibile o `saveData`, il marchio 2D SVG fa lo stesso gesto (click della staffa) — l'esperienza non cambia di significato.
4. **Motion**
   - Framer Motion per UI e reveal; `useScroll`+`useTransform` per le due sequenze pinnate; GSAP resta *solo* se serve ScrollTrigger per il breakdown (altrimenti si rimuove: una libreria in meno). Niente snap globale.
   - Durate a multipli di ~42 ms, ease corte; una tabella di easing in tokens.
   - `useReducedMotion()` ovunque: i wipe diventano affiancati o a tap, i reveal diventano opacità semplici, nessuna sequenza pinnata.
5. **Pagine e dati**
   - Router con route lazy per pagina; scroll restoration; transizioni di pagina come *stacco* (nessuna dissolvenza lunga).
   - Un modello dati per i lavori (`projects.ts` o JSON/MDX): titolo, credits, shot[] con `{plate, comp, breakdownLayers?, video?}`, tag di lavoro, diritti/visibilità. Le immagini in coppie allineate, `srcset` a 3 taglie, AVIF/WebP, `loading="lazy"` fuori dall'hero, video mp4+webm con poster.
   - i18n collegato per davvero (`t()` ovunque, `it` default, `en` completo, `lang` sul `<html>`), oppure — decisione onesta — solo italiano+inglese con contenuti duplicati nel modello dati, che per un portfolio è spesso più semplice di i18next.
6. **Budget e verifica**
   - JS iniziale <250 KB gz (three fuori dal bundle iniziale), LCP <2,5 s su 4G (l'hero è un'immagine, non un Canvas), CLS 0, 60 fps sul wipe su un laptop integrato.
   - Lighthouse + test su un telefono medio *prima* di ogni nuova sezione, non alla fine.
   - Accessibilità: `h1` unico, landmark, focus visibile, contrasto ≥4.5:1 per il testo (rivedere `graphite`), cursore nativo.

### Asset da richiedere a LockVFX (con placeholder nel frattempo)

| Asset | Funzione nel sito | Requisiti | Placeholder |
|---|---|---|---|
| **Logo in SVG** con staffa come path separato | marchio, favicon, click 2D, preloader | vettoriale, monocromo + versione rossa | tracciato dal PNG |
| **Coppie plate/comp** (6–10 shot, **di discipline diverse**: environment, CG, cleanup, FX, finishing) | hero, frame, portfolio | stesso frame esatto, 2560 px, 16:9 o 2.39, diritti chiariti | le 2 coppie attuali |
| **Credits per shot** | billing line, slate | film, regia, DoP, anno, lavoro svolto, shot code | dati fittizi *dichiarati* come tali |
| **Showreel** (20–40 s) | hero alternativo / pagina portfolio | H.264+WebM, muto, poster | il poster attuale |
| **Layer di breakdown** per 1–2 shot | sequenza pinnata "come lavoriamo" | plate, roto/matte, CG, comp come PNG allineati (o clip) | 3 PNG piatti |
| **Modello lucchetto v2** | momenti 3D | materiali definitivi, normali saldate, opzionale Draco, staffa separata (c'è già) | il GLB attuale |
| **Fotografia dello studio/team** | Home sez. 5, About | 1–3 scatti, orizzontali | rettangolo neutro |
| **Copy di posizionamento** | h1, sezione 2, About | servizi reali, città, storia, persone | testo di lavoro nel documento di brand |

---

## M. Roadmap

Ordinata per impatto sul risultato e per dipendenza. Ogni fase produce qualcosa di visibile.

**Fase 0 — Mettere in sicurezza (mezza giornata).** Commit di tutto lo stato attuale su un branch di esplorazione; verifica del bug dell'opacità del poster (ScrollTimeline nativa vs progress JS) per non ereditarlo nel nuovo hero; pulizia degli avanzi di template; `_to_delete/` (ho lasciato lì lo snapshot che mi è servito per l'analisi: cancellalo pure). Nessun cambiamento visivo.

**Fase 1 — Decidere (1 sessione con te, poi 1–2 giorni).** Confermare la direzione; scrivere il brief di brand in 1 pagina (posizionamento, voce, i tre segni, palette con ruoli, coppia tipografica scelta *guardandola*); raccogliere da LockVFX copy, servizi, credits e diritti. Output: documento di brand + tokens aggiornati.

**Fase 2 — Fondazioni (2–3 giorni).** Tokens → `@theme`; font self-hosted; scala tipografica; nav testuale; `Wipe`, `Slate`, `Perforations`, `Frame/Billing`, `Reveal`; layout responsive di base; i18n collegato (o decisione alternativa). Output: una pagina "kit" che mostra tutti i componenti — è anche il test di coerenza.

**Fase 3 — Home (3–5 giorni).** Le sei sezioni di K con i contenuti disponibili (le due coppie reali + placeholder dichiarati). Hero pinnato con wipe DOM; 3D *non ancora*. Mobile alla pari del desktop fin dal primo giorno. Output: Home navigabile e leggera.

**Fase 4 — Portfolio + pagina progetto (3–4 giorni).** Modello dati, lista, filtri, pagina progetto con wipe/breakdown e credits. Output: il sito ha un "dentro".

**Fase 5 — About + Contatti (2 giorni).** Persone, pipeline, form (con un servizio di invio semplice). Output: sito completo nelle quattro aree.

**Fase 6 — I due momenti 3D (2–3 giorni).** Slate/preloader col click, footer con il lock; GLB compresso, luci self-hosted, `frameloop="demand"`, fallback 2D. Solo ora, perché ora sappiamo esattamente dove vanno.

**Fase 7 — Qualità (2–3 giorni).** Reduced motion completo, accessibilità, performance su mobile, SEO/OG, test cross-browser, revisione del copy in due lingue.

**Fase 8 — Lancio e crescita.** Sostituzione dei placeholder con asset definitivi man mano che arrivano (il sistema è progettato per questo), breakdown scrubbabile quando LockVFX produce i layer.

---

## La risposta alla domanda finale

**Che cosa deve diventare LockVFX sul web?** Lo studio che prende un'immagine *bloccata* e la finisce — qualunque cosa serva, dal cleanup invisibile alla creatura CG — e lo dimostra frame per frame, prima/dopo, con un solo gesto ripetuto su discipline diverse. Un sito scuro perché il girato si guarda al buio, non perché "dark è cinematico"; rosso in un punto solo per volta, come una tally light; tipografia con la voce dei credits; tre segni ripetuti finché diventano suoi — la linea del wipe, la colonna di perforazioni, il click della staffa.

**Perché è più forte di ciò che c'è oggi?** Perché ogni sua parte nasce da qualcosa che è già di LockVFX (il nome, il logo, le immagini reali) invece che da qualcosa che è di tutti (HUD, glitch, vetro, blob). Perché mette il lavoro davanti al logo, e il lavoro è la sola cosa che convince un produttore. Perché conserva l'80% delle fondamenta tecniche costruite finora, riducendo il peso e la fragilità invece di aumentarli. E perché, tra un anno, quando il liquid glass e i bracket saranno il segno dei siti del 2026, questo sito sembrerà ancora *suo*.

