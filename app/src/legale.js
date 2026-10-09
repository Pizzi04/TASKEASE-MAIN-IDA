/* ---- Dati legali di chi gestisce TaskEase: si compilano SOLO qui, e valgono in tutti i documenti ----
   Finché un campo resta tra [parentesi], i documenti mostrano il segnaposto e l'avviso "Bozza". */
export const TITOLARE = {
  nome: "[Nome e cognome o ragione sociale]",
  piva: "[11 cifre]",
  indirizzo: "[indirizzo]",
  citta: "Forlì (FC)",
  email: "[email di contatto]",
  telefono: "[numero]",
  whatsapp: "[numero WhatsApp]",
};
export const titolareCompleto = Object.values(TITOLARE).every(v => !/^\[.*\]$/.test(v));
