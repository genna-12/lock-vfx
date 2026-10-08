# Roadmap — LockVFX, lancio domenica 11/10/2026

## Chiusi (una riga ciascuno)
- Costruzione (Step 0–9 bis, settembre): carrellata desktop, pagina Studio, Stanza con EmailJS, Lighthouse 100/100 desktop.
- Rifinitura, Lotti 0–6 (8–18/9): anteprima Cloudflare Pages, mobile semplice (snap nativo), dati veri (nomi, P. IVA), loader v3 col video di Nicholas, marchio ufficiale rosso, pillola della lingua di vetro, footer con la card 3D, GSAP solo su desktop, Studio prerenderizzata, impianto video HD/SD + R2.
- 7/10 (Lotto 8): il primo tacco risponde (dolly da 0, zona di ritorno), campi sottolineati, apertura dalla cima. Validato.
- 5–6/10: scroll a scatti risolto (ADR 001); QA pre-lancio: 21 difetti corretti + 5 note, sitemap/robots/404/`_headers` di produzione, media alleggeriti (home a cache vuota 555 → 316 kB). Validato.

## Attivo — T1 · Pronto a uscire (entro sabato 10/10)
0. **Infrastruttura (in corso, 8/10)**: DNS su Cloudflare ✔, custom domain Pages ✔, redirect `www`/`.it` (in corso), SPF/DMARC (da fare), EmailJS §3, R2 da abilitare, variabili §5 — `docs/GUIDA-LANCIO.md`.
1. **Genna**: `docs/DA-FARE-GENNA.md` (push del bundle `lockvfx-08-10`, prova telefono/rotella del Lotto 8, materiali, Legale).
2. **Contenuti** quando arrivano testi e master: procedura `docs/CONTENUTI.md` (agente Sonnet) → validazione → push. Include la riverifica R13 con i video veri.
3. **Informativa privacy** in `privacy.body` + decisione sul link "Cookie policy" (Legale fase 2). **Bloccante.**
4. **Lancio**: `VITE_SITE_URL`, via `VITE_PREVIEW`, dominio, `main` allineato, controlli post-deploy (curl, OG, Search Console).

## Dopo il lancio
- Lighthouse e GPU integrata dal PC di Genna; correzioni se < 90.
- Loader con alpha vera (master 1024² da Nicholas → VP9 alpha + H.264).
- Dashboard dei lavori (`works.json` da un pannello; `loadWorks` diventa `fetch`) — se i ragazzi la vorranno.

## Riserva (lavoro autonomo a basso rischio)
- Test automatici Playwright come script del repo (`scripts/qa/*.cjs`): oggi le misure vivono negli agenti.
- `README.md` del repo aggiornato con stack, modalità, comandi.
- Verifica `@supports not (backdrop-filter)` su un browser reale.
- Riordino di `materiale/`: separare prove, loghi e video.
