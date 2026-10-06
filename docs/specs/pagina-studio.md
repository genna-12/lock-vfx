# Pagina Studio — spec (landing raggiunta dal pulsante nella sezione Studio)

*v1 — 7 settembre 2026, notte. Richiesta di LockVFX: un pulsante nella sezione Studio porta a una pagina "coerente col resto del sito ma molto più semplice e minimale" con le informazioni su LockVFX e sui servizi; i testi definitivi arrivano dai ragazzi, ora placeholder. Riferimento navigabile: artifact "LockVFX Studio Page Sketch"; sorgente in `reference-landing-sketch.html`. Si implementa allo **Step 8** del piano, dopo Outfit, marchio e footer (li riusa).*

## Cos'è, e cosa non è

È la pagina **di testo** del sito: l'unico posto dove LockVFX si spiega per esteso — chi, cosa, come, con chi parlare. La home è un'esperienza quasi senza parole; questa pagina è il contrario, e per questo è anche la pagina che i motori di ricerca leggeranno davvero. Non ha carrellata, luci, 3D, video, deck: **niente GSAP, niente stage**. Una colonna di testo, un indice laterale, i link alla home. Si legge in due minuti, si stampa bene.

**Raggiungibilità**: ci si arriva solo dal pulsante della sezione Studio (e dal wordmark si torna in cima alla home). Non è nella nav a perforazioni né nel footer. Resta **indicizzabile** (meta title/description propri, nella sitemap): "raggiungibile solo da lì" vale per chi naviga, non per Google — sarebbe un errore nascondere ai motori l'unica pagina con del testo. Se i ragazzi la vogliono davvero fuori dall'indice, `noindex` è una riga: da chiedere, default indicizzata.

## Architettura (decisione tecnica)

**Seconda pagina statica di Vite, non un router.** Il sito resta monopagina; questa è una **pagina in più** dello stesso progetto: `studio/index.html` come secondo entry (`build.rollupOptions.input: { main: 'index.html', studio: 'studio/index.html' }`), con il suo `src/studio.tsx` che monta `<StudioPage/>`. Riusa `tokens.ts`/`globals.css`, `i18n.ts` e le chiavi `landing.*` negli stessi `it.json`/`en.json`, `Wordmark`, `LangPill`, `Mark`, `Footer` (o la sua parte legale), `people.ts`. Non importa GSAP né lo Stage: bundle di questa pagina piccolo (target < 60 kB gz), LCP = testo. URL: **`/studio/`** (una sola URL per entrambe le lingue; la lingua segue la stessa regola della home). Su Cloudflare Pages `/studio/` serve `studio/index.html` senza configurazione.

Perché non un router: aggiungerebbe una libreria e trasformerebbe la home in un'app a più viste per una pagina sola; e la home ha uno stage pinnato che non deve essere montato quando si legge questa pagina. Perché non un `<dialog>` o un pannello nella home: un pannello sopra la carrellata è ancora la carrellata, e i ragazzi hanno chiesto una pagina più semplice, non un livello in più.

## Il pulsante nella sezione Studio

Nell'ultimo blocco dello Statement (quello con nomi · città, a destra in basso), sotto la riga dei nomi: un **link testuale**, non un bottone — "Scopri cosa facciamo →" (it) / "What we do →" (en), Outfit 500 15 px `ink`, freccia che avanza di 4 px in `f5` all'hover, sottolineatura a 3 px di offset. È dentro `[data-line]` 3, quindi entra ed esce con lo stagger. `<a href="/studio/">`: navigazione vera (la home si smonta; `sessionStorage` del loader fa sì che al ritorno il loader duri 300 ms). Chiave i18n `statement.cta`.

## La pagina

**Chrome**: wordmark in alto a sinistra (link a `/`), a destra "← Torna al sito" (15 px `stone`, `/`) e la LangPill. Sticky con un fondo sfumato `void`. Nessuna nav a perforazioni (non c'è spazio da indicare).

**Griglia** (≥ 861 px): 4/8 su 1180 px max, gap `clamp(32px, 6vw, 120px)`. A sinistra l'**indice** sticky (cap "Studio" + cinque voci: Chi siamo · Cosa facciamo · Come lavoriamo · Le persone · Contatti; 15 px `stone`, la voce corrente in `ink` via `IntersectionObserver`); a destra la **colonna** di testo, sezioni distanziate `clamp(64px, 10vh, 120px)`, `scroll-margin-top: 110px`. Sotto 861 px: colonna unica, indice in riga sopra il testo (non sticky), tutto a una colonna.

**Tipografia** (Outfit, dai token): h1 `clamp(34px, 4.2vw, 56px)` 300 −0.02em, max 22ch; h2 `clamp(24px, 2.4vw, 32px)` 300; lead 19 px `ink`; testo 17 px `stone`, max 58ch; titoli delle voci 18 px 500; note 14–15 px. Nessun display più grande: qui la gerarchia è di lettura, non di scena.

**Sezioni** (chiavi `landing.*`):
1. `#chi` — h1 (una frase: cosa fanno e per chi) + lead (LockVFX è il nome collettivo con cui [Nome 1] e [Nome 2] lavorano insieme…) + un paragrafo su da dove vengono e su che produzioni (placeholder, testo dai ragazzi).
2. `#servizi` — "Cosa facciamo", una riga d'apertura, poi **sei voci** a due colonne separate da un filo `dust` sopra: Compositing · 3D e CGI · Matte painting ed environment · Cleanup e rimozioni · Simulazioni · Finishing, ognuna con titolo 18/500 e due righe 15 px. Le sei sono quelle di `decisioni-struttura-sito.md` (360°); se i ragazzi ne aggiungono o tolgono, cambia solo la lista.
3. `#come` — "Come lavoriamo", quattro passi numerati (`01`–`04` in `dust` 13 px 500, titolo del passo in `ink` 500 in linea col testo): brief e breakdown · sul set se serve · post e revisioni · consegna. Placeholder da confermare: è il loro metodo, non il nostro.
4. `#persone` — "Le persone": due schede affiancate (nome 18/500, ruolo · città · due righe, email `stone`), da `people.ts`; sotto, in 14 px, la riga di trasparenza: «Due liberi professionisti con partita IVA separata, che lavorano insieme e con altri: LockVFX non è una società.» (senso fissato dal Legale, forma del Testi).
5. `#contatti` — "Parliamone." (`clamp(34px, 4vw, 52px)` 300), una riga, pulsante **Scrivici →** (stesso pulsante del form: `ink` pieno, cap 13/500, 46 px) che porta a **`/#contact`** — la home, all'HOLD 4. Niente form qui: il form è uno, nella Stanza.

**Footer** della pagina: versione **corta** del footer del sito — la riga sul nome collettivo, le due righe con P.IVA (Geist Mono 12), Privacy · Cookie (stesso `<dialog>`), ©. Senza CTA né colonne (ci sono già sopra).

**Motion**: nessuna. Solo le transizioni di colore dei link (`f5`) e la freccia del CTA. La pagina non deve "entrare": si apre.

**Meta**: `<title>` "LockVFX — Studio e servizi" / "LockVFX — Studio and services", description propria (`landing.meta.*`), `og:image` la stessa della home, `lang` dinamico, canonical `/studio/`.

**Accessibilità**: `<nav aria-label>` per l'indice, un solo `h1`, ordine di tab naturale, contrasti (`stone` su `void` 9,9:1), `:focus-visible` `crimson` come nel resto del sito, testo a 16 px minimo su mobile.

## Testi

Placeholder italiani nello sketch (inglese da scrivere in inglese, non da tradurre): il canale Testi (`handoff-testi.md`) li mette in `landing.*` it/en e aggiunge alla lista per i ragazzi le voci che servono qui: una frase su cosa fanno e per chi (h1), due righe su di loro (chi), l'elenco dei servizi confermato o corretto, il loro metodo in quattro passi, ruolo e due righe per ciascuno. Nessun testo definitivo viene inventato: dove manca il dato resta `[…]`.

## Chi e quando

**Step 8** del piano, Implementatore (Opus): stessa base di codice, entry di Vite, componenti condivisi, i18n — non è un lavoro da fare fuori dal repo. Prima dello Step 8: Outfit, marchio e footer (Step 7) perché la pagina li riusa; e le bozze `landing.*` del Testi (in parallelo, ora). Validazione come gli altri step, più: Lighthouse della pagina (performance e SEO ≥ 95), stampa (`@media print`: indice nascosto, colori neri su bianco).
