// Film « Coulisses » : 22 s en 1080 × 1350 (4:5), 60 i/s, 120 BPM (un temps = 30 images).

export const W = 1080;
export const H = 1350;
export const FPS = 60;
export const TOTAL = 1320; // 20 s de film, puis 2 s de signature tenue pour la fin de la voix off
export const BEAT = 30;
export const M = 80; // marge latérale

// Couleurs propres à ce film, en plus de la palette C du film précédent
export const K = {
  code: "#120D0B",
  panel: "#1F1714",
  panel2: "#2A1F1C",
  rule: "#3A2C28",
  kw: "#E07A93",
  str: "#E8AB52",
  id: "#F4ECE6",
  dim: "#8C7A72",
  attr: "#CDBFB6",
  del: "#5A1726",
  add: "#4A3412",
};

// Couleurs d'entreprise fictives pour la scène « aux couleurs de la maison »
export const PAL = {
  offre: { a: "#123A5A", b: "#F2B33D" },
  recrut: { a: "#0F4C45", b: "#FF7A59" },
};

// Fenêtres de séquence, en images globales
export const SEQ = {
  accroche: { from: 0, to: 160 },
  entrees: { from: 104, to: 340 },
  studio: { from: 262, to: 952 },
  fin: { from: 926, to: 1320 },
};

// Temps forts partagés entre scènes et bande son
export const T = {
  impactCode: 90,
  zoom: { start: 116, end: 152 },
  chips: [186, 201, 216, 231],
  enter: 240,
  grow: { start: 296, end: 328 },
  render: 420,
  drop: 480,
  cuts: [480, 510, 540, 570],
  pause: 600,
  check: 700,
  resume: 720,
  swaps: [750, 840],
  sweep: { start: 928, end: 948 },
  words: [944, 952, 960, 968, 972, 976, 986],
  curtain: { start: 1062, end: 1082 },
  final: 1080,
};

// Flou de mouvement sur les mouvements rapides (images globales, fin exclue).
// Pas de fenêtre sur la scène des cartes ni sur l'ouverture de l'éditeur : le flou HtmlInCanvas
// y perd des calques (vérifié image par image), les cartes ont leur propre traînée.
export const BLUR: [number, number][] = [
  [116, 154],
  [420, 470],
  [744, 762],
  [834, 852],
  [926, 950],
  [1062, 1088],
];
