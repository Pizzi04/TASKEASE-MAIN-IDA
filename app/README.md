# TaskEase · anteprima

L'anteprima dell'app in un unico file HTML (`dist/index.html`) che si apre nel browser senza internet: React e i caratteri sono già dentro il file.

## Comandi

```bash
npm install          # la prima volta
npm run build        # crea dist/index.html
npm test             # crea dist/index.html e prova i percorsi principali
```

Per i test serve Chromium per Playwright. Sul tuo computer, una volta sola: `npx playwright install chromium`.

## Dove mettere le mani

| File | Cosa contiene |
|---|---|
| `src/taskease-app.jsx` | Le schermate e la navigazione |
| `src/tema.js` | Colori (tema "notte e ocra") e livelli IDA |
| `src/stile.js` | Il CSS |
| `src/dati.js` | Regole IDA, profili di esempio, recensioni, bacheca, date |
| `src/legale.js` | **Dati legali di chi gestisce TaskEase: da compilare prima di far provare l'app** |
| `build/` | Script di build e caratteri (set latino) |
| `tests/` | Test dei percorsi: apertura senza rete, prenotazione, salvataggio, giudizio, ricerca, codice fiscale, contrasto, "Ricomincia" |

## Cosa fa l'anteprima

- Salva nel browser (localStorage) profilo, prenotazioni, giudizi, preferiti e bacheca: ricaricando si riprende da dove si era. Profilo → "Ricomincia l'anteprima" cancella tutto.
- È tutto simulato: il codice SMS è sempre `123456`, la verifica d'identità, le risposte in chat e la conferma dei professionisti sono finte.
- Il codice fiscale è controllato per intero, compreso il carattere di controllo finale.
- Con "riduci movimento" attivo sul telefono le animazioni si spengono.
