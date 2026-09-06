import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowUpRight } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';

// Componenti SVG inline per evitare dipendenze da versioni specifiche di lucide-react
const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Tipizzazione
type InternalLink = { label: string; to: string };
type ExternalLink = { label: string; href: string };
type NavLinkItem = InternalLink | ExternalLink;

interface NavColumn {
  title: string;
  links: NavLinkItem[];
}

const NAV_COLUMNS: NavColumn[] = [
  {
    title: 'Studio',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Portfolio', to: '/portfolio' },
      { label: 'About', to: '/about' },
    ],
  },
  {
    title: 'Contatti',
    links: [
      { label: 'Scrivici', to: '/contact' },
      { label: 'info@lockvfx.com', href: 'mailto:info@lockvfx.com' },
    ],
  },
];

interface SocialItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SOCIALS: SocialItem[] = [
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: LinkedinIcon },
  { label: 'Email', href: 'mailto:info@lockvfx.com', icon: Mail },
];

export const SiteFooter: React.FC = () => {
  return (
    <footer className="relative w-full bg-[#020202] px-6 md:px-16 py-20 md:py-28">
      {/* CTA principale */}
      <GlassPanel as="section" className="max-w-5xl mx-auto p-10 md:p-14 rounded-4xl mb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#E60B18] mb-3 font-mono">
              Hai un progetto in mente?
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-[#F3F4F6] leading-tight">
              Parliamone su <span className="font-semibold">info@lockvfx.com</span>
            </h2>
          </div>
          <a
            href="mailto:info@lockvfx.com"
            className="group flex items-center gap-2 shrink-0 px-6 py-3 rounded-full bg-white/5 hover:bg-[#E60B18] border border-white/15 hover:border-[#E60B18] text-white transition-all duration-300 active:scale-95"
          >
            Scrivici
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </GlassPanel>

      {/* Colonne di navigazione + social */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
        <div className="col-span-2 md:col-span-1">
          <span className="text-[#F3F4F6] font-semibold tracking-tight text-lg">LockVFX</span>
          <p className="text-[#6B7280] text-sm mt-2 leading-relaxed max-w-55">
            Visual Effects Studio — modellazione 3D e compositing per produzioni cinematografiche.
          </p>
        </div>

        {NAV_COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-xs uppercase tracking-[0.25em] text-[#6B7280] mb-4">{col.title}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  {'to' in link ? (
                    <Link to={link.to} className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#6B7280] mb-4">Seguici</p>
          <div className="flex gap-3">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-white/25 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[#6B7280] text-xs">© {new Date().getFullYear()} LockVFX Studio. Tutti i diritti riservati.</span>
        <span className="text-[#6B7280] text-xs">Obsidian & Crimson</span>
      </div>
    </footer>
  );
};