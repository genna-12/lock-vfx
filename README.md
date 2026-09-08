# LockVFX — sito

React + TypeScript + Vite, Tailwind v4, GSAP/ScrollTrigger, i18next. Due
pagine statiche e nessun router: la home (`index.html`, la carrellata) e
`/studio/` (`studio/index.html`, solo testo). `npm run dev` per lavorarci,
`npm run build` per il `dist/`, `npm run serve:dist` per guardarlo come lo
vedrà il browser — **non** `vite preview` (Console Ninja falsa le misure).

## Anteprima e produzione

Il sito non sa dove abita: glielo dicono tre variabili, tutte facoltative,
tutte con un default che funziona (`.env.example` le elenca tutte).

- `VITE_SITE_URL` — l'indirizzo del sito, **senza barra finale**. Finché è
  vuoto il sito non dichiara `canonical` né `og:url`: un canonical
  sbagliato è peggio di nessun canonical. Quando il dominio c'è si riempie
  questa, e con essa si accendono da sole la canonical di tutte e due le
  pagine, `og:url` e l'indirizzo assoluto dell'immagine OG. Resta da fare a
  mano solo la riga `Sitemap:` in `public/robots.txt`.
- `VITE_PREVIEW=1` — è l'anteprima che guardano i ragazzi, non il sito
  vero: le due pagine dichiarano `noindex, nofollow` e il build scrive
  `dist/_headers` con `X-Robots-Tag` (lo legge Cloudflare Pages, e lo legge
  anche chi non esegue il JavaScript). Si spengono insieme togliendo la
  variabile: non c'è nessun file da ricordarsi di cancellare al lancio.
- `VITE_BASE` — la sottocartella, se il sito non sta alla radice del
  dominio (GitHub Pages: `/lock-vfx/`). Con un dominio proprio non serve.

L'anteprima è su **Cloudflare Pages**, branch `v2`: ogni push ridistribuisce
da solo. La procedura completa — creazione del progetto, variabili, password
facoltativa, R2 per i video, cosa cambiare il giorno del lancio — sta in
`deploy-e-anteprima.md` nel Project, che è l'unico posto in cui è scritta
per intero: queste righe la riassumono, non la sostituiscono.

Le chiavi (`VITE_EMAILJS_*`) non stanno nel repo: in locale in `.env.local`,
su Cloudflare fra le variabili del progetto. Senza chiavi il form dei
contatti fallisce dicendolo e offre il `mailto:` — che per un'anteprima è il
comportamento giusto.
