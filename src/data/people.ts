/**
 * Le persone dietro il nome collettivo.
 *
 * Sono dati, non testi: i nomi e gli indirizzi non si traducono, e devono
 * stare in un posto solo perché la Stanza — e domani il footer, che agli
 * stessi nomi aggiungerà le P.IVA — leggano la stessa lista.
 *
 * ⚠ Segnaposto: nomi, email individuali, contatto collettivo e città veri
 * arrivano da LockVFX. Alla sostituzione cambia solo questo file (la città
 * sta in i18n insieme al resto della riga).
 */
export type Person = {
  name: string;
  email: string;
  /** Partita IVA: obbligatoria in home page (art. 35 D.P.R. 633/1972). */
  vat: string;
};

export const PEOPLE: readonly Person[] = [
  { name: '[Nome Cognome]', email: '[nome1]@lockvfx.com', vat: '[00000000000]' },
  { name: '[Nome Cognome]', email: '[nome2]@lockvfx.com', vat: '[00000000000]' },
];

/** L'indirizzo collettivo: la riga sotto i nomi, e il rimedio se l'invio fallisce. */
export const CONTACT = { email: 'info@lockvfx.com' } as const;
