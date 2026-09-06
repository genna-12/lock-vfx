import React from 'react';
import { motion, type Variants } from 'framer-motion';

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      // y/opacity possono usare la molla (l'overshoot lì è innocuo, anzi
      // dà carattere). Il filter NO: una spring che supera l'obiettivo
      // produce `blur(-0.18px)` — CSS non valido, il browser scarta
      // l'animazione e lo logga ad ogni frame (era il bug in console).
      // Per questa proprietà specifica serve un tween che non sfora mai.
      default: { type: 'spring', stiffness: 170, damping: 20 },
      filter: { type: 'tween', duration: 0.45, ease: 'easeOut' },
    },
  },
};

/**
 * Wrapper per un blocco di testo che entra "vivo" (blur + molla, a cascata
 * sui figli) quando `active` diventa true.
 */
export const StageReveal: React.FC<{ active: boolean; children: React.ReactNode; className?: string }> = ({
  active,
  children,
  className = '',
}) => (
  <motion.div initial="hidden" animate={active ? 'visible' : 'hidden'} variants={container} className={className}>
    {children}
  </motion.div>
);

export const RevealItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div variants={item} className={className}>
    {children}
  </motion.div>
);