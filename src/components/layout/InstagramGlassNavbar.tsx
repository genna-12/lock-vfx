import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Film, User, Mail } from 'lucide-react';
import logoImg from '../../assets/logo.png';

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

  return (
    <>
      {/* SIDEBAR DESKTOP VERTICALE (Stile Instagram Dock) */}
      <aside className="fixed left-5 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center py-6 px-3 bg-[#08090C]/40 backdrop-blur-2xl border border-white/[0.08] rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] transform-gpu">
        {/* Logo Studio in alto */}
        <NavLink
          to="/"
          className="mb-8 p-1.5 group flex items-center justify-center relative"
          aria-label="Home Lock VFX"
        >
          <img
            src={logoImg}
            alt="Lock VFX"
            className="w-7 h-7 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(211,18,27,0.3)]"
          />
        </NavLink>

        {/* Lista Icone Navigazione (Senza scritte) */}
        <nav className="flex flex-col items-center gap-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label={item.label}
                title={item.label}
                className="relative p-3.5 rounded-full text-zinc-400 hover:text-white transition-colors group flex items-center justify-center cursor-pointer"
              >
                {/* Lente Fluida Glassmorphic per l'icona Attiva */}
                {isActive && (
                  <motion.div
                    layoutId="instaGlassLens"
                    className="absolute inset-0 bg-white/[0.08] border border-white/[0.18] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icona */}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-all duration-200 group-hover:scale-110 ${
                    isActive ? 'text-[#D3121B]' : 'text-zinc-400 group-hover:text-white'
                  }`}
                />
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* BARRA MOBILE IN BASSO (Floating Dock Glassmorphic) */}
      <nav className="fixed bottom-5 inset-x-5 z-50 md:hidden flex items-center justify-around py-3 px-4 bg-[#08090C]/60 backdrop-blur-2xl border border-white/[0.1] rounded-full shadow-2xl">
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
                  layoutId="instaGlassLensMobile"
                  className="absolute inset-0 bg-white/[0.1] border border-white/[0.2] rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
      </nav>
    </>
  );
};