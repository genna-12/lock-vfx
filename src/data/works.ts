/**
 * I lavori della Sala.
 *
 * La Sala riceve `works` come prop e **non sa da dove vengono**: oggi da
 * qui, domani da un `works.json` pubblicato dalla dashboard (Step 8 del
 * piano). Quando succederà, `loadWorks` diventerà una `fetch` e nient'altro
 * cambierà.
 */
import { sorgente, workRendition, type Rendition } from '../lib/media';

export type Work = {
  /** Slug stabile: è anche la chiave di React e l'id ARIA. */
  id: string;
  title: string;
  year: number;
  /** Produzione o cliente. */
  client: string;
  disciplines: string[];
  /** 1280×720 WebP o JPG. È il poster della rendition. */
  poster: string;
  /**
   * Breakdown, nella versione scelta per questa visita: un MP4 solo
   * (`lib/media.ts`). Il campo resta della forma di prima — `webm`
   * facoltativo e mai riempito — perché la Sala lo legge così e qui non si
   * riscrive la Sala per cambiare un percorso.
   */
  video: { mp4: string; webm?: string };
  /** Le due versioni prodotte da `scripts/encode-video.mjs`, più il poster. */
  media: Rendition;
  /** Link al video completo, se c'è. */
  fullUrl?: string;
  /** Un lavoro con i diritti non liberati non si mostra. */
  rights: 'cleared' | 'pending';
  order?: number;
};

/**
 * I breakdown non esistono ancora: senza questa variabile il componente non
 * monta nessuna `<source>` e resta il poster. Stessa regola della reel — si
 * regge l'assenza, non si finge.
 */
export const WORKS_HAVE_VIDEO = (import.meta.env.VITE_WORKS ?? 'none') !== 'none';

/**
 * I percorsi non stanno più qui: li costruisce `lib/media.ts`, che sa dove
 * abitano i video — nel sito, come oggi, o su R2 quando `VITE_MEDIA_URL` è
 * pieno — e quale delle due versioni serve a questa visita. Da qui si dice
 * solo lo slug.
 */
function media(slug: string): Pick<Work, 'poster' | 'video' | 'media'> {
  const r = workRendition(slug);
  return { poster: r.poster, video: { mp4: sorgente(r) }, media: r };
}

const PLACEHOLDERS: Work[] = [
  {
    id: 'lavoro-01',
    title: 'Titolo del film',
    year: 2026,
    client: 'Produzione',
    disciplines: ['Environment', 'Compositing'],
    ...media('lavoro-01'),
    fullUrl: 'https://vimeo.com/',
    rights: 'cleared',
    order: 1,
  },
  {
    id: 'lavoro-02',
    title: 'Titolo dello spot',
    year: 2025,
    client: 'Cliente',
    disciplines: ['CG integration', 'Cleanup'],
    ...media('lavoro-02'),
    rights: 'cleared',
    order: 2,
  },
  {
    id: 'lavoro-03',
    title: 'Titolo della serie',
    year: 2025,
    client: 'Produzione',
    disciplines: ['FX / simulazioni', 'Finishing'],
    ...media('lavoro-03'),
    fullUrl: 'https://vimeo.com/',
    rights: 'cleared',
    order: 3,
  },
];

/** Solo i lavori con i diritti liberati, nell'ordine dichiarato. */
export function loadWorks(): Work[] {
  return PLACEHOLDERS.filter((w) => w.rights === 'cleared').sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
}
