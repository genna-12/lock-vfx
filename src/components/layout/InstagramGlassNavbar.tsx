import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Home, Film, User, Mail } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Gestione Scroll: Giù -> Contrai in alto a sinistra, Su -> Espandi al centro
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsExpanded(false);
      } else if (currentScrollY < lastScrollY) {
        setIsExpanded(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleNavbar = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <>
      {/* DESKTOP MORPHING GLASS DOCK */}
      <motion.aside
        layout
        initial={false}
        animate={{
          top: isExpanded ? '50%' : '1.5rem', // Center (50%) vs Top-6 (1.5rem)
          y: isExpanded ? '-50%' : '0%',
          left: '1.5rem', // Left-6
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed z-50 hidden md:flex flex-col items-center bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.06] backdrop-blur-3xl border border-white/[0.14] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_20px_60px_rgba(0,0,0,0.7)] transform-gpu p-3"
      >
        {/* Tasto Lucchetto (Toggle Espansione / Contrazione) */}
        <motion.button
          layout
          onClick={toggleNavbar}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          className={`p-3 rounded-full bg-white/[0.05] border border-white/[0.12] text-zinc-400 hover:text-[#D3121B] hover:border-[#D3121B]/40 hover:shadow-[0_0_20px_rgba(211,18,27,0.3)] transition-colors duration-300 cursor-pointer group flex items-center justify-center ${
            isExpanded ? 'mb-6' : 'mb-0'
          }`}
          title={isExpanded ? 'Chiudi Navbar' : 'Apri Navbar'}
        >
          {isExpanded ? (
            <Unlock className="w-4 h-4 text-[#D3121B] transition-transform duration-300 group-hover:scale-110" />
          ) : (
            <Lock className="w-4 h-4 text-zinc-400 transition-transform duration-300 group-hover:text-white" />
          )}
        </motion.button>

        {/* Voci di Navigazione (Visibili solo se isExpanded è true) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.nav
              initial={{ opacity: 0, height: 0, scale: 0.8 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.8 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-4 overflow-hidden"
            >
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

                    {/* Tooltip Glass al Passaggio del Mouse */}
                    <span className="absolute left-16 px-3.5 py-1.5 rounded-xl bg-[#08090C]/85 border border-white/[0.15] backdrop-blur-2xl text-xs font-medium text-white opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-2xl">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* MOBILE FLOATING DOCK (Barra inferiore per smartphone) */}
      <AnimatePresence>
        {isExpanded && (
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