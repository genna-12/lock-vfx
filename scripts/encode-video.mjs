/**
 * Dai master di LockVFX alle versioni per il web.
 *
 * ESISTE PER UN MOTIVO PRECISO. A un artista VFX non si chiede di comprimere
 * per il browser: gli si chiede il master — ProRes o H.264 ad alto bitrate,
 * 1080p o 4K, più il montaggio verticale per il telefono — e le versioni web
 * le fa questo script, con preset fissi (`rifinitura-spec.md` §8). Così sono
 * uguali per tutti i file e rifarle, quando un video cambia, è un comando.
 *
 * Non gira in CI e non gira nel build: gira sul computer di chi ha i master,
 * con ffmpeg installato. I file che produce non entrano nel repo — vanno su
 * Cloudflare R2 (`deploy-e-anteprima.md`, «R2 per i video»), dove la banda in
 * uscita è gratis e un reel da 60 MB costa quanto uno da 6.
 *
 * COME SI USA
 *
 *   node scripts/encode-video.mjs reel        <master.mov>
 *   node scripts/encode-video.mjs reel-mobile <master-verticale.mov>
 *   node scripts/encode-video.mjs work <slug> <master.mov>
 *
 * Opzioni: `--out <cartella>` (default `media/`), `--poster-at <secondi>`
 * (default 2), `--muto` (butta via la traccia audio), `--solo hd|sd|poster`.
 *
 * COSA PRODUCE (i nomi sono quelli delle cartelle di R2, punto 2)
 *
 *   reel/reel-hd.mp4              1080p  CRF 19  tetto 10 Mbit/s
 *   reel/reel-sd.mp4               720p  CRF 22  tetto 3,5
 *   reel/reel-poster.webp         1280×720, ≤ 150 kB
 *   reel/reel-mobile-hd.mp4      1080×1920      tetto 8
 *   reel/reel-mobile-sd.mp4       720×1280      tetto 3
 *   reel/reel-mobile-poster.webp
 *   works/<slug>-hd.mp4 · <slug>-sd.mp4 · <slug>.webp
 *
 * Perché questi numeri e non altri: il peso del file non è più il problema —
 * lo è il **bitrate**, cioè quanti megabit al secondo servono per riprodurlo
 * senza fermarsi. Il tetto (`-maxrate`/`-bufsize`) è quello che tiene una
 * scena complessa dentro la banda di chi guarda; il CRF decide la qualità
 * dove la scena è facile. Un 4K sul sito no: nessuno lo distingue su un
 * browser e raddoppia il bitrate — il 4K vive nel «Guarda il video
 * completo», che porta al loro Vimeo.
 *
 * Solo MP4/H.264: il WebM VP9 risparmierebbe banda su Chrome, ma raddoppia i
 * file da produrre e la banda su R2 non si paga.
 */
import { spawn } from 'node:child_process';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/** I preset. Cambiare qui vuol dire cambiarli per tutti i video, ed è il punto. */
const PRESET = {
  hd: { w: 1920, h: 1080, crf: 19, maxrate: '10M', bufsize: '20M' },
  sd: { w: 1280, h: 720, crf: 22, maxrate: '3.5M', bufsize: '7M' },
  /** Il montaggio verticale del telefono: stessa idea, altro fotogramma. */
  'mobile-hd': { w: 1080, h: 1920, crf: 19, maxrate: '8M', bufsize: '16M' },
  'mobile-sd': { w: 720, h: 1280, crf: 22, maxrate: '3M', bufsize: '6M' },
};

/** Il poster: WebP 1280×720, e deve stare sotto questo peso. */
const POSTER = { w: 1280, h: 720, max: 150 * 1024, qualita: [82, 70, 58, 46, 34] };

/* --------------------------------------------------------------------- */

function esegui(cmd, args) {
  return new Promise((risolvi, rifiuta) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.stdout.on('data', () => {});
    p.on('error', rifiuta);
    p.on('close', (code) =>
      code === 0 ? risolvi() : rifiuta(new Error(`${cmd} è uscito con ${code}\n${err.slice(-1500)}`))
    );
  });
}

/** Il master ha una traccia audio? Se non ce l'ha, non se ne codifica una muta. */
async function haAudio(master) {
  return new Promise((risolvi) => {
    const p = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'a',
      '-show_entries', 'stream=codec_type',
      '-of', 'csv=p=0',
      master,
    ]);
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('error', () => risolvi(false));
    p.on('close', () => risolvi(out.trim().length > 0));
  });
}

const kB = (b) => `${(b / 1024).toFixed(0)} kB`;
const MB = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;

async function video(master, uscita, preset, { audio }) {
  const p = PRESET[preset];
  await mkdir(dirname(uscita), { recursive: true });
  const args = [
    '-y',
    '-i', master,
    // `decrease` e non un ritaglio: il fotogramma del master comanda, e il
    // pad porta la cornice alla misura esatta senza deformare niente.
    '-vf', `scale=${p.w}:${p.h}:force_original_aspect_ratio=decrease,pad=${p.w}:${p.h}:(ow-iw)/2:(oh-ih)/2:color=black`,
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-preset', 'slow',
    '-crf', String(p.crf),
    '-maxrate', p.maxrate,
    '-bufsize', p.bufsize,
    // `yuv420p`: senza, un master 4:2:2 esce in un formato che metà dei
    // browser non riproduce, e il video resta nero.
    '-pix_fmt', 'yuv420p',
    // L'indice in testa al file: con questo un MP4 da 60 MB comincia dopo un
    // secondo come uno da 6, ed è metà del motivo per cui il peso non conta.
    '-movflags', '+faststart',
  ];
  args.push(...(audio ? ['-c:a', 'aac', '-b:a', '128k', '-ac', '2'] : ['-an']));
  args.push(uscita);
  await esegui('ffmpeg', args);
  const { size } = await stat(uscita);
  console.log(`  ${uscita}  ${MB(size)}`);
}

async function poster(master, uscita, secondi) {
  await mkdir(dirname(uscita), { recursive: true });
  for (const q of POSTER.qualita) {
    await esegui('ffmpeg', [
      '-y',
      '-ss', String(secondi),
      '-i', master,
      '-frames:v', '1',
      '-vf', `scale=${POSTER.w}:${POSTER.h}:force_original_aspect_ratio=increase,crop=${POSTER.w}:${POSTER.h}`,
      '-c:v', 'libwebp',
      '-quality', String(q),
      uscita,
    ]);
    const { size } = await stat(uscita);
    if (size <= POSTER.max) {
      console.log(`  ${uscita}  ${kB(size)}  (qualità ${q})`);
      return;
    }
  }
  const { size } = await stat(uscita);
  console.warn(
    `  ${uscita}  ${kB(size)} — sopra i ${kB(POSTER.max)} anche alla qualità più bassa:\n` +
      '  il fotogramma scelto è troppo ricco di dettaglio. Provane un altro con --poster-at.'
  );
}

/* --------------------------------------------------------------------- */

function argomenti(argv) {
  const opz = { out: 'media', posterAt: 2, muto: false, solo: null };
  const liberi = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opz.out = argv[++i];
    else if (a === '--poster-at') opz.posterAt = Number(argv[++i]);
    else if (a === '--muto') opz.muto = true;
    else if (a === '--solo') opz.solo = argv[++i];
    else liberi.push(a);
  }
  return { opz, liberi };
}

const USO = `
Uso:
  node scripts/encode-video.mjs reel        <master.mp4|mov>
  node scripts/encode-video.mjs reel-mobile <master-verticale.mp4|mov>
  node scripts/encode-video.mjs work <slug> <master.mp4|mov>

  --out <cartella>      dove scrivere (default: media/)
  --poster-at <sec>     da quale secondo prendere il poster (default: 2)
  --muto                niente traccia audio
  --solo hd|sd|poster   una cosa sola
`;

async function main() {
  const { opz, liberi } = argomenti(process.argv.slice(2));
  const [tipo] = liberi;

  /** I tre lavori possibili: dove scrivono e con quali preset. */
  let piano;
  if (tipo === 'reel' || tipo === 'reel-mobile') {
    const master = liberi[1];
    if (!master) return console.log(USO);
    const nome = tipo === 'reel' ? 'reel' : 'reel-mobile';
    const qualita = tipo === 'reel' ? ['hd', 'sd'] : ['mobile-hd', 'mobile-sd'];
    piano = {
      master,
      video: [
        { preset: qualita[0], uscita: join(opz.out, 'reel', `${nome}-hd.mp4`) },
        { preset: qualita[1], uscita: join(opz.out, 'reel', `${nome}-sd.mp4`) },
      ],
      poster: join(opz.out, 'reel', `${nome}-poster.webp`),
    };
  } else if (tipo === 'work') {
    const [, slug, master] = liberi;
    if (!slug || !master) return console.log(USO);
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(`slug non valido: "${slug}" — solo minuscole, cifre e trattini, mai spazi.`);
    }
    piano = {
      master,
      video: [
        { preset: 'hd', uscita: join(opz.out, 'works', `${slug}-hd.mp4`) },
        { preset: 'sd', uscita: join(opz.out, 'works', `${slug}-sd.mp4`) },
      ],
      poster: join(opz.out, 'works', `${slug}.webp`),
    };
  } else {
    return console.log(USO);
  }

  await stat(piano.master).catch(() => {
    throw new Error(`master non trovato: ${piano.master}`);
  });

  const audio = opz.muto ? false : await haAudio(piano.master);
  console.log(`\n${piano.master} → ${opz.out}/  (audio: ${audio ? 'sì' : 'no'})`);

  for (const v of piano.video) {
    const q = v.uscita.endsWith('-hd.mp4') ? 'hd' : 'sd';
    if (opz.solo && opz.solo !== q) continue;
    await video(piano.master, v.uscita, v.preset, { audio });
  }
  if (!opz.solo || opz.solo === 'poster') {
    await poster(piano.master, piano.poster, opz.posterAt);
  }

  console.log(
    '\nFatto. Questi file non vanno nel repo: si caricano nel bucket R2\n' +
      '`lockvfx-media`, rispettando le cartelle (`deploy-e-anteprima.md`).\n' +
      'Poi si riempie `VITE_MEDIA_URL` e il sito li prende da lì.\n'
  );
}

main().catch(async (e) => {
  console.error(`\n${e.message}\n`);
  // Un file a metà è peggio di nessun file: chi lo carica su R2 non vede che
  // è troncato, e il video si ferma a metà per tutti.
  if (e.parziale) await unlink(e.parziale).catch(() => {});
  process.exitCode = 1;
});
