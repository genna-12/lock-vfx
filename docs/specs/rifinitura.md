# Rifinitura pre-pubblicazione — spec e posizioni della Direzione

*8 settembre 2026 (§2 e §7.3 allineate il 16/9). Il sito funziona e misura bene; adesso deve **piacere**. Questo documento raccoglie (1) il metodo della fase di rifinitura, (2) le cose già progettate — a partire dal loader — e (3) le posizioni della Direzione sulle richieste che i ragazzi molto probabilmente faranno, così quando arrivano non si riparte da zero. I ticket vivono in `handoff-rifinitura.md`. **Il telefono ha una spec sua: `mobile-semplice-spec.md`.** *(9/9: aggiunto §8, video in alta qualità; tetto del loader a 3 600 ms con l'animazione dei ragazzi.)*

## 1. Metodo

Le richieste di LockVFX arrivano a Genna in modo sparso. Genna le scrive **così come sono** nel canale `handoff-rifinitura.md` (sezione "In arrivo", una riga ciascuna). La Direzione le legge, le trasforma in **ticket** con una decisione di design (accolta / accolta con modifica / respinta con motivo) e ne fa **lotti** di 3–6. Ogni lotto è uno step come gli altri: la chat **Rifinitura** (Opus, implementatore di questa fase) lo esegue con un commit per ticket, il **Validatore** lo verifica con lo stesso metodo di sempre (browser, diff, misure) e scrive il lotto successivo dai ticket già decisi. Il canale operativo resta `handoff-opus.md` (regole invariate; al posto di "Step N" si scrive "Lotto N"). Un ticket "respinto" torna comunque ai ragazzi con la spiegazione: decidono loro, ma con il motivo davanti.

Regola di questa fase: **si rifinisce, non si riprogetta**. Una richiesta che cambia struttura o narrativa (sezioni, ordine, carrellata) non è un ticket: è un'escalation alla Direzione e una spec nuova. *(È esattamente quello che è successo al mobile l'8/9 sera: cinque consegne, e poi una spec nuova.)*

## 2. Loader v2 — "il lucchetto si chiude" con calma

**Problema**: il caricamento reale dura ~100 ms, quindi la staffa scatta chiusa in un terzo di secondo, poi il marchio resta fermo fino al pavimento degli 800 ms, lampeggia rosso e sparisce. Tecnicamente giusto, ma si legge come un tic. Un gesto deve avere un ritmo suo, non quello della rete.

**Principio**: il tempo lo detta una **coreografia**, il progresso è solo un cancello (la staffa non può *precedere* il caricamento, ma può aspettarlo). Se il sito è veloce, il gesto dura il suo tempo; se è lento, la staffa si ferma dov'è e riprende: nessun salto.

**Coreografia (prima visita)**, overlay `void`, marchio 132 px (96 su mobile), centrato:

| fase | tempo | cosa |
|---|---|---|
| A — disegno | 0 → 400 ms | i tre path del marchio **si tracciano** (contorno 1,5 px `ink`, `stroke-dashoffset` da lunghezza a 0, `easeArrive`), corpo → serratura → staffa con 80 ms di scarto. Il lucchetto appare *aperto*, come nel logo. |
| B — chiusura | 400 → 1 400 ms | la staffa scende da 0 a 22 (su 25) seguendo una curva `power2.inOut` di 1 000 ms, **limitata dal progresso**: `y = min(curva(t), progresso) · 22`. Nessun numero di percentuale a schermo. |
| C — scatto | alla chiusura | ultimi 3 unità in `f2` lineare; nello stesso frame il marchio diventa **pieno e `crimson`** e **resta rosso**: è il momento del brand, l'unico in cui il rosso è colore e non segnale. |
| D — tenuta | +250 ms | fermo. Si vede il lucchetto chiuso, rosso, pieno. |
| E — volo | 500 ms (`f12`, `easeArrive`) | l'overlay **stacca** (via netto: sotto appare la reel) mentre il marchio rosso vola, rimpicciolendo, fino alla posizione esatta del marchio del wordmark in alto a sinistra (misurata con `getBoundingClientRect`, tecnica FLIP) e nel volo passa da `crimson` a `ink`. All'arrivo, nello stesso frame, il marchio del wordmark diventa visibile e quello in volo sparisce. |

**Aggancio all'animazione di Nicholas** (richiesta dei ragazzi, 8/9; **il file è arrivato l'8/9 sera**): le fasi A–C possono essere sostituite da un'animazione del logo prodotta da LockVFX; il loader la riproduce al posto del disegno e della discesa, poi riparte da **D–E** (tenuta e volo verso il wordmark) sul suo ultimo fotogramma. Perché funzioni: `LOADER_SOURCE: 'drawn' | 'video'`; i file sono `public/loader/logo.webm` (VP9) + `logo.mp4` (H.264, per iPhone; **da richiedere**, finché manca su Safari vale il ramo `drawn`), 512², **fondo nero senza alpha** → overlay `void` con `mix-blend-mode: screen` e ritaglio in CSS per portare il lucchetto a misura (nell'esportazione del 9/9 occupa un sesto del fotogramma); **il `logo.mov` ProRes è un master e non va online** (spostarlo in `materiale/`); velocità 1×, 25 fps, e **deve finire sul lucchetto chiuso, centrato, fermo**, con la posizione del marchio nell'ultimo fotogramma nota (così il volo parte dal punto giusto). Il progresso di caricamento fa da cancello come oggi. Finché il file non c'è, `drawn` (A–C). Totale minimo ≈ 2,25 s; tetto **3 000 ms** con `drawn`, **3 600 ms con `video`** — il tetto è la scadenza dello **stacco** (decisione del 16/9): tenuta e volo possono sovrapporsi alla rivelazione della pagina, così l'animazione non si accelera e la pagina non aspetta il volo (decisione del 9/9: l'animazione dei ragazzi dura 3,04 s e non si accelera — è loro; il tetto deve contenere anche tenuta e volo). Visita successiva nella sessione: come oggi (300 ms, marchio chiuso e pieno, stacco) **oppure** solo il volo (500 ms) — da provare, la seconda è più elegante. Reduced motion: marchio chiuso, 300 ms, stacco, niente volo. **Cosa è arrivato davvero e cosa va richiesto a Nicholas: `handoff-rifinitura.md`, sezione "Animazione del loader".**

Perché il volo: lega loader e chrome in un unico gesto ("il lucchetto è quello lassù"), e trasforma lo stacco in continuità senza usare una dissolvenza. Costo: LCP mobile arretra di ~1,2 s (da 88 a ~80 su Lighthouse). **Scelta registrata**: si accetta, il gesto vale più del punteggio; il sito resta 100/100 sugli altri tre assi e la pagina Studio resta 99.

## 3. Le interazioni iniziali

- **Indizio di scroll**: alla prima visita, se dopo 4 s nell'HOLD 1 non c'è stato scroll, il **secondo foro** della nav fa due lampi `ink` (`f5` acceso, `f5` spento, due volte); si ripete una volta dopo altri 8 s, poi mai più. Nessun testo "scroll", nessuna freccia. Su mobile lo stesso, sulla nav in basso.
- **Hover del wordmark**: la staffa si solleva di 3 unità (`f5`) e torna: il lucchetto "respira" quando lo tocchi; click = torna in cima. Gratis, e insegna che il lucchetto è un oggetto.
- **Linea del tempo**: al primo `pointermove` sulla reel, l'icona audio appare con la stessa salita di 16 px dell'HUD della Sala, invece di stare sempre lì: coerenza fra i due schermi.

## 4. Posizioni della Direzione sulle richieste prevedibili

**"Più fancy, meno freddo."** Il freddo non viene dalla mancanza di effetti ma da tre cose: il loader meccanico (v2 sopra), il testo segnaposto in ogni sezione (arriva il loro), e i video assenti (la reel e i breakdown sono l'80 % del calore del sito: oggi ci sono poster fermi). Prima di aggiungere ornamenti si mettono i contenuti veri, poi si giudica. Se dopo resta freddo, le leve sono: la luce di sala più calda (SALA e TAGLIO +20 % di intensità), il fondo nero della prova, la grana (un `noise` leggerissimo a 3 % sul fondo `void`, statico, un PNG da 2 kB in tile — non un canvas animato).

**Lucchetti rossi in giro.** Sì, ma contati. Il marchio in rosso è ammesso in **quattro posti**: loader (C–E), favicon e OG, il **foro attivo della nav che diventa il marchio** (12 px, rosso, al posto del rettangolo pieno), e il footer (angolo della card, 18 px). *(Il quinto, deciso l'8/9 sera: il marchio che si chiude nella conferma d'invio della Stanza — `mobile-semplice-spec.md` §4.)* Non ammesso: lucchetti decorativi sparsi, pattern, cursore. Regola: il rosso è segnale **e** marchio; mai testo piccolo, mai sfondo.

**Pillola della lingua "stile Apple".** Due direzioni da mostrare: **(a)** il testo `IT / EN` di oggi con un sottile **foro** di perforazione acceso sotto la lingua attiva — stessa grammatica della nav; **(b)** un interruttore a due posizioni disegnato come una perforazione lunga (24×12) con il cursore `ink` che scorre (`f5`, `easeArrive`) e le due sigle ai lati. Consigliata **(a)**: coerente, minima, senza vetro. Il vetro traslucido con blur è respinto: è la pillola di tutti.

**Footer con la card 3D.** Il vecchio `GlassPanel` (tilt al mouse + spotlight) può tornare **solo sulla card CTA del footer**, come pezzo unico. Rotazione max ±4°, spotlight al 14 %, niente blur del fondo (la card è opaca `obsidian` con bordo `dust`), disattivo su touch e reduced motion. Il rosso nel footer: richiamo in `stone`, **email in `crimson` a corpo display** (≥ 24 px: 4,37:1 è sopra i 3:1 richiesti al testo grande), hover in `ink`.

**Sfondo tutto nero.** La Stanza è già nera; la prova riguarda lo Studio (`STAGE_BG`). Decidono loro dagli screenshot. Se scelgono nero: la luce SALA sale al 14 % per non perdere la stanza.

**Pagina Studio prerenderizzata.** Sì, in questa fase: il testo dentro l'HTML (script di build con `renderToString`, nessuna libreria) — vale per SEO e per "copia e incolla nel preventivo", non per i kB. Il target di peso nel piano diventa "< 90 gz, codice di pagina < 5".

**Pulizie**: `framer-motion` resta solo se torna la card del footer, altrimenti si toglie insieme a `StageReveal.tsx` (mai usato); `tailwind-merge`/`clsx` verificati.

## 5. Cosa resta fermo

La carrellata **sul desktop**, i quattro set, le luci, la deck, il form, la tipografia Outfit, il marchio in `ink` nel chrome. Chi chiede di cambiare questi non sta chiedendo una rifinitura.

## 6. Mobile → `mobile-semplice-spec.md`

Il telefono ha una spec sua. Qui resta solo la storia, perché serve a non ripetere gli errori:

**8/9 mattina.** Genna prova l'anteprima sul telefono: scroll confusionario, la pagina che scatta su e giù, sezioni tagliate, "Parliamone." sempre visibile, orizzontale sovrapposto. L'emulazione a 390×844 non mostrava niente di tutto ciò. **Regola: il mobile si valida su un telefono vero.**

**Lotto 1** — `normalizeScroll` su touch, magnete da `scrollEnd`, `autoAlpha` su tutti i set, Stanza allineata in alto: chiude gli scatti e i tagli. Resta fuori l'orizzontale, e le barre di Safari non si ritirano più (prezzo di `normalizeScroll`, accettato allora).
**Lotto 1 bis** — `viewport-fit=cover`, safe area, Stanza stretta da 861 a 640 px. L'orizzontale resta inservibile.
**Lotto 1 ter** — la Direzione chiude l'orizzontale: niente versione coricata, schermo intero = **player nativo del telefono**, via l'invito a ruotare; la modalità statica diventa una pagina vera. Ma sul telefono tornano la striscia nera e il ping-pong.
**Lotto 1 quater** — la sonda `?probe=1`, l'altezza del palco scritta da JavaScript, magnete spento su touch. Il lavoro è pulito; sul telefono i problemi restano.

**8/9 sera — la decisione.** La Direzione chiede tre cose (schermo intero anche dietro le barre di Safari, niente più glitch in salita, niente conflitto fra lo scroll dei contatti e quello della pagina) e aggiunge: «se dobbiamo smattare, preferisco una cosa semplice e funzionale». Quelle tre cose **non sono compatibili con la carrellata su touch**: entra in vigore il piano B, e la spec del telefono è `mobile-semplice-spec.md`. Il desktop non cambia.

**Regola che resta, scritta a caro prezzo**: quando una piattaforma ha rimandato indietro quattro consegne di fila, il difetto non è nelle consegne — è nel voler portare lì una cosa che lì non ci sta.

## 7. La variante A per i ragazzi (richieste dell'8/9)

I ragazzi hanno chiesto una **variante** da confrontare con il sito attuale. Si costruisce sul branch **`variante-a`** (Cloudflare Pages le dà un'anteprima propria, `variante-a.lock-vfx.pages.dev`): due indirizzi, stesso codice, **default diversi** delle costanti già previste. Così scelgono guardando, e la scelta è un cambio di default, non un lavoro. Le decisioni della Direzione, richiesta per richiesta:

1. **Logo rosso nella home** (invece che `ink`) → costante `MARK_COLOR: 'ink' | 'crimson'` sul chrome della home; nella pagina Studio resta `ink`. Accolta come variante. Nota per loro: se scelgono il logo rosso, il foro attivo torna `ink` (R06 si spegne).
2. **Animazione di Nicholas nel loader, poi il lucchetto va in alto a sinistra** → è il loader v2 (§2) con l'aggancio `LOADER_SOURCE`. **Coincide con quello che avevamo già deciso.**
3. **Togliere "LockVFX" accanto al logo nella home, tenerlo nelle altre pagine** → **rivista il 9/9 (R17 bis)**: `WORDMARK_TEXT: 'always' | 'after-first-screen'`, default `'after-first-screen'` in entrambe le versioni — la parola non c'è sulla prima schermata e compare in dissolvenza `f5` dalla seconda sezione (`mobile-semplice-spec.md` §7). Non è più una variante.
4. **Sala: il video parte da solo e per 2–3 s si vedono i player sotto, alzati e semitrasparenti, poi spariscono** → all'ingresso nella Sala l'HUD si mostra da solo (opacità 0,75) per **2,5 s**, poi si nasconde. Accolta per entrambe le versioni, prima entrata per visita.
5. **Sfondo tutto nero in Studio e Contatti** → `STAGE_BG = 'void'`; luce SALA al 14 %. Accolta come variante.
6. **Footer identico al vecchio** → `GlassPanel` con tilt e spotlight sulla card CTA, pillola del pulsante e icone come nell'originale; il blocco legale resta (non è negoziabile).
7. **"Torna al sito" dalla pagina Studio riporta allo Studio, non in cima** → `/#studio`; la home, se arriva con `#studio`, dopo il loader breve va alla sezione senza carrellata (cut). Vale anche per "Scrivici" → `/#contact`. Accolta, per entrambe le versioni.
8. **Tutti i "Scrivici" portano al form** → footer (home e Studio) e CTA della pagina Studio → `#contact` con scroll alla sezione e focus sul primo campo. Accolta, entrambe le versioni.

Ordine: prima il mobile, poi le interazioni comuni (Lotto 2, con 7 e 8), poi la variante (Lotto 3). La variante senza un mobile che funziona non serve a nessuno.

## 8. Video in alta qualità, senza pagare e senza rallentare (9/9)

**La richiesta**: i ragazzi vogliono mostrare showreel e breakdown in alta definizione; i limiti di peso della lista (≤ 8 MB / ≤ 4 MB) sono stretti per chi lavora in 4K.

**Il principio**: il peso di un file **non è più un costo** e non è ciò che rallenta il sito; ciò che conta è il **bitrate** (quanti megabit al secondo servono per riprodurlo senza fermarsi) e **quando** il download parte. Su Cloudflare R2 il traffico in uscita è gratis (10 GB e 10 milioni di letture al mese senza spesa): un reel da 60 MB costa quanto uno da 6. E il sito già carica poster e metadati prima del video, e lo fa partire quando ha bufferizzato abbastanza: con `faststart` un file da 60 MB comincia dopo 1–2 s come uno da 6. Quindi: **sì all'alta qualità, con tre regole.**

1. **Loro consegnano i master, noi facciamo le versioni web.** Non si chiede a un VFX artist di comprimere per il web: si chiede il master (ProRes o H.264 ad alto bitrate, 1080p o 4K, 16:9; il montaggio verticale per il telefono), via Drive/WeTransfer, mai nel repo. Le versioni web le produce uno script nel repo (`scripts/encode-video.mjs`, ffmpeg sul PC di Genna) con preset fissi, così sono uguali per tutti i file e ripetibili quando un video cambia.
2. **Due versioni per ogni video, scelte dal sito** — è l'"adattivo dei poveri", e basta: **HD** 1080p H.264 High, CRF 19, tetto **10 Mbit/s** (`-maxrate 10M -bufsize 20M`), `+faststart`, audio via se muto; **SD** 720p CRF 22, tetto 3,5 Mbit/s. Sul telefono il montaggio verticale ha le sue due (1080×1920 a 8 Mbit/s; 720×1280 a 3). Il sito sceglie una volta al caricamento: `saveData` o rete `2g/3g` → SD; larghezza ≥ 1024 e rete `4g` (o sconosciuta) → HD; altrimenti SD. Un 4K sul sito **no**: nessuno lo distingue su un browser a schermo intero e raddoppia il bitrate; il 4K vive nel **"Guarda il video completo"**, che porta al loro Vimeo/YouTube — gratis, in 4K, senza toccare le prestazioni del sito (link, non embed: niente cookie di terzi).
3. **Un solo formato: H.264/MP4.** Il WebM VP9 fa risparmiare banda su Chrome ma raddoppia i file da produrre e non cambia l'esperienza; su R2 la banda è gratis. Si toglie dalla lista. (AV1 quando Safari lo leggerà ovunque: non ora.)

**Numeri attesi**: reel 60 s → HD ~55–70 MB, SD ~22 MB, verticale ~45/18; breakdown 30 s → HD ~30 MB, SD ~12. Totale su R2 per reel + tre lavori, tutte le versioni: **≈ 350–450 MB, costo 0 €**. Se un giorno servisse un adattivo vero (HLS, cambio di qualità durante la riproduzione), Cloudflare Stream costa 5 $ per 1 000 minuti *archiviati* al mese e 1 $ per 1 000 minuti *visti*: per quattro video sono centesimi al mese finché le visite restano quelle di un portfolio. Non serve oggi.

**Cosa cambia nel sito** (ticket R11, ampliato): `works.ts` e la Reel leggono `{ hd, sd, poster }` (e `mobile: { hd, sd, poster }` per la reel) con il prefisso `VITE_MEDIA_URL`; una funzione `pickRendition()` in `src/lib/media.ts` decide una volta per visita; il loader conta come "primo segmento" quello della versione scelta; la deck e la Sala non cambiano. Preload: solo poster e metadati, come oggi. Per le prestazioni misurate: Lighthouse non cambia (il video non è nell'LCP), la prima riproduzione parte entro 2 s su 4G con HD, entro 1 s con SD.

## 9. Il giro del 18/9 — loader v3, il marchio vero, la pillola, il footer (Direzione)

*Genna ha visto l'anteprima con i Lotti M ter–4. Sei osservazioni, tutte accolte; qui le decisioni. Vincono su §2, §3.2, §4 e §7 dove dicono altro.*

### 9.1 Il marchio è il loro logo, riempito, rosso

Il lucchetto nel chrome oggi è **il nostro disegno a filo** (stroke `currentColor`, staffa sollevata). Genna: «dobbiamo usare esattamente il loro logo». Decisione: il componente `Mark` disegna i **tre path dell'SVG ufficiale riempiti** (`src/assets/brand/lockvfx-mark.svg`: staffa, corpo, foro), niente stroke. **Colore nel chrome: `crimson`**, sempre, in tutte le pagine (`MARK_COLOR` di §7.1 diventa il default su `v2`, la costante resta). Staffa **chiusa** nel chrome (è il logo, non la metafora). La staffa mobile resta solo dove ha una funzione: la conferma della Stanza (riempita `ink`, si chiude come oggi). Il foro attivo della nav **non porta più il marchio** (R06 annullato): i quattro fori tornano tutti uguali, `ink` pieno l'attivo, `stone` 40 % gli altri — Genna ha visto «un lucchetto rosso a destra» e non l'ha capito, e ha ragione: due lucchetti rossi sulla stessa riga sono uno di troppo.

### 9.2 Loader v3 — respira, ed è il loro logo che arriva

Sostituisce la coreografia A–E di §2 quando `LOADER_SOURCE = 'video'` (che è il default). Riferimento di ritmo: l'intro di tinytemplestudio.it — un po' più corta.

| fase | durata | cosa succede |
|---|---|---|
| **0 attesa** | finché il video è pronto (`canplaythrough`), tetto 6 000 ms | overlay `void`. Il video **non parte finché non è scaricato**: è questo che oggi manca a cache vuota (parte, si blocca, il loader stacca e non si vede niente). Se al tetto il video non è pronto → ramo `drawn` |
| **A ingresso** | 300 ms | il video entra in dissolvenza |
| **B animazione** | 3 033 ms, **velocità 1×** | il loro video, 512² disegnato a 165 px (zoom 1,25), `mix-blend-mode: screen`. `logo.mp4` **prima** del `.webm` nelle `<source>` |
| **C tenuta** | 400 ms | ultimo fotogramma fermo |
| **D innesto** | 400 ms | **dissolvenza incrociata** dall'ultimo fotogramma al `Mark` riempito `crimson`, **stessa misura e stessa posizione** (il centro del lucchetto nel video coincide col centro del `Mark`: misurarlo una volta sull'ultimo fotogramma e scriverlo come costante). È il punto che oggi «non va bene»: il salto dal 3D al 2D. Va provato con screenshot a metà dissolvenza |
| **E respiro** | 300 ms | fermo |
| **F volo** | 900 ms, `easeInOut` (es. `cubic-bezier(.7,0,.2,1)`) | il `Mark` vola in alto a sinistra fino alla posizione del marchio del chrome; **nello stesso momento** l'overlay si dissolve (900 ms) e sotto la reel è già in riproduzione. Il marchio del chrome compare quando il volo atterra (swap secco, stesso pixel) |

Totale ≈ 5,3 s dal video pronto. Nessuna accelerazione dell'animazione. Reduced motion: `Mark` fermo 300 ms, stacco, niente volo.

**Quando si vede.** Genna: «dev'essere presente le volte successive che visito il sito; se ci sono appena entrato no». Regola: **loader pieno a ogni nuova sessione del browser** (`sessionStorage`, non `localStorage`); dentro la stessa sessione (torno dalla pagina Studio, ricarico) → **breve**: marchio già al suo posto, dissolvenza 300 ms. Il ricaricamento a cache vuota **è** una visita piena e deve funzionare (fase 0).

**Qualità.** Il `.webm` consegnato era a 47 kbit/s (17 kB): era lui lo «sgranato». Ricodificato dall'mp4 (VP9 CRF 22, 41 kB) il 18/9. Il master ProRes che abbiamo è 512² col lucchetto a 1/6: inutilizzabile per fare meglio. **Da chiedere a Nicholas** (in `cosa-ci-serve`): la stessa esportazione ritagliata a **1024×1024 ProRes 4444 con alpha** — con l'alpha vera si toglie `screen` e il lucchetto si stacca pulito su qualsiasi fondo; le versioni web (VP9 alpha + H.264) le facciamo noi.

### 9.3 La pillola della lingua (sostituisce §4 e R08)

In alto a destra una **pillola**: altezza 32 px, padding 0 12 px, bordo 1 px `stone` 28 %, fondo trasparente, testo cap 12 px `ink` con la lingua corrente (`IT`, `EN`) e un chevron 10 px `stone`. Hover: bordo `stone` 60 %. Clic → **tendina** sotto la pillola, allineata a destra, 8 px sotto: pannello `obsidian` al 85 % con `backdrop-filter: blur(16px)` (**l'unico vetro del chrome**, motivato: sta sopra il video), bordo 1 px `stone` 20 %, raggio **6 px** (uno dei due raggi del sito; la pillola tonda è l'unica eccezione, dichiarata in `tokens.ts` come `radius.pill`), ombra `0 12px 32px rgba(0,0,0,.5)`; voci `Italiano`, `English` (una riga ciascuna, 14 px, 40 px di altezza, padding 0 14 px), la corrente con un segno di spunta `crimson` a destra; hover voce: fondo `ink` 6 %. Apertura: opacità 0→1 e `translateY(-4px)→0` e scala .98→1 in 160 ms `easeArrive`; chiusura 120 ms. Si chiude con Esc, clic fuori, scelta. Tastiera: pillola = `button aria-haspopup="listbox" aria-expanded`; tendina = `role="listbox"`, frecce, Enter, `aria-selected`. Touch: identica, area ≥ 44 px. La lista delle lingue viene da i18n (oggi due; la tendina non cambia se ne arrivano altre). `LANG_PILL` di §4 e i due rami di R08 **si tolgono**: c'è un solo disegno.

### 9.4 Il footer torna con la card 3D (R20 su `v2`)

R20 della variante diventa il default: si porta su `v2` il commit della card (`cherry-pick` da `variante-a-rw`), con la decisione del 16/9: su touch e con reduced motion la card **tiene fondo `obsidian` e bordo**, perde solo tilt e spotlight. `FOOTER_CARD` resta come costante, default `tilt`.

### 9.5 Loader sul telefono: il cancello non può essere `canplaythrough` (18/9, sera)

Genna sull'iPhone: «non si vede l'animazione». Causa: iOS Safari **non scarica un video finché non lo si fa partire** — `preload="auto"` è ignorato e `canplaythrough` non arriva mai; il cancello aspetta 6 s e ripiega su `drawn`. Regola nuova per la fase 0: appena il componente monta, `video.play()` **subito** (è `muted playsInline`, l'autoplay è permesso); il segnale "pronto" è il **primo `timeupdate` con `currentTime > 0`** (o `playing`): a quel punto `pause()`, `currentTime = 0`, e parte A (ingresso) → B (`play()` di nuovo, riprende dal buffer). Se `play()` **rifiuta** (risparmio energetico, autoplay negato) → `drawn` **subito**, non dopo 6 s. Il tetto di 6 s resta come rete. Su desktop il comportamento non cambia (il primo `timeupdate` arriva prima di `canplaythrough`, l'attesa si accorcia).

### 9.6 La tendina della lingua: vetro liquido, stile visionOS (sostituisce il materiale di §9.3; le misure della pillola e l'accessibilità restano)

Genna: «troppo squadrata, la voglio più stondata e liquid glass, stile visionOS». Vale **su tutte le viewport** (un solo disegno). È il posto dove il vetro del sito vive, ed è l'unico.

- **Pannello**: raggio **20 px** (`RADIUS.glass`, quarto valore dichiarato in `tokens.ts` accanto a `pill`: la famiglia "vetro" ha i suoi raggi, il resto del sito tiene 2 e 6), fondo `obsidian` al **55 %**, `backdrop-filter: blur(24px) saturate(140%)`, **filo interno** `inset 0 0 0 1px rgba(255,255,255,.10)`, **riflesso** in alto `linear-gradient(180deg, rgba(255,255,255,.07), transparent 45%)` sovrapposto, ombra `0 20px 50px rgba(0,0,0,.55)`. Padding **6 px**. Larghezza 176 px, 10 px sotto la pillola, allineato a destra.
- **Voci**: altezza **44 px**, padding 0 14 px, testo 15 px `ink` (peso 400), raggio **14 px** (= 20 − 6: raggi concentrici, non un altro token). Corrente: fondo `rgba(255,255,255,.10)` e spunta `crimson` a destra; hover/focus: fondo `rgba(255,255,255,.07)`.
- **Pillola**: stesso materiale in piccolo — fondo `obsidian` 40 %, `blur(16px)`, filo interno `rgba(255,255,255,.12)`, testo `ink`; il chevron ruota di 180° all'apertura (160 ms). Sul telefono altezza 36 px (area 44 con il pseudo).
- **Motion**: apertura 220 ms, `transform-origin` in alto a destra, `scale(.94) → 1` e opacità con `cubic-bezier(.2,.8,.2,1)`; chiusura 140 ms in dissolvenza e `scale(.97)`. Reduced motion: solo opacità.
- **Fallback**: dove `backdrop-filter` non c'è (`@supports not`), fondo `obsidian` al 92 %. Niente `mix-blend-mode`.

### 9.7 Il primo tacco deve rispondere (7/10, dai ragazzi)

Denis e Nicholas: «appena apro il sito e scrollo, la showreel non si muove fino a una certa percentuale: con la rotella una scrollata che mi lascia fermo sembra un bug, o sembra che ci sia solo la showreel». Hanno ragione: l'HOLD 1 (0–60 vh) è una zona morta, e una zona morta all'inizio è il posto peggiore. Genna aggiunge il vincolo giusto: la reel inquadrata per intero è **un solo fotogramma** (0 vh), e chi tocca appena la rotella o risale senza arrivare in cima deve comunque ritrovarla.

Decisione, in tre righe:
1. **Il dolly back parte da 0 vh**, non da 60: la reel arretra (`MOVE.reelZ`, `reelY`) in modo lineare su 0–150 vh, così al primo tacco (≈ 100 px, 11 vh) il riquadro è già visibilmente più piccolo (criterio misurabile: entro 1 s da un tacco di 100 px, a 1440×900, i bordi della reel si sono spostati di **≥ 8 px** — poi la zona di ritorno riporta a 0). Niente altro si anticipa: il velo resta 60→105 e le righe dello statement da 105 (Regola di T1 intatta). **La risposta è la reel stessa che arretra, non un segnale aggiunto**: è il "Director's Monitor" che si allontana, e dice da solo che sotto c'è altro.
2. **Zona di ritorno 0–75 vh**: l'HOLD 1 diventa un punto (`{ from: 0, to: 0 }`) e il magnete, a rotella ferma, riporta a **0** da qualunque posizione sotto 75 vh, in entrambe le direzioni; fra 75 e 150 vale la regola di direzione (scendendo → 190, risalendo → 0); dentro 0–75, scendendo, il primo gesto che si ferma torna a 0, dal secondo gesto consecutivo (entro 3 s) il magnete porta a 190. Così chi sfiora la rotella, o risale e si ferma vicino alla cima, ritrova la reel inquadrata; chi scorre tacco per tacco, o va oltre, arriva allo statement. Gli altri HOLD e la regola di direzione non cambiano.
3. **Il segnale minimo a riposo** resta quello già scritto (§3, R03): due lampi del secondo foro a 4 s e 12 s, prima visita, finché non si scrolla. Nessun elemento nuovo: aggiungere un indicatore sarebbe ammettere che la scena non parla.

Da verificare: a 390×844 non cambia niente (su touch non c'è carrellata); con reduced motion idem; il loader stacca con la reel a 0 vh.

Il sito si apre sempre dalla cima: `history.scrollRestoration = 'manual'` (7/10).

### 9.8 I campi del form: una riga, non un rettangolo (7/10, Genna)

«Non voglio che i campi si illuminino di rosso tutto intorno: la linea in basso si colora di rosso e basta.» Giusto: il rettangolo (`outline` aggiunto dalla QA per il fuoco, D17) tradisce il disegno dei campi a solo bordo inferiore.

- **A fuoco**: la riga inferiore passa da `stone` 55 % a **`crimson`, 2 px** (sempre 2 px, anche a riposo, per non far saltare il layout — a riposo 2 px `stone` 55 %), e l'**etichetta** cap sopra il campo passa a `crimson`. Nessun `outline`, né col mouse né da tastiera: la riga a 2 px e l'etichetta sono l'indicatore di fuoco (crimson su void ≥ 3:1, area ≥ 2 px: basta per WCAG 2.4.7/2.4.11).
- **Errore**: riga `crimson` 2 px + messaggio sotto (com'è); se il campo errato prende il fuoco, l'etichetta diventa `crimson` anch'essa.
- La checkbox e i pulsanti tengono il loro fuoco (il quadrato della presa visione, il pulsante Invia con `outline` 1 px `crimson` di `globals.css`): la regola riguarda solo i campi di testo e la textarea.
