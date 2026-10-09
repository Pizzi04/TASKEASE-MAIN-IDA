import { useState, useEffect, useCallback, useRef, Fragment } from "react";

/* ============================================================
   TaskEase — "Bottega digitale"
   Artigianato romagnolo reso digitale.
   Palette: carta + inchiostro caldi · verde petrolio (brand)
            ocra (sigillo IDA · status) · terra di Siena (salvati e segnalazioni)
   Type: Hanken Grotesk (titoli e testo) · Space Mono (numeri) · Fraunces solo nel marchio
   Firma: l'IDA come sigillo di ceralacca.
   ============================================================ */

const T = {
  /* Tema "notte e ocra": tutta l'app sul verde scuro dell'ingresso */
  paper: "#0E1C19",       // fondo delle schermate
  card: "#182B27",        // riquadri
  ink: "#F3EFE6",         // testo principale
  ink2: "#C4CEC9",        // testo secondario
  stone: "#9DB0A9",       // note e didascalie (6:1 sul fondo)
  faint: "#3E5A53",
  line: "#24403A",
  pine: "#245E53",        // sfondo dei pulsanti verdi con testo bianco
  pineSoft: "#1B3A34",
  pineDeep: "#0A1613",
  ochre: "#E6BE80",
  ochreInk: "#E2B672",    // testo ocra sul fondo scuro
  ochreBtn: "#8F6320",    // sfondo dei pulsanti ocra con testo bianco (5.3:1)
  ochreLight: "#E0B676",
  ochreSoft: "#3A2E1A",
  ember: "#E8896A",       // testo di avviso sul fondo scuro
  emberBtn: "#B04A26",    // sfondo dei pulsanti rossi con testo bianco
  emberSoft: "#3B2018",
  rule: "#2A4842",
  ok: "#4FD1A0",          // disponibile, confermato
  cream: "#F6F2EA",       // testo chiaro fisso sopra i riquadri verdi
  accent: "#7FD1BC",      // il verde del marchio usato come testo o icona
};

const LV = {
  diamante: { l: "Maestro", c: "#7FD1BC" },
  oro: { l: "Esperto", c: "#E2B672" },
  argento: { l: "Affidabile", c: "#C4CEC9" },
  crescita: { l: "In crescita", c: "#93A69F" },
  ferro: { l: "Base", c: "#93A69F" },
  bronzo: { l: "Nuovo", c: "#93A69F" },
};

/* ---- Regole IDA v1.0 — identiche al documento pubblico e al calcolo lato server ---- */
const IDA_VOCI = [
  { k: "puntualita", l: "Puntualità", w: 0.20 },
  { k: "qualita", l: "Qualità del lavoro", w: 0.30 },
  { k: "parola", l: "Parola mantenuta", w: 0.20 },
  { k: "pulizia", l: "Pulizia", w: 0.15 },
  { k: "comunicazione", l: "Comunicazione", w: 0.15 },
];
const IDA_MIN_LAVORI = 3;
/* Un giudizio (5 voci da 1 a 5) diventa un punteggio da 20 a 100 */
const scoreFromVoci = (v) => Math.round(IDA_VOCI.reduce((s, x) => s + v[x.k] * x.w, 0) * 20);
/* Il livello si ricava SEMPRE dal numero, mai assegnato a mano */
const lvKeyOf = (ida, giudizi = IDA_MIN_LAVORI) => {
  if (ida == null || giudizi < IDA_MIN_LAVORI) return "bronzo";
  if (ida >= 95) return "diamante";
  if (ida >= 88) return "oro";
  if (ida >= 78) return "argento";
  if (ida >= 60) return "crescita";
  return "ferro";
};

/* Profili DI ESEMPIO: servono a far vedere l'app, non sono persone vere */
const WORKERS_RAW = [
  { id: "w1", n: "Marco Rosetti", ini: "MR", bio: "Idraulico · 11 anni di mestiere", ida: 96, lv: "diamante", pr: 18, d: 1.2, av: true, j: 312, rv: 127, ver: true, sk: ["Idraulica", "Scarichi", "Caldaie"], rsp: "1 ora", zona: "Centro", tipo: "piva", abil: true, rc: true },
  { id: "w2", n: "Sofia Leoni", ini: "SL", bio: "Pulizie profonde · casa e ufficio", ida: 91, lv: "oro", pr: 15, d: 0.8, av: true, j: 201, rv: 89, ver: true, sk: ["Pulizia profonda", "Stiratura"], rsp: "30 min", zona: "Saffi", tipo: "privato" },
  { id: "w3", n: "Luca Marchetti", ini: "LM", bio: "Giardiniere · potatura e cura verde", ida: 82, lv: "argento", pr: 20, d: 3.1, av: false, j: 156, rv: 64, ver: false, sk: ["Potatura", "Prato", "Siepi"], rsp: "2-3 ore", zona: "Cava", tipo: "privato" },
  { id: "w4", n: "Anna Petrini", ini: "AP", bio: "Montaggio mobili · IKEA e su misura", ida: 95, lv: "diamante", pr: 25, d: 2.0, av: true, j: 98, rv: 43, ver: true, sk: ["Montaggio", "Cucine", "Mensole"], rsp: "1 ora", zona: "Ronco", tipo: "piva", rc: true },
  { id: "w5", n: "Elena Ferri", ini: "EF", bio: "Tecnico · PC, WiFi e stampanti", ida: 93, lv: "oro", pr: 30, d: 1.5, av: true, j: 134, rv: 55, ver: true, sk: ["PC", "WiFi", "Stampanti"], rsp: "45 min", zona: "Centro", tipo: "piva" },
  { id: "w6", n: "Davide Conti", ini: "DC", bio: "Elettricista · riparazioni e tuttofare", ida: 88, lv: "oro", pr: 22, d: 2.4, av: true, j: 112, rv: 47, ver: true, sk: ["Elettricità", "Riparazioni", "Tuttofare"], rsp: "1 ora", zona: "Ronco", tipo: "piva", abil: true, rc: true },
];
const WORKERS = WORKERS_RAW.map(w => ({ ...w, lv: lvKeyOf(w.ida, w.rv), demo: true }));

const CATS = [
  { ic: "drop", n: "Idraulica", c: "#7FB0D6", bg: "#1C2B38" },
  { ic: "wrench", n: "Riparazioni", c: "#E2B672", bg: "#3A2E1A" },
  { ic: "broom", n: "Pulizie", c: "#6FC7BC", bg: "#173430" },
  { ic: "chair", n: "Montaggio", c: "#E39A6E", bg: "#3A2419" },
  { ic: "chip", n: "Tecnologia", c: "#AFA0E0", bg: "#29243A" },
  { ic: "leaf", n: "Giardino", c: "#9CCB80", bg: "#22331C" },
];

/* Esempi di come apparirà l'attività in zona — etichettati come tali in home */
const LIVE = [
  "Marco ha chiuso una perdita in zona Centro. 38 minuti.",
  "Sofia ha finito una casa in Centro. «Impeccabile.»",
  "Anna ha montato una cucina a Ronco. 2 ore nette.",
];

const TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
// Calcolati quando si apre la prenotazione, non al caricamento: dopo mezzanotte "Oggi" resta giusto
const makeDays = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  return { k: i, data: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, l: i === 0 ? "Oggi" : i === 1 ? "Domani" : d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" }) };
});

/* Numeri del cliente Piz: UNA sola fonte, così timbri, livello e badge tornano sempre */
const CLIENT_JOBS = 7;
const QUARTIERI = [
  { id: "centro", n: "Centro", x: 49, y: 44, s: 5 },
  { id: "saffi", n: "Saffi", x: 27, y: 34, s: 1 },
  { id: "cava", n: "Cava", x: 71, y: 29, s: 0 },
  { id: "ronco", n: "Ronco", x: 74, y: 60, s: 1 },
  { id: "villa", n: "Villafranca", x: 21, y: 64, s: 0 },
  { id: "buss", n: "Bussecchio", x: 56, y: 73, s: 0 },
  { id: "vecc", n: "Vecchiazzano", x: 83, y: 40, s: 0 },
];
const STAMPS = QUARTIERI.reduce((s, q) => s + q.s, 0);   // = CLIENT_JOBS
const ZONES_ON = QUARTIERI.filter(q => q.s > 0).length;

const BADGES = [
  { n: "Prima volta", ic: "seal", ok: true },
  { n: "Di casa in Centro", ic: "home", ok: true },
  { n: "Giro di Forlì", ic: "compass", ok: true },
  { n: "Forlivese DOC", ic: "star", ok: false, p: `${ZONES_ON}/7 zone` },
  { n: "Tuttofare", ic: "wrench", ok: false, p: "4/6 categorie" },
  { n: "Di lunga data", ic: "trophy", ok: false, p: `${CLIENT_JOBS}/20 lavori` },
];

/* Vantaggi — lato cliente: solo riconoscimento e comodità.
   Nessun vantaggio cambia l'ordine dei risultati o l'IDA di qualcuno. */
const PERKS = { level: "Di casa", jobs: CLIENT_JOBS, nextLevel: "di lunga data", toNext: 20 - CLIENT_JOBS, invited: 2 };
const PERK_LIST = [
  { ic: "heart", t: "Riprenoti in un tocco", s: "Chi ti è piaciuto resta tra i preferiti", ok: true },
  { ic: "book", t: "Lo storico dei tuoi lavori", s: "Chi è venuto, quando e per cosa", ok: true },
  { ic: "star", t: "Badge “Di lunga data”", s: "Solo un riconoscimento: non ti dà corsie preferenziali", ok: false, p: `${CLIENT_JOBS}/20` },
];

/* Abbonamento — facoltativo, slegato dall'IDA. Base gratis, Pro = strumenti extra. */
const PLAN = { name: "Pro", price: 9 };

/* ---- Profilo cliente + lavoratore: STESSA persona, Piz ---- */
/* Cliente esperto (ha già chiesto aiuto) ma lavoratore NUOVO (inizia ora a offrire) */
const ME = {
  n: "Piz", ini: "PZ", zona: "Centro", since: "gennaio 2025",
  ida: null, lv: "bronzo", pr: 20, rv: 0, j: 0, rsp: "—",
  sk: ["Montaggio", "Piccole riparazioni", "Consegne"],
  tipo: null, piva: "", abil: false, rc: false, foto: false,
};
const ME_BASE = { ...ME, sk: [...ME.sk] };
// Apre un documento legale sopra qualunque schermata (lo collega App)
const legale = { apri: () => {} };
// Chi ha un passo interno o un pannello aperto lo registra qui: il tasto indietro del telefono lo usa per primo
const sottoIndietro = { f: [] };
function useIndietro(attivo, fn) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    if (!attivo) return;
    const h = () => ref.current();
    sottoIndietro.f.push(h);
    return () => { sottoIndietro.f = sottoIndietro.f.filter(x => x !== h); };
  }, [attivo]);
}
// Messaggio breve in basso, vicino al dito, per confermare un'azione (lo collega App)
const avviso = { mostra: () => {} };
// Pulsanti attivi solo dopo un attimo: un doppio tocco non preme anche il pulsante della schermata nuova
function usePronto(chiave, ms = 450) { const [ok, setOk] = useState(false); useEffect(() => { setOk(false); const t = setTimeout(() => setOk(true), ms); return () => clearTimeout(t); }, [chiave]); return ok; }
const aD = (n) => /^[aA]/.test(n || "") ? "ad" : "a"; // "ad Anna", "a Marco" // per ripartire da zero dopo "Elimina il profilo"
const MY_PAST = [
  { wid: "w1", task: "Riparazione scarico", date: "2 feb", reviewed: true },
  { wid: "w2", task: "Pulizia profonda casa", date: "24 gen", reviewed: true },
  { wid: "w5", task: "Configurazione WiFi", date: "10 gen", reviewed: false },
];

/* ---- Profilo artigiano (NUOVO: ancora niente lavori) ---- */
const AGENDA = [];
// Orari relativi all'ora attuale: dopo le 15 la richiesta "di oggi pomeriggio" diventa di domani
// Data di oggi nel fuso del telefono (toISOString darebbe quella UTC: sbaglia tra mezzanotte e le 2)
const dataLocale = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// L'etichetta del giorno si ricava dalla data salvata, così "Domani" diventa "Oggi" il giorno dopo
const giornoDi = (b) => {
  if (!b?.data) return b?.day || "";
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
  const [y, m, g] = b.data.split("-").map(Number); const d = new Date(y, m - 1, g);
  const diff = Math.round((d - oggi) / 86400000);
  return diff === 0 ? "Oggi" : diff === 1 ? "Domani" : diff === -1 ? "Ieri" : d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: diff < 0 ? "short" : undefined });
};
const quandoDi = (b) => b?.data && b?.time ? new Date(`${b.data}T${b.time}:00`) : null;
const passata = (b) => { const q = quandoDi(b); return !!q && q < new Date(); };
const ATTIVA = (b) => b.stato === "confermata" || b.stato === "in attesa";
// Una sola regola per "il prossimo appuntamento", usata ovunque
const prossimeDi = (ps = []) => ps.filter(b => ATTIVA(b) && !passata(b)).sort((a, b) => (quandoDi(a) || 0) - (quandoDi(b) || 0));
// "Domani mattina", "Sabato mattina"… → data vera, così in agenda "Oggi" diventa "Ieri" il giorno dopo
const dataDaQuando = (when, time) => {
  const d = new Date(); const w = String(when || "").toLowerCase();
  if (w.startsWith("domani")) d.setDate(d.getDate() + 1);
  else if (!w.startsWith("oggi")) {
    const i = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"].findIndex(g => w.startsWith(g));
    if (i >= 0) { let diff = (i - d.getDay() + 7) % 7; if (diff === 0 && !(time && parseInt(time, 10) > d.getHours())) diff = 7; d.setDate(d.getDate() + diff); }
  }
  return dataLocale(d);
};
const aggiornaRichiesta = (r) => r.when === "Oggi pomeriggio" && new Date().getHours() >= 15 ? { ...r, when: "Domani pomeriggio" } : r;
const makeRequests = () => REQUESTS.map(aggiornaRichiesta);
const REQUESTS = [
  { id: "r1", c: "Laura B.", task: "Montare una libreria", det: "Billy IKEA, 2 colonne. Ho già gli attrezzi.", zona: "Saffi", when: "Oggi pomeriggio", time: "16:00", ore: 2, cat: ["Montaggio mobili", "Piccoli lavori (senza impianti)", "Tuttofare"] },
  { id: "r2", c: "Marco V.", task: "Aiuto per un piccolo trasloco", det: "Qualche scatolone e un divano, secondo piano senza ascensore.", zona: "Centro", when: "Domani mattina", time: "09:30", ore: 3, cat: ["Traslochi", "Consegne", "Tuttofare"] },
  { id: "r3", c: "Franca M.", task: "Tapparella che non scende", det: "Si è bloccata a metà, credo la cinghia. Primo piano.", zona: "Ronco", when: "Domani pomeriggio", time: "15:00", ore: 1, cat: ["Riparazioni", "Piccoli lavori (senza impianti)", "Tuttofare"] },
  { id: "r4", c: "Andrea C.", task: "Rifare le fughe della doccia", det: "Doccia piccola, fughe annerite. Va bene anche sabato.", zona: "Cava", when: "Sabato mattina", time: "10:00", ore: 4, cat: ["Piastrelle e pavimenti", "Muratura e cartongesso", "Tuttofare"] },
  { id: "r5", c: "Silvia T.", task: "Stampante che non si collega", det: "Dopo il cambio del router il PC non la vede più.", zona: "Centro", when: "Domani mattina", time: "11:00", ore: 1, cat: ["Tecnologia / PC"] },
];
/* Il pagamento del lavoro avviene tra le persone, fuori dall'app. */
const MONTH = { jobs: 0, earned: 0 };
const REVIEWS_IN = [];
const wById = (id) => WORKERS.find(w => w.id === id);

/* Colore del mestiere — il sigillo IDA prende la tinta della categoria */
const catColorOf = (w) => {
  if (!w) return null;
  const hay = ((w.sk || []).join(" ") + " " + (w.bio || "")).toLowerCase();
  if (/idraul|scarico|caldaie|tubo/.test(hay)) return "#7FB0D6";
  if (/elettric|riparazion|tuttofare/.test(hay)) return "#E2B672";
  if (/puliz|stiratura/.test(hay)) return "#6FC7BC";
  if (/montagg|mobili|cucine|mensole|conseg/.test(hay)) return "#E39A6E";
  if (/pc|wifi|stampant|rete|tecnico/.test(hay)) return "#AFA0E0";
  if (/giardin|potatura|siepi|prato/.test(hay)) return "#9CCB80";
  return null;
};


/* Recensioni scritte per ciascuna persona — visibili PRIMA di prenotare */
const REVIEWS_BY = {
  w1: [
    { a: "Laura G.", s: 100, t: "Perdita chiusa in mezz'ora, prezzo esatto a quello detto.", when: "3 giorni fa" },
    { a: "Enzo R.", s: 90, t: "Competente e pulito. Solo un filo in ritardo, ma avvisato.", when: "1 settimana fa" },
    { a: "Marta C.", s: 100, t: "Mi ha spiegato il guasto con calma prima di toccare nulla.", when: "2 settimane fa" },
  ],
  w2: [
    { a: "Giorgia P.", s: 100, t: "Casa lasciata splendente, profumava di pulito. Tornerà fissa.", when: "5 giorni fa" },
    { a: "Franco M.", s: 90, t: "Veloce e precisa. Ottima coi vetri.", when: "2 settimane fa" },
  ],
  w3: [
    { a: "Davide L.", s: 80, t: "Siepe sistemata bene. Un po' di confusione sull'orario.", when: "1 settimana fa" },
    { a: "Rita S.", s: 84, t: "Bravo col verde, consigli utili sulle piante.", when: "3 settimane fa" },
  ],
  w4: [
    { a: "Paolo V.", s: 100, t: "Cucina montata a regola d'arte, nessun graffio. Top.", when: "4 giorni fa" },
    { a: "Sara T.", s: 96, t: "Precisa e ordinata, ha pulito tutto a fine lavoro.", when: "10 giorni fa" },
  ],
  w5: [
    { a: "Luca B.", s: 96, t: "WiFi finalmente stabile in tutta casa. Spiegazioni chiare.", when: "6 giorni fa" },
    { a: "Anna F.", s: 90, t: "Ha sistemato PC e stampante in un'ora. Gentilissima.", when: "2 settimane fa" },
  ],
  w6: [
    { a: "Stefano R.", s: 90, t: "Sostituito un interruttore e sistemato due prese. Pulito e veloce.", when: "4 giorni fa" },
    { a: "Chiara M.", s: 86, t: "Bravo a spiegare cosa non andava. Prezzo onesto.", when: "12 giorni fa" },
  ],
};

const POSTS = [
  { t: "req", a: "Giulia R.", tx: "Tapparella bloccata in zona Saffi. Qualcuno la sa sistemare oggi?", h: "Saffi", ago: "12 min", r: 3 },
  { t: "job", a: "Marco Rosetti", ini: "MR", tx: "Sto riparando uno scarico in zona Centro.", h: "Centro", ago: "25 min" },
  { t: "req", a: "Paolo M.", tx: "Cerco aiuto per montare mensole e un mobile TV. Zona Ronco.", h: "Ronco", ago: "1 ora", r: 5 },
  { t: "req", a: "Maria T.", tx: "WiFi che cade di continuo da tre giorni. Qualcuno bravo con le reti?", h: "Centro", ago: "2 ore", r: 2 },
];

function greet() {
  const h = new Date().getHours();
  if (h < 5) return "Buonasera.";
  if (h < 12) return "Buongiorno.";
  if (h < 18) return "Buon pomeriggio.";
  return "Buonasera.";
}

/* ---------- ICONS (line SVG, no emoji) ---------- */
const PATHS = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5",
  message: "M4 5h16v10H9l-4 4V5z",
  bolt: "M13 3L5 13h5l-1 8 8-10h-5l1-8z",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  arrowL: "M19 12H5M11 6l-6 6 6 6",
  check: "M5 12l4 4 10-11",
  cal: "M5 7h14v13H5zM5 7l0-3M19 7l0-3M9 4v3M15 4v3M5 11h14",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0",
  shield: "M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z",
  pin: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  star: "M12 3l2.6 5.5L20 9.3l-4 4 1 6-5-2.9L7 19.3l1-6-4-4 5.4-.8L12 3z",
  plus: "M12 5v14M5 12h14",
  home: "M4 11l8-7 8 7M6 10v9h12v-9",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c0-3.5 3-6 7-6s7 2.5 7 6",
  x: "M6 6l12 12M18 6L6 18",
  send: "M5 12l15-7-7 15-2-6-6-2z",
  wrench: "M14 7a4 4 0 0 1-5 5l-5 5 2 2 5-5a4 4 0 0 0 5-5l-2 2-2-2 2-2z",
  drop: "M12 3s6 6 6 10a6 6 0 1 1-12 0c0-4 6-10 6-10z",
  leaf: "M5 19c0-8 6-13 14-13 0 8-5 14-13 14M5 19c3-3 6-5 9-6",
  chair: "M6 4v8h12V4M6 12l-1 8M18 12l1 8M5 12h14",
  broom: "M16 4l4 4M14 6l4 4-7 7H6l-2-2 8-9zM6 17l-2 3",
  chip: "M7 7h10v10H7zM4 10v4M4 10h3M4 14h3M20 10v4M17 10h3M17 14h3M10 4h4M10 4v3M14 4v3M10 20v-3M14 20v-3",
  box: "M4 8l8-4 8 4-8 4-8-4zM4 8v8l8 4 8-4V8M12 12v8",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9l-2 4-4 2 2-4 4-2z",
  trophy: "M7 4h10v4a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 16h6M10 16l-.5 4M14 16l.5 4M8 20h8",
  seal: "M12 3l2 2 3-1 1 3 3 1-1 3 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-1-3 3-1 1-3 3 1 2-2z",
  heart: "M12 20s-7-4.5-7-9.5a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 5-7 9.5-7 9.5z",
  book: "M12 6c-2-1.3-4.5-1.3-7-.8v12c2.5-.5 5-.5 7 .8 2-1.3 4.5-1.3 7-.8v-12c-2.5-.5-5-.5-7 .8zM12 6v12",
  hand: "M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3.5a1.5 1.5 0 0 1 2.5-1.6L8 13",
  logout: "M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6",
  pause: "M9 6v12M15 6v12",
};

function Icon({ name, size = 22, color = "currentColor", w = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}
      stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}

/* ---------- SIGNATURE: the IDA wax seal ---------- */
function Seal({ score, lv, size = 64, stamp = false, tint }) {
  const c = tint || LV[lv].c;
  return (
    <span role="img" aria-label={score == null ? "IDA: nuovo" : `IDA ${score} su 100`} style={{
      width: size, height: size, position: "relative", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: stamp ? "stamp .55s cubic-bezier(.2,1.4,.5,1) both" : "none",
    }}>
      <svg width={size} height={size} viewBox="0 0 64 64" style={{ position: "absolute", inset: 0 }}>
        <circle cx="32" cy="32" r="30" fill="none" stroke={c} strokeWidth="1" opacity="0.25" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={c} strokeWidth="2" />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          return <circle key={i} cx={32 + Math.cos(a) * 29} cy={32 + Math.sin(a) * 29} r="0.7" fill={c} opacity="0.4" />;
        })}
      </svg>
      <span aria-hidden="true" style={{ display: "block", textAlign: "center", lineHeight: 1, position: "relative" }}>
        {score == null
          ? <span style={{ display: "block", fontFamily: "'Space Mono',monospace", fontSize: size * .19, fontWeight: 700, color: c, letterSpacing: .5 }}>NUOVO</span>
          : <>
              <span style={{ display: "block", fontFamily: "'Space Mono',monospace", fontSize: (score >= 100 ? .78 : 1) * (size < 50 ? size * .4 : size * .34), letterSpacing: score >= 100 ? -1 : 0, fontWeight: 700, color: c }}>{score}</span>
              {size >= 50 && <span style={{ display: "block", fontSize: size * .12, letterSpacing: 1, color: c, marginTop: 1, fontWeight: 600 }}>IDA</span>}
            </>}
      </span>
    </span>
  );
}

/* Numero che sale da 0 al valore: solo una volta, e mai con "riduci movimento" */
const fermo = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function Conta({ to, ms = 900 }) {
  const [v, setV] = useState(() => (fermo() || typeof to !== "number") ? to : 0);
  useEffect(() => {
    if (fermo() || typeof to !== "number") { setV(to); return; }
    let raf, t0;
    const step = (t) => { if (t0 == null) t0 = t; const k = Math.min(1, (t - t0) / ms); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{v}</>;
}

function Mono({ children, size = 14, color = T.ink, w = 700 }) {
  return <span style={{ fontFamily: "'Space Mono',monospace", fontSize: size, fontWeight: w, color, whiteSpace: "nowrap" }}>{children}</span>;
}

function Btn({ children, onClick, kind = "primary", full, style, ariaLabel }) {
  const base = { borderRadius: 13, padding: "15px 22px", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all .18s", border: "none", textAlign: "center", fontFamily: "'Hanken Grotesk',sans-serif", width: full ? "100%" : "auto" };
  const kinds = {
    primary: { background: T.pine, color: "#fff" },
    ember: { background: T.emberBtn, color: "#fff" },
    ghost: { background: "transparent", color: T.ink, border: `1.5px solid ${T.line}` },
    dark: { background: T.ink, color: T.paper },
  };
  return <button type="button" className="btn" aria-label={ariaLabel} aria-disabled={style && style.opacity < 1 ? true : undefined} onClick={onClick} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
}

/* Iniziali in un riquadro col colore del mestiere */
function Avatar({ ini, sz = 46, lv, onDark, tint }) {
  return (
    <span aria-hidden="true" style={{ width: sz, height: sz, borderRadius: Math.round(sz * .3), background: tint || "#9CC3B8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: sz * .36, fontWeight: 800, color: "#0E1C19" }}>{ini}</span>
    </span>
  );
}

/* Il numero IDA in chiaro, come in un registro: niente sigillo decorativo nelle liste */
function IdaNum({ w }) {
  if (w.ida == null) return <span className="wcard-r"><span className="ida-n nuovo">NUOVO</span><span className="ida-lab">IDA</span></span>;
  return <span className="wcard-r" role="img" aria-label={`IDA ${w.ida} su 100, ${LV[w.lv].l}`}><span aria-hidden="true" className={"ida-n" + (w.ida >= 95 ? " top" : "")}>{w.ida}</span><span aria-hidden="true" className="ida-lab">IDA</span></span>;
}

/* ---------- WORKER ROW — una riga su filetto: chi è, cosa dice un cliente, i numeri ---------- */
function WRow({ w, onClick, i = 0 }) {
  const lv = LV[w.lv];
  const voce = (REVIEWS_BY[w.id] || [])[0];
  return (
    <button type="button" className="wcard" onClick={onClick} style={{ animationDelay: `${i * .05}s` }}>
      <Avatar ini={w.ini} lv={w.lv} sz={48} tint={catColorOf(w) || undefined} />
      <span className="wcard-b">
        <span className="wcard-n">{w.n}{w.av && <><span className="wcard-av" aria-hidden="true" /><span className="sr">, disponibile</span></>}</span>
        <span className="wcard-bio">{w.bio}</span>
        {voce && <span className="wcard-q">«{voce.t.match(/^[^.!?]*[.!?]?/)[0]}» <span>— {voce.a}</span></span>}
      </span>
      <IdaNum w={w} />
      <span className="wcard-tags">
        <span><b>{String(w.d).replace(".", ",")}</b> km</span>
        <span><b>{w.pr} €</b>/h</span>
        {w.ida != null && <span>{lv.l}</span>}
        <span>{w.tipo === "piva" ? "P.IVA" : "Privato"}</span>
        {!w.av && <span className="no">non disponibile</span>}
      </span>
    </button>
  );
}

/* ============================== HOME — fascia scura che continua l'ingresso, poi carta ============================== */
function Home({ nav, fermo, role, profilo, nuove, richieste = 0, blocked = [], prossima, reqsHome = [], bacheca = 0 }) {
  const isW = role === "worker";
  const [li, setLi] = useState(0);
  const [fade, setFade] = useState(false);
  useEffect(() => {
    let inner;
    const t = setInterval(() => { setFade(true); inner = setTimeout(() => { setLi(p => (p + 1) % LIVE.length); setFade(false); }, 280); }, 4500);
    return () => { clearInterval(t); clearTimeout(inner); };
  }, []);
  const near = [...WORKERS].filter(w => w.av && !blocked.includes(w.id)).sort((a, b) => a.d - b.d).slice(0, 3);
  const nomiBloccati = blocked.map(id => wById(id)?.n.split(" ")[0]).filter(Boolean);
  const live = LIVE.filter(t => !nomiBloccati.some(n => t.startsWith(n + " ")));
  const tiles = isW
    ? [{ ic: "user", l: "Profilo", s: "agenda e richieste", to: "account" }, { ic: "grid", l: "Bacheca", s: "chi cerca in zona", to: "neighborhood" }, { ic: "seal", l: "Sigillo", s: "da condividere", to: "share" }]
    : [{ ic: "star", l: "Il tuo livello", s: "vantaggi", to: "rewards" }, { ic: "pin", l: "Passaporto", s: "i tuoi timbri", to: "passport" }, { ic: "book", l: "Come funziona", s: "regole e IDA", to: "help" }];
  const zonaMia = isW ? ME.zona : profilo?.zona;
  return (
    <div className="home">
      <header className="home-hero">
        <div className="home-top">
          <div>
            <div className="ent-mark" style={{ fontSize: 19 }}>TaskEase</div>
            <div className="home-sub"><span className="ent-dot" />Anteprima · profili di esempio</div>
          </div>
          <button type="button" className="glass-ic" onClick={() => nav("notifications")} aria-label={nuove ? "Notifiche, ce ne sono di nuove" : "Notifiche"}>
            <Icon name="bell" size={20} />{nuove && <span className="glass-dot" />}
          </button>
        </div>
        <h1 className="home-h a-capo">{isW ? <>{greet().slice(0, -1)}, {ME.n.split(" ")[0]}.<br /><em>Chi aiutiamo oggi?</em></> : <>{profilo ? `${greet().slice(0, -1)}, ${profilo.nome.split(" ")[0]}.` : greet()}<br /><em>Chi ti serve oggi?</em></>}</h1>
        {isW ? (
          <button type="button" className="home-cta" onClick={() => nav("account")}>
            <Icon name="bolt" size={20} color="#fff" />
            <span>{richieste ? `${richieste} ${richieste === 1 ? "richiesta ti aspetta" : "richieste ti aspettano"}` : "Il tuo profilo e l'agenda"}</span>
            <Icon name="arrowR" size={18} color="#fff" />
          </button>
        ) : (
          <button type="button" className="home-search" onClick={() => nav("search")}>
            <Icon name="search" size={20} color={T.stone} />
            <span>Cosa ti serve? Anche solo una mano</span>
          </button>
        )}
      </header>

      <div className="home-body">
        {!isW && <nav className="cats scorri" aria-label="Mestieri">
          {CATS.map(c => <button type="button" key={c.n} className="cat2" onClick={() => nav("search", { cat: c.n })}>{c.n}</button>)}
        </nav>}

        {!isW && <div className="bento">
          {prossima && (
            <button type="button" className="tl next" onClick={() => nav("account")}>
              <span className="tm">{prossima.time}</span>
              <div>{wById(prossima.wid)?.n}<small>{giornoDi(prossima)} · {prossima.stato === "in attesa" ? "in attesa di conferma" : "confermato"}</small></div>
              <Icon name="arrowR" size={18} color="#1C1408" />
            </button>
          )}
          <MappaZona nav={nav} blocked={blocked} mia={zonaMia} />
          <button type="button" className="tl ida" onClick={() => nav("help")}>
            <small>Cos'è l'IDA <span className="ticker-tag" style={{ color: "rgba(246,242,234,.75)", borderColor: "rgba(246,242,234,.3)", marginLeft: 4 }}>ESEMPIO</span></small>
            <span className="big"><Conta to={94} /></span>
            <span className="sub">voto su 100, solo lavori veri</span>
          </button>
          <button type="button" className="tl" onClick={() => nav("neighborhood")}>
            <small>Bacheca</small>
            <span className="big" style={{ fontSize: 30 }}><Conta to={bacheca} ms={600} /></span>
            <span className="sub">{bacheca === 1 ? "richiesta in zona" : "richieste in zona"}</span>
          </button>
        </div>}

        {live.length > 0 && <div className="ticker">
          <span className="ticker-tag">ESEMPIO</span>
          <span style={{ transition: "opacity .3s", opacity: fade ? 0 : 1 }}>{live[li % live.length]}</span>
        </div>}

        {isW ? (
          <>
            <div className="sec-h">
              <h2>Richieste per te</h2>
              <button type="button" className="link" onClick={() => nav("account", { vai: "richieste" })}>Vedi tutte</button>
            </div>
            <div className="wlist">
              {reqsHome.length === 0 && <div style={{ background: T.card, borderRadius: 20, padding: 18, fontSize: 14, color: T.stone, textAlign: "center" }}>{fermo === "pausa" ? "Profilo in pausa: non ti arrivano richieste. Lo riattivi da Profilo." : fermo === "off" ? "Non sei disponibile: non ti arrivano richieste. Accendi «Disponibile» in Profilo." : "Nessuna richiesta per ora. Ti avvisiamo quando ne arriva una."}</div>}
              {reqsHome.slice(0, 2).map(r => (
                <button type="button" key={r.id} className="wcard solo" onClick={() => nav("account", { vai: "richiesta-" + r.id })}>
                  <span className="wcard-b">
                    <span className="wcard-n">{r.task}</span>
                    <span className="wcard-bio">{r.c} · {r.zona} · {r.when}, {r.time}</span>
                  </span>
                  <span className="wcard-r"><span className="ida-n" style={{ fontSize: 20 }}>~{ME.pr * r.ore}€</span><span className="ida-lab">{r.ore} h × {ME.pr} €</span></span>
                  <span className="wcard-tags"><span>ESEMPIO</span><span style={{ color: T.ochreLight }}>Vedi la richiesta</span></span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="sec-h">
              <h2>Vicini a te</h2>
              <button type="button" className="link" onClick={() => nav("search")}>Vedi tutti</button>
            </div>
            <div className="wlist">{near.map((w, i) => <WRow key={w.id} w={w} i={i} onClick={() => nav("worker", w)} />)}</div>
          </>
        )}

        {isW && <button type="button" className="ida-card" onClick={() => nav("help")}>
          <span className="ida-t">Il tuo IDA</span><br />
          Ancora nuovo: compare dopo {IDA_MIN_LAVORI} lavori giudicati. Un voto su 100 fatto solo di lavori veri.
          <br /><span className="ida-l">Come si calcola →</span>
        </button>}

        <ul className="tiles" style={{ marginTop: isW ? 10 : 22 }}>
          {tiles.map(x => (
            <li key={x.l} style={{ display: "flex" }}><button type="button" className="tile" onClick={() => nav(x.to)}>
              <Icon name={x.ic} size={20} />
              <span className="tile-l">{x.l}</span>
              <span className="tile-s">{x.s}</span>
            </button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* Mappa schematica dei quartieri: un punto per chi è disponibile, il tuo quartiere cerchiato */
function MappaZona({ nav, blocked = [], mia }) {
  const W_ = 160, H_ = 234;
  const pos = (q) => [q.x / 100 * W_, q.y / 100 * H_];
  const disp = WORKERS.filter(w => w.av && !blocked.includes(w.id));
  const tutti = WORKERS.filter(w => !blocked.includes(w.id));
  const qMia = QUARTIERI.find(q => q.n === mia) || QUARTIERI[0];
  return (
    <button type="button" className="tl map" onClick={() => nav("search")} aria-label={`Mappa della zona: ${disp.length} persone disponibili. Apri la ricerca`}>
      <svg viewBox={`0 0 ${W_} ${H_}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="#24403A" strokeWidth="7" strokeLinecap="round">
          <path d="M-10 150 C 40 130, 90 160, 170 110" /><path d="M70 -10 L 90 250" />
        </g>
        <g fill="none" stroke="#1D3631" strokeWidth="3" strokeLinecap="round">
          <path d="M-10 40 L 170 30" /><path d="M20 -10 L 35 250" /><path d="M130 -10 L 140 250" /><path d="M-10 210 L 170 220" />
        </g>
        {(() => { const [x, y] = pos(qMia); return <><circle className="giro" cx={x} cy={y} r="30" fill="none" stroke={T.ok} strokeDasharray="3 4" /><circle className="onda" cx={x} cy={y} r="12" fill="none" stroke={T.ok} /><circle cx={x} cy={y} r="4.5" fill={T.ok} /></>; })()}
        {tutti.map((w, i) => {
          const q = QUARTIERI.find(z => z.n === w.zona); if (!q) return null;
          const [x, y] = pos(q); const dx = (i % 3 - 1) * 11, dy = (i % 2 ? 9 : -9);
          return <g key={w.id}>{w.av && <circle className="onda" style={{ animationDelay: `${i * .45}s` }} cx={x + dx} cy={y + dy} r="9" fill="none" stroke={T.ochreLight} />}<circle className="pop" style={{ animationDelay: `${.2 + i * .08}s` }} cx={x + dx} cy={y + dy} r="5" fill={w.av ? T.ochreLight : "#4A615B"} stroke={T.card} strokeWidth="2" /></g>;
        })}
      </svg>
      <span className="lbl"><small>In zona ora</small><b><Conta to={disp.length} ms={700} /> {disp.length === 1 ? "libera" : "libere"}</b></span>
    </button>
  );
}

/* ============================== SEARCH ============================== */
// Parole di tutti i giorni -> mestiere. Così "perde il lavandino" trova un idraulico.
const SINONIMI = [
  { cat: "Idraulica", hay: "idraul", parole: ["wc", "idraul", "rubinett", "lavandin", "lavell", "perd", "goccio", "scaric", "tubo", "tubi", "caldai", "water", "bagno", "doccia", "sifon", "acqua", "scaldabagn"] },
  { cat: "Riparazioni", hay: "elettric", parole: ["elettric", "luce", "luci", "presa", "prese", "interruttor", "lampad", "corrente", "salvavita", "lampadari"] },
  { cat: "Riparazioni", hay: "riparazion", parole: ["ripar", "aggiust", "rott", "tapparell", "maniglia", "porta", "finestr", "tuttofare", "sistem"] },
  { cat: "Pulizie", hay: "puliz", parole: ["puliz", "pulire", "sporc", "stir", "vetri", "polver", "lavare"] },
  { cat: "Montaggio", hay: "montagg", parole: ["mont", "mobil", "armadi", "ikea", "mensol", "cucin", "librer", "letto", "scaffal"] },
  { cat: "Tecnologia", hay: "pc", parole: ["pc", "computer", "wifi", "internet", "stampant", "telefon", "tablet", "rete", "router", "email"] },
  { cat: "Giardino", hay: "giardin", parole: ["giardin", "siep", "potat", "prato", "erba", "alber", "piant", "foglie"] },
];
const PAROLE_VUOTE = new Set(["tv", "che", "del", "della", "per", "una", "uno", "con", "non", "mio", "mia", "casa", "serve", "qualcuno", "devo", "vorrei", "cerco", "ieri", "oggi", "domani"]);
const tokensDi = (q) => q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter(t => !PAROLE_VUOTE.has(t) && (t.length >= 3 || t === "pc" || t === "wc"));
const sinonimiDi = (t) => SINONIMI.filter(s => s.parole.some(p => t.startsWith(p) || (t.length >= 4 && p.startsWith(t))));
const matchTesto = (w, q) => {
  const tk = tokensDi(q);
  if (!tk.length) return !q.trim(); // "!!!" o "tv": niente parole utili, nessun risultato
  const parole = (w.n + " " + w.sk.join(" ") + " " + w.bio).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/);
  const hay = parole.join(" ");
  return tk.some(t => parole.some(p => p.startsWith(t.length <= 4 ? t : t.slice(0, Math.max(4, t.length - 2)))) || sinonimiDi(t).some(s => hay.includes(s.hay)));
};
const CAT_KEYS = {
  "Idraulica": ["idraul", "scarico", "caldaie", "tubo"],
  "Riparazioni": ["riparazion", "tuttofare"],
  "Pulizie": ["pulizia", "pulizie", "stiratura"],
  "Montaggio": ["montaggio", "mobili", "cucine", "mensole"],
  "Tecnologia": ["pc", "wifi", "stampant", "rete", "tecnico"],
  "Giardino": ["giardin", "potatura", "siepi", "prato"],
};
const catHa = (w, cat) => { const hay = (w.sk.join(" ") + " " + w.bio).toLowerCase(); return (CAT_KEYS[cat] || []).some(k => hay.includes(k)); };
function Search({ nav, init, role, blocked = [] }) {
  const [q, setQ] = useState(init?.q || "");
  const [sort, setSort] = useState(init?.sort || "dist");
  const [cat, setCat] = useState(init?.cat || null);
  useEffect(() => { nav.save?.({ cat, q, sort }); }, [cat, q, sort]);
  const catMatch = (w) => !cat || catHa(w, cat);
  const forse = [...new Set(tokensDi(q).flatMap(t => sinonimiDi(t).map(s => s.cat)))];
  const nascosti = WORKERS.filter(w => blocked.includes(w.id) && (!q || matchTesto(w, q)) && catMatch(w)).length;
  const f = WORKERS
    .filter(w => !blocked.includes(w.id))
    .filter(w => !q || matchTesto(w, q))
    .filter(catMatch)
    .sort((a, b) => sort === "ida" ? (b.ida ?? -1) - (a.ida ?? -1) : sort === "price" ? a.pr - b.pr : a.d - b.d);
  const COL = [["ida", "IDA"], ["price", "€/h"], ["dist", "km"]];
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className="head-back" aria-label="Indietro" onClick={() => nav.back("home")}><Icon name="arrowL" size={20} /></button>
          <div className="campo" style={{ flex: 1, borderRadius: 10, borderColor: T.ink }}>
            <Icon name="search" size={18} color={T.ink2} />
            <input autoFocus aria-label="Cerca un mestiere o descrivi il problema" value={q} onChange={e => setQ(e.target.value)} placeholder="Idraulico, pulizie, WiFi, montaggio…"
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontSize: 16, color: T.ink, fontFamily: "'Hanken Grotesk',sans-serif", padding: "12px 0" }} />
            {q && <button type="button" className="bt tap" aria-label="Cancella la ricerca" onClick={() => setQ("")} style={{ color: T.stone, display: "flex" }}><Icon name="x" size={18} /></button>}
          </div>
        </div>
        <div className="scorri" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "14px -20px 0", padding: "0 20px" }}>
          {["Idraulica", "Riparazioni", "Pulizie", "Montaggio", "Tecnologia", "Giardino"].map(c => (
            <button type="button" className="fchip" aria-pressed={cat === c} key={c} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", paddingBottom: 18 }}>
        <div style={{ fontSize: 13.5, color: T.ink2, padding: "4px 20px 10px", lineHeight: 1.6 }}><b style={{ color: T.ink }}>{f.length} {f.length === 1 ? "persona" : "persone"}</b>{cat && ` · ${cat}`}{q && ` per “${q}”`} · nessuno paga per apparire · <button type="button" className="bt cp-link" style={{ fontSize: 13.5 }} onClick={() => nav("legal", { doc: "ranking" })}>come ordiniamo</button> <span className="ticker-tag">ESEMPI</span></div>
        {f.length > 0 && <div className="ledger-h">
          <span>Persona</span>
          {COL.map(([k, l]) => <button type="button" key={k} aria-pressed={sort === k} onClick={() => setSort(k)} aria-label={`Ordina per ${k === "ida" ? "IDA più alto" : k === "price" ? "prezzo" : "distanza"}`}>{l}{sort === k ? (k === "ida" ? " ↓" : " ↑") : ""}</button>)}
        </div>}
        {f.map((w, i) => (
          <button type="button" key={w.id} className={"lrow" + (w.av ? "" : " off")} style={{ animationDelay: `${Math.min(i, 8) * .04}s` }} onClick={() => nav("worker", q.trim() ? { ...w, q } : w)}>
            <span style={{ minWidth: 0 }}>
              <span className="lrow-n">{w.n}{w.av ? <><span className="wcard-av" aria-hidden="true" /><span className="sr">, disponibile</span></> : <span className="sr">, non disponibile</span>}</span>
              <span className="lrow-s">{!w.av && <span style={{ color: T.ember }}>non disponibile · </span>}{w.bio}</span>
            </span>
            <span className="lrow-ida" style={{ color: w.ida != null && w.ida >= 95 ? T.accent : T.ink }}>{w.ida ?? "—"}</span>
            <span>{w.pr}</span>
            <span>{String(w.d).replace(".", ",")}</span>
          </button>
        ))}
        <div style={{ padding: "0 20px" }}>
        {nascosti > 0 && <div style={{ fontSize: 13, color: T.stone, textAlign: "center", margin: "14px 0" }}>{nascosti} {nascosti === 1 ? "persona nascosta perché l'hai bloccata" : "persone nascoste perché le hai bloccate"} · <button type="button" className="bt cp-link" onClick={() => nav("bloccati")}>Gestisci</button></div>}
        {f.length > 0 && f.length <= 1 && role !== "worker" && (
          <div style={{ borderLeft: `3px solid ${T.ochre}`, padding: "4px 0 4px 16px", marginTop: 20 }}>
            <div style={{ fontSize: 15, color: T.ink, fontWeight: 700 }}>Non è chi cerchi?</div>
            <div style={{ fontSize: 14, color: T.ink2, margin: "4px 0 12px", lineHeight: 1.5 }}>Pubblica la richiesta in bacheca: rispondono le persone della zona.</div>
            <Btn kind="ghost" onClick={() => nav("post")}>Pubblica una richiesta</Btn>
          </div>
        )}
        {f.length === 0 && <div style={{ padding: "20px 0", color: T.ink2, fontSize: 14, lineHeight: 1.6 }}>
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: T.ink, letterSpacing: -.3 }}>Nessuno {cat ? `per ${cat}` : q ? `per “${q}”` : "qui"} al momento.</div>
          {forse.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>Forse cercavi: {forse.map(c => <Chip key={c} onClick={() => { setCat(c); setQ(""); }}>{c}</Chip>)}</span>}
          <div>Prova un'altra parola o categoria.</div>
          {role !== "worker" && <div style={{ borderLeft: `3px solid ${T.ochre}`, padding: "4px 0 4px 16px", margin: "20px 0" }}>
            <div style={{ fontSize: 15, color: T.ink, fontWeight: 700 }}>Descrivilo alla zona</div>
            <div style={{ fontSize: 14, color: T.ink2, margin: "4px 0 12px" }}>Pubblica la richiesta in bacheca: rispondono le persone che lavorano qui vicino.</div>
            <Btn full onClick={() => nav("post")}>Pubblica una richiesta</Btn>
          </div>}
        </div>}
        </div>
      </div>
    </div>
  );
}

/* ============================== WORKER ============================== */
// Il primo orario prenotabile (almeno un'ora da adesso), con gli stessi orari del modulo
const orarioLibero = (data, t) => { const q = quandoDi({ data, time: t }); return !!q && q - Date.now() >= 3600000; };
const primaDisp = () => {
  const oggi = TIMES.find(t => orarioLibero(dataLocale(), t));
  return oggi ? `oggi alle ${oggi}` : `domani alle ${TIMES[0]}`;
};
function Worker({ w, nav, from, saved, onSave, onBlock, bloccato, onUnblock, giaPrenotata, mioGiudizio }) {
  const [blocca, setBlocca] = useState(false);
  useIndietro(blocca, () => { setBlocca(false); return true; });
  const bloccaRef = useRef(null);
  // La conferma compare sopra la barra "Prenota": la portiamo in vista
  useEffect(() => { if (blocca) bloccaRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [blocca]);
  const lv = LV[w.lv];
  const isSaved = saved?.includes(w.id);
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" className="head-back" aria-label="Indietro" onClick={() => nav.back(from || "home")}><Icon name="arrowL" size={20} /></button>
        {!w.self && <button type="button" className="bt tap" aria-label={isSaved ? "Togli dai preferiti" : "Salva tra i preferiti"} aria-pressed={!!isSaved} onClick={() => onSave?.(w.id)} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", border: `1px solid ${isSaved ? T.ember : T.line}`, background: isSaved ? T.emberSoft : "transparent" }}>
          <Icon name="heart" size={20} color={isSaved ? T.ember : T.ink2} />
        </button>}
      </div>
      <div style={{ padding: "18px 20px 24px" }}>
        {w.self && <div className="esempio-top" style={{ background: T.pineSoft, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}><span className="ticker-tag">ANTEPRIMA</span><span>Così vedono il tuo profilo i clienti. Per cambiarlo: Profilo → Competenze, tariffa e zone.</span></div>}
        {giaPrenotata && (
          <button type="button" className="next-card" style={{ width: "100%", margin: "0 0 14px" }} onClick={() => nav("account", { ruolo: "client" })}>
            <Icon name="cal" size={20} color={T.accent} />
            <span style={{ flex: 1 }}><span className="next-t">Hai già prenotato {w.n.split(" ")[0]}</span><span className="next-s">{giornoDi(giaPrenotata)} alle {giaPrenotata.time} · {giaPrenotata.stato === "in attesa" ? "in attesa di conferma" : "confermata"}</span></span>
            <Icon name="arrowR" size={18} color={T.stone} />
          </button>
        )}
        {bloccato && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.emberSoft, borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: T.ember }}>
            <span style={{ flex: 1 }}>Hai bloccato questa persona.</span>
            <button type="button" className="bt tap" onClick={() => onUnblock?.(w.id)} style={{ fontWeight: 700, color: T.ember }}>Sblocca</button>
          </div>
        )}
        <header>
          <p className="pro-k">{w.ida != null ? `${lv.l} · ` : ""}{w.sk[0]}{w.demo && <span className="ticker-tag" style={{ marginLeft: 8, verticalAlign: 1 }}>ESEMPIO</span>}</p>
          <h1 className="pro-h a-capo">{w.n}</h1>
          <div style={{ fontSize: 16, color: T.ink2, marginTop: 6, lineHeight: 1.45 }}>{w.bio}</div>
          {w.self && <div style={{ fontSize: 14, color: T.ink2, marginTop: 4 }}>Lavora in: {(ME.zone || [ME.zona]).join(", ")}</div>}
          <div className="facts">
            {w.ver && <span><Icon name="shield" size={16} color={T.accent} />Identità verificata</span>}
            {!w.self && <span><Icon name="message" size={16} color={T.accent} />Risponde in ~{w.rsp}</span>}
            {!w.self && <span><Icon name="pin" size={16} color={T.accent} /><Mono size={13} w={400}>{String(w.d).replace(".", ",")} km</Mono> · {w.zona}</span>}
          </div>
          <div style={{ fontSize: 13, color: T.stone, marginTop: 8, lineHeight: 1.5 }}>
            {[w.tipo === "piva" ? "Professionista con P.IVA" : "Privato · prestazione occasionale", w.abil && "Impresa abilitata per impianti (dichiarato)", w.rc && "Assicurazione RC (dichiarata)", w.preventivo && "Lavora a preventivo"].filter(Boolean).join(" · ")}
          </div>
        </header>
        <div className={"slot" + (w.av ? "" : " no")}>
          <span>{w.self ? "Stato" : w.av ? "Primo orario proponibile" : "Ora non disponibile"}</span>
          <b>{w.self ? (w.av ? "disponibile" : "non disponibile") : w.av ? primaDisp() : `risponde in ${w.rsp}`}</b>
        </div>

        {/* L'IDA in chiaro: il numero, da quanti giudizi, e di cosa è fatto */}
        <section className="ida-block" aria-label="IDA">
          <div className="ida-hero">
            {w.ida == null ? <b className="nuovo">NUOVO</b> : <b><Conta to={w.ida} /></b>}
            <div>
              <strong>{w.ida == null ? "IDA in costruzione" : "IDA su 100"}</strong>
              <small>{w.self || w.ida == null ? `Compare dopo ${IDA_MIN_LAVORI} lavori giudicati.` : <>da <Mono size={13} w={400}>{w.rv}</Mono> lavori giudicati dai clienti</>}</small>
            </div>
          </div>
          <ul className="voci" aria-label="Come si forma">
            {IDA_VOCI.map((v, i) => <li key={v.k} style={{ animationDelay: `${.35 + i * .07}s` }}>{v.l} <b>{Math.round(v.w * 100)}%</b></li>)}
          </ul>
        </section>

        <div className="trio">
          {[[w.j, "lavori fatti"], [w.pr + " €", w.preventivo ? "all'ora, indicativo" : "all'ora"], w.self ? [String((ME.zone || [ME.zona]).length), (ME.zone || [ME.zona]).length === 1 ? "zona" : "zone"] : [w.tipo === "piva" ? "P.IVA" : "Privato", w.tipo === "piva" ? "con fattura" : "occasionale"]].map(([v, l], i) => (
            <div key={i}><b>{v}</b><small>{l}</small></div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0 6px" }}>
          {w.sk.map(s => <span key={s} className="tag" style={{ border: `1px solid ${T.rule}`, borderRadius: 6, padding: "5px 9px", fontSize: 12.5 }}>{s}</span>)}
        </div>

        {/* Cosa dicono — recensioni leggibili PRIMA di prenotare */}
        {(() => {
          const revs = [...(mioGiudizio ? [{ a: "Tu", when: "adesso", s: mioGiudizio.voto, t: mioGiudizio.testo || "Giudizio senza commento.", mio: true }] : []), ...(REVIEWS_BY[w.id] || [])];
          return (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "26px 0 4px" }}>
                <h2 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: T.ink, letterSpacing: -.3, margin: 0 }}>Cosa dicono</h2>
                <span className="kicker">{w.rv} giudizi</span>
              </div>
              <div style={{ fontSize: 13, color: T.stone, marginBottom: 6 }}>Solo giudizi di lavori conclusi su TaskEase. Nessuna recensione a pagamento.</div>
              <div style={{ marginBottom: 22 }}>
                {revs.length === 0
                  ? <div style={{ borderLeft: `3px solid ${T.ochre}`, padding: "4px 0 4px 14px", marginTop: 12, fontSize: 14, color: T.ink2, lineHeight: 1.6 }}>{w.self ? "Profilo nuovo: ancora nessun giudizio. I giudizi arrivano dai clienti dopo i primi lavori." : "Profilo nuovo: ancora nessun giudizio. Il primo lavoro con te può far partire il suo IDA."}</div>
                  : revs.map((r, i) => (
                    <div key={r.mio ? "mio" : i} className="rev" style={{ padding: "14px 0 4px", borderBottom: i < revs.length - 1 ? `1px solid ${T.line}` : "none" }}>
                      <q>{r.t}</q>
                      <div className="rev-f">
                        <span><b aria-label={`voto ${r.s} su 100`}>{r.s}</b>{r.a}{r.mio && <span className="ticker-tag" style={{ marginLeft: 8 }}>IL TUO</span>} · {r.when}</span>
                        {!r.mio && <button type="button" className="bt tap" onClick={() => nav("segnala", { tipo: `Giudizio di ${r.a} su ${w.n}`, testo: r.t, rif: `profilo/${w.id}/giudizio/${i - (mioGiudizio ? 1 : 0)}` })} aria-label={`Segnala il giudizio di ${r.a}`} style={{ fontSize: 12.5, color: T.stone, minHeight: 44, textDecoration: "underline", textUnderlineOffset: 3 }}>Segnala</button>}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          );
        })()}

        {!w.self && <>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 4, flexWrap: "wrap" }}>
          <button type="button" onClick={() => nav("report", w)} className="bt tap" style={{ fontSize: 13, color: T.stone }}>Segnala un problema</button>
          <button type="button" onClick={() => nav("segnala", { tipo: `Profilo di ${w.n}`, testo: w.bio, rif: `profilo/${w.id}` })} className="bt tap" style={{ fontSize: 13, color: T.stone }}>Segnala il profilo</button>
          {!bloccato && <button type="button" onClick={() => setBlocca(true)} className="bt tap" style={{ fontSize: 13, color: T.stone }}>Blocca</button>}
        </div>
        {blocca && (
          <div ref={bloccaRef} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 14, marginTop: 12, marginBottom: 90 }}>
            <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, marginBottom: 10 }}>Bloccare {w.n.split(" ")[0]}? Non comparirà più nelle ricerche, nei preferiti e in bacheca.{giaPrenotata ? (giaPrenotata.stato === "in attesa" ? <> <strong>La tua richiesta in attesa viene ritirata.</strong> Non riceve nessun avviso del blocco.</> : <> <strong>L'appuntamento di {giornoDi(giaPrenotata).toLowerCase()} alle {giaPrenotata.time} viene disdetto</strong> e {w.n.split(" ")[0]} riceve solo l'avviso della disdetta.</>) : " Non riceve nessun avviso."}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="bt tap" onClick={() => { onBlock?.(w.id); nav.back("home"); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: T.emberBtn, color: "#fff", fontSize: 13, fontWeight: 700, textAlign: "center" }}>Sì, blocca</button>
              <button type="button" className="bt tap" onClick={() => setBlocca(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.line}`, color: T.ink, fontSize: 13, fontWeight: 600, textAlign: "center" }}>Annulla</button>
            </div>
          </div>
        )}
        </>}
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 12.5, color: T.stone, lineHeight: 1.5 }}>{w.self ? "I clienti vedono anche questa riga: l'accordo e il lavoro restano tra loro e te." : `TaskEase mette in contatto le persone. L'accordo e il lavoro restano tra te e ${w.n.split(" ")[0]}.`}</div>
        {!w.self && (
          <div className="book-bar" style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px -20px -24px" }}>
            <div style={{ flex: "0 1 auto", minWidth: 0, maxWidth: 110 }}>
              <Mono size={18} color={T.ink}>{w.pr}€/h</Mono>
              <div className="bb-sub" style={{ fontSize: 13, color: T.stone, lineHeight: 1.3 }}>{w.preventivo ? "indicativo" : "uscita e materiali a parte"}</div>
            </div>
            <Btn onClick={() => nav("booking", w)} style={{ flex: 1, minWidth: 0, height: 52, padding: "0 12px", borderRadius: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{giaPrenotata ? "Prenota ancora" : `Prenota ${w.n.split(" ")[0]}`}</Btn>
            <Btn kind="ghost" ariaLabel={`Scrivi ${aD(w.n)} ${w.n.split(" ")[0]}`} onClick={() => nav("chat", w)} style={{ width: 52, height: 52, padding: 0, borderRadius: 10, border: `1.5px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center", background: T.card }}><Icon name="message" size={20} color={T.ink} /></Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== BOOKING ============================== */
function Booking({ w, nav, profilo, setProfilo, onBooked, bozza, onBozza, occupati = [] }) {
  const [chiedi, setChiedi] = useState(false);
  const [DAYS, setDAYS] = useState(makeDays);
  // Se per oggi non resta nessun orario, si parte da domani. Quello che scrivi resta come bozza se esci.
  const oraAdesso = new Date().getHours() + new Date().getMinutes() / 60;
  const oggiPieno = TIMES.every(t => !orarioLibero(dataLocale(), t));
  const [indirizzo, setIndirizzo] = useState(bozza?.indirizzo || "");
  const giornoBozza = bozza?.data ? DAYS.findIndex(d => d.data === bozza.data) : -1;
  const [day, setDay] = useState(giornoBozza >= 0 ? giornoBozza : (oggiPieno ? 1 : 0));
  const [time, setTime] = useState(giornoBozza > 0 || (giornoBozza === 0 && bozza.time && parseInt(bozza.time, 10) >= oraAdesso + 1) ? (bozza.time || null) : null); // giorno scaduto: l'orario non vale più
  const [hours, setHours] = useState(bozza?.hours || 2);
  const [nonSo, setNonSo] = useState(bozza?.nonSo ?? true); // la durata la stima chi lavora, se il cliente non lo sa
  const [chiama, setChiama] = useState(false);
  const prefill = w.q && w.q.trim().length >= 3 ? w.q.trim().charAt(0).toUpperCase() + w.q.trim().slice(1) : "";
  const [desc, setDesc] = useState(bozza?.desc || prefill);
  const [status, setStatus] = useState("form"); // form | pending | confirmed
  const [tuttaDesc, setTuttaDesc] = useState(false);
  const pronto = usePronto(status);
  const tot = w.pr * hours;
  const fn = w.n.split(" ")[0];
  // Oggi: niente orari già passati (lascia almeno un'ora di margine)
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const giaMio = (t) => occupati.includes(`${DAYS[day]?.data} ${t}`);
  // Un orario va bene se manca almeno un'ora, calcolato sulla data vera (anche se il modulo resta aperto oltre mezzanotte)
  const slotOk = (t) => { const q = quandoDi({ data: DAYS[day]?.data, time: t }); return !!q && q - Date.now() >= 3600000 && !giaMio(t); };
  const descOk = desc.trim().length >= 8 && desc.trim() !== prefill;
  const orarioPassato = (t) => { const q = quandoDi({ data: DAYS[day]?.data, time: t }); return !q || q - Date.now() < 3600000; };
  // Se passa la mezzanotte con il modulo aperto, "Oggi" e "Domani" si aggiornano e il giorno scelto resta quello
  useEffect(() => {
    const t = setInterval(() => {
      if (DAYS[0]?.data === dataLocale()) return;
      const nd = makeDays(); const sel = DAYS[day]?.data; const i = nd.findIndex(d => d.data === sel);
      setDAYS(nd); setDay(i >= 0 ? i : 0); if (i < 0) setTime(null);
    }, 20000);
    return () => clearInterval(t);
  }, [DAYS, day]);
  const canSend = time && slotOk(time) && descOk && indirizzo.trim().length >= 4;
  const msgDesc = desc.trim() && desc.trim() === prefill ? "Aggiungi qualche parola: cosa succede, da quando." : "Scrivi in due righe cosa c'è da fare.";
  const mancaP = !time || !slotOk(time) ? "Scegli l'orario." : !descOk ? msgDesc : indirizzo.trim().length < 4 ? "Manca l'indirizzo." : null;
  const profiloOk = profilo && telOk(profilo.tel);
  const inviata = useRef(false); // la prenotazione si registra una volta sola
  const [prova, setProva] = useState(false); // dopo un tocco su Invia con qualcosa che manca, i campi vuoti si accendono
  const segnaDesc = (prova && !descOk) || (!!prefill && desc.trim() === prefill);
  const descRef = useRef(null), indRef = useRef(null), oraRef = useRef(null);
  const vaiAlMancante = () => {
    setProva(true);
    const el = !time || !slotOk(time) ? oraRef.current : !descOk ? descRef.current : indRef.current;
    el?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    const fuoco = el === oraRef.current ? el?.parentElement?.querySelector(".orari button") : el;
    if (fuoco?.focus) setTimeout(() => fuoco.focus({ preventScroll: true }), 300);
  };
  useEffect(() => { if (status !== "form") return; const scritto = (desc.trim() && desc.trim() !== prefill) || indirizzo.trim() || time; onBozza?.(w.id, scritto ? { desc, indirizzo, data: DAYS[day]?.data, time, hours, nonSo } : null); }, [desc, indirizzo, day, time, hours, nonSo]);
  useEffect(() => { if (status !== "form") onBozza?.(w.id, null); }, [status]);

  // Il lavoratore deve accettare: simuliamo l'attesa, poi la conferma.
  // Chi ora non è disponibile NON conferma in due secondi: la richiesta resta in attesa.
  useEffect(() => {
    if (status === "pending" && w.av) {
      const t = setTimeout(() => {
        setStatus("confirmed");
        if (inviata.current) return; inviata.current = true;
        onBooked?.({ id: Date.now(), data: DAYS[day].data, wid: w.id, task: desc.trim(), day: DAYS[day].l, time, ore: nonSo ? null : hours, indirizzo: indirizzo.trim(), stato: "confermata", quando: "adesso" });
      }, 2600);
      return () => clearTimeout(t);
    }
    if (status === "pending" && !w.av && !inviata.current && (inviata.current = true)) onBooked?.({ id: Date.now(), data: DAYS[day].data, wid: w.id, task: desc.trim(), day: DAYS[day].l, time, ore: nonSo ? null : hours, indirizzo: indirizzo.trim(), stato: "in attesa", quando: "adesso" });
  }, [status]);

  useIndietro(status === "pending" && w.av, () => { avviso.mostra(`Richiesta annullata: ${fn} non riceve nulla.`); nav.back("worker", w); return true; });
  // In attesa che il lavoratore accetti
  if (status === "pending") return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ position: "relative", width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          {[0, 1].map(i => <div key={i} style={{ position: "absolute", width: 70, height: 70, borderRadius: 40, border: `1.5px solid ${T.pine}`, animation: `rg 2s ease-out infinite ${i * .6}s` }} />)}
          <Avatar ini={w.ini} lv={w.lv} sz={64} />
        </div>
        <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 23, fontWeight: 800, color: T.ink, letterSpacing: -.3 }}>Richiesta inviata</h1>
        <p style={{ fontSize: 14, color: T.ink2, textAlign: "center", lineHeight: 1.6, marginTop: 8 }}>
          Aspettiamo che <strong style={{ color: T.ink }}>{fn}</strong> confermi.<br />{w.av ? `Di solito risponde in ${w.rsp}. In anteprima conferma da solo tra un attimo.` : "Ora non è disponibile: ti avvisiamo quando risponde. In questa anteprima la risposta non arriva."}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, background: T.card, borderRadius: 12, padding: "10px 16px", border: `1px solid ${T.line}` }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: T.ochre, animation: "breathe 1.6s infinite" }} />
          <span style={{ fontSize: 13, color: T.ink2 }}>In attesa di conferma</span>
        </div>
        {w.av
          ? <button type="button" className="bt tap" onClick={() => { avviso.mostra(`Richiesta annullata: ${fn} non riceve nulla.`); nav.back("worker", w); }} style={{ marginTop: 20, fontSize: 13, color: T.stone, fontWeight: 600, pointerEvents: pronto ? "auto" : "none" }}>Annulla richiesta</button>
          : <div style={{ marginTop: 22, width: "100%" }}><Btn full kind="ghost" onClick={() => nav("home")}>Torna alla home</Btn></div>}
      </div>
    </div>
  );

  // Confermato — cosa succede adesso + come si paga
  if (status === "confirmed") {
    const aggiungiCal = () => {
      // Nella pagina pubblicata come anteprima online i file del calendario non si possono scaricare: lo diciamo
      if (typeof window !== "undefined" && window.claude && window.claude.use) { avviso.mostra(`In questa anteprima online il promemoria non si scarica (nell'app vera sì). Segnati: ${DAYS[day].l.toLowerCase()} alle ${time}.`); return; }
      try {
        const esc = (x) => String(x).replace(/[\\,;]/g, m => "\\" + m).replace(/\n/g, " ");
        // righe lunghe spezzate come vuole lo standard (73 caratteri + spazio iniziale nelle righe che continuano)
        const piega = (r) => { const out = []; let x = r; while (x.length > 73) { out.push(x.slice(0, 73)); x = " " + x.slice(73); } out.push(x); return out.join("\r\n"); };
        const ora = new Date(); const stamp = ora.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
        const breve = desc.trim().length > 50 ? desc.trim().slice(0, 50).replace(/\s+\S*$/, "") + "…" : desc.trim();
        const [y, m, g] = DAYS[day].data.split("-"); const [h, mi] = time.split(":");
        const fine = String(Math.min(23, +h + (nonSo ? 2 : hours))).padStart(2, "0");
        const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TaskEase//IT", "BEGIN:VEVENT", `UID:${Date.now()}@taskease`, `DTSTAMP:${stamp}`, `DTSTART:${y}${m}${g}T${h}${mi}00`, `DTEND:${y}${m}${g}T${fine}${mi}00`,
          `SUMMARY:${esc(`${fn} (TaskEase): ${breve}`)}`, `LOCATION:${esc(indirizzo.trim())}`, `DESCRIPTION:${esc(desc.trim())}`, "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", `DESCRIPTION:${esc(`Arriva ${fn}`)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].map(piega).join("\r\n") + "\r\n";
        const a = document.createElement("a"); const u = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.href = u; a.download = "appuntamento-taskease.ics";
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1500);
        avviso.mostra(`Promemoria pronto: aprilo per metterlo nel calendario. Se non si apre, segnati: ${DAYS[day].l.toLowerCase()} alle ${time}.`);
      } catch (e) { avviso.mostra(`Non riesco a creare il promemoria. Segnati: ${DAYS[day].l.toLowerCase()} alle ${time}.`); }
    };
    const steps = [
      ["Richiesta inviata", true], [`${fn} ha confermato`, true],
      ["Arriva e fa il lavoro", false], ["Paghi e lasci il giudizio", false],
    ];
    return (
      <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
        <div style={{ padding: "28px 24px 0", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.pineSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", animation: "stamp .5s ease both" }}><Icon name="check" size={32} color={T.accent} w={2} /></div>
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: T.ink, marginTop: 18, letterSpacing: -.3 }}>{fn} ci sarà.</h1>
          <p className="a-capo" style={{ fontSize: 14, color: T.ink2, marginTop: 6 }}>{DAYS[day].l} alle {time} · {indirizzo.trim()}</p>
          <p className={"a-capo" + (tuttaDesc ? "" : " tre-righe")} style={{ fontSize: 13.5, color: T.ink2, marginTop: 6, fontStyle: "italic" }}>«{desc.trim()}»</p>
          {desc.trim().length > 140 && <button type="button" className="bt tap" onClick={() => setTuttaDesc(!tuttaDesc)} style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{tuttaDesc ? "Mostra meno" : "Mostra tutto"}</button>}
          <p style={{ fontSize: 13, color: T.ink2, marginTop: 12, lineHeight: 1.5, background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px" }}>Nell'app vera ti arriva un SMS con la conferma e un promemoria il giorno prima. In anteprima non parte nessun SMS.</p>
        </div>
        <div style={{ padding: "24px 24px 28px" }}>
          {/* Cosa succede adesso */}
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 14 }}>Cosa succede adesso</div>
          <div style={{ marginBottom: 22 }}>
            {steps.map(([l, done], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < steps.length - 1 ? 4 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, background: done ? T.pine : T.card, border: done ? "none" : `1.5px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {done ? <Icon name="check" size={15} color="#fff" w={2.2} /> : <span style={{ width: 6, height: 6, borderRadius: 3, background: T.faint }} />}
                  </div>
                  {i < steps.length - 1 && <div style={{ width: 1.5, height: 22, background: T.line }} />}
                </div>
                <span style={{ fontSize: 13.5, color: done ? T.ink : T.stone, fontWeight: done ? 600 : 400, paddingBottom: i < steps.length - 1 ? 18 : 0 }}>{l}</span>
              </div>
            ))}
          </div>
          {/* Come si paga */}
          <div style={{ background: T.ochreSoft, borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Icon name="shield" size={20} color={T.ochre} />
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: T.ochreInk }}>Come si paga</span>
            </div>
            <p style={{ fontSize: 13, color: T.ochreInk, lineHeight: 1.6, margin: 0 }}>
              Paghi <strong>{fn} direttamente</strong>, in contanti o come concordate tra voi, a fine lavoro: le ore lavorate più eventuale uscita e materiali, come vi siete accordati. TaskEase non tocca i soldi.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn full kind="ghost" onClick={aggiungiCal} style={{ borderWidth: 1.5, borderColor: T.pine, color: T.accent }}>Aggiungi al calendario</Btn>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn full onClick={() => nav.replace("chat", { ...w, tema: desc.trim(), quando: `${DAYS[day].l.toLowerCase()} alle ${time}` })} style={{ flex: "1 1 0", minWidth: 0 }}>Scrivi {aD(fn)} {fn}</Btn>
              <Btn kind="ghost" onClick={() => setChiama(true)} style={{ flex: "1 1 0", minWidth: 0 }}>Chiama {fn}</Btn>
            </div>
            {chiama && <div style={{ fontSize: 13, color: T.ink2, background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px", lineHeight: 1.5 }}>Nell'app vera qui trovi il numero di {fn}, che hai ricevuto con la conferma. In anteprima i numeri non ci sono.</div>}
            <Btn full kind="ghost" onClick={() => nav("home")} style={{ borderWidth: 1.5, borderColor: T.ink2 }}>Torna alla home</Btn>
            <button type="button" className="bt tap" onClick={() => legale.apri("sicurezza")} style={{ fontSize: 13, color: T.accent, fontWeight: 600, textAlign: "center", marginTop: 4 }}>Consigli di sicurezza prima del lavoro</button>
          </div>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="worker" data={w} title="Prenota" />
      <div style={{ padding: "4px 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <Avatar ini={w.ini} lv={w.lv} sz={46} />
          <div><div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: T.ink }}>{w.n}</div><div style={{ fontSize: 13, color: T.ink2 }}><Mono size={12}>{w.pr}€</Mono>/h · IDA {w.ida ?? "nuovo"}</div></div>
        </div>
        {!w.av && (
          <div style={{ display: "flex", gap: 10, background: T.ochreSoft, borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
            <Icon name="bell" size={17} color={T.ochre} />
            <span style={{ fontSize: 13, color: T.ochreInk, lineHeight: 1.5 }}>{fn} ora non è disponibile. Puoi comunque inviare la richiesta: ti risponde appena può.</span>
          </div>
        )}
        <div ref={oraRef} />
        <Label>Che giorno?</Label>
        <div className="giorni" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 22 }}>
          {DAYS.map(d => <Chip key={d.k} center on={day === d.k} onClick={() => { setDay(d.k); if (time && ((d.k === 0 && parseInt(time, 10) < nowH + 1) || occupati.includes(`${d.data} ${time}`))) setTime(null); }}>{d.l}</Chip>)}
        </div>
        <Label>A che ora?</Label>
        <div className="orari" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 8 }}>
          {TIMES.filter(t => giaMio(t) || !orarioPassato(t)).map(t => slotOk(t)
            ? <Chip key={t} on={time === t} onClick={() => setTime(t)} center>{t}</Chip>
            : <div key={t} role="img" title={giaMio(t) ? "Già prenotato da te" : undefined} aria-label={`${t}, ${giaMio(t) ? "già prenotato da te" : "non disponibile"}`} style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, fontSize: 13, fontWeight: 600, color: T.stone, border: `1px dashed ${T.line}`, textDecoration: "line-through" }}>{t}</div>)}
        </div>
        <div style={{ fontSize: 12.5, color: T.stone, marginBottom: 22 }}>{day === 0 && TIMES.every(t => !slotOk(t)) ? "Per oggi è tardi: scegli un altro giorno." : prova && (!time || !slotOk(time)) ? <strong style={{ color: T.ochreInk }}>Scegli l'orario.</strong> : day === 0 && TIMES.every(t => !slotOk(t)) ? "Per oggi è tardi: scegli un altro giorno." : day === 0 && TIMES.some(orarioPassato) ? "Gli orari di oggi già passati non si vedono. È una proposta: se non va bene, te ne propone un altro." : "È una proposta: se non va bene, ti propone un altro orario."}</div>
        <Label>Cosa c'è da fare?</Label>
        <textarea ref={descRef} aria-label="Cosa c'è da fare" aria-invalid={segnaDesc} aria-describedby="aiuto-desc" className="cp-in" value={desc} onChange={e => setDesc(e.target.value)} maxLength={500} placeholder="Es. il lavandino del bagno perde sotto il sifone da ieri"
          style={{ height: 88, resize: "none", marginBottom: 6, ...(segnaDesc ? { borderColor: T.ochre, boxShadow: `0 0 0 3px ${T.ochreSoft}` } : {}) }} />
        <div id="aiuto-desc" style={{ fontSize: 13, color: segnaDesc ? T.ochreInk : T.stone, fontWeight: segnaDesc ? 600 : 400, marginBottom: 20 }}>{segnaDesc ? msgDesc : `${fn} lo legge prima di decidere se accettare. Due righe bastano.`}</div>
        <Label>Dove?</Label>
        <input ref={indRef} className="cp-in" aria-label="Indirizzo" aria-invalid={prova && indirizzo.trim().length < 4} aria-describedby="aiuto-ind" value={indirizzo} onChange={e => setIndirizzo(e.target.value)} placeholder="Via e numero civico" autoComplete="street-address" maxLength={80} style={prova && indirizzo.trim().length < 4 ? { borderColor: T.ochre, boxShadow: `0 0 0 3px ${T.ochreSoft}` } : undefined} />
        <div id="aiuto-ind" style={{ fontSize: 13, color: prova && indirizzo.trim().length < 4 ? T.ochreInk : T.stone, fontWeight: prova && indirizzo.trim().length < 4 ? 600 : 400, margin: "6px 0 22px" }}>{prova && indirizzo.trim().length < 4 ? "Manca l'indirizzo." : `${profilo?.zona ? `Zona: ${profilo.zona}. ` : ""}L'indirizzo lo vede solo ${fn}, e solo dopo che ha accettato.`}</div>
        <Label>Quanto dura, più o meno?</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <Chip on={nonSo} onClick={() => setNonSo(true)}>Non lo so, lo stima {fn}</Chip>
          <Chip on={!nonSo} onClick={() => setNonSo(false)}>Lo so più o meno</Chip>
        </div>
        {!nonSo && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: T.card, borderRadius: 14, padding: "12px 18px", border: `1px solid ${T.line}`, marginBottom: 10 }}>
            <button type="button" aria-label="Un'ora in meno" onClick={() => setHours(Math.max(1, hours - 1))} className="bt tap" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: T.ink }}>−</button>
            <div style={{ flex: 1, textAlign: "center" }}><Mono size={20} color={T.ink}>{hours}</Mono><span style={{ fontSize: 13, color: T.stone }}> {hours === 1 ? "ora" : "ore"} stimate</span></div>
            <button type="button" aria-label="Un'ora in più" onClick={() => setHours(Math.min(12, hours + 1))} className="bt tap" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: T.ink }}>+</button>
          </div>
        )}
        <div style={{ background: T.card, borderRadius: 18, padding: 18, border: `1px solid ${T.line}`, margin: "14px 0" }}>
          <Sum k="Dove" v={indirizzo.trim() || "—"} />
          <Sum k="Quando" v={time ? `${DAYS[day].l} · ${time}` : "—"} />
          <Sum k="Durata" v={nonSo ? `la stima ${fn}` : `${hours} ${hours === 1 ? "ora" : "ore"}`} />
          <div style={{ height: 1, background: T.line, margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink }}>{nonSo ? "Tariffa" : "Stima manodopera"}</span>
            <Mono size={20} color={T.accent}>{nonSo ? `${w.pr}€/h` : `${tot}€`}</Mono>
          </div>
          <div style={{ fontSize: 13, color: T.stone, marginTop: 8, lineHeight: 1.5 }}>{nonSo ? "" : `${w.pr}€/h × ${hours} ${hours === 1 ? "ora" : "ore"}. `}Solo manodopera{w.tipo === "piva" ? ", IVA inclusa se dovuta" : ""}: uscita e materiali li concordate in chat prima di iniziare. Paghi le ore reali.</div>
        </div>
        {/* Codice del Consumo art. 49-bis: dire se chi lavora è un privato e cosa comporta */}
        {w.tipo !== "piva" && (
          <div style={{ display: "flex", gap: 11, background: T.ochreSoft, borderRadius: 14, padding: "13px 15px", marginBottom: 12 }}>
            <Icon name="bell" size={18} color={T.ochre} />
            <div style={{ fontSize: 13, color: T.ochreInk, lineHeight: 1.5 }}><strong>{fn} è un privato</strong> (prestazione occasionale): a questo accordo non si applicano i diritti dei consumatori previsti dal diritto UE. Mettetevi d'accordo per iscritto in chat su lavoro e prezzo.</div>
          </div>
        )}
        {/* Come si paga — chiaro PRIMA di confermare */}
        <div style={{ display: "flex", gap: 11, background: T.pineSoft, borderRadius: 14, padding: "13px 15px" }}>
          <Icon name="shield" size={18} color={T.accent} />
          <div style={{ fontSize: 13, color: T.accent, lineHeight: 1.5 }}>
            Paghi <strong>{fn} direttamente</strong> a fine lavoro — contanti o come concordate. Niente carte, niente soldi nell'app.
          </div>
        </div>
      </div>
      {/* Invio sempre visibile in fondo: se manca qualcosa, lo dice */}
      <div className="book-bar">
        <div role="status" aria-live="polite" style={{ fontSize: 13, color: mancaP ? T.ink2 : T.stone, textAlign: "center", marginBottom: 8, fontWeight: mancaP ? 600 : 400 }}>
          {mancaP || `${fn} deve confermare. Se cambi idea, disdici dall'app appena puoi.`}
        </div>
        <Btn full onClick={() => !canSend ? vaiAlMancante() : !slotOk(time) ? (setTime(null), vaiAlMancante()) : (profiloOk ? setStatus("pending") : setChiedi(true))} style={canSend ? {} : { background: T.faint }}>{canSend ? `Invia richiesta ${aD(fn)} ${fn} · ${DAYS[day].l.toLowerCase()} ${time}` : `Invia richiesta ${aD(fn)} ${fn}`}</Btn>
      </div>
      {chiedi && <ProfileSheet initial={profilo} motivo={`Per mandare la richiesta ${aD(fn)} ${fn} ci serve sapere come contattarti. Quello che hai scritto resta.`} onClose={() => setChiedi(false)} onDone={p => { setProfilo(p); setChiedi(false); setStatus("pending"); }} />}
    </div>
  );
}

/* ============================== REVIEW ============================== */
function Review({ w, nav, onReviewed }) {
  const fn = w.n.split(" ")[0];
  // Le 5 voci delle regole IDA v1.0, ognuna da 1 a 5. Ordine = quello in cui le vivi.
  const qs = [
    { k: "puntualita", q: "L'orario concordato è stato rispettato?", os: [["Puntuale", 5], ["Pochi minuti di ritardo, ma ha avvisato", 4], ["In ritardo senza avvisare", 2], ["Molto in ritardo", 1]], noShow: true },
    { k: "qualita", q: "Il lavoro è stato fatto bene?", os: [["Esattamente come volevo", 5], ["Bene, qualche dettaglio", 4], ["Ci sono dei problemi", 2], ["È da rifare", 1]] },
    { k: "parola", q: "Prezzo e tempi erano quelli detti?", os: [["Esattamente", 5], ["Un po' di più, ma spiegato", 3], ["Molto diversi, senza spiegazioni", 1]] },
    { k: "pulizia", q: "È rimasto tutto in ordine?", os: [["Tutto in ordine", 5], ["Accettabile", 3], ["Ho dovuto pulire io", 1]] },
    { k: "comunicazione", q: "Vi siete capiti bene?", os: [["Chiaro e gentile", 5], ["Così così", 3], ["Difficile capirsi", 1]] },
  ];
  const [st, setSt] = useState(0);
  const [ans, setAns] = useState({});
  const [an, setAn] = useState("");
  const [txt, setTxt] = useState("");
  const [sent, setSent] = useState(false);
  useIndietro(st > 0 && !sent, () => { setSt(s => Math.max(0, s - 1)); return true; });
  const busy = useRef(false); // un tocco alla volta: il doppio tocco saltava una domanda
  const pick = (k, v) => {
    if (busy.current) return;
    busy.current = true; setAn("o");
    setTimeout(() => { setAns(a => ({ ...a, [k]: v })); setSt(s => s + 1); setAn(""); busy.current = false; }, 160);
  };

  const prontoFatto = usePronto(sent);
  useEffect(() => { if (sent) onReviewed?.(w.bookingId, { su: w.n, voto: scoreFromVoci(ans), voci: ans, testo: txt.trim() || null, data: dataLocale() }); }, [sent]);
  if (sent) {
    const sc = scoreFromVoci(ans);
    return (
      <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
        <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, animation: "rise .4s ease" }}>
          <Seal score={sc} lv={lvKeyOf(sc)} size={92} stamp />
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color: T.ink, marginTop: 20 }}>Grazie.</h1>
          <p style={{ fontSize: 13, color: T.ink2, textAlign: "center", marginTop: 6, lineHeight: 1.6 }}>Questo giudizio vale <strong style={{ color: T.ink }}>{sc}/100</strong>{w.esempio ? <>. È un esempio: non entra in nessun IDA.</> : <> ed entra nella media dell'IDA di {fn}.<br />Da solo non lo stravolge: conta insieme agli altri.{w.demo && <><br /><span style={{ color: T.stone, fontSize: 13 }}>In questa anteprima {fn} è un profilo di esempio: il suo IDA non cambia davvero.</span></>}</>}</p>
          <div style={{ marginTop: 28, width: "100%", pointerEvents: prontoFatto ? "auto" : "none" }}><Btn full kind="dark" onClick={() => nav("home")}>Fatto</Btn></div>
        </div>
      </div>
    );
  }

  // Riepilogo: prima di inviare vedi esattamente cosa stai dando, voce per voce
  if (st >= qs.length) {
    const sc = scoreFromVoci(ans);
    return (
      <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
        <Head nav={() => setSt(qs.length - 1)} title={w.esempio ? "Il tuo giudizio (esempio)" : "Controlla e invia"} />
        <div style={{ padding: "4px 22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: 18, marginBottom: 18 }}>
            <Seal score={sc} lv={lvKeyOf(sc)} size={64} />
            <div style={{ flex: 1, fontSize: 13, color: T.ink2, lineHeight: 1.5 }}>Il tuo giudizio su {fn}, calcolato con le regole pubbliche dell'IDA.</div>
          </div>
          {IDA_VOCI.map(v => (
            <div key={v.k} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: T.ink2 }}>{v.l} <span style={{ color: T.stone, fontSize: 12.5 }}>· pesa {Math.round(v.w * 100)}%</span></span>
                <Mono size={12} color={T.ink}>{ans[v.k]}/5</Mono>
              </div>
              <div style={{ height: 5, background: T.line, borderRadius: 3 }}><div style={{ height: 5, borderRadius: 3, background: ans[v.k] >= 4 ? T.pine : T.ochre, width: `${ans[v.k] * 20}%` }} /></div>
            </div>
          ))}
          <div style={{ marginTop: 18 }}><Label>Due righe per chi verrà dopo <span style={{ fontWeight: 400, color: T.stone }}>· facoltativo</span></Label></div>
          <textarea aria-label="Due righe per chi verrà dopo" value={txt} onChange={e => setTxt(e.target.value)} maxLength={280} placeholder="Cosa è andato bene, cosa no. Niente nomi di altre persone, niente insulti."
            style={{ width: "100%", height: 84, resize: "none", border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "'Hanken Grotesk',sans-serif", background: T.card, color: T.ink }} />
          <div style={{ fontSize: 12.5, color: T.stone, margin: "8px 0 18px", lineHeight: 1.5 }}>{w.esempio ? "È un esempio: non viene pubblicato da nessuna parte." : `Il giudizio è pubblico e non si modifica. Al lancio ${fn} potrà rispondere una volta.`}</div>
          <Btn full onClick={() => setSent(true)}>{w.esempio ? "Vedi il risultato" : "Pubblica il giudizio"}</Btn>
        </div>
      </div>
    );
  }

  const cur = qs[st];
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div style={{ minHeight: "100%", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
        <button type="button" className="bt tap" aria-label={st > 0 ? "Domanda precedente" : "Chiudi"} onClick={() => st > 0 ? setSt(st - 1) : nav.back("account")} style={{ position: "absolute", top: 8, [st > 0 ? "left" : "right"]: 8, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: T.ink2 }}><Icon name={st > 0 ? "arrowL" : "x"} size={22} /></button>
        <div style={{ display: "flex", gap: 6, marginBottom: 30, justifyContent: "center" }}>
          {qs.map((_, i) => <div key={i} style={{ width: 28, height: 3, borderRadius: 2, background: i <= st ? T.pine : T.line, transition: "background .3s" }} />)}
        </div>
        <div style={{ opacity: an === "o" ? 0 : 1, transform: an === "o" ? "translateY(8px)" : "none", transition: "all .16s" }}>
          {w.esempio && <div className="esempio-top" style={{ justifyContent: "center", marginBottom: 14 }}><span className="ticker-tag">ESEMPIO</span><span>Lavoro di esempio: il giudizio non viene pubblicato.</span></div>}
          <div style={{ textAlign: "center", marginBottom: 22, display: "flex", justifyContent: "center" }}><Avatar ini={w.ini} lv={w.lv} sz={52} /></div>
          <div style={{ textAlign: "center", fontSize: 12.5, fontWeight: 700, color: T.stone, letterSpacing: .6, textTransform: "uppercase", marginBottom: 8 }}>{IDA_VOCI.find(v => v.k === cur.k).l} · {st + 1} di {qs.length}</div>
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 23, fontWeight: 800, color: T.ink, textAlign: "center", lineHeight: 1.2, letterSpacing: -.3, marginBottom: 26 }}>{cur.q}</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cur.os.map(([l, v]) => (
              <button type="button" key={l} className="bt opt" onClick={() => pick(cur.k, v)} style={{ background: T.card, borderRadius: 14, padding: "15px 18px", border: `1.5px solid ${T.line}`, fontSize: 15, fontWeight: 500, color: T.ink, transition: "all .16s", textAlign: "center" }}>{l}</button>
            ))}
          </div>
          {cur.noShow && (
            <button type="button" onClick={() => nav.replace("report", w)} className="bt tap" style={{ display: "block", margin: "18px auto 0", fontSize: 13, color: T.ember, fontWeight: 600 }}>Nessuno si è presentato? Segnalalo invece di votare</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== CHAT ============================== */
// Risposte finte ma a tono: se chiedi di una foto, del prezzo o dell'orario, rispondono a quello
const rispostaPer = (t, cliente, quando) => {
  const x = " " + t.toLowerCase().replace(/[^a-zà-ù0-9]+/g, " ") + " ";
  const c = (...parole) => parole.some(p => x.includes(" " + p + " "));
  if (cliente) {
    if (c("foto", "fotografia")) return "Te la mando appena sono a casa.";
    if (c("quanto", "prezzo", "costa", "costo", "preventivo")) return "Per me va bene, l'importante è che si capisca prima quanto viene.";
    if (c("domani", "oggi", "orario", "passare", "passo", "stasera")) return "Sì, va bene. Scrivimi quando stai arrivando.";
    return null;
  }
  if (c("foto", "fotografia")) return "Sì, mandamela pure qui: così capisco cosa portare.";
  if (c("quanto", "prezzo", "costa", "costo", "pago", "pagare", "pagamento", "preventivo")) return "Dipende da cosa trovo. Ti dico il prezzo prima di iniziare, uscita compresa.";
  if (c("spostare", "sposto", "spostiamo", "orario", "anticipare", "ritardo", "tardi")) return "Nessun problema: scrivimi l'orario che ti va meglio. Nell'app vera, se lo cambiamo, la prenotazione si aggiorna.";
  if (c("portare", "porto", "materiale", "materiali", "pezzi", "attrezzi", "attrezzatura")) return "L'attrezzatura la porto io. Se servono pezzi te lo dico prima di comprarli.";
  if (VIA_RE.test(t)) return "Ricevuto l'indirizzo, grazie.";
  if (c("confermo", "ok", "perfetto", "grazie") || x.includes(" va bene ")) return quando ? `Perfetto, ci vediamo ${quando}.` : "Perfetto, grazie!";
  return null;
};
function Chat({ w, nav, from }) {
  const [inp, setInp] = useState("");
  const [msgs, setMsgs] = useState([]);
  const timers = useRef([]);
  const dette = useRef(new Set()); // la stessa risposta non si ripete
  const lista = useRef(null);
  useEffect(() => { const el = lista.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs]);
  const breve = (t) => t && t.length > 120 ? t.slice(0, 117).trim() + "…" : t;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // Se dall'altra parte c'è chi cerca aiuto (bacheca, richieste in arrivo) risponde come cliente, non come professionista
  const cliente = !w?.id;
  const replies = cliente
    ? ["Ciao, grazie di avermi scritto! Quando potresti passare?", "Va bene. L'indirizzo te lo mando appena ci accordiamo.", "Quanto pensi che ci voglia, più o meno?", "Perfetto, ci sentiamo. Grazie!"]
    : ["Ciao! Certo, dimmi pure quando ti farebbe comodo.", "Posso passare anche domani, fammi sapere l'indirizzo.", "Per quel lavoro ci vuole circa un'oretta. Ti va bene?", "Perfetto, ci sentiamo. A presto!"];
  const repliesPrenotato = ["Ricevuto!", "Se cambia qualcosa scrivimi pure qui.", "Perfetto, a presto!", "A presto!"];
  const send = (testo) => {
    const mine = (testo ?? inp).trim();
    if (!mine) return;
    setMsgs(m => [...m, { me: true, t: mine }]);
    setInp("");
    const n = msgs.filter(x => x.me).length;
    // Le risposte automatiche dell'anteprima finiscono: non ripetono sempre l'ultima
    let adatta = rispostaPer(mine, cliente, w?.quando);
    if (adatta && dette.current.has(adatta)) adatta = null; else if (adatta) dette.current.add(adatta);
    const r = n < replies.length ? (adatta || (w?.quando && !cliente ? repliesPrenotato[n] : replies[n])) : n === replies.length ? { nota: true, t: "Anteprima: le risposte automatiche finiscono qui." } : null;
    if (r) timers.current.push(setTimeout(() => setMsgs(m => [...m, typeof r === "string" ? { me: false, t: r } : { me: false, nota: true, t: r.t }]), 1100));
  };
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 18px", background: T.card, borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" className="head-back" aria-label="Indietro" onClick={() => nav.back("home")}><Icon name="arrowL" size={20} /></button>
        {w && <Avatar ini={w.ini} lv={w.lv} sz={38} />}
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: T.ink }}>{w?.n}</div>{w?.id ? <div style={{ fontSize: 12.5, color: T.stone }}>{w.tipo === "piva" ? "Professionista con P.IVA" : "Privato · prestazione occasionale"}</div> : <div style={{ fontSize: 12.5, color: T.stone }}>Cerca aiuto in zona</div>}</div>
        <button type="button" className="bt tap" onClick={() => nav("segnala", { tipo: `Conversazione con ${w?.n}`, testo: "Messaggi in questa chat", rif: `chat/${w?.id || "bacheca"}` })} style={{ fontSize: 13, color: T.stone }}>Segnala</button>
      </div>
      {w?.id && w?.quando && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", background: T.pineSoft, fontSize: 13, color: T.accent }}>
          <Icon name="cal" size={16} color={T.accent} />
          <span style={{ flex: 1, fontWeight: 600 }}>Prenotato: {w.quando}</span>
          <span className="badge ok">Confermata</span>
        </div>
      )}
      <div ref={lista} style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ alignSelf: "center", fontSize: 13, color: T.stone, textAlign: "center", lineHeight: 1.5, maxWidth: 280, marginBottom: 4 }}>Anteprima: le risposte sono automatiche, per farti vedere come funziona.</div>
        {cliente
          ? w?.tema && <div style={{ alignSelf: "center", fontSize: 13, color: T.ink2, fontStyle: "italic", textAlign: "center", lineHeight: 1.5, maxWidth: 300 }}>La richiesta di {w?.n}: «{breve(w.tema)}»</div>
          : <div className="a-capo" style={{ maxWidth: "80%", alignSelf: "flex-start", background: T.card, borderRadius: "16px 16px 16px 5px", padding: "12px 16px", fontSize: 14, color: T.ink, border: `1px solid ${T.line}` }}>{w?.tema ? `Ciao! Sono ${w.n.split(" ")[0]}. Ho visto la tua richiesta: «${breve(w.tema)}». Ci vediamo ${w.quando}. Se vuoi mandami una foto.` : `Ciao! Sono ${w?.n?.split(" ")[0]}. Dimmi pure cosa ti serve.`}</div>}
        {msgs.map((m, i) => m.nota ? <div key={i} style={{ alignSelf: "center", fontSize: 13, color: T.stone }}>{m.t}</div> : (
          <div key={i} className="a-capo" style={{ maxWidth: "80%", alignSelf: m.me ? "flex-end" : "flex-start", background: m.me ? T.pine : T.card, color: m.me ? "#fff" : T.ink, border: m.me ? "none" : `1px solid ${T.line}`, borderRadius: m.me ? "16px 16px 5px 16px" : "16px 16px 16px 5px", padding: "12px 16px", fontSize: 14, animation: "rise .2s ease" }}>{m.t}</div>
        ))}
      </div>
      {msgs.length === 0 && (
        <div style={{ display: "flex", gap: 8, padding: "8px 16px 0", overflowX: "auto", background: T.card, borderTop: `1px solid ${T.line}` }}>
          {(cliente ? ["Posso passare domani", "Mi mandi una foto?", "Quanto è grande?"] : ["Ti mando una foto", "Confermo", "Posso spostare l'orario?"]).map(q => <Chip key={q} onClick={() => send(q)}>{q}</Chip>)}
        </div>
      )}
      <div style={{ padding: "12px 16px", borderTop: msgs.length ? `1px solid ${T.line}` : "none", background: T.card, display: "flex", gap: 10 }}>
        <input aria-label="Messaggio" value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Scrivi un messaggio…" maxLength={500} className="cp-in" style={{ flex: 1, padding: "12px 14px", background: T.paper, fontFamily: "'Hanken Grotesk',sans-serif", color: T.ink }} />
        <button type="button" aria-label="Invia" onClick={() => send()} className="bt tap" style={{ width: 48, height: 48, borderRadius: "50%", background: T.pine, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="send" size={20} color="#fff" /></button>
      </div>
    </div>
  );
}

/* ============================== PROFILO (hub con ruolo) ============================== */
/* Riporta l'anteprima allo stato iniziale (cancella anche il salvataggio nel browser) */
function Ricomincia({ onConferma }) {
  const [chiedi, setChiedi] = useState(false);
  if (!chiedi) return (
    <button type="button" className="acc-row" onClick={() => setChiedi(true)}>
      <Icon name="arrowL" size={19} color={T.ink2} />
      <span className="acc-t">Ricomincia l'anteprima<small>Cancella quello che hai provato e riparti da zero</small></span>
    </button>
  );
  return (
    <div className="acc-row" role="group" aria-label="Conferma: ricomincia l'anteprima" style={{ flexDirection: "column", alignItems: "stretch", cursor: "default" }}>
      <span style={{ fontSize: 14, color: T.ink, lineHeight: 1.5 }}>Cancellare profilo, prenotazioni e giudizi provati finora? Si riparte dall'ingresso.</span>
      <span style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" className="bt tap" onClick={onConferma} style={{ flex: 1, minHeight: 44, borderRadius: 12, background: T.emberBtn, color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "center" }}>Sì, ricomincia</button>
        <button type="button" className="bt tap" onClick={() => setChiedi(false)} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, color: T.ink, fontWeight: 600, fontSize: 14, textAlign: "center" }}>Annulla</button>
      </span>
    </div>
  );
}

function Account({ nav, vai, role, setRole, saved, paused, setPaused, onEsci, onRicomincia, blocked = [], profilo, prenotazioni, setPrenotazioni, reqs, esempiTutti, setReqs, agenda, setAgenda, availOn, setAvail, verified, setVerified }) {
  const ospite = role === "client" && !profilo;
  const nome = role === "worker" ? ME.n : (profilo?.nome || ME.n);
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div style={{ padding: "22px 22px 0" }}>
        {/* Identità: la stessa persona, sia che cerchi sia che offra */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <Avatar ini={ospite ? "?" : iniOf(nome)} lv={role === "worker" ? ME.lv : null} sz={56} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: -.4, margin: 0 }}>{ospite ? "Ospite" : nome}</h1>
            <div style={{ fontSize: 13, color: T.ink2, marginTop: 2 }}>{ospite ? "Stai guardando senza profilo" : role === "worker" ? `${(ME.zone || [ME.zona]).join(", ")} · ${ME.preventivo ? "a preventivo" : `${ME.pr}€/h`}` : `${profilo.zona} · profilo creato oggi`}</div>
          </div>
        </div>
        {/* Role toggle */}
        <div style={{ display: "flex", background: T.card, borderRadius: 13, padding: 4, border: `1px solid ${T.line}`, marginBottom: 20 }}>
          {[["client", "Sto cercando aiuto"], ["worker", "Sto lavorando"]].map(([k, l]) => (
            <button type="button" className="bt" aria-pressed={role === k} key={k} onClick={() => setRole(k)} style={{ flex: 1, textAlign: "center", minHeight: 44, padding: "10px 0", borderRadius: 999, fontSize: 13, fontWeight: 600, transition: "all .2s", background: role === k ? T.pine : "transparent", color: role === k ? "#fff" : T.ink2 }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 22px 24px" }}>
        {role === "worker" && paused && (
          <div className="acc-paused" role="status">
            <Icon name="pause" size={18} color={T.ochre} w={2.2} />
            <span>Profilo in pausa: non compari nelle ricerche e non ricevi richieste. Il tuo IDA resta com'è.</span>
            <button type="button" onClick={() => setPaused(false)}>Riattiva</button>
          </div>
        )}
        {ospite ? (
          <>
            <div className="cp-guest">
              <div className="cp-guest-t">Non hai ancora un profilo</div>
              <div className="cp-guest-s">Puoi guardare chi lavora in zona anche così. Il profilo serve quando prenoti o pubblichi una richiesta: nome, cellulare e zona, nient'altro.</div>
              <button type="button" className="cp-guest-b" onClick={() => nav("csetup", { back: "account" })}>Crea il profilo <Icon name="arrowR" size={18} color={T.accent} w={2} /></button>
            </div>
            <div style={{ marginTop: 8 }}>
              <MenuRow ic="compass" l="Come funziona TaskEase" onClick={() => nav("help")} />
              <MenuRow ic="shield" l="Assistenza e contatti" onClick={() => nav("assistenza")} />
              <MenuRow ic="book" l="Informazioni legali e privacy" onClick={() => nav("legal", { doc: "info" })} />
            </div>
            <div className="acc-list" style={{ marginTop: 16 }}><Ricomincia onConferma={onRicomincia} /></div>
          </>
        ) : role === "client"
          ? <ClientView nav={nav} saved={saved} profilo={profilo} prenotazioni={prenotazioni} setPrenotazioni={setPrenotazioni} blocked={blocked} />
          : <WorkerView nav={nav} vai={vai} mie={prossimeDi(prenotazioni)} onVediMie={() => setRole("client")} paused={paused} reqs={reqs} esempiTutti={esempiTutti} setReqs={setReqs} agenda={agenda} setAgenda={setAgenda} availOn={availOn} setAvail={setAvail} verified={verified} setVerified={setVerified} />}

        {/* Il tuo account: uscire, mettere in pausa, eliminare. Sempre raggiungibile, mai nascosto. */}
        {!ospite && <>
        <div className="acc-sec">Il tuo account</div>
        <div className="acc-list">
          {profilo && (
            <button type="button" className="acc-row" onClick={() => nav("csetup", { back: "account", edit: true })}>
              <Icon name="user" size={19} color={T.ink2} />
              <span className="acc-t">I tuoi dati<small>{profilo.nome} · {profilo.tel}</small></span>
            </button>
          )}
          {role === "worker" && (
            <button type="button" className="acc-row" onClick={() => { setPaused(!paused); avviso.mostra(paused ? "Profilo di nuovo attivo: torni nelle ricerche." : "Profilo in pausa: non compari nelle ricerche. Il tuo IDA resta."); }}>
              <Icon name="pause" size={19} color={T.ink2} />
              <span className="acc-t">{paused ? "Riattiva il profilo" : "Metti in pausa il profilo"}<small>{paused ? "Torni visibile nelle ricerche" : "Sparisci dalle ricerche, l'IDA resta"}</small></span>
            </button>
          )}
          <button type="button" className="acc-row" onClick={() => nav("dati")}>
            <Icon name="box" size={19} color={T.ink2} />
            <span className="acc-t">Scarica i miei dati<small>Tutto quello che sappiamo di te</small></span>
          </button>
          {blocked.length > 0 && (
            <button type="button" className="acc-row" onClick={() => nav("bloccati")}>
              <Icon name="x" size={19} color={T.ink2} />
              <span className="acc-t">Persone bloccate<small>{blocked.length} {blocked.length === 1 ? "persona" : "persone"}</small></span>
            </button>
          )}
          <button type="button" className="acc-row" onClick={onEsci}>
            <Icon name="logout" size={19} color={T.ink2} />
            <span className="acc-t">Esci<small>Il profilo resta, rientri quando vuoi</small></span>
          </button>
          <button type="button" className="acc-row danger" onClick={() => nav("delete")}>
            <Icon name="trash" size={19} color={T.ember} />
            <span className="acc-t">Elimina il profilo<small>Cancella i tuoi dati da TaskEase</small></span>
          </button>
          <Ricomincia onConferma={onRicomincia} />
        </div>
        </>}
      </div>
    </div>
  );
}

function ClientView({ nav, saved, profilo, prenotazioni = [], setPrenotazioni, blocked = [] }) {
  const favs = (saved || []).filter(id => !blocked.includes(id)).map(wById).filter(Boolean); // i bloccati non si vedono, ma tornano se li sblocchi
  const [chiediDisdetta, setChiediDisdetta] = useState(null);
  const attive = prenotazioni.filter(p => ATTIVA(p) && !passata(p)).sort((a, b) => (quandoDi(a) || 0) - (quandoDi(b) || 0));
  const passate = prenotazioni.filter(p => !attive.includes(p));
  const lista = [...attive, ...passate];
  const disdici = (id) => {
    setChiediDisdetta(null);
    if (passata(prenotazioni.find(p => p.id === id))) { avviso.mostra("L'orario è già passato: non si può più disdire. Se non è venuto nessuno, segnalalo dal giudizio."); return; }
    setPrenotazioni(ps => ps.map(p => p.id === id ? { ...p, stato: "disdetta" } : p)); avviso.mostra("Prenotazione disdetta: avvisiamo chi doveva venire.");
  };
  const ETI = { confermata: "Confermata", "in attesa": "In attesa", disdetta: "Disdetta", giudicata: "Giudicata", segnalata: "Segnalata", annullata: "Ritirata" };
  const h2 = { fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 800, color: T.ink };
  return (
    <>
      {/* In arrivo — solo le prenotazioni fatte davvero */}
      <div style={{ ...h2, marginBottom: 10 }}>In arrivo</div>
      {attive.length === 0 ? (
        <div style={{ background: T.card, border: `1px dashed ${T.line}`, borderRadius: 18, padding: 18, marginBottom: 20, fontSize: 13, color: T.stone, lineHeight: 1.6 }}>
          Nessuna prenotazione. Quando prenoti qualcuno, la trovi qui. <button type="button" className="bt tap" onClick={() => nav("search")} style={{ color: T.accent, fontWeight: 700 }}>Cerca</button>
        </div>
      ) : null}
      {lista.map((b, i) => { const w = wById(b.wid); const spenta = !ATTIVA(b); const fatta = passata(b); const gD = giornoDi(b); return (
        <Fragment key={b.id}>
        {i === attive.length && <div style={{ ...h2, margin: "14px 0 10px" }}>Passate</div>}
        <div style={{ background: spenta ? T.card : T.pine, border: spenta ? `1px solid ${T.line}` : "none", borderRadius: 18, padding: 18, marginBottom: 12, opacity: b.stato === "disdetta" ? .7 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar ini={w.ini} sz={44} onDark={!spenta} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: spenta ? T.ink : T.cream }}>{w.n}</div>
              <div style={{ fontSize: 13, color: spenta ? T.stone : "rgba(246,242,234,.82)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.task}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: spenta ? T.stone : T.accent, background: spenta ? T.line : T.paper, padding: "4px 10px", borderRadius: 8 }}>{ETI[b.stato] || b.stato}</span>
          </div>
          {b.stato === "in attesa" && <div style={{ fontSize: 13, color: "rgba(246,242,234,.82)", marginTop: 10, lineHeight: 1.5 }}>Aspetti la risposta di {w.n.split(" ")[0]}. In questa anteprima non arriva.</div>}
          {!spenta && (chiediDisdetta === b.id ? (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(246,242,234,.12)" }}>
              <div style={{ fontSize: 13, color: T.cream, lineHeight: 1.5, marginBottom: 10 }}>Disdire? Avvisiamo {w.n.split(" ")[0]}. {gD === "Oggi" ? "È per oggi: scusati anche tu con un messaggio." : ""}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="bt tap" onClick={() => disdici(b.id)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: T.emberBtn, color: "#fff", fontSize: 13, fontWeight: 700, textAlign: "center" }}>Sì, disdici</button>
                <button type="button" className="bt tap" onClick={() => setChiediDisdetta(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(246,242,234,.3)", color: T.cream, fontSize: 13, fontWeight: 600, textAlign: "center" }}>No, tienila</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(246,242,234,.12)", flexWrap: "wrap" }}>
              <Icon name="cal" size={16} color="rgba(246,242,234,.82)" />
              <span style={{ fontSize: 13, color: T.cream, fontWeight: 600 }}>{gD} · {b.time}</span>
              <span style={{ flex: 1 }} />
              <span style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button type="button" className="bt tap" onClick={() => nav("chat", b.stato === "confermata" ? { ...w, tema: b.task, quando: `${gD.toLowerCase()} alle ${b.time}` } : w)} style={{ minHeight: 44, padding: "0 14px", borderRadius: 999, border: "1.5px solid rgba(246,242,234,.5)", fontSize: 13.5, fontWeight: 700, color: T.cream }}>Messaggio</button>
              {!fatta && <button type="button" className="bt tap" onClick={() => setChiediDisdetta(b.id)} style={{ minHeight: 44, padding: "0 14px", borderRadius: 999, border: "1.5px solid rgba(246,242,234,.5)", fontSize: 13.5, fontWeight: 700, color: T.cream }}>Disdici</button>}
              </span>
              {b.stato === "confermata" && <button type="button" className="bt tap" onClick={() => nav("review", { ...w, bookingId: b.id })} style={{ width: "100%", marginTop: 4, padding: "10px 0", borderRadius: 10, background: fatta ? T.paper : "transparent", border: fatta ? "none" : "1px dashed rgba(246,242,234,.4)", color: fatta ? T.accent : T.cream, fontSize: 13, fontWeight: fatta ? 700 : 600, textAlign: "center" }}>Lavoro finito? Lascia il giudizio</button>}
              {b.stato === "confermata" && <div style={{ width: "100%", fontSize: 12.5, color: "rgba(246,242,234,.8)", textAlign: "center", marginTop: -6 }}>Anteprima: puoi provarlo subito. Nell'app vera compare dopo la data del lavoro.</div>}
            </div>
          ))}
        </div>
        </Fragment>
      ); })}

      {/* Preferiti — si riempie col cuore sui profili */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "8px 0 12px" }}>
        <span style={h2}>I miei preferiti</span>
        <button type="button" className="bt" onClick={() => nav("search")} style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>Cerca</button>
      </div>
      {favs.length === 0 ? (
        <div style={{ background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14, padding: 18, marginBottom: 22, fontSize: 13, color: T.stone, lineHeight: 1.6 }}>
          Nessun preferito ancora. Tocca il cuore sul profilo di chi ti è piaciuto per ritrovarlo qui.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 14, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
          {favs.map(w => (
            <button type="button" key={w.id} onClick={() => nav("worker", w)} className="bt tap" style={{ textAlign: "center", flexShrink: 0, width: 64 }}>
              <Avatar ini={w.ini} lv={w.lv} sz={56} />
              <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.n.split(" ")[0]}</div>
            </button>
          ))}
        </div>
      )}

      {/* La tua zona — l'indirizzo preciso si scrive solo quando si prenota */}
      <div style={{ ...h2, marginBottom: 10 }}>La tua zona</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "12px 14px", marginBottom: 22 }}>
        <Icon name="pin" size={18} color={T.ink2} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{profilo?.zona}</div><div style={{ fontSize: 13, color: T.stone }}>L'indirizzo preciso lo scrivi quando prenoti.</div></div>
        <button type="button" className="bt tap" onClick={() => nav("csetup", { back: "account", edit: true })} style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>Cambia</button>
      </div>

      {/* Esempio dichiarato: come diventa il profilo dopo qualche lavoro */}
      <details className="esempio">
        <summary className="esempio-top" style={{ cursor: "pointer", marginBottom: 0 }}><span className="ticker-tag">ESEMPIO</span><span>Vedi come diventa il profilo dopo qualche lavoro (dati finti)</span></summary>
        <div style={{ height: 14 }} />
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <button type="button" onClick={() => nav("rewards")} className="bt tap" style={{ flex: 1, background: "#3A2E1A", borderRadius: 16, padding: 16, textAlign: "left" }}>
            <Icon name="star" size={20} color={T.ochre} />
            <div style={{ marginTop: 10, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink }}>Di casa</div>
            <div style={{ fontSize: 12.5, color: T.ochreInk, marginTop: 2 }}>Il livello</div>
          </button>
          <button type="button" onClick={() => nav("passport")} className="bt tap" style={{ flex: 1, background: "#3A2419", borderRadius: 16, padding: 16, textAlign: "left" }}>
            <Icon name="pin" size={20} color="#E39A6E" />
            <div style={{ marginTop: 10 }}><Mono size={18} color={T.ink}>{STAMPS}</Mono></div>
            <div style={{ fontSize: 12.5, color: "#E39A6E", marginTop: 2 }}>Timbri</div>
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={h2}>Ultimi lavori</span>
          <span style={{ fontSize: 13, color: T.stone }}>{CLIENT_JOBS} in tutto</span>
        </div>
        {MY_PAST.map((b, i) => { const w = wById(b.wid); return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < MY_PAST.length - 1 ? `1px solid ${T.line}` : "none" }}>
            <Avatar ini={w.ini} sz={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{b.task}</div>
              <div style={{ fontSize: 12.5, color: T.stone }}>{w.n} · {b.date}</div>
            </div>
            {b.reviewed
              ? blocked.includes(w.id) ? <span style={{ fontSize: 13, color: T.stone }}>Bloccato</span> : <button type="button" onClick={() => nav("booking", w)} className="bt tap" style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>Riprenota</button>
              : <button type="button" onClick={() => nav("review", { ...w, esempio: true })} className="bt tap" style={{ fontSize: 13, fontWeight: 700, color: T.ochreInk }}>Prova a giudicare</button>}
          </div>
        ); })}
      </details>

      {/* Menu */}
      <div style={{ marginTop: 22 }}>
        <MenuRow ic="compass" l="Come funziona TaskEase" onClick={() => nav("help")} />
        <MenuRow ic="message" l="Notifiche" onClick={() => nav("notifications")} />
        <MenuRow ic="shield" l="Assistenza e contatti" onClick={() => nav("assistenza")} />
        <MenuRow ic="book" l="Informazioni legali e privacy" onClick={() => nav("legal", { doc: "info" })} />
      </div>
    </>
  );
}

function WorkerView({ nav, vai, paused, reqs, esempiTutti, setReqs, agenda, setAgenda, availOn, setAvail, verified, setVerified, mie = [], onVediMie }) {
  const avail = availOn && !paused;
  const [conferma, setConferma] = useState(null); // richiesta in attesa di "Sì, accetto"
  const [aperto, setAperto] = useState(null);     // appuntamento in agenda aperto
  const [numeri, setNumeri] = useState(false);
  const [disdiciA, setDisdiciA] = useState(null);
  // arrivando da "Rispondi" in home, si va dritti alla richiesta
  useEffect(() => { if (!vai) return; const t = setTimeout(() => document.getElementById(vai)?.scrollIntoView({ block: "start", behavior: "smooth" }), 120); return () => clearTimeout(t); }, [vai]);
  const w = ME; const lv = LV[w.lv];
  const handle = (r, ok) => {
    setReqs(rs => rs.filter(x => x.id !== r.id));
    if (ok) setAgenda(a => [...a, { id: r.id, c: r.c, task: r.task, det: r.det, time: r.time, when: r.when, addr: r.zona, data: dataDaQuando(r.when, r.time), via: `Via Esempio ${10 + (r.id.charCodeAt(1) % 40)}` }]);
    avviso.mostra(ok ? `${r.c.split(" ")[0]} è in agenda: abbiamo mandato la conferma.` : `Rifiutata. ${r.c.split(" ")[0]} riceve un avviso gentile.`);
    if (ok) setTimeout(() => { setAperto(r.id); document.getElementById("agenda")?.scrollIntoView({ block: "start", behavior: "smooth" }); }, 150);
    setConferma(null);
  };
  return (
    <>
      {mie.length > 0 && (
        <button type="button" className="next-card" style={{ width: "100%", margin: "0 0 16px" }} onClick={onVediMie}>
          <Icon name="cal" size={20} color={T.accent} />
          <span style={{ flex: 1 }}><span className="next-t">Hai prenotato</span><span className="next-s">{wById(mie[0].wid)?.n} · {giornoDi(mie[0])} alle {mie[0].time}</span></span>
          <Icon name="arrowR" size={18} color={T.stone} />
        </button>
      )}
      {/* Availability */}
      <div style={{ background: avail ? T.pineSoft : T.card, borderRadius: 16, padding: 18, border: `1px solid ${avail ? "transparent" : T.line}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: avail ? T.accent : T.ink2 }}>{paused ? "Profilo in pausa" : avail ? "Disponibile ora" : "Non disponibile"}</div>
          <div style={{ fontSize: 13, color: T.ink2, marginTop: 2 }}>{paused ? "Riattiva il profilo per ricevere richieste." : avail ? "Ti arrivano le richieste della zona." : "Accendi per ricevere lavori."}</div>
        </div>
        <button type="button" role="switch" aria-checked={avail} aria-label="Disponibile" disabled={paused} onClick={() => setAvail(!availOn)} className="bt" style={{ width: 50, height: 30, borderRadius: 16, background: avail ? T.pine : T.faint, position: "relative", transition: "all .2s", flexShrink: 0, opacity: paused ? .5 : 1, cursor: paused ? "not-allowed" : "pointer" }}>
          <span style={{ position: "absolute", top: 3, left: avail ? 23 : 3, width: 24, height: 24, borderRadius: 12, background: "#fff", transition: "all .2s" }} />
        </button>
      </div>

      {/* Reputation compact */}
      <button type="button" onClick={() => nav("dashboard")} className="bt tap" style={{ width: "100%", textAlign: "left", background: T.card, borderRadius: 18, padding: 18, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 16, marginBottom: 16, cursor: "pointer" }}>
        <Seal score={w.ida} lv={w.lv} size={64} />
        <div style={{ flex: 1 }}>
          {w.ida == null
            ? <><div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink }}>Profilo nuovo</div><div style={{ fontSize: 13, color: T.ink2, marginTop: 2 }}>Il tuo IDA compare dopo {IDA_MIN_LAVORI} lavori giudicati</div></>
            : <><div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink }}>{lv.l}</div><div style={{ fontSize: 13, color: T.ink2, marginTop: 2 }}>{w.rv} giudizi reali · vedi come ti valutano</div></>}
        </div>
        <Icon name="arrowR" size={20} color={T.stone} />
      </button>

      <button type="button" className="bt tap" onClick={() => nav("worker", { id: "me", self: true, n: ME.n, ini: ME.ini, bio: ME.bio || ME.sk.slice(0, 3).join(" · "), ida: null, lv: "bronzo", pr: ME.pr, d: 0, av: avail, j: 0, rv: 0, ver: verified, sk: ME.sk, rsp: "—", tipo: ME.tipo, abil: ME.abil, rc: ME.rc, preventivo: ME.preventivo })} style={{ width: "100%", textAlign: "center", padding: 12, borderRadius: 12, border: `1.5px solid ${T.pine}`, color: T.accent, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Vedi come ti vedono i clienti</button>
      {/* Sigillo condivisibile — la reputazione spendibile ovunque */}
      <button type="button" onClick={() => nav("share")} className="bt tap" style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, background: T.pine, borderRadius: 14, padding: "14px 16px", marginBottom: 16, cursor: "pointer" }}>
        <Icon name="seal" size={20} color={T.ochre} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.cream }}>Mostra il tuo sigillo</div>
          <div style={{ fontSize: 12.5, color: "rgba(246,242,234,.8)", marginTop: 1 }}>Badge, QR e link da mettere ovunque</div>
        </div>
        <Icon name="arrowR" size={18} color="rgba(246,242,234,.82)" />
      </button>
      {w.ida == null && (
        <div style={{ background: T.ochreSoft, borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, fontWeight: 700, color: T.ochreInk, marginBottom: 10 }}>Come prendere il primo lavoro</div>
          {["Profilo verificato: i clienti si fidano di più", "Un prezzo onesto convince più di mille parole", "Un primo lavoro fatto bene lancia il tuo IDA"].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 2 ? 8 : 0 }}>
              <span aria-hidden="true" style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 10, border: `1.5px solid ${T.ochre}`, color: T.ochreInk, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: T.ochreInk, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Agenda — si riempie davvero con ciò che accetti */}
      <div id="agenda" style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 12, scrollMarginTop: 12 }}>In agenda</div>
      {agenda.length === 0 ? (
        <div style={{ textAlign: "center", padding: "22px 16px", color: T.stone, fontSize: 13, lineHeight: 1.6, background: T.card, borderRadius: 14, border: `1px dashed ${T.line}`, marginBottom: 4 }}>
          Nessun lavoro in agenda. Le richieste che accetti compaiono qui.
        </div>
      ) : agenda.map((a, i) => (
        <div key={a.id || i} style={{ background: T.card, borderRadius: 14, marginBottom: 10, border: `1px solid ${T.line}`, animation: "rise .3s ease" }}>
          <button type="button" className="bt" aria-expanded={aperto === (a.id || i)} onClick={() => setAperto(aperto === (a.id || i) ? null : (a.id || i))} style={{ width: "100%", textAlign: "left", padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ textAlign: "center", minWidth: 50 }}>
              <Mono size={14} color={T.ink}>{a.time}</Mono>
              <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.accent, marginTop: 2, textTransform: "uppercase" }}>{a.data ? giornoDi(a) : a.when.split(" ")[0]}</span>
            </span>
            <span style={{ width: 1, height: 32, background: T.line }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: T.ink }}>{a.task}</span>
              <span style={{ display: "block", fontSize: 13, color: T.stone }}>{a.c} · {a.addr}</span>
            </span>
            <span style={{ display: "inline-flex", transform: aperto === (a.id || i) ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform .2s" }}><Icon name="arrowR" size={16} color={T.stone} /></span>
          </button>
          {aperto === (a.id || i) && (
            <div style={{ padding: "0 14px 14px", fontSize: 13, color: T.ink2, lineHeight: 1.5 }}>
              {a.det && <div style={{ fontStyle: "italic", marginBottom: 8 }}>«{a.det}»</div>}
              <div style={{ marginBottom: 10 }}><strong style={{ color: T.ink }}>Indirizzo: {a.via ? `${a.via}, ` : ""}zona {a.addr}</strong><br /><span style={{ color: T.stone }}>Lo vedi perché hai accettato. In anteprima l'indirizzo è di esempio.</span></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="bt tap" onClick={() => setNumeri(true)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: T.pine, color: "#fff", fontWeight: 700, textAlign: "center" }}>Chiama</button>
                <button type="button" className="bt tap" onClick={() => setNumeri(true)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.line}`, color: T.ink, fontWeight: 700, textAlign: "center" }}>WhatsApp</button>
              </div>
              {numeri && <div style={{ fontSize: 13, color: T.stone, marginTop: 8 }}>In anteprima i numeri non ci sono: nell'app vera chiami o scrivi direttamente da qui.</div>}
              {disdiciA === a.id
                ? <div style={{ marginTop: 10, background: T.paper, borderRadius: 12, padding: 12, border: `1px solid ${T.line}` }}>
                    <div style={{ fontSize: 13, color: T.ink, marginBottom: 8 }}>Non puoi più andare? Avvisiamo {a.c.split(" ")[0]}. Disdire all'ultimo pesa sulla puntualità del tuo IDA.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="bt tap" onClick={() => { setAgenda(ag => ag.filter(x => x.id !== a.id)); setDisdiciA(null); setAperto(null); avviso.mostra(`Disdetto: ${a.c.split(" ")[0]} riceve un avviso.`); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: T.emberBtn, color: "#fff", fontWeight: 700, textAlign: "center" }}>Sì, disdici</button>
                      <button type="button" className="bt tap" onClick={() => setDisdiciA(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.line}`, color: T.ink, fontWeight: 600, textAlign: "center" }}>Annulla</button>
                    </div>
                  </div>
                : <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" className="bt tap" onClick={() => nav("chat", { n: a.c, ini: a.c[0], cliente: true, tema: a.task })} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.line}`, color: T.accent, fontWeight: 700, textAlign: "center" }}>Scrivi in chat</button>
                    <button type="button" className="bt tap" onClick={() => setDisdiciA(a.id)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, color: T.ember, fontWeight: 600, textAlign: "center" }}>Non posso più</button>
                  </div>}
            </div>
          )}
        </div>
      ))}

      {/* Richieste in arrivo — con i dettagli per decidere, e il prezzo calcolato sulla TUA tariffa */}
      <div id="richieste" style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: T.ink, margin: "22px 0 4px", scrollMarginTop: 12 }}>Richieste in arrivo</div>
      <div style={{ fontSize: 13, color: T.stone, marginBottom: 12, lineHeight: 1.5 }}>Rifiutare non abbassa il tuo IDA e non ti fa sparire dalle ricerche. <span className="ticker-tag">ESEMPIO</span> {esempiTutti === "tutti" ? "Nessun esempio combacia con le tue competenze: te li mostriamo tutti. Nell'app vera ricevi solo quelli giusti per te." : esempiTutti === "fuorizona" ? "Esempi per le tue competenze, ma fuori dalle zone che hai scelto: nell'app vera ricevi solo quelli nelle tue zone." : "Richieste di esempio per le tue competenze e zone."}</div>
      {!avail && (
        <div style={{ textAlign: "center", padding: "22px 16px", color: T.stone, fontSize: 13, lineHeight: 1.6, background: T.card, borderRadius: 14, border: `1px dashed ${T.line}` }}>
          {paused ? "Profilo in pausa: le nuove richieste non ti arrivano." : "Non sei disponibile: le nuove richieste non ti arrivano."}
        </div>
      )}
      {avail && reqs.map(r => (
        <div key={r.id} id={"richiesta-" + r.id} style={{ scrollMarginTop: 12, outline: vai === "richiesta-" + r.id ? `2.5px solid ${T.ochre}` : "none", outlineOffset: 2,  background: T.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${T.line}`, animation: "rise .3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{r.task}</div>
              <div style={{ fontSize: 13, color: T.stone, marginTop: 2 }}>{r.c} · {r.zona} · {r.when}, {r.time}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Mono size={15} color={T.accent}>~{w.pr * r.ore}€</Mono>
              <div style={{ fontSize: 11.5, color: T.stone }}>{r.ore}h × {w.pr}€</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.5, marginTop: 8, fontStyle: "italic" }}>«{r.det}»</div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="button" onClick={() => setConferma(r.id)} className="bt tap" style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 11, background: T.pine, color: "#fff", fontSize: 13, fontWeight: 600 }}>Accetta</button>
            <button type="button" onClick={() => nav("chat", { n: r.c, ini: r.c[0], cliente: true, tema: r.task })} className="bt tap" style={{ minHeight: 44, padding: "10px 14px", borderRadius: 11, border: `1px solid ${T.line}`, color: T.ink, fontSize: 13, fontWeight: 600 }}>Chiedi</button>
            <button type="button" onClick={() => setConferma("no-" + r.id)} className="bt tap" style={{ minHeight: 44, padding: "10px 14px", borderRadius: 11, border: `1px solid ${T.line}`, color: T.ink2, fontSize: 13, fontWeight: 600 }}>Rifiuta</button>
          </div>
          {conferma === "no-" + r.id && (
            <div style={{ marginTop: 12, background: T.paper, borderRadius: 12, padding: 12, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, marginBottom: 10 }}>Rifiuti? {r.c.split(" ")[0]} riceve un avviso gentile. Il tuo IDA non cambia.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="bt tap" onClick={() => handle(r, false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: T.faint, color: "#fff", fontWeight: 700, textAlign: "center" }}>Sì, rifiuta</button>
                <button type="button" className="bt tap" onClick={() => setConferma(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.line}`, color: T.ink, fontWeight: 600, textAlign: "center" }}>Annulla</button>
              </div>
            </div>
          )}
          {conferma === r.id && (
            <div style={{ marginTop: 12, background: T.pineSoft, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, marginBottom: 10 }}>Accetti? {r.c.split(" ")[0]} riceve il tuo numero e tu vedi il suo indirizzo, qui in agenda.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="bt tap" onClick={() => handle(r, true)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: T.pine, color: "#fff", fontWeight: 700, textAlign: "center" }}>Sì, accetto</button>
                <button type="button" className="bt tap" onClick={() => setConferma(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.line}`, color: T.ink, fontWeight: 600, textAlign: "center" }}>Annulla</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {avail && reqs.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 16px", color: T.stone, fontSize: 13, lineHeight: 1.6, background: T.card, borderRadius: 14, border: `1px dashed ${T.line}` }}>
          {agenda.length > 0 ? "Hai gestito tutte le richieste." : "Nessuna nuova richiesta per ora."}
        </div>
      )}

      {/* Il tuo mese */}
      <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: T.ink, margin: "22px 0 12px" }}>Il tuo mese</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 16, border: `1px solid ${T.line}` }}><Mono size={18} color={T.ink}>{MONTH.jobs}</Mono><div style={{ fontSize: 12.5, color: T.stone, marginTop: 3 }}>lavori conclusi</div></div>
        <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 16, border: `1px solid ${T.line}` }}><Mono size={18} color={T.ink}>{agenda.length}</Mono><div style={{ fontSize: 12.5, color: T.stone, marginTop: 3 }}>in agenda</div></div>
      </div>
      <div style={{ fontSize: 12.5, color: T.stone, marginBottom: 22, lineHeight: 1.5 }}>I soldi non li vediamo: li gestisci tu, direttamente col cliente. Per questo qui non trovi incassi.</div>

      {/* Abbonamento — nuovo: gratis durante il lancio */}
      <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Il tuo abbonamento</div>
      <div style={{ background: T.pine, borderRadius: 18, padding: 20, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: T.cream }}>TaskEase Base</span>
          <div><Mono size={20} color={T.cream}>Gratis</Mono></div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(246,242,234,.12)", borderRadius: 8, padding: "5px 10px", marginTop: 10 }}>
          <Icon name="seal" size={13} color={T.ochre} />
          <span style={{ fontSize: 12.5, color: T.cream, fontWeight: 600 }}>Tutto l'essenziale, gratis. Richieste illimitate.</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(246,242,234,.8)", marginTop: 12, lineHeight: 1.5 }}>Pro ({PLAN.price}€/mese IVA inclusa, disdici quando vuoi) aggiunge statistiche, riepiloghi e strumenti per la fattura. Del tutto facoltativo: chi cerca ti sceglie per il tuo lavoro, non per l'abbonamento.</div>
      </div>

      {/* Reviews received */}
      <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Cosa dicono di te</div>
      {REVIEWS_IN.length === 0 ? (
        <div style={{ textAlign: "center", padding: "22px 16px", color: T.stone, fontSize: 13, lineHeight: 1.6, background: T.card, borderRadius: 14, border: `1px dashed ${T.line}` }}>
          Ancora nessun giudizio. Arriveranno coi primi lavori e costruiranno il tuo IDA.
        </div>
      ) : REVIEWS_IN.map((r, i) => (
        <div key={i} style={{ background: T.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${T.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Seal score={r.s} lv={lvKeyOf(r.s)} size={36} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{r.a}</div><div style={{ fontSize: 12.5, color: T.stone }}>{r.when}</div></div>
          </div>
          <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.5, fontStyle: "italic" }}>"{r.t}"</div>
        </div>
      ))}

      {/* Menu */}
      <div style={{ marginTop: 18 }}>
        <MenuRow ic="wrench" l="Competenze, tariffa e zone" onClick={() => nav("setup", { edit: true })} />
        <MenuRow ic="bell" l="Notifiche" onClick={() => nav("notifications")} />
        {!verified && <MenuRow ic="shield" l="Completa la verifica dell'identità" onClick={() => { setVerified(true); avviso.mostra("Identità verificata (simulata). Nell'app vera ci vediamo di persona o in videochiamata."); }} />}
        <MenuRow ic="message" l="Registra il video-profilo" soon />
        <MenuRow ic="compass" l="Come funziona" onClick={() => nav("help")} />
        <MenuRow ic="box" l="Abbonamento e fatture" soon />
        <MenuRow ic="book" l="Informazioni legali e privacy" onClick={() => nav("legal", { doc: "info" })} />
      </div>
    </>
  );
}

function MenuRow({ ic, l, onClick, soon }) {
  return (
    <button type="button" disabled={soon} onClick={soon ? undefined : onClick} className={soon ? "bt" : "bt tap"} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 14, padding: "15px 0", borderBottom: `1px solid ${T.line}`, cursor: soon ? "default" : "pointer", opacity: soon ? .8 : 1 }}>
      <Icon name={ic} size={20} color={T.ink2} />
      <span style={{ flex: 1, fontSize: 14, color: T.ink, fontWeight: 500 }}>{l}</span>
      {soon ? <span style={{ fontSize: 11.5, fontWeight: 700, color: T.stone, background: T.line, padding: "3px 8px", borderRadius: 6, letterSpacing: .3 }}>PRESTO</span> : <Icon name="arrowR" size={18} color={T.faint} />}
    </button>
  );
}

/* ============================== DASHBOARD (reputazione completa) ============================== */
function Dashboard({ nav }) {
  const w = ME; const lv = LV[w.lv];
  const isNew = w.ida == null;
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div style={{ padding: "16px 18px 0" }}>
        <button type="button" className="head-back" aria-label="Indietro" onClick={() => nav.back("account")}><Icon name="arrowL" size={20} /></button>
      </div>
      <div style={{ padding: "16px 22px 24px", textAlign: "center" }}>
        <Seal score={w.ida} lv={w.lv} size={104} />
        <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: T.ink, marginTop: 16 }}>{w.n}</h1>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 10 }}>
          <span className="badge">{w.tipo === "piva" ? "Professionista con P.IVA" : "Privato · prestazione occasionale"}</span>
          {w.abil && <span className="badge ok">Impresa abilitata DM 37/08 (dichiarata)</span>}
          {w.rc && <span className="badge">Assicurazione RC (dichiarata)</span>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: lv.c, textTransform: "uppercase", letterSpacing: .6, marginTop: 8 }}>{isNew ? "Profilo nuovo · IDA in costruzione" : `${lv.l} · ${w.rv} giudizi reali`}</div>
      </div>
      <div style={{ padding: "0 22px 24px" }}>
        {isNew && (
          <div style={{ background: T.ochreSoft, borderRadius: 16, padding: 18, marginBottom: 14, lineHeight: 1.6, fontSize: 13, color: T.ochreInk }}>
            Il tuo IDA compare dopo <strong>{IDA_MIN_LAVORI} lavori valutati</strong>: prima sul profilo c'è scritto NUOVO, non un numero inventato. Hai {w.rv} giudizi su {IDA_MIN_LAVORI}.
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {Array.from({ length: IDA_MIN_LAVORI }).map((_, i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < w.rv ? T.ochre : "rgba(169,118,43,.2)" }} />)}
            </div>
          </div>
        )}
        <div style={{ background: T.card, borderRadius: 18, padding: 20, border: `1px solid ${T.line}`, marginBottom: 14 }}>
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Come ti giudicano</div>
          <div style={{ fontSize: 12.5, color: T.stone, marginBottom: 16 }}>Cinque domande dopo ogni lavoro. Questi sono i pesi.</div>
          {IDA_VOCI.map((v) => (
            <div key={v.k} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: T.ink2 }}>{v.l}</span>
                <span style={{ display: "flex", gap: 10 }}><Mono size={11} color={T.stone} w={400}>peso {Math.round(v.w * 100)}%</Mono><Mono size={12} color={T.stone}>—</Mono></span>
              </div>
              <div style={{ height: 5, background: T.line, borderRadius: 3, overflow: "hidden" }} />
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: T.stone, marginTop: 4, lineHeight: 1.5 }}>I pesi sono una prima proposta, decisa ragionando e non da uno studio. Ogni modifica viene annunciata 30 giorni prima. I lavori degli ultimi 12 mesi contano per intero, quelli tra 12 e 24 mesi a metà, quelli più vecchi non contano.</div>
        </div>
        {/* Come funziona l'IDA — trasparente, nessun premio alla disponibilità */}
        <div style={{ background: T.pineSoft, borderRadius: 18, padding: 20, marginBottom: 14 }}>
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.accent, marginBottom: 6 }}>Come cresce il tuo IDA</div>
          <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.55, margin: 0 }}>
            Solo i clienti lo muovono, con i giudizi sui lavori conclusi. Non lo tocchiamo noi, non dipende da quanti lavori accetti né da quanto sei disponibile. È una reputazione, non un premio: la mostriamo a chi cerca, poi la scelta è sua.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[[w.j, "lavori"], [w.rv, "giudizi"], ["—", "disdette"]].map(([v, l], i) => (
            <div key={i} style={{ flex: 1, background: T.card, borderRadius: 14, padding: "14px 8px", textAlign: "center", border: `1px solid ${T.line}` }}>
              <Mono size={16}>{v}</Mono><div style={{ fontSize: 11.5, color: T.stone, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== NEIGHBORHOOD ============================== */
function Neighborhood({ nav, posts, onRemove, pro, paused }) {
  const [tab, setTab] = useState("all");
  const [serve, setServe] = useState(null); // risposta senza profilo da professionista: spieghiamo cosa serve
  const [togli, setTogli] = useState(null);
  const [aperti, setAperti] = useState([]); // annunci lunghi aperti per intero
  const f = (posts || POSTS).filter(p => tab === "all" || p.t === tab);
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, display: "flex", flexDirection: "column" }}>
      <Head nav={nav} to="home" title="Bacheca del quartiere" root />
      <div className="seg" role="group" aria-label="Filtra la bacheca" style={{ marginTop: 4 }}>
        {[["all", "Tutto"], ["req", "Richieste"], ["job", "Al lavoro"]].map(([k, l]) => <button type="button" key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 20px 18px" }}>
        {/* Niente "il migliore del mese": la piattaforma non mette in vetrina nessuno */}
        <div style={{ fontSize: 13.5, color: T.ink2, margin: "12px 0", lineHeight: 1.5 }}>In ordine di tempo. Nessuno paga per stare in cima.{f.some(p => p.demo) && <> <span className="ticker-tag">ESEMPI</span> gli annunci senza «La tua» sono finti.</>}</div>
        {f.map((p, i) => (
          <article key={p.id || i} className={"post" + (p.mine ? " mine" : "")} style={{ animationDelay: `${i * .05}s` }}>
            <div className="post-t" aria-label={p.ago === "adesso" ? "adesso" : `${p.ago} fa`}>{p.ago}</div>
            <div style={{ minWidth: 0 }}>
              <div className={"post-k" + (p.mine || p.t === "job" ? " job" : "")}>{p.mine ? "La tua" : p.t === "job" ? "Al lavoro" : "Cerca aiuto"} · {p.h}</div>
              <div className={"post-x a-capo" + (aperti.includes(p.id || i) ? "" : " tre-righe")}>{p.tx}</div>
              {p.tx.length > 160 && <button type="button" className="bt tap" onClick={() => setAperti(a => a.includes(p.id || i) ? a.filter(x => x !== (p.id || i)) : [...a, p.id || i])} style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{aperti.includes(p.id || i) ? "Mostra meno" : "Leggi tutto"}</button>}
              <div className="post-by">{p.a}{p.foto && " · con foto (simulata)"}</div>
              {p.mine && (togli === p.id
                ? <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13.5, color: T.ink, marginBottom: 8 }}>Togliere la richiesta dalla bacheca?</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="bt tap" onClick={() => { onRemove?.(p.id); setTogli(null); }} style={{ flex: 1, minHeight: 44, borderRadius: 8, background: T.emberBtn, color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "center" }}>Sì, togli</button>
                      <button type="button" className="bt tap" onClick={() => setTogli(null)} style={{ flex: 1, minHeight: 44, borderRadius: 8, border: `1.5px solid ${T.rule}`, color: T.ink, fontWeight: 600, fontSize: 14, textAlign: "center" }}>Annulla</button>
                    </div>
                  </div>
                : <div className="post-a"><span style={{ flex: 1, fontSize: 13, color: T.ink2 }}>Ancora nessuna risposta. Ti avvisiamo appena qualcuno scrive.</span><button type="button" className="bt tap" onClick={() => setTogli(p.id)} style={{ fontSize: 13.5, fontWeight: 700, color: T.ember }}>Togli</button></div>)}
              {!p.mine && <div className="post-a">
                {p.t === "req" && <button type="button" className="rispondi" onClick={() => pro && !paused ? nav("chat", { n: p.a, ini: p.a[0], cliente: true, tema: p.tx }) : setServe(serve === (p.id || i) ? null : (p.id || i))}>Rispondi</button>}
                {p.r ? <span className="n">{p.r} risposte</span> : null}
                <button type="button" className="bt tap segn" onClick={() => nav("segnala", { tipo: `Annuncio di ${p.a}`, testo: p.tx, rif: `bacheca/${p.id || "post"}` })}>Segnala</button>
              </div>}
              {serve === (p.id || i) && (
                <div role="status" style={{ marginTop: 12, borderLeft: `3px solid ${T.ochre}`, padding: "2px 0 2px 12px", fontSize: 13.5, color: T.ink2, lineHeight: 1.5 }}>
                  {paused ? "Il tuo profilo da professionista è in pausa: riattivalo per rispondere." : "Per proporti a un lavoro serve il profilo da professionista: codice fiscale e le dichiarazioni previste dalla legge. Ci vogliono pochi minuti."}
                  <div style={{ marginTop: 6 }}><button type="button" className="bt tap" onClick={() => paused ? nav("account", { ruolo: "worker" }) : nav("setup")} style={{ fontWeight: 700, color: T.accent, textDecoration: "underline", textUnderlineOffset: 3 }}>{paused ? "Vai al profilo" : "Crea il profilo da professionista"}</button></div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ============================== PASSPORT ============================== */
function Passport({ nav }) {
  const [sel, setSel] = useState(null);
  const tot = STAMPS;
  const sq = sel ? QUARTIERI.find(q => q.id === sel) : null;
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="home" title="Passaporto" />
      <div style={{ padding: "0 22px 24px" }}>
        <div className="esempio-top" style={{ marginBottom: 14 }}><span className="ticker-tag">ESEMPIO</span><span>Timbri e premi sono di esempio: ogni lavoro finito colora un quartiere.</span></div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[[tot, "timbri"], [`${QUARTIERI.filter(q => q.s > 0).length}/7`, "zone"], [BADGES.filter(b => b.ok).length, "premi"]].map(([v, l], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", background: T.card, borderRadius: 14, padding: "16px 8px", border: `1px solid ${T.line}` }}>
              <Mono size={22} color={T.accent}>{v}</Mono><div style={{ fontSize: 12.5, color: T.stone, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 4 }}>La tua Forlì</div>
        <p style={{ fontSize: 13, color: T.ink2, marginTop: 0, marginBottom: 14 }}>Ogni lavoro finito colora un quartiere. Cinque timbri in una zona e diventi “di casa” lì.</p>
        <div style={{ width: "100%", height: 210, background: T.card, borderRadius: 20, position: "relative", border: `1px solid ${T.line}`, marginBottom: 14, overflow: "hidden" }}>
          {QUARTIERI.map(q => {
            const sz = q.s > 0 ? 16 + Math.min(q.s, 8) * 2.5 : 13;
            return (
              <button type="button" aria-label={`${q.n}: ${q.s} timbri`} aria-pressed={sel === q.id} key={q.id} className="bt dot" onClick={() => setSel(sel === q.id ? null : q.id)} style={{ position: "absolute", left: `${q.x}%`, top: `${q.y}%`, transform: "translate(-50%,-50%)", width: sz, height: sz, borderRadius: sz, background: q.s > 0 ? T.pine : "transparent", border: q.s > 0 ? "none" : `1.5px dashed ${T.faint}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s", boxShadow: sel === q.id ? `0 0 0 4px ${T.pine}22` : "none" }}>
                {q.s > 0 && <Mono size={9} color="#fff">{q.s}</Mono>}
              </button>
            );
          })}
          {QUARTIERI.filter(q => q.s > 0).map(q => <span key={`l${q.id}`} style={{ position: "absolute", left: `${q.x}%`, top: `${q.y + 9}%`, transform: "translateX(-50%)", fontSize: 8, fontWeight: 600, color: T.accent, pointerEvents: "none", whiteSpace: "nowrap" }}>{q.n}</span>)}
        </div>
        {sq && (
          <div style={{ background: T.card, borderRadius: 14, padding: 16, border: `1.5px solid ${T.pine}`, marginBottom: 16, animation: "rise .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink }}>{sq.n}</span>
              <Mono size={13} color={T.ink2}>{sq.s} timbri</Mono>
            </div>
            {sq.s >= 5 ? <div style={{ fontSize: 13, color: T.accent, fontWeight: 600, marginTop: 8 }}>Sei “di casa” in {sq.n} ✓ · badge sbloccato</div>
              : sq.s > 0 ? <div style={{ marginTop: 10 }}><div style={{ height: 5, background: T.line, borderRadius: 3 }}><div style={{ height: 5, background: T.pine, borderRadius: 3, width: `${(sq.s / 5) * 100}%` }} /></div><div style={{ fontSize: 12.5, color: T.stone, marginTop: 5 }}>Ancora {5 - sq.s} per il badge della zona</div></div>
                : <div style={{ fontSize: 13, color: T.stone, marginTop: 8, fontStyle: "italic" }}>Zona ancora da scoprire.</div>}
          </div>
        )}
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Premi</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {BADGES.map((b, i) => (
            <div key={i} style={{ background: b.ok ? T.card : "transparent", borderRadius: 14, padding: "16px 8px", textAlign: "center", border: `1px solid ${b.ok ? T.line : "transparent"}`, opacity: b.ok ? 1 : .85 }}>
              <div style={{ display: "flex", justifyContent: "center", color: b.ok ? T.ochre : T.faint }}><Icon name={b.ic} size={24} color={b.ok ? T.ochre : T.faint} /></div>
              <div style={{ fontSize: 12, fontWeight: 600, color: b.ok ? T.ink : T.stone, marginTop: 8 }}>{b.n}</div>
              {!b.ok && b.p && <div style={{ fontSize: 9, color: T.stone, marginTop: 2 }}>{b.p}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== VANTAGGI (cliente) ============================== */
function Rewards({ nav, profilo }) {
  const codice = ((profilo?.nome || "amico").split(" ")[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z]/g, "").toUpperCase() || "AMICO") + "-FORLI";
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="home" title="Vantaggi" />
      <div style={{ padding: "4px 22px 24px" }}>
        <div className="esempio-top" style={{ marginBottom: 14 }}><span className="ticker-tag">ESEMPIO</span><span>Livello e numeri sono di esempio: così appare dopo qualche lavoro.</span></div>
        {/* Status — riconoscimento, non denaro */}
        <div style={{ background: T.pine, borderRadius: 20, padding: 22, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "rgba(246,242,234,.8)", letterSpacing: .4, textTransform: "uppercase", fontWeight: 600 }}>Il tuo livello</div>
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 30, fontWeight: 800, color: T.cream, marginTop: 4, letterSpacing: -.5 }}>{PERKS.level}</div>
          <div style={{ fontSize: 13, color: "rgba(246,242,234,.8)", marginTop: 2 }}>{PERKS.jobs} lavori richiesti a Forlì.</div>
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 7, background: "rgba(246,242,234,.18)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: 7, background: T.ochre, borderRadius: 4, width: `${(PERKS.jobs / (PERKS.jobs + PERKS.toNext)) * 100}%` }} />
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(246,242,234,.8)", marginTop: 7 }}>Ancora {PERKS.toNext} lavori e diventi <strong style={{ color: T.cream }}>{PERKS.nextLevel}</strong>.</div>
          </div>
        </div>

        {/* Cosa ti dà — vantaggi reali ma non monetari */}
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, margin: "6px 0 4px" }}>Cosa ti dà</div>
        <div style={{ fontSize: 12.5, color: T.stone, marginBottom: 12 }}>Comodità e riconoscimento. Nessun vantaggio cambia l'ordine dei risultati o l'IDA di qualcuno.</div>
        {PERK_LIST.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: T.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${T.line}`, opacity: p.ok ? 1 : .85 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: p.ok ? T.pineSoft : T.line, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={p.ic} size={20} color={p.ok ? T.accent : T.stone} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{p.t}</div>
              <div style={{ fontSize: 12.5, color: T.stone, marginTop: 1 }}>{p.s}</div>
            </div>
            {p.ok ? <Icon name="check" size={18} color={T.accent} /> : <span style={{ fontSize: 12, color: T.stone, fontWeight: 700 }}>{p.p || "presto"}</span>}
          </div>
        ))}

        {/* Porta un vicino — crescita, premio = status (niente soldi, non gestiamo pagamenti) */}
        <div style={{ background: T.card, borderRadius: 18, padding: 20, border: `1px solid ${T.line}`, margin: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: T.ochreSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="heart" size={22} color={T.ochre} /></div>
            <div>
              <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: T.ink }}>Porta un vicino</div>
              <div style={{ fontSize: 13, color: T.ink2, marginTop: 1 }}>Più zona attiva, più gente fidata vicino a te.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: T.paper, borderRadius: 11, padding: "10px 14px", border: `1px dashed ${T.faint}` }}>
            <Mono size={15} color={T.accent}>{codice}</Mono>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.stone, background: T.line, padding: "3px 8px", borderRadius: 6, letterSpacing: .3 }}>PRESTO</span>
          </div>
          <div style={{ fontSize: 12.5, color: T.stone, marginTop: 10, lineHeight: 1.5 }}>Il premio è solo un riconoscimento: niente soldi, niente sconti sulle tariffe di chi lavora.</div>
        </div>

        <button type="button" onClick={() => nav("passport")} className="bt tap" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, border: `1px solid ${T.line}`, color: T.ink }}>
          <Icon name="pin" size={18} color={T.accent} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Vedi i timbri delle tue zone nel Passaporto</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */
function Head({ nav, to, data, title, root }) {
  return (
    <div className={"head" + (root ? " head-root" : "")}>
      {!root && <button type="button" className="head-back" onClick={() => nav.back ? nav.back(to, data) : nav(to, data)} aria-label="Indietro"><Icon name="arrowL" size={20} /></button>}
      <span className="head-t">{title}</span>
    </div>
  );
}
function Label({ children }) { return <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 10 }}>{children}</div>; }
function Chip({ children, on, onClick, center }) {
  // Un solo stile di scelta in tutta l'app: alto 44px, a pillola, selezionato = verde pino
  return <button type="button" className="bt" aria-pressed={!!on} onClick={onClick} style={{ minHeight: 44, padding: center ? "0 4px" : "0 16px", borderRadius: 999, fontSize: 14, fontWeight: 600, transition: "all .16s", background: on ? T.pine : T.card, color: on ? "#fff" : T.ink2, border: `1.5px solid ${on ? T.pine : T.line}`, display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", flexShrink: 0 }}>{children}</button>;
}
function Sum({ k, v }) { return <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: T.ink2 }}>{k}</span><span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{v}</span></div>; }
function Done({ nav, title, body, actions }) {
  const pronto = usePronto();
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, animation: "rise .4s ease" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: T.pineSoft, display: "flex", alignItems: "center", justifyContent: "center", animation: "stamp .5s ease both" }}><Icon name="check" size={34} color={T.accent} w={2} /></div>
        <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: T.ink, marginTop: 22, letterSpacing: -.3 }}>{title}</h1>
        <p style={{ fontSize: 14, color: T.ink2, textAlign: "center", lineHeight: 1.6, marginTop: 8, marginBottom: 28 }}>{body}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", pointerEvents: pronto ? "auto" : "none" }}>{actions}</div>
      </div>
    </div>
  );
}

/* ============================== PROFILO DI CHI CERCA AIUTO ==============================
   Tre campi, niente password, niente documenti. Si può guardare senza profilo:
   lo chiediamo solo quando serve davvero (prenotare, pubblicare). */
const ZONE_CLIENTE = [...QUARTIERI.map(q => q.n), "Altra zona di Forlì", "Cesena e dintorni"];
const iniOf = (nome) => String(nome || "").trim().split(/\s+/).map(x => x[0] || "").join("").slice(0, 2).toUpperCase() || "?";
const normTel = (t) => String(t || "").replace(/\D/g, "").replace(/^39(?=3\d{8,9}$)/, "");
const telOk = (t) => /^3\d{8,9}$/.test(String(t || "").replace(/\D/g, "").replace(/^39(?=3\d{8,9}$)/, ""));

// Quello che l'ospite scrive nel foglio "crea profilo" resta se lo chiude e lo riapre
const BOZZA_PROFILO = {};
function ClientProfileForm({ initial, onDone, cta = "Crea il profilo", pro }) {
  const [fase, setFase] = useState("form");
  const [nome, setNome] = useState(initial?.nome || (!initial && BOZZA_PROFILO.nome) || "");
  const [tel, setTel] = useState(initial?.tel || (!initial && BOZZA_PROFILO.tel) || "");
  const [zona, setZona] = useState(initial?.zona || (!initial && BOZZA_PROFILO.zona) || null);
  useEffect(() => { if (!initial) Object.assign(BOZZA_PROFILO, { nome, tel, zona }); }, [nome, tel, zona]);
  const [ok, setOk] = useState(!!initial);
  const [tocco, setTocco] = useState(false);
  const errs = [];
  if (nome.trim().length < 2) errs.push("il tuo nome");
  if (!telOk(tel)) errs.push("un cellulare valido");
  if (!zona) errs.push("la tua zona");
  if (!ok) errs.push("l'accettazione in fondo");
  const valido = errs.length === 0;
  const dati = () => ({ nome: nome.trim().split(/\s+/).map(x => x[0].toUpperCase() + x.slice(1)).join(" "), tel: tel.trim(), zona });
  // Numero nuovo o cambiato: lo confermiamo con un codice
  const stessoNumero = initial && normTel(initial.tel) === normTel(tel);
  const formRef = useRef(null);
  const invia = () => {
    setTocco(true);
    if (!valido) { setTimeout(() => (formRef.current?.querySelector(".cp-err") || formRef.current)?.scrollIntoView({ block: "center", behavior: "smooth" }), 50); return; }
    if (stessoNumero) onDone(dati()); else setFase("otp");
  };
  if (fase === "otp") return <OtpStep tel={tel} onOk={() => onDone(dati())} onBack={() => setFase("form")} />;
  return (
    <div className="cp-form" ref={formRef}>
      <label className="cp-f">
        <span className="cp-l">{pro ? "Nome e cognome" : "Come ti chiami?"}</span>
        <input className="cp-in" value={nome} onChange={e => setNome(e.target.value)} placeholder={pro ? "Es. Giulia Bertozzi" : "Es. Giulia"} autoComplete={pro ? "name" : "given-name"} maxLength={50} />
        <span className="cp-h">{pro ? "È anche il nome del tuo profilo pubblico di lavoro." : "Basta il nome. Lo vede chi riceve la tua richiesta."}</span>
      </label>
      <label className="cp-f">
        <span className="cp-l">Il tuo cellulare</span>
        <input className="cp-in" value={tel} onChange={e => setTel(e.target.value)} placeholder="Es. 333 123 4567" inputMode="tel" autoComplete="tel" maxLength={16} />
        <span className="cp-h">Lo diamo solo a chi accetta il tuo lavoro, per mettervi d'accordo. Niente pubblicità.</span>
      </label>
      <div className="cp-f">
        <span className="cp-l">Dove abiti, più o meno?</span>
        <div className="cp-chips" role="group" aria-label="Zona">
          {ZONE_CLIENTE.map(z => <button key={z} type="button" className={"cp-chip" + (zona === z ? " on" : "")} aria-pressed={zona === z} onClick={() => setZona(z)}>{z}</button>)}
        </div>
        <span className="cp-h">{zona === "Cesena e dintorni" ? "A Cesena siamo ancora pochi: per ora ti mostriamo chi lavora a Forlì, con la distanza vera." : "Serve a mostrarti chi lavora vicino. L'indirizzo preciso lo dai solo a chi viene."}</span>
      </div>
      <details className="cp-priv">
        <summary>Come usiamo i tuoi dati</summary>
        <p>Nome e zona li vede chi riceve la tua richiesta. Il cellulare solo chi accetta il lavoro. Non vendiamo dati e non mandiamo pubblicità. Puoi modificarli o cancellare il profilo quando vuoi da Profilo. In questa anteprima nulla viene salvato su un server.</p>
      </details>
      <label className="cp-check">
        <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />
        <span>Ho almeno 18 anni, accetto i <button type="button" className="bt cp-link" onClick={e => { e.preventDefault(); legale.apri("termini"); }}>Termini d'uso</button> e ho letto l'<button type="button" className="bt cp-link" onClick={e => { e.preventDefault(); legale.apri("privacy"); }}>informativa privacy</button>.</span>
      </label>
      <button type="button" className={"cp-btn" + (valido ? "" : " off")} onClick={invia}>{cta}</button>
      {tocco && !valido && <div className="cp-err" role="alert">Manca {errs.join(", ")}.</div>}
    </div>
  );
}

function ClientSetup({ nav, initial, back, onDone, fromOnb, pro, onIndietro }) {
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      {!fromOnb && <Head nav={nav} to={back || "account"} title={initial ? "I tuoi dati" : "Crea il profilo"} />}
      <div className="cp">
        {fromOnb && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <button type="button" className="head-back" aria-label="Indietro" onClick={onIndietro}><Icon name="arrowL" size={20} /></button>
            <button type="button" className="cp-later" style={{ margin: 0 }} onClick={() => nav("home")}>Guardo prima, lo creo dopo</button>
          </div>
        )}
        {fromOnb && <div className="cp-eye" style={{ marginTop: 18 }}>Ultimo passo</div>}
        <h1 className="cp-h1">{initial ? "Modifica i tuoi dati" : <>Crea il tuo profilo.<br /><em>Un minuto, tre cose.</em></>}</h1>
        {!initial && <p className="cp-sub">Ti serve per prenotare e per farti ricontattare. Niente password e niente documenti.</p>}
        <ClientProfileForm initial={initial} onDone={onDone} pro={pro} cta={initial ? "Salva" : "Crea il profilo"} />
      </div>
    </div>
  );
}

/* Foglio che compare sopra Prenota / Pubblica quando manca il profilo: non si perde quello che hai scritto */
function ProfileSheet({ motivo, onDone, onClose, initial }) {
  const ref = useSheet(onClose);
  useIndietro(true, () => { onClose(); return true; });
  return (
    <div className="cp-sheet-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cp-sheet" role="dialog" aria-modal="true" aria-label="Crea il profilo" tabIndex={-1} ref={ref}>
        <div className="cp-grab" />
        <div className="cp-sheet-top">
          <div><div className="cp-sheet-t">Ancora un attimo</div><div className="cp-sheet-s">{motivo}</div></div>
          <button type="button" className="cp-x" aria-label="Chiudi" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <ClientProfileForm initial={initial} onDone={onDone} cta={initial ? "Conferma e invia" : "Crea il profilo e invia"} />
      </div>
    </div>
  );
}

/* ============================== ELIMINA PROFILO ==============================
   Onesta: dice cosa si cancella e cosa resta (anonimo), propone la pausa a chi lavora,
   chiede il motivo solo come facoltativo, e chiede una sola conferma esplicita. */
const MOTIVI_USCITA = ["Non ho trovato chi cercavo", "Poche richieste nella mia zona", "Ho risolto in altro modo", "Mi preoccupa la privacy", "Altro"];
function DeleteAccount({ nav, role, onPause, onDeleted, onDeletedPro, entrambi, setupDone, paused, attive = [], agenda = [] }) {
  const [soloPro, setSoloPro] = useState(role === "worker" && !!entrambi);
  const haPro = !!setupDone || role === "worker" || entrambi;
  const [ok, setOk] = useState(false);
  const [motivo, setMotivo] = useState(null);
  const [fatto, setFatto] = useState(false);
  const isW = haPro && !entrambi;
  if (fatto) return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div className="del-done">
        <div className="del-done-ic"><Icon name="check" size={32} color={T.accent} w={2} /></div>
        <h1>Profilo eliminato.</h1>
        <p>I tuoi dati sono spariti dall'app adesso. Dai nostri archivi e dalle copie di sicurezza li cancelliamo entro 30 giorni.<br />Grazie per averci provato.</p>
        <Btn full onClick={onDeleted}>Torna all'inizio</Btn>
      </div>
    </div>
  );
  const viaPro = ["Il tuo profilo pubblico, la foto e la descrizione", "Il tuo IDA e i giudizi che hai ricevuto", "Il sigillo e i link che hai condiviso (smettono di funzionare)", "Telefono, zone, tariffa, chat e agenda"];
  const viaCliente = ["Nome, telefono e indirizzi", "I tuoi preferiti e le chat", "Le richieste che hai pubblicato in bacheca", "Lo storico delle prenotazioni"];
  // Profilo unico: se hai sia il lato cliente sia quello professionale, si cancellano entrambi e lo diciamo
  const via = soloPro ? viaPro.map(x => x.startsWith("Telefono, zone") ? "Zone, tariffa, agenda e chat di lavoro" : x) : entrambi ? [...viaPro, ...viaCliente.filter(x => !x.startsWith("Nome, telefono"))] : isW ? viaPro : viaCliente;
  const resta = [
    ...(soloPro ? ["Il tuo profilo per cercare aiuto: nome, telefono, preferiti e prenotazioni."] : []),
    ...((role === "client" || entrambi) && !soloPro ? ["I giudizi che hai lasciato, senza il tuo nome: fanno parte dell'IDA di chi ha lavorato per te."] : []),
    ...(haPro ? ["I dati fiscali già comunicati all'Agenzia delle Entrate restano negli archivi per il tempo previsto dalla legge."] : []),
  ];
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="account" title="Elimina il profilo" />
      <div className="del">
        <h1 className="del-h">Prima di confermare, ecco cosa succede.</h1>

        {entrambi && (
          <div style={{ marginBottom: 16 }}>
            <div className="del-lab" style={{ marginBottom: 8 }}>Cosa vuoi eliminare?</div>
            <div className="del-chips">
              <button type="button" className={"del-chip" + (!soloPro ? " on" : "")} aria-pressed={!soloPro} onClick={() => setSoloPro(false)}>Tutto</button>
              <button type="button" className={"del-chip" + (soloPro ? " on" : "")} aria-pressed={soloPro} onClick={() => setSoloPro(true)}>Solo il profilo da professionista</button>
            </div>
          </div>
        )}
        {(!soloPro && attive.length > 0 || agenda.length > 0) && (
          <div role="alert" style={{ background: T.emberSoft, borderRadius: 14, padding: "14px 16px", marginBottom: 16, fontSize: 13.5, color: T.ember, lineHeight: 1.55 }}>
            <strong>Hai degli appuntamenti in corso.</strong>
            {!soloPro && attive.map(b => <div key={b.id}>· {wById(b.wid)?.n}, {giornoDi(b).toLowerCase()} alle {b.time}</div>)}
            {agenda.map(a => <div key={a.id}>· {a.c}, {(a.data ? giornoDi(a) : String(a.when)).toLowerCase()} alle {a.time}</div>)}
            <div style={{ marginTop: 6 }}>Eliminando li disdiciamo e avvisiamo le persone. Se puoi, scrivi prima tu.</div>
          </div>
        )}

        {haPro && !paused && (
          <div className="del-alt">
            <div><b>Vuoi solo fermarti un po'?</b><span>Con la pausa sparisci dalle ricerche e non ricevi richieste, ma tieni il tuo IDA.</span></div>
            <Btn kind="ghost" onClick={onPause}>Metti in pausa</Btn>
          </div>
        )}

        <div className="del-box">
          <div className="del-lab">Cancelliamo</div>
          {via.map(t => <div key={t} className="del-li"><Icon name="x" size={15} color={T.ember} w={2.2} /><span>{t}</span></div>)}
        </div>
        <div className="del-box">
          <div className="del-lab">{soloPro ? "Resta" : "Resta, in forma anonima"}</div>
          {resta.map(t => <div key={t} className="del-li"><Icon name="shield" size={15} color={T.accent} w={2} /><span>{t}</span></div>)}
        </div>

        <div className="del-lab" style={{ margin: "22px 0 10px" }}>Perché te ne vai? <span style={{ fontWeight: 500, color: T.stone, textTransform: "none", letterSpacing: 0 }}>(facoltativo)</span></div>
        <div className="del-chips">
          {MOTIVI_USCITA.filter(m => haPro || m !== "Poche richieste nella mia zona").filter(m => isW || entrambi || m !== "Poche richieste nella mia zona").map(m => (
            <button key={m} type="button" className={"del-chip" + (motivo === m ? " on" : "")} aria-pressed={motivo === m} onClick={() => setMotivo(motivo === m ? null : m)}>{m}</button>
          ))}
        </div>

        <label className="del-check">
          <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />
          <span>Ho capito che l'eliminazione non si può annullare.</span>
        </label>

        <button type="button" className="del-btn" disabled={!ok} onClick={() => soloPro ? onDeletedPro?.() : onDeleted?.()}>{soloPro ? "Elimina il profilo da professionista" : "Elimina il profilo"}</button>
        <button type="button" className="del-keep" onClick={() => nav.back("account")}>Ci ho ripensato, resto</button>
        <p className="del-note">Prima di andare puoi <button type="button" className="bt cp-link" onClick={() => nav("dati")}>scaricare una copia dei tuoi dati</button>.</p>
      </div>
    </div>
  );
}

/* Dopo l'eliminazione: i dati sono già spariti, questa è solo la conferma */
function Eliminato({ onFine }) {
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div className="del-done">
        <div className="del-done-ic"><Icon name="check" size={32} color={T.accent} w={2} /></div>
        <h1>Profilo eliminato.</h1>
        <p>I tuoi dati sono spariti dall'app adesso. Dai nostri archivi e dalle copie di sicurezza li cancelliamo entro 30 giorni.<br />Grazie per averci provato.</p>
        <Btn full onClick={onFine}>Torna all'inizio</Btn>
      </div>
    </div>
  );
}

/* ============================== POST ============================== */
// Telefono: cellulare (3xx…), fisso (0…) o +39; non scatta su misure ("330 120 2400 mm") o numeri brevi
const TEL_RE = /(?:\+|\b00)39[\s.-]?\d{2,4}[\s.-]?\d{3,4}|(?<![\d,.])3\d{2}(?:[\s.\/-]?\d{3}[\s.-]?\d{3,4}|[\s.\/-]?\d{6,7})(?!\d|,\d|\s*(?:mm|cm|m|mt|kg|g|€|euro|eur)\b)|(?<![\d,.])0\d{1,3}[\s.\/-]?\d{5,8}(?!\d|,\d|\s*(?:mm|cm|m|kg|€|euro)\b)|\d{9,}/i;
// Indirizzo: la parola della strada + un nome con la maiuscola (o "della/dei…", o "2 Giugno") + numero civico.
// Così "portare via le 2 poltrone" o "in corso da 3 giorni" non vengono presi per indirizzi.
const VIA_RE = /\b(?:[Vv]ia|[Vv]iale|[Pp]iazza(?:le)?|[Bb]orgo|[Cc]orso|[Vv]icolo|[Ll]argo|[Ss]trada|[Cc]ontrada)\s+(?:(?:del|dello|della|dei|degli|delle|di|da)\s+|dell'|d')?(?:\d{1,2}\s+)?[A-ZÀ-Ú][\wà-ù'.]*(?:\s+(?:[A-ZÀ-Ú][\wà-ù'.]*|del|della|dei|di))*\s*,?\s*(?:n\.?\s*)?\d{1,4}\s?[a-zA-Z]?\b/;
function Post({ nav, profilo, setProfilo, onPosted }) {
  const [chiedi, setChiedi] = useState(false);
  const [t, setT] = useState("");
  const [ok, setOk] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [det, setDet] = useState("");
  const tutto = t + " " + det;
  const haTel = TEL_RE.test(tutto) || /[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(tutto);
  const haVia = VIA_RE.test(tutto);
  const privato = haTel || haVia;
  const righe = det.trim().split("\n");
  const titolo = t.trim() || righe[0].slice(0, 80).trim();
  const resto = t.trim() ? det.trim() : (righe[0].slice(80) + " " + righe.slice(1).join(" ")).trim();
  const pieno = titolo.length >= 5;
  const [provato, setProvato] = useState(false);
  const pubblica = (p) => { onPosted?.({ id: "p" + Date.now(), t: "req", a: p.nome.split(" ")[0], tx: titolo + (resto ? ` — ${resto}` : ""), h: p.zona, ago: "adesso", mine: true, foto: photo }); setOk(true); };
  if (ok) return <Done nav={nav} title="Pubblicato." body={<>La tua richiesta è sulla bacheca.<br />Chi lavora in zona la vede quando apre l'app. Ti avvisiamo appena qualcuno risponde.</>} actions={<><Btn full onClick={() => nav("neighborhood")}>Vedi la bacheca</Btn><Btn full kind="ghost" onClick={() => nav("home")}>Torna alla home</Btn></>} />;
  const is = { width: "100%", border: "1.5px solid #B8B0A2", borderRadius: 14, padding: "13px 14px", fontSize: 16, fontFamily: "'Hanken Grotesk',sans-serif", background: T.card, color: T.ink, marginTop: 6 };
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="home" title="Pubblica una richiesta" root />
      <div style={{ padding: "16px 22px 22px" }}>
        <Label>Cosa ti serve?</Label>
        <input style={{ ...is, ...(provato && !pieno ? { borderColor: T.ochre, boxShadow: `0 0 0 3px ${T.ochreSoft}` } : {}) }} aria-label="Cosa ti serve" aria-invalid={provato && !pieno} placeholder="Es. Montare un armadio a tre ante" value={t} onChange={e => setT(e.target.value)} maxLength={100} />
        {provato && !pieno && <div style={{ fontSize: 13, color: T.ochreInk, fontWeight: 600, marginTop: 6 }}>Scrivilo qui: bastano poche parole.</div>}
        <div style={{ marginTop: 18 }}><Label>Qualche dettaglio</Label>
          <textarea aria-label="Dettagli" value={det} onChange={e => setDet(e.target.value)} maxLength={600} style={{ ...is, height: 90, resize: "none" }} placeholder="Misure, accesso, materiali, quando ti farebbe comodo…" /></div>
        {privato
          ? <div role="alert" style={{ fontSize: 13, color: T.ember, background: T.emberSoft, borderRadius: 10, padding: "10px 12px", marginTop: 8, lineHeight: 1.5, fontWeight: 600 }}>Sembra che tu abbia scritto {haTel && haVia ? "un contatto e un indirizzo" : haTel ? "un numero di telefono o un'email" : "un indirizzo"}. La bacheca la vedono tutti: toglilo, lo dai in chat solo a chi scegli.</div>
          : <div style={{ fontSize: 13, color: T.stone, marginTop: 6 }}>Non scrivere qui il tuo indirizzo preciso o il telefono: li condividi in chat solo con chi scegli.</div>}
        {/* Foto — vale più di mille parole */}
        <div style={{ marginTop: 18 }}><Label>Una foto aiuta</Label>
          <button type="button" className="bt tap" aria-pressed={photo} onClick={() => setPhoto(!photo)} style={{ width: "100%", marginTop: 6, border: `1.5px dashed ${photo ? T.pine : T.faint}`, borderRadius: 12, padding: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", background: photo ? T.pineSoft : "transparent" }}>
            <Icon name={photo ? "check" : "plus"} size={20} color={photo ? T.accent : T.stone} />
            <span style={{ fontSize: 13, fontWeight: 600, color: photo ? T.accent : T.ink2 }}>{photo ? "Foto aggiunta (simulata)" : "Aggiungi una foto del problema"}</span>
          </button>
        </div>
        <div style={{ marginTop: 24 }}><Btn full onClick={() => { setProvato(true); if (pieno && !privato) (profilo && telOk(profilo.tel) ? pubblica(profilo) : setChiedi(true)); }} style={pieno && !privato ? {} : { background: T.faint }}>Pubblica sulla bacheca</Btn>{(!pieno || privato) && <div style={{ fontSize: 13, color: T.ink2, fontWeight: 600, textAlign: "center", marginTop: 8 }}>{privato ? "Togli telefono o indirizzo per pubblicare." : "Scrivi cosa ti serve (almeno qualche parola)."}</div>}</div>
        {chiedi && <ProfileSheet initial={profilo} motivo="Per pubblicare serve un profilo, così chi risponde sa a chi scrivere. Quello che hai scritto resta." onClose={() => setChiedi(false)} onDone={p => { setProfilo(p); setChiedi(false); pubblica(p); }} />}
        <p style={{ fontSize: 13, color: T.stone, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>Più dettagli dai, migliori sono le proposte che ricevi.</p>
      </div>
    </div>
  );
}

/* ============================== SEGNALA ============================== */
function Report({ w, nav, profilo, onInviata }) {
  const [done, setDone] = useState(false);
  const [contatto, setContatto] = useState("");
  const [why, setWhy] = useState(null);
  const [txt, setTxt] = useState("");
  const fn = w ? w.n.split(" ")[0] : "questa persona";
  const reasons = ["Nessuno si è presentato", "Lavoro fatto male", "Prezzo diverso dal pattuito", "Comportamento scorretto", "Altro"];
  const serveContatto = !profilo || !telOk(profilo.tel);
  const can = why && (why !== "Altro" || txt.trim().length >= 10) && (!serveContatto || telOk(contatto));
  if (done) return <Done nav={nav} title="Segnalazione inviata." body={<>Leggiamo ogni segnalazione di persona.<br />Sentiamo anche {fn} prima di decidere e ti rispondiamo entro 48 ore, via SMS al {serveContatto ? contatto : "tuo numero"}.</>} actions={<Btn full onClick={() => nav("home")}>Torna alla home</Btn>} />;
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to={w?.demo ? "worker" : "home"} data={w} title="Segnala un problema" />
      <div style={{ padding: "4px 22px 22px" }}>
        <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.6, marginTop: 0, marginBottom: 18 }}>Cos'è successo con {fn}? Non la pubblichiamo: ne parliamo con te e con {fn}.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reasons.map(r => (
            <button type="button" aria-pressed={why === r} key={r} onClick={() => setWhy(r)} className="bt opt" style={{ textAlign: "left", background: why === r ? T.pineSoft : T.card, borderRadius: 13, padding: "15px 16px", border: `1.5px solid ${why === r ? T.pine : T.line}`, fontSize: 14, fontWeight: 500, color: T.ink, transition: "all .16s" }}>{r}</button>
          ))}
        </div>
        {why && (
          <div style={{ marginTop: 18, animation: "rise .3s ease" }}>
            <Label>Raccontaci cosa è successo <span style={{ fontWeight: 400, color: T.stone }}>{why === "Altro" ? "" : "· facoltativo"}</span></Label>
            <textarea aria-label="Cosa è successo" value={txt} onChange={e => setTxt(e.target.value)} maxLength={500} placeholder="Quando, cosa, cosa ti aspettavi. Più è preciso, prima si risolve."
              style={{ width: "100%", height: 90, resize: "none", border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "'Hanken Grotesk',sans-serif", background: T.card, color: T.ink, marginBottom: 14 }} />
            {serveContatto && (
              <label className="cp-f" style={{ marginBottom: 14 }}>
                <span className="cp-l">Il tuo cellulare</span>
                <input className="cp-in" value={contatto} onChange={e => setContatto(e.target.value)} placeholder="Es. 333 123 4567" inputMode="tel" autoComplete="tel" maxLength={16} />
                <span className="cp-h">Non hai un profilo: ci serve per risponderti.</span>
              </label>
            )}
            <Btn full kind="ember" onClick={() => { if (!can) return; onInviata?.({ tipo: "Problema con un lavoro", con: w?.n || null, motivo: why, testo: txt.trim() || null, data: dataLocale(), bookingId: w?.bookingId || null }); setDone(true); }} style={can ? {} : { opacity: .4, cursor: "not-allowed" }}>Invia la segnalazione</Btn>
            {!can && <div style={{ fontSize: 13, color: T.stone, textAlign: "center", marginTop: 8 }}>{why === "Altro" && txt.trim().length < 10 ? "Per “Altro” scrivi almeno 10 caratteri." : "Manca un cellulare valido per risponderti."}</div>}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, background: T.emberSoft, borderRadius: 12, padding: 14, marginTop: 18 }}>
          <Icon name="shield" size={18} color={T.ember} />
          <span style={{ fontSize: 13, color: T.ember, lineHeight: 1.5 }}>In caso di pericolo immediato chiama il <strong>112</strong>. TaskEase non sostituisce le autorità.</span>
        </div>
      </div>
    </div>
  );
}

/* ============================== NOTIFICHE ============================== */
function Notifications({ nav, items = [], viste = [], onSeen }) {
  const [giaViste] = useState(viste); // "nuova" = non vista prima di aprire questa pagina
  useEffect(() => { onSeen?.(); }, []);
  const tap = (n) => n.go && nav(n.go[0], n.go[1] || null);
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="home" title="Notifiche" />
      <div style={{ padding: "4px 18px 22px" }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 18px", color: T.stone, fontSize: 13.5, lineHeight: 1.6 }}>
            Nessuna notifica.<br />Arriveranno quando qualcuno conferma una tua prenotazione o quando ci sono richieste per te.
          </div>
        )}
        {items.map((n, i) => {
          const unread = !giaViste.includes(n.id);
          return (
            <button type="button" key={n.id} onClick={() => tap(n)} className="bt tap" style={{ width: "100%", textAlign: "left", display: "flex", gap: 12, padding: "14px 12px", borderRadius: 14, background: unread ? T.pineSoft : "transparent", marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: ({ check: "#22331C", message: "#1C2B38", star: "#3A2E1A", pin: "#3A2419", bolt: "#3A2E1A", seal: "#3A2419" }[n.ic] || T.card), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={n.ic} size={18} color={({ check: "#9CCB80", message: "#7FB0D6", star: "#E2B672", pin: "#E39A6E", bolt: "#E2B672", seal: "#E39A6E" }[n.ic] || T.pine)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5 }}>{n.t}</div>
                <div style={{ fontSize: 12.5, color: T.stone, marginTop: 3 }}>{n.when}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== SIGILLO CONDIVISIBILE ============================== */
function ShareSeal({ nav, verified }) {
  const w = ME;
  const lv = LV[w.lv];
  const isNew = w.ida == null;
  const [copied, setCopied] = useState(false);
  const handle = "taskease.it/forli/" + (w.n || "profilo").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // QR decorativo (anteprima): pattern deterministico con tre mirini
  const N = 21;
  const finder = (r, c) => {
    const ring = (r0, c0) => { const rr = r - r0, cc = c - c0; return (rr === 0 || rr === 6 || cc === 0 || cc === 6) || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4); };
    if (r < 7 && c < 7) return { f: true, on: ring(0, 0) };
    if (r < 7 && c >= N - 7) return { f: true, on: ring(0, N - 7) };
    if (r >= N - 7 && c < 7) return { f: true, on: ring(N - 7, 0) };
    return { f: false, on: false };
  };
  const hash = (r, c) => { let x = (r * 73856093) ^ (c * 19349663); return (Math.abs(x) % 100) / 100; };
  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const fi = finder(r, c);
    const sep = (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
    const on = fi.f ? fi.on : (sep ? false : hash(r, c) > 0.55);
    if (on) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={T.ink} />);
  }

  const url = "https://" + handle;
  // "Copiato" solo se la copia è riuscita davvero; altrimenti diciamo come fare a mano
  const copy = () => {
    const ok = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };
    const ko = () => { setCopied("ko"); setTimeout(() => setCopied(false), 2600); };
    try { const p = navigator.clipboard?.writeText(url); p && p.then ? p.then(ok, ko) : ko(); } catch (e) { ko(); }
  };

  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="account" title="Il tuo sigillo" />
      <div style={{ padding: "4px 22px 28px" }}>
        <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.6, marginTop: 0, marginBottom: 20 }}>
          La tua reputazione TaskEase, da mostrare ovunque: sul biglietto, sul furgone, su WhatsApp. Al lancio, chi la inquadra vedrà il tuo profilo vero.
        </p>

        {/* Credential card */}
        <div style={{ background: T.pineDeep, borderRadius: 22, padding: 24, color: T.cream, position: "relative", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ position: "absolute", top: -30, right: -30, opacity: .04 }}><Seal score={null} lv="diamante" size={150} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, position: "relative" }}>
            <Seal score={w.ida} lv={w.lv} size={72} stamp tint={T.ochreLight} />
            <div style={{ minWidth: 0, flex: 1 }} className="a-capo">
              <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: -.3 }}>{w.n}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, background: "rgba(246,242,234,.12)", borderRadius: 7, padding: "3px 8px" }}>
                <Icon name="shield" size={12} color={verified ? T.ochre : "rgba(246,242,234,.5)"} />
                <span style={{ fontSize: 12, fontWeight: 700, opacity: verified ? 1 : .85 }}>{verified ? "Identità verificata" : "Identità non ancora verificata"}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            <div style={{ background: T.paper, borderRadius: 12, padding: 8, flexShrink: 0 }}>
              <svg width={92} height={92} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges">{cells}</svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }} className="a-capo">
              <div style={{ fontSize: 12.5, color: "rgba(246,242,234,.8)", textTransform: "uppercase", letterSpacing: .5, fontWeight: 600 }}>{isNew ? "Sigillo nuovo" : lv.l}</div>
              <div style={{ fontSize: 13, color: T.cream, marginTop: 4, lineHeight: 1.5 }}>{isNew ? `Il numero compare dopo ${IDA_MIN_LAVORI} lavori giudicati.` : `${w.ida}/100 · ${w.rv} giudizi reali.`}</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12.5, color: T.ochreLight, marginTop: 8 }}>{handle}</div>
            </div>
          </div>
        </div>

        {/* Link riga */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.card, borderRadius: 12, padding: "12px 14px", border: `1px dashed ${T.faint}`, marginBottom: 16 }}>
          <Icon name="compass" size={16} color={T.accent} />
          <span className="a-capo" style={{ flex: 1, minWidth: 0, fontFamily: "'Space Mono',monospace", fontSize: 13, color: T.ink }}>{handle}</span>
          <button type="button" onClick={copy} className="bt tap" style={{ flexShrink: 0,  fontSize: 13, fontWeight: 700, color: copied === "ko" ? T.ember : T.accent }}>{copied === true ? "Copiato ✓" : copied === "ko" ? "Non riuscito" : "Copia"}</button>
        </div>

        {/* Azioni condivisione */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          <Btn full onClick={copy}>{copied === true ? "Link copiato ✓" : copied === "ko" ? "Copia non riuscita: tieni premuto sul link" : "Copia il link (di prova)"}</Btn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 13, border: `1.5px dashed ${T.line}`, color: T.stone, fontSize: 13.5, fontWeight: 600 }}>Invia su WhatsApp <span style={{ fontSize: 11.5, fontWeight: 700, background: T.line, padding: "3px 8px", borderRadius: 6, letterSpacing: .3 }}>AL LANCIO</span></div>
        </div>

        {/* Perché conta */}
        <div style={{ background: T.pineSoft, borderRadius: 14, padding: 16, display: "flex", gap: 11 }}>
          <Icon name="bolt" size={18} color={T.accent} />
          <span style={{ fontSize: 13, color: T.accent, lineHeight: 1.55 }}>Ogni cliente che inquadra il tuo sigillo arriva sul tuo profilo{verified ? " verificato" : ""}. La tua reputazione lavora per te anche fuori dall'app.</span>
        </div>
        <div style={{ fontSize: 12, color: T.stone, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>In questa anteprima QR e link sono illustrativi: il profilo pubblico non esiste ancora, per questo l'invio su WhatsApp arriva al lancio.</div>
      </div>
    </div>
  );
}

/* ============================== COME FUNZIONA ============================== */
function Help({ nav, from }) {
  const items = [
    ["search", "Trova chi ti serve", "Cerca un mestiere o descrivi il problema. I risultati partono dai più vicini; puoi ordinarli per prezzo o per IDA."],
    ["seal", "Fidati dell'IDA", `Un voto su 100 costruito solo dai lavori veri, giudicati da chi li ha ricevuti. Ogni giudizio va da 20 (tutto male) a 100 (tutto perfetto). Compare dopo ${IDA_MIN_LAVORI} lavori: prima si legge NUOVO. Gli ultimi 12 mesi contano per intero, da 12 a 24 mesi a metà, oltre non contano. Non si compra, non sale se accetti di più e non decide chi compare per primo.`],
    ["cal", "Prenoti, la persona conferma", "Invii la richiesta, chi lavora conferma o propone un altro orario. Prezzo chiaro prima, paghi le ore reali."],
    ["shield", "Paghi tra di voi", "TaskEase non tocca i soldi: paghi direttamente, contanti o come concordate."],
    ["star", "Lasci il giudizio", "Cinque domande dopo il lavoro: puntualità (20%), qualità (30%), parola mantenuta (20%), pulizia (15%), comunicazione (15%). Pesi decisi ragionando, non da uno studio: li scriviamo con chi lavora."],
    ["hand", "Chi lavora decide in autonomia", "Decide prezzi, orari, zone e quali lavori accettare. Rifiutare non abbassa l'IDA. TaskEase mette in contatto, non è il datore di lavoro di nessuno."],
  ];
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to={from || "home"} title="Come funziona" />
      <div style={{ padding: "4px 22px 24px" }}>
        {items.map(([ic, t, s], i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.pineSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={ic} size={22} color={T.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink }}>{t}</div>
              <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.55, marginTop: 3 }}>{s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== TAB BAR — dock scura che galleggia ============================== */
function Tabs({ active, on, role }) {
  const items = role === "worker"
    ? [["home", "home", "Home"], ["search", "search", "Cerca"], ["neighborhood", "grid", "Bacheca"], ["account", "user", "Profilo"]]
    : [["home", "home", "Home"], ["search", "search", "Cerca"], ["post", "plus", "Pubblica"], ["neighborhood", "grid", "Bacheca"], ["account", "user", "Profilo"]];
  return (
    <nav className="dock-wrap" aria-label="Sezioni">
      <div className="dock">
        {items.map(([id, ic, l]) => {
          const on_ = active === id;
          if (id === "post") return (
            <button type="button" key={id} className="dock-plus" onClick={() => on(id)} aria-label={l} aria-current={on_ ? "page" : undefined}><span className="dock-plus-i"><Icon name="plus" size={16} color="#fff" w={2.4} /></span><span aria-hidden="true">{l}</span></button>
          );
          return (
            <button type="button" key={id} className={`dock-i${on_ ? " on" : ""}`} onClick={() => on(id)} aria-label={l} aria-current={on_ ? "page" : undefined}>
              <Icon name={ic} size={21} w={on_ ? 2 : 1.7} />
              <span>{l}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ============================== INGRESSO — design moderno ============================== */
/* Un solo momento animato: il sigillo si timbra e il numero sale. Tutto il resto è fermo e pulito. */
const MESTIERI_MQ = ["Idraulica", "Montaggio mobili", "Pulizie", "Giardino", "Elettricità", "Tecnologia", "Imbiancatura", "Traslochi", "Ripetizioni", "Riparazioni"];

function SealHero({ target = 96, size = 168, nuovo = false }) {
  const [n, setN] = useState(nuovo ? 0 : 0);
  useEffect(() => {
    if (nuovo) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(target); return; }
    let raf, start;
    const dur = 1300, delay = 420;
    const tick = (t) => {
      if (start == null) start = t;
      const p = Math.min(1, Math.max(0, (t - start - delay) / dur));
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, nuovo]);
  const r = 46, C = +(2 * Math.PI * r).toFixed(2);
  const dots = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    dots.push(<circle key={i} cx={60 + Math.cos(a) * 54} cy={60 + Math.sin(a) * 54} r="0.9" fill={T.ochre} opacity=".5" />);
  }
  return (
    <div className="seal-hero" style={{ width: size, height: size }} role="img" aria-label={nuovo ? "Sigillo IDA nuovo" : `Sigillo IDA ${target}`}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r="58" fill="none" stroke={T.ochre} strokeOpacity=".16" strokeWidth="1" />
        <g className="seal-dots">{dots}</g>
        <circle cx="60" cy="60" r={r} fill="none" stroke={T.ochre} strokeOpacity=".18" strokeWidth="3" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={T.ochre} strokeWidth="3" strokeLinecap="round" strokeDasharray={C} className="seal-draw" style={{ "--c": C }} transform="rotate(-90 60 60)" />
      </svg>
      <div className="seal-hero-in">
        {nuovo
          ? <span className="seal-nuovo">NUOVO</span>
          : <><span className="seal-num">{n}</span><span className="seal-lab">IDA</span></>}
      </div>
    </div>
  );
}

function Marquee() {
  const items = [...MESTIERI_MQ, ...MESTIERI_MQ];
  return (
    <div className="mq" role="img" aria-label={"Mestieri: " + MESTIERI_MQ.join(", ")}>
      <div className="mq-track" aria-hidden="true">
        {items.map((m, i) => <span key={i} className="mq-chip">{m}</span>)}
      </div>
    </div>
  );
}

/* Ingresso generale: dice subito cos'è, cos'è il numero e come funziona, poi una sola scelta */
function Entrata({ onChoose, onLogin }) {
  const passi = [
    ["Scrivi cosa ti serve", "Con parole tue: «perde il lavandino», «mi monti un armadio», «il WiFi non va»."],
    ["Scegli chi chiamare", "Prima di decidere vedi quanto chiede all'ora, quanto è lontano e il suo IDA."],
    ["Paghi a lavoro finito", "Direttamente a chi ha fatto il lavoro, come vi accordate. TaskEase non prende commissioni."],
  ];
  return (
    <div className="ent">
      <div className="ent-scroll">
        <div className="ent-top rise" style={{ animationDelay: "0s" }}>
          <span className="ent-mark">TaskEase</span>
          <span className="ent-pill"><span className="ent-dot" />Beta · Forlì-Cesena</span>
        </div>

        <h1 className="ent-h ent-h1 rise" style={{ animationDelay: ".1s" }}>Trova chi ti aiuta,<br /><em>vicino a casa.</em></h1>
        <p className="ent-sub rise" style={{ animationDelay: ".2s" }}>Idraulici, pulizie, montaggi e piccoli lavori. Persone della tua zona, con il voto dei clienti che le hanno già chiamate.</p>

        <div className="rise" style={{ animationDelay: ".3s" }}><Marquee /></div>

        <div className="ent-ida rise" style={{ animationDelay: ".4s" }}>
          <SealHero target={96} size={92} />
          <div>
            <div className="ent-ida-t">Questo numero è l'IDA</div>
            <div className="ent-ida-s">Un voto su 100 su come lavora una persona. Lo danno i clienti dopo ogni lavoro, con 5 domande. Non si compra.</div>
          </div>
        </div>

        <div className="ent-eyebrow rise" style={{ animationDelay: ".5s" }}>Come funziona</div>
        <ol className="ent-steps">
          {passi.map(([t, d], i) => (
            <li key={t} className="ent-step rise" style={{ animationDelay: `${.55 + i * .08}s` }}>
              <span className="ent-n">{i + 1}</span>
              <div><div className="ent-pt">{t}</div><div className="ent-ps">{d}</div></div>
            </li>
          ))}
        </ol>
      </div>

      <div className="ent-bar">
        <button type="button" className="ent-btn primary" onClick={() => onChoose("client")}>
          <span><span className="ent-btn-t">Cerco una mano</span><span className="ent-btn-s">Mi serve qualcuno per un lavoro</span></span>
          <Icon name="arrowR" size={22} color="#fff" w={2} />
        </button>
        <button type="button" className="ent-btn ghost" onClick={() => onChoose("worker")}>
          <span><span className="ent-btn-t">Offro una mano</span><span className="ent-btn-s">So fare un lavoro e cerco clienti</span></span>
          <Icon name="arrowR" size={22} color={T.cream} w={2} />
        </button>
        <p className="ent-note">Hai già un profilo? <button type="button" className="bt ent-acc" onClick={onLogin}>Accedi</button></p>
        <p className="ent-note" style={{ marginTop: -4 }}>Anteprima con profili di esempio · <button type="button" className="bt ent-acc" style={{ fontWeight: 500 }} onClick={() => legale.apri("info")}>Termini e privacy</button></p>
      </div>
    </div>
  );
}

/* Atterraggio dal QR dei volantini: parla solo a chi offre */
function IntroWorker({ onWorker, onOther, onLogin }) {
  const points = [
    ["heart", "I soldi restano tuoi", "Zero commissioni. Il cliente ti paga diretto, come vi accordate."],
    ["seal", "Una reputazione che è tua", "Il tuo voto (IDA) nasce dai giudizi dei clienti sui lavori veri, e lo mostri a chi vuoi con un link."],
    ["box", "Come ci guadagniamo", "La base è gratis per sempre. Il Pro (9€ al mese) è facoltativo e non ti fa comparire prima degli altri."],
    ["hand", "Decidi tu", "Prezzi, orari, zone, quali lavori accettare. Rifiutare non ti penalizza."],
  ];
  return (
    <div className="ent">
      <div className="ent-scroll">
        <div className="ent-top rise">
          <span className="ent-mark">TaskEase</span>
          <span className="ent-pill"><span className="ent-dot" />Per chi sa fare</span>
        </div>
        <div className="ent-hero"><SealHero nuovo size={150} /></div>
        <h1 className="ent-h rise" style={{ animationDelay: ".15s" }}>Le tue mani valgono.<br /><em>Falle trovare.</em></h1>
        <p className="ent-sub rise" style={{ animationDelay: ".25s" }}>Cerchiamo le prime persone che sanno fare, a Forlì-Cesena. All'inizio siamo pochi: chi entra adesso lo seguo io di persona, Piz, su WhatsApp.</p>
        <div className="ent-points">
          {points.map(([ic, t, s], i) => (
            <div key={t} className="ent-point rise" style={{ animationDelay: `${.35 + i * .08}s` }}>
              <div className="ent-ico"><Icon name={ic} size={20} color={T.ochre} /></div>
              <div><div className="ent-pt">{t}</div><div className="ent-ps">{s}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="ent-bar">
        <button type="button" className="ent-btn primary" onClick={onWorker}>
          <span><span className="ent-btn-t">Crea il tuo profilo</span><span className="ent-btn-s">Gratis, in pochi minuti</span></span>
          <Icon name="arrowR" size={22} color="#fff" w={2} />
        </button>
        <button type="button" className="ent-link" onClick={onOther}>Cerco aiuto, non lo offro</button>
        {onLogin && <p className="ent-note">Hai già un profilo? <button type="button" className="bt ent-acc" onClick={onLogin}>Accedi</button></p>}
      </div>
    </div>
  );
}

/* ============================== ONBOARDING (per ruolo, spiega l'IDA) ============================== */
function Onboarding({ role, onDone, onBack, allaFine }) {
  const [step, setStep] = useState(allaFine ? 2 : 0); // 3 passi per entrambi i ruoli
  const isW = role === "worker";
  const idaStep = {
    visual: <SealHero target={96} size={176} key={"ida" + role} />,
    eyebrow: "La nostra differenza",
    title: isW ? "L'IDA è la tua reputazione" : "La fiducia, in un numero",
    body: isW
      ? `Lo costruiscono i giudizi dei clienti, 5 domande dopo ogni lavoro: non noi. Compare dopo ${IDA_MIN_LAVORI} lavori, non si compra e non si finge. Lo mostri a chi vuoi con un link.`
      : `Niente stelle finte: un voto su 100 fatto solo di lavori veri, giudicati da chi li ha ricevuti. Compare dopo ${IDA_MIN_LAVORI} lavori.`,
    chips: IDA_VOCI.map(v => `${v.l} ${Math.round(v.w * 100)}%`),
  };
  const glyph = (ic) => <div className="onb-glyph"><Icon name={ic} size={56} color={T.ochre} w={1.5} /></div>;
  const steps = isW ? [
    { visual: glyph("hand"), eyebrow: "1 di 3", title: "Offri quello che sai fare", body: "Qualsiasi competenza utile. Accendi “Disponibile” e ti arrivano le richieste della tua zona." },
    { ...idaStep, eyebrow: "2 di 3" },
    { visual: glyph("trophy"), eyebrow: "3 di 3", title: "Decidi tu, sempre", body: "Prezzo, lavori, zone, orari. Rifiutare non ti penalizza. I soldi restano tra te e il cliente: nessuna commissione." },
  ] : [
    { visual: glyph("search"), eyebrow: "1 di 3", title: "Scrivi cosa ti serve", body: "Un mestiere o il problema con parole tue. Dall'idraulico al giardino, fino a una mano col PC." },
    { ...idaStep, eyebrow: "2 di 3" },
    { visual: glyph("shield"), eyebrow: "3 di 3", title: "Prenoti, la persona conferma", body: "Prezzo chiaro prima di confermare. Paghi direttamente a fine lavoro, solo le ore reali, e lasci il giudizio." },
  ];
  const cur = steps[step];
  const last = step === steps.length - 1;
  return (
    <div className="ent onb">
      <div className="ent-scroll" style={{ paddingBottom: 150 }}>
        <div className="ent-top">
          {step > 0 || !onBack
            ? <span className="ent-mark">TaskEase</span>
            : <button type="button" className="ent-link" style={{ textDecoration: "none", padding: "6px 2px", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={onBack}><Icon name="arrowL" size={18} color={T.cream} /> Indietro</button>}
          <button type="button" className="ent-link" style={{ textDecoration: "none", padding: "6px 2px" }} onClick={onDone}>Salta</button>
        </div>
        <div className="onb-visual" key={"v" + step}>{cur.visual}</div>
        <div key={"t" + step} className="rise">
          <div className="onb-eye">{cur.eyebrow}</div>
          <h1 className="ent-h" style={{ fontSize: "clamp(30px, 9vw, 36px)" }}>{cur.title}</h1>
          <p className="ent-sub">{cur.body}</p>
          {cur.chips && <div className="onb-chips">{cur.chips.map(c => <span key={c}>{c}</span>)}</div>}
        </div>
      </div>
      <div className="ent-bar" style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <div className="onb-dots" role="tablist" aria-label="Passi">
          {steps.map((_, i) => <button type="button" key={i} role="tab" aria-selected={i === step} aria-label={`Passo ${i + 1}`} className={i === step ? "on" : ""} onClick={() => setStep(i)} />)}
        </div>
        <button type="button" className="ent-btn primary" style={{ width: "auto", padding: "14px 26px" }} onClick={() => last ? onDone() : setStep(step + 1)}>
          <span className="ent-btn-t" style={{ fontSize: 16 }}>{last ? "Inizia" : "Avanti"}</span>
          <Icon name="arrowR" size={20} color="#fff" w={2} />
        </button>
      </div>
    </div>
  );
}

/* ============================== SETUP CHI OFFRE ============================== */
// Babysitting tolto: lavoro con minori, regole e responsabilità diverse. "Piccoli lavori" = senza toccare impianti.
const SKILL_OPTS = ["Idraulica", "Elettricità", "Piccoli lavori (senza impianti)", "Tuttofare", "Riparazioni", "Piastrelle e pavimenti", "Muratura e cartongesso", "Imbiancatura", "Pulizie", "Montaggio mobili", "Giardino", "Tecnologia / PC", "Ripetizioni", "Consegne", "Traslochi"];
// DM 37/2008: su impianti elettrici, gas, idrico-sanitari e riscaldamento lavorano solo imprese abilitate
const SKILL_IMPIANTI = ["Idraulica", "Elettricità"];
const pivaOk = (v) => /^\d{11}$/.test(String(v || "").replace(/\s/g, ""));
const etaDa = (iso) => { const d = new Date(iso); if (!iso || isNaN(d)) return null; const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
const CODICE_ANTEPRIMA = "123456";
// Data di nascita ricavata dal codice fiscale (giorno > 40 per le donne)
const nascitaDaCf = (cf) => {
  // Omocodia: alcune cifre possono essere sostituite da lettere (L=0 … V=9)
  const om = (x) => x.replace(/[LMNPQRSTUV]/g, c => "LMNPQRSTUV".indexOf(c));
  const m = /^[A-Z]{6}([0-9LMNPQRSTUV]{2})([ABCDEHLMPRST])([0-9LMNPQRSTUV]{2})/.exec(cf || ""); if (!m) return "";
  const yy = +om(m[1]), mese = "ABCDEHLMPRST".indexOf(m[2]) + 1, gg = +om(m[3]), g = gg > 40 ? gg - 40 : gg;
  const anno = yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy;
  const d = new Date(anno, mese - 1, g);
  if (d.getMonth() !== mese - 1 || d.getDate() !== g) return ""; // es. 30 febbraio
  return `${anno}-${String(mese).padStart(2, "0")}-${String(g).padStart(2, "0")}`;
};

/* Codice di verifica del numero. In anteprima non parte nessun SMS: il codice è scritto sotto. */
function OtpStep({ tel, onOk, onBack, dark }) {
  const [c, setC] = useState("");
  const [err, setErr] = useState(false);
  const [rimandato, setRimandato] = useState(false);
  const prova = () => { if (c.replace(/\D/g, "") === CODICE_ANTEPRIMA) onOk(); else setErr(true); };
  return (
    <div className="cp-form" style={{ marginTop: 6 }}>
      <div className="cp-f">
        <span className="cp-l">Codice di verifica</span>
        <span className="cp-h" style={{ marginTop: -2 }}>L'abbiamo mandato via SMS al {tel}. Serve a confermare che il numero è tuo.</span>
        <input className="cp-in" aria-label="Codice di verifica" value={c} onChange={e => { setC(e.target.value.replace(/\D/g, "").slice(0, 6)); setErr(false); }} inputMode="numeric" autoComplete="one-time-code" placeholder="• • • • • •" style={{ letterSpacing: 6, fontFamily: "'Space Mono',monospace", fontSize: 20, textAlign: "center" }} />
        {err && <span className="cp-err" role="alert" style={{ marginTop: 0 }}>Codice errato. Controlla l'SMS e riprova.</span>}
        <span className="cp-h" style={{ background: T.ochreSoft, color: T.ochreInk, borderRadius: 10, padding: "8px 10px" }}>Anteprima: nessun SMS viene inviato. Il codice è <b>{CODICE_ANTEPRIMA}</b>.</span>
      </div>
      <button type="button" className="cp-btn" onClick={prova}>Conferma il numero</button>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {onBack ? <button type="button" className="bt tap" onClick={onBack} style={{ fontSize: 13, fontWeight: 600, color: T.ink2 }}>Cambia numero</button> : <span />}
        <button type="button" className="bt tap" onClick={() => setRimandato(true)} style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{rimandato ? "Codice rimandato" : "Non è arrivato? Rimanda"}</button>
      </div>
    </div>
  );
}

function ProviderSetup({ onDone, nav, initial, edit, onSave, onLegal }) {
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState(false);
  useIndietro(step > 0 || otp, () => { if (step >= 4) { onDone(false, dati()); return true; } if (otp) setOtp(false); else setStep(s => Math.max(0, s - 1)); return true; });
  const [nome, setNome] = useState(edit ? ME.n : (initial?.nome || ""));
  const [foto, setFoto] = useState(edit ? !!ME.foto : false);
  const [tipo, setTipo] = useState(edit ? (ME.tipo || null) : null);         // "privato" | "piva"
  const [piva, setPiva] = useState(edit ? (ME.piva || "") : "");
  const [abil, setAbil] = useState(edit ? !!ME.abil : false);
  const [skills, setSkills] = useState(edit ? ME.sk.filter(x => SKILL_OPTS.includes(x)) : []);
  const [price, setPrice] = useState(edit ? ME.pr : 20);
  const [zones, setZones] = useState(edit ? (ME.zone || [ME.zona]) : ["Centro"]);
  const [tel, setTel] = useState(initial?.tel || "");
  const [nascita, setNascita] = useState("");
  const [residenza, setResidenza] = useState("");
  const [cf, setCf] = useState("");
  const [rc, setRc] = useState(edit ? !!ME.rc : false);
  const [fiscalOk, setFiscalOk] = useState(false);
  const [termini, setTermini] = useState(false);
  const [preventivo, setPreventivo] = useState(edit ? !!ME.preventivo : false);
  const [bio, setBio] = useState(edit ? (ME.bio || "") : "");

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const cfOk = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf);
  const eta = etaDa(nascita);
  const impianti = skills.some(s => SKILL_IMPIANTI.includes(s));
  const totSteps = edit ? 3 : 4;

  const manca = [
    // passo 0: chi sei
    nome.trim().length < 2 ? "Manca il tuo nome e cognome." : !foto ? "Manca la foto profilo." : !tipo ? "Scegli se sei un privato o hai Partita IVA." : tipo === "piva" && !pivaOk(piva) ? "La Partita IVA ha 11 cifre." : null,
    // passo 1: cosa sai fare
    skills.length === 0 ? "Scegli almeno una competenza." : impianti && tipo !== "piva" ? "Idraulica ed elettricità sono solo per imprese con Partita IVA: toglile." : impianti && !abil ? "Per idraulica ed elettricità serve dichiarare l'abilitazione." : null,
    // passo 2: tariffa e zone
    zones.length === 0 ? "Scegli almeno una zona." : null,
    // passo 3: dati e regole
    !telOk(tel) ? "Manca un cellulare valido." : eta == null ? "Manca la data di nascita." : eta < 18 ? "Per lavorare su TaskEase servono 18 anni." : residenza.trim().length < 6 ? "Manca l'indirizzo di residenza." : !cfOk ? "Manca il codice fiscale (16 caratteri)." : !fiscalOk ? "Manca la dichiarazione fiscale." : !termini ? "Manca l'accettazione dei Termini." : null,
  ];
  const canNext = !manca[step];
  const dati = () => ({ cf, nome: nome.trim(), tel: tel.trim(), pr: price, sk: skills, zone: zones, tipo, piva: tipo === "piva" ? piva.replace(/\s/g, "") : "", abil: tipo === "piva" && impianti && abil, rc, foto, nascita, residenza: residenza.trim(), preventivo, bio: bio.trim() });

  // Codice di verifica del numero, poi la schermata finale
  if (otp && step < 4) return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div className="cp">
        <div className="cp-eye">Ultimo controllo</div>
        <h1 className="cp-h1">Conferma il tuo numero</h1>
        <OtpStep tel={tel} onOk={() => setStep(4)} onBack={() => setOtp(false)} />
      </div>
    </div>
  );

  if (step === 4) return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
        <Seal score={null} lv="bronzo" size={96} stamp />
        <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 25, fontWeight: 800, color: T.ink, marginTop: 20, letterSpacing: -.3 }}>Ci siamo, {nome.trim().split(/\s+/)[0]}.</h1>
        <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.6, marginTop: 8, maxWidth: 300 }}>
          Parti da <strong style={{ color: T.ink }}>IDA nuovo</strong>: il numero compare dopo {IDA_MIN_LAVORI} lavori valutati. Fino ad allora sul profilo si legge <strong>“Profilo nuovo”</strong>.
        </p>
        <div style={{ background: T.ochreSoft, borderRadius: 12, padding: "12px 14px", marginTop: 16, fontSize: 13, color: T.ochreInk, lineHeight: 1.5, textAlign: "left" }}>
          Manca solo la verifica dell'identità: la facciamo di persona o in videochiamata guardando il tuo documento, senza conservarne copie. Fino ad allora il profilo è attivo, ma senza il badge “Identità verificata”.
        </div>
        <div style={{ background: T.pineSoft, borderRadius: 16, padding: 18, marginTop: 22, textAlign: "left", width: "100%" }}>
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 10 }}>Come prendere il primo lavoro</div>
          {["Profilo verificato: i clienti si fidano di più", "Un prezzo onesto convince più di mille parole", "Un primo lavoro fatto bene lancia il tuo IDA"].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <span aria-hidden="true" style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 10, border: `1.5px solid ${T.pine}`, color: T.accent, fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: T.ink2, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ width: "100%", marginTop: 24 }}><Btn full onClick={() => onDone(false, dati())}>Vai al tuo profilo</Btn></div>
      </div>
    </div>
  );

  const scelta = (on) => ({ minHeight: 44, padding: "0 16px", borderRadius: 999, fontSize: 14, fontWeight: 600, transition: "all .15s", background: on ? T.pine : T.card, color: on ? "#fff" : T.ink2, border: `1.5px solid ${on ? T.pine : T.line}` });
  const steps = [
    {
      eyebrow: `Passo 1 di ${totSteps}`, title: "Chi sei",
      sub: "Nome e foto li vedono i clienti. Dicci anche come lavori: serve per legge e per essere chiari con chi ti chiama.",
      body: (
        <>
          <label className="cp-f" style={{ marginBottom: 20 }}>
            <span className="cp-l">Nome e cognome</span>
            <input className="cp-in" value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Giulia Bertozzi" autoComplete="name" maxLength={50} />
          </label>
          <div className="cp-f" style={{ marginBottom: 20 }}>
            <span className="cp-l">Foto profilo</span>
            <button type="button" className="bt tap" aria-pressed={foto} onClick={() => setFoto(!foto)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, border: `1.5px dashed ${foto ? T.pine : T.faint}`, background: foto ? T.pineSoft : T.card, textAlign: "left" }}>
              <Avatar ini={foto ? iniOf(nome) : "+"} sz={48} />
              <span><span style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.ink }}>{foto ? "Foto aggiunta (simulata)" : "Scatta o scegli una foto"}</span><span style={{ display: "block", fontSize: 13, color: T.stone, marginTop: 2 }}>Il viso ben visibile: i clienti si fidano di più.</span></span>
            </button>
          </div>
          <div className="cp-f">
            <span className="cp-l">Come lavori?</span>
            {[["privato", "Da privato", "Prestazione occasionale, senza Partita IVA"], ["piva", "Con Partita IVA", "Ditta individuale, artigiano o professionista"]].map(([k, t, s]) => (
              <button type="button" key={k} className="bt tap" aria-pressed={tipo === k} onClick={() => { setTipo(k); if (k === "privato") { if (skills.some(x => SKILL_IMPIANTI.includes(x))) avviso.mostra("Abbiamo tolto idraulica ed elettricità: da privato non si possono fare."); setSkills(sk => sk.filter(x => !SKILL_IMPIANTI.includes(x))); setAbil(false); } }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: 14, borderRadius: 14, border: `1.5px solid ${tipo === k ? T.pine : T.line}`, background: tipo === k ? T.pineSoft : T.card }}>
                <span style={{ width: 20, height: 20, borderRadius: 10, border: `1.5px solid ${tipo === k ? T.pine : T.faint}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{tipo === k && <span style={{ width: 10, height: 10, borderRadius: 5, background: T.pine }} />}</span>
                <span><span style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.ink }}>{t}</span><span style={{ display: "block", fontSize: 13, color: T.stone, marginTop: 2 }}>{s}</span></span>
              </button>
            ))}
            <label className="cp-f" style={{ marginTop: 14 }}>
              <span className="cp-l">Due righe su di te <span style={{ fontWeight: 500, color: T.stone }}>(facoltativo)</span></span>
              <input className="cp-in" value={bio} onChange={e => setBio(e.target.value)} placeholder="Es. Piastrellista da 20 anni, lavoro pulito" maxLength={80} />
            </label>
            {tipo === "piva" && (
              <label className="cp-f" style={{ marginTop: 6 }}>
                <span className="cp-l">Partita IVA</span>
                <input className="cp-in" value={piva} onChange={e => setPiva(e.target.value.replace(/[^\d\s]/g, ""))} placeholder="11 cifre" inputMode="numeric" maxLength={13} />
              </label>
            )}
            {tipo === "privato" && <span className="cp-h">Da privato si lavora solo ogni tanto: se diventa un'attività regolare serve la Partita IVA. Sul profilo i clienti vedranno “Privato”, perché per legge devono saperlo.</span>}
          </div>
        </>
      ),
    },
    {
      eyebrow: `Passo 2 di ${totSteps}`, title: "Cosa sai fare?",
      sub: "Scegli una o più competenze. Puoi cambiarle quando vuoi.",
      body: (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SKILL_OPTS.map(s => {
              const on = skills.includes(s);
              const bloccata = SKILL_IMPIANTI.includes(s) && tipo !== "piva";
              return <button type="button" className="bt" aria-pressed={on} disabled={bloccata && !on} key={s} onClick={() => toggle(skills, setSkills, s)} style={{ ...scelta(on), opacity: bloccata ? .45 : 1, cursor: bloccata ? "not-allowed" : "pointer" }}>{s}{bloccata ? " · solo imprese" : ""}</button>;
            })}
          </div>
          {tipo !== "piva" && <div className="cp-h" style={{ marginTop: 12 }}>Idraulica ed elettricità toccano gli impianti di casa: per legge (DM 37/2008) le possono fare solo imprese abilitate. Da privato puoi scegliere “Piccoli lavori (senza impianti)”: montare una lampada, sistemare una mensola.</div>}
          {impianti && (
            <label className="cp-check" style={{ marginTop: 16, background: T.ochreSoft, borderRadius: 12, padding: 12 }}>
              <input type="checkbox" checked={abil} onChange={e => setAbil(e.target.checked)} />
              <span>Dichiaro che la mia impresa è abilitata (DM 37/2008) per gli impianti che seleziono, con responsabile tecnico, e rilascio la dichiarazione di conformità quando è dovuta.</span>
            </label>
          )}
        </>
      ),
    },
    {
      eyebrow: `Passo 3 di ${totSteps}`, title: "Tariffa e zone",
      sub: "Decidi tu quanto chiedere e dove vuoi lavorare.",
      body: (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Chip on={!preventivo} onClick={() => setPreventivo(false)}>A ore</Chip>
            <Chip on={preventivo} onClick={() => setPreventivo(true)}>A preventivo</Chip>
          </div>
          {preventivo && <div className="cp-h" style={{ marginBottom: 10 }}>Il cliente vede “A preventivo” e una tariffa oraria indicativa: il prezzo vero lo concordate in chat dopo aver visto il lavoro.</div>}
          <Label>{preventivo ? "Tariffa oraria indicativa" : "La tua tariffa"}</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: T.card, borderRadius: 14, padding: "14px 18px", border: `1px solid ${T.line}`, marginBottom: 22 }}>
            <button type="button" aria-label="Meno un euro" onClick={() => setPrice(Math.max(5, price - 1))} className="bt tap" style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: T.ink }}>−</button>
            <div style={{ flex: 1, textAlign: "center" }}><Mono size={28} color={T.accent}>{price}€</Mono><span style={{ fontSize: 13, color: T.stone }}>/h</span></div>
            <button type="button" aria-label="Più un euro" onClick={() => setPrice(Math.min(150, price + 1))} className="bt tap" style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: T.ink }}>+</button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: -12, marginBottom: 22 }}>
            {[15, 20, 25, 30, 40, 50].map(v => <Chip key={v} on={price === v} onClick={() => setPrice(v)}>{v}€</Chip>)}
          </div>
          <Label>Dove lavori</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ZONE_CLIENTE.map(n => ({ n, id: n })).map(z => {
              const on = zones.includes(z.n);
              return <button type="button" className="bt" aria-pressed={on} key={z.id} onClick={() => toggle(zones, setZones, z.n)} style={{ minHeight: 44, padding: "0 16px", borderRadius: 999, fontSize: 14, fontWeight: 600, transition: "all .15s", background: on ? T.pine : T.card, color: on ? "#fff" : T.ink2, border: `1.5px solid ${on ? T.pine : T.line}` }}>{z.n}</button>;
            })}
          </div>
          <label className="cp-check" style={{ marginTop: 20 }}>
            <input type="checkbox" checked={rc} onChange={e => setRc(e.target.checked)} />
            <span>Ho un'assicurazione di responsabilità civile per i lavori che faccio <span style={{ color: T.stone }}>(facoltativo: sul profilo comparirà “Assicurazione RC”)</span>.</span>
          </label>
        </>
      ),
    },
    {
      eyebrow: `Passo 4 di ${totSteps}`, title: "Dati e regole",
      sub: "Data di nascita, residenza e codice fiscale servono per gli obblighi fiscali delle piattaforme: li vediamo solo noi.",
      body: (
        <>
          <label className="cp-f" style={{ marginBottom: 16 }}>
            <span className="cp-l">Il tuo cellulare</span>
            <input className="cp-in" value={tel} onChange={e => setTel(e.target.value)} placeholder="Es. 333 123 4567" inputMode="tel" autoComplete="tel" maxLength={16} />
            <span className="cp-h">Lo ricevono i clienti che accetti, per mettervi d'accordo. Lo confermi con un codice via SMS.</span>
          </label>
          <label className="cp-f" style={{ marginBottom: 16 }}>
            <span className="cp-l">Indirizzo di residenza</span>
            <input className="cp-in" value={residenza} onChange={e => setResidenza(e.target.value)} placeholder="Via, numero, comune" autoComplete="street-address" maxLength={100} />
          </label>
          <label className="cp-f" style={{ marginBottom: 6 }}>
            <span className="cp-l">Codice fiscale</span>
            <input aria-label="Codice fiscale" value={cf} onChange={e => { const v = e.target.value.toUpperCase().replace(/\s/g, ""); setCf(v); if (!nascita && v.length === 16) { const d = nascitaDaCf(v); if (d) setNascita(d); } }} placeholder="RSSMRA80A01D704X" maxLength={16}
              className="cp-in" style={{ fontFamily: "'Space Mono',monospace", letterSpacing: 1, borderColor: cf.length === 16 && !cfOk ? T.ember : undefined }} />
          </label>
          <div style={{ fontSize: 12.5, color: cf.length === 16 && !cfOk ? T.ember : T.stone, marginBottom: 18, lineHeight: 1.5 }}>
            {cf.length === 16 && !cfOk ? "Il formato non torna: controlla lettere e numeri." : "Dal codice fiscale ricaviamo la data di nascita: controllala qui sotto."}
          </div>
          <label className="cp-f" style={{ marginBottom: 16 }}>
            <span className="cp-l">Data di nascita</span>
            <input className="cp-in" type="date" aria-label="Data di nascita" value={nascita} onChange={e => setNascita(e.target.value)} max={dataLocale()} />
            {eta != null && eta < 18 && <span className="cp-err" style={{ marginTop: 0, textAlign: "left" }}>Per lavorare su TaskEase servono 18 anni.</span>}
          </label>
          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 13, color: T.ink2, lineHeight: 1.55 }}>
            <b style={{ color: T.ink }}>Perché ti chiediamo questi dati?</b> Una legge europea (si chiama DAC7) obbliga le app come la nostra a dire all'Agenzia delle Entrate chi lavora tramite loro: nome, codice fiscale, residenza e, se li conosciamo, quanti lavori e per quanto. Non vendiamo questi dati e non li vede nessun cliente.
          </div>
          <button type="button" className="bt tap" aria-pressed={fiscalOk} onClick={() => setFiscalOk(!fiscalOk)} style={{ width: "100%", textAlign: "left", display: "flex", gap: 12, background: fiscalOk ? T.pineSoft : T.card, borderRadius: 14, padding: 16, border: `1.5px solid ${fiscalOk ? T.pine : T.line}`, marginBottom: 14 }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: fiscalOk ? T.pine : "transparent", border: fiscalOk ? "none" : `1.5px solid ${T.faint}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              {fiscalOk && <Icon name="check" size={15} color="#fff" w={2.2} />}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: T.ink2, lineHeight: 1.5 }}>{tipo === "piva" ? "Dichiaro che fatturo i miei lavori con la mia Partita IVA. TaskEase non trattiene tasse né gestisce i pagamenti." : "Dichiaro che lavoro da privato solo ogni tanto (prestazione occasionale) e dichiaro quello che incasso. Se il lavoro diventa regolare, per legge apro la Partita IVA. TaskEase non trattiene tasse né gestisce i pagamenti."}</span>
          </button>
          <div style={{ display: "flex", gap: 10, background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <Icon name="shield" size={18} color={T.accent} />
            <span style={{ fontSize: 13, color: T.ink2, lineHeight: 1.5 }}><b>Verifica dell'identità:</b> dopo la registrazione fissiamo un incontro o una videochiamata e guardiamo il tuo documento. Non carichi foto di documenti e non ne teniamo copie.</span>
          </div>
          <label className="cp-check" style={{ marginBottom: 6 }}>
            <input type="checkbox" checked={termini} onChange={e => setTermini(e.target.checked)} />
            <span>Accetto i <button type="button" className="bt cp-link" onClick={() => onLegal?.("termini")}>Termini d'uso</button> e ho letto l'<button type="button" className="bt cp-link" onClick={() => onLegal?.("privacy")}>informativa privacy</button>.</span>
          </label>
          <div style={{ display: "flex", gap: 10, background: T.ochreSoft, borderRadius: 12, padding: 14, marginTop: 10 }}>
            <Icon name="hand" size={18} color={T.ochre} />
            <span style={{ fontSize: 12.5, color: T.ochreInk, lineHeight: 1.5 }}>Lavori in totale autonomia: decidi prezzi, lavori, orari e zone. TaskEase ti mette in contatto con chi cerca, non è il tuo datore di lavoro e non dirige il lavoro.</span>
          </div>
        </>
      ),
    },
  ];

  const cur = steps[step];
  const ultimo = step === totSteps - 1;
  const avanti = () => {
    if (!canNext) return;
    if (edit && ultimo) { onSave?.(dati()); avviso.mostra("Modifiche salvate."); nav.back("account"); return; }
    if (ultimo) { if (initial?.tel && normTel(initial.tel) === normTel(tel)) setStep(4); else setOtp(true); return; }
    setStep(step + 1);
  };
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 8px" }}>
        <button type="button" className="head-back" aria-label="Indietro" onClick={() => step > 0 ? setStep(step - 1) : nav.back("entrata")}><Icon name="arrowL" size={20} /></button>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: totSteps }).map((_, i) => <div key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i <= step ? T.pine : T.line, transition: "all .3s" }} />)}
        </div>
        <div style={{ width: 22 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "14px 24px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, letterSpacing: .6, textTransform: "uppercase", marginBottom: 8 }}>{edit ? "Modifica il profilo" : cur.eyebrow}</div>
        <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -.4, margin: 0 }}>{cur.title}</h1>
        <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.55, marginBottom: 22, marginTop: 6 }}>{cur.sub}</p>
        {cur.body}
      </div>
      <div style={{ padding: "16px 24px 26px" }}>
        {!canNext && <div style={{ fontSize: 12.5, color: T.stone, textAlign: "center", marginBottom: 10 }}>{manca[step]}</div>}
        <Btn full onClick={avanti} style={canNext ? {} : { opacity: .4 }}>{edit && ultimo ? "Salva le modifiche" : ultimo ? "Completa il profilo" : "Continua"}</Btn>
      </div>
    </div>
  );
}

/* ============================== PAGINE LEGALI ==============================
   Bozze in linguaggio semplice, da far revisionare a un legale prima del lancio.
   I dati tra [parentesi] vanno compilati con quelli veri. */
const LEGALE_VERS = "Bozza 0.1 · ottobre 2026";
const LEGAL = {
  info: { t: "Informazioni legali", s: [
    ["Chi gestisce TaskEase", "[Nome e cognome o ragione sociale] · P.IVA [11 cifre] · Sede: [indirizzo], Forlì (FC)."],
    ["Contatti", "Email: [email di contatto] · Telefono/WhatsApp: [numero]. È anche il punto di contatto per utenti e autorità previsto dal Regolamento UE sui servizi digitali (DSA). Rispondiamo in italiano."],
    ["Cosa siamo", "Una piattaforma che mette in contatto chi cerca aiuto con chi lavora nella zona di Forlì-Cesena. Non siamo parte dell'accordo tra cliente e chi lavora e non incassiamo il prezzo del lavoro."],
    ["Versione dei documenti", LEGALE_VERS + ". Le modifiche ai Termini vengono annunciate almeno 15 giorni prima; quelle alle regole dell'IDA 30 giorni prima."],
  ]},
  termini: { t: "Termini d'uso", s: [
    ["Cosa fa TaskEase", "Ti aiuta a trovare chi può fare un lavoro e a prenotarlo. L'accordo su lavoro, tempi e prezzo è tra te e chi lavora: TaskEase non lo esegue, non lo dirige e non è il datore di lavoro di nessuno."],
    ["Chi può usarla", "Persone maggiorenni che danno dati veri. Un profilo per persona. Sei responsabile di quello che scrivi."],
    ["Professionisti e privati", "Ogni profilo dichiara se lavora con Partita IVA o da privato in prestazione occasionale, e lo mostriamo. Con un privato non si applicano i diritti dei consumatori previsti dal diritto UE (per esempio recesso e garanzie del Codice del Consumo)."],
    ["Impianti", "Lavori su impianti elettrici, gas, idrico-sanitari e di riscaldamento li possono fare solo imprese abilitate (DM 37/2008). Chi sceglie queste categorie lo dichiara e ne risponde."],
    ["Prezzi e pagamenti", "La tariffa è decisa da chi lavora e mostrata prima della prenotazione. Paghi direttamente a fine lavoro, come vi accordate. TaskEase non incassa né trattiene niente sul lavoro. L'abbonamento Pro per chi lavora è facoltativo e non cambia l'ordine dei risultati né l'IDA."],
    ["Giudizi e IDA", "Può giudicare solo chi ha prenotato tramite TaskEase. Le regole di calcolo sono pubbliche nella pagina “Come verifichiamo i giudizi”. Chi riceve un giudizio potrà rispondere una volta (funzione attiva al lancio)."],
    ["Contenuti vietati e segnalazioni", "Vietati contenuti illegali, offensivi, falsi o con dati personali di altri. Chiunque può segnalarli con il tasto “Segnala”. Decidiamo in modo motivato e lo comunichiamo per SMS o email a chi ha segnalato e a chi ha pubblicato. Entrambi possono contestare la decisione, gratis, rispondendo a quel messaggio entro 6 mesi: la riesamina una persona."],
    ["Sospensione e chiusura", "Possiamo sospendere un profilo per violazioni gravi o ripetute, spiegando il motivo. Puoi cancellare il tuo profilo quando vuoi da Profilo."],
    ["Responsabilità", "Chi esegue il lavoro ne risponde. TaskEase risponde del proprio servizio di messa in contatto, nei limiti di legge."],
    ["Legge e foro", "Legge italiana. Per i consumatori è competente il giudice del luogo in cui risiedono."],
  ]},
  privacy: { t: "Informativa privacy", s: [
    ["Titolare del trattamento", "[Nome e cognome o ragione sociale], [indirizzo], Forlì · [email di contatto]."],
    ["Quali dati", "Chi cerca aiuto: nome, cellulare, zona; l'indirizzo solo quando prenoti. Chi lavora: in più nome e cognome, foto, competenze, tariffa, zone, data di nascita, residenza, codice fiscale, eventuale Partita IVA e le dichiarazioni su abilitazione e assicurazione. Per tutti: prenotazioni, giudizi, messaggi, annunci in bacheca (con eventuale foto), preferiti, persone bloccate, segnalazioni (con nome ed email di chi segnala) e la data in cui hai accettato i Termini."],
    ["Perché e su quale base", "Per far funzionare il servizio che chiedi (contratto). Per obblighi di legge: comunicazione fiscale delle piattaforme (DAC7) e gestione delle segnalazioni previste dal Regolamento UE sui servizi digitali. Per la sicurezza degli utenti, compresa la verifica dell'identità di chi lavora (legittimo interesse). Niente pubblicità e niente vendita di dati."],
    ["Chi li vede", "Pubblici, visibili a chiunque usi l'app: il profilo di chi lavora (nome e cognome, foto, competenze, tariffa, zone, IDA, se è privato o con P.IVA), i giudizi con nome e iniziale di chi li ha scritti, gli annunci in bacheca con nome e zona. Riservati: cellulare e indirizzo, solo a chi accetta il lavoro; dati fiscali, solo a noi e, quando dovuto, all'Agenzia delle Entrate. Fornitori tecnici (hosting e invio SMS) li trattano per nostro conto, nell'Unione europea."],
    ["Per quanto tempo", "Finché il profilo è attivo. Messaggi e segnalazioni: 12 mesi dalla chiusura. Se un profilo resta inattivo 24 mesi ti avvisiamo e poi lo cancelliamo. Dopo la cancellazione togliamo i dati entro 30 giorni, tranne quelli che la legge ci obbliga a conservare (dati fiscali); i giudizi che hai lasciato restano senza il tuo nome."],
    ["Documenti d'identità", "La verifica la facciamo guardando il documento di persona o in videochiamata. Non conserviamo copie: salviamo solo che la verifica è avvenuta e quando."],
    ["I tuoi diritti", "Accesso, correzione, cancellazione, portabilità (“Scarica i miei dati” in Profilo), opposizione e limitazione. Puoi fare reclamo al Garante per la protezione dei dati personali."],
    ["Cookie e caratteri", "Solo cookie tecnici necessari al funzionamento. Nessun cookie di profilazione o di statistica. In questa anteprima i caratteri tipografici arrivano da Google Fonts; nell'app vera li ospitiamo sui nostri server."],
  ]},
  ranking: { t: "Come ordiniamo i risultati", s: [
    ["L'ordine di partenza", "Dalla persona più vicina a te. La distanza si calcola dalla tua zona, non dal tuo indirizzo. Nessuno paga per comparire prima e l'abbonamento Pro non cambia l'ordine."],
    ["In home", "Vedi le tre persone disponibili più vicine. Chi ha spento “Disponibile” lo trovi comunque in Cerca."],
    ["Gli ordinamenti che scegli tu", "Puoi ordinare per prezzo o per IDA più alto. Ordinando per IDA, chi è nuovo e non ha ancora un IDA va in fondo, dopo gli altri. Le categorie filtrano per competenze e descrizione dichiarate."],
    ["Cosa non usiamo", "Non premiamo chi accetta più lavori o risponde più spesso, e non nascondiamo chi rifiuta."],
  ]},
  giudizi: { t: "Come verifichiamo i giudizi", s: [
    ["Chi può giudicare", "Solo chi ha prenotato quel lavoro tramite TaskEase: un giudizio per prenotazione."],
    ["Come si calcola", "Cinque domande da 1 a 5: puntualità 20%, qualità 30%, parola mantenuta 20%, pulizia 15%, comunicazione 15%. Ogni giudizio vale da 20 a 100. L'IDA compare dopo " + IDA_MIN_LAVORI + " lavori: gli ultimi 12 mesi contano per intero, da 12 a 24 mesi a metà, oltre non contano."],
    ["Cosa non facciamo", "Non paghiamo giudizi, non li scriviamo noi e non togliamo quelli negativi. Rimuoviamo solo testi illegali, offensivi o con dati personali, spiegando il motivo."],
    ["Diritto di replica", "Al lancio chi riceve un giudizio potrà rispondere una volta, sotto al giudizio. Nell'anteprima la risposta non è ancora attiva."],
  ]},
  sicurezza: { t: "Consigli di sicurezza", s: [
    ["Prima del lavoro", "Concorda per iscritto in chat cosa va fatto, la tariffa e le ore stimate. Diffida di chi chiede soldi in anticipo."],
    ["Durante", "Se puoi, non restare solo in casa con persone che non conosci la prima volta. Per i lavori su impianti chiedi la dichiarazione di conformità."],
    ["Dopo", "Paga solo le ore reali, chiedi la ricevuta o la fattura se dovuta, e lascia il giudizio: aiuta chi verrà dopo."],
    ["Se qualcosa va storto", "Usa “Segnala un problema”: leggiamo ogni segnalazione. In caso di pericolo chiama il 112."],
  ]},
};

function Legal({ nav, doc = "info" }) {
  const d = LEGAL[doc] || LEGAL.info;
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="account" title={d.t} />
      <div style={{ padding: "4px 22px 28px" }}>
        <div className="esempio-top" style={{ marginBottom: 16 }}><span className="ticker-tag">BOZZA</span><span>{LEGALE_VERS}. Testo per l'anteprima, da far revisionare a un legale prima del lancio.</span></div>
        {d.s.map(([t, x]) => (
          <section key={t} style={{ marginBottom: 18 }}>
            <h2 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, margin: "0 0 4px" }}>{t}</h2>
            <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.6, margin: 0 }}>{x}</p>
          </section>
        ))}
        {doc === "info" && (
          <div style={{ marginTop: 8 }}>
            {[["termini", "Termini d'uso"], ["privacy", "Informativa privacy"], ["ranking", "Come ordiniamo i risultati"], ["giudizi", "Come verifichiamo i giudizi"], ["sicurezza", "Consigli di sicurezza"]].map(([k, l]) => <MenuRow key={k} ic="book" l={l} onClick={() => nav("legal", { doc: k })} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* Documento legale sopra un modulo, senza perdere quello che hai scritto */
const fogliAperti = []; // pila dei fogli: Esc chiude solo quello in cima
function useSheet(onClose) {
  const ref = useRef(null);
  const chiudi = useRef(onClose); chiudi.current = onClose;
  useEffect(() => {
    const prima = document.activeElement;
    const io = {}; fogliAperti.push(io);
    ref.current?.focus();
    const k = (e) => { if (e.key === "Escape" && fogliAperti[fogliAperti.length - 1] === io) { e.stopImmediatePropagation(); chiudi.current(); } };
    window.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("keydown", k);
      const i = fogliAperti.indexOf(io); if (i >= 0) fogliAperti.splice(i, 1);
      if (prima && prima.isConnected) prima.focus?.();
    };
  }, []);
  return ref;
}
function LegalSheet({ doc, onClose }) {
  const d = LEGAL[doc] || LEGAL.info;
  const ref = useSheet(onClose);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [doc]);
  return (
    <div className="cp-sheet-bg" style={{ zIndex: 80 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cp-sheet" role="dialog" aria-modal="true" aria-label={d.t} tabIndex={-1} ref={ref}>
        <div className="cp-grab" />
        <div className="cp-sheet-top">
          <div><div className="cp-sheet-t">{d.t}</div><div className="cp-sheet-s">{LEGALE_VERS} · bozza da far revisionare</div></div>
          <button type="button" className="cp-x" aria-label="Chiudi" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ marginTop: 14 }}>
          {d.s.map(([t, x]) => <div key={t} style={{ marginBottom: 14 }}><div style={{ fontWeight: 700, fontSize: 13.5, color: T.ink }}>{t}</div><div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.55, marginTop: 2 }}>{x}</div></div>)}
          {doc === "info" && [["termini", "Termini d'uso"], ["privacy", "Informativa privacy"], ["ranking", "Come ordiniamo i risultati"], ["giudizi", "Come verifichiamo i giudizi"]].map(([k, l]) => <MenuRow key={k} ic="book" l={l} onClick={() => legale.apri(k)} />)}
        </div>
      </div>
    </div>
  );
}

/* ============================== SEGNALA UN CONTENUTO (DSA art. 16-17) ============================== */
function SegnalaContenuto({ nav, cosa, onInviata, profilo }) {
  const [motivo, setMotivo] = useState(null);
  const [nomeS, setNomeS] = useState(profilo?.nome || "");
  const [txt, setTxt] = useState("");
  const [email, setEmail] = useState("");
  const [buonaFede, setBuonaFede] = useState(false);
  const [fatto, setFatto] = useState(false);
  const motivi = ["Offensivo o diffamatorio", "Falso o ingannevole", "Contiene dati personali di qualcuno", "Possibile truffa", "Altro contenuto illegale"];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const ok = motivo && txt.trim().length >= 20 && nomeS.trim().length >= 2 && emailOk && buonaFede;
  const manca = !motivo ? "Scegli un motivo." : txt.trim().length < 20 ? "Spiega in almeno 20 caratteri cosa non va." : nomeS.trim().length < 2 ? "Serve il tuo nome." : !emailOk ? "Serve un'email per mandarti la decisione." : !buonaFede ? "Manca la dichiarazione di buona fede." : null;
  if (fatto) return <Done nav={nav} title="Segnalazione ricevuta." body={<>La esaminiamo e ti scriviamo a {email} la decisione con la motivazione.<br />Se il contenuto viene rimosso, anche chi l'ha pubblicato riceve la motivazione e può contestarla.</>} actions={<Btn full onClick={() => nav.back("home")}>Torna indietro</Btn>} />;
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="home" title="Segnala un contenuto" />
      <div style={{ padding: "4px 22px 24px" }}>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 14, marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.stone, letterSpacing: .6, textTransform: "uppercase" }}>{cosa?.tipo || "Contenuto"}</div>
          <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5, marginTop: 4 }}>{cosa?.testo || "—"}</div>
          {cosa?.rif && <div style={{ fontSize: 12.5, color: T.stone, marginTop: 6, fontFamily: "'Space Mono',monospace" }}>Riferimento: taskease.it/{cosa.rif}</div>}
        </div>
        <Label>Perché lo segnali?</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {motivi.map(m => <button type="button" key={m} className="bt opt" aria-pressed={motivo === m} onClick={() => setMotivo(m)} style={{ textAlign: "left", background: motivo === m ? T.pineSoft : T.card, borderRadius: 13, padding: "13px 15px", border: `1.5px solid ${motivo === m ? T.pine : T.line}`, fontSize: 14, color: T.ink }}>{m}</button>)}
        </div>
        <label className="cp-f" style={{ marginBottom: 16 }}>
          <span className="cp-l">Spiega cosa non va</span>
          <textarea className="cp-in" value={txt} onChange={e => setTxt(e.target.value)} maxLength={800} style={{ height: 96, resize: "none" }} placeholder="Cosa c'è di illegale o scorretto, e perché." />
        </label>
        <label className="cp-f" style={{ marginBottom: 16 }}>
          <span className="cp-l">Il tuo nome</span>
          <input className="cp-in" value={nomeS} onChange={e => setNomeS(e.target.value)} placeholder="Nome e cognome" autoComplete="name" maxLength={60} />
        </label>
        <label className="cp-f" style={{ marginBottom: 16 }}>
          <span className="cp-l">La tua email</span>
          <input className="cp-in" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@esempio.it" autoComplete="email" />
          <span className="cp-h">Per mandarti la decisione. Nome ed email non li diamo a chi hai segnalato.</span>
        </label>
        <label className="cp-check" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={buonaFede} onChange={e => setBuonaFede(e.target.checked)} />
          <span>Dichiaro in buona fede che le informazioni che ho dato sono corrette e complete.</span>
        </label>
        <Btn full kind="ember" onClick={() => { if (!ok) return; onInviata?.({ nome: nomeS.trim(), contenuto: cosa?.tipo, riferimento: cosa?.rif || null, motivo, email, data: dataLocale() }); setFatto(true); }} style={ok ? {} : { opacity: .4, cursor: "not-allowed" }}>Invia la segnalazione</Btn>
        {manca && <div style={{ fontSize: 12.5, color: T.stone, textAlign: "center", marginTop: 8 }}>{manca}</div>}
      </div>
    </div>
  );
}

/* ============================== ACCEDI ============================== */
function Login({ nav, profilo, setupDone, onLogin, motivo }) {
  const [tel, setTel] = useState("");
  const [fase, setFase] = useState("tel"); // tel | codice | nessuno
  const norm = normTel;
  const invia = () => { if (!telOk(tel)) return; setFase(profilo && norm(profilo.tel) === norm(tel) ? "codice" : "nessuno"); };
  const dopoCodice = () => { if (profilo && norm(profilo.tel) === norm(tel)) onLogin(); else setFase("nessuno"); };
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="entrata" title="Accedi" />
      <div className="cp">
        <h1 className="cp-h1">Bentornati.<br /><em>Accedi col tuo numero.</em></h1>
        <p className="cp-sub">{motivo || "Ti mandiamo un codice via SMS. Niente password da ricordare."}</p>
        {fase === "tel" && (
          <div className="cp-form">
            <label className="cp-f">
              <span className="cp-l">Il tuo cellulare</span>
              <input className="cp-in" value={tel} onChange={e => setTel(e.target.value)} placeholder="Es. 333 123 4567" inputMode="tel" autoComplete="tel" maxLength={16} />
            </label>
            <button type="button" className={"cp-btn" + (telOk(tel) ? "" : " off")} onClick={invia}>Mandami il codice</button>
          </div>
        )}
        {fase === "codice" && <OtpStep tel={tel} onOk={dopoCodice} onBack={() => setFase("tel")} />}
        {fase === "nessuno" && (
          <div className="cp-form">
            <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 16, fontSize: 13.5, color: T.ink2, lineHeight: 1.6 }}>Con questo numero non c'è un profilo. In questa anteprima i profili vivono solo finché la pagina resta aperta.</div>
            {!profilo && !setupDone
              ? <button type="button" className="cp-btn" onClick={() => nav("entrata")}>Crea un profilo</button>
              : <div className="cp-h">Su questo telefono c'è già un profilo, registrato con un altro numero: accedi con quello.</div>}
            <button type="button" className="cp-later" onClick={() => setFase("tel")}>Prova un altro numero</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== SCARICA I MIEI DATI (GDPR art. 20) ============================== */
function MieiDati({ nav, dati }) {
  const [copiato, setCopiato] = useState(null);
  const txt = JSON.stringify(dati, null, 2);
  const copia = () => { try { const p = navigator.clipboard?.writeText(txt); p && p.then ? p.then(() => setCopiato(true), () => setCopiato(false)) : setCopiato(false); } catch (e) { setCopiato(false); } };
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="account" title="I miei dati" />
      <div style={{ padding: "4px 22px 24px" }}>
        <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.6, marginTop: 0 }}>Tutto quello che TaskEase sa di te, in un formato leggibile e riutilizzabile. Nell'app vera arriva anche come file da scaricare.</p>
        <pre style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 14, fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", color: T.ink, fontFamily: "'Space Mono',monospace", maxHeight: 380, overflow: "auto" }}>{txt}</pre>
        <div style={{ marginTop: 14 }}><Btn full onClick={copia}>{copiato === true ? "Copiati ✓" : copiato === false ? "Copia non riuscita: seleziona il testo a mano" : "Copia i dati"}</Btn></div>
      </div>
    </div>
  );
}

/* ============================== ASSISTENZA (punto di contatto DSA art. 11-12) ============================== */
function Assistenza({ nav }) {
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="account" title="Assistenza e contatti" />
      <div style={{ padding: "4px 22px 24px" }}>
        <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.6, marginTop: 0 }}>Rispondiamo di persona, in italiano, di solito entro un giorno lavorativo.</p>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
          {[["message", "WhatsApp", "[numero WhatsApp]"], ["send", "Email", "[email di contatto]"]].map(([ic, l, v]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
              <Icon name={ic} size={19} color={T.accent} />
              <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 13, color: T.stone }}>{l}</span><span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{v}</span></span>
            </div>
          ))}
          <div className="cp-h" style={{ marginTop: 6 }}>Anteprima: i contatti tra [parentesi] vanno sostituiti con quelli veri. È anche il punto di contatto per autorità e utenti previsto dal DSA.</div>
        </div>
        <MenuRow ic="compass" l="Come funziona TaskEase" onClick={() => nav("help")} />
        <MenuRow ic="star" l="Consigli di sicurezza" onClick={() => nav("legal", { doc: "sicurezza" })} />
        <MenuRow ic="book" l="Informazioni legali e privacy" onClick={() => nav("legal", { doc: "info" })} />
        <div style={{ display: "flex", gap: 10, background: T.emberSoft, borderRadius: 12, padding: 14, marginTop: 16 }}>
          <Icon name="shield" size={18} color={T.ember} />
          <span style={{ fontSize: 13, color: T.ember, lineHeight: 1.5 }}>In caso di pericolo immediato chiama il <strong>112</strong>.</span>
        </div>
      </div>
    </div>
  );
}

/* ============================== PERSONE BLOCCATE ============================== */
function Bloccati({ nav, blocked, setBlocked }) {
  const lista = blocked.map(wById).filter(Boolean);
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.paper, overflow: "auto" }}>
      <Head nav={nav} to="account" title="Persone bloccate" />
      <div style={{ padding: "4px 22px 24px" }}>
        <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6, marginTop: 0 }}>Non compaiono nelle ricerche, nei preferiti e in bacheca. Non ricevono nessun avviso.</p>
        {lista.length === 0 && <div style={{ color: T.stone, fontSize: 13.5, padding: "20px 0" }}>Nessuna persona bloccata.</div>}
        {lista.map(w => (
          <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.line}` }}>
            <Avatar ini={w.ini} lv={w.lv} sz={40} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.ink }}>{w.n}</span>
            <button type="button" className="bt tap" onClick={() => setBlocked(b => b.filter(x => x !== w.id))} style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>Sblocca</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== APP SHELL ============================== */
const STYLE = `
*, *::before, *::after { box-sizing: border-box; }
body, body * { margin: 0; padding: 0; }
html, body, #root { height: 100%; }
body { background: #E4DFD4; }
@media (max-width: 520px) { body { background: ${T.paper}; } }
::-webkit-scrollbar { width: 0; }
input::placeholder, textarea::placeholder { color: ${T.stone}; }
.campo { display: flex; align-items: center; gap: 10px; background: ${T.card}; border: 1.5px solid ${T.faint}; border-radius: 14px; padding: 0 14px; min-height: 48px; }
.campo:focus-within { border-color: ${T.accent}; box-shadow: 0 0 0 3px rgba(127,209,188,.22); }
.campo input { outline: none !important; }
input:focus-visible, textarea:focus-visible { outline: 2.5px solid ${T.accent} !important; outline-offset: 1px; }
.row:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,.25); border-color: ${T.faint}; }
.btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
.btn:active { transform: translateY(0) scale(.99); }
.cat:hover > div:first-child { border-color: ${T.accent}; background: ${T.pineSoft}; transform: translateY(-2px); }
.opt:hover { border-color: ${T.accent}; background: ${T.pineSoft}; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
.dot:hover { filter: brightness(1.1); transform: translate(-50%,-50%) scale(1.2); }
.tap:active { transform: scale(.92); opacity: .7; }
@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes breathe { 0%,100% { opacity: .35; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
@keyframes rg { 0% { transform: scale(.7); opacity: .6; } 100% { transform: scale(1.6); opacity: 0; } }
@keyframes stamp { 0% { transform: scale(0) rotate(-12deg); opacity: 0; } 60% { transform: scale(1.12) rotate(4deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }

/* ---------- Ingresso moderno ---------- */
.ent { position: relative; height: 100%; background: radial-gradient(120% 70% at 50% 18%, #1F4E46 0%, ${T.pineDeep} 55%, #0F2420 100%); color: ${T.cream}; overflow: hidden; }
.ent-scroll { height: 100%; overflow-y: auto; padding: 22px 24px 236px; display: flex; flex-direction: column; }
.ent-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ent-mark { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 19px; letter-spacing: -.3px; }
.ent-pill { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; padding: 6px 11px; border-radius: 20px; background: rgba(246,242,234,.08); border: 1px solid rgba(246,242,234,.12); }
.ent-dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.ochre}; animation: breathe 2s infinite; }
.ent-hero { display: flex; flex-direction: column; align-items: center; gap: 12px; margin: 34px 0 30px; }
.ent-cap { font-size: 13px; color: rgba(246,242,234,.8); text-align: center; max-width: 250px; line-height: 1.45; }
.ent-h { font-family: 'Hanken Grotesk', sans-serif; font-weight: 800; font-size: clamp(36px, 11vw, 44px); line-height: 1.02; letter-spacing: -1.4px; margin: 0; text-wrap: balance; }
.ent-h em { font-style: normal; color: ${T.ochreLight}; font-weight: 500; }
.ent-sub { font-size: 15px; line-height: 1.55; color: rgba(246,242,234,.82); margin-top: 14px; max-width: 34ch; }
.ent-points { display: flex; flex-direction: column; gap: 14px; margin-top: 24px; }
.ent-point { display: flex; gap: 14px; align-items: flex-start; }
.ent-ico { width: 40px; height: 40px; border-radius: 12px; background: rgba(169,118,43,.16); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ent-pt { font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 16px; }
.ent-ps { font-size: 13px; color: rgba(246,242,234,.8); line-height: 1.5; margin-top: 2px; }

.esempio { border: 1.5px dashed ${T.faint}; border-radius: 20px; padding: 16px; margin-top: 4px; }
.esempio-top { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: ${T.ink2}; line-height: 1.5; margin-bottom: 14px; }
.esempio-top .ticker-tag { flex-shrink: 0; }
.cp-priv { font-size: 13px; color: ${T.ink2}; background: ${T.card}; border: 1px solid ${T.line}; border-radius: 12px; padding: 10px 14px; }
.cp-priv summary { cursor: pointer; font-weight: 700; color: ${T.accent}; }
.cp-priv p { margin-top: 8px; line-height: 1.55; }
.cp { padding: 8px 22px 36px; }
.cp-eye { font-size: 12.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: ${T.ochreInk}; margin: 26px 0 8px; }
.cp-h1 { font-family: 'Hanken Grotesk', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.1; color: ${T.ink}; margin: 6px 0 0; }
.cp-h1 em { font-style: normal; font-weight: 500; color: ${T.ochre}; }
.cp-sub { font-size: 14px; color: ${T.ink2}; line-height: 1.55; margin: 10px 0 0; }
.cp-form { display: flex; flex-direction: column; gap: 20px; margin-top: 24px; }
.cp-f { display: flex; flex-direction: column; gap: 7px; }
.cp-l { font-size: 14px; font-weight: 700; color: ${T.ink}; }
.cp-h { font-size: 13px; color: ${T.stone}; line-height: 1.45; }
.cp-in { width: 100%; box-sizing: border-box; border: 1.5px solid ${T.faint}; border-radius: 14px; padding: 14px 15px; font-size: 16px; font-family: 'Hanken Grotesk', sans-serif; background: ${T.card}; color: ${T.ink}; outline: none; transition: border-color .15s; }
.cp-in:focus { border-color: ${T.accent}; }
.cp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cp-chip { background: ${T.card}; border: 1.5px solid ${T.line}; border-radius: 999px; min-height: 44px; padding: 0 16px; font-size: 14px; font-weight: 600; color: ${T.ink2}; cursor: pointer; font-family: inherit; }
.cp-chip.on { background: ${T.pine}; border-color: ${T.accent}; color: #fff; }
.cp-check { display: flex; gap: 12px; align-items: flex-start; font-size: 13px; color: ${T.ink2}; line-height: 1.5; cursor: pointer; }
.cp-check b { color: ${T.ink}; }
.cp-check input { width: 26px; height: 26px; margin: 0; flex-shrink: 0; accent-color: ${T.accent}; }
.cp-btn { width: 100%; border: 0; border-radius: 14px; padding: 16px; font-size: 15.5px; font-weight: 700; color: #fff; background: ${T.pine}; cursor: pointer; font-family: inherit; transition: opacity .15s; }
.cp-btn.off { opacity: .45; }
.cp-err { font-size: 13px; color: ${T.ember}; text-align: center; margin-top: -8px; }
.cp-later { display: block; margin: 16px auto 0; background: none; border: 0; font-size: 14px; font-weight: 600; color: ${T.ink2}; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; font-family: inherit; padding: 8px; }
.cp-guest { background: ${T.pine}; border-radius: 20px; padding: 20px; color: ${T.cream}; }
.cp-guest-t { font-family: 'Hanken Grotesk', sans-serif; font-size: 19px; font-weight: 700; }
.cp-guest-s { font-size: 13px; line-height: 1.55; color: rgba(246,242,234,.82); margin-top: 6px; }
.cp-guest-b { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; background: ${T.paper}; color: ${T.accent}; border: 0; border-radius: 12px; padding: 12px 16px; font-size: 14.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
.cp-sheet-bg { position: absolute; inset: 0; z-index: 60; background: rgba(0,0,0,.6); display: flex; align-items: flex-end; animation: fade .2s ease; }
.cp-sheet { width: 100%; max-height: 92%; overflow-y: auto; background: ${T.paper}; border-radius: 26px 26px 0 0; padding: 10px 22px calc(24px + env(safe-area-inset-bottom, 0px)); box-sizing: border-box; animation: sheetup .3s cubic-bezier(.2,.8,.2,1); }
.cp-grab { width: 40px; height: 4px; border-radius: 2px; background: ${T.faint}; margin: 0 auto 14px; }
.cp-sheet-top { display: flex; gap: 12px; align-items: flex-start; }
.cp-sheet-top > div { flex: 1; }
.cp-sheet-t { font-family: 'Hanken Grotesk', sans-serif; font-size: 21px; font-weight: 700; color: ${T.ink}; }
.cp-sheet-s { font-size: 13px; color: ${T.ink2}; line-height: 1.5; margin-top: 4px; }
.cp-x { width: 44px; height: 44px; border-radius: 50%; border: 0; background: ${T.line}; color: ${T.ink}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.cp-sheet .cp-form { margin-top: 18px; }
@keyframes sheetup { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
.acc-paused { display: flex; align-items: center; gap: 10px; background: ${T.ochreSoft}; border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; color: ${T.ochreInk}; line-height: 1.45; }
.acc-paused button { flex-shrink: 0; background: ${T.ochreBtn}; color: #fff; border: 0; border-radius: 10px; padding: 8px 12px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
.acc-sec { font-family: 'Hanken Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: ${T.ink}; margin: 28px 0 10px; }
.acc-list { background: ${T.card}; border: 1px solid ${T.line}; border-radius: 18px; overflow: hidden; }
.acc-row { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; background: none; border: 0; padding: 14px 16px; cursor: pointer; font-family: inherit; color: ${T.ink}; }
.acc-row + .acc-row { border-top: 1px solid ${T.line}; }
.acc-row:active { background: ${T.paper}; }
.acc-row:focus-visible { outline: 2.5px solid ${T.accent}; outline-offset: -3px; }
.acc-t { display: flex; flex-direction: column; font-size: 14.5px; font-weight: 600; }
.acc-t small { font-size: 13px; font-weight: 500; color: ${T.stone}; margin-top: 2px; }
.acc-row.danger .acc-t { color: ${T.ember}; }
.del { padding: 8px 22px 32px; }
.del-h { font-family: 'Hanken Grotesk', sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -.4px; line-height: 1.15; color: ${T.ink}; margin: 6px 0 18px; }
.del-alt { display: flex; flex-direction: column; gap: 12px; background: ${T.pineSoft}; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
.del-alt b { display: block; font-size: 14.5px; color: ${T.accent}; }
.del-alt span { display: block; font-size: 13px; color: ${T.ink2}; line-height: 1.5; margin-top: 3px; }
.del-box { background: ${T.card}; border: 1px solid ${T.line}; border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; }
.del-lab { font-size: 12.5px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: ${T.ink2}; margin-bottom: 8px; }
.del-li { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; color: ${T.ink}; line-height: 1.45; padding: 5px 0; }
.del-li svg { flex-shrink: 0; margin-top: 2px; }
.del-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.del-chip { background: ${T.card}; border: 1.5px solid ${T.line}; border-radius: 999px; min-height: 44px; padding: 0 16px; font-size: 14px; font-weight: 600; color: ${T.ink2}; cursor: pointer; font-family: inherit; }
.del-chip.on { background: ${T.pine}; border-color: ${T.accent}; color: #fff; }
.del-check { display: flex; gap: 12px; align-items: flex-start; margin: 24px 0 16px; font-size: 13.5px; color: ${T.ink}; line-height: 1.45; cursor: pointer; }
.del-check input { width: 20px; height: 20px; margin: 0; flex-shrink: 0; accent-color: ${T.ember}; }
.del-btn { width: 100%; border: 0; border-radius: 14px; padding: 15px; font-size: 15px; font-weight: 700; color: #fff; background: ${T.emberBtn}; cursor: pointer; font-family: inherit; transition: opacity .15s; }
.del-btn:disabled { opacity: .35; cursor: not-allowed; }
.del-keep { width: 100%; background: none; border: 0; padding: 14px; font-size: 14px; font-weight: 600; color: ${T.accent}; cursor: pointer; font-family: inherit; }
.del-note { font-size: 13px; color: ${T.stone}; text-align: center; line-height: 1.5; margin: 0; }
.del-done { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; animation: rise .4s ease; }
.del-done-ic { width: 68px; height: 68px; border-radius: 50%; background: ${T.pineSoft}; display: flex; align-items: center; justify-content: center; }
.del-done h1 { font-family: 'Hanken Grotesk', sans-serif; font-size: 26px; font-weight: 800; color: ${T.ink}; margin: 22px 0 8px; }
.del-done p { font-size: 14px; color: ${T.ink2}; line-height: 1.6; margin: 0 0 28px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.bt { background: none; border: 0; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.badge { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: ${T.ink2}; background: ${T.line}; border-radius: 8px; padding: 4px 9px; }
.badge.ok { color: ${T.accent}; background: ${T.pineSoft}; }
.cp-link { color: ${T.accent}; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; display: inline; padding: 0; }
.ent-acc { color: ${T.cream}; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; font-size: inherit; }
.book-bar { position: sticky; bottom: 0; z-index: 5; background: ${T.paper}; box-shadow: 0 -10px 24px -14px rgba(0,0,0,.5); border-top: 1px solid ${T.line}; padding: 14px 22px calc(16px + env(safe-area-inset-bottom, 0px)); }
@media (max-width: 399px) { .bb-sub { display: none; } }
.toast, .a-capo { overflow-wrap: anywhere; }
.tre-righe { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.toast { pointer-events: none; position: absolute; left: 16px; right: 16px; bottom: calc(96px + env(safe-area-inset-bottom, 0px)); z-index: 120; background: ${T.ink}; color: ${T.paper}; font-size: 14px; font-weight: 600; line-height: 1.45; padding: 13px 16px; border-radius: 14px; box-shadow: 0 12px 30px -12px rgba(0,0,0,.5); animation: rise .25s ease; }
.scudo { position: absolute; inset: 0; z-index: 150; }
.bt.tap { position: relative; }
.bt.tap::after { content: ""; position: absolute; inset: -15px -6px; } /* area di tocco >= 44px anche per i link di testo */
.onb-dots button { position: relative; }
.onb-dots button::after { content: ""; position: absolute; inset: -14px -6px; }
.link { position: relative; }
.link::after { content: ""; position: absolute; inset: -12px -8px; }
.bt:focus-visible { outline: 2.5px solid ${T.accent}; outline-offset: 2px; border-radius: 8px; }
button:focus-visible { outline: 2.5px solid ${T.accent}; outline-offset: 2px; }
.del-chip.on:focus-visible { outline-color: ${T.ochre}; }
.ent-h1 { margin-top: 30px; }
.ent-ida { display: flex; gap: 18px; align-items: center; margin-top: 26px; padding: 16px 18px 16px 14px; border-radius: 22px; background: rgba(246,242,234,.06); border: 1px solid rgba(246,242,234,.1); }
.ent-ida .seal-hero { flex-shrink: 0; }
.ent-ida .seal-num { font-size: 30px; letter-spacing: -1px; }
.ent-ida .seal-lab { font-size: 9px; letter-spacing: 2px; margin-top: 3px; }
.ent-ida-t { font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 17px; }
.ent-ida-s { font-size: 13px; color: rgba(246,242,234,.82); line-height: 1.5; margin-top: 4px; }
.ent-eyebrow { font-size: 12.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: ${T.ochreLight}; margin: 28px 0 12px; }
.ent-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.ent-step { display: flex; gap: 14px; align-items: flex-start; }
.ent-n { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: 'Space Mono', monospace; font-weight: 700; font-size: 14px; color: ${T.ochreLight}; border: 1.5px solid rgba(217,172,102,.6); }
.seal-hero { position: relative; display: flex; align-items: center; justify-content: center; }
.seal-hero::before { content: ""; position: absolute; inset: -18%; border-radius: 50%; background: radial-gradient(circle, rgba(169,118,43,.28), transparent 62%); animation: glow 1.6s ease .5s both; }
.seal-hero svg { position: absolute; inset: 0; }
.seal-dots { transform-origin: 60px 60px; animation: spin 60s linear infinite; }
.seal-draw { stroke-dashoffset: var(--c); animation: draw 1.3s cubic-bezier(.65,0,.25,1) .42s forwards; }
.seal-hero-in { position: relative; display: flex; flex-direction: column; align-items: center; line-height: 1; }
.seal-num { font-family: 'Space Mono', monospace; font-weight: 700; font-size: 54px; color: ${T.ochre}; font-variant-numeric: tabular-nums; letter-spacing: -2px; }
.seal-lab { font-size: 13px; font-weight: 700; letter-spacing: 3px; color: ${T.ochre}; margin-top: 6px; }
.seal-nuovo { font-family: 'Space Mono', monospace; font-weight: 700; font-size: 22px; color: ${T.ochre}; letter-spacing: 1px; }

.mq { margin: 26px -24px 0; overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
.mq-track { display: flex; gap: 8px; width: max-content; animation: mq 32s linear infinite; }
.mq-chip { font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 22px; border: 1px solid rgba(246,242,234,.16); color: rgba(246,242,234,.82); white-space: nowrap; }

.ent-bar { position: absolute; left: 0; right: 0; bottom: 0; padding: 16px 18px calc(16px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; gap: 10px; background: rgba(15,36,32,.72); -webkit-backdrop-filter: blur(16px) saturate(1.2); backdrop-filter: blur(16px) saturate(1.2); border-top: 1px solid rgba(246,242,234,.08); animation: barin .5s cubic-bezier(.2,.8,.2,1) .2s both; }
.ent-btn { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; text-align: left; border-radius: 18px; padding: 15px 18px; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; transition: transform .12s, filter .15s, background .15s; }
.ent-btn > span { display: flex; flex-direction: column; gap: 2px; }
@media (max-height: 700px) { .ent-btn-s { display: none; } .ent-btn { padding: 12px 16px !important; } .ent-scroll { padding-bottom: 180px !important; } .ent-bar { gap: 6px !important; } }
.ent-btn.primary { background: ${T.ochreBtn}; border: 0; color: #fff; box-shadow: 0 10px 28px -10px rgba(169,118,43,.7); }
.ent-btn.ghost { background: rgba(246,242,234,.06); border: 1px solid rgba(246,242,234,.18); color: ${T.cream}; }
.ent-btn:hover { filter: brightness(1.07); }
.ent-btn:active { transform: scale(.985); }
.ent-btn:focus-visible, .ent-link:focus-visible { outline: 2.5px solid ${T.cream}; outline-offset: 3px; }
.ent-btn-t { font-size: 17px; font-weight: 700; }
.ent-btn-s { font-size: 13px; opacity: .92; }
.ent-note { font-size: 12.5px; color: rgba(246,242,234,.82); text-align: center; }
.ent-link { background: none; border: 0; color: rgba(246,242,234,.82); font-size: 13.5px; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: 6px; font-family: 'Hanken Grotesk', sans-serif; }
.rise { animation: rise .6s cubic-bezier(.2,.8,.2,1) both; }

/* ---------- Dentro l'app — "notte e ocra": riquadri arrotondati, numeri grandi, accenti ocra ---------- */
.home { flex: 1; min-height: 0; overflow-y: auto; background: ${T.paper}; }
.home-hero { padding: 18px 20px 0; color: ${T.ink}; }
.home-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.home-sub { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: ${T.stone}; margin-top: 2px; }
.kicker { font-size: 13px; font-weight: 600; color: ${T.stone}; }
.glass-ic { position: relative; width: 44px; height: 44px; border-radius: 14px; background: ${T.card}; border: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${T.ink}; }
.glass-dot { position: absolute; top: 11px; right: 12px; width: 8px; height: 8px; border-radius: 50%; background: ${T.ochreLight}; box-shadow: 0 0 0 2px ${T.card}; }
.home-h { font-family: 'Hanken Grotesk', sans-serif; font-weight: 800; font-size: clamp(28px, 8.6vw, 34px); line-height: 1.04; letter-spacing: -1.3px; margin: 6px 0 20px; text-wrap: balance; }
.home-h em { font-style: normal; background: linear-gradient(90deg, ${T.ochreLight}, #F0CF95); -webkit-background-clip: text; background-clip: text; color: transparent; }
.home-search, .home-cta { width: 100%; display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 16px; border-radius: 16px; font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; cursor: pointer; text-align: left; }
.home-search { background: ${T.card}; border: 1px solid ${T.line}; color: ${T.stone}; }
.home-search:active { background: ${T.pineSoft}; }
.home-cta { background: ${T.ochreBtn}; border: 0; color: #fff; font-weight: 700; }
.home-cta span { flex: 1; }
.home-body { padding: 0 0 32px; }
.cats { display: flex; gap: 8px; overflow-x: auto; padding: 14px 20px 0; scrollbar-width: none; }
.cats::-webkit-scrollbar { display: none; }
.cat2 { flex-shrink: 0; min-height: 44px; padding: 0 14px; border-radius: 12px; background: ${T.card}; border: 1px solid ${T.line}; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; font-size: 14px; font-weight: 600; color: ${T.ink2}; white-space: nowrap; }
.cat2:active { background: ${T.pineSoft}; }
/* griglia a riquadri */
.bento { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px 20px 0; }
.tl { position: relative; overflow: hidden; min-height: 112px; border-radius: 20px; background: ${T.card}; padding: 14px; border: 0; text-align: left; cursor: pointer; color: ${T.ink}; font-family: 'Hanken Grotesk', sans-serif; display: flex; flex-direction: column; }
.tl:active { filter: brightness(1.12); }
.tl small { font-size: 12.5px; color: ${T.stone}; font-weight: 600; }
.tl .big { font-family: 'Space Mono', monospace; font-weight: 700; font-size: 34px; letter-spacing: -2px; line-height: 1; margin-top: auto; padding-top: 10px; }
.tl .sub { font-size: 12.5px; color: ${T.stone}; margin-top: 4px; }
.tl.ida { background: linear-gradient(150deg, #23493F, #16332D); }
.tl.ida .big { color: ${T.ochreLight}; }
.tl.ida small, .tl.ida .sub { color: rgba(246,242,234,.75); }
.tl.map { grid-row: span 2; padding: 0; min-height: 234px; }
.tl.map svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.tl.map .lbl { position: absolute; left: 14px; right: 14px; bottom: 14px; }
.tl.map .lbl b { display: block; font-size: 26px; font-weight: 800; letter-spacing: -.6px; }
.tl.next { grid-column: span 2; flex-direction: row; align-items: center; gap: 14px; min-height: 0; background: ${T.ochreLight}; color: #1C1408; }
.tl.next .tm { font-family: 'Space Mono', monospace; font-weight: 700; font-size: 26px; letter-spacing: -1px; }
.tl.next div { flex: 1; font-size: 15px; font-weight: 700; min-width: 0; }
.tl.next div small { display: block; font-weight: 600; color: rgba(28,20,8,.75); }
.ticker { display: flex; align-items: center; gap: 8px; margin: 16px 20px 0; font-size: 13px; color: ${T.ink2}; min-height: 18px; white-space: nowrap; overflow: hidden; }
.ticker > span:last-child { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.scorri { scrollbar-width: none; } .scorri::-webkit-scrollbar { display: none; }
.ticker-tag { white-space: nowrap; font-family: 'Space Mono', monospace; font-size: 10.5px; font-weight: 400; letter-spacing: 1px; color: ${T.stone}; border: 1px solid ${T.faint}; border-radius: 5px; padding: 1px 5px; flex-shrink: 0; }
.sec-h { display: flex; justify-content: space-between; align-items: baseline; margin: 28px 20px 10px; }
.sec-h h2 { font-family: 'Hanken Grotesk', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -.5px; color: ${T.ink}; margin: 0; }
.link { background: none; border: 0; color: ${T.ochreLight}; font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; }
.campo input:focus-visible { outline: none !important; }
/* persone come riquadri */
.wlist { display: flex; flex-direction: column; gap: 10px; margin: 0 20px; }
.wcard { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; gap: 2px 14px; align-items: center; width: 100%; text-align: left; background: ${T.card}; border: 0; border-radius: 20px; padding: 14px; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; color: ${T.ink}; animation: rise .45s cubic-bezier(.2,.8,.2,1) both; }
.wcard:active { filter: brightness(1.12); }
.wcard.solo { grid-template-columns: minmax(0, 1fr) auto; }
.wcard-b { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.wcard-n { display: flex; align-items: center; gap: 7px; font-size: 16px; font-weight: 700; color: ${T.ink}; line-height: 1.25; }
.wcard-av { width: 7px; height: 7px; border-radius: 50%; background: ${T.ok}; flex-shrink: 0; }
.wcard-bio { font-size: 13px; color: ${T.stone}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wcard-q { font-size: 13.5px; line-height: 1.45; color: ${T.ink2}; margin-top: 6px; }
.wcard-q span { color: ${T.stone}; }
.wcard-tags { grid-column: 2 / 4; display: flex; flex-wrap: wrap; gap: 4px 8px; margin-top: 8px; }
.wcard.solo .wcard-tags { grid-column: 1 / 3; }
.wcard-tags > span { font-size: 12px; font-weight: 600; color: ${T.ink2}; background: ${T.pineSoft}; border-radius: 8px; padding: 3px 8px; white-space: nowrap; }
.wcard-tags b { color: ${T.ink}; }
.wcard-tags .no { color: ${T.ember}; background: ${T.emberSoft}; }
.tag { font-size: 12px; font-weight: 600; color: ${T.ink2}; white-space: nowrap; }
.wcard-r { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; line-height: 1; text-align: right; }
.ida-n { font-family: 'Space Mono', monospace; font-weight: 700; font-size: 24px; letter-spacing: -1px; color: ${T.ochreLight}; }
.ida-n.top { color: ${T.ochreLight}; }
.ida-n.nuovo { font-size: 11px; letter-spacing: 1px; color: ${T.ochreLight}; border: 1.5px solid ${T.ochre}; border-radius: 6px; padding: 3px 6px; }
.ida-lab { font-size: 11px; font-weight: 600; color: ${T.stone}; margin-top: 3px; }
.ida-card { display: block; width: calc(100% - 40px); margin: 22px 20px 0; padding: 18px; border: 0; border-radius: 20px; text-align: left; cursor: pointer; background: linear-gradient(150deg, #23493F, #16332D); color: rgba(246,242,234,.8); font-family: 'Hanken Grotesk', sans-serif; font-size: 14px; line-height: 1.5; }
.ida-t { font-size: 16px; font-weight: 800; color: ${T.cream}; }
.ida-l { display: inline-block; margin-top: 8px; font-size: 14px; font-weight: 700; color: ${T.ochreLight}; }
.tiles { list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 10px 20px 0; padding: 0; }
.tile { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; width: 100%; min-height: 92px; padding: 14px 12px; background: ${T.card}; border: 0; border-radius: 18px; cursor: pointer; text-align: left; font-family: 'Hanken Grotesk', sans-serif; color: ${T.ink}; }
.tile:active { filter: brightness(1.12); }
.tile svg { margin-bottom: auto; color: ${T.ochreLight}; }
.tile-l { font-size: 14px; font-weight: 700; margin-top: 10px; }
.tile-s { font-size: 12.5px; color: ${T.stone}; line-height: 1.3; }

.head { position: sticky; top: 0; z-index: 6; display: flex; align-items: center; gap: 12px; padding: 14px 20px 12px; background: ${T.paper}; }
.head-root { padding-top: 22px; }
.head-root .head-t { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
.head-back { width: 44px; height: 44px; border-radius: 14px; border: 0; background: ${T.card}; color: ${T.ink}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.head-t { font-family: 'Hanken Grotesk', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -.5px; color: ${T.ink}; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* barra in basso: icone su sfumatura, la voce attiva in un riquadro */
.dock-wrap { background: ${T.paper}; padding: 6px 12px calc(10px + env(safe-area-inset-bottom, 0px)); flex-shrink: 0; border-top: 1px solid ${T.line}; }
.dock { display: flex; align-items: center; justify-content: space-around; gap: 4px; }
.dock-i, .dock-plus { flex: 1; max-width: 72px; min-height: 52px; border: 0; border-radius: 16px; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; color: ${T.stone}; }
.dock-i span, .dock-plus > span:last-child { font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.dock-i.on { color: ${T.ink}; background: ${T.card}; }
.dock-plus { color: ${T.ochreLight}; }
.dock-plus-i { width: 34px; height: 26px; border-radius: 9px; background: ${T.ochreLight}; color: #1C1408; display: flex; align-items: center; justify-content: center; }
.next-card { display: flex; align-items: center; gap: 12px; width: calc(100% - 40px); margin: 14px 20px 0; padding: 14px 16px; border-radius: 18px; border: 0; background: ${T.ochreLight}; text-align: left; cursor: pointer; font-family: inherit; color: #1C1408; }
.next-t { display: block; font-size: 12px; font-weight: 700; color: rgba(28,20,8,.75); text-transform: uppercase; letter-spacing: .5px; }
.next-s { display: block; font-size: 15px; font-weight: 700; color: #1C1408; margin-top: 2px; }
.dock-i:focus-visible, .dock-plus:focus-visible, .wcard:focus-visible, .cat2:focus-visible, .tile:focus-visible, .head-back:focus-visible, .ida-card:focus-visible, .tl:focus-visible, .lrow:focus-visible, .next-card:focus-visible { outline: 2.5px solid ${T.ochreLight}; outline-offset: 2px; }

/* cerca: righe-riquadro con colonne ordinabili */
.ledger-h { display: grid; grid-template-columns: minmax(0, 1fr) 52px 48px 48px; gap: 8px; padding: 0 34px; position: sticky; top: 0; background: ${T.paper}; z-index: 2; }
.ledger-h > span, .ledger-h button { font-size: 12px; font-weight: 600; color: ${T.stone}; min-height: 44px; display: flex; align-items: center; }
.ledger-h button { justify-content: flex-end; background: none; border: 0; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; }
.ledger-h button[aria-pressed="true"] { color: ${T.ochreLight}; font-weight: 800; }
.lrow { display: grid; grid-template-columns: minmax(0, 1fr) 52px 48px 48px; gap: 8px; align-items: center; width: calc(100% - 40px); margin: 0 20px 8px; min-height: 66px; padding: 10px 14px; background: ${T.card}; border: 0; border-radius: 18px; text-align: left; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; color: ${T.ink}; }
.lrow:active { filter: brightness(1.12); }
.lrow > span:not(:first-child) { text-align: right; font-family: 'Space Mono', monospace; font-size: 14px; }
.lrow-n { display: flex; align-items: center; gap: 6px; font-size: 15.5px; font-weight: 700; }
.lrow-s { display: block; font-size: 12.5px; color: ${T.stone}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lrow .lrow-ida { font-weight: 700; font-size: 18px !important; color: ${T.ochreLight}; }
.lrow.off { opacity: .6; }
.fchip { flex-shrink: 0; min-height: 44px; padding: 0 14px; border-radius: 12px; border: 1px solid ${T.line}; background: ${T.card}; font-size: 14px; font-weight: 600; color: ${T.ink2}; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; white-space: nowrap; }
.fchip[aria-pressed="true"] { background: ${T.ochreLight}; border-color: ${T.ochreLight}; color: #1C1408; }

/* profilo di chi lavora */
.pro-k { font-size: 13px; font-weight: 700; color: ${T.ochreLight}; }
.pro-h { font-family: 'Hanken Grotesk', sans-serif; font-weight: 800; font-size: 34px; letter-spacing: -1.3px; line-height: 1.05; color: ${T.ink}; margin: 6px 0 0; }
.facts { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 14px; font-size: 14px; color: ${T.ink2}; }
.facts > span { display: inline-flex; align-items: center; gap: 6px; }
.slot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; padding: 14px 16px; border-radius: 18px; background: ${T.ochreLight}; font-size: 14px; font-weight: 600; color: rgba(28,20,8,.8); }
.slot b { font-family: 'Space Mono', monospace; font-size: 15px; color: #1C1408; white-space: nowrap; }
.slot.no { background: ${T.card}; color: ${T.ink2}; } .slot.no b { color: ${T.ochreLight}; }
.ida-block { margin-top: 12px; border-radius: 20px; padding: 18px; background: linear-gradient(150deg, #23493F, #16332D); }
.ida-hero { display: flex; align-items: flex-end; gap: 14px; }
.ida-hero > b { font-family: 'Space Mono', monospace; font-size: 56px; line-height: .85; letter-spacing: -4px; color: ${T.ochreLight}; }
.ida-hero > b.nuovo { font-size: 18px; letter-spacing: 1px; border: 2px solid ${T.ochreLight}; border-radius: 8px; padding: 6px 8px; line-height: 1; }
.ida-hero strong { display: block; font-size: 17px; font-weight: 800; color: ${T.cream}; }
.ida-hero small { font-size: 13.5px; color: rgba(246,242,234,.78); }
.voci { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; font-size: 12px; color: rgba(246,242,234,.85); }
.voci li { background: rgba(246,242,234,.08); border-radius: 8px; padding: 4px 8px; }
.voci b { font-family: 'Space Mono', monospace; font-weight: 700; color: ${T.cream}; }
.trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
.trio > div { padding: 14px 6px; text-align: center; background: ${T.card}; border-radius: 16px; }
.trio b { display: block; font-family: 'Space Mono', monospace; font-size: 17px; color: ${T.ink}; white-space: nowrap; }
.trio small { font-size: 12px; color: ${T.stone}; }
.rev { background: ${T.card}; border-radius: 18px; padding: 16px !important; margin-top: 10px; border: 0 !important; }
.rev q { display: block; font-size: 15.5px; line-height: 1.5; color: ${T.ink}; quotes: "“" "”"; }
.rev-f { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 8px; font-size: 12.5px; color: ${T.stone}; }
.rev-f b { font-family: 'Space Mono', monospace; font-size: 14px; color: ${T.ochreLight}; margin-right: 6px; }

/* bacheca */
.seg { display: flex; gap: 8px; margin: 0 20px; }
.seg button { min-height: 44px; padding: 0 14px; border-radius: 12px; background: ${T.card}; border: 1px solid ${T.line}; font-size: 14px; font-weight: 600; color: ${T.ink2}; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; }
.seg button[aria-pressed="true"] { background: ${T.ochreLight}; border-color: ${T.ochreLight}; color: #1C1408; }
.post { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0; padding: 16px; margin-bottom: 10px; background: ${T.card}; border-radius: 20px; animation: rise .45s cubic-bezier(.2,.8,.2,1) both; position: relative; }
.post-t { position: absolute; top: 16px; right: 16px; font-family: 'Space Mono', monospace; font-size: 11.5px; color: ${T.stone}; }
.post-k { font-size: 12px; font-weight: 700; color: ${T.ochreLight}; padding-right: 70px; }
.post-k.job { color: ${T.accent}; }
.post-x { font-size: 15.5px; line-height: 1.45; color: ${T.ink}; margin-top: 6px; }
.post-by { font-size: 12.5px; color: ${T.stone}; margin-top: 6px; }
.post-a { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
.post-a .rispondi { min-height: 44px; padding: 0 16px; border-radius: 12px; border: 0; background: ${T.ochreLight}; font-size: 14px; font-weight: 700; color: #1C1408; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; }
.post-a .n { font-size: 12.5px; font-weight: 600; color: ${T.ink2}; }
.post-a .segn { margin-left: auto; font-size: 12.5px; color: ${T.stone}; }
.post.mine { box-shadow: inset 0 0 0 1.5px ${T.ochre}; }

/* ---------- movimento: leggero, una volta sola o lento, spento con "riduci movimento" ---------- */
.bento .tl { animation: rise .5s cubic-bezier(.2,.8,.2,1) both; }
.bento .tl:nth-child(2) { animation-delay: .06s; } .bento .tl:nth-child(3) { animation-delay: .12s; } .bento .tl:nth-child(4) { animation-delay: .18s; } .bento .tl:nth-child(5) { animation-delay: .24s; }
.tiles li { animation: rise .5s cubic-bezier(.2,.8,.2,1) both; } .tiles li:nth-child(2) { animation-delay: .06s; } .tiles li:nth-child(3) { animation-delay: .12s; }
.lrow { animation: rise .45s cubic-bezier(.2,.8,.2,1) both; }
.voci li { animation: rise .4s cubic-bezier(.2,.8,.2,1) both; }
.trio > div, .rev { animation: rise .5s cubic-bezier(.2,.8,.2,1) both; }
.trio > div:nth-child(2) { animation-delay: .05s; } .trio > div:nth-child(3) { animation-delay: .1s; }
.ida-block { animation: rise .5s cubic-bezier(.2,.8,.2,1) both; }
/* riflesso che passa sul prossimo appuntamento */
.tl.next::after, .slot::after { content: ""; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.45) 50%, transparent 65%); transform: translateX(-100%); animation: riflesso 5s ease-in-out 1.2s infinite; pointer-events: none; }
.slot { position: relative; overflow: hidden; }
@keyframes riflesso { 0% { transform: translateX(-100%); } 22%, 100% { transform: translateX(100%); } }
/* titolo con l'ocra che scorre */
.home-h em { background-size: 200% 100%; background-image: linear-gradient(90deg, ${T.ochreLight}, #F6DDA9, ${T.ochreLight}); animation: scorre 6s ease-in-out infinite; }
@keyframes scorre { 0%, 100% { background-position: 0% 0; } 50% { background-position: 100% 0; } }
/* chi è disponibile "respira" */
.wcard-av, .lrow-n .wcard-av { animation: respira 2.4s ease-in-out infinite; }
@keyframes respira { 0%, 100% { box-shadow: 0 0 0 0 rgba(79,209,160,.55); } 60% { box-shadow: 0 0 0 6px rgba(79,209,160,0); } }
/* mappa */
.tl.map .giro { transform-box: fill-box; transform-origin: center; animation: spin 24s linear infinite; }
.tl.map .onda { transform-box: fill-box; transform-origin: center; animation: onda 2.6s ease-out infinite; opacity: 0; }
.tl.map .pop { transform-box: fill-box; transform-origin: center; animation: pop .45s cubic-bezier(.2,1.5,.5,1) both; }
@keyframes onda { 0% { transform: scale(.4); opacity: .8; } 100% { transform: scale(1.6); opacity: 0; } }
@keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }
/* barra in basso: piccolo rimbalzo della voce attiva */
.dock-i { transition: background .25s, color .25s; }
.dock-i.on svg { animation: pop .4s cubic-bezier(.2,1.6,.5,1); }
.dock-plus:active .dock-plus-i { transform: scale(.9); }
.dock-plus-i { transition: transform .15s; }
/* pulsante premuto */
.tl, .wcard, .lrow, .tile, .post-a .rispondi, .fchip, .cat2, .seg button { transition: transform .15s, filter .15s, background .2s; }
.tl:active, .wcard:active, .lrow:active, .tile:active { transform: scale(.98); }

.onb-visual { display: flex; justify-content: center; align-items: center; min-height: 230px; margin: 18px 0 8px; animation: rise .5s cubic-bezier(.2,.8,.2,1) both; }
.onb-glyph { width: 150px; height: 150px; border-radius: 44px; background: rgba(169,118,43,.12); border: 1px solid rgba(169,118,43,.28); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 80px -10px rgba(169,118,43,.35); }
.onb-eye { font-size: 12.5px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: ${T.ochreLight}; margin-bottom: 10px; }
.onb-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px; }
.onb-chips span { font-size: 12.5px; font-weight: 600; padding: 6px 11px; border-radius: 10px; border: 1px solid rgba(246,242,234,.16); color: rgba(246,242,234,.85); }
.onb-dots { display: flex; gap: 7px; flex: 1; }
.onb-dots button { height: 8px; width: 8px; border-radius: 4px; border: 0; padding: 0; background: rgba(246,242,234,.25); cursor: pointer; transition: width .3s, background .3s; }
.onb-dots button.on { width: 26px; background: ${T.ochre}; }

@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes glow { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes mq { to { transform: translateX(-50%); } }
@keyframes barin { from { transform: translateY(100%); } to { transform: none; } }
@media (prefers-reduced-motion: reduce) { .seal-draw { stroke-dashoffset: 0 !important; } .mq-track { flex-wrap: wrap; width: auto; } }
`;

const TAB_SC = ["home", "search", "post", "neighborhood", "account", "entrata"];
/* ---- Salvataggio nel browser: ricaricando la pagina si riprende da dove si era rimasti ---- */
const CHIAVE_SALVATAGGIO = "taskease-anteprima-v1";
const leggiSalvato = () => {
  try { const x = JSON.parse(localStorage.getItem(CHIAVE_SALVATAGGIO)); return x && x.v === 1 ? x : null; } catch (e) { return null; }
};
const scriviSalvato = (x) => { try { localStorage.setItem(CHIAVE_SALVATAGGIO, JSON.stringify({ v: 1, ...x })); } catch (e) {} };
const cancellaSalvato = () => { try { localStorage.removeItem(CHIAVE_SALVATAGGIO); } catch (e) {} };
const SALVATO = typeof window !== "undefined" ? leggiSalvato() : null;
if (SALVATO?.me) Object.assign(ME, SALVATO.me);
if (SALVATO?.bozzaProfilo) Object.assign(BOZZA_PROFILO, SALVATO.bozzaProfilo);
const schermataIniziale = () => {
  if (typeof location !== "undefined" && location.hash === "#qr") return "intro-worker";
  if (SALVATO && !SALVATO.uscito && (SALVATO.profilo || SALVATO.setupDone)) return SALVATO.role === "worker" && SALVATO.setupDone ? "account" : "home";
  return "entrata";
};
const da = (k, base) => () => (SALVATO && SALVATO[k] !== undefined ? SALVATO[k] : (typeof base === "function" ? base() : base));

export default function App() {
  const [sc, setSc] = useState(schermataIniziale);
  const [dt, setDt] = useState(null);
  const [pv, setPv] = useState("home");
  const [k, setK] = useState(0);
  const [role, setRole] = useState(da("role", "client"));
  const [saved, setSaved] = useState(da("saved", []));
  const [prenotazioni, setPrenotazioni] = useState(da("prenotazioni", []));   // quelle fatte davvero (restano dopo un ricaricamento)
  const [posts, setPosts] = useState(da("posts", () => POSTS.map((p, i) => ({ ...p, id: "demo" + i, demo: true }))));
  const [reqs, setReqs] = useState(da("reqs", makeRequests));                   // richieste in arrivo al professionista
  const [avail, setAvail] = useState(da("avail", true));                         // disponibilità: resta com'era anche cambiando schermata
  const [agenda, setAgenda] = useState(da("agenda", AGENDA));
  const [notifViste, setNotifViste] = useState(da("notifViste", []));                // id delle notifiche già viste
  const [setupDone, setSetupDone] = useState(da("setupDone", false));
  const [verified, setVerified] = useState(da("verified", false));
  const [paused, setPaused] = useState(da("paused", false));
  const [profilo, setProfilo] = useState(da("profilo", null));
  const [blocked, setBlocked] = useState(da("blocked", []));       // persone bloccate
  const [uscito, setUscito] = useState(da("uscito", false));      // dopo "Esci" si rientra con Accedi + codice
  const [foglio, setFoglio] = useState(null);       // documento legale aperto sopra la schermata
  const [giudizi, setGiudizi] = useState(da("giudizi", []));
  const [bozze, setBozze] = useState(da("bozze", {}));            // prenotazioni iniziate e non inviate, per persona       // giudizi lasciati (per "Scarica i miei dati")
  const [segnalazioni, setSegnalazioni] = useState(da("segnalazioni", []));
  const [consensi, setConsensi] = useState(da("consensi", []));     // quando ha accettato Termini e privacy, e quale versione
  const segnaConsenso = () => setConsensi(c => c.some(x => x.versione === LEGALE_VERS && x.data === dataLocale()) ? c : [...c, { documento: "Termini d'uso e informativa privacy", versione: LEGALE_VERS, data: dataLocale() }]);
  legale.apri = setFoglio;
  const [toast, setToast] = useState(null);
  const toastT = useRef(null);
  avviso.mostra = (msg) => { clearTimeout(toastT.current); setToast({ msg, id: Date.now() }); toastT.current = setTimeout(() => setToast(null), Math.max(2800, String(msg).length * 60)); };
  // Scudo anti doppio tocco: per un attimo dopo il cambio schermata i tocchi non passano
  useEffect(() => { setScudo(true); const t = setTimeout(() => setScudo(false), 350); return () => clearTimeout(t); }, [k]);
  useEffect(() => { setToast(t => t && Date.now() - t.id > 900 ? null : t); }, [k]);
  const setProfiloIn = (p) => { if (!profilo) segnaConsenso(); setProfilo({ ...p, daCliente: true }); setUscito(false); };
  const resetAll = useCallback((dopo) => {
    cancellaSalvato();
    Object.keys(BOZZA_PROFILO).forEach(x => delete BOZZA_PROFILO[x]);
    Object.assign(ME, ME_BASE, { sk: [...ME_BASE.sk] }); delete ME.zone; delete ME.nascita; delete ME.residenza; delete ME.cf; delete ME.preventivo; delete ME.bio;
    setBlocked([]); setUscito(false); setFoglio(null); setGiudizi([]); setSegnalazioni([]); setConsensi([]); setBozze({});
    setRole("client"); setSaved([]); setSetupDone(false); setVerified(false); setPaused(false); setProfilo(null);
    setPrenotazioni([]); setPosts(POSTS.map((p, i) => ({ ...p, id: "demo" + i, demo: true }))); setReqs(makeRequests()); setAgenda(AGENDA); setNotifViste([]); setAvail(true);
    stackRef.current = []; setDt(null); setSc(typeof dopo === "string" ? dopo : "entrata"); setK(x => x + 1);
  }, []);
  // Pila di navigazione: "indietro" torna alla schermata precedente CON i suoi dati.
  // Le schermate delle tab azzerano la pila (sono punti di partenza).
  const [scudo, setScudo] = useState(false); // anti doppio tocco: acceso insieme al cambio schermata
  const stackRef = useRef([]);
  const nav = useCallback((s, d = null) => {
    if (TAB_SC.includes(s)) stackRef.current = [];
    else if (s !== sc || d !== dt) stackRef.current = [...stackRef.current, { sc, dt }].slice(-30); // anche tra due pagine dello stesso tipo
    setScudo(true); setPv(sc); setSc(s); setDt(d); setK(x => x + 1);
  }, [sc, dt]);
  // Come nav, ma la schermata attuale non resta nella pila (es. esito di una prenotazione: indietro non deve riaprire il modulo)
  nav.replace = (s, d = null) => { setScudo(true); setPv(sc); setSc(s); setDt(d); setK(x => x + 1); };
  // Aggiorna i dati della schermata attuale senza cambiarla (es. testo cercato), così "indietro" li ritrova
  nav.save = (d) => setDt(d);
  nav.back = (fallback = "home", fbData = null) => {
    const st = stackRef.current;
    const top = st.length ? st[st.length - 1] : null;
    stackRef.current = st.slice(0, -1);
    setScudo(true); setPv(sc); setSc(top ? top.sc : fallback); setDt(top ? top.dt : fbData); setK(x => x + 1);
  };
  // Indietro del telefono: chiude il foglio aperto o torna alla schermata prima, invece di uscire dall'app
  const backRef = useRef(null);
  backRef.current = () => {
    if (foglio) { setFoglio(null); return true; }
    const sotto = sottoIndietro.f[sottoIndietro.f.length - 1];
    if (sotto && sotto()) return true;
    if (sc === "home" || sc === "entrata") return false;
    if (stackRef.current.length) { nav.back(); return true; }
    if (TAB_SC.includes(sc)) { nav("home"); return true; } // anche chi guarda senza profilo è passato dalla home
    nav.back(profilo || setupDone ? "home" : "entrata"); return true;
  };
  useEffect(() => {
    if (sc !== "account" || !dt?.ruolo) return;
    if (dt.ruolo !== role && (dt.ruolo !== "worker" || setupDone)) setRole(dt.ruolo);
    const { ruolo, ...resto } = dt; setDt(Object.keys(resto).length ? resto : null);
  }, [k]);
  const arma = () => { try { if (!history.state?.te) history.pushState({ te: 1 }, ""); } catch (e) {} };
  useEffect(() => {
    if (typeof window === "undefined" || !window.history?.pushState) return;
    arma();
    const onPop = () => { if (backRef.current?.()) arma(); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // dopo essere tornati in home con "indietro", la protezione si riarma alla prima schermata nuova
  useEffect(() => { if (typeof window !== "undefined" && window.history?.pushState && sc !== "home" && sc !== "entrata") arma(); }, [k]);
  // Salva a ogni cambiamento (e a ogni cambio schermata, perché ME cambia senza passare dallo stato)
  useEffect(() => {
    scriviSalvato({ role, saved, prenotazioni, posts, reqs, avail, agenda, notifViste, setupDone, verified, paused, profilo, blocked, uscito, giudizi, bozze, segnalazioni, consensi, me: { ...ME }, bozzaProfilo: { ...BOZZA_PROFILO } });
  }, [k, role, saved, prenotazioni, posts, reqs, avail, agenda, notifViste, setupDone, verified, paused, profilo, blocked, uscito, giudizi, bozze, segnalazioni, consensi]);
  useEffect(() => { if (SALVATO && (SALVATO.profilo || SALVATO.setupDone)) avviso.mostra("Ripreso da dove eri rimasto. Per ripartire da zero: Profilo → Ricomincia l'anteprima."); }, []);
  const choose = useCallback((r) => {
    setRole(r);
    // Chi rientra dopo "Esci" con un profilo già fatto non rivede la presentazione
    // Chi ha già un profilo ed è uscito rientra con il codice
    if ((profilo || setupDone) && uscito) { stackRef.current = [{ sc, dt: null }]; setDt({ r, motivo: "Su questo telefono c'è già un profilo: accedi con il codice che ti mandiamo via SMS." }); setSc("login"); }
    else if (r === "client" && profilo) { stackRef.current = []; setSc("home"); }
    else if (r === "worker" && setupDone) { stackRef.current = []; setSc("account"); }
    else { stackRef.current = [{ sc, dt: null }]; setSc("onboarding"); } // indietro dalla registrazione torna da dove sei entrato (anche dal QR)
    setK(x => x + 1);
  }, [sc, profilo, setupDone, uscito]);
  const finishOnb = useCallback(() => {
    if (role === "worker" && !setupDone) { setSc("setup"); }
    else if (role === "client" && !profilo) { setDt({ onb: true }); setSc("csetup"); }
    else { setSc(role === "worker" ? "account" : "home"); }
    setK(x => x + 1);
  }, [role, setupDone, profilo]);
  const finishSetup = useCallback((v, d) => {
    // Quello scelto nella registrazione diventa il profilo vero (nome, tariffa, competenze, zone)
    if (d) Object.assign(ME, { n: d.nome, ini: iniOf(d.nome), pr: d.pr, sk: d.sk.length ? d.sk : ME.sk, zona: d.zone[0] || ME.zona, zone: d.zone, since: "oggi", tipo: d.tipo, piva: d.piva, abil: d.abil, rc: d.rc, foto: d.foto, nascita: d.nascita, residenza: d.residenza, cf: d.cf, preventivo: d.preventivo, bio: d.bio });
    setUscito(false); segnaConsenso();
    setProfilo(p => ({ ...(p || {}), nome: d?.nome || p?.nome || ME.n, tel: d?.tel || p?.tel || "", zona: p?.zona || d?.zone?.[0] || ME.zona }));
    setSetupDone(true); setVerified(!!v); setRole("worker"); stackRef.current = []; setSc("account"); setK(x => x + 1);
  }, []);
  // "Sto lavorando" senza registrazione da professionista: prima la registrazione (CF, dichiarazione fiscale)
  const switchRole = (r) => { if (r === "worker" && !setupDone) nav("setup"); else setRole(r); };
  const onBooked = useCallback((b) => setPrenotazioni(ps => [b, ...ps]), []);
  const onPosted = useCallback((p) => setPosts(ps => [p, ...ps]), []);
  // Notifiche generate da quello che è successo davvero, non una lista finta uguale per tutti
  // Richieste per le competenze dichiarate (se nessuna combacia, gli esempi restano tutti visibili)
  const reqsOra = reqs.map(aggiornaRichiesta);
  const inZona = (r) => !ME.zone || !ME.zone.length || ME.zone.includes(r.zona) || ME.zone.includes("Altra zona di Forlì");
  // Prima competenze + zone; se non c'è niente, solo competenze (detto); solo come ultima scelta tutti gli esempi
  const perSkill = reqsOra.filter(r => (r.cat || []).some(c => ME.sk.includes(c)));
  const perZona = perSkill.filter(inZona);
  const modoEsempi = perZona.length ? null : perSkill.length ? "fuorizona" : "tutti";
  const reqsVis = perZona.length ? perZona : perSkill.length ? perSkill : reqsOra;
  const notifs = [
    ...prenotazioni.filter(b => b.stato === "confermata").map(b => ({ id: "b" + b.id, ic: "check", t: `${wById(b.wid).n.split(" ")[0]} ha confermato: ${giornoDi(b).toLowerCase()} alle ${b.time}.`, when: b.quando, go: ["chat", { ...wById(b.wid), tema: b.task, quando: `${giornoDi(b).toLowerCase()} alle ${b.time}` }] })),
    ...prenotazioni.filter(b => b.stato === "disdetta").map(b => ({ id: "d" + b.id, ic: "x", t: `Hai disdetto con ${wById(b.wid).n.split(" ")[0]} (${giornoDi(b).toLowerCase()} alle ${b.time}). L'abbiamo avvisato.`, when: "adesso", go: ["account", { ruolo: "client" }] })),
    ...prenotazioni.filter(b => b.stato === "segnalata").map(b => ({ id: "s" + b.id, ic: "shield", t: `Segnalazione su ${wById(b.wid).n.split(" ")[0]} ricevuta: ti rispondiamo entro 48 ore.`, when: "adesso", go: ["account", { ruolo: "client" }] })),
    ...(role === "worker" && setupDone && !paused && avail && reqsVis.length ? [{ id: "reqs", ic: "bolt", t: `${reqsVis.length} ${reqsVis.length === 1 ? "richiesta" : "richieste"} in zona ${reqsVis.length === 1 ? "aspetta" : "aspettano"} una risposta.`, when: "adesso", go: ["account"] }] : []),
    ...(setupDone ? [{ id: "setup", ic: "seal", t: `Profilo creato. Il tuo IDA compare dopo ${IDA_MIN_LAVORI} lavori giudicati.`, when: "oggi", go: ["dashboard"] }] : []),
  ];
  const nuove = notifs.some(n => !notifViste.includes(n.id));
  const toggleSave = useCallback((id) => { const c = saved.includes(id); setSaved(s => c ? s.filter(x => x !== id) : (s.includes(id) ? s : [...s, id])); avviso.mostra(c ? "Tolto dai preferiti." : role === "worker" ? "Aggiunto ai preferiti: lo trovi in Profilo › Sto cercando aiuto." : "Aggiunto ai preferiti: lo trovi in Profilo."); }, [saved, role]);
  const showTabs = ["home", "search", "post", "neighborhood", "account"].includes(sc);
  const dark = sc === "entrata" || sc === "intro-worker" || sc === "onboarding";
  // Su un telefono vero l'app occupa lo schermo: niente cornice né orologio finti
  const mq = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(max-width: 520px)") : null;
  const [phone, setPhone] = useState(() => !!mq?.matches);
  useEffect(() => {
    if (!mq) return;
    const f = (e) => setPhone(e.matches);
    mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", f) : mq.removeListener(f); };
  }, []);

  const outer = phone
    ? { height: "100%", background: dark ? T.pineDeep : T.paper, fontFamily: "'Hanken Grotesk',sans-serif" }
    : { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100%", background: "#E4DFD4", fontFamily: "'Hanken Grotesk',sans-serif", padding: 12, boxSizing: "border-box" };
  const frame = phone
    ? { width: "100%", height: "100%", overflow: "hidden", background: dark ? T.pineDeep : T.paper, position: "relative" }
    : { width: 384, maxWidth: "100%", height: "min(760px, calc(100dvh - 24px))", borderRadius: 46, overflow: "hidden", background: dark ? T.pineDeep : T.paper, position: "relative", boxShadow: "0 1px 0 1px rgba(28,27,24,.04), 0 40px 80px -20px rgba(28,27,24,.35)", border: `7px solid ${T.ink}` };

  return (
    <div style={outer}>
      <style>{STYLE}</style>
      <div style={frame}>
        {/* barra di stato finta, solo nella cornice da computer */}
        {!phone && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, padding: "12px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "center", color: dark ? T.cream : T.ink }}>
            <Mono size={12} color={dark ? T.cream : T.ink} w={700}>{new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</Mono>
            <div style={{ display: "flex", gap: 4, alignItems: "center", opacity: .8 }}>
              <Icon name="message" size={13} color={dark ? T.cream : T.ink} />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>5G</span>
            </div>
          </div>
        )}

        <div key={k} style={{ display: "flex", flexDirection: "column", height: "100%", paddingTop: phone ? 0 : 40, animation: "fade .25s ease" }}>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {sc === "entrata" && <Entrata onChoose={choose} onLogin={() => nav("login")} />}
            {sc === "intro-worker" && <IntroWorker onWorker={() => choose("worker")} onOther={() => nav("entrata")} onLogin={() => nav("login")} />}
            {sc === "onboarding" && <Onboarding role={role} allaFine={!!dt?.fine} onDone={finishOnb} onBack={() => nav.back("entrata")} />}
            {sc === "setup" && <ProviderSetup onDone={finishSetup} onLegal={setFoglio} nav={nav} initial={profilo} edit={!!dt?.edit && setupDone} onSave={d => { Object.assign(ME, { n: d.nome, ini: iniOf(d.nome), pr: d.pr, sk: d.sk, zona: d.zone[0] || ME.zona, zone: d.zone, tipo: d.tipo, piva: d.piva, abil: d.abil, rc: d.rc, foto: d.foto, preventivo: d.preventivo, bio: d.bio }); setProfilo(p => p ? { ...p, nome: d.nome } : p); }} />}
            {sc === "home" && <Home nav={nav} fermo={paused ? "pausa" : !avail ? "off" : null} role={role} profilo={profilo} blocked={blocked} prossima={prossimeDi(prenotazioni)[0]} nuove={nuove} richieste={avail && !paused ? reqsVis.length : 0} reqsHome={avail && !paused ? reqsVis : []} bacheca={posts.filter(p => p.t === "req" && !blocked.some(id => wById(id)?.n === p.a)).length} />}
            {sc === "csetup" && <ClientSetup nav={nav} onIndietro={() => { setDt({ fine: true }); setSc("onboarding"); setK(x => x + 1); }} pro={setupDone} initial={dt?.edit ? profilo : null} back={dt?.back} fromOnb={!!dt?.onb} onDone={p => { const nuovo = !profilo; setProfiloIn(p); if (setupDone) Object.assign(ME, { n: p.nome, ini: iniOf(p.nome) }); avviso.mostra(nuovo ? `Profilo pronto, ${p.nome.split(" ")[0]}.` : "Dati salvati."); nav(dt?.back || "home"); }} />}
            {sc === "search" && <Search nav={nav} init={dt} role={role} blocked={blocked} />}
            {sc === "worker" && dt && <Worker w={dt} nav={nav} from={pv} saved={saved} giaPrenotata={prossimeDi(prenotazioni).find(b => b.wid === dt.id)} mioGiudizio={giudizi.filter(g => g.su === dt.n).slice(-1)[0]} onSave={toggleSave} bloccato={blocked.includes(dt.id)} onUnblock={id => { setBlocked(b => b.filter(x => x !== id)); avviso.mostra("Sbloccato."); }} onBlock={id => { const sue = prossimeDi(prenotazioni).filter(b => b.wid === id); const conf = sue.some(b => b.stato === "confermata"); setBlocked(b => b.includes(id) ? b : [...b, id]); if (sue.length) setPrenotazioni(ps => ps.map(p => p.wid === id && ATTIVA(p) && !passata(p) ? { ...p, stato: p.stato === "in attesa" ? "annullata" : "disdetta" } : p)); avviso.mostra(`Hai bloccato ${wById(id)?.n.split(" ")[0]}.${conf ? " L'appuntamento è disdetto e l'abbiamo avvisato." : sue.length ? " La richiesta in attesa è ritirata." : ""}`); }} />}
            {sc === "booking" && dt && <Booking w={dt} nav={nav} occupati={prossimeDi(prenotazioni).filter(b => b.wid === dt.id).map(b => `${b.data} ${b.time}`)} profilo={profilo} setProfilo={setProfiloIn} onBooked={onBooked} bozza={bozze[dt.id]} onBozza={(id, b) => setBozze(v => ({ ...v, [id]: b }))} />}
            {sc === "review" && dt && <Review w={dt} nav={nav} onReviewed={(id, g) => { if (id) setPrenotazioni(ps => ps.map(p => p.id === id ? { ...p, stato: "giudicata" } : p)); if (g && !dt.esempio) setGiudizi(v => [...v, g]); }} />}
            {sc === "chat" && <Chat w={dt} nav={nav} from={pv} />}
            {sc === "dashboard" && <Dashboard nav={nav} />}
            {sc === "account" && <Account nav={nav} onRicomincia={() => resetAll()} vai={dt?.vai} role={role} setRole={switchRole} blocked={blocked} onEsci={() => { setUscito(true); nav(typeof location !== "undefined" && location.hash === "#qr" ? "intro-worker" : "entrata"); }} saved={saved} paused={paused} setPaused={setPaused} profilo={profilo} prenotazioni={prenotazioni} setPrenotazioni={setPrenotazioni} reqs={reqsVis} esempiTutti={modoEsempi} setReqs={setReqs} agenda={agenda} setAgenda={setAgenda} availOn={avail} setAvail={setAvail} verified={verified} setVerified={setVerified} />}
            {sc === "legal" && <Legal nav={nav} doc={dt?.doc} />}
            {sc === "segnala" && <SegnalaContenuto nav={nav} cosa={dt} profilo={profilo} onInviata={x => setSegnalazioni(v => [...v, x])} />}
            {sc === "assistenza" && <Assistenza nav={nav} />}
            {sc === "login" && <Login nav={nav} profilo={profilo} setupDone={setupDone} motivo={dt?.motivo} onLogin={() => {
              // Rispetta la scelta fatta all'ingresso ("Cerco" o "Offro"), se c'era
              const r = dt?.r || (setupDone ? "worker" : "client");
              setUscito(false); stackRef.current = []; setDt(null);
              if (r === "worker" && !setupDone) { setRole("client"); setSc("setup"); }
              else { setRole(r); setSc(r === "worker" ? "account" : "home"); }
              setK(x => x + 1);
            }} />}
            {sc === "dati" && <MieiDati nav={nav} dati={{
              esportato_il: dataLocale(),
              profilo_cliente: profilo ? (({ daCliente, ...p }) => p)(profilo) : null,
              profilo_professionista: setupDone ? { nome: ME.n, foto: ME.foto ? "presente" : "assente", codice_fiscale: ME.cf, tipo: ME.tipo, partita_iva: ME.piva || null, competenze: ME.sk, tariffa_oraria: ME.pr, zone: ME.zone, impresa_abilitata_dm37: ME.abil, assicurazione_rc: ME.rc, data_di_nascita: ME.nascita, residenza: ME.residenza, identita_verificata: verified, dichiarazione_fiscale: ME.tipo === "piva" ? "Lavoro con partita IVA" : "Prestazione occasionale da privato", in_pausa: paused, disponibile: avail && !paused } : null,
              prenotazioni: prenotazioni.map(b => ({ con: wById(b.wid)?.n, lavoro: b.task, quando: `${b.data || b.day} ${b.time}`, indirizzo: b.indirizzo, stato: b.stato })),
              richieste_pubblicate: posts.filter(p => p.mine).map(p => ({ testo: p.tx, zona: p.h })),
              preferiti: saved.map(id => wById(id)?.n),
              persone_bloccate: blocked.map(id => wById(id)?.n),
              giudizi_lasciati: giudizi,
              segnalazioni_inviate: segnalazioni,
              consensi,
              messaggi: "In questa anteprima le chat non vengono salvate.",
            }} />}
            {sc === "bloccati" && <Bloccati nav={nav} blocked={blocked} setBlocked={setBlocked} />}
            {sc === "delete" && <DeleteAccount nav={nav} role={role} setupDone={setupDone} paused={paused} entrambi={setupDone && !!profilo} attive={prossimeDi(prenotazioni)} agenda={setupDone ? agenda : []} onDeletedPro={() => { Object.assign(ME, ME_BASE, { sk: [...ME_BASE.sk] }); delete ME.zone; delete ME.nascita; delete ME.residenza; delete ME.cf; delete ME.preventivo; delete ME.bio; setSetupDone(false); setVerified(false); setPaused(false); setAvail(true); setNotifViste(v => v.filter(x => x !== "setup" && x !== "reqs")); setAgenda(AGENDA); setReqs(makeRequests()); setRole("client"); stackRef.current = []; setDt(null); setSc("account"); setK(x => x + 1); avviso.mostra("Profilo da professionista eliminato. Il tuo profilo per cercare aiuto resta."); }} onDeleted={() => resetAll("eliminato")} onPause={() => { setPaused(true); setRole("worker"); avviso.mostra("Profilo da professionista in pausa: non compari nelle ricerche. Lo riattivi da qui quando vuoi."); nav("account"); }} />}
            {sc === "eliminato" && <Eliminato onFine={() => { stackRef.current = []; setSc("entrata"); setK(x => x + 1); }} />}
            {sc === "neighborhood" && <Neighborhood nav={nav} pro={setupDone} paused={paused} posts={posts.filter(p => !blocked.some(id => wById(id)?.n === p.a))} onRemove={id => { setPosts(ps => ps.filter(p => p.id !== id)); avviso.mostra("Richiesta tolta dalla bacheca."); }} />}
            {sc === "passport" && <Passport nav={nav} />}
            {sc === "rewards" && <Rewards nav={nav} profilo={profilo} />}
            {sc === "post" && <Post nav={nav} profilo={profilo} setProfilo={setProfiloIn} onPosted={onPosted} />}
            {sc === "report" && <Report w={dt} nav={nav} profilo={profilo} onInviata={({ bookingId, ...x }) => { setSegnalazioni(v => [...v, x]); if (bookingId) setPrenotazioni(ps => ps.map(p => p.id === bookingId ? { ...p, stato: "segnalata" } : p)); }} />}
            {sc === "notifications" && <Notifications nav={nav} items={notifs} viste={notifViste} onSeen={() => setNotifViste(v => [...new Set([...v, ...notifs.map(n => n.id)])])} />}
            {sc === "share" && <ShareSeal nav={nav} verified={verified} />}
            {sc === "help" && <Help nav={nav} from={pv} />}
          </div>
          {showTabs && <Tabs active={sc} on={nav} role={role} />}
          {foglio && <LegalSheet doc={foglio} onClose={() => setFoglio(null)} />}
          {toast && <div key={toast.id} className="toast" role="status">{toast.msg}</div>}
          {scudo && <div className="scudo" aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
