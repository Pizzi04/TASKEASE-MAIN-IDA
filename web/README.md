# TaskEase · app vera (Next.js + Supabase)

Modulo 1: **accesso con SMS e profilo**. Il resto dell'app arriverà un modulo alla volta.

## Avvio

```bash
cp .env.example .env.local   # URL e chiave pubblica del progetto Supabase "taskease"
npm install
npm run dev                  # http://localhost:3000
npm test                     # test delle regole (telefono, codice, nome, zona, consenso)
```

## Cosa c'è

| File | Cosa fa |
|---|---|
| `app/accedi/` | Numero di telefono → codice SMS → dentro |
| `app/profilo/nuovo/` | Nome, zona, consenso a termini e privacy (salvato con versione e data) |
| `app/page.tsx` | Home minima: il tuo profilo ed "Esci" |
| `app/esci/route.ts` | Chiude la sessione |
| `proxy.ts` | Rinfresca la sessione a ogni pagina (in Next 16 `middleware` si chiama `proxy`) |
| `lib/validazione.ts` | Regole dei campi, usate da pagine e server |
| `lib/supabase/` | Client Supabase per browser e server |

## Database (già creato su Supabase)

- `profili`: nome, zona, ruolo. Ognuno legge e modifica solo il suo (RLS).
- `consensi`: cosa ha accettato l'utente, versione e quando. Non si modifica né cancella.
- Il telefono resta solo in `auth.users`, non viene copiato.

## Numeri di prova (senza SMS veri)

Supabase → Authentication → Sign In / Providers → **Phone**:
1. Attiva "Enable Phone provider".
2. Provider SMS: scegli Twilio e metti valori qualsiasi (con i soli numeri di prova non parte nessun SMS).
3. "Test Phone Numbers and OTPs": `393331234567=123456`.
4. Salva. Ora con 333 123 4567 il codice è sempre 123456.

Per gli SMS veri servirà un account Twilio (o Vonage/MessageBird) con SID, token e mittente.
