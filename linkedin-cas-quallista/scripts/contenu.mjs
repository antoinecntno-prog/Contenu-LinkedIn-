// Lit contenu.json, calcule la durée de chaque scène et injecte le tout dans index.html.
// La composition lit ses textes uniquement dans le bloc injecté, jamais dans le HTML.
// Usage : node scripts/contenu.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const contenu = JSON.parse(readFileSync(join(racine, "contenu.json"), "utf8"));

const VITESSE = 15; // caractères lus par seconde
const MARGE_SORTIE = 0.15; // le texte doit être lu avant le whip de sortie
const TENUE_FINALE = 2;
const GRILLE = 0.5; // 120 BPM : un temps toutes les 0,5 s

const nu = (s) => s.replace(/[[\]]/g, "");
const lecture = (s) => Math.max(1, nu(s).length / VITESSE);

// Instant (local à la scène) où chaque carton a fini d'entrer. Ces valeurs suivent
// la chorégraphie écrite dans index.html.
const c = contenu;
const n = c.competences.liste.length;
const pasLignes = Math.min(1.25, 6 / Math.max(1, n));
const scenes = [
  { id: "s1", base: 4, cartons: [[0.45, c.accroche.chiffre], [1.1, c.accroche.texte]] },
  { id: "s2", base: 7, cartons: [[1.3, `${c.qui.nom} ${c.qui.role}`], [2.1, c.qui.date]] },
  { id: "s3", base: 4.5, cartons: [[0.85, c.matin.heure], [0.97, c.matin.texte]] },
  {
    id: "s4",
    base: 10,
    cartons: [[0.65, c.competences.titre], ...c.competences.liste.map((l, i) => [1.6 + i * pasLignes, l])],
  },
  { id: "s5", base: 5, cartons: [[0.55, c.sixieme.texte], [2.7, c.sixieme.ligne]] },
  { id: "s6", base: 3.5, cartons: [[1.35, c.soir.heure], [0.87, c.soir.texte]] },
  { id: "s7", base: 4, cartons: [[0.67, c.resultat.intro], [2.1, c.resultat.chiffre]] },
  { id: "s8", base: 3.5, cartons: [[0.54, c.suite.texte]] },
  { id: "s9", base: 7, cartons: [[0.67, c.fin.nom], [1.04, c.fin.titre], [1.75, c.fin.appel]], fin: true },
];

let t = 0;
const plan = scenes.map((s) => {
  const besoin = Math.max(
    ...s.cartons.map(([entree, texte]) => entree + lecture(texte) + (s.fin ? TENUE_FINALE : MARGE_SORTIE)),
  );
  let duree = Math.max(s.base, besoin);
  duree = Math.ceil(duree / GRILLE - 1e-9) * GRILLE;
  const sortie = { id: s.id, debut: t, duree };
  t += duree;
  return sortie;
});
const duree = t;

const bloc = JSON.stringify({ textes: contenu, plan: { duree, scenes: plan, pasLignes } })
  .replace(/</g, "\\u003c");

const cheminHtml = join(racine, "index.html");
let html = readFileSync(cheminHtml, "utf8");
html = html.replace(
  /<!-- contenu:debut -->[\s\S]*?<!-- contenu:fin -->/,
  `<!-- contenu:debut -->\n    <script id="contenu" type="application/json">${bloc}</script>\n    <!-- contenu:fin -->`,
);
html = html.replace(
  /(<div\s+id="root"[^>]*?data-duration=")[^"]*(")/,
  `$1${duree}$2`,
);
// Fenêtres des scènes : elles se chevauchent de 0,15 s de part et d'autre de chaque whip.
plan.forEach((s, i) => {
  const debut = i === 0 ? 0 : s.debut - 0.15;
  const fin = i === plan.length - 1 ? duree : s.debut + s.duree + 0.15;
  const re = new RegExp(`(<section\\s+id="${s.id}"[^>]*?data-start=")[^"]*("[^>]*?data-duration=")[^"]*(")`);
  html = html.replace(re, `$1${+debut.toFixed(3)}$2${+(fin - debut).toFixed(3)}$3`);
});
writeFileSync(cheminHtml, html);

console.log(`contenu.json injecté : ${plan.length} scènes, durée ${duree} s`);
for (const s of plan) console.log(`  ${s.id}  ${s.debut.toFixed(2)} → ${(s.debut + s.duree).toFixed(2)} s`);
