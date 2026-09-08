import { useEffect, useState } from 'react';

/**
 * `prefers-reduced-motion`, seguito a runtime.
 *
 * Non basta leggerlo al mount: l'impostazione di sistema può cambiare mentre
 * la pagina è aperta (ed è esattamente così che la si prova). Con il listener
 * lo Stage smonta la carrellata e passa al flusso statico senza ricaricare.
 */
const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduce(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduce;
}
