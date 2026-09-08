/**
 * Server statico per misurare il `dist/`.
 *
 * ESISTE PER UN MOTIVO PRECISO, non per comodità.
 *
 * Su questa macchina **Console Ninja** (estensione di VS Code) si aggancia al
 * dev server di Vite e inietta ~70 kB di script offuscato in testa a ogni
 * HTML servito. Con `vite preview` l'HTML della home usciva da 72.564 byte
 * invece dei 2.524 del `dist/`, e il `<meta charset>` finiva al byte 70.105:
 * oltre il limite di 1.024 che Lighthouse controlla. Risultato: `charset`
 * rosso e best-practices 96 su tutte e due le pagine, e prestazioni misurate
 * con 70 kB di roba estranea davanti all'app. Disabilitare l'estensione non
 * è bastato.
 *
 * Questo server non passa da Vite, quindi non ha dove agganciarsi: l'HTML
 * che esce è byte per byte quello del `dist/`. Comprime come farebbe un
 * hosting vero — senza, Lighthouse conta 311 kB di testo non compresso e il
 * punteggio non vuol dire niente — e non manda `no-store`, che da solo fa
 * fallire l'audit `bf-cache`.
 *
 * REGOLA: le misure di Lighthouse si fanno con questo, non con
 * `vite preview`.
 *
 *   npm run build && npm run serve:dist      → http://localhost:4173
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, extname, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};
const COMPRESS = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt']);

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''));
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    let body = await readFile(file);
    const ext = extname(file);
    const headers = {
      'content-type': TYPES[ext] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
    };
    if (COMPRESS.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
      body = gzipSync(body, { level: 9 });
      headers['content-encoding'] = 'gzip';
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404');
  }
}).listen(PORT, () => console.log(`dist/ su http://localhost:${PORT}  (Ctrl+C per fermare)`));
