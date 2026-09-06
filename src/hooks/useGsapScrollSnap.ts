import { useEffect } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Options {
  /** Punti di sosta come frazione 0-1, stesso formato di prima */
  points: number[];
  enabled?: boolean;
}

/**
 * v3 — torna alla forma standard di ScrollTrigger.snap (array, sempre
 * attivo), che è quella più testata/documentata, invece della funzione
 * custom con "raggio" del giro precedente: quella poteva generare un
 * micro-tween di correzione ad ogni sosta, ovunque ci si fermasse, il che
 * spiega "non si ferma bene nei punti esatti".
 *
 * Qui l'obiettivo cambia: non più "un tocco leggero solo vicino ai
 * contenuti", ma un'esperienza guidata end-to-end — ogni scroll accompagna
 * verso il punto più vicino nella direzione di marcia, sempre, avanti e
 * indietro. Per questo 0 e 1 sono inclusi esplicitamente: coprono tutta
 * la timeline, non solo i 3 momenti di contenuto.
 *
 * `directional: true` fa scegliere il punto nella direzione in cui si
 * sta scrollando quando possibile (comportamento nativo di ScrollTrigger,
 * non richiede logica nostra). `duration`/`ease` più lunghi = transizione
 * più "accompagnata", meno un semplice scatto.
 */
export function useGsapScrollSnap<T extends HTMLElement = HTMLElement>(
  containerRef: RefObject<T | null>,
  { points, enabled = true }: Options
) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = containerRef.current;
    if (!el) return;

    const snapTo = Array.from(new Set([0, ...points, 1])).sort((a, b) => a - b);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        snap: {
          snapTo,
          directional: true,
          duration: { min: 0.35, max: 0.9 },
          delay: 0.08,
          ease: 'power2.inOut',
        },
      });
    });

    return () => ctx.revert();
  }, [containerRef, points, enabled]);
}