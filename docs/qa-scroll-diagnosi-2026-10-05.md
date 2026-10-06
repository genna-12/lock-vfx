# Scroll desktop "a scatti con scroll lento" — diagnosi e cura (5/10)

Repo `v2` da `c886479`. Commit: `cb95730`, `7d3163d`, `6248da1`. Misure con Playwright/Chromium headless a 1440×900, dev server, campionamento a ogni rAF (scrollY, y di `#smooth-content`, progress, `tl.time()`). Ritmi della rotella: **cont** 30 px ogni 70 ms, **notch** 100 px ogni 350 ms, **slow** 100 px ogni 600 ms, 10 s ciascuno.

## Causa 1 — il magnete scriveva il contenuto, e lo smoother ingoiava i tacchi (`cb95730`)
`attract()` scriveva `smoother.scrollTop(v)` a ogni frame. In ScrollSmoother 3.15 quello è il salto secco: alza `isProxyScrolling`, e al tick dopo l'`onUpdate` dello smoother chiama `killScrub`, cioè ferma la propria scia e lascia il contenuto dov'è. Un tacco arrivato durante la trazione: barra 632 → 732, **contenuto fermo a −632 per 1,2 s** (tutto il tempo fra due tacchi). Poi la trazione successiva partiva da `smoother.scrollTop()` (il contenuto) e **riportava indietro la barra 746 → 632**: il tacco cancellato.
Cura: il magnete muove la barra (`smoother.scrollTo(v, true)`) partendo da `window.scrollY`; la camera la raggiunge con la scia normale.

## Causa 2 — il magnete partiva nella pausa fra due tacchi (`7d3163d`)
`scrollEnd` di GSAP = 200 ms senza eventi di scroll, + `delay` 0,15 s + camera "quasi ferma" (< 37 vh/s, che è proprio la velocità di uno scroll lento). Con la rotella *slow*: **5 trazioni mentre la rotella girava ancora**, la prima a 66 vh (appena entrati in T1).
Cura: il magnete parte solo se la mano (wheel/tasti/dito, già ascoltati da `interrupt`) è ferma da `SNAP.idle` = 0,7 s.

## Causa 3 — palco e luci ri-rasterizzati a ogni frame (`6248da1`)
I LoAF dicevano script ≈ 0 e stile/layout ≈ 0: il costo era nel raster. Traccia di Chrome, attribuita per layer: si rifaceva `#smooth-content` (1440×6769). Lo `.stage` pinnato sta fermo grazie a una `translate` 2D che cambia a ogni frame (pinType transform, per via dello smoother) e Chrome non la promuove → il palco veniva ridipinto **dentro** il layer del contenuto, HOLD compresi. Con `smooth: 0` (scroll nativo) il problema spariva: 160→380 vh, 9 896 tile contro 16.
Cura: in `montaCarrellata`, `will-change: transform` su `.stage` e `will-change: opacity` sulle due luci (fuori da `.world`: il 3D non si appiattisce). Solo desktop; `ctx.revert()` li toglie.

## Numeri prima → dopo
| misura | prima | dopo |
|---|---|---|
| slow: frame con contenuto fermo mentre la rotella gira | 165 | 1 |
| slow: trazioni del magnete a rotella in movimento | 5 | 0 |
| tacco durante una trazione: frame con contenuto congelato | 30–31 | 0 |
| barra riportata indietro dal magnete (4 scenari) | 1–2 per scenario | 0 |
| inversioni camera/contenuto (tutti i ritmi) | 0 | 0 |
| cont: frame > 20 ms / > 34 ms / p95 | 41 / 8 / 33,3 ms | 11 / 1 / 16,8 ms |
| notch: frame > 20 ms / > 34 ms / p95 | 42 / 5 / 33,3 ms | 16 / 2 / 16,8 ms |
| raster T1 (40→150 vh, 4,8 s) | 8 271 tile, 2 117 ms | 1 755 tile, 553 ms |
| raster 160→380 vh | 9 896 tile, 2 298 ms | 2 648 tile, 273 ms |

Isolamento (prima della cura): magneti spenti → plateau *slow* 165 → 0; `smooth: 0` → frame > 20 ms 41 → 1. `wholePixels: true` provato e scartato (7 942 tile contro 8 271: non è il sub-pixel). Il raster residuo in T1 è il dolly della reel (cambia scala proiettata, è il movimento stesso, sta dentro `.world`). Attenzione: qui composizione e raster sono software (SwiftShader); i numeri assoluti dei frame non valgono per una GPU vera, i rapporti sì.

## Invariati (verificato)
- Letture a 0/60/190/365/530 vh (e dove il magnete porta da 110/270/300/440): foro attivo e set accesi identici prima/dopo; screenshot agli HOLD identici (0–4 px), a metà T1/T2 differenze solo di antialiasing dei glifi (nitidezza −2 %).
- Magnete a rotella ferma: stessi HOLD di prima (T1↓→190, T3↓→530, T2↑→190).
- `tsc -b`, `lint`, `build` puliti; carrellata 23,56 kB gz (era ~23,5), CSS invariato; zero errori JS in dev e nel `dist/`.

## Deciso da me
- **`SNAP.idle` = 0,7 s** (nuovo): oltre la pausa fra due tacchi lenti, prima che la scia da 1,2 s si spenga.
- **Il magnete muove la barra, non il contenuto**: contraddice la lettera di `momento-1` (curva `power2.inOut` 0,4–0,9 s *sulla camera*): ora la curva è sulla barra e la camera la segue con la scia. Prezzo misurato: il 90 % della corsa arriva a ~1,5 s dall'ultimo tacco invece di ~1,0 s (0,27 s di attesa voluta + 0,28 s di scia).

## Da provare a mano
Rotella vera (Windows/mouse a scatti) e trackpad Mac (il momentum manda `wheel` per ~1 s: il magnete aspetta che finisca). Se il magnete sembra pigro, le manopole sono `SNAP.idle` e `SNAP.duration` in `camera.ts`. Non toccati: `scrub: 0.6` sopra lo smoother da 1,2 s (doppia scia: morbido, non a scatti) e `inCima`/`vaiAlSet`, che animano `smoother.scrollTop` e quindi possono ingoiare il primo tacco se interrotti con la rotella — stessa famiglia della causa 1.
