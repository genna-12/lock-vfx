# 007 — Il sito esce anche senza materiali (9/10)

**Contesto.** A due giorni dal lancio non sono arrivati testi, master né autorizzazioni dei clienti; in produzione si vedevano «[Nome] e [Nome]» e tre lavori finti, e la Sala con zero lavori si rompeva.

**Decisione.** Ogni contenuto mancante sparisce invece di mostrare un segnaposto, e ricompare da solo quando arriva:
- nomi interpolati da `PEOPLE` (`src/data/people.ts`); crediti dello Statement = solo i due nomi (niente ruoli né città, coerente con R23);
- paragrafo "chi siamo" e bio (`landing.persone.bio.<id>`) non si rendono se vuoti;
- lavori: un lavoro va online solo con `rights: 'cleared'`; con zero lavori la Sala mostra un cartello («La prima selezione è in arrivo.» + CTA alla Stanza) nella stessa cornice, senza toccare la carrellata;
- `VITE_WORKS_DEMO=on` mostra i tre esempi `pending` solo nei build locali di sviluppo e QA. **Mai in produzione.**

**Scartato.** Togliere la Sala dalla pagina: cambierebbe gli HOLD della carrellata (ADR 001, 005) a due giorni dal lancio.

**Conseguenze.** Il lancio dipende solo dall'informativa privacy (Legale) e dalle variabili. I testi del cartello (`sala.empty.*`) sono bozze di cornice da far vedere al canale Testi.
