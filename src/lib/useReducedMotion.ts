import { useEffect, useState } from 'react';

/**
 * Le due condizioni che spengono la carrellata, seguite a runtime.
 *
 * Non basta leggerle al mount: l'impostazione di sistema può cambiare mentre
 * la pagina è aperta (ed è esattamente così che la si prova), e il telefono
 * si gira quando gli pare. Con il listener lo Stage smonta la carrellata e
 * passa al flusso statico senza ricaricare, e la rimonta quando si torna.
 */
const REDUCE = '(prefers-reduced-motion: reduce)';

/**
 * Telefono coricato. In orizzontale un telefono è alto meno di 500 px: la
 * carrellata non ci sta e le sezioni si accavallano. Non è una rinuncia —
 * in orizzontale su un telefono si guarda un video, non si fa una
 * carrellata, e la Sala in orizzontale è già progettata così
 * (`rifinitura-spec.md` §6.1, punto 3).
 */
const SHORT_LANDSCAPE = '(max-height: 500px) and (orientation: landscape)';

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useReducedMotion(): boolean {
  return useMedia(REDUCE);
}

/** `true` su un telefono coricato: stessa modalità statica di reduced motion. */
export function useShortLandscape(): boolean {
  return useMedia(SHORT_LANDSCAPE);
}
