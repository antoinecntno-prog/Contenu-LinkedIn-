// Contrôle image par image : zone sûre, tailles de texte, durée de lecture de chaque carton.
// Usage : node tools/verify.cjs [reseaux|linkedin]
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const path = require("path");
const fs = require("fs");
const fin = process.argv[2] || "reseaux";
const FLOOR = 1.0; // durée minimale d'un carton dans le montage de 30 s
const SAFE = { x0: 60, x1: 960, y0: 210, y1: 1600 };
(async () => {
  const sched = { duration: 30, fps: 30 };
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
    // zone occupée par les morceaux de texte visibles (mots, mots clés, lettres), sans les contours d'écho
    const textRect = (el) => {
      const kids = [...el.querySelectorAll(":scope .w, :scope .kw, :scope .ch")].filter((k) => !k.querySelector(".ch") && effOpacity(k) >= 0.5);
      if (!el.querySelector(".w, .kw, .ch")) { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); }
      if (!kids.length) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
      const rs = kids.map((k) => k.getBoundingClientRect());
      const left = Math.min(...rs.map((r) => r.left)), right = Math.max(...rs.map((r) => r.right));
      const top = Math.min(...rs.map((r) => r.top)), bottom = Math.max(...rs.map((r) => r.bottom));
      return { left, right, top, bottom, width: right - left, height: bottom - top };
    };
    const offCanvas = (r) => r.right < 0 || r.left > 1080 || r.bottom < 0 || r.top > 1920;
    const cards = [...document.querySelectorAll(".card")];
    const blurOf = (e) => { let b = 0; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const f = getComputedStyle(n).filter; const m = f && f.match(/blur\(([\d.]+)px\)/); if (m) b = Math.max(b, parseFloat(m[1])); if (f && f.includes("url(")) { const id = f.match(/#([\w-]+)/)[1]; const g = document.querySelector("#" + id + " feGaussianBlur"); if (g) b = Math.max(b, parseFloat(g.getAttribute("stdDeviation"))); } } return b; };
    const readable = cards.map(() => ({ run: 0, best: 0, first: -1 }));
    const viol = {}; let minCard = 1e9, minSec = 1e9; window.__prevRects = {}; window.__prevKey = {};
    const note = (k, t) => { (viol[k] = viol[k] || []).push(t); };
    for (let f = 0; f < frames; f++) {
      const t = f / fps;
      tl.seek(t, false);
      // lisibilité des cartons
      cards.forEach((c, i) => {
        const parts = [...c.querySelectorAll(".line, .w, .kw, .ch")], kws = [...c.querySelectorAll(".kw")];
        const cs = c.getBoundingClientRect().height / (c.offsetHeight || 1);
        const cr = c.getBoundingClientRect();
        const ok = cr.left >= SAFE.x0 - 40 && cr.right <= 1080 && effOpacity(c) >= 0.99 && cs > 0.95 && cs < 1.05 && blurOf(c) < 1 &&
          parts.every((l) => gsap.getProperty(l, "opacity") >= 0.99 && Math.abs(gsap.getProperty(l, "yPercent")) < 3 && Math.abs(gsap.getProperty(l, "y")) < 12 && blurOf(l) < 1) &&
          kws.every((k) => gsap.getProperty(k, "scale") >= 0.95) &&
          [...document.querySelectorAll(".glc")].every((g) => parseFloat(getComputedStyle(g).opacity) < 0.05);
        const R = readable[i];
        if (ok) { if (R.run === 0) R.start = t; R.run++; if (R.run > R.best) { R.best = R.run; R.first = R.start; } } else R.run = 0;
      });
      // textes visibles : zone sûre et taille
      const texts = [...document.querySelectorAll(".card .line, .st, .tag, .dock, .wt")];
      for (const el of texts) {
        if (effOpacity(el) < 0.95 || !clipVisible(el) || blurOf(el) >= 1) continue;
        const r = textRect(el);
        if (r.width < 1 || offCanvas(r)) continue;
        const key = "k" + texts.indexOf(el);
        const prev = window.__prevRects[key];
        window.__prevRects[key] = r;
        if (!prev || Math.abs(prev.left - r.left) > 1 || Math.abs(prev.top - r.top) > 1 || Math.abs(prev.width - r.width) > 1) continue; // en mouvement
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
      const keys = [...document.querySelectorAll(".sheet, .watch .dial")];
      for (const el of keys) {
        if (effOpacity(el) < 0.9) continue;
        const r = el.getBoundingClientRect();
        if (offCanvas(r)) continue;
        const pk = "s" + keys.indexOf(el), pr = window.__prevKey[pk];
        window.__prevKey[pk] = r;
        if (!pr || Math.abs(pr.left - r.left) > 1 || Math.abs(pr.top - r.top) > 1 || Math.abs(pr.width - r.width) > 1) continue;
        if (r.left < SAFE.x0 - 0.5 || r.right > SAFE.x1 + 0.5 || r.top < SAFE.y0 - 0.5 || r.bottom > SAFE.y1 + 0.5) note("hors zone " + (el.classList.contains("sheet") ? "feuille" : "chronomètre"), t);
      }
    }
    return { readable: readable.map((r, i) => ({ text: cards[i].dataset.text, from: r.first, dur: r.best / fps })), viol, minCard, minSec };
  }, { frames, fps: sched.fps, SAFE });
  // rapprochement avec le planning
  let bad = 0;
  res.readable.forEach((r, i) => {
    const txt = r.text.replace(/\s+/g, " ").trim();
    const need = Math.max(txt.length / 15, FLOOR);
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
