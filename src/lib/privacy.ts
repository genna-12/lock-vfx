import { useSyncExternalStore } from 'react';

/**
 * L'informativa è una sola, e la aprono in due: la presa visione nella
 * Stanza e il footer.
 *
 * Un negozio minuscolo invece di un context: il dialog vive in cima
 * all'albero (in `App`), gli altri due chiamano `openPrivacy()` e non si
 * passano niente per mano. Così il `<dialog>` non viene montato due volte —
 * due dialog modali in pagina sono due cose che possono aprirsi insieme.
 */
let open = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function openPrivacy(): void {
  if (open) return;
  open = true;
  emit();
}

export function closePrivacy(): void {
  if (!open) return;
  open = false;
  emit();
}

export function usePrivacyOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open,
    () => false
  );
}
