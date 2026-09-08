/**
 * La testa delle due pagine.
 *
 * Titolo, descrizione, lingua e schede social sono scritti a runtime dalla
 * lingua attiva: l'HTML statico porta la versione italiana per i crawler che
 * non eseguono JS, questo la riallinea appena React monta.
 *
 * L'indirizzo del sito non è ancora deciso, e finché è vuoto il sito **non**
 * dichiara `canonical` né `og:url`: un canonical sbagliato è peggio di
 * nessun canonical. Quando il dominio arriva non si tocca più il codice: si
 * riempie `VITE_SITE_URL` fra le variabili del progetto (Cloudflare Pages) e
 * con essa si accendono da sole la canonical di tutte e due le pagine,
 * `og:url` e l'indirizzo assoluto dell'immagine OG. L'unica cosa che resta
 * da fare a mano è la riga `Sitemap:` in `public/robots.txt`.
 *
 * `VITE_PREVIEW=1` marca la versione che i ragazzi guardano prima del
 * lancio: le due pagine dichiarano `noindex, nofollow`. La meta è la seconda
 * linea, non la prima — quella vera è l'intestazione `X-Robots-Tag` che il
 * build scrive in `dist/_headers` (vedi `vite.config.ts`), perché la legge
 * anche chi non esegue il JavaScript. Le due si accendono e si spengono
 * insieme, dalla stessa variabile.
 *
 * `hreflang` no: vuole un indirizzo diverso per lingua, e qui la lingua si
 * sceglie nel browser e resta nel `localStorage`. Le due pagine sono un
 * indirizzo solo, e dichiarare un `hreflang` che non esiste è peggio che
 * tacere.
 *
 * Perché a mano e non con una libreria: sono cinque tag su due pagine
 * statiche, e un `<head>` non è uno stato di React.
 */
export const SITE_URL = String(import.meta.env.VITE_SITE_URL ?? '').replace(/\/+$/, '');

/** Anteprima per i ragazzi: fuori dai motori di ricerca. */
const IS_PREVIEW = String(import.meta.env.VITE_PREVIEW ?? '') === '1';

/** L'immagine delle schede social: il marchio su fondo pieno, 1200×630. */
const OG_IMAGE = `${import.meta.env.BASE_URL}og.png`;

type HeadInfo = {
  title: string;
  description: string;
  /** Percorso della pagina dal `base`, con la barra finale: `/`, `/studio/`. */
  path: string;
  /** Lingua attiva, due lettere. */
  lang: string;
  /** Testo alternativo dell'immagine OG. */
  imageAlt: string;
};

/** Il tag `<meta>` con quel nome o quella property, creato se non c'è. */
function meta(key: 'name' | 'property', value: string): HTMLMetaElement {
  const found = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (found) return found;
  const el = document.createElement('meta');
  el.setAttribute(key, value);
  document.head.appendChild(el);
  return el;
}

export function applyHead({ title, description, path, lang, imageAlt }: HeadInfo): void {
  if (IS_PREVIEW) meta('name', 'robots').content = 'noindex, nofollow';

  document.documentElement.lang = lang;
  document.title = title;
  meta('name', 'description').content = description;

  meta('property', 'og:title').content = title;
  meta('property', 'og:description').content = description;
  meta('property', 'og:image:alt').content = imageAlt;
  meta('name', 'twitter:image:alt').content = imageAlt;
  // `it` e `en` diventano `it_IT` e `en_US`: Open Graph vuole la forma lunga.
  meta('property', 'og:locale').content = lang === 'it' ? 'it_IT' : 'en_US';

  if (!SITE_URL) return;

  meta('property', 'og:url').content = `${SITE_URL}${path}`;
  meta('property', 'og:image').content = `${SITE_URL}${OG_IMAGE}`;
  meta('name', 'twitter:image').content = `${SITE_URL}${OG_IMAGE}`;

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = `${SITE_URL}${path}`;
}
