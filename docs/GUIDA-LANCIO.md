# Guida al lancio — passo per passo (Genna)

*Scritta il 7/10/2026. Dominio comprato su Hostinger: `lockvfx.com` (principale) e `lockvfx.it` (rimanda al .com). Hosting: Cloudflare Pages (già attivo, anteprima `lock-vfx.pages.dev`), video su Cloudflare R2, form con EmailJS. Tutto a costo zero salvo i domini. I nomi delle voci dei pannelli possono differire di poco: cerca la voce più simile. Se una schermata non corrisponde, dimmelo e ti dico cosa fare.*

## 0. L'ordine giusto (mezza giornata, poi aspetti i DNS)

1. Nameserver di Hostinger → Cloudflare (sez. 1). Da qui in poi i domini vivono su Cloudflare.
2. Dominio su Pages (sez. 2). 3. EmailJS (sez. 3). 4. R2 (sez. 4), quando i video codificati ci sono. 5. Variabili di lancio e primo deploy vero (sez. 5). 6. Controlli (sez. 6).

## 1. I domini: da Hostinger a Cloudflare (DNS)

Perché: Pages, R2 con dominio proprio (`media.lockvfx.com`) e i redirect richiedono che il dominio sia **gestito dai DNS di Cloudflare**. Il dominio resta comprato su Hostinger (lì rinnovi): sposti solo i DNS. Gratis.

1. Su `dash.cloudflare.com` → **Add a domain** (o "Onboard a domain") → scrivi `lockvfx.com` → piano **Free** → Cloudflare legge i record DNS esistenti (va bene, non c'è ancora niente di importante; se Hostinger aveva record di posta/MX per `info@lockvfx.com`, **tienili**: li vedi nell'elenco, lascia tutto).
2. Cloudflare ti dà **due nameserver** (tipo `ada.ns.cloudflare.com` e `ivan.ns.cloudflare.com`).
3. Su **hPanel di Hostinger** → Domini → `lockvfx.com` → **DNS / Nameserver** → "Cambia nameserver" → **Usa nameserver personalizzati** → incolla i due di Cloudflare → salva. Hostinger avvisa che perdi i servizi DNS Hostinger: ok.
4. Ripeti 1–3 per `lockvfx.it`.
5. Attendi: di solito 10 minuti–qualche ora (max 24–48). Su Cloudflare lo stato del dominio passa da "Pending" ad **Active** (ti arriva un'email).
6. Su Cloudflare, per entrambi i domini: **SSL/TLS → Overview → Full (strict)**; **Edge Certificates → Always Use HTTPS: On**. (Il certificato lo fa Cloudflare da solo.)

**Posta `info@lockvfx.com`.** Se la casella è su Hostinger (o Google/Zoho), i record **MX**, **SPF (TXT)** e **DKIM** della casella devono stare nei DNS di Cloudflare: Hostinger li aveva già importati al passo 1, altrimenti li ricopi dal pannello della casella. Senza, la posta a `info@` smette di arrivare. Prova a mandarti un'email dopo il cambio.

## 2. Il sito sul dominio (Cloudflare Pages)

1. Cloudflare → **Workers & Pages** → progetto `lock-vfx` → **Custom domains** → **Set up a custom domain** → `lockvfx.com` → Cloudflare crea da solo il record (CNAME verso `lock-vfx.pages.dev`) → **Activate**. Poi aggiungi anche **`www.lockvfx.com`** allo stesso modo.
2. Redirect `www` → apex: Cloudflare → `lockvfx.com` → **Rules → Redirect Rules → Create rule**: *When incoming requests match* Hostname `equals` `www.lockvfx.com` → *Then* Dynamic redirect, expression `concat("https://lockvfx.com", http.request.uri.path)`, status **301**. (Se preferisci il contrario, inverti.)
3. `lockvfx.it` → `lockvfx.com`: su `lockvfx.it` crea un record DNS **A** `@` → `192.0.2.1` **proxied** (arancione; è un indirizzo fittizio, serve solo a far passare la richiesta da Cloudflare) e uno **AAAA** `@` → `100::` proxied, idem per `www`; poi **Rules → Redirect Rules**: Hostname `ends with` `lockvfx.it` → `concat("https://lockvfx.com", http.request.uri.path)`, 301. Risultato: `lockvfx.it/qualsiasi` → `lockvfx.com/qualsiasi`.
4. `lock-vfx.pages.dev` → dominio: in Pages non si può fare un redirect dal pannello; lo fa il sito stesso se vuoi (dimmelo: aggiungo 5 righe in `public/_redirects` o un controllo in `main.tsx`). Non è obbligatorio: Google indicizza il dominio perché è il `canonical`.

## 3. EmailJS (il form dei contatti)

Il sito manda il messaggio dal browser a EmailJS, che lo inoltra a `info@lockvfx.com`. Piano **Free**: ~200 invii al mese, più che sufficiente; se un giorno non bastasse, il primo piano a pagamento è ~10 $/mese — da decidere tu allora.

1. Registrati su `emailjs.com` con una casella **vostra** (`info@lockvfx.com` o la tua): è l'account che riceve.
2. **Email Services → Add New Service** → scegli il provider della casella `info@lockvfx.com` (Gmail/Google Workspace, Zoho, Outlook, oppure **"Other/SMTP"** con i dati SMTP che ti dà Hostinger se la casella è lì: host `smtp.hostinger.com`, porta 465, utente `info@lockvfx.com`, password della casella) → **Connect** → prova "Send test email". Segna il **Service ID** (es. `service_ab12cd3`).
3. **Email Templates → Create New Template**. Impostazioni:
   - **To Email**: `info@lockvfx.com`
   - **From Name**: `{{from_name}}` · **Reply To**: `{{reply_to}}` (così "Rispondi" va alla persona)
   - **Subject**: `Nuovo messaggio dal sito — {{from_name}}`
   - **Content** (testo):
     ```
     Da: {{from_name}} <{{reply_to}}>
     Lingua: {{lang}} · Pagina: {{page}}

     {{message}}
     ```
   I nomi dei parametri sono **esattamente** `from_name`, `reply_to`, `message`, `lang`, `page`: il sito li manda così. Salva; segna il **Template ID** (es. `template_x9y8z7`).
4. (Facoltativo) Secondo template di **risposta automatica** a chi scrive: To Email `{{reply_to}}`, oggetto «Ricevuto — LockVFX», testo breve («Grazie, ti rispondiamo entro due giorni lavorativi.»). Segna il suo Template ID: va in `VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID`. Se non lo vuoi, non impostare quella variabile.
5. **Account → General**: copia la **Public Key** (es. `AbCdEfGh123456789`).
6. **Account → Security**: attiva la **restrizione dei domini** (allowlist) con `lockvfx.com`, `www.lockvfx.com`, `lockvfx.it` **e** `lock-vfx.pages.dev` (per provare dall'anteprima); imposta un **limite** (es. 50 invii/giorno). Serve perché la public key è visibile nel sito. Se il tuo piano non ha quella voce, dimmelo.
7. Le tre chiavi (`Service ID`, `Template ID`, `Public Key`) vanno su Cloudflare, sez. 5. **Non** nel repo, **non** in `.env` committati.
8. Dopo il deploy: un **invio vero** dal sito, controllo che arrivi su `info@` e che "Rispondi" vada all'indirizzo di chi ha scritto.

## 4. Cloudflare R2 (i video)

Serve solo quando i master sono stati codificati (`docs/CONTENUTI.md`: `scripts/encode-video.mjs` produce la cartella `media/` con reel e lavori in HD/SD + poster). Gratis fino a 10 GB e 10 milioni di letture al mese, **traffico gratis**. Il dominio deve essere su Cloudflare (sez. 1).

1. Cloudflare → **R2 Object Storage** → **Create bucket** → nome `lockvfx-media`, location automatic → Create. (La prima volta chiede una carta per abilitare R2: il piano è pay-as-you-go con la fascia gratuita; sotto le soglie **non addebita nulla**.)
2. Bucket → **Settings → Public access → Custom Domains → Connect Domain** → `media.lockvfx.com` → Cloudflare crea il record DNS e il certificato → stato **Active**. (In alternativa "r2.dev subdomain → Allow Access" dà un indirizzo tipo `pub-xxxx.r2.dev`: funziona ma è rate-limited e non da produzione; usa il dominio.)
3. Caricamento: dal pannello **Objects → Upload** trascinando le **cartelle** `reel/` e `works/` così come sono (i nomi devono restare `reel/reel-hd.mp4`, `reel/reel-sd.mp4`, `reel/reel-poster.webp`, `reel/reel-mobile-hd.mp4`, `reel/reel-mobile-sd.mp4`, `reel/reel-mobile-poster.webp`, `works/<slug>-hd.mp4`, `works/<slug>-sd.mp4`, `works/<slug>.webp`). Il `Content-Type` lo mette R2 dall'estensione; controlla su un file che sia `video/mp4`. Oppure, se preferisci, lo faccio io con `wrangler` se mi dai un token R2 (Manage R2 API Tokens → Object Read & Write sul bucket): lo usi una volta e lo revochi.
4. Prova: apri `https://media.lockvfx.com/reel/reel-poster.webp` nel browser.
5. In Pages (sez. 5): `VITE_MEDIA_URL=https://media.lockvfx.com` (senza barra finale), `VITE_REEL=on`, `VITE_WORKS=on`. Dopo il deploy guarda che la reel parta e i lavori abbiano i video.
6. Cache: R2 dietro Cloudflare mette in cache i file; a ogni sostituzione di un video **cambia il nome** (o purge della cache in Caching → Purge). Per questo i nomi hanno `-hd`/`-sd`: se un giorno rifate un breakdown, slug nuovo.

## 5. Variabili e deploy di produzione (Cloudflare Pages)

Workers & Pages → `lock-vfx` → **Settings → Environment variables → Production**:

| variabile | valore | note |
|---|---|---|
| `VITE_SITE_URL` | `https://lockvfx.com` | **senza barra finale**; accende canonical, OG assoluti, `sitemap.xml`, riga `Sitemap:` in `robots.txt` |
| `VITE_PREVIEW` | **(cancellare la variabile)** | finché c'è, le pagine sono `noindex` e `_headers` ha `X-Robots-Tag` |
| `VITE_EMAILJS_PUBLIC_KEY` | dalla sez. 3 | |
| `VITE_EMAILJS_SERVICE_ID` | dalla sez. 3 | |
| `VITE_EMAILJS_TEMPLATE_ID` | dalla sez. 3 | |
| `VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID` | solo se vuoi la risposta automatica | |
| `VITE_MEDIA_URL` | `https://media.lockvfx.com` | solo quando i video sono su R2 (sez. 4) |
| `VITE_REEL` / `VITE_WORKS` | `on` | idem; finché sono `none` resta il poster |
| `NODE_VERSION` | `22` | c'è già |
| `VITE_EMAILJS_MOCK` | **mai** in produzione | |

Poi **Deployments → Retry deployment** (le variabili entrano solo in un build nuovo) **oppure** un push su `v2`. Il Production branch oggi è `v2`: puoi lasciarlo così fino al lancio; quando vuoi, allinei `main` (`git checkout main && git merge --ff-only v2 && git push`) e in Settings → Builds metti Production branch = `main`.

Se avevi messo la **password** (Zero Trust → Access) sull'anteprima: toglila (Access → Applications → elimina l'app) prima del lancio.

## 6. Controlli dopo il deploy (5 minuti)

1. `https://lockvfx.com` apre il sito con il lucchetto HTTPS; `https://www.lockvfx.com` e `https://lockvfx.it` rimandano al `.com`.
2. Sorgente della pagina (Ctrl+U): **nessun** `noindex`; `<link rel="canonical" href="https://lockvfx.com/">`; `og:image` assoluto.
3. `https://lockvfx.com/robots.txt` con la riga `Sitemap: https://lockvfx.com/sitemap.xml`; `https://lockvfx.com/sitemap.xml` con 2 URL; `https://lockvfx.com/qualcosa-che-non-esiste` mostra la 404 del sito.
4. In PowerShell: `curl -I https://lockvfx.com` → **senza** `x-robots-tag`, con `cache-control` sui file di `/assets/`.
5. Anteprima social: `https://developers.facebook.com/tools/debug/` e LinkedIn Post Inspector con `https://lockvfx.com` → immagine e titolo giusti.
6. Form: un invio vero; "Rispondi" dalla casella; un secondo invio entro 60 s mostra l'attesa.
7. Telefono vero: loader, reel, scroll, lingua, form.
8. **Google Search Console**: aggiungi la proprietà `lockvfx.com` (verifica DNS: Cloudflare ti fa aggiungere il record TXT con un clic), invia `sitemap.xml`, chiedi l'indicizzazione di `/` e `/studio/`. Bing Webmaster Tools importa da Search Console in un clic.

## 7. Cosa NON serve

Nessun banner cookie (niente cookie, niente terzi); nessun piano a pagamento di Cloudflare; nessun "Cloudflare Stream"; nessun hosting Hostinger (se avevano comprato anche un hosting, può restare inutilizzato o essere disdetto: il sito sta su Pages).
