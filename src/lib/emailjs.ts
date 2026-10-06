/// <reference types="vite/client" />
/**
 * L'invio del form dei contatti.
 *
 * La Stanza non sa chi spedisce le sue email: chiama `sendContact` e riceve
 * una promessa. Qui dentro stanno il provider (EmailJS), il limite di un
 * invio al minuto e l'honeypot; cambiare provider domani vuol dire cambiare
 * questo file e nient'altro.
 *
 * L'SDK di EmailJS non entra nel bundle iniziale: `import()` lo carica solo
 * quando parte un invio vero, con le chiavi configurate. In `mock` non viene
 * mai scaricato — ed è anche il motivo per cui il dev server gira prima che
 * `npm install` abbia messo il pacchetto in `node_modules`.
 */

export type ContactParams = {
  name: string;
  email: string;
  message: string;
  /** Honeypot: se è pieno, dall'altra parte non c'è una persona. */
  company: string;
  /** Lingua della pagina: serve a chi risponde, non al form. */
  lang: string;
};

/** Un invio al minuto. La Stanza lo usa anche per sapere quando riaprire la staffa. */
export const THROTTLE_MS = 60_000;

/** Quanto dura un invio simulato: il tempo che ci mette uno vero. */
const MOCK_MS = 1200;

const LAST_KEY = 'lockvfx:last-send';
/** Solo in sviluppo: forza il modo senza riavviare Vite (`mock` | `fail` | `live`). */
const MODE_KEY = 'lockvfx:emailjs';

const CONFIG = {
  publicKey: String(import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? ''),
  serviceId: String(import.meta.env.VITE_EMAILJS_SERVICE_ID ?? ''),
  templateId: String(import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? ''),
  autoreplyTemplateId: String(import.meta.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID ?? ''),
} as const;

type Mode = 'live' | 'mock' | 'fail';

export class SendError extends Error {
  readonly reason: 'throttled' | 'failed';
  constructor(reason: 'throttled' | 'failed') {
    super(`sendContact: ${reason}`);
    this.name = 'SendError';
    this.reason = reason;
  }
}

/* ---- sessionStorage, che può non esserci -------------------------------- */

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* modalità privata: resta il timestamp in memoria */
  }
}

/* ---- modo ---------------------------------------------------------------- */

function mode(): Mode {
  if (import.meta.env.DEV) {
    const forced = read(MODE_KEY);
    if (forced === 'mock' || forced === 'fail' || forced === 'live') return forced;
  }
  const flag = String(import.meta.env.VITE_EMAILJS_MOCK ?? '');
  if (flag === 'fail') return 'fail';
  if (flag === '1' || flag === 'true') return 'mock';
  const configured = Boolean(CONFIG.publicKey && CONFIG.serviceId && CONFIG.templateId);
  // Senza chiavi in sviluppo si simula; in produzione si fallisce. Un form
  // che finge di aver spedito è peggio di un form che dice "non è partito":
  // chi scrive resta convinto di aver scritto.
  if (!configured) return import.meta.env.DEV ? 'mock' : 'fail';
  return 'live';
}

/* ---- un invio al minuto -------------------------------------------------- */

let lastSend = 0;
let lastSig = '';

const SIG_KEY = 'lockvfx:last-send-sig';

/**
 * L'impronta di un messaggio: un hash corto di nome, email e testo, non il
 * testo. Serve a una domanda sola — «è lo stesso di prima?» — e per
 * rispondere non c'è bisogno di tenere in `sessionStorage` quello che una
 * persona ha scritto.
 */
function firma(params: Pick<ContactParams, 'name' | 'email' | 'message'>): string {
  const testo = [params.name.trim(), params.email.trim().toLowerCase(), params.message.trim()].join('\n');
  let h = 5381;
  for (let i = 0; i < testo.length; i++) h = ((h << 5) + h + testo.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Il messaggio è identico all'ultimo partito? Solo in quel caso un invio
 * frenato dal limite può dire «Ricevuto»: un testo diverso non è partito, e
 * dirlo sarebbe perdere un messaggio facendo finta di niente.
 */
export function sameAsLastSend(params: Pick<ContactParams, 'name' | 'email' | 'message'>): boolean {
  const sig = read(SIG_KEY) ?? lastSig;
  return sig !== '' && sig === firma(params);
}

/** Millisecondi che mancano al prossimo invio possibile (0 = si può). */
export function remainingThrottle(): number {
  const stored = Number(read(LAST_KEY) ?? 0);
  const last = Math.max(lastSend, Number.isFinite(stored) ? stored : 0);
  return Math.max(0, last + THROTTLE_MS - Date.now());
}

function markSent(params: ContactParams): void {
  lastSend = Date.now();
  lastSig = firma(params);
  write(LAST_KEY, String(lastSend));
  write(SIG_KEY, lastSig);
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

/* ---- invio --------------------------------------------------------------- */

export async function sendContact(params: ContactParams): Promise<void> {
  if (remainingThrottle() > 0) throw new SendError('throttled');

  // Honeypot: nessuna chiamata e nessun errore. Il bot vede un invio
  // riuscito e se ne va; a noi non arriva niente.
  if (params.company.trim()) {
    markSent(params);
    await wait(MOCK_MS);
    return;
  }

  const current = mode();
  if (current !== 'live') {
    await wait(MOCK_MS);
    if (current === 'fail') throw new SendError('failed');
    markSent(params);
    return;
  }

  try {
    const { send } = await import('./emailjsProvider');
    await send(CONFIG, {
      from_name: params.name,
      reply_to: params.email,
      message: params.message,
      lang: params.lang,
      page: location.href,
    });
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[contatti] invio fallito', error);
    throw new SendError('failed');
  }
  markSent(params);
}
