# Handoff (9 ottobre 2026, notte)

## Stato
Branch `v2`. `origin/v2` = `8f54fa0` (push dell'8/10 fatto). Il cantiere cloud è avanti di 8 commit (`5ae9f47`…chiusura): **lancio senza materiali** (ADR 007, spec `docs/specs/lancio-senza-materiali.md`): nomi veri da `PEOPLE` al posto di «[Nome]», crediti = solo nomi, paragrafo "chi siamo" e bio nascosti se vuoti, i tre lavori d'esempio `pending`, Sala vuota con il cartello «La prima selezione è in arrivo» + CTA alla Stanza, `VITE_WORKS_DEMO=on` per rivederli in locale. Validato (`ok con note`, demo identica pixel per pixel al prima). Bundle: `_ufficio/lockvfx-09-10.bundle` sul PC di Genna, comandi in `docs/DA-FARE-GENNA.md`.
Infrastruttura verificata il 9/10: sito servito su `lockvfx.com`; SPF e DMARC presenti; `.it`→`.com` è 302 (va 301); `www` non reindirizza; R2 **non abilitato** (il connettore risponde 10042); `VITE_SITE_URL` non ancora impostata.

## Prossimo passo
1. Genna: push del bundle 09-10, poi chat Legale fase 2 per l'informativa (unico blocco vero), R2, i due redirect.
2. Appena R2 è abilitato: creare il bucket `lockvfx-media` dal connettore Cloudflare (`r2_bucket_create`).
3. All'arrivo di testi/master/autorizzazioni: `docs/CONTENUTI.md` (agente Sonnet) → validatore → bundle. Bio in `landing.persone.bio.denis` / `.nicholas`; un lavoro va online solo con `rights: 'cleared'`.
4. Informativa → `privacy.body` it/en. Lancio: variabili §5 di `GUIDA-LANCIO.md`, controlli §6, `main` allineato.

## In sospeso
- `privacy.body` segnaposto: **bloccante**. Link "Cookie policy": consiglio di toglierlo, decide Genna.
- Testi `sala.empty.*` e le nuove description: bozze di cornice, da far vedere al canale Testi/ai ragazzi.
- Note del validatore accettate: titolo del cartello 30 px (+50% sulla didascalia), su desktop riempie lo schermo di `obsidian` (da guardare durante il movimento della camera sul PC vero), link 23 px di altezza come il CTA dello Statement.
- `FOOTER_CTA_VARIANT = 'full'` da confermare; branch `variante-a-rw` da cancellare.

## Da Genna
`docs/DA-FARE-GENNA.md`: push 09-10, Legale (informativa), R2, redirect `www` e `.it` a 301, DKIM, EmailJS, prova telefono/rotella (ora anche il cartello della Sala), variabili di lancio.

## Attenzione
- Il cantiere cloud **non può fare push**. Il PC di Genna ora è collegabile (shell Linux con la cartella montata): va bene per leggere/verificare, **non** per build (i `node_modules` sono Windows) né per `git commit` (senza permesso di cancellare, git lascia i `.lock`). Si lavora nel clone cloud e si consegna il bundle in `_ufficio/` con `device_commit_files`.
- Dal PC la rete esce solo via proxy (curl a lockvfx.com dà 403 del proxy, non del sito): verifiche dal vivo con WebFetch e `dns.google/resolve`.
- `VITE_WORKS_DEMO` mai in produzione. Non riaprire: carrellata su telefono, `ScrollTrigger.snap`, HOLD 1 come zona morta (ADR 001, 005).
- Chromium headless senza H.264: il ramo mp4 si prova solo su browser veri.
