# TaskEase · app vera (Next.js + Supabase)

L'app completa, collegata al database Supabase del progetto `taskease` (Francoforte, UE).

## Avvio

```bash
cp .env.example .env.local   # poi completa i valori (vedi sotto)
npm install
npm run dev                  # http://localhost:3000
npm test                     # 50 test sulle regole (telefono, CF, P.IVA, orari, IDA, contatti, ordine dei risultati)
npm run build                # controllo completo prima di pubblicare
```

## Cosa fa

| Area | Schermate |
|---|---|
| Accesso | `/accedi` (numero + codice SMS), `/profilo/nuovo` (nome, zona, consenso, “cerco” o “lavoro”) |
| Cliente | Home con selettore **Cerco · Lavoro**, `/cerca` (categorie, zone, ordine per vicinanza/prezzo/IDA), scheda del professionista, prenotazione con orari liberi |
| Prenotazioni | Conferma, rifiuto, **proposta di altro orario**, annullamento con motivo, lavoro fatto, chat in tempo reale, giudizio IDA a 5 voci, risposta al giudizio |
| Bacheca | Richieste pubbliche in zona (con foto), proposte dei professionisti, “prenota” dalla proposta |
| Lavoro | Crea/modifica scheda (privato o P.IVA, impianti solo con abilitazione), dati fiscali privati, disponibilità, verifica d'identità, giudizi ricevuti |
| Profilo | Modifica con foto, pausa, preferiti, bloccati, passaporto di quartiere, notifiche, **scarica i miei dati**, elimina account |
| Sicurezza | Segnalazioni (DSA) su profili, giudizi, richieste, messaggi e lavori; esito motivato a entrambe le parti |
| Amministrazione | `/admin`: numeri (anonimi), segnalazioni da decidere, verifiche d'identità, account sospesi |
| Telefono | Installabile (PWA), pagina offline, notifiche push |
| Documenti | `/legale/termini`, `privacy`, `giudizi`, `ranking`, `sicurezza`, `info` |

## Regole che stanno nel database (non aggirabili dall'app)

- Ognuno vede e modifica solo ciò che gli spetta (regole di sicurezza su ogni tabella, provate con utenti simulati).
- L'**IDA** lo calcola il database: pesi 20/30/20/15/15, ultimi 12 mesi pieni, 12–24 mesi a metà, ricalcolo ogni notte. Nessuno può scriverlo a mano.
- Si giudica solo un lavoro completato, una volta. Chi lavora risponde una volta.
- Lo stesso orario non si prenota due volte; serve almeno un'ora di anticipo; massimo 30 giorni.
- L'**indirizzo** lo vede chi lavora solo dopo aver confermato. Il telefono non lo vede nessun utente.
- Niente telefono/email nelle richieste in bacheca. Chi è bloccato non può prenotarti né scriverti.
- Idraulica ed elettricità solo con Partita IVA e abilitazione dichiarata. Per lavorare servono 18 anni.
- Dati fiscali visibili solo all'interessato e agli amministratori; dopo l'eliminazione dell'account restano in un archivio non accessibile dall'app (obbligo fiscale).
- Le migrazioni sono in `supabase/migrations/` (in ordine).

## Da configurare (una volta)

1. **SMS di prova** — Supabase → Authentication → Sign In / Providers → Phone: attiva, provider Twilio con valori qualsiasi, *Test Phone Numbers* `393331234567=123456`.
2. **Chiave segreta** — Supabase → Settings → API Keys → *Secret key* → in `.env.local` come `SUPABASE_SECRET_KEY` (serve per eliminare account e inviare push). Mai su GitHub.
3. **Diventare amministratore** — Supabase → SQL Editor:
   `insert into public.amministratori (utente) select id from auth.users where phone = '393331234567';`
4. **Notifiche push** (dopo la pubblicazione online) — Supabase → Database → Webhooks → nuovo: tabella `notifiche`, evento *Insert*, URL `https://<tuo-dominio>/api/push`, header `x-webhook-secret` = `PUSH_WEBHOOK_SECRET`.
5. **Dati legali** — compila `lib/legale.ts` (titolare, P.IVA, contatti): finché mancano, i documenti mostrano “Bozza”.
6. **SMS veri** — account Twilio (SID, token, mittente) in Supabase → Phone provider.
7. **Regola doppia** — applica a mano `supabase/migrations/18_audit_f3_regola_doppia_profili.sql` (Supabase → SQL Editor): cancella un doppione, non cambia i permessi.
8. **Manutenzione notturna** — su Vercel imposta `CRON_SECRET`; `vercel.json` chiama `/api/manutenzione` ogni notte (tempi di conservazione dell'informativa, foto di post rimossi, account inattivi).
9. **Protezione SMS (obbligatoria prima del lancio)** — Cloudflare → Turnstile → nuovo sito: chiave *site* in `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, chiave *secret* in Supabase → Authentication → Attack Protection → CAPTCHA (Turnstile). In Twilio → Messaging → Geo Permissions lascia solo l'Italia. In Supabase → Authentication → Rate Limits abbassa gli SMS all'ora (per esempio 30).

## Regole aggiunte dopo l'audit

- Dopo l'orario nessuno può annullare. Il lavoro lo segna fatto il professionista o il cliente; senza nessuno, si completa da solo dopo 48 ore. Il cliente può dire “non si è presentato” (apre una segnalazione).
- Le richieste mai confermate si chiudono da sole quando l'orario passa (cron ogni 30 minuti).
- Nell'IDA conta solo l'ultimo giudizio di ogni cliente per la stessa persona.
- Limiti: 2 richieste in attesa verso la stessa persona e 5 in tutto, 5 post al giorno, 20 messaggi al minuto, 10 segnalazioni al giorno e una sola aperta per lo stesso contenuto.
- Un account sospeso non giudica; lo stato “sospeso” degli altri non è leggibile.
- Codice fiscale controllato anche nel database; massimo 20 foto per persona.

## Pubblicare online

Vercel (gratis per iniziare): importa il repository, cartella `web`, e copia le variabili di `.env.local` in *Environment Variables*. Poi in Supabase → Authentication → URL Configuration metti l'indirizzo del sito.
