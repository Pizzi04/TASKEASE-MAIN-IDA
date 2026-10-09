import { T } from "./tema.js";

export const STYLE = `
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
.book-bar { position: sticky; bottom: 0; z-index: 5; background: ${T.paperVetro}; -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); box-shadow: 0 -10px 24px -14px rgba(0,0,0,.5); border-top: 1px solid ${T.line}; padding: 14px 22px calc(16px + env(safe-area-inset-bottom, 0px)); }
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
.ent-ida .seal-lab { font-size: 12px; letter-spacing: 2px; margin-top: 3px; }
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
.home { flex: 1; min-height: 0; overflow-y: auto; background: transparent; }
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
.ticker-tag { white-space: nowrap; font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 400; letter-spacing: 1px; color: ${T.stone}; border: 1px solid ${T.faint}; border-radius: 5px; padding: 1px 5px; flex-shrink: 0; }
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
.ida-n.nuovo { font-size: 12px; letter-spacing: 1px; color: ${T.ochreLight}; border: 1.5px solid ${T.ochre}; border-radius: 6px; padding: 3px 6px; }
.ida-lab { font-size: 12px; font-weight: 600; color: ${T.stone}; margin-top: 3px; }
.ida-card { display: block; width: calc(100% - 40px); margin: 22px 20px 0; padding: 18px; border: 0; border-radius: 20px; text-align: left; cursor: pointer; background: linear-gradient(150deg, #23493F, #16332D); color: rgba(246,242,234,.8); font-family: 'Hanken Grotesk', sans-serif; font-size: 14px; line-height: 1.5; }
.ida-t { font-size: 16px; font-weight: 800; color: ${T.cream}; }
.ida-l { display: inline-block; margin-top: 8px; font-size: 14px; font-weight: 700; color: ${T.ochreLight}; }
.tiles { list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 10px 20px 0; padding: 0; }
.tile { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; width: 100%; min-height: 92px; padding: 14px 12px; background: ${T.card}; border: 0; border-radius: 18px; cursor: pointer; text-align: left; font-family: 'Hanken Grotesk', sans-serif; color: ${T.ink}; }
.tile:active { filter: brightness(1.12); }
.tile svg { margin-bottom: auto; color: ${T.ochreLight}; }
.tile-l { font-size: 14px; font-weight: 700; margin-top: 10px; }
.tile-s { font-size: 12.5px; color: ${T.stone}; line-height: 1.3; }

.head { position: sticky; top: 0; z-index: 6; display: flex; align-items: center; gap: 12px; padding: 14px 20px 12px; background: ${T.paperVetro}; -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }
.head-root { padding-top: 22px; }
.head-root .head-t { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
.head-back { width: 44px; height: 44px; border-radius: 14px; border: 0; background: ${T.card}; color: ${T.ink}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.head-t { font-family: 'Hanken Grotesk', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -.5px; color: ${T.ink}; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* barra in basso: icone su sfumatura, la voce attiva in un riquadro */
.dock-wrap { background: ${T.paperVetro}; -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); padding: 6px 12px calc(10px + env(safe-area-inset-bottom, 0px)); flex-shrink: 0; border-top: 1px solid ${T.line}; }
.dock { display: flex; align-items: center; justify-content: space-around; gap: 4px; }
.dock-i, .dock-plus { flex: 1; max-width: 72px; min-height: 52px; border: 0; border-radius: 16px; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; font-family: 'Hanken Grotesk', sans-serif; color: ${T.stone}; }
.dock-i span, .dock-plus > span:last-child { font-size: 12px; font-weight: 600; white-space: nowrap; }
.dock-i.on { color: ${T.ink}; background: ${T.card}; }
.dock-plus { color: ${T.ochreLight}; }
.dock-plus-i { width: 34px; height: 26px; border-radius: 9px; background: ${T.ochreLight}; color: #1C1408; display: flex; align-items: center; justify-content: center; }
.next-card { display: flex; align-items: center; gap: 12px; width: calc(100% - 40px); margin: 14px 20px 0; padding: 14px 16px; border-radius: 18px; border: 0; background: ${T.ochreLight}; text-align: left; cursor: pointer; font-family: inherit; color: #1C1408; }
.next-t { display: block; font-size: 12px; font-weight: 700; color: rgba(28,20,8,.75); text-transform: uppercase; letter-spacing: .5px; }
.next-s { display: block; font-size: 15px; font-weight: 700; color: #1C1408; margin-top: 2px; }
.dock-i:focus-visible, .dock-plus:focus-visible, .wcard:focus-visible, .cat2:focus-visible, .tile:focus-visible, .head-back:focus-visible, .ida-card:focus-visible, .tl:focus-visible, .lrow:focus-visible, .next-card:focus-visible { outline: 2.5px solid ${T.ochreLight}; outline-offset: 2px; }

/* cerca: righe-riquadro con colonne ordinabili */
.ledger-h { display: grid; grid-template-columns: minmax(0, 1fr) 52px 48px 48px; gap: 8px; padding: 0 34px; position: sticky; top: 0; background: ${T.paperVetro}; -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); z-index: 2; }
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
.post-t { position: absolute; top: 16px; right: 16px; font-family: 'Space Mono', monospace; font-size: 12px; color: ${T.stone}; }
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

/* ---------- sfondo dell'app: bagliori verdi e ocra del tema, fermi mentre il contenuto scorre ---------- */
.sfondo { isolation: isolate; }
.sfondo::before { content: ""; position: absolute; inset: -25%; z-index: 0; pointer-events: none;
  background:
    radial-gradient(42% 32% at 18% 12%, rgba(36,94,83,.75), transparent 70%),
    radial-gradient(40% 32% at 92% 36%, rgba(224,182,118,.26), transparent 70%),
    radial-gradient(45% 30% at 30% 92%, rgba(79,209,160,.12), transparent 70%),
    radial-gradient(34% 24% at 85% 86%, rgba(224,182,118,.18), transparent 70%);
  animation: bagliore-in 1.4s ease both, deriva 36s ease-in-out 1.4s infinite alternate; }
@keyframes bagliore-in { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: none; } }
@keyframes deriva { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(-4%, 3%) rotate(6deg); } }

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
