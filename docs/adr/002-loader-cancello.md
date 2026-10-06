# 002 — Il cancello del loader è il primo fotogramma, non `canplaythrough` (18/9)
**Contesto.** iOS Safari non scarica un video finché non lo si fa partire: `canplaythrough` non arrivava mai e dopo 6 s si vedeva solo la riserva disegnata.
**Decisione.** `play()` al montaggio (muto, playsInline); "pronto" = primo `timeupdate` con `currentTime > 0`; `pause()` + riavvolgi; poi la coreografia (ingresso 300 · video 1× · tenuta 400 · innesto 400 · respiro 300 · volo 900). `play()` rifiutato → riserva subito. Un solo `src` scelto con `canPlayType` (mp4 di norma). Loader pieno a ogni sessione nuova (`sessionStorage`).
**Conseguenze.** Il ramo mp4 è verificato solo sui browser veri (il Chromium del cantiere non ha H.264). Spec: `docs/specs/rifinitura.md` §9.2, §9.5.
