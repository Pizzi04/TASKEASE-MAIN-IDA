# TaskEase · piano di lancio (Forlì-Cesena)

Stato: ottobre 2026. L'app vera è pronta in `web/`. Questo documento copre quello che manca **fuori dal codice** per farla usare a persone vere.
Le cifre fiscali sono indicazioni per preparare l'incontro con il commercialista, non consulenza: vanno confermate.

---

## 1. Prima di far entrare la prima persona (checklist)

### Tecnico (1–2 giorni)
- [ ] Supabase: attivare il provider **Phone** con Twilio vero (SID, token, numero mittente). Costo indicativo: pochi centesimi per SMS.
- [ ] Supabase: passare al piano **Pro** (25 $/mese) prima del lancio. Il piano gratuito mette in pausa il progetto dopo 7 giorni senza traffico e non ha backup giornalieri.
- [ ] Pubblicare su Vercel (cartella `web`), dominio `taskease.it` o simile, variabili d'ambiente copiate da `.env.local`.
- [ ] Supabase → Authentication → URL Configuration: indirizzo del sito.
- [ ] Webhook delle notifiche push (vedi `web/README.md`, punto 4).
- [ ] Renderti amministratore (README, punto 3) e provare il pannello `/admin`.
- [ ] Limite di invio SMS per numero (Supabase → Auth → Rate limits) per evitare abusi e costi.

### Legale (da fare con un avvocato o un consulente privacy, mezza giornata)
- [ ] **Titolare**: compilare `web/lib/legale.ts` (nome o ragione sociale, P.IVA, sede, email, WhatsApp). Finché manca, i documenti mostrano “Bozza”.
- [ ] **Privacy (GDPR)**: registro dei trattamenti; accordi con i fornitori (DPA): Supabase (dati in UE, Francoforte), Vercel, Twilio. Twilio tratta dati fuori UE: serve la base per il trasferimento (clausole standard o Data Privacy Framework).
- [ ] **DSA**: già presenti nell'app il punto di contatto, il tasto “Segnala” con le motivazioni delle decisioni (art. 16–17) e i termini (art. 14). Come micro o piccola impresa, TaskEase è esente dagli obblighi più pesanti (artt. 19 e 29), compreso il controllo dei venditori dell'art. 30. Da riverificare se si cresce.
- [ ] **Impianti (DM 37/2008)**: l'app permette idraulica ed elettricità solo a chi dichiara P.IVA e abilitazione. Far rileggere ai legali la frase di dichiarazione e la responsabilità.
- [ ] **Termini**: far rileggere il testo in `web/lib/legale.ts`, soprattutto “non siamo datore di lavoro” e il foro dei consumatori.

### Fiscale (incontro con il commercialista)
Domande da portare:
1. **Che forma per TaskEase?** Ditta individuale in **regime forfettario** finché i ricavi restano sotto gli 85.000 €/anno. Codice ATECO probabile 63.12 (portali web) o 62.01. Coefficiente di redditività circa 67%. Imposta sostitutiva 5% per i primi 5 anni se è una nuova attività (poi 15%). Contributi INPS alla gestione separata, circa il 26% del reddito imponibile.
2. **DAC7**: le piattaforme che mettono in contatto prestatori di servizi personali devono comunicare all'Agenzia delle Entrate i dati di chi lavora e quanto ha incassato. L'app raccoglie già CF, data di nascita, residenza e P.IVA. **Il punto da chiarire**: TaskEase non incassa i pagamenti, quindi cosa va comunicato come “corrispettivo”? Basta la stima ore × tariffa? Serve chiedere a chi lavora l'importo finale?
3. **Chi lavora da privato**: prestazione occasionale. Niente ritenuta d'acconto quando paga un privato. Sopra i 5.000 € l'anno di compensi scattano i contributi INPS. Ha senso un avviso nell'app quando qualcuno si avvicina a quella soglia?
4. **Abbonamento Pro** (se lo scegli, sezione 3): in forfettario non si applica l'IVA. Per le vendite tramite gli store di Apple e Google (che trattengono il 15–30%) come si fattura? Per ora l'app è installabile dal sito, quindi gli store non servono.

---

## 2. Come trovare i primi utenti (in quest'ordine)

Un marketplace muore vuoto. **Prima i professionisti, poi i clienti, in 2 quartieri e non in tutta la provincia.**

### Fase A · 20 professionisti in Centro e Ronco (settimane 1–4)
- Andare di persona: ferramenta, colorifici, mercato del sabato in piazza Saffi. Volantino con QR: “Ti mandiamo clienti in zona, non prendiamo commissioni”.
- Gruppi Facebook di quartiere e “Sei di Forlì se…”: post dei professionisti stessi, non pubblicità.
- Fare la **verifica d'identità** subito, all'incontro di persona: è anche il momento per spiegare l'IDA.
- Obiettivo: almeno 3 persone disponibili per ognuna delle 6 categorie principali nei 2 quartieri.

### Fase B · 100 clienti negli stessi quartieri (settimane 4–8)
- Gruppi Facebook e WhatsApp di condominio e di quartiere, parrocchie, centri anziani (soprattutto per i figli che cercano aiuto per i genitori).
- Amministratori di condominio: 3–5 incontri. Gestiscono decine di piccoli lavori e sono anche il cliente B2B del modello C (sezione 3).
- Promessa semplice: “Chi viene a casa tua è verificato, e lo giudicano solo i vicini che l'hanno davvero chiamato.”

### Fase C · allargare (dal mese 3)
Solo quando, nei primi 2 quartieri, almeno 7 ricerche su 10 trovano 3 persone disponibili. Poi Saffi, Cava, e Cesena come seconda città.

---

## 3. Tre modi di guadagnare (diversi tra loro)

Ipotesi comuni: tu in regime forfettario (niente IVA in fattura, imposta 5% sul 67% dei ricavi, INPS circa 26% sul 67%). Pagamenti con Stripe: circa 1,5% + 0,25 € per carta europea. **Le stime di costo di acquisizione (CAC) sono ipotesi da verificare nei primi 90 giorni.**

### A · Abbonamento “Pro” per chi lavora (9 €/mese)
- **Chi paga**: il professionista con P.IVA che lavora tanto.
- **Quando percepisce il valore**: dopo 2–3 lavori arrivati da TaskEase. Gli strumenti Pro: preventivi in app, agenda esportabile, statistiche, pagina pubblica da condividere su WhatsApp. **Mai** posizione nei risultati o IDA (è nei Termini).
- **Conti per 100 abbonati**: 10.800 €/anno incassati, circa 7.240 € imponibili, circa 360 € di imposta (5%) e circa 1.890 € di INPS. **Restano circa 8.500 €.** Se fossi in regime ordinario: 9 € IVA inclusa = 7,38 € netti al mese.
- **CAC stimato**: 20–40 € a professionista (tempo di persona + volantini), recuperato in 3–5 mesi.
- **Perché può fallire**: a Forlì chi lavora bene ha già troppo lavoro col passaparola e non paga per averne altro. Pagano quelli che ne hanno poco, cioè non i migliori. Servono 2–3 lavori garantiti prima di chiedere soldi: la decisione va presa dopo le 10 domande ai professionisti (rimandate a fine progetto, come chiesto).

### B · Piccola tariffa di servizio al cliente con pagamento in app (1,90 € a prenotazione)
- **Chi paga**: il cliente, solo se il lavoro viene fatto. Paga in app e i soldi vanno a chi lavora tramite Stripe Connect.
- **Quando percepisce il valore**: al momento del lavoro (niente contanti, ricevuta, protezione se chi lavora non si presenta).
- **Conti per 300 lavori al mese**: 570 € al mese di tariffe, meno circa 0,30 € di Stripe sulla tariffa. Restano circa 480 € al mese, circa 5.700 € l'anno prima di imposta e INPS.
- **CAC stimato**: 5–10 € a cliente (gruppi locali, passaparola).
- **Perché può fallire**: cambia la promessa di oggi (“TaskEase non tocca i soldi”). Per i lavori piccoli molti preferiranno i contanti e si accorderanno in chat fuori dall'app. Richiede anche termini e assistenza per rimborsi e contestazioni.

### C · Convenzioni B2B con amministratori di condominio e gestori di affitti brevi (49–99 €/mese a cliente)
- **Chi paga**: chi gestisce molti immobili e ha bisogno di interventi rapidi e documentati. A Forlì: amministratori. Sulla costa vicina (Cesenatico, Gatteo): gestori di affitti brevi tra un ospite e l'altro.
- **Quando percepisce il valore**: al primo guasto risolto in giornata con storico, foto e giudizio, da mostrare ai condòmini o al proprietario.
- **Conti per 15 clienti a 69 €/mese**: 12.420 €/anno. **Restano circa 9.800 €** dopo imposta e INPS (stesso calcolo di A).
- **CAC stimato**: 5–10 incontri per firmare un contratto, quindi soprattutto il tuo tempo. Ciclo di vendita da 1 a 3 mesi.
- **Perché può fallire**: gli amministratori hanno già i loro artigiani di fiducia e cambiano lentamente. Inoltre servono funzioni nuove (più immobili per account, fatturazione mensile, report).

**Consiglio**: partire senza far pagare. Dopo i primi 90 giorni scegliere **A o C** in base ai numeri. B solo se i clienti chiedono di pagare in app.

---

## 4. Cosa misurare (pannello `/admin`, dati anonimi)

| Numero | Dove | Soglia “funziona” |
|---|---|---|
| Ricerche che trovano ≥3 persone disponibili in zona | ricerca + professionisti | > 70% |
| Richieste confermate o con nuovo orario proposto | prenotazioni per stato | > 60% |
| Prenotazioni che arrivano a “completata” | arrivano in fondo | > 50% |
| Lavori completati con giudizio | giudizi / completate | > 60% |
| Clienti che tornano (2+ lavori) | clienti tornati | > 25% a 60 giorni |
| Professionisti con almeno 1 lavoro al mese | prenotazioni | > 50% degli iscritti |
| Accessi iniziati → profili creati | percorso | > 60% (altrimenti SMS o modulo da sistemare) |

---

## 5. Rischi principali e cosa fare

| Rischio | Segnale | Risposta |
|---|---|---|
| **App vuota** (pochi professionisti) | ricerche senza risultati | restare in 2 quartieri; usare la bacheca come rete di sicurezza |
| **Si accordano fuori dall'app** dopo il primo contatto | prenotazioni ferme, chat attive | è accettato: il valore è l'IDA, che cresce solo con le prenotazioni in app. Ricordarlo a chi lavora |
| **Giudizi falsi** | stesse persone che si giudicano a vicenda | il database già vieta giudizi senza lavoro completato; controllare in `/admin` chi completa molti lavori con lo stesso cliente |
| **Incidente in casa di un cliente** | segnalazione grave | sospensione immediata dal pannello, numero 112 sempre visibile, chiedere l'assicurazione RC a chi fa lavori rischiosi |
| **Lavori su impianti senza abilitazione** | segnalazioni “lavoro fatto male” su idraulica/elettricità | sospensione e controllo della visura camerale |
| **Costi SMS gonfiati da bot** | picchi di “accessi iniziati” senza profili | limiti di invio in Supabase, CAPTCHA se serve |
| **Supabase gratuito in pausa** | sito che non risponde dopo giorni senza traffico | piano Pro prima del lancio |

---

## 6. Piano a 90 giorni

| Settimane | Obiettivo | Fatto quando |
|---|---|---|
| 1 | Configurazione (sezione 1), commercialista, testi legali | documenti senza “Bozza”, SMS veri attivi |
| 2–4 | 20 professionisti verificati in Centro e Ronco | 3+ per categoria principale |
| 4–6 | primi 50 clienti, 30 lavori completati | arrivano almeno 15 giudizi |
| 6–8 | 100 clienti; prima convenzione con un amministratore (prova gratuita) | 1 amministratore attivo |
| 8–10 | **10 domande ai professionisti sul Pro** (rimandate a ora come chiesto) e scelta del modello | decisione A o C scritta |
| 10–12 | 3° e 4° quartiere solo se le metriche della sezione 4 sono sopra soglia | 70% di ricerche con 3+ persone |

---

## 7. Stress test (domande scomode)

1. **Chi è il primo cliente pagante, con nome e cognome?** Oggi non c'è. Il candidato più concreto è un amministratore di condominio di Forlì (modello C).
2. **Perché un artigiano bravo, che ha già troppo lavoro, dovrebbe iscriversi?** Solo se l'IDA gli fa alzare i prezzi o scegliere i clienti. Va dimostrato con i primi 20.
3. **Cosa impedisce a cliente e artigiano di scambiarsi il numero al primo lavoro e sparire?** Niente. L'unico incentivo a restare è l'IDA, quindi deve diventare qualcosa che chi lavora mostra con orgoglio.
4. **Quanto costa portare un cliente che fa 2 lavori l'anno?** Se il CAC supera i 10 € e il modello è A, i conti tornano solo con molti professionisti Pro.
5. **Perché Forlì e non Bologna?** Mercato piccolo, quindi più facile riempirlo, ma con un tetto basso. Va bene come banco di prova, non come mercato finale.
6. **Se arriva una piattaforma nazionale di servizi per la casa, cosa resta?** La verifica di persona e la comunità di quartiere: difendibili solo se si fanno davvero, non solo nell'app.

**Valutazione onesta**: il prodotto oggi è più avanti della domanda. Il rischio principale **non è di prodotto ma di domanda e distribuzione**: va dimostrato che in 2 quartieri esistono abbastanza lavori piccoli e ricorrenti, e professionisti che li vogliono. I primi 90 giorni servono solo a questo.
