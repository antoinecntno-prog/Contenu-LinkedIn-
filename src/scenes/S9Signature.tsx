import React from "react";
import { useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C, SCENES, W, H } from "../constants";
import { BODY, TITLE } from "../fonts";
import { Camera, Layer, WorldSvg } from "../lib/camera";
import { Car } from "../lib/Car";
import { EIO, EIN, drift, ip, lerp, pop } from "../lib/anim";
import { SWEEP_X0 } from "./S8DixHeures";

const START = SCENES.signature.start;
const SWEEP = { start: 1800, end: 1824 };
const NAME = "Antoine Contino";
const LEFT = 210;
const LINE_Y = 548;
const LINE_END = 1520;
const CAR = { start: 1846, x0: 280, x1: 1440 };

const sweepX = (g: number) => lerp(SWEEP_X0, W + 40, EIO(ip(g, [SWEEP.start, SWEEP.end], [0, 1])));

// image à laquelle le balai atteint l'abscisse x
const sweepFrameAt = (x: number) => {
  let lo = 0;
  let hi = 1;
  const target = (x - SWEEP_X0) / (W + 40 - SWEEP_X0);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (EIO(mid) < target) lo = mid;
    else hi = mid;
  }
  return SWEEP.start + (SWEEP.end - SWEEP.start) * lo;
};

export const S9Signature: React.FC = () => {
  const g = useCurrentFrame() + START;
  const x = sweepX(g);
  const ramp = ip(g, [1822, 1860], [0, 1]);
  const cam = {
    x: 960 + drift(g, 101, 10) * ramp,
    y: 540 + drift(g, 102, 6) * ramp,
    zoom: 1 + 0.045 * ip(g, [1822, 1920], [0, 1], EIO),
    rot: drift(g, 103, 0.4) * ramp,
  };

  const underline = `M ${LEFT},${LINE_Y} L ${LINE_END},${LINE_Y}`;
  const evo = evolvePath(Math.max(0, Math.min(1, (x - LEFT) / (LINE_END - LEFT))), underline);
  const tag = pop(g, 1822, { damping: 13, stiffness: 170 });
  const url = pop(g, 1832, { damping: 13, stiffness: 170 });

  // la petite voiture de la scène 1 retombe sur le soulignement et le parcourt
  const drop = ip(g, [CAR.start, CAR.start + 10], [-160, 0], EIN);
  const land = pop(g, CAR.start + 10, { damping: 9, stiffness: 220, mass: 0.6 });
  const carX = g < CAR.start + 10 ? CAR.x0 : lerp(CAR.x0, CAR.x1, (g - CAR.start - 10) / (1920 - CAR.start - 10));
  const carSy = g < CAR.start + 10 ? 1 : 1 - 0.22 * (1 - land);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${Math.max(0, W - x)}px 0 0)` }}>
        <Camera cam={cam} background={C.bg}>
          <Layer depth={1}>
            <div
              style={{
                position: "absolute",
                left: LEFT,
                top: 336,
                display: "flex",
                fontFamily: TITLE,
                fontWeight: 800,
                fontSize: 150,
                lineHeight: 1,
                letterSpacing: -4,
                color: C.white,
                whiteSpace: "pre",
              }}
            >
              {Array.from(NAME).map((ch, i) => {
                const t0 = sweepFrameAt(LEFT + i * 80);
                const k = pop(g, t0, { damping: 10, stiffness: 220, mass: 0.6 });
                return (
                  <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - k) * -46}px)` }}>
                    {ch === " " ? " " : ch}
                  </span>
                );
              })}
            </div>
            <div style={{ position: "absolute", left: LEFT, top: LINE_Y + 18, overflow: "hidden", padding: "0 20px 12px 0" }}>
              <div
                style={{
                  fontFamily: BODY,
                  fontWeight: 700,
                  fontSize: 62,
                  lineHeight: 1.15,
                  color: C.white,
                  transform: `translateY(${(1 - tag) * -120}%)`,
                }}
              >
                L'IA simplifiée, taillée sur mesure
              </div>
            </div>
            <div style={{ position: "absolute", left: LEFT, top: LINE_Y + 104, overflow: "hidden", padding: "0 20px 10px 0" }}>
              <div
                style={{
                  fontFamily: BODY,
                  fontWeight: 500,
                  fontSize: 52,
                  lineHeight: 1.15,
                  color: C.ocre,
                  transform: `translateY(${(1 - url) * -120}%)`,
                }}
              >
                plaquette-formation.netlify.app
              </div>
            </div>
            <WorldSvg>
              <path
                d={underline}
                stroke={C.ocre}
                strokeWidth={12}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={evo.strokeDasharray}
                strokeDashoffset={evo.strokeDashoffset}
              />
              {g >= CAR.start && (
                <Car
                  x={carX}
                  y={LINE_Y - 6 + drop * 0.5}
                  scale={0.5}
                  wheelRot={(carX / 29) * 57.3}
                  sy={carSy}
                  sx={1 / Math.sqrt(carSy)}
                  bob={Math.sin(g * 0.9) * 1.4}
                  headBob={Math.sin(g * 0.9 + 1) * 2}
                />
              )}
            </WorldSvg>
          </Layer>
        </Camera>
      </div>
      {x < W + 30 && (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M ${x},-60 L ${x},${H + 60}`} stroke={C.ocre} strokeWidth={24} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
