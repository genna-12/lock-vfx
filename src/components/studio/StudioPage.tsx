import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { applyHead } from '../../lib/head';
import { PEOPLE } from '../../data/people';
import { Wordmark } from '../chrome/Wordmark';
import { LangPill } from '../chrome/LangPill';
import { CollectiveLine, PolicyLinks, VatLines } from '../legal/LegalLines';
import { PrivacyDialog } from '../ui/PrivacyDialog';

/**
 * La pagina Studio: `/studio/`.
 *
 * È la pagina di testo del sito — l'unico posto dove LockVFX si spiega per
 * esteso, e per questo anche l'unica che i motori di ricerca leggeranno
 * davvero. La home è un'esperienza quasi senza parole; questa è il
 * contrario: una colonna di testo, un indice a lato, due minuti di lettura.
 *
 * Nessun movimento. Niente stage, niente carrellata, niente GSAP: la
 * pagina non "entra", si apre. Le uniche transizioni sono i colori dei
 * link e la freccia del pulsante finale.
 */

/*
 * La soglia è 861 px e non quella di Tailwind: sotto, l'indice a lato non
 * ha più larghezza per stare a fianco del testo senza stringerlo — è una
 * misura di questa pagina, non del sistema.
 */

/** Le cinque voci dell'indice, nell'ordine in cui si leggono. */
const SECTIONS = ['chi', 'servizi', 'come', 'persone', 'contatti'] as const;
type SectionId = (typeof SECTIONS)[number];

/** I sei servizi: l'elenco di `decisioni-struttura-sito.md`, da confermare. */
const SERVICES = ['compositing', 'cgi', 'matte', 'cleanup', 'sim', 'finishing'] as const;
/** I quattro passi del metodo. */
const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

/**
 * La freccia dei pulsanti sta dentro il testo tradotto ("Scrivici →"): qui
 * si stacca, così può muoversi all'hover senza toglierla ai traduttori.
 */
function splitArrow(label: string): [string, string | null] {
  const match = /^(.*?)\s*(→)\s*$/.exec(label);
  return match ? [match[1], match[2]] : [label, null];
}

export function StudioPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? 'it';
  const [current, setCurrent] = useState<SectionId>('chi');

  useEffect(() => {
    applyHead({
      title: t('landing.meta.title'),
      description: t('landing.meta.description'),
      path: `${import.meta.env.BASE_URL}studio/`,
      lang,
      imageAlt: t('meta.ogAlt'),
    });
  }, [lang, t]);

  // La voce corrente dell'indice. `IntersectionObserver` e non lo scroll:
  // niente listener a ogni pixel per una cosa che cambia cinque volte.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setCurrent(visible.target.id as SectionId);
      },
      { rootMargin: '-110px 0px -55% 0px' }
    );
    for (const id of SECTIONS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  const [ctaLabel, ctaArrow] = splitArrow(t('landing.contatti.cta'));

  return (
    <div className="page-studio min-h-svh bg-void text-ink">
      {/* Chrome: il marchio riporta alla home, e lo dice anche a parole. */}
      <div className="u-pad sticky top-0 z-10 flex items-center justify-between bg-linear-to-b from-void from-70% to-transparent py-[26px]">
        <Wordmark href={import.meta.env.BASE_URL} />
        <div className="flex items-center gap-7">
          <a
            href={import.meta.env.BASE_URL}
            className="text-[14px] text-stone transition-colors duration-[var(--f5)] hover:text-ink"
          >
            ← {t('landing.back')}
          </a>
          <LangPill />
        </div>
      </div>

      <main className="u-pad mx-auto grid max-w-[1180px] grid-cols-1 gap-x-[clamp(32px,6vw,120px)] pt-10 min-[861px]:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] min-[861px]:pt-[clamp(48px,9vh,120px)]">
        <nav
          aria-label={t('landing.nav.label')}
          className="mb-10 flex flex-wrap items-baseline gap-x-[18px] gap-y-2 self-start min-[861px]:sticky min-[861px]:top-[110px] min-[861px]:mb-0 min-[861px]:flex-col min-[861px]:gap-[14px]"
        >
          <span className="u-cap w-full text-stone min-[861px]:mb-2">Studio</span>
          {SECTIONS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={current === id ? 'true' : undefined}
              className={`text-[15px] transition-colors duration-[var(--f5)] hover:text-ink ${
                current === id ? 'text-ink' : 'text-stone'
              }`}
            >
              {t(`landing.nav.${id}`)}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-[clamp(64px,10vh,120px)]">
          <section id="chi" className="scroll-mt-[110px]">
            <h1 className="u-display m-0 mb-6 max-w-[22ch] text-[clamp(34px,4.2vw,56px)] leading-[1.05] tracking-[-0.02em]">
              {t('landing.chi.h1')}
            </h1>
            <p className="m-0 max-w-[52ch] text-[19px] text-ink">{t('landing.chi.lead')}</p>
            <p className="m-0 mt-[18px] max-w-[58ch] text-[17px] text-stone">
              {t('landing.chi.paragraph')}
            </p>
          </section>

          <section id="servizi" className="scroll-mt-[110px]">
            <h2 className="u-display m-0 mb-5 text-[clamp(24px,2.4vw,32px)] leading-[1.1] tracking-[-0.015em]">
              {t('landing.servizi.h2')}
            </h2>
            <p className="m-0 max-w-[58ch] text-[17px] text-stone">{t('landing.servizi.intro')}</p>
            <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-7 min-[861px]:grid-cols-2">
              {SERVICES.map((key) => (
                <div key={key} className="border-t border-dust/35 pt-4">
                  <h3 className="m-0 mb-1.5 text-[18px] font-medium">
                    {t(`landing.servizi.${key}.title`)}
                  </h3>
                  <p className="m-0 text-[15px] text-stone">{t(`landing.servizi.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="come" className="scroll-mt-[110px]">
            <h2 className="u-display m-0 mb-5 text-[clamp(24px,2.4vw,32px)] leading-[1.1] tracking-[-0.015em]">
              {t('landing.come.h2')}
            </h2>
            <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
              {STEPS.map((key, i) => (
                <li key={key} className="grid grid-cols-[44px_1fr] items-baseline gap-3">
                  <span className="text-[13px] font-medium text-stone">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="m-0 max-w-[58ch] text-[17px] text-stone">
                    <b className="font-medium text-ink">{t(`landing.come.${key}.title`)}.</b>{' '}
                    {t(`landing.come.${key}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section id="persone" className="scroll-mt-[110px]">
            <h2 className="u-display m-0 mb-5 text-[clamp(24px,2.4vw,32px)] leading-[1.1] tracking-[-0.015em]">
              {t('landing.persone.h2')}
            </h2>
            <div className="grid grid-cols-1 gap-x-10 gap-y-7 min-[861px]:grid-cols-2">
              {PEOPLE.map((person) => (
                <div key={person.email}>
                  <h3 className="m-0 mb-1 text-[18px] font-medium">{person.name}</h3>
                  {/* Ruolo, città e le due righe arrivano dai ragazzi: finché
                      non ci sono, il segnaposto resta visibile e dichiarato. */}
                  <p className="m-0 text-[15px] text-stone">{t('landing.persone.placeholder')}</p>
                  <p className="m-0 mt-1 text-[15px]">
                    <a
                      href={`mailto:${person.email}`}
                      className="text-stone transition-colors duration-[var(--f5)] hover:text-ink"
                    >
                      {person.email}
                    </a>
                  </p>
                </div>
              ))}
            </div>
            <p className="m-0 mt-7 max-w-[58ch] text-[14px] text-stone">
              {t('landing.persone.transparency')}
            </p>
          </section>

          <section
            id="contatti"
            className="mt-[clamp(48px,8vh,96px)] scroll-mt-[110px] border-t border-dust/35 pt-[clamp(48px,8vh,96px)] pb-[clamp(64px,10vh,120px)]"
          >
            <h2 className="u-display m-0 mb-5 text-[clamp(34px,4vw,52px)] leading-[1.05] tracking-[-0.02em]">
              {t('landing.contatti.h2')}
            </h2>
            <p className="m-0 mb-7 max-w-[58ch] text-[17px] text-stone">
              {t('landing.contatti.paragraph')}
            </p>
            {/* Il form è uno solo, e sta nella Stanza: di qui ci si va. */}
            <a
              href={`${import.meta.env.BASE_URL}#contact`}
              className="u-cap group inline-flex h-[46px] items-center gap-2.5 bg-ink px-[26px] text-void transition-colors duration-[var(--f5)] hover:bg-white"
            >
              {ctaLabel}
              {ctaArrow ? (
                <span
                  aria-hidden
                  className="transition-transform duration-[var(--f5)] ease-[var(--ease-arrive)] group-hover:translate-x-1"
                >
                  {ctaArrow}
                </span>
              ) : null}
            </a>
          </section>
        </div>
      </main>

      {/* Footer corto: quello lungo è nella home, qui basta quello che la
          legge chiede. */}
      <footer className="u-pad flex flex-wrap items-start justify-between gap-5 border-t border-dust/35 py-8 text-t4 text-stone">
        <div className="flex max-w-[58ch] flex-col gap-3">
          <CollectiveLine className="m-0" />
          <VatLines />
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <PolicyLinks />
          <span>© {new Date().getFullYear()} LockVFX</span>
        </div>
      </footer>

      <PrivacyDialog />
    </div>
  );
}
