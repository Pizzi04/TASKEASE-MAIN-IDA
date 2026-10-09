import { T } from "./tema.js";

/* ---- Regole IDA v1.0 — identiche al documento pubblico e al calcolo lato server ---- */
export const IDA_VOCI = [
  { k: "puntualita", l: "Puntualità", w: 0.20 },
  { k: "qualita", l: "Qualità del lavoro", w: 0.30 },
  { k: "parola", l: "Parola mantenuta", w: 0.20 },
  { k: "pulizia", l: "Pulizia", w: 0.15 },
  { k: "comunicazione", l: "Comunicazione", w: 0.15 },
];
export const IDA_MIN_LAVORI = 3;
/* Un giudizio (5 voci da 1 a 5) diventa un punteggio da 20 a 100 */
export const scoreFromVoci = (v) => Math.round(IDA_VOCI.reduce((s, x) => s + v[x.k] * x.w, 0) * 20);
/* Il livello si ricava SEMPRE dal numero, mai assegnato a mano */
export const lvKeyOf = (ida, giudizi = IDA_MIN_LAVORI) => {
  if (ida == null || giudizi < IDA_MIN_LAVORI) return "bronzo";
  if (ida >= 95) return "diamante";
  if (ida >= 88) return "oro";
  if (ida >= 78) return "argento";
  if (ida >= 60) return "crescita";
  return "ferro";
};

/* Profili DI ESEMPIO: servono a far vedere l'app, non sono persone vere */
export const WORKERS_RAW = [
  { id: "w1", n: "Marco Rosetti", ini: "MR", bio: "Idraulico · 11 anni di mestiere", ida: 96, lv: "diamante", pr: 18, d: 1.2, av: true, j: 312, rv: 127, ver: true, sk: ["Idraulica", "Scarichi", "Caldaie"], rsp: "1 ora", zona: "Centro", tipo: "piva", abil: true, rc: true },
  { id: "w2", n: "Sofia Leoni", ini: "SL", bio: "Pulizie profonde · casa e ufficio", ida: 91, lv: "oro", pr: 15, d: 0.8, av: true, j: 201, rv: 89, ver: true, sk: ["Pulizia profonda", "Stiratura"], rsp: "30 min", zona: "Saffi", tipo: "privato" },
  { id: "w3", n: "Luca Marchetti", ini: "LM", bio: "Giardiniere · potatura e cura verde", ida: 82, lv: "argento", pr: 20, d: 3.1, av: false, j: 156, rv: 64, ver: false, sk: ["Potatura", "Prato", "Siepi"], rsp: "2-3 ore", zona: "Cava", tipo: "privato" },
  { id: "w4", n: "Anna Petrini", ini: "AP", bio: "Montaggio mobili · IKEA e su misura", ida: 95, lv: "diamante", pr: 25, d: 2.0, av: true, j: 98, rv: 43, ver: true, sk: ["Montaggio", "Cucine", "Mensole"], rsp: "1 ora", zona: "Ronco", tipo: "piva", rc: true },
  { id: "w5", n: "Elena Ferri", ini: "EF", bio: "Tecnico · PC, WiFi e stampanti", ida: 93, lv: "oro", pr: 30, d: 1.5, av: true, j: 134, rv: 55, ver: true, sk: ["PC", "WiFi", "Stampanti"], rsp: "45 min", zona: "Centro", tipo: "piva" },
  { id: "w6", n: "Davide Conti", ini: "DC", bio: "Elettricista · riparazioni e tuttofare", ida: 88, lv: "oro", pr: 22, d: 2.4, av: true, j: 112, rv: 47, ver: true, sk: ["Elettricità", "Riparazioni", "Tuttofare"], rsp: "1 ora", zona: "Ronco", tipo: "piva", abil: true, rc: true },
];
export const WORKERS = WORKERS_RAW.map(w => ({ ...w, lv: lvKeyOf(w.ida, w.rv), demo: true }));

export const CATS = [
  { ic: "drop", n: "Idraulica", c: "#7FB0D6", bg: "#1C2B38" },
  { ic: "wrench", n: "Riparazioni", c: "#E2B672", bg: "#3A2E1A" },
  { ic: "broom", n: "Pulizie", c: "#6FC7BC", bg: "#173430" },
  { ic: "chair", n: "Montaggio", c: "#E39A6E", bg: "#3A2419" },
  { ic: "chip", n: "Tecnologia", c: "#AFA0E0", bg: "#29243A" },
  { ic: "leaf", n: "Giardino", c: "#9CCB80", bg: "#22331C" },
];

/* Esempi di come apparirà l'attività in zona — etichettati come tali in home */
export const LIVE = [
  "Marco ha chiuso una perdita in zona Centro. 38 minuti.",
  "Sofia ha finito una casa in Centro. «Impeccabile.»",
  "Anna ha montato una cucina a Ronco. 2 ore nette.",
];

export const TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
// Calcolati quando si apre la prenotazione, non al caricamento: dopo mezzanotte "Oggi" resta giusto
export const makeDays = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  return { k: i, data: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, l: i === 0 ? "Oggi" : i === 1 ? "Domani" : d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" }) };
});

/* Numeri del cliente Piz: UNA sola fonte, così timbri, livello e badge tornano sempre */
export const CLIENT_JOBS = 7;
export const QUARTIERI = [
  { id: "centro", n: "Centro", x: 49, y: 44, s: 5 },
  { id: "saffi", n: "Saffi", x: 27, y: 34, s: 1 },
  { id: "cava", n: "Cava", x: 71, y: 29, s: 0 },
  { id: "ronco", n: "Ronco", x: 74, y: 60, s: 1 },
  { id: "villa", n: "Villafranca", x: 21, y: 64, s: 0 },
  { id: "buss", n: "Bussecchio", x: 56, y: 73, s: 0 },
  { id: "vecc", n: "Vecchiazzano", x: 83, y: 40, s: 0 },
];
export const STAMPS = QUARTIERI.reduce((s, q) => s + q.s, 0);   // = CLIENT_JOBS
export const ZONES_ON = QUARTIERI.filter(q => q.s > 0).length;

export const BADGES = [
  { n: "Prima volta", ic: "seal", ok: true },
  { n: "Di casa in Centro", ic: "home", ok: true },
  { n: "Giro di Forlì", ic: "compass", ok: true },
  { n: "Forlivese DOC", ic: "star", ok: false, p: `${ZONES_ON}/7 zone` },
  { n: "Tuttofare", ic: "wrench", ok: false, p: "4/6 categorie" },
  { n: "Di lunga data", ic: "trophy", ok: false, p: `${CLIENT_JOBS}/20 lavori` },
];

/* Vantaggi — lato cliente: solo riconoscimento e comodità.
   Nessun vantaggio cambia l'ordine dei risultati o l'IDA di qualcuno. */
export const PERKS = { level: "Di casa", jobs: CLIENT_JOBS, nextLevel: "di lunga data", toNext: 20 - CLIENT_JOBS, invited: 2 };
export const PERK_LIST = [
  { ic: "heart", t: "Riprenoti in un tocco", s: "Chi ti è piaciuto resta tra i preferiti", ok: true },
  { ic: "book", t: "Lo storico dei tuoi lavori", s: "Chi è venuto, quando e per cosa", ok: true },
  { ic: "star", t: "Badge “Di lunga data”", s: "Solo un riconoscimento: non ti dà corsie preferenziali", ok: false, p: `${CLIENT_JOBS}/20` },
];

/* Abbonamento — facoltativo, slegato dall'IDA. Base gratis, Pro = strumenti extra. */
export const PLAN = { name: "Pro", price: 9 };

/* ---- Profilo cliente + lavoratore: STESSA persona, Piz ---- */
/* Cliente esperto (ha già chiesto aiuto) ma lavoratore NUOVO (inizia ora a offrire) */
export const ME = {
  n: "Piz", ini: "PZ", zona: "Centro", since: "gennaio 2025",
  ida: null, lv: "bronzo", pr: 20, rv: 0, j: 0, rsp: "—",
  sk: ["Montaggio", "Piccole riparazioni", "Consegne"],
  tipo: null, piva: "", abil: false, rc: false, foto: false,
};
export const ME_BASE = { ...ME, sk: [...ME.sk] };
export const MY_PAST = [
  { wid: "w1", task: "Riparazione scarico", date: "2 feb", reviewed: true },
  { wid: "w2", task: "Pulizia profonda casa", date: "24 gen", reviewed: true },
  { wid: "w5", task: "Configurazione WiFi", date: "10 gen", reviewed: false },
];

/* ---- Profilo artigiano (NUOVO: ancora niente lavori) ---- */
export const AGENDA = [];
// Orari relativi all'ora attuale: dopo le 15 la richiesta "di oggi pomeriggio" diventa di domani
// Data di oggi nel fuso del telefono (toISOString darebbe quella UTC: sbaglia tra mezzanotte e le 2)
export const dataLocale = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// L'etichetta del giorno si ricava dalla data salvata, così "Domani" diventa "Oggi" il giorno dopo
export const giornoDi = (b) => {
  if (!b?.data) return b?.day || "";
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
  const [y, m, g] = b.data.split("-").map(Number); const d = new Date(y, m - 1, g);
  const diff = Math.round((d - oggi) / 86400000);
  return diff === 0 ? "Oggi" : diff === 1 ? "Domani" : diff === -1 ? "Ieri" : d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: diff < 0 ? "short" : undefined });
};
export const quandoDi = (b) => b?.data && b?.time ? new Date(`${b.data}T${b.time}:00`) : null;
export const passata = (b) => { const q = quandoDi(b); return !!q && q < new Date(); };
export const ATTIVA = (b) => b.stato === "confermata" || b.stato === "in attesa";
// Una sola regola per "il prossimo appuntamento", usata ovunque
export const prossimeDi = (ps = []) => ps.filter(b => ATTIVA(b) && !passata(b)).sort((a, b) => (quandoDi(a) || 0) - (quandoDi(b) || 0));
// "Domani mattina", "Sabato mattina"… → data vera, così in agenda "Oggi" diventa "Ieri" il giorno dopo
export const dataDaQuando = (when, time) => {
  const d = new Date(); const w = String(when || "").toLowerCase();
  if (w.startsWith("domani")) d.setDate(d.getDate() + 1);
  else if (!w.startsWith("oggi")) {
    const i = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"].findIndex(g => w.startsWith(g));
    if (i >= 0) { let diff = (i - d.getDay() + 7) % 7; if (diff === 0 && !(time && parseInt(time, 10) > d.getHours())) diff = 7; d.setDate(d.getDate() + diff); }
  }
  return dataLocale(d);
};
export const aggiornaRichiesta = (r) => r.when === "Oggi pomeriggio" && new Date().getHours() >= 15 ? { ...r, when: "Domani pomeriggio" } : r;
export const makeRequests = () => REQUESTS.map(aggiornaRichiesta);
export const REQUESTS = [
  { id: "r1", c: "Laura B.", task: "Montare una libreria", det: "Billy IKEA, 2 colonne. Ho già gli attrezzi.", zona: "Saffi", when: "Oggi pomeriggio", time: "16:00", ore: 2, cat: ["Montaggio mobili", "Piccoli lavori (senza impianti)", "Tuttofare"] },
  { id: "r2", c: "Marco V.", task: "Aiuto per un piccolo trasloco", det: "Qualche scatolone e un divano, secondo piano senza ascensore.", zona: "Centro", when: "Domani mattina", time: "09:30", ore: 3, cat: ["Traslochi", "Consegne", "Tuttofare"] },
  { id: "r3", c: "Franca M.", task: "Tapparella che non scende", det: "Si è bloccata a metà, credo la cinghia. Primo piano.", zona: "Ronco", when: "Domani pomeriggio", time: "15:00", ore: 1, cat: ["Riparazioni", "Piccoli lavori (senza impianti)", "Tuttofare"] },
  { id: "r4", c: "Andrea C.", task: "Rifare le fughe della doccia", det: "Doccia piccola, fughe annerite. Va bene anche sabato.", zona: "Cava", when: "Sabato mattina", time: "10:00", ore: 4, cat: ["Piastrelle e pavimenti", "Muratura e cartongesso", "Tuttofare"] },
  { id: "r5", c: "Silvia T.", task: "Stampante che non si collega", det: "Dopo il cambio del router il PC non la vede più.", zona: "Centro", when: "Domani mattina", time: "11:00", ore: 1, cat: ["Tecnologia / PC"] },
];
/* Il pagamento del lavoro avviene tra le persone, fuori dall'app. */
export const MONTH = { jobs: 0, earned: 0 };
export const REVIEWS_IN = [];
export const wById = (id) => WORKERS.find(w => w.id === id);

/* Colore del mestiere — il sigillo IDA prende la tinta della categoria */
export const catColorOf = (w) => {
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
export const REVIEWS_BY = {
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

export const POSTS = [
  { t: "req", a: "Giulia R.", tx: "Tapparella bloccata in zona Saffi. Qualcuno la sa sistemare oggi?", h: "Saffi", ago: "12 min", r: 3 },
  { t: "job", a: "Marco Rosetti", ini: "MR", tx: "Sto riparando uno scarico in zona Centro.", h: "Centro", ago: "25 min" },
  { t: "req", a: "Paolo M.", tx: "Cerco aiuto per montare mensole e un mobile TV. Zona Ronco.", h: "Ronco", ago: "1 ora", r: 5 },
  { t: "req", a: "Maria T.", tx: "WiFi che cade di continuo da tre giorni. Qualcuno bravo con le reti?", h: "Centro", ago: "2 ore", r: 2 },
];
