export function smoothstep(x: number, edge0: number, edge1: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Segue `delta` in modo ESATTO (1:1) finché il suo valore assoluto resta
 * entro `halfExtent` (il vero bordo dell'immagine) — nessuna morbidezza,
 * nessun anticipo: il centro della lente deve poter toccare esattamente
 * il bordo. Solo OLTRE quel punto, se il puntatore continua verso
 * l'esterno, il movimento decelera con continuità (tanh) verso un piccolo
 * overshoot, invece di fermarsi di scatto — così l'utente può comunque
 * "spingere" leggermente oltre senza che la lente si stacchi bruscamente.
 */
export function edgeFollow(delta: number, halfExtent: number, overshoot = 0.1) {
  const abs = Math.abs(delta);
  if (abs <= halfExtent) return delta;
  const over = abs - halfExtent;
  const band = halfExtent * overshoot;
  const capped = halfExtent + band * Math.tanh(over / band);
  return Math.sign(delta) * capped;
}