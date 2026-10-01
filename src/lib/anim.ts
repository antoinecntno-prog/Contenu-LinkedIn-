import { Easing, interpolate, random, spring } from "remotion";
import { FPS } from "../constants";

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const EIO = Easing.inOut(Easing.cubic);
export const EOUT = Easing.out(Easing.cubic);
export const EIN = Easing.in(Easing.cubic);
// Anticipation : recule avant de partir, dépasse avant de se poser
export const EANTIC = Easing.inOut(Easing.back(1.7));
export const EBACK = Easing.out(Easing.back(1.8));

// Interpolation bornée
export const ip = (
  f: number,
  input: number[],
  output: number[],
  easing?: (t: number) => number,
) =>
  interpolate(f, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Ressort avec léger dépassement, déclenché à l'image start
export const pop = (
  f: number,
  start: number,
  cfg: { damping?: number; stiffness?: number; mass?: number } = {},
) =>
  spring({
    frame: f - start,
    fps: FPS,
    config: { damping: 11, stiffness: 170, mass: 0.7, ...cfg },
  });

// Ressort amorti sans rebond
export const glide = (f: number, start: number, durationInFrames?: number) =>
  spring({
    frame: f - start,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames,
  });

// Dérive lente pour que la caméra ne s'arrête jamais
export const drift = (f: number, seed: number, amp: number, period = 140) =>
  amp *
  (Math.sin((f / period) * Math.PI * 2 + seed * 1.7) * 0.65 +
    Math.sin((f / (period * 0.53)) * Math.PI * 2 + seed * 3.1) * 0.35);

// Secousse décroissante après un impact
export const shake = (f: number, start: number, dur: number, amp: number, seed = 1) => {
  if (f < start || f > start + dur) return 0;
  const k = 1 - (f - start) / dur;
  return amp * k * k * (random(`shake-${seed}-${Math.floor(f)}`) * 2 - 1);
};

// Clignement d'yeux : 1 ouvert, 0.1 fermé. Intervalles pseudo aléatoires.
export const blink = (f: number, seed: number) => {
  const period = 118 + Math.floor(random(`blink-${seed}`) * 50);
  const offset = Math.floor(random(`blink-o-${seed}`) * period);
  const local = (Math.floor(f) + offset) % period;
  if (local < 2) return 0.45;
  if (local < 4) return 0.08;
  if (local < 6) return 0.5;
  return 1;
};

// Respiration : sinus lent
export const breath = (f: number, seed = 0) => Math.sin(f / 21 + seed);

// Progression en marches, pour l'effet papier découpé
export const stepped = (t: number, steps: number) =>
  Math.floor(clamp(t) * steps) / steps;

// Valeur tenue par paliers de n images
export const hold = (f: number, n: number) => Math.floor(f / n) * n;

export const rand = (key: string | number) => random(String(key));

// Chemin polyline à partir de points
export const poly = (pts: [number, number][]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");

// Interpolation exponentielle pour les zooms (perception régulière)
export const zoomLerp = (a: number, b: number, t: number) =>
  Math.exp(lerp(Math.log(a), Math.log(b), t));
