import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTACT } from '../../data/people';
import { closePrivacy, usePrivacyOpen } from '../../lib/privacy';

/**
 * L'informativa, in un `<dialog>` nativo.
 *
 * Nativo e non un pannello nostro per tre motivi che ci saremmo dovuti
 * scrivere a mano: `Esc` chiude, il fuoco resta dentro finché è aperto e
 * torna da solo sul link quando si chiude. Sta nel top layer, quindi le
 * trasformazioni della carrellata e l'`overflow: hidden` dello stage non lo
 * toccano, e soprattutto il form sotto **non si smonta**: chi stava
 * scrivendo ritrova quello che aveva scritto.
 *
 * Il testo è quello del Legale (informativa breve, cinque elementi non
 * rimovibili); `privacy.body` è il segnaposto dell'informativa completa.
 *
 * Sta in cima all'albero e lo aprono in due (la presa visione del form e il
 * footer) attraverso `lib/privacy`: un solo dialog in pagina.
 */
export function PrivacyDialog() {
  const { t } = useTranslation();
  const open = usePrivacyOpen();
  const onClose = closePrivacy;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      // Click sul fondo: il bersaglio è il dialog stesso, non il suo contenuto.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <h2 id={titleId} className="u-cap m-0 text-dust">
        {t('privacy.title')}
      </h2>
      <p className="mt-6 text-t3 text-stone">{t('privacy.short', { email: CONTACT.email })}</p>
      <p className="mt-4 text-t3 text-dust">{t('privacy.body')}</p>
      <button
        type="button"
        onClick={onClose}
        className="u-cap mt-8 h-11 min-w-[120px] bg-ink px-6 text-void transition-colors duration-[var(--f5)] hover:bg-white"
      >
        {t('privacy.close')}
      </button>
    </dialog>
  );
}
