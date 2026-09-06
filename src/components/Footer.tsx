import type { ComponentType } from 'react';

/**
 * Footer — provvisorio.
 *
 * Contenuti e struttura sono quelli di prima; qui è stato fatto solo il
 * lavoro necessario per non trascinarsi dietro le dipendenze rimosse
 * (react-router-dom, lucide-react, GlassPanel) e per parlare la lingua dei
 * token nuovi invece degli hex.
 *
 * Lo step 7 lo ridisegna: servono le due P.IVA, le due email individuali,
 * la riga sul nome collettivo, la privacy e l'i18n completo.
 */

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const ArrowUpRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    <path d="M7 17 17 7M7 7h10v10" />
  </svg>
);

type LinkItem = { label: string; href: string };
const NAV_COLUMNS: { title: string; links: LinkItem[] }[] = [
  { title: 'Studio', links: [{ label: 'Reel', href: '#reel' }, { label: 'Studio', href: '#studio' }, { label: 'Lavori', href: '#work' }] },
  { title: 'Contatti', links: [{ label: 'Scrivici', href: '#contact' }, { label: 'info@lockvfx.com', href: 'mailto:info@lockvfx.com' }] },
];

const SOCIALS: { label: string; href: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: LinkedinIcon },
  { label: 'Email', href: 'mailto:info@lockvfx.com', icon: MailIcon },
];

export function Footer() {
  return (
    <footer
      id="site-footer"
      className="u-pad relative w-full bg-void pb-20 md:pb-28"
      style={{ paddingTop: 'max(calc(var(--pad) * 2), 5rem)' }}
    >
      <section className="mx-auto mb-16 max-w-5xl rounded-frame border border-dust/25 p-10 md:p-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="u-cap mb-4 text-crimson">Hai un progetto in mente?</p>
            <h2 className="u-display text-d3 text-ink">
              Parliamone su <span className="text-crimson">info@lockvfx.com</span>
            </h2>
          </div>
          <a
            href="mailto:info@lockvfx.com"
            className="group flex shrink-0 items-center gap-2 self-start rounded-frame border border-dust/40 px-6 py-3 text-t3 text-ink transition-colors duration-200 hover:border-crimson hover:text-crimson"
          >
            Scrivici
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </section>

      <div className="mx-auto mb-16 grid max-w-5xl grid-cols-2 gap-10 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <span className="text-t1 font-medium text-ink">LockVFX</span>
          <p className="mt-2 max-w-55 text-t3 text-stone">
            Effetti visivi per il cinema e la pubblicità.
          </p>
        </div>

        {NAV_COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="u-cap mb-4 text-dust">{col.title}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-t3 text-stone transition-colors duration-200 hover:text-ink">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="u-cap mb-4 text-dust">Seguici</p>
          <div className="flex gap-3">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex h-10 w-10 items-center justify-center rounded-frame border border-dust/30 text-stone transition-colors duration-200 hover:border-stone hover:text-ink"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-dust/20 pt-8 sm:flex-row">
        <span className="font-mono text-t4 text-dust">
          © {new Date().getFullYear()} LockVFX — tutti i diritti riservati.
        </span>
      </div>
    </footer>
  );
}
