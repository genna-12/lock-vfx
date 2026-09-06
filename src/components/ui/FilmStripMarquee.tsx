import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';

// TODO: sostituire con i veri loghi clienti (logoUrl) quando arrivano da LockVFX
const CLIENTS: { name: string; logoUrl?: string }[] = [
  { name: 'NORTHLIGHT' },
  { name: 'REEL EIGHT' },
  { name: 'ORBITAL' },
  { name: 'CLIENT 04' },
  { name: 'CLIENT 05' },
  { name: 'CLIENT 06' },
  { name: 'CLIENT 07' },
];

interface FilmStripMarqueeProps {
  active: boolean;
}

// Proporzioni riprese direttamente dalla reference: fotogramma pressoché
// quadrato (non un rettangolo largo), bande di perforazioni spesse ai
// bordi, divisori pieni tra un fotogramma e l'altro.
const STRIP_H = 112;
const PERF_BAND = 26; // altezza di ciascuna banda di perforazioni
const FRAME_W = 104;
const DIVIDER_W = 5;

const Perforations: React.FC = () => (
  <div className="flex items-center justify-center gap-[7px]" style={{ height: PERF_BAND }}>
    {Array.from({ length: 3 }).map((_, i) => (
      <span key={i} className="w-2.5 h-2.5 bg-[#020202] flex-shrink-0" />
    ))}
  </div>
);

const Frame: React.FC<{ name: string; logoUrl?: string }> = ({ name, logoUrl }) => (
  <div className="relative flex-shrink-0 h-full" style={{ width: FRAME_W + DIVIDER_W }}>
    <div className="flex flex-col h-full" style={{ width: FRAME_W }}>
      <Perforations />

      {/* Il fotogramma: rettangolo pieno, come nella reference — stessa
          struttura, colori del sito invece del grigio/bianco originale */}
      <div
        className="relative flex-1 overflow-hidden bg-[#2a2b31]"
        style={{ height: STRIP_H - PERF_BAND * 2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.09] via-transparent to-transparent" />
        <div className="relative w-full h-full flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="max-h-6 max-w-[80%] object-contain opacity-90" />
          ) : (
            <ImageIcon className="w-4 h-4 text-white/25" strokeWidth={1.5} aria-label={name} />
          )}
        </div>
      </div>

      <Perforations />
    </div>

    {/* Divisore pieno tra fotogrammi, spesso come nella reference */}
    <div className="absolute inset-y-0 right-0 bg-[#020202]" style={{ width: DIVIDER_W }} />
  </div>
);

/**
 * Pellicola 35mm modellata il più possibile 1:1 sulla reference fornita:
 * fotogramma quasi quadrato (non un rettangolo largo come nel tentativo
 * precedente), bande di perforazioni spesse, divisori pieni. Colori
 * adattati alla palette del sito. Sfuma su entrambi i lati.
 */
export const FilmStripMarquee: React.FC<FilmStripMarqueeProps> = ({ active }) => {
  const items = [...CLIENTS, ...CLIENTS];
  const setW = (FRAME_W + DIVIDER_W) * CLIENTS.length;

  return (
    <div
      className="hidden md:block absolute right-8 md:right-24 top-[74%] w-[68vw] max-w-4xl overflow-hidden bg-[#0e0f13] rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.6)]"
      style={{
        height: STRIP_H,
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)',
        maskImage: 'linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.7s ease',
      }}
    >
      <motion.div
        className="flex h-full"
        animate={active ? { x: [0, -setW] } : { x: 0 }}
        transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
      >
        {items.map((client, i) => (
          <Frame key={i} name={client.name} logoUrl={client.logoUrl} />
        ))}
      </motion.div>
    </div>
  );
};