import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

type CursorMode = 'default' | 'lens' | 'click' | 'grab';

const SIZE: Record<CursorMode, number> = { default: 18, lens: 44, click: 30, grab: 30 };

/**
 * Cursore custom globale — coerente col motivo "Director's Monitor".
 *
 * v3 — due nuovi stati:
 *  - 'click': su qualunque `<a>`/`<button>` reale o `[data-cursor="click"]`
 *    esplicito (bottone pieno, segnala "questo si clicca").
 *  - 'grab': su `[data-cursor="grab"]` (bordo tratteggiato — nessun elemento
 *    lo usa ancora, ma il sistema è pronto per elementi trascinabili futuri,
 *    es. una gallery drag-to-scroll). Su mousedown, qualunque modalità,
 *    il cursore si stringe leggermente (feedback di "pressione").
 *
 * La zona "lens" resta l'unica rilevata con test GEOMETRICO (mai hit-test
 * nativo — vedi nota v2): è l'unica sovrapposta al Canvas 3D. Tutto il
 * resto (bottoni, link) usa `closest()` normale: sono DOM reali, non
 * ostacolano nulla sotto.
 */
export const CustomCursor: React.FC = () => {
  const [isFinePointer, setIsFinePointer] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: fine)').matches;
  });

  const [mode, setMode] = useState<CursorMode>('default');
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40 });
  const springY = useSpring(y, { stiffness: 500, damping: 40 });

  const lastLensCheck = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const handleMediaChange = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    if (!isFinePointer) return () => mediaQuery.removeEventListener('change', handleMediaChange);

    document.documentElement.classList.add('custom-cursor-active');

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);

      let next: CursorMode = 'default';

      const now = performance.now();
      if (now - lastLensCheck.current > 16) {
        lastLensCheck.current = now;
        const zone = document.querySelector('[data-cursor="lens"][data-active="true"]');
        if (zone) {
          const r = zone.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
            next = 'lens';
          }
        }
      } else if (mode === 'lens') {
        next = 'lens'; // mantiene lo stato tra un check e l'altro (throttle)
      }

      if (next === 'default') {
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-cursor="grab"]')) next = 'grab';
        else if (target?.closest('a, button, [data-cursor="click"]')) next = 'click';
      }

      setMode(next);
    };

    const hide = () => setVisible(false);
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', hide);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', hide);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, [isFinePointer, visible, mode, x, y]);

  if (!isFinePointer) return null;

  const size = SIZE[mode] * (pressed ? 0.82 : 1);

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 z-100 pointer-events-none"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
    >
      <motion.div
        className={`relative -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center border ${
          mode === 'click' ? 'bg-[#E60B18]/85 border-transparent' : 'border-[#E60B18]/60'
        } ${mode === 'grab' ? 'border-dashed border-[#E60B18]/70' : ''}`}
        animate={{ width: size, height: size }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        {mode === 'default' && <span className="w-1 h-1 rounded-full bg-[#E60B18]" />}
        {mode === 'grab' && <span className="w-1.5 h-1.5 rounded-full bg-[#E60B18]/80" />}
        {mode === 'lens' && (
          <>
            <span className="absolute inset-x-0 top-1/2 h-px bg-[#E60B18]/35" />
            <span className="absolute inset-y-0 left-1/2 w-px bg-[#E60B18]/35" />
          </>
        )}
      </motion.div>
    </motion.div>
  );
};