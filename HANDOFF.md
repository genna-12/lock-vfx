# Handoff (6 ottobre 2026, notte)

## Stato
Branch `v2`, cantiere cloud a `80245a2` (+ i commit dei file di stato); `origin/v2` è fermo a `c886479`: **32 commit da spingere** (bundle `_ufficio/lockvfx-06-10.bundle`, comandi in `docs/DA-FARE-GENNA.md`). Scroll desktop sistemato e validato (ADR 001); QA pre-lancio completa (`docs/qa-2026-10-06.md`): 21 difetti + 5 note corretti, validati con misure, console pulita, home a cache vuota 316 kB desktop / 345 kB telefono. Sitemap, robots, 404 e `_headers` di produzione già nel build. Testi e video veri **non ancora arrivati**: i segnaposto sono elencati in `docs/CONTENUTI.md`.

## Prossimo passo
Appena Genna conferma il push e la prova sul telefono: (a) se arrivano testi/master → agente Sonnet con `docs/CONTENUTI.md` come spec, poi validatore (desktop + 390×844 + R13 con i video veri) e nuovo bundle; (b) se arriva l'informativa dal Legale → in `privacy.body` it/en; (c) tutto il resto è in mano a Genna (`docs/DA-FARE-GENNA.md`).

## In sospeso
- `privacy.body` è un segnaposto: **bloccante per il lancio** (il form raccoglie dati).
- Link «Cookie policy» del footer: consiglio di toglierlo (un solo «Privacy» con paragrafo storage) — aspetta Genna.
- `FOOTER_CTA_VARIANT = 'full'`: da confermare.
- Branch remoto `variante-a-rw` da cancellare (ADR 004).

## Da Genna
Tutto in `docs/DA-FARE-GENNA.md`: push, prova su iPhone e con rotella/trackpad, materiali dai ragazzi (master, testi, autorizzazioni, social), EmailJS, dominio, R2, variabili di lancio, informativa privacy.

## Attenzione
- Il cantiere cloud non può fare push (403): mai promettere un deploy, lasciare il bundle.
- Il Chromium headless non ha H.264: il ramo mp4 del loader si verifica solo sui browser veri.
- Il mobile si valida solo sul telefono di Genna; l'emulazione è un pre-controllo.
- Non riaprire la carrellata su telefono né i magneti via `ScrollTrigger.snap`: strade già scartate (`docs/specs/mobile-semplice.md` §1, ADR 001).
- Con `VITE_WORKS=on` senza file in `public/video/works/` il 404 su `lavoro-01.mp4` è atteso.
- La lead quotidiana dovrebbe essere una chat **Opus** ("riprendi"); questa sessione era Fable (Direzione). I documenti di design restano nel Project Claude.
