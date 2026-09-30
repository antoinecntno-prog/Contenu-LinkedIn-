// Contrôle image par image : zone sûre, tailles de texte, durée de lecture de chaque carton.
// Usage : node tools/verify.cjs [reseaux|linkedin]
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const path = require("path");
const fs = require("fs");
const fin = process.argv[2] || "reseaux";
const SAFE = { x0: 60, x1: 960, y0: 210, y1: 1600 };
(async () => {
  const sched = JSON.parse(fs.readFileSync(path.join(__dirname, "../scenes.json"), "utf8"));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.addInitScript((fin) => { window.__hyperframes = { getVariables: () => ({ fin }) }; }, fin);
  await p.goto("file://" + path.join(__dirname, "../index.html"));
  await p.evaluate(async () => { await document.fonts.ready; return true; });
  await p.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { polling: 100 });
  const frames = Math.round(sched.duration * sched.fps);
  const res = await p.evaluate(({ frames, fps, SAFE }) => {
    const tl = window.__timelines.main;
    const effOpacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
    const clipVisible = (el) => { const c = el.style.clipPath; if (!c) return true; const m = c.match(/inset\(([-\d.]+)%\s+([-\d.]+)%/); return !m || parseFloat(m[2]) < 99; };
    const textRect = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
    const cards = [...document.querySelectorAll(".card")];
    const readable = cards.map(() => ({ run: 0, best: 0, first: -1 }));
    const viol = {}; let minCard = 1e9, minSec = 1e9;
    const note = (k, t) => { (viol[k] = viol[k] || []).push(t); };
    for (let f = 0; f < frames; f++) {
      const t = f / fps;
      tl.seek(t, false);
      // lisibilité des cartons
      cards.forEach((c, i) => {
        const lines = [...c.querySelectorAll(".line")], kws = [...c.querySelectorAll(".kw")];
        const ok = lines.every((l) => gsap.getProperty(l, "opacity") >= 0.99) && kws.every((k) => gsap.getProperty(k, "opacity") >= 0.99 && gsap.getProperty(k, "scale") >= 0.95);
        const R = readable[i];
        if (ok) { if (R.run === 0) R.start = t; R.run++; if (R.run > R.best) { R.best = R.run; R.first = R.start; } } else R.run = 0;
      });
      // textes visibles : zone sûre et taille
      const texts = [...document.querySelectorAll(".card .line, .st, .pin, .dock, .wt")];
      for (const el of texts) {
        if (effOpacity(el) < 0.5 || !clipVisible(el)) continue;
        const r = textRect(el);
        if (r.width < 1) continue;
        const id = el.id || (el.closest(".card") ? "carton:" + el.textContent.slice(0, 24) : el.className + ":" + el.textContent.slice(0, 20));
        if (r.left < SAFE.x0 - 0.5 || r.right > SAFE.x1 + 0.5 || r.top < SAFE.y0 - 0.5 || r.bottom > SAFE.y1 + 0.5) note("hors zone " + id, t);
        const scale = el.getBoundingClientRect().height / (el.offsetHeight || 1);
        const fs = parseFloat(getComputedStyle(el).fontSize) * scale;
        if (effOpacity(el) >= 0.95) {
          if (el.classList.contains("line")) { if (fs < minCard) minCard = fs; if (fs < 64) note("taille carton " + id, t); }
          else { if (fs < minSec) minSec = fs; if (fs < 40) note("taille secondaire " + id, t); }
        }
      }
      // éléments clés : feuille et chronomètres
      const penG = document.querySelector("#pen svg > g");
      for (const el of [document.getElementById("sheet"), ...document.querySelectorAll(".watch .dial"), penG]) {
        const o = effOpacity(el === penG ? document.getElementById("pen") : el);
        if (o < (el === penG ? 0.3 : 0.9)) continue;
        const r = el.getBoundingClientRect();
        if (r.left < SAFE.x0 - 0.5 || r.right > SAFE.x1 + 0.5 || r.top < SAFE.y0 - 0.5 || r.bottom > SAFE.y1 + 0.5) note("hors zone " + (el === penG ? "stylo" : el.id || "chronomètre"), t);
      }
    }
    return { readable: readable.map((r, i) => ({ text: [...cards[i].querySelectorAll(".line")].map((l) => l.textContent).join(" "), from: r.first, dur: r.best / fps })), viol, minCard, minSec };
  }, { frames, fps: sched.fps, SAFE });
  // rapprochement avec le planning
  const plan = [];
  sched.scenes.forEach((s) => s.cards.forEach((c) => plan.push(c)));
  let bad = 0;
  res.readable.forEach((r, i) => {
    const txt = r.text.replace(/\s+/g, " ").trim();
    const need = Math.max(txt.length / 15, 1.5);
    const ok = r.dur + 1e-6 >= need;
    if (!ok) bad++;
    console.log(`${ok ? "ok " : "KO "} ${r.dur.toFixed(2)} s ≥ ${need.toFixed(2)} s  dès ${r.from.toFixed(2)}  « ${txt} »`);
  });
  const ranges = (ts) => { const out = []; let a = ts[0], prev = ts[0]; for (const t of ts.slice(1)) { if (t - prev > 0.05) { out.push([a, prev]); a = t; } prev = t; } out.push([a, prev]); return out.map(([x, y]) => `${x.toFixed(2)}-${y.toFixed(2)}`).join(", "); };
  console.log("\nplus petit texte de carton affiché :", res.minCard.toFixed(1), "px ; plus petit texte secondaire :", res.minSec.toFixed(1), "px");
  const keys = Object.keys(res.viol);
  console.log(keys.length ? "\nÉcarts :" : "\nAucun écart de zone sûre ni de taille.");
  for (const k of keys) console.log(" -", k, "→", ranges(res.viol[k]));
  console.log(bad ? `\n${bad} carton(s) sous le temps de lecture.` : "\nTous les cartons tiennent leur temps de lecture.");
  await b.close();
})();
