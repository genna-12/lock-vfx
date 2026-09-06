import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { availableLanguages } from '../../config/i18n';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chiude il menu se si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="fixed top-6 right-6 z-50 isolate">
      <motion.div
        className="flex flex-col items-end"
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
      >
        {/* Pulsante Principale - Liquid Glass */}
        <button
          onClick={toggleOpen}
          className="flex items-center justify-center h-10 px-4 rounded-full bg-neutral-950/28 backdrop-blur-xl backdrop-saturate-150 border border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] text-neutral-300 hover:text-white transition-colors duration-300 transform-gpu cursor-pointer"
        >
          <span className="text-xs font-mono uppercase tracking-[0.2em]">{i18n.language.slice(0, 2)}</span>
          <span className="sr-only">Cambia lingua</span>
        </button>

        {/* Menu a pilloline */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 8, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="flex flex-col gap-2 p-2 rounded-3xl bg-neutral-950/40 backdrop-blur-xl backdrop-saturate-150 border border-white/8 transform-gpu"
            >
              {availableLanguages.map((lng) => {
                const isActive = i18n.language.startsWith(lng);
                return (
                  <button
                    key={lng}
                    onClick={() => changeLanguage(lng)}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 uppercase ${
                      isActive ? 'text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeLang"
                        className="absolute inset-0 bg-white/10 border border-white/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                      />
                    )}
                    <span className="relative z-10">{lng}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};