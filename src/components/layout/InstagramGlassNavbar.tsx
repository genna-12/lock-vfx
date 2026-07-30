import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Home, Film, User, Mail } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/portfolio', label: 'Portfolio', icon: Film },
  { path: '/about', label: 'About', icon: User },
  { path: '/contact', label: 'Contatti', icon: Mail },
];

export const InstagramGlassNavbar: React.FC = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Gestione visibilità allo scroll (Giù -> Nascondi, Su -> Mostra)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* DESKTOP FLOATING SATIN GLASS DOCK (Sinistra) */}
      <motion.aside
        initial={{ x: 0, opacity: 1 }}
        animate={{
          x: isVisible ? 0 : -110,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center py-6 px-3 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.06] backdrop-blur-3xl border border-white/[0.14] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_20px_60px_rgba(0,0,0,0.7)] transform-gpu"
      >
        {/* Lucchetto Stilizzato in alto con Micro-Interazione */}
        <motion.div
          whileHover={{ scale: 1.15, rotate: -8 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 p-3 rounded-full bg-white/[0.05] border border-white/[0.12] text-zinc-400 hover:text-[#D3121B] hover:border-[#D3121B]/40 hover:shadow-[0_0_20px_rgba(211,18,27,0.3)] transition-all duration-300 cursor-pointer group"
          title="Lock VFX Studio"
        >
          <Lock className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
        </motion.div>

        {/* Lista Icone Navigazione */}
        <nav className="flex flex-col items-center gap-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label={item.label}
                className="relative p-3.5 rounded-full text-zinc-400 hover:text-white transition-colors group flex items-center justify-center cursor-pointer"
              >
                {/* Lente Fluida Glassmorphic */}
                {isActive && (
                  <motion.div
                    layoutId="satinGlassLens"
                    className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/5 border border-white/30 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(211,18,27,0.25)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}

                {/* Icona Navigazione */}
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="relative z-10"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-[#D3121B]' : 'text-zinc-400 group-hover:text-white'
                    }`}
                  />
                </motion.div>

                {/* Glass Tooltip al Mouse (Scomparsa/Comparsa Fluida) */}
                <span className="absolute left-16 px-3.5 py-1.5 rounded-xl bg-[#08090C]/85 border border-white/[0.15] backdrop-blur-2xl text-xs font-medium text-white opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-2xl">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </motion.aside>

      {/* MOBILE FLOATING DOCK (In basso per schermi piccoli) */}
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-6 inset-x-6 z-50 md:hidden flex items-center justify-around py-3 px-4 bg-[#08090C]/70 backdrop-blur-3xl border border-white/[0.15] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_30px_rgba(0,0,0,0.8)]"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  className="relative p-3 rounded-full flex items-center justify-center"
                >
                  {isActive && (
                    <motion.div
                      layoutId="satinGlassLensMobile"
                      className="absolute inset-0 bg-white/10 border border-white/20 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 relative z-10 ${
                      isActive ? 'text-[#D3121B]' : 'text-zinc-400'
                    }`}
                  />
                </NavLink>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};