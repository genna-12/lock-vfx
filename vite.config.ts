import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build, defineConfig, loadEnv, type Plugin } from 'vite';
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
 * Il testo della pagina Studio, dentro l'HTML (R07).
 *
 * `/studio/` è l'unica pagina di parole del sito: quella che i motori
 * leggono e quella da cui si copia un paragrafo per un preventivo. Finché il
 * testo lo scrive React, chi la guarda senza eseguire JavaScript trova un
 * `<div>` vuoto. Qui, a bundle chiuso, si costruisce il componente una
 * seconda volta per Node (`vite build --ssr`, in memoria), lo si stampa con
 * `renderToString` e lo si mette nel `#root` del file già scritto.
 *
 * Perché dentro il build e non in uno script a parte: perché così non c'è
 * un passo da ricordare. `npm run build` resta un comando solo, e la pagina
 * non può uscire vuota per distrazione.
 *
 * Il build annidato ha `configFile: false` di proposito: deve avere il
 * plugin di React e nient'altro — se rileggesse questo file rientrerebbe
 * qui dentro all'infinito. Tailwind non gli serve: il CSS l'ha già scritto
 * il build vero.
 */
function prerenderStudio(outDir: string, base: string): Plugin {
  const scratch = fileURLToPath(new URL('./node_modules/.lockvfx-prerender', import.meta.url));
  return {
    name: 'lockvfx:prerender-studio',
    apply: 'build',
    // `closeBundle` e non `generateBundle`: il file HTML da riscrivere deve
    // essere già sul disco, e il CSS con lui.
    async closeBundle() {
      await build({
        configFile: false,
        logLevel: 'error',
        base,
        plugins: [react()],
        build: {
          ssr: fileURLToPath(new URL('./src/prerender/studio.tsx', import.meta.url)),
          outDir: scratch,
          emptyOutDir: true,
          rollupOptions: { output: { entryFileNames: 'studio.mjs' } },
        },
      });

      const modulo = (await import(`${scratch}/studio.mjs`)) as { renderStudio: () => string };
      const html = modulo.renderStudio();

      const pagina = fileURLToPath(new URL(`./${outDir}/studio/index.html`, import.meta.url));
      const sorgente = await readFile(pagina, 'utf8');
      const vuoto = '<div id="root"></div>';
      if (!sorgente.includes(vuoto)) {
        this.error('prerender: `<div id="root"></div>` non trovato in studio/index.html');
      }
      await writeFile(pagina, sorgente.replace(vuoto, `<div id="root">${html}</div>`));
      await rm(scratch, { recursive: true, force: true });
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
    plugins: [
      react(),
      tailwindcss(),
      previewHeaders(env.VITE_PREVIEW === '1'),
      prerenderStudio('dist', env.VITE_BASE ?? '/'),
    ],
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
