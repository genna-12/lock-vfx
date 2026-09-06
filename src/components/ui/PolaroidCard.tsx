import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface PolaroidCardProps {
  offset: number;
  rotate: number;
  clientName: string;
  videoUrl?: string; // TODO: quando ci sono i lavori reali, passare qui il loop video
}

/**
 * v3 — via il cerchio (non convinceva), dentro un tratto da evidenziatore
 * sul nome cliente: una barra semi-trasparente che si allarga da sinistra,
 * leggermente storta e un filo più lunga del testo (un evidenziatore vero
 * raramente è perfettamente dritto o esattamente lungo quanto la parola).
 * Rigenerata (piccola variazione di inclinazione) ad ogni hover.
 */
export const PolaroidCard: React.FC<PolaroidCardProps> = ({ offset, rotate, clientName, videoUrl }) => {
  const [hovered, setHovered] = useState(false);
  const [mark, setMark] = useState({ skew: -1.5, scaleY: 1, dx: 0, dy: 0 });

  const cardRef = useRef<HTMLDivElement>(null);
  const nudgeX = useSpring(0, { stiffness: 170, damping: 16 });
  const nudgeY = useSpring(0, { stiffness: 170, damping: 16 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = cx - e.clientX;
      const dy = cy - e.clientY;
      const dist = Math.hypot(dx, dy);
      const radius = 150;
      if (dist < radius) {
        const strength = (1 - dist / radius) * 7;
        const angle = Math.atan2(dy, dx);
        nudgeX.set(Math.cos(angle) * strength);
        nudgeY.set(Math.sin(angle) * strength);
      } else {
        nudgeX.set(0);
        nudgeY.set(0);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [nudgeX, nudgeY]);

  const handleEnter = () => {
    setHovered(true);
    // Diversa ogni volta — mai lo stesso identico segno: inclinazione,
    // spessore del tratto e posizione variano un po' ad ogni passaggio,
    // come farebbe davvero una mano con un evidenziatore.
    setMark({
      skew: -3 + Math.random() * 4.5,
      scaleY: 0.8 + Math.random() * 0.5,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 3,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      style={{ marginTop: offset, rotate, x: nudgeX, y: nudgeY }}
      className="relative w-40 bg-[#111214] border border-white/10 shadow-2xl p-2.5"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHovered(false)}
      data-cursor="click"
    >
      <div className="w-full aspect-video bg-neutral-800/60 overflow-hidden">
        {videoUrl ? (
          <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-neutral-800/60" />
        )}
      </div>

      <div className="pt-2.5 pb-1 flex justify-center">
        <span className="relative inline-block">
          <span className="relative z-10 text-[11px] italic tracking-wide text-[#9CA3AF]">{clientName}</span>
          <motion.span
            aria-hidden
            className="absolute -inset-x-1 top-1/2 mt-[-0.425em] h-[0.85em] bg-[#E60B18]/40 rounded-[1px]"
            style={{ transformOrigin: 'left center', rotate: mark.skew, x: mark.dx, y: mark.dy }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: hovered ? 1 : 0, scaleY: mark.scaleY }}
            transition={{ duration: 0.32, ease: [0.65, 0, 0.35, 1] }}
          />
        </span>
      </div>
    </motion.div>
  );
};