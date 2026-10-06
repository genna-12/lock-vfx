# Sala — spec di dettaglio (player + deck coverflow)

> **Nota della Direzione (16/9)**: la sezione *Mobile* di questo documento (suggerimento di rotazione, `orientation.lock`, "orizzontale come desktop") è **superata** da `mobile-semplice-spec.md` (§2, §5): su telefono non c'è carrellata, i video partono da soli, il tap mette in pausa, restano solo audio e schermo intero. Il tipo `Work` con `video: { mp4, webm? }` diventa `{ hd, sd, poster }` con R11. Il resto (desktop) vale.

*v2 — 6 settembre 2026, notte. Sostituisce interamente la v1 (deck impilata a sinistra: scartata). Riferimento navigabile: artifact "LockVFX Sala Sketch". Il sorgente di comportamento è `reference-sala-sketch.html` in questo Project; la reference di partenza per drag e 3D è `reference/reference_selettore.txt` nel repo (carosello coverflow con inerzia). Questa spec sblocca lo **Step 5** del piano.*

## Cosa c'è a schermo

**A riposo** (nessun movimento da 2,5 s): solo il video del lavoro in riproduzione a schermo intero e la **linea rossa del tempo** sul bordo inferiore (reale: `currentTime/duration`, cliccabile per lo scrub, hit-area 22 px). Nient'altro. Il chrome (marchio, lingua, nav) resta come nel resto del sito.

**Al movimento** (`pointermove`, `pointerdown`, `touchstart`): appare l'HUD in `f5` con una salita di 16 px (`easeArrive`), con un velo dal basso (gradiente `void` 82% → 0 sul 46% inferiore) per la leggibilità. L'HUD è **modesto e centrato in basso**: la **deck** (anello di card coverflow, centrata orizzontalmente) e sotto di lei la **didascalia** centrata del lavoro in riproduzione — titolo `clamp(17px, 1.4vw, 20px)` Archivo condensata 600, riga di contesto 13 px `stone` (produzione · anno · discipline · "Guarda il video completo ↗" se c'è il link). I **controlli** (play/pausa, audio, schermo intero) stanno in basso a destra, icone 20 px in hit-area 40 px, senza etichette. Dopo 2,5 s senza movimento tutto scompare (stessa transizione al contrario); non scompare mentre si sta trascinando. Nessun timecode, nessuna slate, nessun numero. La sola cosa grande della sala è il video.

## La deck

**Geometria (desktop).** Card 16:9 larghe `--card-w = clamp(140px, 13vw, 190px)`, raggio 6 px, senza bordi (filo interno `ink` all'8%, ombra `0 14px 36px rgba(0,0,0,.7)`), poster dentro. Tutte le card sono posizionate al centro della deck (`left: 50%`, `margin-left: -card-w/2`) e distribuite dal calcolo; il contenitore ha `perspective: 1000px`, origine 50% 50%, `preserve-3d`, altezza `card-h + 44px` (spazio per il lift e il titolo all'hover).

Per ogni card `i`, con `cur` = indice della card centrale e `live` = scostamento continuo durante drag/inerzia (0 a riposo):
- `raw = i − cur − live`; **anello**: `pos = ((raw + N/2) mod N + N) mod N − N/2`, quindi `pos ∈ [−N/2, N/2)`. Con N ≤ 2 niente anello: `pos = clamp(raw, −1, 1)` (fila semplice).
- `a = |pos|`, `cl = clamp(pos, −1, 1)`.
- `step = 0.66·card-w`, `gap = 18`, `z = 90`, `rot = 42°`, `bump = 36` (mobile: `0.64·card-w`, 12, 70, 38°, 28).
- `translateX = pos·step + cl·gap`; `translateZ = −a·z + max(0, 1−a)·bump`; `rotateY = −cl·rot`.
- opacità `max(0, 1 − 0.22·a)`; **dissolvenza del passaggio dietro**: se `N/2 − a < 0.45` l'opacità viene moltiplicata per `(N/2 − a)/0.45`, così la card che gira dietro l'anello sparisce prima di ricomparire dall'altro lato (con 3 lavori il salto da −1,5 a +1,5 è invisibile). Oltre `a > 3.5` opacità 0 e `pointer-events: none`.
- `z-index = 100 − round(10·a)`; saturazione 60% per `a ≥ 0.5`, piena per la centrale.
- La card centrale (`pos = 0`) è il lavoro in riproduzione: frontale, la più vicina, opaca. Nessun segno rosso: il rosso resta al foro della nav e alla linea del tempo.

**Con 3 lavori** si vedono esattamente tre card (sinistra, centro, destra) che girano ad anello. **Non si duplicano card né si riempie l'anello artificialmente**: si mostrano solo i lavori esistenti. Con 6+ lavori l'anello mostra fino a 7 card (3 per lato) e il resto è dietro, a opacità 0.

**Interazioni.**
- *Drag* (pointer events, `touch-action: pan-y`): al `pointerdown` si cattura il puntatore; ai primi 4 px si decide se il gesto è orizzontale (drag) o verticale (lascia scorrere la pagina). Durante il drag `live = Δx / step` e le card seguono la mano senza transizioni (classe `dragging`). Si campiona la velocità sugli ultimi 90 ms. Al rilascio: se `|v·16| > 1.2` px/frame parte l'**inerzia** (rAF, attrito 0,92, `live += v/step`; ogni volta che `|live| ≥ 1` si sposta `cur` di una card intera e si normalizza `live`) finché `|v| ≤ 0.5`; poi **snap** alla card più vicina (`cur += round(live)`, `live = 0`) con transizione `f8` `easeArrive`. Con N ≤ 2 niente inerzia, `live` limitato a ±1. Solo la card che si ferma al centro diventa il lavoro in riproduzione (`commit`): mentre l'anello gira il video non cambia.
- *Rotella* sopra la deck (`deltaX` o `deltaY`): accumulo con soglia 45 px e reset dopo 180 ms di inattività; uno scatto ogni ≥ 260 ms. `preventDefault` sempre (la pagina non scorre sopra la deck; nella carrellata solo durante l'HOLD 3).
- *Hover* su una card laterale (non durante il drag): sale di 10 px, opacità e saturazione piene, titolo centrato sopra (13 px, `ink`). Solo il titolo.
- *Click/tap* su una card laterale: diventa centrale (ridisposizione `f8` `easeArrive`) e parte (`commit`). Click sulla centrale: nulla. Un click dopo un drag (> 4 px) non seleziona.
- *`commit`* (cambio lavoro): **2 frame di nero** (83 ms nero, cambio `src` con poster, 83 ms), didascalia aggiornata, linea del tempo da zero. Mai dissolvenze.
- *Tastiera*: ←/→ cambiano lavoro e svegliano l'HUD, spazio play/pausa, M audio, F schermo intero. `role="listbox"` + `role="option"` + `aria-selected`; controlli con `aria-label` e `aria-pressed`.
- *Fine video*: dopo 12 frame di nero l'anello gira di uno e parte il successivo.

**Motion.** Ridisposizione: `f8` (333 ms) `easeArrive`; lift: `f5`; HUD: `f5`; inerzia: rAF senza transizioni CSS; cambio video: 2 frame di nero.

**Controlli.** Play/pausa (due barre / triangolo), audio (altoparlante con x / con onde, `aria-pressed`), schermo intero (angoli). Niente prev/next come bottoni: la deck *è* il prev/next.

## Mobile

**Verticale** (`max-width: 767px and orientation: portrait`): la sala non è più a schermo intero. Video 16:9 a piena larghezza sotto il chrome (76 px dall'alto) con la linea del tempo; sotto, in flusso e sempre visibili: didascalia (titolo 18 px, contesto 13 px), la **deck** coverflow centrata (card 150 px, parametri mobile) a swipe con inerzia, tap = seleziona, e i controlli. L'HUD non si nasconde. Al primo arrivo nella sala (una volta per sessione) compare per 2,4 s, centrato sul video, il **suggerimento di rotazione** (icona telefono che ruota + "Ruota per la sala" in cap). Schermo intero: `requestFullscreen()` poi `screen.orientation.lock('landscape')` dove supportato; su iPhone player nativo. In verticale deve funzionare tutto.

**Orizzontale** (telefono ruotato): come desktop con card 150 px e parametri mobile.

## Dentro la carrellata

La sala è il set 3 (HOLD 310–420 vh). Il video parte quando l'HOLD inizia (progress > 0,55) e si ferma quando finisce (> 0,88 o < 0,55). Un solo `<video>` montato; cambio lavoro = cambio `src` (poster subito). Durante T2 e T3 l'HUD è nascosto. La rotella sopra la deck intercetta lo scroll solo durante l'HOLD; fuori, la pagina scorre.

## Dati (già pronti per la dashboard)

Il componente **non conosce** la fonte dei dati: riceve `works: Work[]` e basta. Oggi la lista viene da `src/data/works.ts`; alla fine del progetto verrà da un JSON pubblicato dalla dashboard di caricamento (vedi piano, task finale) senza toccare la Sala.

```ts
type Work = {
  id: string;            // slug stabile
  title: string;
  year: number;
  client: string;        // produzione / cliente
  disciplines: string[]; // es. ['Environment', 'Compositing']
  poster: string;        // 1280×720 WebP (o JPG)
  video: { mp4: string; webm?: string };   // breakdown ≤ 1080p, 15–40 s
  fullUrl?: string;      // link al video completo (Vimeo/YouTube)
  rights: 'cleared' | 'pending';           // si mostra solo se 'cleared'
  order?: number;
};
```

## Reduced motion

Nessun lift, ridisposizione con `cut`, nessuna inerzia (snap diretto), cambio video senza nero; HUD sempre visibile; autoplay disattivato (poster + play).
