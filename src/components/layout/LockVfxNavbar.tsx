import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Lock, Unlock, Home, Film, User, Mail, type LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
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
  const isExpandedRef = useRef(true);

  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const lastToggleTime = useRef(0);
  const TOGGLE_COOLDOWN_MS = 140;
  const COLLAPSED_OFFSET = 24;

  const pendingScrollValue = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  const desktopNavRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const [desktopNavHeight, setDesktopNavHeight] = useState(0);
  const [mobileNavWidth, setMobileNavWidth] = useState(0);

  const desktopAsideRef = useRef<HTMLDivElement>(null);
  const mobileNavContainerRef = useRef<HTMLDivElement>(null);
  const [desktopCenterY, setDesktopCenterY] = useState(0);
  const [mobileCenterX, setMobileCenterX] = useState(0);

  // Auto-collapse timer per inattività (3.5s)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 3500);
  }, []);

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [resetIdleTimer]);

  useLayoutEffect(() => {
    if (desktopNavRef.current) setDesktopNavHeight(desktopNavRef.current.scrollHeight);
    if (mobileNavRef.current) setMobileNavWidth(mobileNavRef.current.scrollWidth);

    const measure = () => {
      if (desktopAsideRef.current) {
        const h = desktopAsideRef.current.offsetHeight;
        setDesktopCenterY(Math.max((window.innerHeight - h) / 2, COLLAPSED_OFFSET));
      }
      if (mobileNavContainerRef.current) {
        const w = mobileNavContainerRef.current.offsetWidth;
        setMobileCenterX(Math.max((window.innerWidth - w) / 2, COLLAPSED_OFFSET));
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  const evaluateScroll = () => {
    rafId.current = null;
    if (pendingScrollValue.current === null) return;
    const latest = pendingScrollValue.current;
    pendingScrollValue.current = null;

    const previous = lastScrollY.current;
    const diff = latest - previous;

    if (Math.abs(diff) > 35) {
      const now = performance.now();
      const cooledDown = now - lastToggleTime.current > TOGGLE_COOLDOWN_MS;

      if (diff > 0 && latest > 120 && isExpandedRef.current && cooledDown) {
        setIsExpanded(false);
        lastToggleTime.current = now;
      } else if (diff < 0 && !isExpandedRef.current && cooledDown) {
        setIsExpanded(true);
        lastToggleTime.current = now;
      }
      lastScrollY.current = latest;
    }
  };

  useMotionValueEvent(scrollY, 'change', (latest) => {
    resetIdleTimer();
    pendingScrollValue.current = latest;
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(evaluateScroll);
    }
  });

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const toggleNavbar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExpanded((prev) => !prev);
    resetIdleTimer();
  };

  const positionSpring = {
    type: 'spring',
    stiffness: 260,
    damping: 26,
    mass: 0.7,
  } as const;

  const layoutSpring = positionSpring;

  const contentTransition = {
    duration: 0.32,
    ease: [0.16, 1, 0.3, 1],
  } as const;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className="fixed left-6 top-0 z-50 hidden md:flex flex-col pointer-events-none">
        <motion.aside
          ref={desktopAsideRef}
          initial={false}
          animate={{ y: isExpanded ? desktopCenterY : COLLAPSED_OFFSET }}
          transition={positionSpring}
          style={{ contain: 'layout paint style' }}
          className="pointer-events-auto flex flex-col items-center p-2 rounded-full bg-neutral-950/28 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_12px_40px_rgba(0,0,0,0.5)] transform-gpu will-change-transform isolate"
        >
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

          <motion.div
            initial={false}
            animate={{
              clipPath: isExpanded
                ? 'inset(0% 0% 0% 0% round 999px)'
                : 'inset(0% 0% 100% 0% round 999px)',
              opacity: isExpanded ? 1 : 0,
            }}
            transition={contentTransition}
            style={{
              height: isExpanded ? desktopNavHeight || 'auto' : 0,
              overflow: 'hidden',
              willChange: 'clip-path, opacity',
            }}
            className="origin-top"
          >
            <div ref={desktopNavRef} className="flex flex-col items-center gap-2 pt-1">
              <div className="w-7 h-px bg-white/20 my-1 shrink-0" />

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
                        layoutId={"activePill"}
                        className="absolute inset-0 bg-white/20 border border-white/30 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                        transition={layoutSpring}
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
            </div>
          </motion.div>
        </motion.aside>
      </div>

      {/* MOBILE BOTTOM DOCK */}
      <div className="fixed bottom-6 left-0 z-50 flex md:hidden pointer-events-none">
        <motion.nav
          ref={mobileNavContainerRef}
          initial={false}
          animate={{ x: isExpanded ? mobileCenterX : COLLAPSED_OFFSET }}
          transition={positionSpring}
          style={{ contain: 'layout paint style' }}
          className="pointer-events-auto flex items-center p-2 bg-neutral-950/28 backdrop-blur-xl backdrop-saturate-150 border border-white/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_12px_40px_rgba(0,0,0,0.5)] transform-gpu will-change-transform isolate"
        >
          <button
            onClick={toggleNavbar}
            className="relative p-3.5 rounded-full text-neutral-300 hover:text-white transition-colors duration-200 focus:outline-none flex items-center justify-center shrink-0 cursor-pointer select-none touch-manipulation active:scale-95 min-w-11 min-h-11"
            aria-label={isExpanded ? 'Blocca Navbar' : 'Sblocca Navbar'}
          >
            {isExpanded ? (
              <Unlock className="w-4 h-4 text-white/90" />
            ) : (
              <Lock className="w-4 h-4 text-neutral-300" />
            )}
          </button>

          <motion.div
            initial={false}
            animate={{
              clipPath: isExpanded
                ? 'inset(0% 0% 0% 0% round 999px)'
                : 'inset(0% 100% 0% 0% round 999px)',
              opacity: isExpanded ? 1 : 0,
            }}
            transition={contentTransition}
            style={{
              width: isExpanded ? mobileNavWidth || 'auto' : 0,
              overflow: 'hidden',
              willChange: 'clip-path, opacity',
            }}
            className="origin-left shrink-0"
          >
            <div ref={mobileNavRef} className="flex items-center gap-2 pl-1 flex-nowrap">
              <div className="w-px h-7 bg-white/20 mx-1 shrink-0" />

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    aria-label={item.label}
                    className="relative p-3 rounded-full flex items-center justify-center text-neutral-300 shrink-0 select-none min-w-11 min-h-11"
                  >
                    {isActive && (
                      <motion.div
                        layoutId={"activePillMobile"}
                        className="absolute inset-0 bg-white/20 border border-white/30 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                        transition={layoutSpring}
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
            </div>
          </motion.div>
        </motion.nav>
      </div>
    </>
  );
};