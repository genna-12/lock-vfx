# Stanza — spec di dettaglio (contatti + EmailJS)

*v1.4 — 10 ottobre 2026 (Genna: a invio riuscito il lucchetto resta aperto e si riempie di rosso). v1.3 — 9 settembre 2026 (via le email personali). v1.2 = la conferma d'invio e il mobile dal Lotto M; v1.1 = testo della checkbox e informativa dal Legale. Riferimento navigabile: artifact "LockVFX Stanza Sketch"; sorgente di comportamento `reference-stanza-sketch.html`. Il look è quello della pagina "Look v2" del canvas (artboard Stanza).*

## Cosa c'è a schermo

La stanza **non è uno schermo**: nessun fondo pieno; la **luce di taglio** (`TAGLIO`: `linear-gradient(90deg, rgba(255,236,214,.16) 0%, transparent 52%)`) batte da sinistra sul marchio. Griglia **5/7** su desktop, gap `clamp(32px, 5vw, 96px)`, contenuto centrato verticalmente.

**Colonna sinistra** (5): il **marchio grande** in linea (stroke, `ink`, larghezza `clamp(140px, 16vw, 240px)`, `overflow: visible`) con la **staffa sollevata di 6 px**; sotto, i **due nomi** (16 px, peso 500) e, in `stone` 13 px, l'**unico indirizzo del sito**, quello collettivo, come `mailto:`. **Niente email personali** (decisione del 9/9: non esistono caselle individuali), **niente città, niente ruoli**. Nessun titolo di sezione, nessuna etichetta.

**Colonna destra** (7, max 640 px): titolo **"Parliamone."** (display, `clamp(44px, 5vw, 64px)`) e il **form**: griglia 2 colonne (Nome, Email) + Messaggio a tutta larghezza + presa visione + riga azioni. Campi con **solo bordo inferiore** (`stone` 28%), etichetta cap `dust` sopra, testo 16 px `ink`, altezza ≥ 44 px, `border-radius: 0`; textarea 2 righe (`resize: none`, cresce fino a 6). Focus = bordo `crimson`. Presa visione: checkbox 14 px quadrata (`appearance: none`, spunta = riempimento `ink`), non pre-flaggata, obbligatoria, testo 14 px `stone` con link all'informativa. **Testo fissato dal Legale** (`handoff-legale.md` §2, non modificabile nella sostanza): it «Ho letto l'informativa privacy e so che questi dati verranno usati solo per rispondermi.» · en «I have read the privacy notice and understand my data will be used only to reply to me.» Non è un consenso (base giuridica art. 6.1.b): mai la parola "acconsento". Riga azioni: a sinistra il **messaggio di stato** (14 px `stone`), a destra il pulsante **Invia** (`ink` pieno, testo `void` cap 13 px, 46 px, min 150).

## Stati

| stato | pulsante | staffa | stato testuale |
|---|---|---|---|
| idle | `Invia` | sollevata | — |
| errore | `Invia` | sollevata | sotto ogni campo errato (13 px `stone`): "Come possiamo chiamarti?" · "Serve un'email a cui rispondere." · "Due righe bastano: progetto, tempi, cosa serve." · presa visione: bordo `crimson` |
| invio | `Invio…` (disabilitato, opacità .6) | sollevata | — |
| **inviato** | — (il form non c'è più) | **aperta, il marchio si riempie di rosso** | vedi "La conferma" |
| fallito | `Invia` | sollevata | "Non è partito. Riprova, o scrivici direttamente: info@…" (`mailto:`) |

**Validazione**: al `blur` del campo (mai mentre si scrive) e all'invio; l'errore sparisce appena il campo torna valido. Email: regex minima `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`. All'invio con errori: focus sul primo campo errato, nessun invio.

## La conferma

A invio riuscito **il form lascia il posto alla conferma**, su telefono e su desktop, ed è la stessa schermata:

- **Il marchio che si riempie di rosso**, grande (96 px su mobile, `clamp(140px, 16vw, 240px)` su desktop): la staffa resta **aperta**, com'è nel logo, e il `crimson` sale dal basso su tutto il marchio fino a riempirlo; poi resta rosso. Era la firma della Stanza sotto il pulsante; nella conferma si vede meglio, ed è lì che significa qualcosa.
- **Una riga di ringraziamento**: "Ricevuto. Ti rispondiamo il prima possibile."
- **L'email a cui risponderemo**, ripetuta com'è stata scritta (`stone`, 14 px): di quello che è stato scritto, ciò che conta è dove arriverà la risposta.
- Un nuovo invio è possibile dopo 60 s: "Scrivi un altro messaggio" riapre il form vuoto e il marchio torna `ink`.

## Motion

- **Riempimento del marchio**: un livello `crimson` a bordo netto sale dal basso in `f48` (2000 ms, 48 fotogrammi) con `easeLivello` (in-out dolce, `cubic-bezier(0.37, 0, 0.63, 1)`: a metà tempo è a metà marchio), e resta pieno. La staffa non si muove. Nel codice: `Mark` prop `flood` (sagoma di ritaglio + livello animato con Web Animations). Con reduced motion il marchio compare già rosso.
- Errori: il messaggio entra in `f5` con salita di 4 px (`easeArrive`); il bordo cambia in `f5`.
- Stato testuale: `f5` di opacità. Pulsante: `f5` di colore. Niente altro si muove.

## EmailJS

- `@emailjs/browser` (unica libreria nuova del progetto). Chiavi in `.env`: `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID` (opzionale). `emailjs.init({ publicKey })` una volta; invio con `emailjs.send(service, template, params)`; `params = { from_name, reply_to, message, lang, page: location.href }`.
- Template principale: **all'unico indirizzo collettivo**, oggetto "Nuovo messaggio dal sito — {{from_name}}", `Reply-To: {{reply_to}}`. Auto-reply al mittente solo se i ragazzi lo vogliono.
- **Anti-abuso**: honeypot `company` (nascosto, `tabindex=-1`, `aria-hidden`): se compilato, si simula l'invio senza chiamare EmailJS; **1 invio per 60 s** (memoria + `sessionStorage`); nel pannello EmailJS: allowlist del dominio, limite giornaliero. Nessun captcha.
- Errore di rete o quota → stato "fallito"; nessun retry automatico.
- Tutto in `src/lib/emailjs.ts` (`sendContact(params): Promise<void>`), così la Stanza non conosce il provider.

## Privacy

Link "informativa privacy" → `<dialog>` nativo (`#privacy`) **senza smontare il form**. Contenuto da i18n: in testa l'**informativa breve** del Legale (`handoff-legale.md` §2, testo L3, it/en: dati, finalità unica, 24 mesi, EmailJS, canale per i diritti — cinque elementi non rimovibili), sotto `privacy.body` con l'informativa completa (fase 2). Chiudibile con Esc/click fuori/pulsante; stesso dialog richiamato dal footer.

## Tastiera e accessibilità

Tab: Nome → Email → Messaggio → presa visione → Invia (l'honeypot è fuori). `Enter` in un input invia; in textarea va a capo. `<form novalidate>` con validazione propria; errori con `aria-describedby` e `aria-invalid`; stato testuale in `aria-live="polite"`, **e la conferma prende il focus** quando sostituisce il form. Contrasto: `stone` su `void` ≥ 7:1, `dust` solo per etichette cap ≥ 12 px. Input `font-size: 16px` anche su mobile (niente zoom iOS). Il marchio grande è `aria-hidden`.

## Mobile (`mobile-semplice-spec.md` §4)

Sotto 768 px: colonna unica. Ordine: **"Parliamone." → form**. E basta: **sotto il pulsante non c'è niente**. La sezione sta in una schermata su qualunque telefono, **senza scorrimento interno**. Il lucchetto si vede nella **conferma**.

Form in una colonna (gap 22 px), pulsante a tutta larghezza (≥ 44 px), stato testuale sotto. Padding sopra 72, titolo 37, campi ~70, messaggio a **una riga** che cresce al focus, presa visione 38, azioni 56; sotto il contenuto restano **72 px + `env(safe-area-inset-bottom)`** di fascia di rispetto, dove non va niente di leggibile né di toccabile. Luce di taglio come su desktop. Con la tastiera aperta, `scrollIntoView({block:'center'})` sul focus. **Invariante**: la Stanza non è mai un contenitore che scorre se non sborda davvero, e dove scorre non ha mai `overscroll-behavior: contain`.

## Nella pagina

Su desktop è il set 4 della carrellata (HOLD 500–560 vh): entra da sotto in T3, key light da 450, fuori dal proprio HOLD opacità 0 e `inert`. Su telefono è la quarta sezione della pagina che scorre, con lo snap del browser. Dopo l'invio, nav e footer restano raggiungibili.

## Dati e testi da LockVFX

**Arrivati l'8/9**: Denis Ruscitti — P. IVA 04397621204; Nicholas Pantieri — P. IVA 02829650395. **Niente città, niente ruoli, niente email personali** (9/9). Le P. IVA vanno nel blocco legale del footer. **Mancano**: l'**indirizzo collettivo** vero, l'account EmailJS (service, template, public key), l'informativa privacy completa, e i testi it/en di `contact.*` se vogliono cambiare la bozza. Lista completa in `cosa-ci-serve-da-lockvfx.md`.

## Reduced motion

Marchio già rosso senza salita, nessuna salita dei messaggi, cambi di stato istantanei.
