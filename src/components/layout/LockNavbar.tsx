import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Home, FolderKanban, User, Mail } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/portfolio', label: 'Portfolio', icon: FolderKanban },
  { path: '/about', label: 'About', icon: User },
  { path: '/contact', label: 'Contatti', icon: Mail },
];

export const LockNavbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-close dopo timeout iniziale
  const startAutoCloseTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 3500);
  };

  useEffect(() => {
    startAutoCloseTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Gestione dello scroll (Giù -> Chiudi, Su -> Apri)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsOpen(false);
      } else if (currentScrollY < lastScrollY) {
        setIsOpen(true);
        startAutoCloseTimer();
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Stato visibile effettivo: Aperto per scroll O aperto per Hover col mouse
  const isMenuExpanded = isOpen || isHovered;

  return (
    <div
      className="fixed top-6 left-6 z-50 flex flex-col items-start gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bottoncino Tondo con Lucchetto */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full border backdrop-blur-2xl flex items-center justify-center transition-all duration-300 cursor-pointer shadow-2xl group ${
          isMenuExpanded
            ? 'bg-[#08090C]/90 border-[#D3121B]/50 shadow-[0_0_20px_rgba(211,18,27,0.25)]'
            : 'bg-[#08090C]/60 border-white/12 hover:border-white/25'
        }`}
        aria-label="Toggle Menu"
      >
        {isMenuExpanded ? (
          <Unlock className="w-5 h-5 text-[#D3121B] transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <Lock className="w-5 h-5 text-zinc-400 transition-transform duration-300 group-hover:text-white" />
        )}
      </button>

      {/* Dropdown Menu Glassmorphic con Lente Dinamica */}
      <AnimatePresence>
        {isMenuExpanded && (
          <motion.nav
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex flex-col gap-1 p-2 bg-[#08090C]/80 backdrop-blur-2xl border border-white/8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-3 group"
                >
                  {/* Lente Fluida Revolut/Instagram style */}
                  {isActive && (
                    <motion.div
                      layoutId="activeLens"
                      className="absolute inset-0 bg-white/8 border border-white/18 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={`w-4 h-4 relative z-10 transition-colors ${
                      isActive ? 'text-[#D3121B]' : 'text-zinc-400 group-hover:text-white'
                    }`}
                  />
                  <span className={`relative z-10 tracking-wide ${isActive ? 'text-white font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};