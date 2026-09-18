import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { availableLanguages } from '../../config/i18n';
import { useCoarsePointer, useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Il cambio lingua, in alto a destra (`rifinitura-spec.md` §9.3).
 *
 * Una pillola con la lingua corrente e una tendina con i nomi per esteso.
 * Le due sigle affiancate di prima chiedevano di leggere due parole per
 * capire che erano un comando; qui ce n'è una sola, dentro un oggetto che ha
 * un bordo e quindi si annuncia da solo.
 *
 * È **l'unico vetro del chrome**, e ha una ragione: la tendina si apre sopra
 * il video della prima schermata, e un pannello opaco lassù sarebbe un buco
 * nero nell'inquadratura. Il blur tiene il fotogramma vivo sotto il pannello
 * senza far perdere una riga di testo. Da nessun'altra parte il vetro serve,
 * e infatti da nessun'altra parte c'è.
 *
 * I nomi delle lingue vengono da `Intl.DisplayNames`, ciascuno **nella
 * propria lingua**: chi cerca l'inglese cerca "English", non "Inglese". La
 * lista è quella di i18n, quindi una terza lingua compare da sola.
 */

/** Misure di §9.3. La voce cresce a 44 px dove si tocca invece di puntare. */
const VOCE = 40;
const VOCE_TOUCH = 44;

const NOMI: Record<string, string> = { it: 'Italiano', en: 'English' };

/** Il nome della lingua, nella sua lingua. Maiuscola come la scrive lei. */
function nomeLingua(lng: string): string {
  if (NOMI[lng]) return NOMI[lng];
  try {
    const n = new Intl.DisplayNames([lng], { type: 'language' }).of(lng);
    return n ? n.charAt(0).toLocaleUpperCase(lng) + n.slice(1) : lng.toUpperCase();
  } catch {
    return lng.toUpperCase();
  }
}

export function LangPill() {
  const { t, i18n } = useTranslation();
  const lingue = availableLanguages.length ? availableLanguages : ['it'];
  const current = i18n.resolvedLanguage ?? lingue[0];
  const reduce = useReducedMotion();
  const coarse = useCoarsePointer();

  // Due stati e non uno: `montata` tiene la tendina nell'albero per i 120 ms
  // della chiusura, `aperta` fa correre le transizioni. Senza il primo la
  // tendina sparirebbe di colpo, che è l'unica delle due animazioni che si
  // noterebbe se mancasse.
  const [montata, setMontata] = useState(false);
  const [aperta, setAperta] = useState(false);
  const [attivo, setAttivo] = useState(() => Math.max(0, lingue.indexOf(current)));

  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const chiusura = useRef(0);

  const apri = () => {
    window.clearTimeout(chiusura.current);
    setAttivo(Math.max(0, lingue.indexOf(current)));
    setMontata(true);
  };

  const chiudi = (tornaAllaPillola = false) => {
    setAperta(false);
    if (tornaAllaPillola) pillRef.current?.focus();
    chiusura.current = window.setTimeout(() => setMontata(false), reduce ? 0 : 120);
  };

  // Montata → un fotogramma → aperta: la transizione parte solo se il
  // browser ha dipinto almeno una volta lo stato di partenza.
  useEffect(() => {
    if (!montata) return;
    const f = requestAnimationFrame(() => {
      setAperta(true);
      listRef.current?.focus();
    });
    return () => cancelAnimationFrame(f);
  }, [montata]);

  // Fuori e Esc. `pointerdown` e non `click`: chi apre un'altra cosa si
  // aspetta che questa sia già chiusa quando ci arriva sopra.
  useEffect(() => {
    if (!montata) return;
    const fuori = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) chiudi();
    };
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') chiudi(true);
    };
    document.addEventListener('pointerdown', fuori);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fuori);
      document.removeEventListener('keydown', esc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montata]);

  useEffect(() => () => window.clearTimeout(chiusura.current), []);

  const scegli = (lng: string) => {
    void i18n.changeLanguage(lng);
    chiudi(true);
  };

  const suPillola = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      apri();
    }
  };

  const suLista = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setAttivo((i) => (i + (e.key === 'ArrowDown' ? 1 : lingue.length - 1)) % lingue.length);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setAttivo(e.key === 'Home' ? 0 : lingue.length - 1);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scegli(lingue[attivo]);
      return;
    }
    if (e.key === 'Tab') chiudi();
  };

  const altezzaVoce = coarse ? VOCE_TOUCH : VOCE;

  return (
    <div ref={rootRef} className="pointer-events-auto relative">
      <button
        ref={pillRef}
        type="button"
        aria-label={t('a11y.lang')}
        aria-haspopup="listbox"
        aria-expanded={montata}
        aria-controls={montata ? `${id}-lista` : undefined}
        onClick={() => (montata ? chiudi() : apri())}
        onKeyDown={suPillola}
        /* Il bersaglio arriva a 44 px senza che la pillola cresca: i px in
           più stanno in uno pseudo-elemento, dove non spostano niente. `inset`
           si conta sul *padding box* (30 px: il bottone è alto 32 con 1 px di
           bordo), quindi ±7 px in verticale — non ±6 — per arrivare a 44. */
        className="relative flex h-8 items-center gap-2 rounded-full border border-stone/28 px-3 text-ink transition-colors duration-200 hover:border-stone/60 after:absolute after:-inset-x-1 after:-inset-y-[7px] after:content-['']"
      >
        <span className="u-cap text-[12px] leading-none">{current}</span>
        <svg
          aria-hidden
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="text-stone"
          focusable="false"
        >
          <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>

      {montata ? (
        <ul
          ref={listRef}
          id={`${id}-lista`}
          role="listbox"
          tabIndex={-1}
          aria-label={t('a11y.lang')}
          aria-activedescendant={`${id}-${lingue[attivo]}`}
          onKeyDown={suLista}
          style={{
            opacity: aperta ? 1 : 0,
            transform: aperta ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.98)',
            transitionDuration: reduce ? '0ms' : aperta ? '160ms' : '120ms',
            boxShadow: '0 12px 32px rgb(0 0 0 / 0.5)',
          }}
          className="absolute top-[calc(100%+8px)] right-0 z-10 min-w-[160px] origin-top-right list-none rounded-[10px] border border-stone/20 bg-obsidian/85 py-1 backdrop-blur-[16px] transition-[opacity,transform] ease-[var(--ease-arrive)] outline-none"
        >
          {lingue.map((lng, i) => {
            const scelta = lng === current;
            return (
              <li
                key={lng}
                id={`${id}-${lng}`}
                role="option"
                lang={lng}
                aria-selected={scelta}
                onClick={() => scegli(lng)}
                onPointerEnter={() => setAttivo(i)}
                style={{ height: altezzaVoce }}
                className={`flex cursor-pointer items-center justify-between gap-6 px-[14px] text-[14px] transition-colors duration-150 ${
                  scelta ? 'text-ink' : 'text-stone'
                } ${i === attivo ? 'bg-ink/6' : ''}`}
              >
                {nomeLingua(lng)}
                {/* La spunta è l'unico rosso di questo angolo: dice quale
                    lingua è accesa, e lo dice una volta sola. */}
                <svg
                  aria-hidden
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  focusable="false"
                  className="shrink-0 text-crimson"
                  style={{ opacity: scelta ? 1 : 0 }}
                >
                  <path d="M2 6.2L4.6 8.8L10 3.4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
