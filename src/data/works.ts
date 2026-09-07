/**
 * I lavori della Sala.
 *
 * La Sala riceve `works` come prop e **non sa da dove vengono**: oggi da
 * qui, domani da un `works.json` pubblicato dalla dashboard (Step 8 del
 * piano). Quando succederà, `loadWorks` diventerà una `fetch` e nient'altro
 * cambierà.
 */
export type Work = {
  /** Slug stabile: è anche la chiave di React e l'id ARIA. */
  id: string;
  title: string;
  year: number;
  /** Produzione o cliente. */
  client: string;
  disciplines: string[];
  /** 1280×720 WebP o JPG. */
  poster: string;
  /** Breakdown ≤ 1080p, 15–40 s. */
  video: { mp4: string; webm?: string };
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

/** Unico poster disponibile finché non arrivano quelli dei lavori. */
const PLACEHOLDER_POSTER = '/images/showreel-poster.webp';

const PLACEHOLDERS: Work[] = [
  {
    id: 'lavoro-01',
    title: 'Titolo del film',
    year: 2026,
    client: 'Produzione',
    disciplines: ['Environment', 'Compositing'],
    poster: PLACEHOLDER_POSTER,
    video: { mp4: '/video/works/lavoro-01.mp4', webm: '/video/works/lavoro-01.webm' },
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
    poster: PLACEHOLDER_POSTER,
    video: { mp4: '/video/works/lavoro-02.mp4', webm: '/video/works/lavoro-02.webm' },
    rights: 'cleared',
    order: 2,
  },
  {
    id: 'lavoro-03',
    title: 'Titolo della serie',
    year: 2025,
    client: 'Produzione',
    disciplines: ['FX / simulazioni', 'Finishing'],
    poster: PLACEHOLDER_POSTER,
    video: { mp4: '/video/works/lavoro-03.mp4', webm: '/video/works/lavoro-03.webm' },
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
