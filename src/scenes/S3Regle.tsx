import React from "react";
import { useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C, H, W } from "../constants";
import { BODY, TITLE } from "../fonts";
import { Camera, Layer, WorldSvg } from "../lib/camera";
import { EIO, EIN, EOUT, drift, ip, lerp, pop, poly, shake } from "../lib/anim";
import { MaskedLine } from "../lib/MaskedText";
import { underlineAt } from "./S2Notes";
import { HINGE0 } from "./S4Ordinateur";

type Pt = [number, number];

// Trait hérité du soulignement de la scène 2 (dernière image avant la coupe)
const U = underlineAt(209.5);
const LINE_W0 = U.width;
const yOnU = (x: number) => U.a[1] + ((U.b[1] - U.a[1]) * (x - U.a[0])) / (U.b[0] - U.a[0]);

// Points du « 1 », du bout du drapeau jusqu'au pied
const ONE: Pt[] = [
  [470, 334],
  [624, 226],
  [624, 852],
];
const SAG: Pt[] = [
  [556, 566],
  [640, 584],
  [724, 566],
];
const START: Pt[] = [
  [-240, yOnU(-240)],
  [960, yOnU(960)],
  [2160, yOnU(2160)],
];
const BASE = "M 486,852 L 768,852";

const lerpPts = (a: Pt[], b: Pt[], t: number): Pt[] =>
  a.map((p, i) => [lerp(p[0], b[i][0], t), lerp(p[1], b[i][1], t)]);

const rotPt = (p: Pt, c: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180;
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)];
};

const Q1 = "Qu'est-ce que j'attends,";
const Q2 = "exactement ?";

const Typed: React.FC<{ text: string; n: number; caret: boolean; f: number }> = ({ text, n, caret, f }) => {
  const shown = text.slice(0, Math.max(0, n));
  const rest = text.slice(Math.max(0, n));
  return (
    <div style={{ whiteSpace: "pre", position: "relative" }}>
      <span>{shown}</span>
      {caret && (
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: "0.95em",
            marginLeft: 3,
            marginRight: -10,
            verticalAlign: "-0.12em",
            background: C.ocre,
            opacity: Math.floor(f / 8) % 2 === 0 || n < text.length ? 1 : 0.15,
          }}
        />
      )}
      <span style={{ color: "transparent" }}>{rest}</span>
    </div>
  );
};

export const S3Regle: React.FC = () => {
  const f = useCurrentFrame();

  // 1. contraction puis redressement en « 1 »
  const tSag = ip(f, [0, 12], [0, 1], EIO);
  const tRise = f < 12 ? 0 : pop(f, 12, { damping: 10, stiffness: 210, mass: 0.7 });
  let pts = f < 12 ? lerpPts(START, SAG, tSag) : lerpPts(SAG, ONE, tRise);
  let width = f < 12 ? lerp(LINE_W0, 64, tSag) : lerp(64, 84, Math.min(1, tRise));

  // respiration du 1 une fois posé
  const wob = f > 40 ? Math.sin((f - 40) / 13) * 1.6 : 0;
  const pivot: Pt = [624, 852];

  // 2. bascule puis étirement en charnière
  const lean = ip(f, [166, 180], [0, -9], EOUT);
  const fall = ip(f, [180, 196], [0, 99], EIN);
  const settle = ip(f, [196, 202], [0, -9], EOUT);
  const angle = wob + lean + fall + settle;
  // le drapeau se range dans l'axe pendant la chute
  const tuck = ip(f, [176, 192], [0, 1], EIO);
  pts = [lerpPts([pts[0]], [[pts[1][0], pts[1][1] - 40]], tuck)[0], pts[1], pts[2]];
  pts = pts.map((p) => rotPt(p, pivot, angle));
  const tHinge = ip(f, [198, 209], [0, 1], EIO);
  const HINGE: Pt[] = [
    [W + 40, HINGE0.y],
    [W + 20, HINGE0.y],
    [-40, HINGE0.y],
  ];
  pts = lerpPts(pts, HINGE, tHinge);
  width = lerp(width, HINGE0.width, ip(f, [196, 209], [0, 1], EIO));

  // pied du 1 : tracé après le claquement, rentré avant la chute
  const baseIn = ip(f, [28, 40], [0, 1], EIO) * ip(f, [160, 174], [1, 0], EIO);
  const evoBase = evolvePath(baseIn, BASE);

  // bande de table qui monte sous la charnière
  const floorTop = lerp(H + 20, HINGE0.y, ip(f, [194, 209], [0, 1], EOUT));

  // soulignement de « l'objectif »
  const evoUnder = evolvePath(ip(f, [140, 156], [0, 1], EIO), "M 0,0 L 560,0");

  // caméra : poussée lente, puis retour au neutre pour le raccord
  const back = ip(f, [190, 208], [1, 0], EIO);
  const cam = {
    x: 960 + (drift(f, 21, 10) + shake(f, 26, 14, 22, 3)) * back + shake(f, 196, 10, 10, 5) * back,
    y: 540 + (drift(f, 22, 8) + shake(f, 26, 14, 16, 4)) * back,
    zoom: 1 + 0.05 * ip(f, [0, 190], [0, 1], EIO) * back,
    rot: drift(f, 23, 0.8) * back,
  };

  // textes chassés par la chute du 1
  const knock = (i: number) => {
    const t0 = 184 + i * 3;
    if (f < t0) return { y: 0, r: 0, x: 0 };
    const t = f - t0;
    return { y: 2.8 * t * t + 6 * t, r: t * (1.6 + i * 0.4), x: t * 5 };
  };

  const nQ = Math.floor(ip(f, [68, 102], [0, Q1.length + Q2.length]));
  const n1 = Math.min(nQ, Q1.length);
  const n2 = Math.max(0, nQ - Q1.length);

  const slam = f >= 24 && f < 40 ? 1 + 0.05 * Math.sin(((f - 24) / 16) * Math.PI) : 1;

  return (
    <Camera cam={cam} background={C.bordeaux}>
      <Layer depth={1}>
        <div style={{ position: "absolute", left: 860, top: 286, color: C.white }}>
          {[0, 1].map((i) => {
            const k = knock(i);
            return (
              <div
                key={i}
                style={{
                  transform: `translate(${k.x}px, ${k.y}px) rotate(${k.r}deg)`,
                  transformOrigin: "0 50%",
                  position: "relative",
                }}
              >
                <MaskedLine
                  text={i === 0 ? "Règle n° 1 :" : "l'objectif"}
                  f={f}
                  start={i === 0 ? 34 : 46}
                  stagger={1.5}
                  style={{
                    fontFamily: TITLE,
                    fontWeight: 800,
                    fontSize: 134,
                    lineHeight: 1.04,
                    letterSpacing: -3,
                  }}
                />
                {i === 1 && (
                  <svg width={600} height={30} style={{ position: "absolute", left: 4, top: 148, overflow: "visible" }}>
                    <path
                      d="M 0,0 L 560,0"
                      stroke={C.ocre}
                      strokeWidth={12}
                      strokeLinecap="round"
                      strokeDasharray={evoUnder.strokeDasharray}
                      strokeDashoffset={evoUnder.strokeDashoffset}
                    />
                  </svg>
                )}
              </div>
            );
          })}
          <div style={{ height: 70 }} />
          {[0, 1].map((i) => {
            const k = knock(i + 2);
            return (
              <div
                key={`q${i}`}
                style={{
                  transform: `translate(${k.x}px, ${k.y}px) rotate(${k.r}deg)`,
                  transformOrigin: "0 50%",
                  fontFamily: BODY,
                  fontWeight: 700,
                  fontSize: 66,
                  lineHeight: 1.22,
                }}
              >
                <Typed
                  text={i === 0 ? Q1 : Q2}
                  n={i === 0 ? n1 : n2}
                  caret={i === 0 ? nQ <= Q1.length && nQ > 0 : nQ > Q1.length}
                  f={f}
                />
              </div>
            );
          })}
        </div>
        <WorldSvg>
          <rect x={-200} y={floorTop + 10} width={W + 400} height={H} fill={C.n2} />
          <g transform={`translate(624, 852) scale(${slam}, ${2 - slam}) translate(-624, -852)`}>
            <path
              d={poly(pts)}
              stroke={C.ocre}
              strokeWidth={width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d={BASE}
              stroke={C.ocre}
              strokeWidth={84}
              strokeLinecap="round"
              strokeDasharray={evoBase.strokeDasharray}
              strokeDashoffset={evoBase.strokeDashoffset}
              fill="none"
              opacity={baseIn > 0.001 ? 1 : 0}
            />
          </g>
        </WorldSvg>
      </Layer>
    </Camera>
  );
};
