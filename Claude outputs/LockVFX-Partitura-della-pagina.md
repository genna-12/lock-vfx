# LockVFX — Partitura della pagina

*v1 — 6 settembre 2026. Storyboard sezione per sezione del sito monopagina. Per ogni battuta: cosa c'è a schermo, cosa si muove e perché, cosa lo innesca, la variante mobile, la variante reduced-motion, gli asset necessari. È il documento che il codice deve trascrivere; se qualcosa non è qui, non va animato.*

---

## Il filo (quello che si racconta fra le righe)

Il concetto è **picture lock**: LockVFX prende un'immagine bloccata e la finisce. La pagina lo racconta senza mai dirlo, con tre segni ripetuti e una grammatica di montaggio.

- **Il click.** La staffa del lucchetto che si chiude = *locked*, finito, pronto. Apre il sito (loader) e lo chiude (footer). Compare anche, in piccolo, quando un'azione va a buon fine (form inviato).
- **La linea rossa.** La hairline crimson del wipe plate|comp. È l'unico rosso "attivo" della pagina: cursore del reveal, barra di avanzamento reale della showreel, foro attivo della nav.
- **Le perforazioni.** La colonna di fori del logo è l'indice: nav segnalibro (un foro per sezione), numerazione degli shot, maniglia del wipe, divisore.
- **Stacco, non dissolvenza.** Le sezioni cambiano con un taglio. Le sole cose che scorrono con continuità sono ciò che ha una durata reale: il video, il wipe, la strip.
- **Un rosso alla volta.** Un rosso persistente (il foro attivo della nav) e al massimo un rosso transitorio (la linea del wipe che stai muovendo, la barra della reel). Mai glow, mai blob, mai emissivo.

### Grammatica del motion (valori condivisi, vanno nei token)

| nome | valore | uso |
|---|---|---|
| `cut` | 0 ms | cambio sezione, apparizione dei testi, title card |
| `f2` | 83 ms (2 frame a 24 fps) | il click della staffa, il feedback di un tap |
| `f5` | 208 ms | hover, cambio stato, apparizione slate |
| `f8` | 333 ms | wipe automatico "all'arrivo", scroll verso ancora |
| `f12` | 500 ms | reveal della strip al primo ingresso |
| `easeCut` | `linear` | wipe, barre di avanzamento (ciò che rappresenta tempo o posizione) |
| `easeArrive` | `cubic-bezier(0.2, 0, 0, 1)` | ciò che si ferma in un punto (strip, scroll ad ancora) |

Nessuna molla, nessun overshoot, nessun blur in ingresso. `prefers-reduced-motion`: tutto ciò che è `f8`/`f12` diventa `cut`; il video non parte da solo; il wipe diventa un toggle.

### Nav "segnalibro" (persistente)

- **Desktop**: colonna di 4 perforazioni sul bordo destro, centrata verticalmente, 12×16 px ciascuna, gap 10 px; il foro della sezione corrente è pieno crimson, gli altri sono contorno `slate` al 40%. Hover: etichetta mono a sinistra del foro (`REEL · STUDIO · WORK · CONTACT`). Click: scroll all'ancora (`f8`, `easeArrive`). È un `<nav>` con lista di link `#reel #studio #work #contact`: funziona senza JS.
- **Mobile**: stessa colonna, bordo destro, allineata in basso a destra (zona del pollice), area di tocco 44 px per foro tramite padding; etichette mai mostrate (il foro pieno basta).
- **Wordmark** `LockVFX` in alto a sinistra, sempre visibile, torna in cima. **Lingua** in alto a destra, pillola mono `IT / EN`, opaca (niente vetro).
- Il foro attivo cambia con `IntersectionObserver` (soglia 50%), con `f5`.

---

## 0 · Loader — "Lock"

**A schermo.** Nero pieno. Al centro il marchio in linea sottile (stroke 1,5 px, `ink`), corpo completo, staffa assente. Nient'altro: nessuna percentuale, nessuna scritta.

**Cosa si muove e perché.** La staffa si disegna da sinistra a destra (`stroke-dashoffset`) in proporzione al **caricamento reale**. Al 100%: la staffa scende di 3 px nel corpo (il *click*, `f2`), il tratto diventa pieno crimson per un solo frame, poi **stacco** sulla showreel. Nessuna dissolvenza: il click *è* il taglio.

**Cosa misuriamo (in modo che non sia finto).** Progresso pesato: font caricati 10%, SVG del marchio 5%, poster della reel 15%, chunk JS critico 20%, primo segmento della showreel disponibile (`canplay` o ≥ 2 s bufferizzati) 50%. Minimo 800 ms (sotto, l'occhio non legge il disegno), massimo 2 500 ms (oltre, si parte comunque e il video arriva quando arriva). Visita successiva nella stessa sessione (`sessionStorage`): il marchio appare già chiuso, 300 ms, click, stacco.

**Trigger.** Tempo/caricamento. Nessuna interazione richiesta; nessun "entra".

**Mobile.** Identico, marchio 88 px di altezza.

**Reduced motion.** Marchio completo da subito, 300 ms, stacco.

**Asset.** Logo in **SVG con la staffa come path separato** (senza, questa battuta non si può fare bene). Placeholder attuale: tracciato approssimato.

**Da non fare.** Entrare "dalla serratura"; far volare il lucchetto; il 3D qui non serve.

---

## 1 · Showreel — "Reel"

**A schermo.** Video a piena pagina, muto, in loop, poster nitido. In basso a sinistra, su una colonna: l'**h1** (una riga: chi + per chi, es. *"Effetti visivi per il cinema e la pubblicità."*) e una riga in mono sotto: *"[Nome] e [Nome] — VFX artist"* (la trasparenza legale comincia dal primo schermo). In basso a destra, la **slate** in mono: `SHOWREEL 2026 · 01:12` + toggle audio (`⏵ AUDIO`). Sul bordo inferiore del video, una **hairline crimson** che è la barra di avanzamento *reale* del video (`currentTime / duration`): è l'erede onesto del timecode.

**Cosa si muove e perché.** Solo il video e la sua barra. I testi sono già lì al taglio dal loader (nessun fade-up: un titolo di testa non "entra", c'è).

**Trigger.** Autoplay muto. Il toggle audio attiva l'audio. Scroll: la sezione è alta 100vh e *non* è pinnata — si lascia con un taglio; il video si mette in pausa quando esce dal viewport (performance).

**Mobile.** Video in `object-fit: cover` con `object-position` da concordare shot per shot (i frame 16:9 in verticale perdono i lati); chiedere a LockVFX se vogliono una **versione 4:5 della reel** per mobile — è l'opzione migliore. Encode separato più leggero (≤ 720p). h1 su due righe, slate sopra la barra.

**Reduced motion / Save-Data.** Nessun autoplay: poster + pulsante `⏵ PLAY REEL`.

**Asset.** Showreel H.264 + WebM, 1080p desktop e ≤ 720p mobile, muta o con audio separabile, poster PNG/WebP del primo frame; durata da 20 a 40 s.

---

## 2 · Studio + servizi + strip — "Plate / Comp"

Tre battute in una sezione (`#studio`).

### 2a · Title card + dichiarazione

**A schermo.** Fondo `obsidian`. Colonna sinistra (desktop 5/12): una **title card** in display, due o tre righe (testo loro; struttura: *chi siamo* + *come lavoriamo*). Sotto, la riga di trasparenza: *"LockVFX è il nome con cui [Nome] e [Nome], VFX artist liberi professionisti, collaborano."* Colonna destra (6/12, allineata in basso): i **servizi** come una riga di token mono separati da un foro di perforazione: `COMPOSITING · 3D/CGI · MATTE PAINTING · ENVIRONMENT · CLEANUP · FX/SIM · FINISHING`. Nessuna icona, nessuna card, nessuna griglia di servizi.

**Cosa si muove.** Niente. I testi sono presenti al taglio (a 40% di visibilità della sezione). La title card non fa fade: appare.

**Mobile.** Colonna unica: title card, trasparenza, token dei servizi che vanno a capo con lo stesso separatore.

### 2b · Strip dei frame plate|comp (il wipe)

**A schermo.** Una fila orizzontale di **n frame 16:9** (min 4, ideale 6–8), uno in vista per volta al centro con i vicini che sbucano ai lati (~8%). Ogni frame: sopra, la **linea del wipe** (1 px crimson) con una **maniglia a forma di perforazione** (12×16 px, crimson) a metà altezza; ai lati della linea, due etichette mono `PLATE` e `COMP` (slate al 60%). Sotto il frame, la **slate**: `SH010 · ENVIRONMENT · Titolo del film` a sinistra e `03 / 07` a destra. Sotto la strip, l'**indice a perforazioni** (un foro per frame, pieno quello corrente) e due frecce testuali mono `← PREV` / `NEXT →`.

**Cosa si muove e perché.**
- *Arrivo di un frame al centro*: il wipe parte da 0% (tutto plate) e si porta al 50% in `f8` lineare. L'arrivo *è* il reveal: chi non tocca nulla vede comunque il prima/dopo.
- *Puntatore sul frame (desktop)*: la linea segue la x del puntatore, 1:1, senza inerzia (è la posizione, non un oggetto che insegue). Uscita: la linea resta dov'è.
- *Touch*: drag sulla maniglia o ovunque nel frame (asse x); tap sul frame alterna 0%/100% con `f8`.
- *Cambio frame*: desktop, rotella/trackpad orizzontale o frecce; touch, swipe con snap. Il movimento della strip è `f8` `easeArrive`. Il foro dell'indice si riempie con `f5`.

**Perché non pinnare.** Una sezione pinnata che converte lo scroll verticale in orizzontale è più "spettacolare" ma fragile su touch e trackpad e sequestra lo scroll. La strip a scorrimento orizzontale nativo con `scroll-snap` funziona ovunque, è accessibile (è una lista), e mantiene il ritmo veloce che vogliamo. Se dopo il greybox il gesto risultasse poco scoperto, si aggiunge il wheel→horizontal solo su desktop.

**Mobile.** Frame a tutta larghezza meno 24 px per lato (i vicini sbucano di 12 px), altezza 16:9, drag della linea; slate su due righe; indice sotto.

**Reduced motion.** Nessun wipe automatico all'arrivo (frame al 50% fisso); il drag funziona; in più un bottone mono `PLATE / COMP` che alterna 0/100 con `cut`.

**Asset.** Coppie plate/comp allineate al pixel, 2560 px, 16:9 (o 2.39 con barre già dentro), di **discipline diverse**; per ognuna: shot code, disciplina, titolo/produzione, diritti. Placeholder: le 2 coppie attuali duplicate.

**Nota tecnica.** Wipe in DOM: due `<img>` sovrapposti, il comp con `clip-path: inset(0 0 0 X%)`; la linea è un `<div>` posizionato in `X%`. Nessun WebGL. `srcset` a 3 taglie, `loading="lazy"` oltre il primo frame, `decoding="async"`. Il disco-lente attuale non torna in questa sezione: potrà tornare come loupe di dettaglio se un giorno ci sarà una pagina progetto.

---

## 3 · Portfolio — "Breakdown"

**A schermo.** Title card `WORK` (mono, piccola) + una riga in display (testo loro, es. *"Lavori selezionati"*). Poi i lavori come **frame 16:9** con il **video breakdown** dentro: il primo a piena larghezza, i successivi in griglia a 2 colonne su desktop (1 su mobile). Ogni frame ha: il numero di shot a perforazione a sinistra (`01`), il **poster** finché non parte, e sotto la **billing line**: riga 1 in display piccolo *Titolo · anno*, riga 2 in mono *produzione/cliente · VFX: compositing, environment*. Dove c'è il link al video completo: nella slate a destra, `⏵ FULL VIDEO ↗` (esterno, nuova scheda). È un'unica riga mono, non un bottone a pillola: è "aesthetic" perché è nel linguaggio della slate.

**Cosa si muove e perché.** Il breakdown parte **muto** quando il frame è ≥ 60% nel viewport e si ferma quando esce; mai più di 2 video in riproduzione. Click sul frame: audio on/off (l'icona nella slate cambia in `f5`). Nessun hover-scale, nessun tilt.

**Trigger.** Intersezione; click per l'audio; link esterno.

**Mobile.** Colonna unica, autoplay muto solo con `Save-Data` off; altrimenti poster + play.

**Reduced motion.** Poster + play; nessun autoplay.

**Asset.** Per ogni lavoro: breakdown MP4/WebM ≤ 1080p (15–40 s), poster, titolo, anno, produzione, discipline svolte, link al video completo (se pubblicabile), diritti. Placeholder: i due comp attuali come poster e un rettangolo con il tempo.

---

## 4 · Contatti — "Open a shot"

**A schermo.** Title card `CONTACT` + una riga (es. *"Hai un taglio da finire?"*). Desktop 7/12 + 5/12: a sinistra il **form**, a destra i **contatti diretti**. Form: `Nome`, `Email`, `Produzione / azienda` (opz.), `Tipo di lavoro` (select con le discipline + "non so ancora"), `Messaggio`, `Link al materiale` (opz.), checkbox privacy con informativa breve, pulsante `INVIA`. Campi come righe con solo il bordo inferiore `graphite`, etichette mono sopra, focus = bordo inferiore crimson (è il rosso transitorio di questa sezione). A destra: i **due nomi** con ruolo ed email individuale, poi l'email collettiva, poi città/fuso. Chi commissiona deve vedere con chi parla.

**Cosa si muove e perché.** Invio: il pulsante mostra `INVIO…` (disabilitato), poi `LOCKED ✓` con il click della staffa in miniatura accanto (`f2`) e un messaggio *"Ricevuto. Ti rispondiamo entro [X] giorni lavorativi."* Errore: bordo del campo crimson + riga mono sotto. Niente toast fluttuanti.

**Tecnica.** EmailJS con template verso la loro casella + auto-reply al mittente; honeypot nascosto; rate limit lato client (1 invio/60 s) e restrizione di dominio nel pannello EmailJS; validazione nativa + messaggi propri; consenso privacy obbligatorio (GDPR). Decidere a chi dei due arriva (o a entrambi).

**Mobile.** Colonna unica: form, poi contatti. Input ≥ 44 px, `inputmode` corretti, niente zoom al focus (font ≥ 16 px).

**Reduced motion.** Nessun cambiamento (non c'è motion decorativo).

**Asset.** Testi, nomi, ruoli, email, città; account EmailJS; testo dell'informativa privacy.

---

## 5 · Footer — "Lock"

**Per ora**: il footer attuale, con questi contenuti obbligatori aggiunti: i **due nomi con le due P.IVA**, le email individuali, la riga *"LockVFX è un nome collettivo; ogni professionista fattura in proprio."* (wording da confermare con il commercialista), link privacy, ©. Sostituire la riga "Obsidian & Crimson".

**Il momento del lock.** Quando si tocca il fondo pagina, il marchio nel footer (lo stesso SVG del loader) chiude la staffa: `f2`, una volta per sessione. Il sito si apre e si chiude con lo stesso click.

**3D: decisione rimandata.** Con questa struttura il modello 3D **non è necessario**: il marchio 2D fa il gesto in apertura e chiusura e costa zero. Il 3D può tornare, solo nel footer, come marchio con profondità e una luce radente sulle perforazioni, *se* dopo il greybox il footer sembra piatto. Rimandare la decisione evita ~600 KB di JS finché non serve.

---

## Sistema (ciò che gli artboard mostrano)

- **Colori (ruoli)**: `void #020202` fondo del girato · `obsidian #0B0B0E` fondo di lettura · `ink #F2EFEA` testo · `slate #9A9CA3` testo secondario · `graphite #6E7078` etichette/bordi · `crimson #E60B18` segnale.
- **Tipografia (ruoli)**: *display* per h1, title card, titoli dei lavori · *testo* per corpo · *mono* per slate, nav, token dei servizi, etichette del form. La coppia si sceglie sugli artboard.
- **Scala**: display 56/40/28 (desktop) → 36/28/22 (mobile), testo 18/16, mono 12/11 con tracking 0.08em, maiuscolo solo nel mono.
- **Spaziatura**: sezioni a `clamp(96px, 12vh, 160px)`; colonne 12 con gutter 24; margine pagina 48 desktop / 20 mobile.
- **Bordi**: 1 px, mai arrotondati sopra 2 px (i frame sono frame, non card).

## Cosa chiedere a LockVFX adesso

Showreel (due encode + poster, ed eventuale 4:5), 6–8 coppie plate/comp di discipline diverse con slate e diritti, breakdown con poster/credits/link, testi (title card, trasparenza, servizi, contatti), nomi/ruoli/email/P.IVA, logo SVG con staffa separata, account EmailJS, informativa privacy.
