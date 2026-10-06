# Contenuti — dove vanno testi, immagini e video

*Procedura per quando arrivano i materiali dai ragazzi. La fa un agente Sonnet ("Contenuti") con questo file come spec; la lead rilegge il diff e fa validare. Niente di qui richiede decisioni di design: sono sostituzioni.*

## 1. Testi (i18n)

Le chiavi stanno in `src/locales/it.json` e `src/locales/en.json`: **ogni modifica va in entrambe**, stessa chiave. Segnaposto ancora aperti (grep `\[` nei json per trovarli):

| chiave | oggi | cosa ci va |
|---|---|---|
| `statement.paragraph` | «…con cui [Nome] e [Nome] lavorano insieme…» | i nomi veri (Denis Ruscitti, Nicholas Pantieri) e il paragrafo definitivo dello Studio |
| `statement.credits.a` / `.b` | «[Nome] · compositing», «[Nome] · 3D/CGI» | nome · disciplina di ciascuno, come la vogliono loro |
| `statement.credits.c` | «[Città]» | la città **oppure si toglie la riga** (e il suo render in `Statement.tsx`) — decisione dei ragazzi |
| `landing.chi.lead` | «…[Nome 1] e [Nome 2]…» | i nomi |
| `landing.chi.paragraph` | «[...]» | il paragrafo "chi siamo" della pagina Studio |
| `landing.persone.placeholder` | una chiave per entrambi | **due chiavi** `landing.persone.denis` e `landing.persone.nicholas` (o un campo `bio` in `src/data/people.ts`), una bio ciascuno; `StudioPage.tsx` le legge per persona |
| `landing.servizi.*` | 6 servizi «da confermare» | i servizi confermati (anche meno di 6) |
| `meta.description` | generica | con i nomi, ≤ 155 caratteri; **anche** in `index.html` (riga statica per i crawler) e `studio/index.html` |
| `privacy.body` | «in preparazione» | l'informativa completa dal Legale (it **e** en), paragrafi separati da `\n\n` |

Regole: niente "società/studio/founded by"; i nomi sono già in `src/data/people.ts` (`PEOPLE`) — dove possibile interpolare, non riscrivere. Dopo: `npm run build` e il prerender di `/studio/` (`dist/studio/index.html`) deve contenere i testi nuovi.

## 2. Lavori (`src/data/works.ts`)

Un elemento di `PLACEHOLDERS` per lavoro: `id` = slug (minuscolo, trattini, stabile: è anche il nome dei file), `title`, `year`, `client`, `disciplines` (le discipline **di LockVFX** in quel lavoro), `fullUrl` (Vimeo/YouTube del video completo), `rights: 'cleared'` **solo con l'autorizzazione scritta in mano** (altrimenti `'pending'` e il lavoro non si mostra), `order`. I percorsi dei media li costruisce `src/lib/media.ts` dallo slug: non si scrivono a mano.

## 3. Video e poster

1. I master vanno in `materiale/video/` (ignorata da git). Serve `ffmpeg` sul PC (sul cantiere cloud c'è già).
2. Codifica (preset fissi di `rifinitura-spec.md` §8: HD 1080p CRF 19 ≤ 10 Mbit/s, SD 720p CRF 22 ≤ 3,5 Mbit/s, `+faststart`, solo MP4, poster WebP 1280×720):
   - `node scripts/encode-video.mjs reel materiale/video/showreel.mov`
   - `node scripts/encode-video.mjs reel-mobile materiale/video/showreel-9x16.mov`
   - `node scripts/encode-video.mjs work <slug> materiale/video/<file>.mov` per ogni lavoro
   - opzioni: `--out`, `--poster-at <sec>`, `--muto`, `--solo hd|sd|poster`. Output in `media/` con i nomi di R2: `reel/reel-hd.mp4`, `reel-sd.mp4`, `reel-poster.webp`, `reel-mobile-*`, `works/<slug>-hd.mp4`, `-sd.mp4`, `<slug>.webp`.
3. Caricare `media/` così com'è nel bucket R2 `lockvfx-media` (stessa struttura di cartelle). `Content-Type` corretti (`video/mp4`, `image/webp`).
4. In Cloudflare Pages: `VITE_MEDIA_URL=https://media.<dominio>` (senza barra finale), `VITE_REEL=on`, `VITE_WORKS=on`. Per provare in locale senza R2: file in `public/video/` con gli stessi nomi e `VITE_MEDIA_URL` vuoto.
5. Il poster della reel sostituisce `public/images/showreel-poster.webp` (1280 px, ≤ 150 kB) e `showreel-poster-mobile.webp` (720×1280): sono l'LCP, restano nel sito, non su R2.
6. Dopo: la riverifica R13 (`docs/specs/rifinitura.md` §8): partenza entro 2 s su 4G con HD e 1 s con SD, poster come LCP, autoplay con i file veri, fine video nella Sala, audio.

## 4. Immagini e social

- `public/og.png` 1200×630: va bene quello che c'è, salvo diversa versione dai ragazzi.
- `SOCIALS` in `src/components/Footer.tsx`: profili veri o rimozione delle icone.

## 5. Controllo finale

`grep -rn "\[Nome\|\[\.\.\.\]\|\[due righe\|\[Città\|vimeo.com/'\|da confermare\|in preparazione" src index.html studio/index.html` deve restituire zero righe. Poi validazione (desktop + 390×844) e push.
