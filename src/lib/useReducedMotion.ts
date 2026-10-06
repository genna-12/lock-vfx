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

/**
 * Telefono o tablet: puntatore grosso e niente hover. Non un portatile col
 * touch, che ha tutti e due. Da qui in poi è la condizione che decide se il
 * sito fa la carrellata o la pagina semplice (`mobile-semplice-spec.md` §0).
 */
const COARSE = '(hover: none) and (pointer: coarse)';

/**
 * La modalità della pagina **adesso**, senza React: le stesse tre domande
 * che lo Stage si fa con gli hook qui sotto. Serve prima del primo render
 * (`main.tsx` e il valore iniziale di `stageProgress`): se la classe
 * `static` arriva dall'effetto dello Stage, il primo layout è quello della
 * carrellata e poi tutto salta — CLS 0,054 su iPad e 0,066 con reduced
 * motion, misurati dalla QA (D20).
 */
export function modoIniziale(): { flat: boolean; coarse: boolean } {
  if (typeof window === 'undefined') return { flat: false, coarse: false };
  const coarse = window.matchMedia(COARSE).matches;
  const flat =
    coarse || window.matchMedia(REDUCE).matches || window.matchMedia(SHORT_LANDSCAPE).matches;
  return { flat, coarse };
}

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

/** `true` su telefono e tablet: lì non c'è carrellata. */
export function useCoarsePointer(): boolean {
  return useMedia(COARSE);
}
