import React, { useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

type GlassTag = 'div' | 'footer' | 'section' | 'article';

interface GlassPanelProps {
  as?: GlassTag;
  /** Se false: niente tilt/spotlight al mouse — pannello statico */
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// Mappa esplicita dei componenti Framer Motion per preservare i tipi esatti delle props
const motionTags = {
  div: motion.div,
  footer: motion.footer,
  section: motion.section,
  article: motion.article,
} as const;

/**
 * Superficie "Liquid Glass" unica per tutto il sito.
 *
 * Nota sulla spotlight: mx/my e l'opacità (`glow`) sono spring separate.
 * Al mouse-leave NON riportiamo mx/my al centro (era quello a causare lo
 * "scatto" quando il puntatore usciva dal riquadro) — semplicemente
 * spegniamo `glow` in dissolvenza, la luce resta dov'era e sfuma sul posto.
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({
  as = 'div',
  interactive = true,
  className = '',
  children,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const mx = useSpring(50, { stiffness: 140, damping: 18 });
  const my = useSpring(50, { stiffness: 140, damping: 18 });
  const glow = useSpring(0, { stiffness: 120, damping: 22 });
  const rotX = useSpring(0, { stiffness: 220, damping: 22 });
  const rotY = useSpring(0, { stiffness: 220, damping: 22 });

  const spotlight = useTransform([mx, my], ([x, y]: number[]) =>
    `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.22), rgba(255,255,255,0) 42%)`
  );

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    mx.set(px * 100);
    my.set(py * 100);
    glow.set(1);
    rotY.set((px - 0.5) * 6);
    rotX.set((0.5 - py) * 6);
  };

  const handleLeave = () => {
    if (!interactive) return;
    glow.set(0);
    rotX.set(0);
    rotY.set(0);
    // mx/my restano dove sono: la luce si spegne, non "torna indietro".
  };

  const Component = motionTags[as];

  return (
    <Component
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{
        rotateX: interactive ? rotX : 0,
        rotateY: interactive ? rotY : 0,
        transformPerspective: 900,
      }}
      className={`glass-panel relative overflow-hidden transform-gpu ${className}`}
    >
      {interactive && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: spotlight, opacity: glow }}
        />
      )}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent" />
      <span className="pointer-events-none absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-[#E60B18]/25 to-transparent" />
      <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-cyan-400/15 to-transparent" />
      <span className="relative z-10 block">{children}</span>
    </Component>
  );
};