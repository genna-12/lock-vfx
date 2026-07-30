import React, { useState, useRef } from 'react';
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
  const lastScrollY = useRef(0);

  // GESTIONE SCROLL CON SOGLIA OTTIMIZZATA PER MOBILE
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = lastScrollY.current;
    const diff = latest - previous;

    // Richiede uno scroll reale di 25px per cambiare stato (evita interferenze coi tap)
    if (Math.abs(diff) > 25) {
      if (diff > 0 && latest > 100) {
        setIsExpanded(false);
      } else if (diff < 0) {
        setIsExpanded(true);
      }
      lastScrollY.current = latest;
    }
  });

  const toggleNavbar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const springTransition = {
    type: 'spring',
    stiffness: 380,
    damping: 30,
    mass: 0.6,
  } as const;

  return (
    <>
      {/* 💻 DESKTOP SIDEBAR */}
      <div 
        className={`fixed left-6 inset-y-0 z-50 hidden md:flex flex-col pointer-events-none transition-all duration-300 ${
          isExpanded ? 'justify-center' : 'justify-start pt-6'
        }`}
      >
        <motion.aside
          layout="position"
          transition={springTransition}
          className="pointer-events-auto flex flex-col items-center p-2 rounded-full bg-neutral-950/40 backdrop-blur-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_12px_40px_rgba(0,0,0,0.5)] transform-gpu isolate"
        >
          {/* Tasto Lucchetto */}
          <button
            onClick={toggleNavbar}
            className="relative p-3.5 rounded-full text-neutral-300 hover:text-white transition-colors duration-200 focus:outline-none flex items-center justify-center cursor-pointer select-none touch-manipulation active:scale-95"
            aria-label={isExpanded ? 'Blocca Navbar' : 'Sblocca Navbar'}
          >
            {isExpanded ? (
              <Unlock className="w-4 h-4 text-white/90" />
            ) : (
              <Lock className="w-4 h-4 text-neutral-300" />
            )}
          </button>

          <AnimatePresence mode="wait" initial={false}>
            {isExpanded && (
              <motion.nav
                initial={{ opacity: 0, scale: 0.9, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.9, height: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="flex flex-col items-center gap-2 overflow-hidden pt-1"
              >
                <div className="w-7 h-[1px] bg-white/20 my-1" />

                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      aria-label={item.label}
                      className="relative p-3 rounded-full text-neutral-400 hover:text-white transition-colors duration-200 group flex items-center justify-center select-none"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activePill"
                          className="absolute inset-0 bg-white/20 border border-white/30 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                          transition={springTransition}
                        />
                      )}
                      <Icon
                        className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                        }`}
                      />
                      <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-neutral-950/85 border border-white/20 backdrop-blur-xl text-xs font-medium text-white opacity-0 -translate-x-1 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap shadow-2xl">
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.aside>
      </div>

      {/* 📱 MOBILE BOTTOM DOCK */}
      <div 
        className={`fixed bottom-6 inset-x-0 z-50 flex md:hidden pointer-events-none transition-all duration-300 ${
          isExpanded ? 'justify-center' : 'justify-start pl-6'
        }`}
      >
        <motion.nav
          layout="position"
          transition={springTransition}
          className="pointer-events-auto flex items-center p-2 bg-neutral-950/40 backdrop-blur-md border border-white/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_12px_40px_rgba(0,0,0,0.5)] transform-gpu isolate"
        >
          {/* Tasto Lucchetto Mobile con Target Area Estesa */}
          <button
            onClick={toggleNavbar}
            className="relative p-3.5 rounded-full text-neutral-300 hover:text-white transition-colors duration-200 focus:outline-none flex items-center justify-center flex-shrink-0 cursor-pointer select-none touch-manipulation active:scale-95 min-w-[44px] min-h-[44px]"
            aria-label={isExpanded ? 'Blocca Navbar' : 'Sblocca Navbar'}
          >
            {isExpanded ? (
              <Unlock className="w-4 h-4 text-white/90" />
            ) : (
              <Lock className="w-4 h-4 text-neutral-300" />
            )}
          </button>

          <AnimatePresence mode="wait" initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="flex items-center gap-2 overflow-hidden pl-1 flex-nowrap"
              >
                <div className="w-[1px] h-7 bg-white/20 mx-1 flex-shrink-0" />

                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      aria-label={item.label}
                      className="relative p-3 rounded-full flex items-center justify-center text-neutral-300 flex-shrink-0 select-none min-w-[44px] min-h-[44px]"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activePillMobile"
                          className="absolute inset-0 bg-white/20 border border-white/30 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                          transition={springTransition}
                        />
                      )}
                      <Icon
                        className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-neutral-300'
                        }`}
                      />
                    </NavLink>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>
    </>
  );
};