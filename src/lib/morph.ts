import { getLength, getPointAtLength } from "@remotion/paths";
import { lerp, poly } from "./anim";

type Pt = [number, number];

const cache = new Map<string, Pt[]>();

// Échantillonne un chemin SVG en n points régulièrement espacés
export const samplePath = (d: string, n = 96): Pt[] => {
  const key = `${n}|${d}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const len = getLength(d);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = getPointAtLength(d, (len * i) / (n - 1));
    pts.push(p ? [p.x, p.y] : [0, 0]);
  }
  cache.set(key, pts);
  return pts;
};

// Morph point à point entre deux tracés (transformés au préalable)
export const morphPts = (a: Pt[], b: Pt[], t: number): Pt[] =>
  a.map((p, i) => [lerp(p[0], b[i][0], t), lerp(p[1], b[i][1], t)]);

export const morphPath = (a: string, b: string, t: number, n = 96) =>
  poly(morphPts(samplePath(a, n), samplePath(b, n), t));

// Applique échelle et translation à une liste de points
export const placePts = (pts: Pt[], x: number, y: number, s: number, rot = 0): Pt[] => {
  const c = Math.cos((rot * Math.PI) / 180);
  const si = Math.sin((rot * Math.PI) / 180);
  return pts.map(([px, py]) => [x + (px * c - py * si) * s, y + (px * si + py * c) * s]);
};

// Glyphes tracés d'un seul trait, dessinés dans une boîte d'environ 100 × 100 centrée
export const GLYPH = {
  question: "M -24,-30 C -24,-58 26,-62 26,-32 C 26,-12 2,-10 2,14",
  check: "M -34,-2 L -10,24 L 36,-30",
  wrench:
    "M -38,40 L 4,-2 C -6,-26 10,-50 34,-46 L 18,-30 L 22,-18 L 34,-14 L 50,-30 C 54,-6 30,10 6,0",
};
export const QUESTION_DOT: Pt = [2, 38];
