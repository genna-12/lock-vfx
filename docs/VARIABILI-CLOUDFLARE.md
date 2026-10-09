# Variabili su Cloudflare Pages — cosa mettere, quando

*Una pagina sola, in tre momenti. Sostituisce la tabella di `GUIDA-LANCIO.md` §5.*

## Dove si mettono

Cloudflare → **Workers & Pages** → progetto `lock-vfx` → **Settings** → **Variables and Secrets** (in alcune schermate si chiama ancora *Environment variables*) → **Add**.

- **Ambiente: Production.** Il Production branch oggi è `v2`: le variabili "Production" valgono per il sito vero. (Il passaggio a `main` si fa dopo il lancio, con calma: non cambia nulla per i visitatori.)
- **Tipo: Text** (non Secret). Sono valori che finiscono comunque nel codice del sito che scarica il browser: la public key di EmailJS è *fatta* per essere pubblica.
- Nome **esatto**, maiuscole comprese. Valori **senza virgolette** e **senza barra finale** negli indirizzi.
- **Le variabili entrano solo in un build nuovo.** Dopo averle salvate: **Deployments** → l'ultimo deployment → **⋯ → Retry deployment** (oppure un push su `v2`). Senza questo passo il sito resta com'era.

## 1. Adesso — per far funzionare il form

| nome | valore | dove lo trovi |
|---|---|---|
| `VITE_EMAILJS_PUBLIC_KEY` | es. `aB3xYz…` | EmailJS → **Account** → General → *Public Key* |
| `VITE_EMAILJS_SERVICE_ID` | es. `service_ab12cd3` | EmailJS → **Email Services** → il servizio Gmail di info@ |
| `VITE_EMAILJS_TEMPLATE_ID` | es. `template_x9y8z7` | EmailJS → **Email Templates** → la *Notifica* (`docs/emailjs/notifica.html`) |
| `VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID` | es. `template_k4l5m6` | la *Risposta automatica* (`docs/emailjs/risposta-automatica.html`) |

Poi Retry deployment e **un invio vero** dal sito (in italiano e in inglese): a info@ arriva la notifica, a te la risposta automatica nella lingua giusta.

Se manca anche una sola delle prime tre, il form dice «non è partito» e mostra l'indirizzo email: non finge mai di aver spedito.

## 2. Al lancio (domenica)

| nome | azione |
|---|---|
| `VITE_SITE_URL` | aggiungi `https://lockvfx.com` → canonical, anteprime social, `sitemap.xml`, riga `Sitemap:` in `robots.txt` |
| `VITE_PREVIEW` | **elimina la variabile** se c'è (finché c'è, Google non indicizza il sito) |

Poi Retry deployment e i controlli di `GUIDA-LANCIO.md` §6.

## 3. Quando i video sono su R2

| nome | valore | quando |
|---|---|---|
| `VITE_MEDIA_URL` | `https://media.lockvfx.com` | quando il bucket ha il dominio `media.lockvfx.com` e i file caricati |
| `VITE_REEL` | `on` | quando la showreel è su R2 |
| `VITE_WORKS` | `on` | quando i video dei lavori sono su R2 |

Accenderle prima che i file ci siano = video che non partono. Le carico io e ti dico quando.

## Mai in produzione

`VITE_EMAILJS_MOCK` (il form finge di spedire) · `VITE_WORKS_DEMO` (mostra i lavori finti) · `VITE_BASE` (serve solo a GitHub Pages).
`NODE_VERSION = 22` c'è già: lasciala.
