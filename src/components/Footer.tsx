import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTACT } from '../data/people';
import { CollectiveLine, PolicyLinks, VatLines } from './legal/LegalLines';

/**
 * Il footer.
 *
 * Struttura e contenuti sono quelli del sito precedente, come chiesto da
 * LockVFX: riquadro con l'invito a scrivere, quattro colonne, riga finale.
 * Quello che è cambiato è la materia: niente vetro, niente tilt, niente
 * pillola traslucida — un pannello fermo con un filo di bordo, e il
 * pulsante è lo stesso del form, perché fanno la stessa cosa.
 *
 * Il footer è anche l'unico posto del sito dove la legge chiede di essere
 * esplicita: le due partite IVA in chiaro e la frase sul nome collettivo
 * (`handoff-legale.md` §1) non sono decorazione e non si abbreviano. I dati
 * vengono da `data/people.ts`: oggi segnaposto, domani i numeri veri, e non
 * si tocca questo file.
 */

/**
 * Variante del titolo dell'invito. `full` = "Parliamone su info@…" com'era;
 * `email` = la sola email grande, per quando la ripetizione con la Stanza
 * (che dice già "Parliamone.") dà fastidio. Da mostrare a LockVFX.
 */
const FOOTER_CTA_VARIANT: 'full' | 'email' = 'full';

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

const SOCIALS: { key: string; href: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { key: 'linkedin', href: 'https://linkedin.com', icon: LinkedinIcon },
  { key: 'email', href: `mailto:${CONTACT.email}`, icon: MailIcon },
];

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const link = 'text-t3 text-stone transition-colors duration-200 hover:text-ink';

  return (
    <footer
      id="site-footer"
      className="u-pad relative w-full bg-void pb-20 md:pb-28"
      style={{ paddingTop: 'max(calc(var(--pad) * 2), 5rem)' }}
    >
      {/* L'invito. Un pannello fermo: il raggio grande è l'unica forma
          arrotondata del sito oltre alle anteprime, ed è voluta — questo
          blocco è un cartello, non una superficie dello spazio. */}
      <section className="mx-auto mb-16 max-w-5xl rounded-[24px] border border-dust/25 p-10 md:p-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="u-cap mb-4 text-crimson">{t('footer.cta.kicker')}</p>
            <h2 className="u-display text-d3 text-ink">
              {FOOTER_CTA_VARIANT === 'full' ? `${t('footer.cta.title')} ` : null}
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-medium transition-colors duration-200 hover:text-crimson"
              >
                {CONTACT.email}
              </a>
            </h2>
          </div>
          <a
            href={`mailto:${CONTACT.email}`}
            className="u-cap group flex h-[46px] shrink-0 items-center gap-2 self-start bg-ink px-6 text-void transition-colors duration-[var(--f5)] hover:bg-crimson hover:text-ink"
          >
            {t('footer.cta.button')}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </section>

      <div className="mx-auto mb-16 grid max-w-5xl grid-cols-2 gap-10 md:grid-cols-4">
        {/* Chi siamo, per davvero: la frase sul nome collettivo e le due
            partite IVA. La sostanza è fissata dal Legale. */}
        <div className="col-span-2 md:col-span-1">
          <span className="text-t1 font-medium text-ink">LockVFX</span>
          <CollectiveLine className="mt-3 max-w-[42ch] text-t4 text-stone" />
          <VatLines className="mt-4" />
        </div>

        <div>
          <p className="u-cap mb-4 text-stone">{t('footer.columns.studio.title')}</p>
          <ul className="flex flex-col gap-2.5">
            <li><a href="#reel" className={link}>{t('nav.reel')}</a></li>
            <li><a href="#studio" className={link}>{t('nav.studio')}</a></li>
            <li><a href="#work" className={link}>{t('nav.work')}</a></li>
          </ul>
        </div>

        <div>
          <p className="u-cap mb-4 text-stone">{t('footer.columns.contact.title')}</p>
          <ul className="flex flex-col gap-2.5">
            <li><a href="#contact" className={link}>{t('footer.columns.contact.write')}</a></li>
            <li><a href={`mailto:${CONTACT.email}`} className={link}>{CONTACT.email}</a></li>
          </ul>
        </div>

        <div>
          <p className="u-cap mb-4 text-stone">{t('footer.columns.social.title')}</p>
          <div className="flex gap-3">
            {SOCIALS.map(({ key, href, icon: Icon }) => (
              <a
                key={key}
                href={href}
                aria-label={t(`footer.social.${key}`)}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-dust/30 text-stone transition-colors duration-200 hover:border-stone hover:text-ink"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Riga finale: il copyright a sinistra e, dove prima c'era la firma
          dell'estetica, le due informative — che è quello che serve. */}
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-dust/20 pt-8 sm:flex-row">
        <span className="text-t4 text-stone">© {year} LockVFX</span>
        <PolicyLinks className="text-t4 text-stone" />
      </div>
    </footer>
  );
}
