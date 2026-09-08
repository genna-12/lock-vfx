/**
 * EmailJS, e nient'altro.
 *
 * Sta in un file suo perché è l'unico punto che importa l'SDK: `emailjs.ts`
 * lo carica con `import()` solo quando parte un invio vero, così il
 * pacchetto non pesa sul primo caricamento e il resto del sito non dipende
 * dalla sua presenza.
 */
import emailjs from '@emailjs/browser';

export type ProviderConfig = {
  publicKey: string;
  serviceId: string;
  templateId: string;
  autoreplyTemplateId: string;
};

let ready = false;

export async function send(
  config: ProviderConfig,
  params: Record<string, string>
): Promise<void> {
  if (!ready) {
    emailjs.init({ publicKey: config.publicKey });
    ready = true;
  }
  await emailjs.send(config.serviceId, config.templateId, params);

  if (!config.autoreplyTemplateId) return;
  // La risposta automatica è cortesia, non consegna: se non parte, il
  // messaggio è comunque arrivato a noi e l'invio resta riuscito.
  try {
    await emailjs.send(config.serviceId, config.autoreplyTemplateId, params);
  } catch {
    /* silenzio */
  }
}
