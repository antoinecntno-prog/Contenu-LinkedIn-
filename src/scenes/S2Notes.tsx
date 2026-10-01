import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { C, SCENES } from "../constants";
import { TITLE } from "../fonts";
import { Cam, Camera, Layer, WorldSvg, worldToScreen } from "../lib/camera";
import { Character, poseAt, talkMouth } from "../lib/Character";
import { EIO, EIN, EOUT, blink, breath, drift, ip, lerp, zoomLerp } from "../lib/anim";

const PRE = SCENES.notes.pre;

// Position et inclinaison du carnet dans le monde
const NB = { cx: 1230, cy: 820, w: 780, h: 500, rot: -4 };
const pageToWorld = (px: number, py: number): [number, number] => {
  const r = (NB.rot * Math.PI) / 180;
  const lx = px - NB.w / 2;
  const ly = py - NB.h / 2;
  return [NB.cx + lx * Math.cos(r) - ly * Math.sin(r), NB.cy + lx * Math.sin(r) + ly * Math.cos(r)];
};

const SCRIBBLE_A =
  "M 60,78 C 80,48 96,100 116,72 C 134,46 150,96 172,70 C 192,48 206,96 228,74 C 250,52 262,98 286,72 C 306,52 320,94 344,72 C 362,54 378,92 400,72 C 420,54 436,92 460,74 C 476,62 490,84 512,72";
const SCRIBBLE_B =
  "M 60,138 C 78,112 94,160 112,134 C 130,110 146,158 166,132 C 186,110 200,156 222,134 C 242,114 256,154 278,132 C 298,114 312,152 334,134 C 352,120 368,148 404,134";
const LINE1 = { x: 60, y: 258, w: 600, text: "Elle raconte," };
const LINE2 = { x: 60, y: 362, w: 356, text: "je note." };
const UNDER = `M 52,404 C 160,398 300,400 432,396`;

const T = {
  scrA: [12, 34],
  scrB: [38, 56],
  l1: [62, 86],
  l2: [90, 106],
  und: [110, 122],
  lift: [140, 168],
  zoom: [178, 210],
};

const UNDER_MID = pageToWorld(242, 400);

export const camS2 = (fl: number): Cam => {
  const settle = ip(fl, [-PRE, 22], [0, 1], EOUT);
  const push = ip(fl, [22, 176], [0, 1], EIO);
  const tz = ip(fl, [T.zoom[0], T.zoom[1]], [0, 1], EIN);
  const baseX = lerp(lerp(940, 1000, settle), 1070, push) + drift(fl, 4, 8);
  const baseY = lerp(lerp(520, 560, settle), 610, push) + drift(fl, 5, 6);
  const baseZ = lerp(lerp(0.9, 1.0, settle), 1.08, push);
  const baseR = drift(fl, 6, 0.6);
  return {
    x: lerp(baseX, UNDER_MID[0], ip(fl, [T.zoom[0] - 6, T.zoom[1] - 4], [0, 1], EIO)),
    y: lerp(baseY, UNDER_MID[1], ip(fl, [T.zoom[0] - 6, T.zoom[1] - 4], [0, 1], EIO)),
    zoom: zoomLerp(baseZ, 7.2, tz),
    rot: lerp(baseR, -NB.rot, ip(fl, [T.zoom[0], T.zoom[1] - 4], [0, 1], EIO)),
  };
};

// Épaisseur et position du soulignement à l'écran, pour le raccord avec la scène 3
export const underlineAt = (fl: number) => {
  const cam = camS2(fl);
  const a = worldToScreen(cam, 1, ...pageToWorld(52, 404));
  const b = worldToScreen(cam, 1, ...pageToWorld(432, 396));
  return { a, b, width: 7 * cam.zoom };
};

const pathPoint = (d: string, t: number): [number, number] => {
  const len = getLength(d);
  const p = getPointAtLength(d, len * Math.max(0, Math.min(1, t)));
  return p ? [p.x, p.y] : [0, 0];
};

// Pointe du stylo, en coordonnées de la page
const penTip = (fl: number): [number, number] => {
  const idle: [number, number] = [70, 40];
  const between = (a: [number, number], b: [number, number], f0: number, f1: number): [number, number] => {
    const t = ip(fl, [f0, f1], [0, 1], EIO);
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * 26];
  };
  if (fl < T.scrA[0]) return [idle[0] + drift(fl, 9, 6, 40), idle[1] + drift(fl, 10, 5, 50)];
  if (fl < T.scrA[1]) return pathPoint(SCRIBBLE_A, ip(fl, T.scrA, [0, 1]));
  if (fl < T.scrB[0]) return between(pathPoint(SCRIBBLE_A, 1), pathPoint(SCRIBBLE_B, 0), T.scrA[1], T.scrB[0]);
  if (fl < T.scrB[1]) return pathPoint(SCRIBBLE_B, ip(fl, T.scrB, [0, 1]));
  if (fl < T.l1[0]) return between(pathPoint(SCRIBBLE_B, 1), [LINE1.x, LINE1.y - 30], T.scrB[1], T.l1[0]);
  if (fl < T.l1[1]) {
    const p = ip(fl, T.l1, [0, 1]);
    return [LINE1.x + LINE1.w * p, LINE1.y - 34 + Math.sin(p * Math.PI * 22) * 22];
  }
  if (fl < T.l2[0]) return between([LINE1.x + LINE1.w, LINE1.y - 30], [LINE2.x, LINE2.y - 30], T.l1[1], T.l2[0]);
  if (fl < T.l2[1]) {
    const p = ip(fl, T.l2, [0, 1]);
    return [LINE2.x + LINE2.w * p, LINE2.y - 34 + Math.sin(p * Math.PI * 14) * 22];
  }
  if (fl < T.und[0]) return between([LINE2.x + LINE2.w, LINE2.y - 30], pathPoint(UNDER, 0), T.l2[1], T.und[0]);
  if (fl < T.und[1]) return pathPoint(UNDER, ip(fl, T.und, [0, 1], EIO));
  const end = pathPoint(UNDER, 1);
  const lift = ip(fl, T.lift, [0, 1], EIO);
  return [end[0] + 40 + lift * 420 + drift(fl, 11, 5, 50), end[1] - 30 + lift * 260 + drift(fl, 12, 4, 45)];
};

// Gestes pendant qu'elle parle
const KEYS = [
  { f: -60, p: { aL: 28, eL: -112, aR: 30, eR: -118, head: 0, turn: 0.25 } },
  { f: 2, p: { aL: 58, eL: -62, aR: 26, eR: -124, head: -5, turn: 0.35 } },
  { f: 26, p: { aL: 22, eL: -128, aR: 68, eR: -44, head: 4, turn: 0.1 } },
  { f: 50, p: { aL: 40, eL: -92, aR: 40, eR: -92, head: -3, turn: 0.4 } },
  { f: 74, p: { aL: 62, eL: -30, aR: 22, eR: -120, head: 6, turn: 0.2 } },
  { f: 98, p: { aL: 26, eL: -120, aR: 58, eR: -70, head: -4, turn: 0.45 } },
  { f: 124, p: { aL: 50, eL: -80, aR: 50, eR: -80, head: 3, turn: 0.3 } },
  { f: 150, p: { aL: 24, eL: -126, aR: 72, eR: -30, head: -6, turn: 0.15 } },
  { f: 176, p: { aL: 44, eL: -96, aR: 30, eR: -110, head: 2, turn: 0.4 } },
];

export const S2Notes: React.FC = () => {
  const fl = useCurrentFrame() - PRE;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const cam = camS2(fl);
  const pose = poseAt(fl, KEYS);
  const br = breath(fl, 1);
  const tip = penTip(fl);
  const penDir = [0.5, -0.86];
  const hand: [number, number] = [tip[0] + penDir[0] * 96 + 26, tip[1] + penDir[1] * 96 + 8];

  const evoA = evolvePath(ip(fl, T.scrA, [0, 1]), SCRIBBLE_A);
  const evoB = evolvePath(ip(fl, T.scrB, [0, 1]), SCRIBBLE_B);
  const evoU = evolvePath(ip(fl, T.und, [0, 1], EIO), UNDER);
  const rev1 = ip(fl, T.l1, [0, 1]);
  const rev2 = ip(fl, T.l2, [0, 1]);

  const lampRot = Math.sin(fl / 38) * 3.2;
  const steam = (i: number) => {
    const ph = ((fl + i * 22) % 66) / 66;
    const x = 1066 + i * 14 + Math.sin(ph * 6 + i) * 10;
    const y = 590 - ph * 120;
    return { x, y, o: Math.sin(ph * Math.PI) * 0.55 };
  };

  return (
    <Camera cam={cam} background={C.bg}>
      <Layer depth={0.6}>
        <WorldSvg>
          <defs>
            <radialGradient id={`lampGlow${uid}`}>
              <stop offset="0%" stopColor={C.ocre} stopOpacity={0.32} />
              <stop offset="100%" stopColor={C.ocre} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={760} cy={300} r={720} fill={`url(#lampGlow${uid})`} />
          {/* plante */}
          <g transform={`translate(230, 620)`}>
            {[-40, -15, 10, 35, 58].map((a, i) => (
              <path
                key={i}
                transform={`rotate(${a + Math.sin(fl / 30 + i) * 4})`}
                d="M 0,0 C -30,-80 -10,-170 0,-220 C 14,-170 30,-80 0,0 Z"
                fill={i % 2 ? C.bordeaux : C.bordeaux2}
              />
            ))}
            <path d="M -60,0 L 60,0 L 46,110 L -46,110 Z" fill={C.n3} />
          </g>
        </WorldSvg>
      </Layer>
      <Layer depth={0.85}>
        <WorldSvg>
          <g transform={`rotate(${lampRot}, 760, -60)`}>
            <path d="M 760,-60 L 760,118" stroke={C.n3} strokeWidth={5} />
            <path d="M 700,170 Q 704,118 760,116 Q 816,118 820,170 Z" fill={C.bordeaux} />
            <ellipse cx={760} cy={172} rx={34} ry={9} fill="#F3C98A" />
          </g>
        </WorldSvg>
      </Layer>
      <Layer depth={1}>
        <WorldSvg>
          <Character
            who="elle"
            x={760}
            y={640}
            pose={pose}
            mouth={talkMouth(fl, 2)}
            blinkOpen={blink(fl, 3)}
            brows={Math.sin(fl / 25) * 0.6}
            breathe={br}
          />
          {/* table en plongée */}
          <path d="M 330,600 L 1590,600 L 2300,1300 L -380,1300 Z" fill={C.n2} />
          <path d="M 330,600 L 1590,600 L 1602,614 L 318,614 Z" fill={C.n3} />
          {/* tasse */}
          <g>
            <ellipse cx={1090} cy={672} rx={44} ry={10} fill={C.ink} opacity={0.35} />
            <path d="M 1122,616 C 1150,616 1150,656 1122,656" stroke={C.n6} strokeWidth={9} fill="none" />
            <rect x={1058} y={600} width={66} height={72} rx={10} fill={C.n6} />
            <ellipse cx={1091} cy={602} rx={33} ry={8} fill={C.n1} />
            {[0, 1, 2].map((i) => {
              const s = steam(i);
              return (
                <path
                  key={i}
                  d={`M ${s.x},${s.y} q 12,-18 0,-36 q -12,-18 0,-36`}
                  stroke={C.n6}
                  strokeWidth={6}
                  strokeLinecap="round"
                  fill="none"
                  opacity={s.o}
                />
              );
            })}
          </g>
          {/* carnet */}
          <g transform={`translate(${NB.cx}, ${NB.cy}) rotate(${NB.rot}) translate(${-NB.w / 2}, ${-NB.h / 2})`}>
            <rect x={14} y={18} width={NB.w} height={NB.h} rx={10} fill={C.ink} opacity={0.4} />
            <rect x={0} y={0} width={NB.w} height={NB.h} rx={10} fill={C.white} />
            {[110, 170, 230, 290, 350, 410, 470].map((ly) => (
              <path key={ly} d={`M 30,${ly + 22} L ${NB.w - 30},${ly + 22}`} stroke="#EEE7E2" strokeWidth={3} />
            ))}
            {Array.from({ length: 13 }, (_, i) => (
              <rect key={i} x={40 + i * 56} y={-14} width={12} height={34} rx={6} fill={C.n2} />
            ))}
            <path d={SCRIBBLE_A} stroke={C.ocre} strokeWidth={6} strokeLinecap="round" fill="none" strokeDasharray={evoA.strokeDasharray} strokeDashoffset={evoA.strokeDashoffset} />
            <path d={SCRIBBLE_B} stroke={C.ocre} strokeWidth={6} strokeLinecap="round" fill="none" strokeDasharray={evoB.strokeDasharray} strokeDashoffset={evoB.strokeDashoffset} />
            <defs>
              <clipPath id={`rev1${uid}`}>
                <rect x={LINE1.x - 10} y={LINE1.y - 100} width={(LINE1.w + 30) * rev1} height={140} />
              </clipPath>
              <clipPath id={`rev2${uid}`}>
                <rect x={LINE2.x - 10} y={LINE2.y - 100} width={(LINE2.w + 30) * rev2} height={140} />
              </clipPath>
            </defs>
            <text
              x={LINE1.x}
              y={LINE1.y}
              textLength={LINE1.w}
              lengthAdjust="spacingAndGlyphs"
              clipPath={`url(#rev1${uid})`}
              style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 84, letterSpacing: -1 }}
              fill={C.ocre2}
            >
              {LINE1.text}
            </text>
            <text
              x={LINE2.x}
              y={LINE2.y}
              textLength={LINE2.w}
              lengthAdjust="spacingAndGlyphs"
              clipPath={`url(#rev2${uid})`}
              style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 84, letterSpacing: -1 }}
              fill={C.ocre2}
            >
              {LINE2.text}
            </text>
            <path d={UNDER} stroke={C.ocre} strokeWidth={7} strokeLinecap="round" fill="none" strokeDasharray={evoU.strokeDasharray} strokeDashoffset={evoU.strokeDashoffset} />
            {/* ma main et le stylo */}
            <g>
              <path
                d={`M ${hand[0]},${hand[1]} L ${hand[0] + 420},${hand[1] + 560}`}
                stroke="#C2B5AB"
                strokeWidth={96}
                strokeLinecap="round"
              />
              <path
                d={`M ${hand[0] + 70},${hand[1] + 93} L ${hand[0] + 100},${hand[1] + 133}`}
                stroke={C.n6}
                strokeWidth={104}
              />
              <path
                d={`M ${tip[0]},${tip[1]} L ${tip[0] + penDir[0] * 230},${tip[1] + penDir[1] * 230}`}
                stroke={C.n1}
                strokeWidth={16}
                strokeLinecap="round"
              />
              <path d={`M ${tip[0]},${tip[1]} L ${tip[0] + penDir[0] * 26},${tip[1] + penDir[1] * 26}`} stroke={C.ocre} strokeWidth={10} strokeLinecap="round" />
              <ellipse cx={hand[0]} cy={hand[1]} rx={50} ry={42} fill={C.skinMoi} transform={`rotate(-30, ${hand[0]}, ${hand[1]})`} />
              <ellipse cx={hand[0] - 30} cy={hand[1] - 18} rx={20} ry={14} fill={C.skinMoiShade} transform={`rotate(-30, ${hand[0] - 30}, ${hand[1] - 18})`} />
            </g>
          </g>
        </WorldSvg>
      </Layer>
    </Camera>
  );
};
