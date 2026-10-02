// Constantes partagées par toutes les scènes.

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const TOTAL = 1920;

export const C = {
  bg: "#16100E",
  bordeaux: "#6E1A2C",
  bordeaux2: "#8E2740",
  ocre: "#C8862A",
  ocre2: "#A96F14",
  white: "#FFFFFF",
  // Bruns et gris chauds pour le décor et les personnages
  ink: "#1E1512",
  n1: "#2A1F1C",
  n2: "#3A2C28",
  n3: "#4A3A34",
  n4: "#5A4640",
  n5: "#8C7A72",
  n6: "#CDBFB6",
  n7: "#D6CCC4",
  skyline: "#2A1418",
  wallDeep: "#1E1613",
  skinElle: "#D9A07A",
  skinElleShade: "#C48A66",
  skinMoi: "#C08463",
  skinMoiShade: "#A86F51",
  hairElle: "#2E1B17",
  hairMoi: "#4A3026",
  mouth: "#3A1A1E",
} as const;

// Début et fin nominaux de chaque scène (en images, 60 i/s).
// pre et post : images de recouvrement pour les raccords.
export type SceneTiming = {
  start: number;
  end: number;
  pre: number;
  post: number;
};

export const SCENES = {
  route: { start: 0, end: 240, pre: 0, post: 0 },
  notes: { start: 240, end: 450, pre: 45, post: 0 },
  regle: { start: 450, end: 660, pre: 0, post: 0 },
  ordi: { start: 660, end: 900, pre: 0, post: 12 },
  questions: { start: 900, end: 1140, pre: 34, post: 0 },
  reponses: { start: 1140, end: 1380, pre: 0, post: 0 },
  joie: { start: 1380, end: 1560, pre: 0, post: 30 },
  dixh: { start: 1560, end: 1800, pre: 22, post: 30 },
  signature: { start: 1800, end: 1920, pre: 0, post: 0 },
} satisfies Record<string, SceneTiming>;

export type SceneKey = keyof typeof SCENES;

export const sceneLength = (k: SceneKey) =>
  SCENES[k].end - SCENES[k].start + SCENES[k].pre + SCENES[k].post;

// Fenêtres de flou de mouvement (images globales, fin exclue)
export const BLUR_WINDOWS: [number, number][] = [
  [10, 56],
  [216, 240],
  [424, 450],
  [462, 482],
  [634, 660],
  [866, 908],
  [1222, 1262],
  [1366, 1400],
  [1408, 1500],
  [1538, 1584],
  [1606, 1694],
  [1786, 1826],
];
