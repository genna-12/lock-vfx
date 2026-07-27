import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
import { GlassButton } from '../glass/GlassButton';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'it' ? 'en' : 'it';
    i18n.changeLanguage(nextLang);
  };

  const navLinks = [
    { name: t('nav.home'), href: '#home' },
    { name: t('nav.portfolio'), href: '#portfolio' },
    { name: t('nav.about'), href: '#about' },
    { name: t('nav.contact'), href: '#contact' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 p-4 md:p-6 transition-all duration-300">
      <nav
        className={`max-w-6xl mx-auto rounded-full transition-all duration-500 transform-gpu px-6 py-3 flex items-center justify-between ${
          isScrolled
            ? 'bg-[#07080a]/75 backdrop-blur-2xl border border-white/12 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-white/3 backdrop-blur-md border border-white/8'
        }`}
      >
        {/* Brand Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#E60B18]/20 border border-[#E60B18]/40 flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-[#E60B18] font-bold text-lg leading-none">L</span>
          </div>
          <span className="text-white font-semibold tracking-wider text-base">
            LOCK <span className="text-[#E60B18]">VFX</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Action Controls & i18n */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs tracking-wider uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{i18n.language === 'it' ? 'IT' : 'EN'}</span>
          </button>

          <GlassButton variant="primary" size="sm">
            {t('nav.getInTouch')}
          </GlassButton>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-zinc-300 hover:text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Glass Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-3 max-w-6xl mx-auto rounded-3xl bg-[#07080a]/90 backdrop-blur-2xl border border-white/15 p-6 shadow-2xl flex flex-col gap-5"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 hover:text-[#E60B18] text-lg font-medium transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-zinc-300 text-sm bg-white/8 px-4 py-2 rounded-full border border-white/10"
              >
                <Globe className="w-4 h-4" />
                <span>Lingua: {i18n.language.toUpperCase()}</span>
              </button>
              <GlassButton variant="primary" size="sm" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.getInTouch')}
              </GlassButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};