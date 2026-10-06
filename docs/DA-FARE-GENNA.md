# Da fare — Genna (per uscire domenica 11/10)

*Solo le cose che una macchina non può fare: account, pannelli, telefono, i ragazzi. In ordine di urgenza. Spunta e aggiorna; la chat lead legge questo file all'avvio.*

## Subito

- [ ] **Push** del bundle corrente (`_ufficio/lockvfx-06-10.bundle`): `git fetch .\_ufficio\lockvfx-06-10.bundle v2:v2-cloud` · `git checkout -B v2 v2-cloud` · `git push origin v2`. Poi l'anteprima si aggiorna da sola.
- [ ] **Prova sul telefono vero** (Safari e Chrome iPhone), prima visita: loader intero (video → logo → volo), reel a pieno schermo, scroll senza scatti, nav che tiene, video dei lavori (quando ci saranno), tendina della lingua di vetro, Stanza in una schermata, invio del form. Scrivi in una riga ciò che non va.
- [ ] **Prova su PC con la rotella e col trackpad**: lo scroll lento deve essere fluido; i magneti scattano solo a rotella ferma (0,7 s). Se ti sembrano pigri, dillo: le manopole sono `SNAP.idle` e `SNAP.duration` in `carrellata.ts`.

## Dai ragazzi (girargli `cosa-ci-serve-da-lockvfx.md` del Project)

- [ ] **Master dei video**: showreel 16:9 **e** verticale 9:16 (o 1:1), i tre breakdown. ProRes o H.264 alto bitrate, 1080p/4K, senza limiti di peso. Via WeTransfer/Drive → cartella `materiale/video/` del repo (è ignorata da git).
- [ ] Per ogni lavoro: titolo, produzione/cliente, anno, discipline di LockVFX, **link al video completo** (Vimeo/YouTube), **autorizzazione scritta** del cliente (email basta: `handoff-legale.md` §4 ha il testo pronto). **Un lavoro senza autorizzazione non va online.**
- [ ] **Testi**: paragrafo dello Studio, due bio (una per persona), i 6 servizi da confermare, città sì/no nei credits. Vanno nella chat **Testi** del Project (skill `chat-specialistica`) o direttamente a me: li inserisco io (`docs/CONTENUTI.md`).
- [ ] Profili social veri (Instagram, LinkedIn) oppure dimmi di togliere le icone.
- [ ] Da Nicholas, quando può: l'animazione del loader a **1024×1024 ProRes 4444 con alpha** (quella attuale è 512² senza alpha: va, ma su monitor grandi si vede).

## Account e pannelli

- [ ] **EmailJS**: crea service + template (parametri `from_name`, `reply_to`, `message`, `lang`, `page`; destinatario `info@lockvfx.com`; `Reply-To: {{reply_to}}`); nel pannello attiva **allowlist del dominio** e un limite giornaliero. Le tre chiavi vanno in Cloudflare Pages → Settings → Environment variables (**Production**): `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID` (+ `VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID` se vuoi la risposta automatica). **Mai** `VITE_EMAILJS_MOCK` in produzione. Dopo il deploy: **un invio vero** dal sito.
- [ ] **Dominio**: comprato (o trasferito) su Cloudflare; Custom domain sul progetto Pages; redirect `www` → apex (o viceversa) e `*.pages.dev` → dominio.
- [ ] **Cloudflare R2**: bucket `lockvfx-media`, accesso pubblico (dominio `media.<tuo dominio>` o `r2.dev`). Ci carico io i file codificati (ti passo la cartella `dist-media/`); poi in Pages: `VITE_MEDIA_URL=https://media…` (senza barra finale), `VITE_REEL=on`, `VITE_WORKS=on`.
- [ ] **Variabili di lancio** in Pages: `VITE_SITE_URL=https://<dominio>` (senza barra finale) e **togliere `VITE_PREVIEW`**. Con questo il build scrive canonical/OG assoluti, `sitemap.xml`, la riga `Sitemap:` in `robots.txt`, e spegne il `noindex`. Se c'era la password di Cloudflare Access, toglierla.
- [ ] Dopo il deploy di produzione: `curl -I https://<dominio>/` **senza** `X-Robots-Tag`; sorgente della pagina senza `noindex`; anteprima social con il Facebook Sharing Debugger o LinkedIn Post Inspector.
- [ ] **Search Console**: proprietà, invio di `sitemap.xml`, richiesta di indicizzazione di `/` e `/studio/`.

## Legale (chat **Legale** del Project, fase 2 — bloccante per il lancio)

- [ ] **Informativa privacy completa** (oggi `privacy.body` dice «in preparazione»): iubenda piano base (~30–60 €/anno, da decidere tu) **oppure** testo scritto con il Legale/un professionista. Deve contenere: titolari (le due persone), finalità unica (rispondere), 24 mesi, EmailJS come responsabile con trasferimento extra-UE (SCC), i diritti e il canale (`info@lockvfx.com`), **e un paragrafo sullo storage**: il sito usa `localStorage` (`i18nextLng`, lingua scelta) e `sessionStorage` (`lockvfx:*`, loader e invii), nessun cookie, nessun terzo — per questo non c'è banner. Il testo va in `privacy.body` (it/en): me lo passi e lo inserisco io.
- [ ] Decidere il link «Cookie policy» del footer: oggi apre la stessa informativa. Consiglio: **toglierlo** e tenere un solo «Privacy», con il paragrafo sullo storage dentro. Dimmelo e lo faccio.
- [ ] Le 6 domande al commercialista/avvocato di `handoff-legale.md` (società di fatto, marchio, base giuridica, EmailJS/TIA, breakdown, volti): non bloccano il lancio ma vanno fatte.

## Decisioni di prodotto che aspettano te

- [ ] `FOOTER_CTA_VARIANT` (`Footer.tsx`): oggi `'full'`. Va bene così? Se sì, non fare niente.
- [ ] Variante A: le scelte dei ragazzi sono già tutte su `v2` (marchio rosso, card del footer, pillola). Il branch `variante-a-rw` può essere cancellato: `git push origin --delete variante-a-rw`.
- [ ] `main`: al lancio, `git checkout main && git merge --ff-only v2 && git push`, e in Pages Production branch = `main`.

## Dopo il lancio (non urgente)

- [ ] Lighthouse dal tuo PC (il cantiere cloud non può installarlo): desktop e mobile, home e `/studio/`. Se qualcosa è sotto 90, dammi il JSON (`materiale/`).
- [ ] Test sulla GPU integrata di un portatile qualunque: la carrellata deve stare a 60 fps.
- [ ] Il `.mov` ProRes del loader non va mai committato in `public/`.
