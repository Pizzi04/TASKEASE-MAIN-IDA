// Compila src/ in un unico dist/index.html che non dipende da servizi esterni:
// React e i caratteri (solo il set latino) sono dentro il file.
import * as esbuild from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const res = await esbuild.build({
  entryPoints: [join(here, "entry.jsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: "es2019",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const fonts = readFileSync(join(here, "fonts", "fonts.css"), "utf8")
  .replace(/url\(FONT:([^)]+)\)/g, (_, f) => `url(data:font/woff2;base64,${readFileSync(join(here, "fonts", f)).toString("base64")})`);
const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0E1C19">
<title>TaskEase Anteprima</title>
<style>
${fonts}
:root { color-scheme: dark; }
html, body { background: #E4DFD4; }
@media (max-width: 520px) { html, body { background: #0E1C19; } }
</style>
</head>
<body>
<div id="root"></div>
<noscript>Per usare l'anteprima di TaskEase serve JavaScript attivo.</noscript>
<script>${js}</script>
</body>
</html>
`;
const out = join(here, "..", "dist", "index.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log("ok", out, Math.round(html.length / 1024) + " KB");
