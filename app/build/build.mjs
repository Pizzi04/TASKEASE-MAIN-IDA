// Compila src/taskease-app.jsx in un unico dist/index.html, come l'anteprima originale.
import * as esbuild from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
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
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  alias: { react: join(here, "react-shim.js") },
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>TaskEase Anteprima</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
:root { color-scheme: light; }
html, body { background: #E4DFD4; }
@media (max-width: 520px) { html, body { background: #F6F2EA; } }
</style>
</head>
<body>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
</body>
</html>
`;
const out = join(here, "..", "dist", "index.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log("ok", out, Math.round(html.length / 1024) + " KB");
