# Lancio senza materiali (9/10, lead)

*Obiettivo: il sito deve poter uscire domenica 11/10 anche se dai ragazzi non arriva niente. Oggi in produzione si vedono «[Nome] e [Nome]» e tre lavori finti. Ogni pezzo mancante deve **sparire con eleganza**, non mostrare un segnaposto; e deve **ricomparire da solo** quando il contenuto arriva (si riempie la chiave i18n o si aggiunge un lavoro, senza toccare componenti).*

Regole che restano: niente "società/studio/founded by"; testi legali intoccabili; nessuna libreria nuova; due raggi (2, 6); niente vetro nuovo; la carrellata desktop (HOLD, magneti, camera) **non si tocca**.

## 1. Nomi (dati noti)
- I nomi stanno in `src/data/people.ts` (`PEOPLE`). Dove il testo li contiene, **interpolarli** da lì (i18next `{{a}}`, `{{b}}`), non riscriverli nei json.
- `statement.paragraph` (it/en), `landing.chi.lead` (it/en), `meta.description` (it/en) + le righe statiche in `index.html` (description, og:description, twitter se c'è) e `studio/index.html`: nomi veri. Description ≤ 155 caratteri.
- `statement.credits`: **solo i due nomi**, senza discipline (regola R23: niente ruoli accanto alle persone) e **senza la riga della città** (togliere `credits.c` e il suo `<span>`). I nomi vengono da `PEOPLE`, le chiavi `credits.a/b` si possono togliere.
- Commenti nel codice che parlano di «[Nome] segnaposto» (`Statement.tsx`, `index.html`) aggiornati.

## 2. Testi mancanti: nascosti, non segnaposto
- `landing.chi.paragraph`: se la stringa è vuota, il `<p>` non si rende. Nei json diventa `""`.
- Bio delle persone nella pagina Studio (`landing.persone.placeholder`): rimuovere il segnaposto. Struttura pronta per l'arrivo: chiavi `landing.persone.bio.denis` / `.nicholas` (o campo facoltativo `bio` in `PEOPLE`, a scelta dell'implementatore, motivata in una riga); se vuota, la card mostra solo nome (e quello che mostra già oggi tranne il segnaposto). Niente buchi visivi: la card senza bio deve sembrare finita.
- Controllo: `grep -rn "\[Nome\|\[Name\|\[\.\.\.\]\|\[due righe\|\[Città\|\[City" src index.html studio/index.html` = zero righe (i commenti inclusi). `in preparazione` resta solo in `privacy.body` (lo riempie il Legale).

## 3. Lavori: nessun lavoro finto online
- `src/data/works.ts`: i tre `PLACEHOLDERS` passano a `rights: 'pending'` (restano come esempio di forma per chi aggiungerà i veri). `loadWorks()` quindi restituisce `[]`.
- Per sviluppo e QA serve poter vedere ancora i tre esempi: variabile `VITE_WORKS_DEMO=on` (solo build locali; documentarla in `.env.example` e `COMANDI.md`) che li include anche se `pending`. In produzione non va mai impostata.

## 4. La Sala senza lavori
Con `works.length === 0` la Sala **non deve rompersi** (oggi `works[index]` è `undefined`) e non deve sparire: la carrellata ha un HOLD su di lei.

Cosa si vede: un **cartello** nella stessa cornice dove sta il video/deck, nelle due forme (desktop/HUD e `portrait`/flat):
- etichetta `u-cap` (come le altre etichette della Sala): `Lavori` / `Work`
- frase `u-display`, misura come il titolo della didascalia o di poco più grande: «La prima selezione è in arrivo.» / «The first selection is on its way.»
- riga `text-stone`: «Nel frattempo, scrivici: ti raccontiamo cosa stiamo facendo.» / «Meanwhile, write to us: we'll tell you what we're working on.»
- un link CTA allo stesso modo in cui il sito porta alla Stanza altrove (riusa il meccanismo esistente di navigazione verso i contatti: carrellata su desktop, `scrollProgrammato` in flat), testo «Scrivici →» / «Get in touch →» (riusa una chiave esistente se c'è).
- Niente video, niente HUD dei comandi, niente deck, niente lista. Nessun effetto nuovo: entra con le stesse regole di comparsa del resto della Sala.
- Il riquadro mantiene l'ingombro 16:9 della Sala (bordo/fondo `obsidian` sottile, raggio 2 o 6), così composizione e camera non cambiano. Accessibile: è testo normale, il link è raggiungibile da tastiera quando la Sala è in HOLD (rispettare l'`inert` esistente).
- Chiavi nuove `sala.empty.*` in it/en. Sono bozze di cornice: la lead le segnala al canale Testi.
- Con 1+ lavori il comportamento è **identico a oggi** (verificare con `VITE_WORKS_DEMO=on`).

## Fatto quando
`npm run build` e `npm run lint` puliti; grep del §2 a zero; build di produzione senza lavori: Sala col cartello su 1440×900 (mouse), 1024×768, 390×844 touch, reduced motion; con `VITE_WORKS_DEMO=on` Sala identica a prima; `dist/studio/index.html` prerenderizzato con i nomi e senza segnaposto; nessun errore in console. Commit piccoli su `v2`, messaggi `area: frase` in italiano chiusi da:
```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AFVvffeJJ6mTvYYh7a8hkq
```
