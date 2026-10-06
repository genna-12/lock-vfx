# LockVFX — sito web

All'avvio leggi `HANDOFF.md`, poi la sezione attiva di `ROADMAP.md` e i titoli in `docs/inbox/`.

## Cos'è
Sito ufficiale di LockVFX: **due VFX artist freelance** (Denis Ruscitti, Nicholas Pantieri), ciascuno con la propria P. IVA. **Non è una società**: il sito non deve mai dire "società", "studio" come soggetto giuridico, "founded by". Monopagina (`/`: reel · studio · lavori · contatti) + `/studio/` (landing prerenderizzata). Lingue it/en. Brand: void `#020202`, obsidian `#0B0B0E`, ink, stone, crimson `#E60B18` contato; font Outfit self-hosted; il marchio è il logo ufficiale riempito (`src/assets/brand/lockvfx-mark.svg`).

## Stack
React 19 · TypeScript · Vite 8 · Tailwind v4 (`@theme` in `src/styles/globals.css`, token in `src/brand/tokens.ts`) · GSAP ScrollTrigger + ScrollSmoother (solo desktop, chunk `carrellata` caricato solo non-touch) · i18next (`src/locales/it.json`, `en.json`) · `@emailjs/browser`. **Nessuna libreria nuova** senza una decisione scritta. `framer-motion` è stato tolto.

## Due modalità, una pagina
- **Desktop (puntatore)**: carrellata pinnata 560 vh, camera CSS 3D, HOLD 0/190/365/530 vh, magneti scritti a mano (`src/components/stage/carrellata.ts`, `src/lib/stageProgress.ts`). Il magnete muove la **barra** con `smoother.scrollTo(v, true)` e parte solo a rotella ferma da `SNAP.idle` (0,7 s).
- **Touch / reduced motion (`flat`)**: quattro sezioni `100lvh` con scroll-snap nativo, nav in basso, video che partono da soli (muti), tap = pausa. Prima di ogni scroll in JavaScript lo snap si spegne (`src/lib/scrollProgrammato.ts`). Spec: `docs/specs/mobile-semplice.md`.
- Loader: video di Nicholas (`public/loader/logo.mp4`, un solo `src` scelto con `canPlayType`), cancello = primo fotogramma riprodotto, coreografia in `src/components/Loader.tsx`; pieno a ogni sessione nuova.

## Comandi
`npm run dev` · `npm run build` (= `tsc -b && vite build`) · `npm run lint` · `npm run serve:dist` (dist su :4173). Misure e screenshot con Playwright headless (vedi `COMANDI.md`). Variabili in `.env.example` (tutte facoltative).

## Git
Branch di lavoro **`v2`**; `main` non si tocca finché Genna non lo allinea. Commit piccoli, uno per difetto/ticket, messaggio in italiano `area: frase`, chiusi dalle righe `Co-Authored-By:` e `Claude-Session:`. **Il push lo fa Genna** (il cantiere cloud non è autorizzato): il lead gli lascia un bundle in `_ufficio/` (cartella ignorata) con i comandi. Cloudflare Pages ridistribuisce da solo a ogni push su `v2`.

## Regole del progetto
1. I testi legali (frase del collettivo nel footer, presa visione, informativa breve) sono **fissati dal Legale**: non si riscrivono.
2. Niente email personali, città o ruoli delle persone nel footer e nella Stanza; l'unico indirizzo è `info@lockvfx.com`.
3. Nessun terzo nel sito (niente font Google, analytics, embed, captcha): i link a Vimeo/YouTube sono link. Finché resta così non serve il banner cookie.
4. Video: i ragazzi mandano i **master**; `scripts/encode-video.mjs` produce HD/SD MP4 + poster; tutto su R2 (`VITE_MEDIA_URL`). Vedi `docs/CONTENUTI.md`.
5. Due raggi (2, 6) in tutto il sito; `pill` e `glass` solo per la pillola della lingua e la sua tendina, l'unico vetro del chrome.
6. Il mobile si valida **solo sul telefono vero** (otto righe di `docs/specs/mobile-semplice.md` §8): l'emulazione è un pre-controllo.
7. Ogni modifica passa da implementatore → validatore (contesto separato) con misure Playwright, prima di arrivare a Genna.

## Documenti
La storia delle decisioni di design sta nel Project Claude "Lock-VFX-Studio-Website" (`claude/*.md`); qui in `docs/` c'è ciò che serve per lavorare: `docs/specs/` (spec vigenti), `docs/adr/` (decisioni), `docs/DA-FARE-GENNA.md` (cose che può fare solo lui), `docs/CONTENUTI.md` (dove vanno testi e video), `docs/inbox/` (resoconti delle chat specialistiche da integrare).
