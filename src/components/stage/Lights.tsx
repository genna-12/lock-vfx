/**
 * Le tre luci dello spazio.
 *
 * Sono layer a schermo intero con la sola opacità animata: niente `filter`,
 * niente `backdrop-filter`, niente ombre in animazione — una luce che costa
 * un repaint per fotogramma non è una luce, è un problema.
 *
 * Stanno fuori dalla `.camera`, dietro ai set: durante la reel e la sala il
 * girato le copre (ed è giusto, lì la luce è il girato); si vedono quando il
 * fondo è scoperto, cioè esattamente sui set che devono illuminare.
 *
 * SCHERMO non è un layer: è l'assenza di luce.
 */
export function Lights() {
  return (
    <>
      {/* SALA — luce dall'alto, sullo statement. */}
      <div
        data-light="sala"
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background: 'linear-gradient(180deg, var(--light-sala), transparent 46%)',
        }}
      />
      {/* TAGLIO — key calda da sinistra, sul marchio grande della stanza. */}
      <div
        data-light="taglio"
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background: 'linear-gradient(90deg, var(--light-taglio), transparent 52%)',
        }}
      />
    </>
  );
}
