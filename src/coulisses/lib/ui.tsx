import React from "react";
import { Sequence, random, useCurrentFrame } from "remotion";
import { C } from "../../constants";
import { Film } from "../../JourneeFormation";
import { pop } from "../../lib/anim";
import { H, W } from "../constants";

// Grain de pellicule et vignettage, posés sur tout le film
export const Grain: React.FC<{ g: number; opacity?: number }> = ({ g, opacity = 0.09 }) => {
  const seed = Math.floor(g / 2) % 97;
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity }}>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter={`url(#grain-${seed})`} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)",
        }}
      />
    </>
  );
};

// Le film précédent, figé sur l'image demandée et ramené à la largeur w
export const OldFilm: React.FC<{ frame: number; w: number; zoom?: number; zx?: number; zy?: number }> = ({
  frame,
  w,
  zoom = 1,
  zx = 960,
  zy = 540,
}) => {
  const s = w / 1920;
  // Décalage de séquence : le film voit exactement l'image demandée, quelle que soit la séquence parente
  const lf = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        transformOrigin: "0 0",
        transform: `scale(${s}) translate(${zx}px, ${zy}px) scale(${zoom}) translate(${-zx}px, ${-zy}px)`,
      }}
    >
      <Sequence from={lf - Math.max(0, Math.min(1919, Math.round(frame)))} layout="none">
        <Film />
      </Sequence>
    </div>
  );
};

// Ligne masquée : son contenu monte depuis le bas du masque (t de 0 à 1), sort par le haut (u de 0 à 1)
export const MaskLine: React.FC<{
  t: number;
  u?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ t, u = 0, style, children }) => (
  <div style={{ overflow: "hidden", padding: "0.12em 0.1em 0.18em 0", margin: "-0.12em 0 -0.18em 0", ...style }}>
    <div style={{ transform: `translateY(${(1 - t) * 140 - u * 140}%)`, whiteSpace: "pre" }}>{children}</div>
  </div>
);

// Lettres qui montent une à une derrière un masque, avec ressort
export const Letters: React.FC<{
  text: string;
  g: number;
  start: number;
  stagger?: number;
  exit?: number;
  style?: React.CSSProperties;
  color?: (i: number) => string | undefined;
}> = ({ text, g, start, stagger = 1.3, exit, style, color }) => {
  const chars = Array.from(text);
  return (
    <div style={{ display: "flex", whiteSpace: "pre", ...style }}>
      {chars.map((ch, i) => {
        const k = pop(g, start + i * stagger, { damping: 12, stiffness: 200, mass: 0.6 });
        const out = exit === undefined ? 0 : Math.max(0, Math.min(1, (g - exit - i * 0.8) / 10));
        const outE = out * out * out;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              padding: "0.12em 0 0.2em",
              margin: "-0.12em 0 -0.2em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - k) * 140 - outE * 140}%) rotate(${(1 - k) * 8}deg)`,
                color: color?.(i),
              }}
            >
              {ch === " " ? " " : ch}
            </span>
          </span>
        );
      })}
    </div>
  );
};

// Caret qui clignote au temps (allumé pendant la première moitié de chaque temps)
export const caretOn = (g: number, solidUntil = -1) => g < solidUntil || Math.floor(g / 15) % 2 === 0;

export const rnd = (k: string | number) => random(`co-${k}`);

export const Panel: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      position: "absolute",
      background: C.bg,
      borderRadius: 30,
      overflow: "hidden",
      boxShadow: "0 40px 90px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);
