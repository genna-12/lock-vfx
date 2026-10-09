# Il mobile semplice — spec unica del telefono

*8 settembre 2026, sera. Cinque consegne (Lotto 1, 1 bis, 1 ter, 1 quater) hanno provato a far stare la carrellata dentro un telefono. Non ci sta. La Direzione ha chiesto «da telefono, se dobbiamo smattare, preferisco una cosa semplice e funzionale», e questo documento è quella cosa. `rifinitura-spec.md` §6 rimanda qui. Il desktop non cambia. **Aggiornato il 9/9 dopo la prova sul telefono: §2 (snap e nav), §5 (il video parte da solo), §7 (il nome che arriva dopo la prima schermata).***

## 0. La decisione, in una frase

**Su touch non c'è carrellata**: niente pin, niente ScrollSmoother, niente `normalizeScroll`, niente magnete. Quattro sezioni in flusso verticale, alte quanto lo schermo, con lo **snap nativo del browser**.

## 1. Perché, e cosa costa

Le tre cose che la Direzione ha chiesto sono **incompatibili con la carrellata su telefono**:

- **Schermo intero, anche dietro le barre di Safari.** Su iOS le barre si ritirano **solo** durante uno scroll nativo. `normalizeScroll` porta lo scroll in JavaScript, ed è la ragione per cui le barre non si sono mai più mosse. O una cosa o l'altra.
- **Niente più glitch in salita.** Il ping-pong era il magnete contro il browser. Senza magnete non c'è più niente che possa litigare.
- **Niente conflitto di scroll nei contatti.** Con la Stanza in una schermata (§4) non c'è scroll interno.

Il costo, detto una volta: **su telefono spariscono i tre movimenti di camera** — dolly back, push in, crane down. Restano il nero, la tipografia, le fotografie a pieno schermo, il rosso contato, il lucchetto che si chiude, i video: cioè il marchio. Il cinema resta sul desktop.

**Verificato sul telefono di Genna il 9/9** (sonda `?probe=1`, iPhone/Safari): `svh 511 · lvh 718 · dvh 718` con la finestra a 718, e `lvh − finestra = 0`. Cioè: fra l'altezza "piccola" e quella "grande" ci sono **207 px**, ed è tutta la spiegazione delle strisce nere dei lotti precedenti. Con `100lvh` la sezione riempie **esattamente** lo schermo. Quando le barre sono aperte la finestra scende a 610 e `lvh − finestra = 108`: quei 108 px sono la fascia di rispetto di §2, e per questo lì sotto non va niente.

## 2. Come si comporta la pagina su telefono

- **Quattro sezioni in flusso** (`reel`, `studio`, `work`, `contact`), ognuna `height: 100lvh`. Dentro, il contenuto vive in un'area sicura con **72 px + `env(safe-area-inset-bottom)` di respiro in basso** (misurati: ne servono almeno 108 quando le barre sono aperte — vedi §1): lì sotto non va mai niente di leggibile o di toccabile.
- **Snap nativo**: `scroll-snap-align: start` su ogni sezione **e sul footer** (senza aggancio, con `mandatory` il footer non si raggiunge). Lo snap si spegne quando c'è un campo a fuoco (`:has(:focus)` — dal Lotto M ter ristretto a `input, textarea, select`). *(9/10)*: per questo sul telefono **nessun link mette il fuoco nel form da solo** (lo fa il dito), e quando si entra in un'altra sezione un campo della Stanza rimasto a fuoco lo perde — scorrere non lo toglie, e restava la pagina senza snap per il resto della visita.
- **`mandatory` o `proximity`? Deciso il 9/9 dopo la prova: si misura e si sceglie.** Con `mandatory` la Direzione sente «degli scatti nel momento in cui si scrolla». Due cause possibili e distinguibili con la sonda: (a) il motore di snap che riaggancia in continuazione durante un trascinamento lento — allora `proximity` con `scroll-snap-stop: always` sulle sezioni; (b) la dissolvenza d'ingresso, che sposta il contenuto di 12 px mentre lo si sta guardando — allora resta `mandatory` e la salita di 12 px si toglie (la dissolvenza resta). **Non sono i magneti**: su touch il magnete è spento dal Lotto 1 quater, e la sonda lo conferma. *(Esito del Lotto M ter: era la dissolvenza, (b).)*
- **Andare a una sezione dalla nav**: `scrollIntoView({ behavior: 'smooth' })` **da solo non funziona** su iOS quando lo snap è `mandatory` — la pagina ci arriva e mezzo secondo dopo torna indietro (visto sul telefono il 9/9). Regola: **prima di uno scroll programmato si spegne lo snap** (`scroll-snap-type: none` sul contenitore), si scorre, e lo si riaccende **quando lo scroll è finito** (evento `scrollend`; dove non esiste, Safari < 17.4, un timer di riserva **riarmabile**: si rimanda finché `scrollY` cambia e scatta solo a scroll fermo, con un tetto di sicurezza — *corretto il 16/9: i 700 ms fissi erano più corti della corsa più lunga, 726 ms misurati*). Vale per la nav, per gli agganci `#studio`/`#contact` e per qualunque altro scroll scritto in JavaScript. *(Implementato in `src/lib/scrollProgrammato.ts`, `vaiAllaSezione`. Dal 9/10 un tocco, la rotella o un tasto durante la corsa la chiudono e riaccendono subito lo snap; le sezioni attraversate in volo non contano come viste, così la loro dissolvenza resta per quando ci si arriva.)*
- **Transizioni**: nessuna camera. All'ingresso di ogni sezione, con un `IntersectionObserver` a soglia 0,55, una sola dissolvenza corta; con la stessa soglia si accendono le luci e cambia il foro attivo. Niente parallasse, niente scrub.
- **Niente `--stage-h`, niente `100svh`, niente `100dvh`** nel ramo touch.
- **La nav** sul telefono è in basso al centro, a `calc(env(safe-area-inset-bottom, 0px) + 16px)` dal bordo.
- **Il loader, il chrome, la lingua, il footer** non cambiano — salvo §7.

## 2.1 La prima schermata: pieno schermo, e nient'altro

«Riportiamo la home in verticale schermo pieno senza scritte.» La prima sezione — la Reel — è **media a pieno schermo**, verticale, `object-fit: cover`, e **sopra non c'è nessun testo**. Sullo schermo ci sono tre cose: il **marchio** in alto a sinistra, la **lingua** in alto a destra, la **nav** in basso.

- L'`h1` **resta, invisibile** (`u-sr-only`): serve ai motori e agli screen reader.
- Vale **in tutte le modalità senza carrellata**, telefono e `prefers-reduced-motion`: la Reel è l'unica sezione la cui altezza non viene dal contenuto.
- **Il video parte da solo** (muto, in loop), come ogni video del sito: §5.
- **Conseguenza sull'asset**: uno showreel 16:9 in `cover` su un telefono ne mostra **circa un quarto**. Serve un montaggio verticale (9:16) o quadrato, o almeno quale porzione non si può perdere.

## 3. I comandi, che devono essere premibili

- Ogni comando toccabile è **almeno 44×44 px** di area sensibile, con **almeno 12 px** fra un comando e l'altro.
- **Nessun comando entro 56 px dalla nav**, in nessuna direzione. I comandi del video stanno **in alto a destra dentro il riquadro del video**, non sul bordo dello schermo.
- Niente comandi entro 16 px dai bordi dello schermo.

## 4. La Stanza sul telefono: una schermata, e basta

- **Sotto il pulsante non c'è più niente**: via marchio, nomi, città. Titolo, form, presa visione, pulsante.
- **Il lucchetto si vede nella conferma**: a invio riuscito il form lascia il posto al marchio che si chiude, a una riga di ringraziamento e all'**email a cui risponderemo**. Dettagli in `stanza-spec.md` v1.2.
- Nomi e P. IVA stanno nel **blocco legale del footer**; **le email personali non ci sono più** (decisione del 9/9: non esistono caselle personali): nel footer restano nome, cognome e P. IVA, e l'unico indirizzo del sito è quello collettivo.

## 5. I video partono da soli (9/9)

La Direzione, dopo la prova: «deve partire in automatico il video e non aspettare che si prema un tasto riproduci, nessuno ha mai parlato di un tasto riproduci». Regola per **tutti** i video del sito, telefono e desktop:

- **Autoplay, muto, in loop** dove il video è l'ambiente (la prima schermata); **autoplay, muto** dove il video è un lavoro (la Sala), con il comportamento di fine video già scritto in `sala-deck-spec.md`. Con `prefers-reduced-motion` il video resta fermo sul poster. *(6/10, D12)*: con reduced motion non parte da solo, ma **il tap/clic sul video lo fa partire e lo mette in pausa** (Reel e Sala); i comandi audio/schermo intero restano. Nessun pulsante "riproduci".
- **Nessun pulsante "riproduci"**: non è mai stato chiesto e non esiste. Il **tap sul video** mette in pausa e riprende, con un segno che compare e sparisce; non c'è un pulsante permanente che occupa l'immagine.
- **I due soli comandi permanenti**, in alto a destra **dentro il riquadro**: **audio** (dove c'è audio) e **schermo intero**, con le distanze di §3. Lo schermo intero su telefono apre il **player nativo**, che ha i suoi comandi e ruota da solo.
- Quando arriveranno i video veri: il poster resta l'immagine misurata dai test di velocità, il video parte **dopo il loader** con `preload="none"`, e non parte affatto con il risparmio dati acceso (R13).

## 6. Cosa resta valido dei lotti precedenti

**M2** (la Stanza non è un contenitore che scorre se non sborda, mai `overscroll-behavior: contain`) · **M4** (schermo intero = player nativo, via l'invito a ruotare) · **M3** (la modalità senza carrellata è una pagina vera; la Reel è l'eccezione, §2.1) · **la sonda `?probe=1`**, finché il telefono non è chiuso · **`viewport-fit=cover`**, safe area, `theme-color` nero.

## 7. Il nome scritto: non nella prima schermata, sì nel resto (rivista il 9/9)

La Direzione, il 9/9: «avevo chiesto che la scritta LockVFX non apparisse **vicino al logo in alto a sinistra nella home**, ma **nel resto della pagina sì**; invece non appare mai».

- **Regola**: nel chrome, la parola accanto al marchio **non c'è finché si è sulla prima schermata**; **compare** — in dissolvenza `f5` — appena si entra nella seconda sezione, e resta per tutto il resto della pagina. Tornando in cima, sparisce. Vale su telefono **e** su desktop (dove la soglia è l'uscita dall'HOLD 1). Nelle altre pagine (Studio) la parola c'è sempre, come oggi.
- La costante diventa `WORDMARK_TEXT: 'always' | 'after-first-screen'`, con `'after-first-screen'` come **default in entrambe le versioni** (`rifinitura-spec.md` §7.3 va letta così: R17 non è più una variante).
- Quando la parola non c'è, il link del marchio porta comunque `aria-label="LockVFX"`: sparisce dagli occhi, non dalla pagina.
- **Il nome resta anche dove già sta**: nel footer (titolo di colonna, blocco legale, copyright), nel paragrafo dello Studio, nel `<title>` e nell'`h1` nascosto. Così la prima schermata è solo immagine, e il sito dice comunque come si chiama a chiunque scorra di una sezione.

## 8. Come si prova (sostituisce §6.3 di `rifinitura-spec.md`)

Genna, sul telefono, prima visita, con **modello e browser**:
1. Il loader si chiude e sotto c'è la reel **a pieno schermo, senza scritte**?
2. **La pagina arriva sotto le barre di Safari**?
3. Una passata di dito = una sezione, in giù? **E senza scatti mentre si scorre?**
4. E in su? Veloce, più volte: mai su-e-giù, mai rimbalzi.
5. Nei contatti: il form sta in una schermata, e da lì si torna su con un dito solo?
6. **I video partono da soli**, e i comandi (audio, schermo intero) si premono al primo colpo senza prendere la nav?
7. **Il tap su un foro della nav porta alla sezione e ci resta?**
8. **Dalla seconda schermata in poi si vede la parola "LockVFX" accanto al marchio?**
Una schermata con `?probe=1` vale sempre più di una risposta a memoria. Il Validatore, che un telefono non ce l'ha, valida il mobile **solo** su questa prova.
