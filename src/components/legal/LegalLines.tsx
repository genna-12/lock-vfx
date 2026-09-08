import { useTranslation } from 'react-i18next';
import { PEOPLE } from '../../data/people';
import { openPrivacy } from '../../lib/privacy';

/**
 * Il blocco che la legge chiede, in pezzi.
 *
 * Sta qui e non dentro un footer perché i footer sono due — quello del
 * sito e quello corto della pagina Studio — e la sostanza di queste righe
 * è fissata dal Legale (`handoff-legale.md` §1): due posti che la scrivono
 * a mano sono due posti che possono divergere.
 */

/** La frase sul nome collettivo. */
export function CollectiveLine({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p className={className}>
      {t('footer.legal.collective', { a: PEOPLE[0].name, b: PEOPLE[1].name })}
    </p>
  );
}

/** Le due righe con la partita IVA: mono, l'unico posto dove resta. */
export function VatLines({ className }: { className?: string }) {
  return (
    <ul className={`flex flex-col gap-1.5 font-mono text-[12px] leading-[1.6] text-stone ${className ?? ''}`}>
      {PEOPLE.map((person) => (
        <li key={person.email}>
          {person.name} — P.IVA {person.vat} —{' '}
          <a href={`mailto:${person.email}`} className="transition-colors duration-200 hover:text-ink">
            {person.email}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Privacy e cookie: aprono l'unico dialog della pagina. */
export function PolicyLinks({ className }: { className?: string }) {
  const { t } = useTranslation();
  const link = 'underline underline-offset-[3px] transition-colors duration-200 hover:text-ink';
  return (
    <span className={`flex items-center gap-2 ${className ?? ''}`}>
      <button type="button" onClick={openPrivacy} className={link}>
        {t('footer.legal.privacy')}
      </button>
      <span aria-hidden>·</span>
      <button type="button" onClick={openPrivacy} className={link}>
        {t('footer.legal.cookie')}
      </button>
    </span>
  );
}
