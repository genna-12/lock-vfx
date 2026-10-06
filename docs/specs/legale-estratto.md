# Handoff Legale — estratto per chi implementa (fase 1, 7/9; dati veri 8–9/9)

*Il documento completo è `claude/handoff-legale.md` nel Project. Qui solo ciò che serve al codice. "Non sono un avvocato né un commercialista: materiale preparatorio da far validare."*

## §1 — Blocco legale del footer (L1) 🔒

Obbligo: art. 35 c.1 D.P.R. 633/1972 (P. IVA in home page) + art. 7 D.Lgs. 70/2003 (nome, contatto). Due professionisti con P. IVA separate: **entrambe in chiaro**, con **nome e cognome** reali, un'email di contatto (quella **collettiva**, unica del sito), link alla privacy. Basta il footer, raggiungibile da ogni punto.

Testo (la forma la ritocca il Testi; la sostanza no):

```
LockVFX è il nome collettivo con cui Denis Ruscitti e Nicholas Pantieri
presentano i propri lavori. Non è una società: ciascuno opera con la propria
partita IVA e in proprio.

Denis Ruscitti — P. IVA 04397621204
Nicholas Pantieri — P. IVA 02829650395

Privacy policy
© 2026 LockVFX
```

🔒 Non toccabile: la formula «non è una società: ciascuno opera con la propria partita IVA e in proprio», i due nomi per esteso, i due numeri. Mai "studio", "società", "collettivo di produzione", "founded by". **Niente email personali, niente città, niente ruoli** (decisione della Direzione, 9/9 — ticket R23). L'indirizzo collettivo vero manca ancora: finché non arriva, il segnaposto `info@…` resta un segnaposto dichiarato.

## §2 — Form contatti (L2, L3) 🔒

Base giuridica art. 6.1.b GDPR: **nessun consenso**, solo **presa visione** (checkbox non pre-flaggata, obbligatoria, mai la parola "acconsento"). Informativa **prima** dell'invio, in it e en. Honeypot sì, captcha no.

Checkbox — it: «Ho letto l'informativa privacy e so che questi dati verranno usati solo per rispondermi.» · en: «I have read the privacy notice and understand my data will be used only to reply to me.»

Informativa breve (nel `<dialog>` `#privacy`, in testa; cinque elementi non rimovibili: dati, finalità unica, 24 mesi, EmailJS, canale per i diritti):

it — «I dati che ci lasci (nome, email, messaggio) li usiamo solo per risponderti. Non finiscono in nessuna newsletter e non li cediamo a nessuno. Li conserviamo per 24 mesi dall'ultimo scambio, poi li cancelliamo. L'email viene inoltrata alle nostre caselle tramite EmailJS. Puoi chiederci in qualsiasi momento di accedere ai tuoi dati o di cancellarli scrivendo a [email]. Dettagli nell'informativa completa.»

en — «We use what you send us (name, email, message) only to reply. No newsletter, no sharing with third parties. We keep it for 24 months after our last exchange, then delete it. Your message is delivered to our inboxes through EmailJS. You can ask us to access or delete your data at any time at [email]. Full details in the privacy notice.»

## §3 — EmailJS

Responsabile del trattamento (Singapore, trasferimento USA con SCC): va dichiarato (già nella riga dell'informativa breve). Nel pannello EmailJS: **allowlist del dominio** e limite giornaliero.

## §5 — Cosa non serve

**Nessun banner cookie** (solo `localStorage` lingua e `sessionStorage` loader, strumenti tecnici) — vale finché non entrano analytics, embed YouTube/Vimeo, font Google o reCAPTCHA: i link ai video completi sono **link, non embed**. Accessibilità: WCAG 2.2 AA come riferimento di qualità, non obbligo.
