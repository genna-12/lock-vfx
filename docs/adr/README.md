# Decisioni (ADR)

Una riga per decisione. Le decisioni di design e brand prese prima del 6/10 vivono nei documenti del Project Claude "Lock-VFX-Studio-Website" (`claude/rifinitura-spec.md` §1–§9, `escalation-design.md`, `decisioni-struttura-sito.md`, `handoff-rifinitura.md`); qui si registrano solo quelle dal 6/10 in poi e quelle che un nuovo lead deve sapere subito.

| # | Decisione | File |
|---|---|---|
| 001 | Il magnete muove la barra (`scrollTo`), non la camera, e parte solo a rotella ferma da 0,7 s | `001-magnete-barra.md` |
| 002 | Il cancello del loader è il primo fotogramma riprodotto, non `canplaythrough` | `002-loader-cancello.md` |
| 003 | Il marchio è il logo ufficiale riempito, rosso nel chrome; un solo vetro (pillola + tendina) con i raggi `pill`/`glass` | `003-marchio-e-vetro.md` |
| 004 | Variante A chiusa: le scelte sono su `v2`; nessun branch di varianti | `004-variante-a-chiusa.md` |
| 005 | Il primo tacco risponde: dolly back da 0 vh, HOLD 1 ridotto a un punto, zona di ritorno 0–75 (primo gesto → 0, dal secondo → 190); il sito si apre sempre dalla cima | `005-primo-tacco.md` |
| 006 | Infrastruttura di lancio: DNS dei domini su Cloudflare (registrar resta Hostinger), posta su Google Workspace, un solo indirizzo canonico `https://lockvfx.com` (www, .it e pages.dev rediretti 301), video su R2 con `media.lockvfx.com` | `006-infrastruttura-lancio.md` |
| 007 | Il sito esce anche senza materiali: i contenuti mancanti spariscono (niente segnaposto), Sala vuota = cartello, `VITE_WORKS_DEMO` solo in locale | `007-lancio-senza-materiali.md` |
