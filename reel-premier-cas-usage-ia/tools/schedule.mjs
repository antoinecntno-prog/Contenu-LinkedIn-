// Génère le minutage des cartons (scenes.json) à partir des textes et des règles de lecture.
// Règle : chaque carton reste lisible en entier au moins max(caractères / 15, 1,5) secondes.
import fs from "node:fs";

const FPS = 30;
const LINE_STAGGER = 0.08; // décalage entre lignes
const KW_GAP = 0.12;       // les mots clés partent après la dernière ligne
const KW_STAGGER = 0.07;   // entre deux groupes de mots clés
const KW_READ = 0.10;      // mot clé opaque et à plus de 95 % de sa taille
const LINE_READ = 0.15;    // ligne opaque
const SWAP_GAP = 2 / FPS;  // le carton suivant démarre 2 images après la sortie du précédent
const MARGIN = 1 / FPS;    // marge de sécurité sur chaque lecture
const FINAL_HOLD = 2.5;

// l = lignes ; [..] = mot clé ; size en px
const S = [
  { id: 1, cards: [
    { size: 100, first: true, lines: ["Votre premier", "projet IA commence", "avec un [stylo]", "et une [feuille]."] } ] },
  { id: 2, cards: [
    { size: 74, lines: ["Voici comment un comité", "de direction trouve", "son premier cas d’usage IA", "en [deux semaines]."] } ] },
  { id: 3, cards: [
    { size: 150, lines: ["[Première]", "[semaine]."] },
    { size: 74, lines: ["Chaque membre du Codir", "note les tâches qu’il", "[refait chaque semaine]."] },
    { size: 74, lines: ["Les comptes rendus", "de réunion,", "les relances de devis."] },
    { size: 74, lines: ["Et à côté de chaque tâche,", "le [temps] qu’elle lui prend."] } ] },
  { id: 4, cards: [
    { size: 74, lines: ["Au bout de sept jours,", "vous avez une liste."] },
    { size: 74, lines: ["Reste à choisir", "[la bonne tâche], et c’est là", "que tout se joue…"] } ] },
  { id: 5, cards: [
    { size: 74, lines: ["Pour chaque tâche,", "[deux questions]."] },
    { size: 74, lines: ["Combien d’[heures]", "par semaine elle coûte."] },
    { size: 74, lines: ["Et ce qui se passe", "si l’IA [se trompe]."] },
    { size: 72, lines: ["Vous gardez celle qui prend", "le plus de temps et dont", "une erreur se rattrape", "[en deux minutes]."] } ] },
  { id: 6, cards: [
    { size: 74, lines: ["Vous tenez", "votre cas d’usage."] },
    { size: 74, lines: ["Il reste l’étape qui décide", "si l’outil servira", "[encore dans trois mois]…"] } ] },
  { id: 7, cards: [
    { size: 150, lines: ["[Deuxième]", "[semaine]."] },
    { size: 74, lines: ["La personne qui fait", "cette tâche au quotidien", "[teste l’outil elle-même]."] },
    { size: 74, lines: ["Elle chronomètre la tâche", "[à la main], puis", "[avec l’outil]."] },
    { size: 74, lines: ["Elle ramène ce [chiffre]", "au Codir, et c’est lui", "qui décide de la suite."] } ] },
  { id: 8, cards: [
    { size: 74, lines: ["Je vous envoie la grille", "de tri en deux questions."] },
    { size: 100, cta: true, lines: ["Écrivez", "[GRILLE]", "en commentaire."] } ] },
];

const q = (t) => Math.round(t * FPS) / FPS; // cale sur l'image
const plain = (l) => l.replace(/[\[\]]/g, "");

// Lignes qui portent un mot clé, dans l'ordre (un groupe par paire de crochets)
function kwGroups(lines) {
  let n = 0;
  lines.forEach((l) => (n += (l.match(/\[/g) || []).length));
  return n;
}

// Délai entre l'entrée du carton et sa lisibilité complète
function readableOffset(card) {
  const n = card.lines.length;
  const first = card.first ? 1 : 0; // la ligne 1 de l'accroche est déjà posée à t=0
  const lastLineStart = (n - 1 - first) * LINE_STAGGER;
  const g = kwGroups(card.lines);
  if (g === 0) return lastLineStart + LINE_READ;
  return lastLineStart + KW_GAP + (g - 1) * KW_STAGGER + KW_READ;
}

let t = 0;
const out = { fps: FPS, consts: { LINE_STAGGER, KW_GAP, KW_STAGGER, KW_READ, LINE_READ, SWAP_GAP }, scenes: [] };
for (const sc of S) {
  const scene = { id: sc.id, start: q(t), cards: [] };
  for (const c of sc.cards) {
    const text = c.lines.map(plain).join(" ");
    const need = Math.max(text.length / 15, 1.5);
    const tIn = q(t);
    const readable = tIn + readableOffset(c);
    const isLast = sc.id === 8 && c === sc.cards[sc.cards.length - 1];
    const hold = isLast ? Math.max(need, FINAL_HOLD) : need + MARGIN;
    // la fin de la vidéo tombe sur un dixième de seconde rond (nombre d'images exact)
    const tOut = isLast ? Math.ceil((readable + hold) * 10 - 1e-6) / 10 : Math.ceil((readable + hold) * FPS - 1e-6) / FPS;
    scene.cards.push({ ...c, text, chars: text.length, need: +need.toFixed(3), tIn: +tIn.toFixed(4), readable: +readable.toFixed(4), tOut: +tOut.toFixed(4) });
    t = isLast ? tOut : tOut + SWAP_GAP;
  }
  scene.end = q(t);
  out.scenes.push(scene);
}
out.duration = q(t);
fs.writeFileSync(new URL("../scenes.json", import.meta.url), JSON.stringify(out, null, 1));
for (const s of out.scenes) {
  console.log(`scene ${s.id}  ${s.start.toFixed(2)} → ${s.end.toFixed(2)}  (${(s.end - s.start).toFixed(2)} s)`);
  for (const c of s.cards) console.log(`   in ${c.tIn.toFixed(2)} lisible ${c.readable.toFixed(2)} out ${c.tOut.toFixed(2)}  tenue ${(c.tOut - c.readable).toFixed(2)} ≥ ${c.need}  « ${c.text} »`);
}
console.log("durée totale", out.duration, "s =", Math.round(out.duration * FPS), "images");
