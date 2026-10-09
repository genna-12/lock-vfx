# Comandi

- Sviluppo: `npm run dev` (porta 5173, `window.__lock` disponibile per le letture della carrellata).
- Build: `npm run build` → `dist/`. Varianti utili: `VITE_PREVIEW=1` (anteprima con noindex), `VITE_SITE_URL=https://… ` (canonical/OG/sitemap), `VITE_EMAILJS_MOCK=1 VITE_WORKS=on VITE_REEL=on` (rami media e invio simulato), `VITE_WORKS_DEMO=on` (la Sala con i tre lavori d'esempio `pending`: senza, è vuota e mostra il cartello; **mai in produzione**).
- Servire il build: `npm run serve:dist` (porta 4173; copia `scripts/serve-dist.mjs` per un'altra porta). Mai `vite preview` per le misure.
- Lint/tipi: `npm run lint`, `npx tsc -b`.
- Misure e screenshot: Playwright headless, CommonJS: `NODE_PATH=/home/claude/.npm-global/lib/node_modules node script.cjs` con `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })` (cantiere cloud). Viewport di riferimento: 1440×900, 1024×768 (touch e mouse), 390×844 e 430×932 con `hasTouch: true, isMobile: true`, `prefers-reduced-motion: reduce`. Questo Chromium **non ha H.264**: sceglie `.webm`.
- Video: `node scripts/encode-video.mjs --help` (ffmpeg richiesto). Vedi `docs/CONTENUTI.md`.
- npm sul cantiere cloud: solo via proxy, `env -u NO_PROXY -u no_proxy -u npm_config_noproxy npm …`. Lighthouse non si installa: si misura a mano.
- Push: lo fa Genna dal PC (bundle in `_ufficio/`): `git fetch .\_ufficio\<file>.bundle v2:v2-cloud` · `git checkout -B v2 v2-cloud` · `git push origin v2`.
