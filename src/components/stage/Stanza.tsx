import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type RefObject,
} from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { MOTION } from '../../brand/tokens';
import { STAGE_VH } from '../../lib/camera';
import { useStageWindow } from '../../lib/stageProgress';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { SendError, THROTTLE_MS, remainingThrottle, sendContact } from '../../lib/emailjs';
import { CONTACT, PEOPLE } from '../../data/people';
import { openPrivacy } from '../../lib/privacy';
import { MARK_VIEWBOX, SHACKLE_CLOSED } from '../../brand/mark';
import { Mark } from '../brand/Mark';

/**
 * La stanza.
 *
 * Non è uno schermo: nessun fondo pieno, la luce di taglio arriva dal layer
 * delle luci e batte da sinistra sul marchio grande. A sinistra chi siamo
 * (marchio, due nomi, due email), a destra il modo per parlarci.
 *
 * L'unica cosa che si muove è la staffa: si chiude quando il messaggio è
 * partito, in due fotogrammi, con un fotogramma di rosso. È l'unica volta in
 * cui il marchio fa qualcosa, e per questo si vede.
 *
 * Il form è a tre campi perché ogni campo in più è un dato in più da
 * giustificare (vedi `handoff-legale.md` §2): la casella è una **presa
 * visione** dell'informativa, non un consenso — la parola "acconsento" qui
 * sarebbe sbagliata, non prudente.
 */

/** HOLD 4: da 500vh alla fine dei 560. Fuori di qui la stanza è `inert`. */
const HOLD_FROM = 500 / STAGE_VH;
/** Mezzo fotogramma di rosso sul marchio: si sente, non si legge. */
const FLASH_MS = 42;
/** Larghezza del marchio grande: `clamp(140px, 16vw, 240px)`, 44 su mobile.
 *  Il budget dell'8/9 dà 64 px alla **riga** del marchio, e qui il numero è
 *  una larghezza: il lucchetto è alto una volta e sei. A 44 la riga la
 *  decidono i nomi (80 px) e il marchio non costa niente in altezza, mentre
 *  ogni pixel che non prende lo prendono i nomi, che a 390 di larghezza sono
 *  al limite dell'a capo. Conta che stia sullo schermo insieme al pulsante — la
 *  staffa che si chiude all'invio è la firma della Stanza e va vista mentre
 *  si chiude — non che sia grande. */
const MARK = { min: 140, vw: 0.16, max: 240, mobile: 44 } as const;
/** La textarea cresce col contenuto: 6 righe su desktop, 3 dove lo schermo è corto. */
const ROWS = { max: 6, maxCompact: 3 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE = '(max-width: 767px)';

type FieldName = 'name' | 'email' | 'message';
type Status = 'idle' | 'sending' | 'sent' | 'failed';

function isMobile(): boolean {
  return window.matchMedia(MOBILE).matches;
}

function markWidth(): number {
  if (typeof window === 'undefined') return MARK.max;
  if (isMobile()) return MARK.mobile;
  return Math.min(MARK.max, Math.max(MARK.min, window.innerWidth * MARK.vw));
}

function fieldValid(name: FieldName, value: string): boolean {
  const v = value.trim();
  return name === 'email' ? EMAIL.test(v) : v.length > 0;
}

export function Stanza() {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const uid = useId();

  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [invalid, setInvalid] = useState({ name: false, email: false, message: false });
  const [consent, setConsent] = useState(false);
  const [consentInvalid, setConsentInvalid] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  // Dentro l'HOLD 4 o no: la progress arriva dallo Stage, non da un secondo
  // trigger che rifarebbe lo stesso conto.
  const inHold = useStageWindow(HOLD_FROM, 1.01);
  const [markW, setMarkW] = useState(markWidth);

  const fitRef = useRef<HTMLDivElement>(null);
  const shackleRef = useRef<SVGPathElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // In flusso statico (reduced motion) non c'è carrellata e non c'è un HOLD:
  // la stanza è sempre raggiungibile.
  const live = reduced || inHold;
  const locked = status === 'sending' || status === 'sent';
  const closed = status === 'sent';
  const markH = (markW * MARK_VIEWBOX.h) / MARK_VIEWBOX.w;

  useEffect(() => {
    const onResize = () => setMarkW(markWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ---- scorre, o no ----------------------------------------------------
     L'invariante di questa sezione, che vale sempre e da qualunque punto:
     **un dito che sale deve poter riportare alla Sala.**

     Dopo la stretta del Lotto 1 bis la Stanza sta in 640 px e non ha niente
     da scorrere. Ma la regola che l'accendeva era una media query
     (`max-height: 640px`, e il fuoco su un campo), quindi su uno schermo
     corto diventava un contenitore che scorre **a vuoto**: con venti pixel
     di corsa e `overscroll-behavior: contain` si prendeva il gesto e non lo
     passava alla pagina — dai contatti non si tornava più indietro
     (riprodotto a 390×620: una passata di dito, la progress non si muove di
     un vh).

     Quindi: non una media query ma una **misura**, e nessun `contain`. Il
     contenitore esiste solo se c'è davvero qualcosa che sborda, e quando
     arriva in cima la catena verso la pagina resta aperta. */
  const [scrolls, setScrolls] = useState(false);
  useLayoutEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const measure = () => setScrolls(el.scrollHeight - el.clientHeight > 1);
    measure();
    // Il riquadro cambia col viewport, il contenuto quando il messaggio
    // cresce: si guardano tutti e due.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    return () => ro.disconnect();
  }, []);

  /* ---- la staffa -------------------------------------------------------- */
  // Stile inline e non una classe: dentro l'SVG un px CSS è un'unità di
  // viewBox, quindi la discesa è esattamente i 25 del disegno a qualunque
  // dimensione — e la transizione deve stare sull'elemento, non su una
  // classe che React sostituirebbe insieme al resto.
  useLayoutEffect(() => {
    const el = shackleRef.current;
    if (!el) return;
    el.style.transition = reduced ? 'none' : `transform ${MOTION.f2}ms var(--ease-cut)`;
    el.style.transform = closed ? `translateY(${SHACKLE_CLOSED}px)` : 'none';
    const root = markRef.current;
    if (!closed || reduced) {
      if (root) root.style.color = '';
      return;
    }
    // Un solo fotogramma di rosso quando la staffa tocca il corpo e il
    // marchio si riempie. Con `setTimeout` e non con GSAP: se la scheda va
    // in secondo piano il ticker si ferma e il rosso resterebbe acceso.
    let off = 0;
    const on = window.setTimeout(() => {
      if (root) root.style.color = 'var(--color-crimson)';
      off = window.setTimeout(() => {
        if (root) root.style.color = '';
      }, FLASH_MS);
    }, MOTION.f2);
    return () => {
      window.clearTimeout(on);
      window.clearTimeout(off);
      if (root) root.style.color = '';
    };
  }, [closed, reduced]);

  /* ---- un invio al minuto ------------------------------------------------ */
  // Dopo l'invio il form resta compilato e fermo: chi ha scritto vede cosa ha
  // mandato. Passato il minuto la staffa si riapre e si può scrivere ancora.
  useEffect(() => {
    if (status !== 'sent') return;
    const left = remainingThrottle() || THROTTLE_MS;
    const id = window.setTimeout(() => setStatus('idle'), left);
    return () => window.clearTimeout(id);
  }, [status]);

  /* ---- validazione ------------------------------------------------------- */
  const setValue = useCallback(
    (name: FieldName, value: string) => {
      setValues((v) => ({ ...v, [name]: value }));
      // Mentre si scrive non si accendono errori; quelli accesi si spengono
      // appena il campo torna valido.
      setInvalid((v) => (v[name] && fieldValid(name, value) ? { ...v, [name]: false } : v));
    },
    []
  );

  const onFieldBlur = useCallback((name: FieldName, value: string) => {
    // Un campo lasciato vuoto passando oltre non è ancora un errore: si
    // controlla solo quello che è stato scritto.
    if (value) setInvalid((s) => ({ ...s, [name]: !fieldValid(name, value) }));
  }, []);

  // Con la tastiera virtuale aperta il campo attivo può finire sotto la
  // tastiera: è l'unico scroll interno ammesso nella stanza, e solo quando
  // serve davvero.
  const onFieldFocus = useCallback((event: FocusEvent<HTMLElement>) => {
    if (!isMobile()) return;
    const el = event.currentTarget;
    const view = window.visualViewport;
    const bottom = view ? view.height : window.innerHeight;
    if (el.getBoundingClientRect().bottom <= bottom - 24) return;
    el.scrollIntoView({ block: 'center' });
  }, []);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (locked) return;

      const next = {
        name: !fieldValid('name', values.name),
        email: !fieldValid('email', values.email),
        message: !fieldValid('message', values.message),
      };
      setInvalid(next);
      setConsentInvalid(!consent);

      // Con errori non si invia: il fuoco va sul primo campo da sistemare.
      const first = (['name', 'email', 'message'] as const).find((k) => next[k]);
      if (first || !consent) {
        const target =
          first === 'name'
            ? nameRef.current
            : first === 'email'
              ? emailRef.current
              : first === 'message'
                ? messageRef.current
                : consentRef.current;
        target?.focus();
        return;
      }

      setStatus('sending');
      sendContact({
        ...values,
        company: hpRef.current?.value ?? '',
        lang: i18n.language,
      })
        .then(() => setStatus('sent'))
        .catch((error: unknown) => {
          // Ricarica la pagina e riscrive entro il minuto: il messaggio di
          // prima è partito davvero, quindi si vede lo stesso esito.
          const throttled = error instanceof SendError && error.reason === 'throttled';
          setStatus(throttled ? 'sent' : 'failed');
        });
    },
    [consent, i18n.language, locked, values]
  );

  const statusText =
    status === 'sent' ? t('contact.status.sent') : status === 'failed' ? t('contact.status.failed') : '';

  return (
    <>
      {/* `content-start` su mobile e `content-center` da 768 in su: al
          telefono la stanza è più alta dello schermo, e un contenuto
          centrato che sborda esce **anche dal lato di sopra**, cioè dentro
          la sezione precedente. Allineata in alto sborda solo in basso, dove
          `.stanza-fit` la fa scorrere dentro il set quando è il suo turno. */}
      <div
        ref={fitRef}
        inert={!live}
        data-live={live ? 'true' : 'false'}
        data-scrolls={scrolls ? 'true' : 'false'}
        className="stanza-fit grid h-full w-full content-start gap-y-[20px] pt-[72px] pb-[max(24px,env(safe-area-inset-bottom,0px))] md:grid-cols-[5fr_7fr] md:content-center md:items-center md:gap-x-[clamp(32px,5vw,96px)] md:gap-y-[34px] md:py-[calc(var(--pad)+56px)]"
      >
        {/* Chi siamo. Il marchio prende la luce di taglio; sotto, i nomi veri:
            LockVFX è un nome collettivo, non una società, e si deve vedere. */}
        <div className="order-2 flex items-center gap-[16px] md:order-1 md:flex-col md:items-start md:gap-[28px]">
          {/* Il colore sta sul contenitore: il fotogramma rosso della
              chiusura è del marchio intero, non della sola staffa. */}
          <span ref={markRef} className="shrink-0 text-ink">
            <Mark size={markH} mode={closed ? 'solid' : 'outline'} shackleRef={shackleRef} />
          </span>
          <div className="flex flex-col gap-[7px] text-[14px] md:gap-[10px] md:text-[16px]">
            {PEOPLE.map((person) => (
              <div key={person.email}>
                <span className="font-medium">{person.name}</span>
                <span className="mx-2 text-stone">—</span>
                <a
                  href={`mailto:${person.email}`}
                  className="text-stone transition-colors duration-[var(--f5)] hover:text-crimson"
                >
                  {person.email}
                </a>
              </div>
            ))}
            <div className="mt-1 text-t4 text-stone">
              {t('contact.city')} ·{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className="transition-colors duration-[var(--f5)] hover:text-crimson"
              >
                {CONTACT.email}
              </a>
            </div>
          </div>
        </div>

        {/* Parliamone. */}
        <div className="order-1 flex w-full max-w-[640px] flex-col gap-[16px] md:order-2 md:gap-[34px]">
          <h2 className="u-display text-d2 m-0">
            {t('contact.title')}
          </h2>

          <form
            noValidate
            onSubmit={onSubmit}
            className="grid grid-cols-1 gap-[22px] md:grid-cols-2 md:gap-x-8 md:gap-y-[44px]"
          >
            <Field
              id={`${uid}-name`}
              name="name"
              label={t('contact.fields.name')}
              error={t('contact.errors.name')}
              value={values.name}
              invalid={invalid.name}
              disabled={locked}
              autoComplete="name"
              inputRef={nameRef}
              onValue={setValue}
              onFieldBlur={onFieldBlur}
              onFieldFocus={onFieldFocus}
            />
            <Field
              id={`${uid}-email`}
              name="email"
              label={t('contact.fields.email')}
              error={t('contact.errors.email')}
              value={values.email}
              invalid={invalid.email}
              disabled={locked}
              type="email"
              autoComplete="email"
              inputRef={emailRef}
              onValue={setValue}
              onFieldBlur={onFieldBlur}
              onFieldFocus={onFieldFocus}
            />
            <Field
              id={`${uid}-message`}
              name="message"
              label={t('contact.fields.message')}
              error={t('contact.errors.message')}
              value={values.message}
              invalid={invalid.message}
              disabled={locked}
              multiline
              inputRef={messageRef}
              onValue={setValue}
              onFieldBlur={onFieldBlur}
              onFieldFocus={onFieldFocus}
            />

            {/* Honeypot: chi lo compila non è una persona. Fuori dal tab e
                invisibile agli screen reader, mai `display: none` (i bot lo
                saltano). */}
            <label className="absolute left-[-9999px] h-px w-px overflow-hidden opacity-0" aria-hidden="true">
              {t('contact.honeypot')}
              <input ref={hpRef} name="company" tabIndex={-1} autoComplete="off" />
            </label>

            <label
              className={clsx(
                'col-span-full flex items-start gap-3 text-[13px] leading-[1.45] text-stone md:text-[14px] md:leading-[1.5]',
                !locked && 'cursor-pointer'
              )}
            >
              <input
                ref={consentRef}
                type="checkbox"
                name="consent"
                checked={consent}
                disabled={locked}
                onChange={(event) => {
                  setConsent(event.currentTarget.checked);
                  setConsentInvalid(false);
                }}
                className={clsx(
                  'mt-1 h-[14px] w-[14px] flex-none appearance-none rounded-[1px] border transition-colors duration-[var(--f2)]',
                  !locked && 'cursor-pointer',
                  consent ? 'border-ink bg-ink' : consentInvalid ? 'border-crimson' : 'border-stone'
                )}
              />
              <span>
                {t('contact.consent.before')}
                <button
                  type="button"
                  onClick={openPrivacy}
                  className="text-ink underline underline-offset-[3px] transition-colors duration-[var(--f5)] hover:text-crimson"
                >
                  {t('contact.consent.link')}
                </button>
                {t('contact.consent.after')}
              </span>
            </label>

            <div className="col-span-full flex min-h-11 flex-col-reverse items-stretch gap-3 md:min-h-12 md:flex-row md:items-center md:gap-6 md:justify-between">
              <p
                aria-live="polite"
                className={clsx(
                  'm-0 text-[13px] text-stone transition-opacity duration-[var(--f5)] md:text-[14px]',
                  statusText ? 'opacity-100' : 'opacity-0'
                )}
              >
                {statusText}
                {status === 'failed' ? (
                  <>
                    {' '}
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="text-ink underline underline-offset-[3px] transition-colors duration-[var(--f5)] hover:text-crimson"
                    >
                      {CONTACT.email}
                    </a>
                  </>
                ) : null}
              </p>
              <button
                type="submit"
                disabled={locked}
                className={clsx(
                  'u-cap h-[44px] min-w-[150px] px-[26px] transition-colors duration-[var(--f5)] md:h-[46px]',
                  status === 'sent'
                    ? 'bg-transparent text-ink ring-1 ring-stone/40 ring-inset'
                    : 'bg-ink text-void hover:bg-white',
                  status === 'sending' && 'cursor-default opacity-60'
                )}
              >
                {status === 'sending'
                  ? t('contact.sending')
                  : status === 'sent'
                    ? t('contact.sent')
                    : t('contact.send')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

type FieldProps = {
  id: string;
  name: FieldName;
  label: string;
  error: string;
  value: string;
  invalid: boolean;
  disabled: boolean;
  multiline?: boolean;
  type?: 'text' | 'email';
  autoComplete?: string;
  inputRef: RefObject<HTMLInputElement | null> | RefObject<HTMLTextAreaElement | null>;
  onValue: (name: FieldName, value: string) => void;
  onFieldBlur: (name: FieldName, value: string) => void;
  onFieldFocus: (event: FocusEvent<HTMLElement>) => void;
};

/**
 * Un campo: etichetta cap sopra, solo il bordo inferiore, il messaggio
 * d'errore in posizione assoluta sotto — così accendere un errore non fa
 * saltare le righe sotto di lui.
 */
function Field({
  id,
  name,
  label,
  error,
  value,
  invalid,
  disabled,
  multiline,
  type = 'text',
  autoComplete,
  inputRef,
  onValue,
  onFieldBlur,
  onFieldFocus,
}: FieldProps) {
  const messageId = `${id}-error`;
  const control = clsx(
    'w-full rounded-none border-0 border-b bg-transparent px-0 pt-2 pb-[10px] text-[16px] text-ink',
    'outline-none transition-colors duration-[var(--f5)] disabled:cursor-default',
    invalid ? 'border-crimson' : 'border-stone/28 focus:border-crimson'
  );

  const shared = {
    id,
    name,
    value,
    disabled,
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? messageId : undefined,
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onFieldBlur(name, event.currentTarget.value),
    onFocus: onFieldFocus,
  };

  return (
    <label className={clsx('relative flex flex-col gap-[14px]', multiline && 'col-span-full')}>
      <span className="u-cap text-stone">{label}</span>
      {multiline ? (
        <textarea
          {...shared}
          ref={inputRef as RefObject<HTMLTextAreaElement | null>}
          rows={1}
          // Una riga sola sul telefono, due da 768 in su; al focus si apre
          // alla seconda. È l'unico modo di stare in 660 px senza togliere
          // niente: il campo si allarga quando serve, cioè quando ci si
          // scrive dentro.
          className={clsx(control, 'min-h-11 resize-none focus:min-h-16 md:min-h-16')}
          onChange={(event) => {
            const el = event.currentTarget;
            onValue(name, el.value);
            // Cresce col contenuto e si ferma: su schermi corti prima,
            // perché la stanza deve restare dentro 100svh.
            const style = getComputedStyle(el);
            const line = parseFloat(style.lineHeight) || 25;
            const rows = window.matchMedia(MOBILE).matches ? ROWS.maxCompact : ROWS.max;
            const max = line * rows + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, max)}px`;
          }}
        />
      ) : (
        <input
          {...shared}
          ref={inputRef as RefObject<HTMLInputElement | null>}
          type={type}
          inputMode={type === 'email' ? 'email' : undefined}
          autoComplete={autoComplete}
          className={clsx(control, 'min-h-11')}
          onChange={(event) => onValue(name, event.currentTarget.value)}
        />
      )}
      {/* Spento vuol dire assente: invisibile ma leggibile da uno screen
          reader sarebbe un errore annunciato che non c'è. */}
      <span
        id={messageId}
        aria-hidden={!invalid || undefined}
        className={clsx(
          'absolute top-full left-0 mt-2 text-t4 text-stone transition-[opacity,transform] duration-[var(--f5)] ease-[var(--ease-arrive)]',
          invalid ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
        )}
      >
        {error}
      </span>
    </label>
  );
}
