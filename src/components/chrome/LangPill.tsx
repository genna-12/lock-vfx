import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { availableLanguages } from '../../config/i18n';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Il cambio lingua, in alto a destra (`rifinitura-spec.md` §9.3).
 *
 * Una pillola con la lingua corrente e una tendina con i nomi per esteso.
 * Le due sigle affiancate di prima chiedevano di leggere due parole per
 * capire che erano un comando; qui ce n'è una sola, dentro un oggetto che ha
 * un suo spessore e quindi si annuncia da solo.
 *
 * È **l'unico vetro del chrome**, e ha una ragione: la tendina si apre sopra
 * il video della prima schermata, e un pannello opaco lassù sarebbe un buco
 * nero nell'inquadratura. Il blur tiene il fotogramma vivo sotto il pannello
 * senza far perdere una riga di testo. Da nessun'altra parte il vetro serve,
 * e infatti da nessun'altra parte c'è.
 *
 * Dal 18/9 il materiale è quello di §9.6: non un rettangolo smussato con un
 * filtro dietro, ma un pezzo di vetro — raggio 20, filo interno, riflesso in
 * alto, voci a raggio 14 che respirano nei 6 px di padding. Le misure della
 * pillola e la tastiera restano quelle di §9.3: cambia la materia, non il
 * comportamento.
 *
 * I nomi delle lingue vengono da `Intl.DisplayNames`, ciascuno **nella
 * propria lingua**: chi cerca l'inglese cerca "English", non "Inglese". La
 * lista è quella di i18n, quindi una terza lingua compare da sola.
 */

/** §9.6: 44 px sempre, non solo dove si tocca — il vetro vuole aria. */
const VOCE = 44;

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

  // Due stati e non uno: `montata` tiene la tendina nell'albero per i 140 ms
  // della chiusura, `aperta` fa correre le transizioni. Senza il primo la
  // tendina sparirebbe di colpo, che è l'unica delle due animazioni che si
  // noterebbe se mancasse. `uscita` distingue il "non ancora aperta" (arriva
  // da .94) dal "si sta chiudendo" (se ne va a .97): il vetro entra da più
  // lontano di quanto esca, come una cosa che si posa e poi si ritrae.
  const [montata, setMontata] = useState(false);
  const [aperta, setAperta] = useState(false);
  const [uscita, setUscita] = useState(false);
  const [attivo, setAttivo] = useState(() => Math.max(0, lingue.indexOf(current)));

  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const chiusura = useRef(0);

  const apri = () => {
    window.clearTimeout(chiusura.current);
    setAttivo(Math.max(0, lingue.indexOf(current)));
    setUscita(false);
    setMontata(true);
  };

  const chiudi = (tornaAllaPillola = false) => {
    setUscita(true);
    setAperta(false);
    if (tornaAllaPillola) pillRef.current?.focus();
    chiusura.current = window.setTimeout(() => setMontata(false), reduce ? 0 : 140);
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
           più stanno in uno pseudo-elemento, dove non spostano niente. Il
           bordo non c'è più — lo fa il filo interno del vetro — quindi
           l'`inset` si conta sull'altezza piena: 36 sul telefono (±4) e 32
           da `md` in su (±6). In tutti e due i casi, 44. */
        className="relative flex h-9 items-center gap-2 rounded-pill px-3 text-ink after:absolute after:-inset-x-1 after:-inset-y-1 after:content-[''] md:h-8 md:after:-inset-y-1.5 u-vetro-pill"
      >
        <span className="u-cap text-[12px] leading-none">{current}</span>
        {/* Il chevron si gira quando la tendina è giù: è l'unico segno che
            dice "questo è aperto" quando il pannello sta sopra il video. */}
        <svg
          aria-hidden
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="text-stone"
          focusable="false"
          style={{
            transform: montata ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: reduce ? 'none' : 'transform 160ms var(--ease-arrive)',
          }}
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
            // Meno movimento: resta la sola dissolvenza, il vetro non si
            // gonfia né si ritrae.
            transform: reduce ? undefined : aperta ? 'scale(1)' : `scale(${uscita ? 0.97 : 0.94})`,
            transitionDuration: reduce ? '0ms' : aperta ? '220ms' : '140ms',
          }}
          className="absolute top-[calc(100%+10px)] right-0 z-10 w-44 origin-top-right list-none rounded-glass p-1.5 transition-[opacity,transform] ease-[var(--ease-vetro)] outline-none u-vetro"
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
                style={{
                  height: VOCE,
                  // Il fondo è l'unica cosa che distingue le voci: la corrente
                  // tiene un velo più chiaro, quella sotto il dito o il focus
                  // uno appena percettibile. Raggio 14 = 20 − 6: la voce è
                  // concentrica al pannello che la contiene.
                  background: scelta
                    ? 'rgb(255 255 255 / 0.10)'
                    : i === attivo
                      ? 'rgb(255 255 255 / 0.07)'
                      : 'transparent',
                }}
                className="relative flex cursor-pointer items-center justify-between gap-6 rounded-[14px] px-[14px] text-[15px] font-normal text-ink transition-colors duration-150"
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
