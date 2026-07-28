import React from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#08090C]">
      {/* Light Blob 1 - Crimson Muted */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-137.5 h-137.5 bg-[#D3121B]/12 rounded-full blur-[180px] transform-gpu"
      />

      {/* Light Blob 2 - Graphite Cold */}
      <motion.div
        animate={{
          x: [0, -70, 50, 0],
          y: [0, 80, -50, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 -right-40 w-150 h-150 bg-slate-800/20 rounded-full blur-[200px] transform-gpu"
      />

      {/* Surface Grain Texture per evitare l'effetto plastico */}
      <div className="absolute inset-0 bg-white/1.5 backdrop-blur-[1px]" />
    </div>
  );
};