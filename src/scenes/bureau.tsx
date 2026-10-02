// Décor et logique partagés par les scènes 5 à 7 (bureau vu de face).
// Les fonctions prennent l'image globale, pour que les raccords entre scènes tombent juste.
import React from "react";
import { C } from "../constants";
import { TITLE } from "../fonts";
import { Cam } from "../lib/camera";
import { EIO, EIN, EOUT, drift, ip, lerp, pop, rand, shake, zoomLerp, clamp } from "../lib/anim";
import { GLYPH, QUESTION_DOT, morphPts, placePts, samplePath } from "../lib/morph";

export const ELLE = { x: 640, y: 930, s: 1.25 };
export const TABLE_Y = 862;
export const LAPTOP = { x: 1970, y: 380, w: 720, h: 440 };

// Calage global (images)
export const T5 = 900; // début scène 5
export const FREEZE = 1092; // ma main gèle les bulles
export const T6 = 1140;
export const FLIP0 = 1150; // première bascule ? vers coche
export const FLIP_STEP = 9;
export const FLY = { start: 1222, dur: 30, stagger: 2 };
export const MERGE = 1262; // les coches deviennent une clé
export const SHOT = { start: 1352, end: 1384 }; // trait ocre vers elle
export const T7 = 1380;
export const JUMP = { crouch: 1396, launch: 1410, apex: 1450, land: 1490, hop: 1514 };

export type BubbleDef = { x: number; y: number; r: number; t: number };
export const BUBBLES: BubbleDef[] = [
  { x: 430, y: 330, r: 68, t: 4 },
  { x: 860, y: 300, r: 62, t: 20 },
  { x: 290, y: 190, r: 56, t: 44 },
  { x: 640, y: 196, r: 70, t: 64 },
  { x: 330, y: 520, r: 54, t: 100 },
  { x: 470, y: 76, r: 50, t: 114 },
  { x: 150, y: 370, r: 50, t: 127 },
  { x: 800, y: 64, r: 46, t: 139 },
];
export const BIG = { x: 1400, y: 300, w: 820, h: 290, t: 84 };

// Pile : chaque nouvelle bulle pousse les précédentes vers le haut
const stackOffset = (i: number, g: number) => {
  let off = 0;
  for (let j = i + 1; j < BUBBLES.length; j++) {
    off -= 12 * pop(Math.min(g, FREEZE), T5 + BUBBLES[j].t, { damping: 12 });
  }
  off -= 10 * pop(Math.min(g, FREEZE), T5 + BIG.t, { damping: 12 });
  return off;
};

export const tremble = (g: number) => (g >= FREEZE ? 0 : ip(g, [T5 + 60, FREEZE - 2], [0, 7], EIN));

// Position d'une bulle à l'image g (avant l'envol)
export const bubblePos = (i: number, g: number): [number, number] => {
  const b = BUBBLES[i];
  const a = tremble(g);
  const tx = Math.sin(g * 1.9 + i * 2.1) * a;
  const ty = Math.cos(g * 2.3 + i * 1.3) * a + stackOffset(i, g);
  return [b.x + tx, b.y + ty];
};

export const bubbleScale = (i: number, g: number) => pop(g, T5 + BUBBLES[i].t, { damping: 9, stiffness: 190, mass: 0.6 });

// Bascule ? → coche
export const flipT = (i: number, g: number) => ip(g, [FLIP0 + i * FLIP_STEP, FLIP0 + i * FLIP_STEP + 6], [0, 1], EIO);

// Envol des coches vers l'écran
export const flyT = (i: number, g: number) =>
  ip(g, [FLY.start + i * FLY.stagger, FLY.start + i * FLY.stagger + FLY.dur], [0, 1], EIO);

export const TOOL = { x: LAPTOP.x + 150, y: LAPTOP.y + 150 };

// Caméra continue de 866 à 1600
export const camBureau = (g: number): Cam => {
  // scène 5 : entre en pivotant puis avance en tremblant avec la pile
  const enter = ip(g, [866, 912], [0, 1], EIO);
  const push5 = ip(g, [900, 1140], [0, 1], EIO);
  const tr = tremble(g) * 0.8;
  let x = 880 + drift(g, 61, 10) + Math.sin(g * 2.7) * tr;
  let y = 400 + drift(g, 62, 7) + Math.cos(g * 3.1) * tr;
  let zoom = lerp(1.14, 1, enter) * lerp(1, 1.05, push5);
  let rot = lerp(3.5, 0, enter) + drift(g, 63, 0.5);

  // scène 6 : recul et glissement vers l'ordinateur, puis avancée sur l'écran
  const toWide = ip(g, [FLY.start - 2, FLY.start + 38], [0, 1], EIO);
  x = lerp(x, 1560, toWide);
  y = lerp(y, 560, toWide);
  zoom = zoomLerp(zoom, 0.7, toWide);
  const toScreen = ip(g, [MERGE - 6, MERGE + 36], [0, 1], EIO);
  x = lerp(x, LAPTOP.x + LAPTOP.w / 2, toScreen);
  y = lerp(y, LAPTOP.y + LAPTOP.h / 2 + 10, toScreen);
  zoom = zoomLerp(zoom, 1.32, toScreen) * lerp(1, 1.05, ip(g, [MERGE + 36, SHOT.start], [0, 1], EIO));

  // fin de scène 6 : panoramique filé vers elle
  const whip = ip(g, [SHOT.start + 12, SHOT.end + 14], [0, 1], EIO);
  x = lerp(x, 700, whip);
  y = lerp(y, 560, whip);
  zoom = zoomLerp(zoom, 1.06, whip);
  rot = lerp(rot, drift(g, 64, 0.6), ip(g, [FLY.start, FLY.start + 30], [0, 1]));

  // scène 7 : suit le saut, secousse à l'atterrissage
  const up = ip(g, [JUMP.launch, JUMP.apex], [0, 1], EOUT) * ip(g, [JUMP.apex + 6, JUMP.land], [1, 0], EIN);
  y -= up * 150;
  zoom *= lerp(1, 1.06, ip(g, [JUMP.crouch, 1560], [0, 1], EIO));
  x += shake(g, JUMP.land, 14, 14, 71);
  y += shake(g, JUMP.land, 14, 12, 72);
  return { x, y, zoom, rot };
};

// Mur du fond et ses objets
export const BackWall: React.FC<{ g: number }> = ({ g }) => (
  <g>
    <rect x={60} y={110} width={520} height={520} rx={8} fill={C.n2} />
    <rect x={80} y={130} width={480} height={480} fill="#2A1418" />
    {[[120, 330, 120], [250, 260, 190], [400, 300, 150]].map(([bx, bh, bw], i) => (
      <rect key={i} x={bx} y={610 - bh} width={bw} height={bh} fill={C.skyline} />
    ))}
    <rect x={312} y={130} width={16} height={480} fill={C.n2} />
    <rect x={80} y={362} width={480} height={16} fill={C.n2} />
    <g transform={`rotate(${Math.sin(g / 36) * 3}, 1300, -120)`}>
      <path d="M 1300,-120 L 1300,96" stroke={C.n3} strokeWidth={5} />
      <path d="M 1244,140 Q 1248,94 1300,92 Q 1352,94 1356,140 Z" fill={C.bordeaux} />
      <ellipse cx={1300} cy={142} rx={30} ry={8} fill="#F3C98A" />
    </g>
    <rect x={1640} y={330} width={640} height={16} rx={4} fill={C.n3} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <rect
        key={i}
        x={1670 + i * 46 + (i > 4 ? 60 : 0)}
        y={330 - 90 - (i % 3) * 14}
        width={36}
        height={90 + (i % 3) * 14}
        rx={4}
        fill={[C.bordeaux, C.n4, C.bordeaux2, C.n3][i % 4]}
        transform={i === 6 ? `rotate(-14, ${1670 + i * 46 + 60}, 330)` : undefined}
      />
    ))}
  </g>
);

export const Chair: React.FC = () => (
  <g>
    <rect x={ELLE.x - 140} y={560} width={280} height={360} rx={40} fill={C.n3} />
    <rect x={ELLE.x - 120} y={580} width={240} height={300} rx={30} fill={C.n4} />
  </g>
);

export const Table: React.FC = () => (
  <g>
    <rect x={-900} y={TABLE_Y} width={4800} height={40} fill={C.n3} />
    <rect x={-900} y={TABLE_Y + 40} width={4800} height={900} fill={C.n2} />
  </g>
);

export const Mug: React.FC<{ g: number; x?: number }> = ({ g, x = 1060 }) => {
  const steam = (i: number) => {
    const ph = ((g + i * 22) % 66) / 66;
    return { x: x + 6 + i * 14 + Math.sin(ph * 6 + i) * 10, y: TABLE_Y - 80 - ph * 120, o: Math.sin(ph * Math.PI) * 0.55 };
  };
  return (
    <g>
      <path d={`M ${x + 62},${TABLE_Y - 62} C ${x + 92},${TABLE_Y - 62} ${x + 92},${TABLE_Y - 22} ${x + 62},${TABLE_Y - 22}`} stroke={C.n6} strokeWidth={9} fill="none" />
      <rect x={x} y={TABLE_Y - 80} width={66} height={80} rx={10} fill={C.n6} />
      <ellipse cx={x + 33} cy={TABLE_Y - 78} rx={33} ry={8} fill={C.n1} />
      {[0, 1, 2].map((i) => {
        const s = steam(i);
        return <path key={i} d={`M ${s.x},${s.y} q 12,-18 0,-36 q -12,-18 0,-36`} stroke={C.n6} strokeWidth={6} strokeLinecap="round" fill="none" opacity={s.o} />;
      })}
    </g>
  );
};

// Ordinateur de face, à droite de la table
export const Laptop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <g>
    <rect x={LAPTOP.x - 20} y={LAPTOP.y - 20} width={LAPTOP.w + 40} height={LAPTOP.h + 40} rx={18} fill={C.n1} />
    <rect x={LAPTOP.x} y={LAPTOP.y} width={LAPTOP.w} height={LAPTOP.h} fill={C.bordeaux} />
    <rect x={LAPTOP.x + 24} y={LAPTOP.y + 22} width={LAPTOP.w - 48} height={LAPTOP.h - 44} rx={14} fill={C.white} opacity={0.94} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={LAPTOP.x + 60 + (i % 2) * 220} y={LAPTOP.y + 70 + i * 70} width={[360, 300, 380, 220][i]} height={16} rx={8} fill={C.n6} />
    ))}
    <path d={`M ${LAPTOP.x - 30},${LAPTOP.y + LAPTOP.h + 20} L ${LAPTOP.x + LAPTOP.w + 30},${LAPTOP.y + LAPTOP.h + 20} L ${LAPTOP.x + LAPTOP.w + 70},${TABLE_Y + 10} L ${LAPTOP.x - 70},${TABLE_Y + 10} Z`} fill={C.n1} />
    {children}
  </g>
);

// Bulle de question : cercle blanc tourné vers sa tête, glyphe ocre au centre
export const Bubble: React.FC<{
  x: number;
  y: number;
  r: number;
  scale: number;
  glyph: [number, number][];
  dot: number;
  strokeW: number;
  glyphOpacity?: number;
}> = ({ x, y, r, scale, glyph, dot, strokeW, glyphOpacity = 1 }) => {
  const hx = ELLE.x - x;
  const hy = ELLE.y - 300 - y;
  const ang = Math.atan2(hy, hx);
  const tail = [
    [x + Math.cos(ang - 0.35) * r * 0.9, y + Math.sin(ang - 0.35) * r * 0.9],
    [x + Math.cos(ang) * r * 1.35, y + Math.sin(ang) * r * 1.35],
    [x + Math.cos(ang + 0.35) * r * 0.9, y + Math.sin(ang + 0.35) * r * 0.9],
  ];
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`}>
      <path d={`M ${tail[0][0]},${tail[0][1]} L ${tail[1][0]},${tail[1][1]} L ${tail[2][0]},${tail[2][1]} Z`} fill={C.white} />
      <circle cx={x} cy={y} r={r} fill={C.white} />
      <path
        d={glyph.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}
        stroke={C.ocre}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={glyphOpacity}
      />
      {dot > 0.01 && (
        <circle cx={x + QUESTION_DOT[0] * (r / 62)} cy={y + QUESTION_DOT[1] * (r / 62)} r={strokeW * 0.62 * dot} fill={C.ocre} opacity={glyphOpacity} />
      )}
    </g>
  );
};

export const QPTS = samplePath(GLYPH.question, 64);
export const CHECKPTS = samplePath(GLYPH.check, 64);
export const WRENCHPTS = samplePath(GLYPH.wrench, 64);
export const glyphAt = (i: number, g: number, x: number, y: number) => {
  const b = BUBBLES[i];
  const t = flipT(i, g);
  return placePts(morphPts(QPTS, CHECKPTS, t), x, y, b.r / 62);
};

// Grosse bulle portant le texte de la scène 5
export const BigBubble: React.FC<{ g: number }> = ({ g }) => {
  const k = pop(g, T5 + BIG.t, { damping: 10, stiffness: 170, mass: 0.7 });
  const deflate = ip(g, [T6, T6 + 4, T6 + 12], [1, 1.08, 0], EIO);
  const s = k * deflate;
  if (s <= 0.001) return null;
  const a = tremble(g);
  const ox = Math.sin(g * 1.7) * a * 0.6;
  const oy = Math.cos(g * 2.1) * a * 0.6 + stackOffsetBig(g);
  return (
    <g transform={`translate(${BIG.x + ox}, ${BIG.y + oy}) scale(${s})`}>
      <path d={`M ${-BIG.w / 2 + 70},${BIG.h / 2 - 30} L ${-BIG.w / 2 - 170},${BIG.h / 2 + 76} L ${-BIG.w / 2 + 200},${BIG.h / 2 - 10} Z`} fill={C.white} />
      <rect x={-BIG.w / 2} y={-BIG.h / 2} width={BIG.w} height={BIG.h} rx={60} fill={C.white} />
      <foreignObject x={-BIG.w / 2} y={-BIG.h / 2} width={BIG.w} height={BIG.h}>
        <div
          style={{
            width: BIG.w,
            height: BIG.h,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: TITLE,
            fontWeight: 800,
            fontSize: 88,
            lineHeight: 1.04,
            letterSpacing: -2,
            color: C.bordeaux,
          }}
        >
          <div>Ses questions,</div>
          <div>une par une.</div>
        </div>
      </foreignObject>
    </g>
  );
};

const stackOffsetBig = (g: number) => {
  let off = 0;
  BUBBLES.forEach((b) => {
    if (b.t > BIG.t) off -= 8 * pop(Math.min(g, FREEZE), T5 + b.t, { damping: 12 });
  });
  return off;
};

// Main au premier plan (la mienne), en coordonnées écran
export const HandFG: React.FC<{ x: number; y: number; rot: number; shape: "open" | "point"; scale?: number }> = ({
  x,
  y,
  rot,
  shape,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`}>
    <path d="M -70,40 L 70,40 L 150,700 L -150,700 Z" fill="#C2B5AB" />
    <rect x={-78} y={20} width={156} height={60} rx={14} fill={C.n6} />
    <rect x={-62} y={-130} width={124} height={160} rx={46} fill={C.skinMoi} />
    {shape === "open" ? (
      <g fill={C.skinMoi}>
        <rect x={-62} y={-226} width={30} height={120} rx={15} />
        <rect x={-30} y={-252} width={30} height={140} rx={15} />
        <rect x={2} y={-246} width={30} height={134} rx={15} />
        <rect x={34} y={-214} width={28} height={110} rx={14} />
        <rect x={-120} y={-92} width={30} height={96} rx={15} transform="rotate(-38, -105, -44)" />
      </g>
    ) : (
      <g fill={C.skinMoi}>
        {/* index tendu, côté pouce ; les trois autres doigts repliés */}
        <rect x={-62} y={-264} width={32} height={152} rx={16} />
        <rect x={-28} y={-152} width={30} height={50} rx={15} fill={C.skinMoiShade} />
        <rect x={4} y={-148} width={30} height={48} rx={15} fill={C.skinMoiShade} />
        <rect x={36} y={-138} width={26} height={42} rx={13} fill={C.skinMoiShade} />
        <rect x={-112} y={-86} width={30} height={86} rx={15} transform="rotate(-50, -97, -43)" />
      </g>
    )}
    <path d="M -40,-40 Q 0,-30 40,-40" stroke={C.skinMoiShade} strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

// Confettis du saut : position monde à l'image g
export type Confetto = { x: number; y: number; rot: number; flip: number; color: string; w: number; h: number; kind: "b" | "o" };
const N_CONF = 84;
const CONF = Array.from({ length: N_CONF }, (_, i) => {
  const burst = i < 56;
  const ang = -Math.PI / 2 + (i % 2 ? 1 : -1) * (0.25 + rand(`ca${i}`) * 1.1);
  const sp = 10 + rand(`cs${i}`) * 16;
  const color = [C.bordeaux, C.bordeaux2, C.ocre, C.ocre2][i % 4];
  return {
    burst,
    t0: burst ? JUMP.launch + 24 + (i % 5) : JUMP.launch + 22 + rand(`ct${i}`) * 40,
    x0: burst ? ELLE.x + (i % 2 ? 1 : -1) * (150 + rand(`cx${i}`) * 90) : ELLE.x - 900 + rand(`cx${i}`) * 1800,
    y0: burst ? 120 + rand(`cy${i}`) * 60 : -460 - rand(`cy${i}`) * 300,
    vx: burst ? Math.cos(ang) * sp : (rand(`cvx${i}`) - 0.5) * 3,
    vy: burst ? Math.sin(ang) * sp : 2 + rand(`cvy${i}`) * 3,
    spin: (rand(`cr${i}`) - 0.5) * 30,
    flipSp: 0.12 + rand(`cf${i}`) * 0.2,
    color,
    kind: (i % 4 < 2 ? "b" : "o") as "b" | "o",
    w: 16 + rand(`cw${i}`) * 12,
    h: 9 + rand(`chh${i}`) * 6,
  };
});

export const confettiAt = (g: number): (Confetto | null)[] =>
  CONF.map((c, i) => {
    const t = g - c.t0;
    if (t < 0) return null;
    const drag = 0.94;
    const k = (1 - Math.pow(drag, t)) / (1 - drag);
    const vT = 5.5;
    const grav = 0.42;
    // chute freinée : vitesse verticale bornée par une vitesse limite
    const tc = Math.max(0, (vT - c.vy) / grav);
    const y =
      t < tc ? c.y0 + c.vy * t + 0.5 * grav * t * t : c.y0 + c.vy * tc + 0.5 * grav * tc * tc + vT * (t - tc);
    const x = c.x0 + c.vx * k + Math.sin(t * 0.08 + i) * 26 * clamp(t / 40);
    return {
      x,
      y,
      rot: c.spin * t * 0.3 + i * 37,
      flip: Math.cos(t * c.flipSp * Math.PI + i),
      color: c.color,
      w: c.w,
      h: c.h,
      kind: c.kind,
    };
  });

export const CONF_HANDOFF = 1538;
