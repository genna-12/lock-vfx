# Handoff (8 ottobre 2026)

## Stato
Branch `v2`. `origin/v2` è a `b515261`; il cantiere cloud è **6 commit avanti** (`a82c6df`…`0571236`: Lotto 8 — primo tacco che risponde, campi sottolineati, apertura dalla cima — più guida al lancio, ADR 005, `_redirects` pages.dev → dominio) + questo commit di chiusura. Tutto validato (`ok con note`). **Il push lo fa Genna** dal PC: bundle `_ufficio/lockvfx-08-10.bundle`, comandi in `COMANDI.md`. Testi e master dei video **non ancora arrivati**. Infrastruttura (8/10): domini `lockvfx.com`/`.it` su Cloudflare DNS (nameserver cambiati su Hostinger), custom domain `lockvfx.com` + `www` in Pages, regole di redirect `www`→root e `.it`→`.com` in corso; posta su **Google Workspace** (`info@lockvfx.com`), SPF e DMARC da aggiungere; R2 **non ancora abilitato** sull'account (serve il pannello); connettore MCP Cloudflare collegato ma copre solo R2/Workers (non DNS, Pages, regole).

## Prossimo passo
1. Genna spinge il bundle e segue `docs/GUIDA-LANCIO.md` §3 (EmailJS con servizio Gmail/Workspace) e §4–5 (R2, variabili). Appena R2 è abilitato: la lead crea il bucket `lockvfx-media` dal connettore (`r2_bucket_create`).
2. All'arrivo di testi/master: agente Sonnet con `docs/CONTENUTI.md`, poi validatore (desktop + 390×844 + R13 coi video veri), nuovo bundle.
3. All'arrivo dell'informativa dal Legale: `privacy.body` it/en; togliere il link "Cookie policy" se Genna conferma.
4. Lancio: variabili (`VITE_SITE_URL`, via `VITE_PREVIEW`, chiavi EmailJS), retry deployment, controlli §6 della guida, `main` allineato.

## In sospeso
- `privacy.body` segnaposto: **bloccante** per il lancio.
- Link "Cookie policy": consiglio di toglierlo (un solo "Privacy" con paragrafo storage) — decide Genna.
- `FOOTER_CTA_VARIANT = 'full'`: da confermare. Branch remoto `variante-a-rw` da cancellare (ADR 004).
- Prova sul telefono vero e con rotella/trackpad del Lotto 8: non ancora fatta.

## Da Genna
`docs/DA-FARE-GENNA.md`: push, prova telefono/rotella, materiali dai ragazzi, EmailJS, R2 (abilitare + custom domain `media.lockvfx.com`), SPF/DMARC, variabili di lancio, informativa privacy.

## Attenzione
- Il cantiere cloud **non può fare push** (403): mai promettere un deploy. Il container si azzera ogni qualche giorno: ri-clonare `v2` e `npm ci` via proxy (`COMANDI.md`); i documenti vivono nel repo, non in `/home/claude/ufficio`.
- Chromium headless senza H.264: il ramo mp4 del loader si prova solo su browser veri.
- Non riaprire: carrellata su telefono, `ScrollTrigger.snap`, HOLD 1 come zona morta (ADR 001, 005).
- Con `VITE_WORKS=on` senza file in `public/video/works/` il 404 su `lavoro-01.mp4` è atteso.
- Questa sessione era Fable (Direzione): la lead quotidiana è una chat Opus con "riprendi"; Fable solo per decisioni di design. Vedi `docs/retro.md`.
