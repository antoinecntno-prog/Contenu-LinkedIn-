import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C, H, W } from "../constants";
import { TITLE, BODY } from "../fonts";
import { Cam, Camera, Layer, WorldSvg, worldToScreen } from "../lib/camera";
import { Car } from "../lib/Car";
import { EIO, EIN, drift, ip, pop, rand, zoomLerp, clamp, hold } from "../lib/anim";
import { MaskedLine } from "../lib/MaskedText";

// Profil de vitesse de la voiture (px par image) : défilement linéaire par segments
const V_KEYS: [number, number][] = [
  [0, 0],
  [18, 0],
  [32, 30],
  [54, 30],
  [72, 5],
  [160, 5],
  [175, 30],
  [186, 30],
  [204, 0],
  [400, 0],
];
const vAt = (f: number) =>
  interpolate(
    f,
    V_KEYS.map((k) => k[0]),
    V_KEYS.map((k) => k[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

const X0 = 600;
const CUM: number[] = [0];
for (let i = 1; i < 400; i++) CUM[i] = CUM[i - 1] + vAt(i - 0.5);

export const carX = (f: number) => {
  const fl = Math.max(0, Math.floor(f));
  return X0 + CUM[fl] + vAt(fl + 0.5) * (f - fl);
};

const ROAD_Y = 820;
const LAG = 8;
const camFollowX = (f: number) => carX(Math.max(0, f - LAG)) + 300;

// Immeuble d'arrivée et fenêtre éclairée au format 16:9
const XB = carX(300) + 70;
const WIN_W = 112;
const WIN_H = 63;
const WIN_X = XB + 170;
const WIN_Y = 360;
const ZOOM_IN = W / WIN_W;

// Panneau : placé pour être centré vers x = 1000 à l'image 110
const XS = camFollowX(110) + 40;

export const camS1 = (f: number): Cam => {
  const followX = camFollowX(f);
  const baseY = 540 + drift(f, 1, 6, 120);
  const slowZoom = ip(f, [70, 112, 156], [1, 1.07, 1], EIO);
  const tPan = ip(f, [200, 226], [0, 1], EIO);
  const tZoom = ip(f, [206, 236], [0, 1], EIN);
  const x = followX + (WIN_X - followX) * tPan;
  const y = baseY + (WIN_Y + WIN_H / 2 - baseY) * tPan;
  const zoom = zoomLerp(slowZoom * (1 + drift(f, 3, 0.012)), ZOOM_IN, tZoom);
  const rot = drift(f, 2, 0.7, 160) * (1 - ip(f, [190, 214], [0, 1]));
  return { x, y, zoom, rot };
};

// Rectangle de la fenêtre à l'écran (pour y loger la scène 2)
export const windowRect = (f: number) => {
  const cam = camS1(f);
  const [x0, y0] = worldToScreen(cam, 1, WIN_X - WIN_W / 2, WIN_Y);
  const [x1, y1] = worldToScreen(cam, 1, WIN_X + WIN_W / 2, WIN_Y + WIN_H);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

// Décor généré une fois, de façon déterministe
const SKYLINE = Array.from({ length: 26 }, (_, i) => ({
  x: -300 + i * 120 + rand(`sk${i}`) * 60,
  w: 90 + rand(`skw${i}`) * 110,
  h: 140 + rand(`skh${i}`) * 260,
}));
const MID = Array.from({ length: 22 }, (_, i) => ({
  x: -300 + i * 230 + rand(`md${i}`) * 80,
  w: 150 + rand(`mdw${i}`) * 120,
  h: 230 + rand(`mdh${i}`) * 300,
  lit: Array.from({ length: 12 }, (_, j) => rand(`lit${i}-${j}`) > 0.82),
}));
const TREES = Array.from({ length: 30 }, (_, i) => ({
  x: -200 + i * 230 + rand(`tr${i}`) * 90,
  r: 54 + rand(`trr${i}`) * 30,
  lamp: i % 3 === 1,
}));
const TUFTS = Array.from({ length: 40 }, (_, i) => ({
  x: -200 + i * 260 + rand(`tf${i}`) * 140,
  s: 0.7 + rand(`tfs${i}`) * 0.6,
}));

const Building: React.FC<{ f: number }> = ({ f }) => {
  const glow = 0.75 + 0.25 * Math.sin(f / 6);
  return (
    <g>
      <rect x={XB - 290} y={170} width={580} height={ROAD_Y - 170} fill={C.bordeaux2} />
      <rect x={XB - 290} y={170} width={580} height={18} fill={C.bordeaux} />
      <rect x={XB - 300} y={160} width={600} height={14} rx={4} fill={C.n2} />
      {[250, 360, 470, 580].map((wy) =>
        [-170, 0, 170].map((dx) => {
          const lit = wy === WIN_Y && dx === 170;
          return lit ? null : (
            <rect key={`${wy}-${dx}`} x={XB + dx - WIN_W / 2} y={wy} width={WIN_W} height={WIN_H} rx={3} fill={C.bordeaux} />
          );
        }),
      )}
      {/* halo de la fenêtre éclairée */}
      <rect
        x={WIN_X - WIN_W / 2 - 10}
        y={WIN_Y - 10}
        width={WIN_W + 20}
        height={WIN_H + 20}
        rx={8}
        fill={C.ocre}
        opacity={0.25 * glow}
      />
      <rect x={WIN_X - WIN_W / 2} y={WIN_Y} width={WIN_W} height={WIN_H} fill="#E9B46A" />
      {/* porte */}
      <rect x={XB - 60} y={ROAD_Y - 130} width={120} height={130} rx={6} fill={C.n2} />
      <rect x={XB - 4} y={ROAD_Y - 130} width={8} height={130} fill={C.n1} />
    </g>
  );
};

export const S1Route: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camS1(f);
  const v = vAt(f);
  const cx = carX(f);

  // Arrivée de la voiture : chute puis écrasement à l'impact
  const drop = ip(f, [4, 18], [-340, 0], EIN);
  const landK = pop(f, 18, { damping: 9, stiffness: 220, mass: 0.6 });
  const stopK = pop(f, 204, { damping: 8, stiffness: 240, mass: 0.6 });
  let sy = 1;
  let sx = 1;
  if (f >= 18) {
    sy = 1 - 0.24 * (1 - landK);
    sx = 1 + 0.16 * (1 - landK);
  }
  if (f >= 204) {
    sy = 1 - 0.14 * (1 - stopK);
    sx = 1 + 0.1 * (1 - stopK);
  }
  const accel = vAt(f + 2) - vAt(f - 2);
  const tilt = clamp(-accel * 1.1, -5, 6);
  const bob = v > 1 ? Math.sin(f * 0.9) * 1.6 : 0;
  const headBob = v > 1 ? Math.sin(f * 0.9 + 1) * 2 : -tilt * 0.8;

  // Route : le trait ocre se trace de gauche à droite
  const roadStart = camFollowX(0) - 1040;
  const firstRoad = `M ${roadStart},${ROAD_Y} L ${roadStart + 2100},${ROAD_Y}`;
  const evo = evolvePath(ip(f, [0, 16], [0, 1], EIO), firstRoad);

  // Panneau : petit saut d'entrée, flèche qui pulse
  const signK = pop(f, 46);
  const arrowPulse = 1 + 0.18 * Math.max(0, Math.sin(((f - 100) / 30) * Math.PI)) * (f > 100 ? 1 : 0);

  const speedLines = v > 7;
  const flick = hold(f, 3);

  return (
    <Camera cam={cam} background={C.bg}>
      <Layer depth={0.12}>
        <WorldSvg>
          {SKYLINE.map((b, i) => (
            <rect key={i} x={b.x} y={ROAD_Y - b.h} width={b.w} height={b.h + 400} fill={C.skyline} />
          ))}
        </WorldSvg>
      </Layer>
      <Layer depth={0.4}>
        <WorldSvg>
          {MID.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={ROAD_Y - b.h} width={b.w} height={b.h + 400} fill="#541526" />
              {b.lit.map((l, j) => (
                <rect
                  key={j}
                  x={b.x + 22 + (j % 3) * ((b.w - 44) / 3)}
                  y={ROAD_Y - b.h + 30 + Math.floor(j / 3) * 56}
                  width={(b.w - 44) / 3 - 14}
                  height={30}
                  fill={l ? C.bordeaux2 : "#46101E"}
                />
              ))}
            </g>
          ))}
        </WorldSvg>
      </Layer>
      <Layer depth={0.75}>
        <WorldSvg>
          {TREES.map((t, i) => (
            <g key={i}>
              {t.lamp ? (
                <g>
                  <rect x={t.x - 5} y={ROAD_Y - 320} width={10} height={320} fill={C.n2} />
                  <rect x={t.x - 5} y={ROAD_Y - 322} width={60} height={10} rx={5} fill={C.n2} />
                  <rect x={t.x + 38} y={ROAD_Y - 314} width={26} height={10} rx={4} fill={C.n6} />
                </g>
              ) : (
                <g>
                  <rect x={t.x - 8} y={ROAD_Y - 120} width={16} height={120} fill={C.n2} />
                  <circle cx={t.x} cy={ROAD_Y - 150 - t.r * 0.4} r={t.r} fill={C.bordeaux2} />
                  <circle cx={t.x - t.r * 0.6} cy={ROAD_Y - 120} r={t.r * 0.62} fill={C.bordeaux2} />
                  <circle cx={t.x + t.r * 0.62} cy={ROAD_Y - 126} r={t.r * 0.55} fill="#7E2238" />
                </g>
              )}
            </g>
          ))}
        </WorldSvg>
      </Layer>
      <Layer depth={1}>
        <WorldSvg>
          <rect x={-4000} y={ROAD_Y} width={14000} height={1400} fill="#1D1512" />
          <Building f={f} />
          {/* panneau au bord de la route */}
          <g transform={`translate(${XS}, ${ROAD_Y}) scale(1, ${0.4 + 0.6 * signK}) translate(${-XS}, ${-ROAD_Y})`}>
            <rect x={XS - 318} y={600} width={18} height={ROAD_Y - 600} fill={C.n2} />
            <rect x={XS + 300} y={600} width={18} height={ROAD_Y - 600} fill={C.n2} />
            <rect x={XS - 460} y={330} width={920} height={290} rx={18} fill={C.bordeaux2} />
            <rect x={XS - 444} y={346} width={888} height={258} rx={12} fill="none" stroke={C.white} strokeWidth={5} />
            <g transform={`translate(${XS + 330}, 420) scale(${arrowPulse})`}>
              <path d="M -46,-14 L 8,-14 L 8,-36 L 50,0 L 8,36 L 8,14 L -46,14 Z" fill={C.ocre} />
            </g>
          </g>
          {/* route : trait ocre */}
          {f < 16 ? (
            <path
              d={firstRoad}
              stroke={C.ocre}
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={evo.strokeDasharray}
              strokeDashoffset={evo.strokeDashoffset}
              fill="none"
            />
          ) : (
            <path d={`M ${roadStart},${ROAD_Y} L ${roadStart + 9000},${ROAD_Y}`} stroke={C.ocre} strokeWidth={14} strokeLinecap="round" />
          )}
          {/* lignes de vitesse */}
          {speedLines &&
            [0, 1, 2, 3, 4].map((i) => {
              const len = v * (6 + rand(`sl${i}-${flick}`) * 6);
              const sx0 = cx - 160 - rand(`slx${i}-${flick}`) * 90;
              const yy = ROAD_Y - 40 - i * 22 - rand(`sly${i}-${flick}`) * 8;
              return (
                <path
                  key={i}
                  d={`M ${sx0 - len},${yy} L ${sx0},${yy}`}
                  stroke={C.white}
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={0.25 + 0.35 * clamp((v - 7) / 20)}
                />
              );
            })}
          {/* poussière à l'impact */}
          {f >= 18 && f < 40 &&
            [-1, 1].map((s) => (
              <circle
                key={s}
                cx={cx + s * (120 + (f - 18) * 4)}
                cy={ROAD_Y - 10 - (f - 18) * 0.8}
                r={10 + (f - 18) * 1.2}
                fill={C.n5}
                opacity={ip(f, [18, 40], [0.6, 0])}
              />
            ))}
          <Car
            x={cx}
            y={ROAD_Y + drop - 7}
            wheelRot={(cx / 29) * (180 / Math.PI)}
            tilt={tilt}
            sx={sx}
            sy={sy}
            bob={bob}
            headBob={headBob}
          />
        </WorldSvg>
        {/* texte du panneau, révélé ligne par ligne */}
        <div
          style={{
            position: "absolute",
            left: XS - 410,
            top: 360,
            width: 700,
            transformOrigin: `${410}px ${ROAD_Y - 360}px`,
            transform: `scaleY(${0.4 + 0.6 * signK})`,
            color: C.white,
          }}
        >
          <MaskedLine text="9 h." f={f} start={56} stagger={2} style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 116, lineHeight: 1, letterSpacing: -2 }} />
          <MaskedLine
            text="Direction ses bureaux."
            f={f}
            start={66}
            stagger={0.9}
            style={{ fontFamily: BODY, fontWeight: 700, fontSize: 62, lineHeight: 1.1, marginTop: 18 }}
          />
        </div>
      </Layer>
      <Layer depth={1.4}>
        <WorldSvg>
          {TUFTS.map((t, i) => (
            <g key={i} transform={`translate(${t.x}, ${ROAD_Y + 130}) scale(${t.s})`}>
              <path d="M -40,40 Q -30,-30 -10,-60 Q -6,-20 0,40 Z" fill={C.n1} />
              <path d="M -10,40 Q 6,-50 26,-84 Q 22,-30 18,40 Z" fill={C.n1} />
              <path d="M 10,40 Q 30,-20 54,-44 Q 44,0 40,40 Z" fill={C.n1} />
            </g>
          ))}
        </WorldSvg>
      </Layer>
      <div style={{ position: "absolute", width: W, height: H }} />
    </Camera>
  );
};
