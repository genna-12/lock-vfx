import { useTranslation } from 'react-i18next';
import { LANG_PILL } from '../../brand/tokens';

const LANGS = ['it', 'en'] as const;

/**
 * Il cambio lingua, in alto a destra.
 *
 * Due direzioni dietro `LANG_PILL` (`rifinitura-spec.md` §4), perché LockVFX
 * le veda una accanto all'altra. Il vetro traslucido con blur — la pillola
 * di tutti — è respinto e non è una terza opzione.
 *
 * **`foro`** (il default, ed è quella consigliata): le due sigle di oggi,
 * attiva `ink` e l'altra `stone`, con un **foro di perforazione** acceso
 * sotto quella attiva. È la stessa grammatica della nav — lì la perforazione
 * dice in quale set si è, qui in quale lingua — e non aggiunge nessuna
 * superficie nuova al chrome: il sito non ha bordi, e questa non ne mette.
 *
 * **`interruttore`**: una perforazione lunga 24×12 con il cursore `ink` che
 * scorre da una parte all'altra e le due sigle ai lati. È più esplicito — si
 * legge come un comando anche da fermo — ma introduce un oggetto disegnato
 * in un chrome che finora è fatto solo di testo e di fori.
 *
 * In tutte e due i bottoni sono gli stessi: la forma cambia, la struttura
 * no. Il binario dell'interruttore è decorazione (`aria-hidden`), il
 * comando resta la sigla.
 */
export function LangPill() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? 'it';
  const cambia = (lng: string) => () => void i18n.changeLanguage(lng);

  /* ---- (b) l'interruttore ------------------------------------------- */
  if (LANG_PILL === 'interruttore') {
    const secondo = current === LANGS[1];
    return (
      <div className="pointer-events-auto flex items-center gap-2">
        {LANGS.map((lng, i) => (
          <span key={lng} className="flex items-center gap-2">
            {i > 0 ? (
              // Il binario sta **fra** le due sigle: è lì che si vede il
              // movimento, e da lì il cursore indica quale delle due è
              // accesa senza bisogno di una freccia.
              <span
                aria-hidden
                className="relative block h-3 w-6 rounded-[2px] border border-dust/60"
              >
                <span
                  className="absolute top-[2px] left-[2px] block h-[6px] w-[8px] rounded-[1px] bg-ink"
                  style={{
                    transform: `translateX(${secondo ? 10 : 0}px)`,
                    transition: `transform var(--f5) var(--ease-arrive)`,
                  }}
                />
              </span>
            ) : null}
            <button
              type="button"
              lang={lng}
              aria-current={current === lng ? 'true' : undefined}
              onClick={cambia(lng)}
              className={`u-cap transition-colors duration-200 ${
                current === lng ? 'text-ink' : 'text-stone hover:text-ink'
              }`}
            >
              {lng}
            </button>
          </span>
        ))}
      </div>
    );
  }

  /* ---- (a) il foro, come la nav -------------------------------------- */
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      {LANGS.map((lng, i) => (
        <span key={lng} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="h-2.5 w-px bg-dust/60" />}
          <span className="flex flex-col items-center gap-[5px]">
            <button
              type="button"
              lang={lng}
              aria-current={current === lng ? 'true' : undefined}
              onClick={cambia(lng)}
              className={`u-cap transition-colors duration-200 ${
                current === lng ? 'text-ink' : 'text-stone hover:text-ink'
              }`}
            >
              {lng}
            </button>
            {/* La perforazione della nav, coricata: stessa proporzione (9 su
                13) portata a 9×4, perché sotto una sigla di undici pixel un
                foro in piedi sarebbe un secondo carattere. Non appare e
                scompare — c'è sempre, e si accende: così la riga di testo
                non si muove quando si cambia lingua. */}
            <span
              aria-hidden
              className="block h-[4px] w-[9px] rounded-[2px] bg-ink transition-opacity"
              style={{
                opacity: current === lng ? 1 : 0,
                transitionDuration: 'var(--f5)',
                transitionTimingFunction: 'var(--ease-arrive)',
              }}
            />
          </span>
        </span>
      ))}
    </div>
  );
}
