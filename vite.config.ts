import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Il file `_headers` di Cloudflare Pages, scritto dal build e solo quando il
 * build è un'anteprima.
 *
 * Tenerlo in `public/` sarebbe stato più corto, ma vorrebbe dire che il
 * giorno del lancio qualcuno deve ricordarsi di cancellarlo: un `noindex`
 * dimenticato è il tipo di errore che si scopre sei mesi dopo, quando il
 * sito non è mai comparso su Google. Così il file esiste soltanto se esiste
 * `VITE_PREVIEW=1`, cioè esattamente insieme alla meta `robots` che
 * `src/lib/head.ts` scrive nella pagina: si spengono insieme, togliendo la
 * variabile dal pannello di Cloudflare.
 */
function previewHeaders(isPreview: boolean): Plugin {
  return {
    name: 'lockvfx:preview-headers',
    apply: 'build',
    generateBundle() {
      if (!isPreview) return;
      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: '/*\n  X-Robots-Tag: noindex, nofollow\n',
      });
    },
  };
}

/**
 * Due pagine statiche, non un router: la home con la carrellata e
 * `/studio/`, che è solo testo. Sono lo stesso progetto — stessi token,
 * stesso i18n, stessi componenti — ma due bundle, così chi legge la pagina
 * Studio non si scarica GSAP e non monta uno stage pinnato.
 *
 * `base` viene da `VITE_BASE` perché il sito deve poter vivere anche in una
 * sottocartella (GitHub Pages: `/lock-vfx/`). Con un dominio proprio resta
 * `/` e non cambia niente. Nel codice i percorsi assoluti passano da
 * `import.meta.env.BASE_URL`; i `<link>` dell'HTML e gli `url()` del CSS li
 * riscrive Vite da sé.
 */
export default defineConfig(({ mode }) => {
  // Le variabili arrivano dai file `.env` in locale e dall'ambiente su
  // Cloudflare: si guardano tutte e due, come fa Vite per il codice client.
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };

  return {
    base: env.VITE_BASE ?? '/',
    plugins: [react(), tailwindcss(), previewHeaders(env.VITE_PREVIEW === '1')],
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          studio: fileURLToPath(new URL('./studio/index.html', import.meta.url)),
        },
      },
    },
  };
});
