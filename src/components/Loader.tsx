import type { ReactNode } from 'react';

/**
 * Segnaposto dello step 1: tiene il posto nell'albero dei componenti senza
 * disegnare nulla. Il loader vero (progresso reale pesato su font, marchio,
 * poster, JS e primo segmento della reel, staffa che si chiude, stacco,
 * `sessionStorage`) arriva allo step 3.
 */
export function Loader({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
