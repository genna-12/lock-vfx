/**
 * La sonda: `?probe=1`.
 *
 * Tre lotti hanno inseguito l'altezza della finestra dell'iPhone con tre
 * unità CSS diverse — `svh`, `dvh`, l'altezza dal contenuto — senza mai
 * misurarla su un telefono. Questo pannello serve a smettere: dice i numeri
 * veri, sul dispositivo vero, e si legge da una schermata.
 *
 * Vive fuori dal bundle di produzione: lo Stage lo importa con un `import()`
 * dinamico solo quando l'indirizzo ha `?probe=1`, quindi chi non lo chiede
 * non ne scarica una riga.
 *
 * Non tocca niente: legge, misura con un righello nascosto e scrive.
 */

type Fonti = {
  /** 0 o 1, da ScrollTrigger. */
  isTouch: number;
  /** Se `normalizeScroll` è attivo in questo momento. */
  normalizzato: () => boolean;
  /** Posizione della camera in vh della timeline (0–560). */
  vh: () => number;
};

/** Quante posizioni di scroll si tengono: abbastanza per leggere un glitch. */
const STORIA = 8;

export function mountProbe(fonti: Fonti): () => void {
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'z-index:2147483647',
    'margin:6px',
    'padding:8px 10px',
    'max-width:calc(100vw - 12px)',
    'background:rgba(0,0,0,.82)',
    'color:#fff',
    'font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace',
    'white-space:pre',
    'pointer-events:none',
    'border:1px solid rgba(255,255,255,.25)',
  ].join(';');

  // Il righello: un elemento alto `100svh`/`100lvh`/`100dvh` a turno, misurato
  // davvero. Chiedere il valore a `getComputedStyle` darebbe la stringa, non
  // il numero che il browser usa.
  //
  // Sta accanto al pannello e non dentro: il pannello si riscrive con
  // `textContent`, che porta via i figli — misurato, la prima volta con tre
  // zeri a schermo.
  const righello = document.createElement('div');
  righello.style.cssText =
    'position:fixed;top:0;left:0;width:1px;visibility:hidden;pointer-events:none'; 
  const unita = (u: string): number => {
    righello.style.height = `100${u}`;
    return Math.round(righello.getBoundingClientRect().height);
  };

  const storia: string[] = [];
  const t0 = performance.now();
  const alto = (sel: string): string => {
    const el = document.querySelector(sel);
    return el ? String(Math.round(el.getBoundingClientRect().height)) : '—';
  };

  const scrivi = () => {
    box.textContent = [
      `finestra  ${window.innerWidth}×${window.innerHeight}`,
      `svh ${unita('svh')}  lvh ${unita('lvh')}  dvh ${unita('dvh')}`,
      `palco ${alto('.stage')}  set1 ${alto('[data-set]')}  --stage-h ${
        getComputedStyle(document.documentElement).getPropertyValue('--stage-h').trim() || '—'
      }`,
      `html "${document.documentElement.className}"`,
      `touch ${fonti.isTouch}  normalize ${fonti.normalizzato() ? 'on' : 'off'}  reduce ${
        matchMedia('(prefers-reduced-motion: reduce)').matches ? 'on' : 'off'
      }`,
      `camera ${fonti.vh()}vh   scrollY ${Math.round(window.scrollY)}`,
      'ultimi scroll (ms : y)',
      ...storia,
    ].join('\n');
  };

  const suScroll = () => {
    storia.push(`  ${Math.round(performance.now() - t0)} : ${Math.round(window.scrollY)}`);
    if (storia.length > STORIA) storia.shift();
    scrivi();
  };

  document.body.appendChild(box);
  document.body.appendChild(righello);
  scrivi();

  window.addEventListener('scroll', suScroll, { passive: true });
  window.addEventListener('resize', scrivi);
  window.addEventListener('orientationchange', scrivi);

  return () => {
    window.removeEventListener('scroll', suScroll);
    window.removeEventListener('resize', scrivi);
    window.removeEventListener('orientationchange', scrivi);
    box.remove();
    righello.remove();
  };
}
