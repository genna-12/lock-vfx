import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Due pagine statiche, non un router: la home con la carrellata e
 * `/studio/`, che è solo testo. Sono lo stesso progetto — stessi token,
 * stesso i18n, stessi componenti — ma due bundle, così chi legge la pagina
 * Studio non si scarica GSAP e non monta uno stage pinnato.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        studio: fileURLToPath(new URL('./studio/index.html', import.meta.url)),
      },
    },
  },
});
