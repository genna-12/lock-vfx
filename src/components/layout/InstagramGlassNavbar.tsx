import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
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

export const LockVfxNavbar: React.FC = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  const { scrollY } = useScroll();

  // Gestione performante dello scroll senza re-render superflui
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 100) {
      setIsExpanded(false); // Nascondi/contrai in alto a sinistra quando si scende
    } else if (latest < previous) {
      setIsExpanded(true);  // Riporta al centro quando si sale
    }
  });

  const toggleNavbar = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (Style: Revolut / Instagram Glass) */}
      <motion.aside
        layout
        initial={false}
        animate={{
          top: isExpanded ? '50%' : '1.5rem', // 50% = centro, 1.5rem = top-6 (alto a sinistra)
          y: isExpanded ? '-50%' : '0%',      // Compensa il centro o si allinea all'alto
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed left-6 z-50 hidden md:flex flex-col items-center p-2 rounded-full bg-neutral-950/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]"
      >
        {/* Pulsante Lucchetto (Toggle) */}
        <button
          onClick={toggleNavbar}
          className="relative p-3 rounded-full text-neutral-400 hover:text-white transition-colors duration-200 focus:outline-none group flex items-center justify-center"
          aria-label={isExpanded ? 'Blocca Navbar' : 'Sblocca Navbar'}
        >
          {isExpanded ? (
            <Unlock className="w-4 h-4 text-white/80 transition-transform duration-200 group-hover:scale-110" />
          ) : (
            <Lock className="w-4 h-4 text-neutral-400 transition-transform duration-200 group-hover:text-white" />
          )}
        </button>

        {/* Lista Voci di Navigazione */}
        <AnimatePresence>
          {isExpanded && (
            <motion.nav
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-2 overflow-hidden"
            >
              <div className="w-8 h-px bg-white/10 my-1" />

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    aria-label={item.label}
                    className="relative p-3 rounded-full text-neutral-400 hover:text-white transition-colors duration-200 group flex items-center justify-center"
                  >
                    {/* Indicatore Attivo Stile Revolut */}
                    {isActive && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 bg-white/15 border border-white/20 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Icona Navigazione */}
                    <Icon
                      className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                      }`}
                    />

                    {/* Tooltip Minimale al Hover */}
                    <span className="absolute left-16 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-white/10 backdrop-blur-md text-xs font-medium text-neutral-200 opacity-0 -translate-x-1 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-xl">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* MOBILE BOTTOM DOCK (Invariata: si nasconde verso il basso quando si scorre giù) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden flex items-center gap-3 px-4 py-2 bg-neutral-950/70 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  className="relative p-3 rounded-full flex items-center justify-center text-neutral-400"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePillMobile"
                      className="absolute inset-0 bg-white/15 border border-white/20 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-neutral-400'
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