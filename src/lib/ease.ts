import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

/**
 * Le curve dei token, tradotte per GSAP.
 *
 * `easeArrive` in `tokens.ts` è scritta come la vuole il CSS
 * (`cubic-bezier(.2,0,0,1)`); GSAP non parsa quella sintassi, quindi la
 * stessa curva viene registrata una volta sola come CustomEase. Stessi
 * numeri, stesso movimento: se cambia il token, cambia qui e basta.
 */
gsap.registerPlugin(CustomEase);

export const EASE = {
  /** cubic-bezier(.2, 0, 0, 1) */
  arrive: CustomEase.create('lock-arrive', 'M0,0 C0.2,0 0,1 1,1'),
  /** cubic-bezier(.7, 0, .2, 1) — il volo del loader. */
  volo: CustomEase.create('lock-volo', 'M0,0 C0.7,0 0.2,1 1,1'),
  /** Lo stacco: nessuna curva. */
  cut: 'none',
} as const;
