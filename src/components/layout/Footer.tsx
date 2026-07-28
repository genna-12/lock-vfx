import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { i18n } = useTranslation();
  const isIt = i18n.language === 'it';

  return (
    <footer className="w-full border-t border-white/8 bg-[#08090C]/90 backdrop-blur-2xl py-12 px-6 mt-20 relative z-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        {/* Brand & Dual P.IVA */}
        <div>
          <div className="text-lg font-bold tracking-wider text-white">
            LOCK <span className="text-[#D3121B]">VFX</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Visual Effects Studio • High-End Production</p>
          
          {/* Spazio per le 2 Partite IVA dei soci */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-4 text-[11px] font-mono text-zinc-500">
            <span>P.IVA Socio 1: <strong className="text-zinc-400">IT00000000000</strong></span>
            <span>P.IVA Socio 2: <strong className="text-zinc-400">IT00000000000</strong></span>
          </div>
        </div>

        {/* Links Social */}
        <div className="flex items-center gap-6 text-xs text-zinc-400">
          <a href="https://vimeo.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Vimeo</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="https://artstation.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">ArtStation</a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-zinc-600">
          © {new Date().getFullYear()} Lock VFX. {isIt ? 'Tutti i diritti riservati.' : 'All rights reserved.'}
        </div>
      </div>
    </footer>
  );
};