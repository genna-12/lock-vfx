import { useEffect, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SETS, type SetId } from '../../brand/tokens';
import { holdScroll } from '../../lib/camera';

/**
 * Navigazione = quattro perforazioni di pellicola, una per HOLD.
 *
 * La forma non è decorativa: è la stessa perforazione che sta sul bordo del
 * marchio. Il foro attivo è pieno `crimson` (l'unico rosso persistente del
 * sito); l'etichetta compare a sinistra su hover o quando il foro è attivo.
 *
 * Sono àncore vere: senza JS la nav resta una lista di link funzionante.
 * Lo step 2 sostituisce il salto nativo con `smoother.scrollTo()` e collega
 * `active` alla progress della carrellata.
 *
 * Sul footer la nav svanisce: indica dove si è NELLO SPAZIO, e il footer è
 * fuori dallo spazio. Marchio e lingua invece restano sempre.
 */
type PerfNavProps = {
  /** HOLD attualmente inquadrato. Allo step 2 arriva dalla progress. */
  active?: SetId;
};

export function PerfNav({ active = 'reel' }: PerfNavProps) {
  const { t } = useTranslation();
  const [onFooter, setOnFooter] = useState(false);

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setOnFooter(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  // Con la carrellata attiva il salto nativo non serve a niente: i quattro
  // set sono impilati nello stesso punto della pagina, e cio' che li separa
  // e' la posizione di scroll dentro il pin. Se lo smoother non c'e'
  // (reduced motion, JS a terra) non si intercetta il click: l'ancora resta
  // un'ancora e funziona da sola.
  function goToHold(event: MouseEvent<HTMLAnchorElement>, id: SetId) {
    const stage = ScrollTrigger.getById('stage');
    const smoother = ScrollSmoother.get();
    if (!stage || !smoother) return;
    event.preventDefault();
    smoother.scrollTo(holdScroll(stage, id), true);
  }

  return (
    <nav
      aria-label={t('nav.label')}
      aria-hidden={onFooter || undefined}
      inert={onFooter || undefined}
      style={{ transitionDuration: 'var(--f5)' }}
      className={`fixed right-[var(--pad)] bottom-[var(--pad)] z-30 transition-opacity md:bottom-auto md:top-1/2 md:-translate-y-1/2 ${
        onFooter ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
      }`}
    >
      {/* Su mobile i 44px di target si toccano: lo spazio ce lo mette già il target. */}
      <ul className="flex flex-col gap-0 md:gap-4">
        {SETS.map((id) => {
          const isActive = id === active;
          return (
            <li key={id} className="flex justify-end">
              <a
                href={`#${id}`}
                onClick={(event) => goToHold(event, id)}
                aria-current={isActive ? 'true' : undefined}
                className="group flex min-h-11 min-w-11 items-center justify-end gap-3 md:min-h-0 md:min-w-0"
              >
                <span
                  className={`u-cap hidden whitespace-nowrap transition-opacity duration-200 md:block ${
                    isActive ? 'text-stone opacity-100' : 'text-dust opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {t(`nav.${id}`)}
                </span>
                <span
                  aria-hidden
                  className={`block h-[13px] w-[9px] rounded-[2px] border transition-colors duration-200 ${
                    isActive
                      ? 'border-crimson bg-crimson'
                      : 'border-dust bg-transparent group-hover:border-stone'
                  }`}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
