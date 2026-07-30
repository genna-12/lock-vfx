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

  // GESTIONE SCROLL FLUIDA E SENZA BLOCCHI
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = lastScrollY.current;
    const diff = latest - previous;

    // Triggera il cambio stato solo con scostamento significativo (>15px)
    if (Math.abs(diff) > 15) {
      if (diff > 0 && latest > 80) {
        setIsExpanded(false); // Scroll verso il basso
      } else if (diff < 0) {
        setIsExpanded(true);  // Scroll verso l'alto
      }
      lastScrollY.current = latest;
    }
  });

  const toggleNavbar = () => {
    setIsExpanded((prev) => !prev);
  };

  // Fix TypeScript: "as const" forza TS a riconoscere type come 'spring' letterale
  const transitionConfig = {
    type: 'spring',
    stiffness: 300,
    damping: 28,
    mass: 0.8,
  } as const;

  return (
    <>
      {/* 💻 DESKTOP SIDEBAR */}
      <div 
        className={`fixed left-6 inset-y-0 z-50 hidden md:flex flex-col pointer-events-none ${
          isExpanded ? 'justify-center' : 'justify-start pt-6'
        }`}
      >
        <motion.aside
          layout
          transition={transitionConfig}
          className="pointer-events-auto flex flex-col items-center p-2 rounded-full bg-neutral-950/70 backdrop-blur-xl border border-white/10 shadow-2xl transform-gpu will-change-transform"
        >
          <button
            onClick={toggleNavbar}
            className="relative p-3 rounded-full text-neutral-400 hover:text-white transition-colors duration-200 focus:outline-none flex items-center justify-center cursor-pointer"
            aria-label={isExpanded ? 'Blocca Navbar' : 'Sblocca Navbar'}
          >
            {isExpanded ? (
              <Unlock className="w-4 h-4 text-white/80" />
            ) : (
              <Lock className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.nav
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="flex flex-col items-center gap-2 pt-2"
              >
                <div className="w-8 h-[1px] bg-white/10 my-1" />

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
                      {isActive && (
                        <motion.div
                          layoutId="activePill"
                          className="absolute inset-0 bg-white/15 border border-white/20 rounded-full"
                          transition={transitionConfig}
                        />
                      )}
                      <Icon
                        className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                        }`}
                      />
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
      </div>

      {/* 📱 MOBILE BOTTOM DOCK */}
      <div 
        className={`fixed bottom-6 inset-x-0 z-50 flex md:hidden pointer-events-none ${
          isExpanded ? 'justify-center' : 'justify-start pl-6'
        }`}
      >
        <motion.nav
          layout
          transition={transitionConfig}
          className="pointer-events-auto flex items-center p-2 bg-neutral-950/70 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transform-gpu will-change-transform"
        >
          <button
            onClick={toggleNavbar}
            className="relative p-3 rounded-full text-neutral-400 hover:text-white transition-colors duration-200 focus:outline-none flex items-center justify-center flex-shrink-0 cursor-pointer"
            aria-label={isExpanded ? 'Blocca Navbar' : 'Sblocca Navbar'}
          >
            {isExpanded ? (
              <Unlock className="w-4 h-4 text-white/80" />
            ) : (
              <Lock className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="flex items-center gap-2 pl-2"
              >
                <div className="w-[1px] h-8 bg-white/10 mx-1 flex-shrink-0" />

                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      aria-label={item.label}
                      className="relative p-3 rounded-full flex items-center justify-center text-neutral-400 flex-shrink-0"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activePillMobile"
                          className="absolute inset-0 bg-white/15 border border-white/20 rounded-full"
                          transition={transitionConfig}
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>
    </>
  );
};