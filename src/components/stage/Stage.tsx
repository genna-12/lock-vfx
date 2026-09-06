/**
 * Segnaposto dello step 1: un blocco grigio alto quanto la finestra, solo
 * per verificare l'impaginazione del chrome e del footer.
 *
 * Lo step 2 lo sostituisce con lo stage pinnato di 560vh, le tre luci e la
 * carrellata di `momento-1-lo-spazio.md`.
 */
export function Stage() {
  return (
    <div
      id="reel"
      className="flex h-screen w-full items-center justify-center bg-obsidian"
    >
      <span className="u-cap text-dust">stage — segnaposto step 1</span>
    </div>
  );
}
