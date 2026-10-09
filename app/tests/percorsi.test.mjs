// Test dei percorsi principali sull'anteprima compilata (dist/index.html).
// Lancio: npm test  (compila e poi esegue). Serve Chromium per Playwright:
//   npx playwright install chromium   (una volta sola, sul tuo computer)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const FILE = "file://" + join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "index.html");
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

// Pagina nuova, con la rete bloccata: l'anteprima deve funzionare senza servizi esterni.
async function apri() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const rete = [];
  await ctx.route(/^https?:\/\//, r => { rete.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage();
  const errori = [];
  p.on("pageerror", e => errori.push(e.message));
  await p.goto(FILE);
  await p.waitForTimeout(400);
  return { p, ctx, rete, errori };
}
const testo = (p) => p.evaluate(() => document.getElementById("root").innerText);
const tocca = async (p, t) => { await p.getByText(t, { exact: false }).first().click(); await p.waitForTimeout(350); };
// Pulsante con questo testo esatto (l'ultimo, per evitare quelli coperti dalla barra in basso)
const premi = async (p, t) => { await p.evaluate(t => { const bs = [...document.querySelectorAll("button")].filter(b => b.innerText.trim() === t); if (!bs.length) throw new Error("pulsante non trovato: " + t); bs[bs.length - 1].click(); }, t); await p.waitForTimeout(350); };
const scrivi = async (p, segnaposto, v) => { await p.locator(`[placeholder*="${segnaposto}"]`).first().fill(v); await p.waitForTimeout(150); };

// Contrasto del testo visibile: ogni testo deve stare almeno a 4,5:1 (3:1 se grande)
async function testiPocoLeggibili(p) {
  await p.evaluate(() => document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} }));
  return p.evaluate(() => {
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(",").map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
    const lum = ({ r, g, b }) => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const mix = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
    const sfondo = (el) => { const pila = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); const g = cs.backgroundImage !== "none" && cs.backgroundImage.match(/rgba?\([^)]+\)/); if (g) { const c = parse(g[0]); pila.push(c); if (c.a >= 1) break; } const c = parse(cs.backgroundColor); if (c && c.a > 0) { pila.push(c); if (c.a >= 1) break; } } let base = { r: 14, g: 28, b: 25, a: 1 }; for (let i = pila.length - 1; i >= 0; i--) base = mix(pila[i], base); return base; };
    const out = []; const visti = new Set();
    const w = document.createTreeWalker(document.getElementById("root"), NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const el = w.currentNode.parentElement; if (!el || visti.has(el) || !w.currentNode.textContent.trim()) continue; visti.add(el);
      const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const cs = getComputedStyle(el); if ((cs.webkitBackgroundClip || cs.backgroundClip) === "text") continue;
      if (el.closest('[aria-disabled="true"],:disabled')) continue;
      let op = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
      const bg = sfondo(el), fg0 = parse(cs.color), fg = mix({ ...fg0, a: fg0.a * op }, bg);
      const ratio = (Math.max(lum(fg), lum(bg)) + .05) / (Math.min(lum(fg), lum(bg)) + .05);
      const grande = parseFloat(cs.fontSize) >= 24 || (parseInt(cs.fontWeight) >= 700 && parseFloat(cs.fontSize) >= 18.66);
      if (ratio < (grande ? 3 : 4.5)) out.push(`${w.currentNode.textContent.trim().slice(0, 30)} (${ratio.toFixed(2)})`);
    }
    return out;
  });
}

async function creaProfiloCliente(p) {
  await tocca(p, "Cerco una mano"); await tocca(p, "Salta");
  await scrivi(p, "Giulia", "Giulia"); await scrivi(p, "333", "3331234567");
  await premi(p, "Centro"); await p.locator("input[type=checkbox]").first().check({ force: true });
  await premi(p, "Crea il profilo");
  await p.getByLabel("Codice di verifica").fill("123456"); await premi(p, "Conferma il numero");
}

test("si apre senza rete, senza errori e con i caratteri giusti", async () => {
  const { p, ctx, rete, errori } = await apri();
  await p.evaluate(() => document.fonts.ready);
  const caratteri = await p.evaluate(() => [...document.fonts].filter(f => f.status === "loaded").map(f => f.family));
  assert.deepEqual(rete, [], "nessuna richiesta di rete");
  assert.deepEqual(errori, []);
  for (const f of ["Hanken Grotesk", "Space Mono", "Fraunces"]) assert.ok(caratteri.includes(f), "carattere " + f);
  assert.ok((await testo(p)).includes("Cerco una mano"));
  await ctx.close();
});

test("cliente: profilo, prenotazione, salvataggio, giudizio", async () => {
  const { p, ctx, errori } = await apri();
  await creaProfiloCliente(p);
  assert.match(await testo(p), /Giulia/);
  await tocca(p, "Marco Rosetti"); await premi(p, "Prenota Marco");
  await premi(p, "Domani"); await premi(p, "09:00");
  await scrivi(p, "lavandino del bagno", "Perde il sifone sotto il lavandino");
  await scrivi(p, "Via e numero", "Via Roma 10");
  await premi(p, "Non lo so, lo stima Marco");
  await tocca(p, "Invia richiesta a Marco");
  await p.waitForTimeout(8000); // l'anteprima simula la risposta di Marco
  assert.match(await testo(p), /Marco ci sarà/);
  await premi(p, "Torna alla home");
  await p.reload(); await p.waitForTimeout(800);
  const dopo = await testo(p);
  assert.match(dopo, /Giulia/, "il profilo resta dopo il ricaricamento");
  assert.match(dopo, /Marco Rosetti/, "l'appuntamento resta dopo il ricaricamento");
  await premi(p, "Profilo"); await tocca(p, "Lavoro finito? Lascia il giudizio");
  for (const r of ["Puntuale", "Esattamente come volevo", "Esattamente", "Tutto in ordine", "Chiaro e gentile"]) await premi(p, r);
  await p.waitForTimeout(1200);
  await premi(p, "Pubblica il giudizio"); await p.waitForTimeout(2000);
  assert.match(await testo(p), /Grazie/);
  assert.deepEqual(errori, []);
  await ctx.close();
});

test("ricerca a parole libere e ordinamento per prezzo", async () => {
  const { p, ctx } = await apri();
  await tocca(p, "Cerco una mano"); await tocca(p, "Salta"); await tocca(p, "Guardo prima");
  await premi(p, "Cerca");
  await scrivi(p, "Idraulico", "perde il lavandino");
  assert.match(await testo(p), /Marco Rosetti/, "«perde il lavandino» trova l'idraulico");
  await scrivi(p, "Idraulico", "");
  await p.getByRole("button", { name: "Ordina per prezzo" }).click(); await p.waitForTimeout(300);
  const prezzi = await p.$$eval(".lrow > span:nth-child(3)", els => els.map(e => +e.textContent));
  assert.deepEqual(prezzi, [...prezzi].sort((a, b) => a - b), "prezzi in ordine crescente");
  await ctx.close();
});

test("professionista: il codice fiscale sbagliato viene fermato, quello giusto passa", async () => {
  for (const [cf, passa] of [["BRTGLI90A41D704X", false], ["BRTGLI90A41D704A", true]]) {
    const { p, ctx, errori } = await apri();
    await tocca(p, "Offro una mano"); await tocca(p, "Salta");
    await scrivi(p, "Bertozzi", "Giulia Bertozzi"); await tocca(p, "Scatta o scegli"); await tocca(p, "Da privato");
    await premi(p, "Continua"); await tocca(p, "Pulizie"); await premi(p, "Continua"); await premi(p, "Continua");
    await scrivi(p, "333", "3331234567"); await scrivi(p, "Via, numero", "Via Roma 10, Forlì");
    await p.getByLabel("Codice fiscale").fill(cf); await p.locator("input[type=date]").first().fill("1990-03-12");
    await tocca(p, "Dichiaro che lavoro"); await p.locator("input[type=checkbox]").first().check({ force: true });
    await premi(p, "Completa il profilo");
    const t = await testo(p);
    if (passa) assert.match(t, /Codice di verifica|Conferma il numero/);
    else assert.match(t, /controlla l'ultima lettera/);
    assert.deepEqual(errori, []);
    await ctx.close();
  }
});

test("le schermate principali sono leggibili (contrasto ≥ 4,5:1)", async () => {
  const { p, ctx } = await apri();
  const problemi = {};
  const controlla = async (nome) => { const x = await testiPocoLeggibili(p); if (x.length) problemi[nome] = x; };
  await controlla("ingresso");
  await tocca(p, "Cerco una mano"); await tocca(p, "Salta"); await tocca(p, "Guardo prima");
  await controlla("home");
  await premi(p, "Cerca"); await controlla("cerca");
  await tocca(p, "Sofia Leoni"); await controlla("profilo Sofia");
  await p.getByRole("button", { name: "Indietro" }).first().click(); await p.waitForTimeout(350);
  await premi(p, "Bacheca"); await controlla("bacheca");
  await premi(p, "Pubblica"); await controlla("pubblica");
  await premi(p, "Profilo"); await controlla("profilo ospite");
  assert.deepEqual(problemi, {});
  await ctx.close();
});

test("«Ricomincia l'anteprima» cancella tutto", async () => {
  const { p, ctx } = await apri();
  await creaProfiloCliente(p);
  await premi(p, "Profilo");
  await tocca(p, "Ricomincia l'anteprima"); await tocca(p, "Sì, ricomincia");
  assert.match(await testo(p), /Cerco una mano/);
  await p.reload(); await p.waitForTimeout(600);
  assert.match(await testo(p), /Cerco una mano/, "dopo il ricaricamento si riparte dall'ingresso");
  await ctx.close();
});

// I bagliori dello sfondo non stanno nel codice dei colori ma nei pixel: qui si misura lo schermo vero,
// dietro ogni testo appoggiato direttamente sullo sfondo, in tre momenti del loro movimento.
test("il testo resta leggibile sopra i bagliori dello sfondo (misura sui pixel)", async () => {
  const { PNG } = await import("pngjs");
  const { p, ctx } = await apri();
  await tocca(p, "Cerco una mano"); await tocca(p, "Salta"); await tocca(p, "Guardo prima");
  const problemi = [];
  const lum = ([r, g, b]) => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const misura = async (nome) => {
    for (const attesa of [600, 9000, 18000]) {
      await p.waitForTimeout(attesa === 600 ? 600 : 9000);
      const testi = await p.evaluate(() => {
        const out = []; const w = document.createTreeWalker(document.getElementById("root"), NodeFilter.SHOW_TEXT); const visti = new Set();
        while (w.nextNode()) {
          const el = w.currentNode.parentElement; if (!el || visti.has(el) || !w.currentNode.textContent.trim()) continue; visti.add(el);
          let sopraSfondo = true;
          for (let e = el; e && !e.classList.contains("sfondo"); e = e.parentElement) { const cs = getComputedStyle(e); const c = cs.backgroundColor.match(/[\d.]+/g); if ((c && c.length > 3 ? +c[3] : c ? 1 : 0) > 0.05 || cs.backgroundImage !== "none") { sopraSfondo = false; break; } }
          if (!sopraSfondo) continue;
          const r = el.getBoundingClientRect(); if (!r.width || r.top < 0 || r.bottom > innerHeight) continue;
          const cs = getComputedStyle(el); if ((cs.webkitBackgroundClip || cs.backgroundClip) === "text") continue;
          const c = cs.color.match(/[\d.]+/g).map(Number);
          out.push({ t: w.currentNode.textContent.trim().slice(0, 25), c, x0: Math.max(0, r.left - 3), x1: Math.min(innerWidth - 1, r.right + 3), y: Math.round(r.top + r.height / 2), y0: Math.max(0, r.top - 2), y1: Math.min(innerHeight - 1, r.bottom + 2), xm: Math.round((r.left + r.right) / 2), grande: parseFloat(cs.fontSize) >= 24 || (parseInt(cs.fontWeight) >= 700 && parseFloat(cs.fontSize) >= 18.66) });
        }
        return out;
      });
      const img = PNG.sync.read(await p.screenshot());
      const px = (x, y) => { const i = (Math.round(y) * img.width + Math.round(x)) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
      for (const t of testi) {
        const campioni = [px(t.x0, t.y), px(t.x1, t.y), px(t.xm, t.y0), px(t.xm, t.y1)];
        const peggiore = Math.min(...campioni.map(b => (Math.max(lum(t.c), lum(b)) + .05) / (Math.min(lum(t.c), lum(b)) + .05)));
        if (peggiore < (t.grande ? 3 : 4.5)) problemi.push(`${nome} @${attesa}ms: «${t.t}» ${peggiore.toFixed(2)}`);
      }
    }
  };
  await misura("home");
  await premi(p, "Cerca"); await misura("cerca");
  await premi(p, "Bacheca"); await misura("bacheca");
  await premi(p, "Profilo"); await misura("profilo");
  assert.deepEqual(problemi, []);
  await ctx.close();
});

test("mappa grande: si apre dalla home, scheda, filtri, profilo e indietro", async () => {
  const { p, ctx, errori } = await apri();
  await tocca(p, "Cerco una mano"); await tocca(p, "Salta"); await tocca(p, "Guardo prima");
  await p.locator(".tl.map").click(); await p.waitForTimeout(700);
  assert.equal(await p.locator(".head-t").innerText(), "Mappa della zona");
  assert.equal(await p.locator(".mappa-g .pin").count(), 6);
  await p.getByRole("button", { name: /^Marco Rosetti/ }).click(); await p.waitForTimeout(500);
  assert.match(await p.locator(".mappa-scheda").innerText(), /Marco Rosetti/);
  await p.getByRole("button", { name: "Chiudi la scheda" }).click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: "Liberi ora" }).click(); await p.waitForTimeout(300);
  assert.equal(await p.locator(".mappa-g .pin").count(), 5, "Luca non è disponibile");
  await p.getByRole("button", { name: "Tutti", exact: true }).click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: /^Sofia Leoni/ }).click(); await p.waitForTimeout(400);
  await tocca(p, "Vedi profilo");
  assert.ok(await p.$(".ida-block"), "si apre il profilo di Sofia");
  await p.getByRole("button", { name: "Indietro" }).first().click(); await p.waitForTimeout(500);
  assert.ok(await p.$(".mappa-g"), "indietro torna alla mappa");
  assert.deepEqual(errori, []);
  await ctx.close();
});

test("un salvataggio rovinato nel browser non blocca l'app", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https?:\/\//, r => r.abort());
  await ctx.addInitScript(() => localStorage.setItem("taskease-anteprima-v1", JSON.stringify({ v: 1, profilo: { nome: "Giulia", tel: "3331234567", zona: "Centro" }, prenotazioni: "rotto", posts: 42, saved: null, me: "x" })));
  const p = await ctx.newPage(); const errori = []; p.on("pageerror", e => errori.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(800);
  assert.deepEqual(errori, []);
  assert.match(await testo(p), /Giulia/, "il profilo valido viene ripreso");
  await premi(p, "Bacheca");
  assert.match(await testo(p), /Bacheca del quartiere/, "la bacheca rovinata riparte dagli esempi");
  await ctx.close();
});

test("interruttore Cerco | Lavoro in home: cambia modalità e la ricorda", async () => {
  const { p, ctx, errori } = await apri();
  // ospite: «Lavoro» porta all'iscrizione da professionista
  await tocca(p, "Cerco una mano"); await tocca(p, "Salta"); await tocca(p, "Guardo prima");
  await p.locator('.ruolo button', { hasText: "Lavoro" }).click(); await p.waitForTimeout(500);
  assert.match(await testo(p), /Chi sei/, "senza profilo da professionista si apre l'iscrizione");
  await ctx.close();
  // professionista iscritto: passa da Lavoro a Cerco e ritorno, e dopo un ricaricamento resta l'ultima scelta
  const b = await apri(); const q = b.p;
  await tocca(q, "Offro una mano"); await tocca(q, "Salta");
  await scrivi(q, "Bertozzi", "Giulia Bertozzi"); await tocca(q, "Scatta o scegli"); await tocca(q, "Da privato");
  await premi(q, "Continua"); await tocca(q, "Pulizie"); await premi(q, "Continua"); await premi(q, "Continua");
  await scrivi(q, "333", "3331234567"); await scrivi(q, "Via, numero", "Via Roma 10, Forlì");
  await q.getByLabel("Codice fiscale").fill("BRTGLI90A41D704A"); await q.locator("input[type=date]").first().fill("1990-03-12");
  await tocca(q, "Dichiaro che lavoro"); await q.locator("input[type=checkbox]").first().check({ force: true });
  await premi(q, "Completa il profilo"); await q.getByLabel("Codice di verifica").fill("123456"); await premi(q, "Conferma il numero");
  await tocca(q, "Vai al tuo profilo"); await premi(q, "Home");
  assert.match(await testo(q), /Richieste per te/, "in modalità Lavoro la home mostra le richieste");
  await q.locator('.ruolo button', { hasText: "Cerco" }).click(); await q.waitForTimeout(500);
  assert.match(await testo(q), /Vicini a te/, "in modalità Cerco la home mostra chi lavora vicino");
  assert.match(await testo(q), /Modalità Cerco/, "un avviso conferma il cambio");
  await q.reload(); await q.waitForTimeout(800);
  assert.equal(await q.locator('.ruolo button[aria-pressed="true"]').innerText(), "Cerco", "la modalità resta dopo il ricaricamento");
  assert.deepEqual([...errori, ...b.errori], []);
  await b.ctx.close();
});
