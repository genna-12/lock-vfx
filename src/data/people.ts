/**
 * Le persone dietro il nome collettivo.
 *
 * Sono dati, non testi: i nomi e i numeri non si traducono, e devono stare
 * in un posto solo perché il footer e la Stanza leggano la stessa lista.
 *
 * **Nome e cognome per esteso, partita IVA, e nient'altro** (Direzione, 9/9,
 * ticket R23; `handoff-legale.md` §1): niente email individuali — non
 * esistono caselle personali e l'unico indirizzo del sito è quello
 * collettivo —, niente città, niente ruoli. Nella lista dei lavori "ruolo"
 * resta il ruolo di LockVFX **nel lavoro**, che è un'altra cosa.
 */
export type Person = {
  name: string;
  /** Partita IVA: obbligatoria in home page (art. 35 D.P.R. 633/1972). */
  vat: string;
};

export const PEOPLE: readonly Person[] = [
  { name: 'Denis Ruscitti', vat: '04397621204' },
  { name: 'Nicholas Pantieri', vat: '02829650395' },
];

/**
 * L'indirizzo collettivo: l'unico del sito — sotto i nomi nella Stanza, nel
 * footer, e il rimedio se l'invio fallisce.
 *
 * ⚠ Segnaposto dichiarato: l'indirizzo vero manca ancora
 * (`cosa-ci-serve-da-lockvfx.md`).
 */
export const CONTACT = { email: 'info@lockvfx.com' } as const;
