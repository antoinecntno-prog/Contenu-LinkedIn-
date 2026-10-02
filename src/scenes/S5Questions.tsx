import React from "react";
import { useCurrentFrame } from "remotion";
import { C, SCENES, W } from "../constants";
import { Camera, Layer, WorldSvg, worldToScreen } from "../lib/camera";
import { Character, poseAt, Mouth } from "../lib/Character";
import { EIO, blink, breath, drift, hold, ip, lerp, pop, poly } from "../lib/anim";
import { placePts, samplePath } from "../lib/morph";
import { hingeScreen, whipOffset, WHIP } from "./S4Ordinateur";
import {
  BUBBLES,
  BackWall,
  BigBubble,
  Bubble,
  Chair,
  ELLE,
  FREEZE,
  HandFG,
  Laptop,
  Mug,
  QPTS,
  Table,
  bubblePos,
  bubbleScale,
  camBureau,
} from "./bureau";

const START = SCENES.questions.start - SCENES.questions.pre;

export const ELLE_KEYS = [
  { f: 860, p: { aL: 18, eL: -95, aR: 18, eR: -95, head: -3, turn: -0.1 } },
  { f: 922, p: { head: -7, turn: 0.15 } },
  { f: 958, p: { aR: 158, eR: 30, head: 6, turn: -0.2 } },
  { f: 1096, p: { head: -4, turn: 0.6 } },
  { f: 1112, p: { aR: 18, eR: -95 } },
];

export const elleMouth5 = (g: number): Mouth => {
  if (g < 924) return "neutral";
  if (g < 942) return "o";
  if (g < 1095) return "puzzled";
  return "o";
};

// Ma main : anticipation vers le bas, puis lever rapide
export const handRaise = (g: number) => {
  const dip = ip(g, [1068, 1076], [0, 1], EIO);
  const up = g < 1078 ? 0 : pop(g, 1078, { damping: 11, stiffness: 200, mass: 0.7 });
  return {
    x: lerp(lerp(1720, 1740, dip), 1560, up) + drift(g, 81, 6, 80),
    y: lerp(lerp(1290, 1330, dip), 790, up) + drift(g, 82, 5, 70),
    rot: lerp(18, -6, up),
  };
};

const Q_TARGET_G = WHIP.end;

export const S5Questions: React.FC = () => {
  const g = useCurrentFrame() + START;
  const cam = camBureau(g);
  let pose = poseAt(g, ELLE_KEYS);
  if (g >= 962 && g < 1096) pose = { ...pose, eR: pose.eR + (Math.floor(g / 5) % 2 ? 16 : -6), head: pose.head + (Math.floor(g / 5) % 2 ? 2 : -1) };
  const brows = g < 950 ? ip(g, [924, 934], [0, 0.6]) : g < 1095 ? -1 : 0.8;
  const slide = whipOffset(g) - W;
  const freezeK = g >= FREEZE ? 1 + 0.09 * (1 - pop(g, FREEZE, { damping: 9, stiffness: 260 })) : 1;

  // Raccord : la charnière ocre se tord en premier point d'interrogation
  let morph: React.ReactNode = null;
  if (g >= WHIP.start && g < WHIP.end) {
    const h = hingeScreen(WHIP.start);
    const camEnd = camBureau(Q_TARGET_G);
    const b = BUBBLES[0];
    const target = placePts(QPTS, b.x, b.y, b.r / 62).map((p) => worldToScreen(camEnd, 1, p[0], p[1]));
    const line = samplePath(`M ${h.a[0]},${h.a[1]} L ${h.b[0]},${h.b[1]}`, 64);
    const t = ip(g, [WHIP.start, WHIP.end], [0, 1], EIO);
    const pts = line.map((p, i): [number, number] => [
      lerp(p[0], target[i][0], t),
      lerp(p[1], target[i][1], t) - Math.sin(Math.PI * t) * 260 + Math.sin(i * 0.4 + g * 0.5) * 30 * Math.sin(Math.PI * t),
    ]);
    const wEnd = 12 * (b.r / 62) * camEnd.zoom;
    morph = (
      <svg width={W} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={poly(pts)} stroke={C.ocre} strokeWidth={lerp(h.width, wEnd, t)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }

  const hr = handRaise(g);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide}px)` }}>
        <Camera cam={cam} background={C.bg}>
          <Layer depth={0.55}>
            <WorldSvg>
              <BackWall g={g} />
            </WorldSvg>
          </Layer>
          <Layer depth={1}>
            <WorldSvg>
              <Chair />
              <Character
                who="elle"
                x={ELLE.x}
                y={ELLE.y}
                scale={ELLE.s}
                pose={pose}
                mouth={elleMouth5(g)}
                blinkOpen={blink(g, 13)}
                brows={brows}
                breathe={breath(g, 3)}
              />
              <Table />
              <Mug g={g} />
              <Laptop />
              {BUBBLES.map((b, i) => {
                const s = bubbleScale(i, g) * freezeK;
                if (s <= 0.001) return null;
                const [x, y] = bubblePos(i, g);
                const hideGlyph = i === 0 && g < Q_TARGET_G;
                return (
                  <Bubble
                    key={i}
                    x={x}
                    y={y}
                    r={b.r}
                    scale={s}
                    glyph={placePts(QPTS, x, y, b.r / 62)}
                    dot={hideGlyph ? 0 : 1}
                    strokeW={12 * (b.r / 62)}
                    glyphOpacity={hideGlyph ? 0 : 1}
                  />
                );
              })}
              <BigBubble g={g} />
            </WorldSvg>
          </Layer>
        </Camera>
      </div>
      {g >= 1068 && (
        <svg width={W} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <HandFG x={hr.x} y={hr.y} rot={hr.rot + Math.sin(hold(g, 4) / 9) * 1.2} shape="open" />
        </svg>
      )}
      {morph}
    </div>
  );
};
