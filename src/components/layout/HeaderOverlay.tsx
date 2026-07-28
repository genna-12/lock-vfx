import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const HeaderOverlay: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'it' ? 'en' : 'it';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="fixed top-6 right-6 z-40 flex items-center gap-3">
      {/* Badge Disponibilità Studio */}
      <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/3 border border-white/8 backdrop-blur-xl text-[11px] text-zinc-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>VFX Pipeline Available 2026</span>
      </div>

      {/* Selettore Lingua minimale */}
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/4 hover:bg-white/8 border border-white/10 backdrop-blur-xl text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 text-zinc-400" />
        <span className="uppercase">{i18n.language === 'it' ? 'IT' : 'EN'}</span>
      </button>
    </header>
  );
};