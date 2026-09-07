import { useTranslation } from 'react-i18next';

/**
 * Il secondo set: chi è LockVFX, detto una volta sola.
 *
 * Composizione 7/5: la frase grande occupa la colonna sinistra, e a destra —
 * allineati al suo piede, non al suo centro — il paragrafo e la riga dei
 * nomi. È l'asimmetria a dare il ritmo: se le due colonne partissero dalla
 * stessa linea sarebbe una slide, non un'inquadratura.
 *
 * Il contenitore e i tre blocchi sono gli stessi agganci della carrellata
 * (`[data-statement]`, `[data-line]`): la timeline dello Stage li fa entrare
 * da z −520 con lo stagger e li attraversa in T2, e questo file non sa nulla
 * di quando succede. Lo stagger è per selettore: i blocchi possono cambiare
 * di numero senza toccare la camera.
 *
 * Il copy qui è la bozza dello sketch, segnaposto: quello definitivo arriva
 * dal canale testi. I `[Nome]` e la `[Città]` sono segnaposto veri, non
 * dimenticanze.
 */
export function Statement() {
  const { t } = useTranslation();

  return (
    <div
      data-statement
      className="u-pad grid w-full max-w-[1180px] grid-cols-1 gap-y-10 [transform-style:preserve-3d] md:grid-cols-12 md:items-end md:gap-x-[clamp(32px,5vw,80px)]"
    >
      <p data-line className="u-display text-d1 text-ink text-balance md:col-span-7">
        {t('statement.phrase')}
      </p>

      <div className="flex flex-col gap-6 md:col-span-5">
        {/* Misura della spec: non è nella scala dei token perché è l'unico
            corpo di testo lungo del sito. */}
        <p data-line className="max-w-[40ch] text-[clamp(16px,1.3vw,19px)] leading-[1.5] text-stone">
          {t('statement.paragraph')}
        </p>
        {/* `stone` e non `dust`: qui non c'è un'etichetta, ci sono i nomi delle
            due persone — è contenuto, e in `dust` starebbe a 3,56:1. */}
        <p data-line className="u-cap flex flex-wrap gap-x-6 gap-y-2 text-stone">
          <span>{t('statement.credits.a')}</span>
          <span>{t('statement.credits.b')}</span>
          <span>{t('statement.credits.c')}</span>
        </p>
      </div>
    </div>
  );
}
