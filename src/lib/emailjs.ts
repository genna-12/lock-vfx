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

/** Millisecondi che mancano al prossimo invio possibile (0 = si può). */
export function remainingThrottle(): number {
  const stored = Number(read(LAST_KEY) ?? 0);
  const last = Math.max(lastSend, Number.isFinite(stored) ? stored : 0);
  return Math.max(0, last + THROTTLE_MS - Date.now());
}

function markSent(): void {
  lastSend = Date.now();
  write(LAST_KEY, String(lastSend));
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
    markSent();
    await wait(MOCK_MS);
    return;
  }

  const current = mode();
  if (current !== 'live') {
    await wait(MOCK_MS);
    if (current === 'fail') throw new SendError('failed');
    markSent();
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
  markSent();
}
