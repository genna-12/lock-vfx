import { useTranslation } from 'react-i18next';

const LANGS = ['it', 'en'] as const;

/**
 * Cambio lingua. Nessun bordo, nessuna pillola disegnata: due etichette e
 * una barra sottile fra le due. La lingua attiva è `ink`, l'altra `dust`.
 */
export function LangPill() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? 'it';

  return (
    <div className="pointer-events-auto flex items-center gap-2">
      {LANGS.map((lng, i) => (
        <span key={lng} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="h-2.5 w-px bg-dust/60" />}
          <button
            type="button"
            lang={lng}
            aria-current={current === lng ? 'true' : undefined}
            onClick={() => void i18n.changeLanguage(lng)}
            className={`u-cap transition-colors duration-200 ${
              current === lng ? 'text-ink' : 'text-dust hover:text-stone'
            }`}
          >
            {lng}
          </button>
        </span>
      ))}
    </div>
  );
}
