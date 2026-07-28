import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FolderKanban, User, Mail, ChevronRight } from 'lucide-react';

import logoImg from '../../assets/logo.png';

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

export const VerticalNavbar: React.FC = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Gestione comparsa/scomparsa allo scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Scrollo verso il basso -> Scompare
      } else {
        setIsVisible(true); // Scrollo verso l'alto -> Riappare
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Bottoncino tondo fisso per riaprire la Navbar se nascosta */}
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsVisible(true)}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-[#08090C]/80 border border-white/12 backdrop-blur-xl text-white flex items-center justify-center hover:border-[#D3121B]/50 transition-all shadow-2xl cursor-pointer"
            aria-label="Mostra Navigazione"
          >
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar Verticale Desktop */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: isVisible ? 0 : -120, opacity: isVisible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center py-6 px-3 bg-[#08090C]/65 backdrop-blur-2xl border border-white/8 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:scale-[1.02] transition-transform duration-300"
      >
        {/* Brand Logo integrato */}
        <NavLink to="/" className="mb-8 p-1.5 group relative flex items-center justify-center">
          <img
            src={logoImg}
            alt="Lock VFX Logo"
            className="w-8 h-8 object-contain filter drop-shadow-[0_0_8px_rgba(211,18,27,0.3)] group-hover:scale-110 transition-transform duration-300"
          />
        </NavLink>

        {/* Lista Voci Navigazione */}
        <nav className="flex flex-col items-center gap-4 relative">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative p-3.5 rounded-full text-zinc-400 hover:text-white transition-colors group flex items-center justify-center"
              >
                {/* Lente Fluida Revolut/Instagram style */}
                {isActive && (
                  <motion.div
                    layoutId="activeLens"
                    className="absolute inset-0 bg-white/8 border border-white/18 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icona */}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-[#D3121B]' : 'text-zinc-400 group-hover:text-white'}`} />

                {/* Tooltip / Scritta al passaggio del mouse */}
                <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#08090C]/90 border border-white/12 text-xs font-medium text-white backdrop-blur-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
};