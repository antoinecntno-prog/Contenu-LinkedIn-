// Audit des critères d'acceptation, image par image, dans Chromium (Playwright).
// Usage : node scripts/audit.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("/opt/node22/lib/node_modules/playwright");
}

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".woff2": "font/woff2" };
const serveur = createServer(async (req, res) => {
  try {
    const chemin = join(racine, decodeURIComponent(new URL(req.url, "http://x").pathname));
    const corps = await readFile(chemin.endsWith("/") ? join(chemin, "index.html") : chemin);
    res.writeHead(200, { "content-type": TYPES[extname(chemin)] || "application/octet-stream" });
    res.end(corps);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => serveur.listen(0, r));
const port = serveur.address().port;

const navigateur = await playwright.chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1080, height: 1920 } });
// Hors du runtime HyperFrames, le registre des timelines n'existe pas encore.
await page.addInitScript(() => {
  window.__timelines = window.__timelines || {};
});
page.on("pageerror", (e) => console.error("Erreur de page :", e.message));
await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.waitForFunction(() => window.__timelines && window.__timelines.main && window.__audit, null, { timeout: 20000 });

const FPS = 30;
const resultat = await page.evaluate((FPS) => {
  const tl = window.__timelines.main;
  const A = window.__audit;
  const cadre = document.getElementById("cadre");
  const CARRE = { x0: 60, x1: 960, y0: 420, y1: 1500 };
  const inter = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const aire = (r) => Math.max(0, r.r - r.l) * Math.max(0, r.b - r.t);
  const versR = (d) => ({ l: d.left, t: d.top, r: d.right, b: d.bottom });
  const elements = [...document.querySelectorAll("[data-carton]")];
  const tailles = {};
  elements.forEach((el) => {
    tailles[el.dataset.carton] = tailles[el.dataset.carton] || [];
    tailles[el.dataset.carton].push(parseFloat(getComputedStyle(el).fontSize));
  });
  const nbImages = Math.round(A.duree * FPS);
  const precedent = new Map();
  const suivi = {}; // carton -> {texte, run, max, debutMax}
  const horsCarre = [];
  const horsCarreMouvement = new Set();
  const lignesParCarton = {};
  for (let f = 0; f <= nbImages; f++) {
    const t = Math.min(f / FPS, A.duree - 1e-4);
    tl.seek(t, false);
    const flouCadre = cadre.style.filter && cadre.style.filter !== "none";
    const etatCarton = {};
    elements.forEach((el) => {
      const sec = el.closest("section");
      const st = parseFloat(sec.dataset.start);
      const du = parseFloat(sec.dataset.duration);
      const cle = el.dataset.carton;
      if (!(cle in etatCarton)) etatCarton[cle] = { ok: true, present: false, textes: new Set() };
      etatCarton[cle].textes.add(el.dataset.texte);
      if (t < st || t >= st + du) {
        etatCarton[cle].ok = false;
        return;
      }
      let visible = true;
      let flou = flouCadre;
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.99 || cs.display === "none") visible = false;
        if (n.style.filter && n.style.filter !== "none") flou = true;
      }
      el.querySelectorAll("*").forEach((n) => {
        if (n.style && n.style.filter && n.style.filter !== "none") flou = true;
      });
      const unites = el.classList.contains("compteur") ? [el] : [...el.querySelectorAll(".ligne")];
      lignesParCarton[cle] = Math.max(lignesParCarton[cle] || 0, unites.length);
      let complet = true;
      let bouge = false;
      unites.forEach((u, i) => {
        const r = versR(u.getBoundingClientRect());
        let clip = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 };
        for (let a = u.parentElement; a && a.id !== "root"; a = a.parentElement) {
          if (getComputedStyle(a).overflow === "hidden") clip = inter(clip, versR(a.getBoundingClientRect()));
        }
        const v = inter(r, clip);
        const pleine = aire(v) >= 0.98 * aire(r);
        if (!pleine) complet = false;
        const id = cle + "|" + el.dataset.texte + "|" + i;
        const p = precedent.get(id);
        // La secousse caméra (8 px au plus) laisse le texte net : seuls les vrais déplacements comptent.
        if (p && (Math.abs(p.l - r.l) > 20 || Math.abs(p.t - r.t) > 20 || Math.abs(p.r - r.r) > 20)) bouge = true;
        precedent.set(id, r);
        const dansCadre = aire(inter(v, { l: 0, t: 0, r: 1080, b: 1920 })) > 0;
        if (!dansCadre) complet = false;
        if (visible && dansCadre) {
          const dehors = v.l < CARRE.x0 - 0.5 || v.r > CARRE.x1 + 0.5 || v.t < CARRE.y0 - 0.5 || v.b > CARRE.y1 + 0.5;
          if (dehors) {
            if (!bouge && !flou && pleine) horsCarre.push({ t: +t.toFixed(3), cle, r: [v.l, v.t, v.r, v.b].map(Math.round) });
            else horsCarreMouvement.add(cle);
          }
        }
      });
      etatCarton[cle].present = true;
      if (!(visible && complet && !flou && !bouge)) etatCarton[cle].ok = false;
    });
    Object.entries(etatCarton).forEach(([cle, e]) => {
      const s = (suivi[cle] = suivi[cle] || { textes: [...e.textes], run: 0, max: 0, fin: 0 });
      if (e.ok && e.present) {
        s.run += 1;
        if (s.run > s.max) {
          s.max = s.run;
          s.fin = t;
        }
      } else s.run = 0;
    });
  }
  // Lisibilité du 10 h de l'accroche
  const compteur = document.querySelector(".compteur");
  const lisibleA = (t) => {
    tl.seek(t, false);
    const flou = [...compteur.querySelectorAll("*")].some((n) => n.style.filter && n.style.filter !== "none");
    const pos = [...compteur.querySelectorAll(".bande")].map((b) => b.style.transform);
    return { t, flou, pos };
  };
  const dixH = [0.4, 0.5, 0.567].map(lisibleA);
  // Événements : départs de tweens, impacts, temps de la mosaïque
  const departs = tl
    .getChildren(false, true, false)
    .filter((c) => c.duration() < A.duree - 1)
    .map((c) => c.startTime());
  const evts = [...new Set([...departs, ...A.impacts, ...A.temps].map((t) => +t.toFixed(3)))]
    .filter((t) => t >= 0 && t <= A.tenue)
    .sort((a, b) => a - b);
  let ecartMax = 0;
  let ou = 0;
  [0, ...evts, A.tenue].reduce((a, b) => {
    if (b - a > ecartMax) {
      ecartMax = b - a;
      ou = a;
    }
    return b;
  });
  // Texte réellement affiché, regroupé par carton, dans l'ordre du document
  const rendus = {};
  document.querySelectorAll("[data-carton]").forEach((el) => {
    const txt = el.classList.contains("compteur")
      ? el.dataset.texte.replace(/[[\]]/g, "")
      : [...el.querySelectorAll(".ligne")].map((l) => l.textContent).join(" ");
    rendus[el.dataset.carton] = rendus[el.dataset.carton] ? rendus[el.dataset.carton] + " " + txt : txt;
  });
  const autres = [];
  const marcheur = document.createTreeWalker(document.getElementById("root"), NodeFilter.SHOW_TEXT);
  for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
    if (!n.textContent.trim()) continue;
    if (n.parentElement.closest("[data-carton]")) continue;
    autres.push(n.textContent.trim());
  }
  return { rendus: Object.values(rendus), autres, suivi, horsCarre, horsCarreMouvement: [...horsCarreMouvement], dixH, ecartMax, ou, tailles, lignesParCarton, duree: A.duree, tenue: A.tenue };
}, FPS);

await navigateur.close();
serveur.close();

const nu = (s) => s.replace(/[[\]]/g, "");
let echecs = 0;
const C = JSON.parse(await readFile(join(racine, "contenu.json"), "utf8"));
const attendus = [
  C.accroche.chiffre, C.accroche.texte, `${C.qui.nom} ${C.qui.role}`, C.qui.date, C.matin.heure, C.matin.texte,
  C.competences.titre, ...C.competences.liste, C.sixieme.texte, C.sixieme.ligne, C.soir.heure, C.soir.texte,
  C.resultat.intro, C.resultat.chiffre, C.suite.texte, C.fin.nom, C.fin.titre, C.fin.appel,
].map(nu);
const rendus = resultat.rendus;
const manquants = attendus.filter((a) => !rendus.includes(a));
const enTrop = rendus.filter((r) => !attendus.includes(r));
console.log(`Textes affichés identiques à contenu.json : ${manquants.length === 0 && enTrop.length === 0 ? "oui" : "non"} (${rendus.length} cartons)`);
manquants.forEach((m) => console.log("   manquant :", m));
enTrop.forEach((m) => console.log("   en trop  :", m));
const autres = [...new Set(resultat.autres)];
console.log(`Autre texte dans la page : ${autres.length ? autres.join(" ").slice(0, 120) : "aucun"} (les chiffres des rouleaux sont rattachés au compteur)`);
if (manquants.length || enTrop.length) echecs++;
console.log(`Durée composition : ${resultat.duree} s, tenue finale à partir de ${resultat.tenue} s\n`);
console.log("Lecture nette continue par carton (besoin = caractères / 15, 1 s minimum) :");
for (const [cle, s] of Object.entries(resultat.suivi)) {
  const texte = s.textes.map(nu).join(" ");
  const besoin = Math.max(1, texte.length / 15);
  const dispo = s.max / FPS;
  const ok = dispo + 1e-9 >= besoin;
  if (!ok) echecs++;
  const tailles = resultat.tailles[cle].map((x) => Math.round(x)).join("/");
  console.log(
    `  ${ok ? "OK " : "KO "} ${dispo.toFixed(2)} s ≥ ${besoin.toFixed(2)} s  [${tailles} px, ${resultat.lignesParCarton[cle]} l.]  « ${texte} »`,
  );
}
console.log(`\nTexte posé hors du carré 60–960 × 420–1500 : ${resultat.horsCarre.length} image(s)`);
resultat.horsCarre.slice(0, 12).forEach((h) => console.log("  ", JSON.stringify(h)));
if (resultat.horsCarre.length) echecs++;
console.log(`Cartons sortant du carré pendant un mouvement (whip, entrée) : ${resultat.horsCarreMouvement.length}`);
resultat.horsCarreMouvement.forEach((c) => console.log("   ", nu(c)));
console.log(`\nÉcart maximal entre deux événements visuels (hors tenue) : ${resultat.ecartMax.toFixed(3)} s, après t = ${resultat.ou.toFixed(2)} s`);
if (resultat.ecartMax > 0.5 + 1e-6) echecs++;
console.log("\n10 h de l'accroche :");
resultat.dixH.forEach((d) => console.log(`   t=${d.t}s flou=${d.flou} rouleaux=${d.pos.join(" | ")}`));
console.log(echecs ? `\n${echecs} critère(s) en échec` : "\nTous les critères audités sont tenus");
process.exit(echecs ? 1 : 0);
