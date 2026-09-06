import React from 'react';

/**
 * Sfondo ambientale, puramente decorativo, sotto a tutto il resto (z-0,
 * montato PRIMA del Canvas e del video nello stesso contenitore sticky).
 * Due blob di luce (crimson + un accenno freddo per contrasto) che
 * derivano molto lentamente, più un grain sottile via SVG feTurbulence —
 * la texture "da studio VFX" che rompe il nero piatto.
 */
export const AmbientBackground: React.FC = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full bg-[#E60B18]/10 blur-[140px] animate-[drift-a_26s_ease-in-out_infinite]" />
    <div className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-cyan-500/5 blur-[160px] animate-[drift-b_32s_ease-in-out_infinite]" />
    <svg className="absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay">
      <filter id="lockvfx-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#lockvfx-grain)" />
    </svg>
  </div>
);