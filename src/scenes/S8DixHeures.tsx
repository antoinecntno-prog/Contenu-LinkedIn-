import React from "react";
import { useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C, SCENES, W, H } from "../constants";
import { BODY, TITLE } from "../fonts";
import { Cam, Camera, Layer, WorldSvg, worldToScreen } from "../lib/camera";
import { EIO, EIN, drift, ip, lerp, pop, poly, shake } from "../lib/anim";
import { samplePath } from "../lib/morph";
import { CONF_HANDOFF, camBureau, confettiAt } from "./bureau";

const START = SCENES.dixh.start - SCENES.dixh.pre;

const CX = 560;
const CY = 540;
const R = 300;
const CIRCLE = `M ${CX},${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01},${CY - R}`;
export const CIRCLE_PTS = samplePath(CIRCLE, 160);
export const SWEEP_X0 = 14;
const LINE_PTS: [number, number][] = CIRCLE_PTS.map((_, i) => [SWEEP_X0, -60 + (i / (CIRCLE_PTS.length - 1)) * (H + 120)]);

const TRACE = { start: 1560, end: 1592 };
const SPIN = { start: 1606, end: 1690 };
const UNROLL = { start: 1786, end: 1800 };
const TICKS = [1720, 1750, 1780];

export const cam8 = (g: number): Cam => {
  const ramp = ip(g, [1596, 1640], [0, 1]) * ip(g, [1774, 1792], [1, 0], EIO);
  return {
    x: 960 + (drift(g, 91, 12) + shake(g, SPIN.end, 12, 26, 9)) * ramp,
    y: 540 + (drift(g, 92, 8) + shake(g, SPIN.end, 12, 20, 10)) * ramp,
    zoom: 1 + 0.05 * ip(g, [1596, 1770], [0, 1], EIO) * ramp,
    rot: drift(g, 93, 0.6) * ramp,
  };
};

// Confettis repris à l'image de passage, en coordonnées écran
const HAND_CAM = camBureau(CONF_HANDOFF);
const HAND_CONF = confettiAt(CONF_HANDOFF).map((c) =>
  c ? { ...c, s: worldToScreen(HAND_CAM, 1, c.x, c.y), z: HAND_CAM.zoom } : null,
);
const OCRE_IDX = HAND_CONF.map((c, i) => (c && c.kind === "o" ? i : -1)).filter((i) => i >= 0);
// Confetti bordeaux le plus central : il fonce vers l'objectif et remplit le cadre
const HERO = HAND_CONF.reduce<number>((best, c, i) => {
  if (!c || c.kind !== "b") return best;
  const d = Math.hypot(c.s[0] - 960, c.s[1] - 540);
  const bc = best >= 0 ? HAND_CONF[best]! : null;
  return !bc || d < Math.hypot(bc.s[0] - 960, bc.s[1] - 540) ? i : best;
}, -1);

const turnsAt = (g: number) => 10 * EIO(ip(g, [SPIN.start, SPIN.end], [0, 1]));

export const S8DixHeures: React.FC = () => {
  const g = useCurrentFrame() + START;
  const cam = cam8(g);
  const u = ip(g, [TRACE.start, TRACE.end], [0, 1]);
  const evo = evolvePath(u, CIRCLE);
  const bgO = g >= 1560 ? 1 : 0;
  const unroll = ip(g, [UNROLL.start, UNROLL.end], [0, 1], EIO);

  const turns = turnsAt(g);
  const n = Math.min(10, Math.floor(turns + 1e-6));
  let changed = g;
  while (changed > SPIN.start && Math.floor(turnsAt(changed - 1) + 1e-6) === n) changed--;
  const bump = g >= SPIN.start ? 1 + 0.12 * (1 - pop(g, changed, { damping: 10, stiffness: 300 })) : 1;
  const impact = g >= SPIN.end ? 1 + 0.28 * (1 - pop(g, SPIN.end, { damping: 7, stiffness: 220, mass: 0.7 })) : 1;
  const counterIn = pop(g, SPIN.start - 8, { damping: 12 });
  const sub = g < SPIN.end + 4 ? 0 : pop(g, SPIN.end + 4, { damping: 13, stiffness: 160 });
  const wave = ip(g, [SPIN.end, SPIN.end + 24], [0, 1]);

  const tickCount = TICKS.filter((t) => g >= t).length;
  const lastTick = TICKS.filter((t) => g >= t).pop() ?? 0;
  const tickK = tickCount ? pop(g, lastTick, { damping: 8, stiffness: 300 }) : 0;
  const minuteAng = turns * 360 + (tickCount ? (tickCount - 1 + tickK) * 6 : 0);
  const hourAng = turns * 30 + tickCount * 0.5;
  const handsIn = pop(g, 1594, { damping: 11 }) * ip(g, [UNROLL.start, UNROLL.start + 8], [1, 0], EIN);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: C.bordeaux, opacity: bgO }} />
      {/* confettis : le bordeaux fonce vers l'objectif, l'ocre rejoint le cercle */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {HAND_CONF.map((c, i) => {
          if (!c || c.kind !== "b" || i === HERO) return null;
          const t = ip(g, [CONF_HANDOFF, 1584], [0, 1], EIN);
          const s = c.z * (1 + 150 * t);
          const x = c.s[0] + (c.s[0] - 960) * t * 2.4;
          const y = c.s[1] + (c.s[1] - 540) * t * 2.4;
          const o = 1;
          if (g >= 1584) return null;
          return (
            <rect
              key={i}
              x={-c.w / 2}
              y={-c.h / 2}
              width={c.w}
              height={c.h}
              rx={2}
              fill={t > 0.35 ? C.bordeaux : c.color}
              opacity={o}
              transform={`translate(${x}, ${y}) rotate(${c.rot + t * 140}) scale(${s * c.flip}, ${s})`}
            />
          );
        })}
        {HERO >= 0 && g < 1580 && (() => {
          const c = HAND_CONF[HERO]!;
          const t = ip(g, [CONF_HANDOFF + 4, 1559], [0, 1], EIN);
          const s = c.z * Math.exp(Math.log(3400 / (c.h * c.z)) * t);
          return (
            <rect
              x={-c.w / 2}
              y={-c.h / 2}
              width={c.w}
              height={c.h}
              rx={2}
              fill={C.bordeaux}
              transform={`translate(${lerp(c.s[0], 960, t)}, ${lerp(c.s[1], 540, t)}) rotate(${c.rot + t * 50}) scale(${s * lerp(c.flip, 1, t)}, ${s})`}
            />
          );
        })()}
      </svg>
      <Camera cam={cam}>
        <Layer depth={1}>
          <WorldSvg>
            {OCRE_IDX.map((idx, j) => {
              const c = HAND_CONF[idx]!;
              const uj = (j + 0.5) / OCRE_IDX.length;
              const arrive = TRACE.start + (TRACE.end - TRACE.start) * uj - 1;
              if (u >= uj && g >= arrive) return null;
              const t = ip(g, [CONF_HANDOFF + 2, arrive], [0, 1], EIO);
              const ang = -Math.PI / 2 + uj * Math.PI * 2;
              const tx = CX + Math.cos(ang) * R;
              const ty = CY + Math.sin(ang) * R;
              const x = lerp(c.s[0], tx, t) - Math.sin(Math.PI * t) * 60;
              const y = lerp(c.s[1], ty, t) - Math.sin(Math.PI * t) * 80;
              const s = lerp(c.z, 0.9, t);
              return (
                <rect
                  key={idx}
                  x={-c.w / 2}
                  y={-c.h / 2}
                  width={c.w}
                  height={c.h}
                  rx={3}
                  fill={C.ocre}
                  transform={`translate(${x}, ${y}) rotate(${lerp(c.rot, ang * 57.3 + 90, t)}) scale(${s * lerp(c.flip, 1, t)}, ${s})`}
                />
              );
            })}
            {/* graduations */}
            {Array.from({ length: 12 }, (_, k) => {
              const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
              const k0 = pop(g, 1580 + k * 2, { damping: 10 });
              const pulse = 1 + 0.5 * Math.max(0, Math.sin(((g - 1724 - k * 2) / 10) * Math.PI)) * (g > 1724 + k * 2 && g < 1734 + k * 2 ? 1 : 0);
              const r0 = R - 54;
              const r1 = R - 26;
              const mx = CX + Math.cos(a) * ((r0 + r1) / 2);
              const my = CY + Math.sin(a) * ((r0 + r1) / 2);
              return (
                <g key={k} transform={`translate(${mx}, ${my}) scale(${k0 * pulse * handsIn}) translate(${-mx}, ${-my})`}>
                  <path
                    d={`M ${CX + Math.cos(a) * r0},${CY + Math.sin(a) * r0} L ${CX + Math.cos(a) * r1},${CY + Math.sin(a) * r1}`}
                    stroke={C.white}
                    strokeWidth={k % 3 === 0 ? 12 : 7}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
            {/* aiguilles */}
            <g transform={`translate(${CX}, ${CY}) scale(${handsIn})`}>
              <path d={`M 0,0 L 0,-150`} stroke={C.white} strokeWidth={18} strokeLinecap="round" transform={`rotate(${hourAng})`} />
              <path d={`M 0,24 L 0,-232`} stroke={C.ocre} strokeWidth={14} strokeLinecap="round" transform={`rotate(${minuteAng})`} />
              <circle r={20} fill={C.ocre} />
              <circle r={7} fill={C.bordeaux} />
            </g>
            {/* contour : tracé, puis onde à l'impact */}
            {g < UNROLL.start && (
              <path
                d={CIRCLE}
                stroke={C.ocre}
                strokeWidth={20}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={evo.strokeDasharray}
                strokeDashoffset={evo.strokeDashoffset}
              />
            )}
            {wave > 0 && wave < 1 && (
              <circle cx={CX} cy={CY} r={R + wave * 190} fill="none" stroke={C.ocre} strokeWidth={18 * (1 - wave)} opacity={1 - wave} />
            )}
          </WorldSvg>
          {/* compteur, puis la ligne qui sort de dessous */}
          <div
            style={{
              position: "absolute",
              left: 950,
              top: 300,
              width: 940,
              color: C.white,
              opacity: g >= SPIN.start - 8 ? 1 : 0,
            }}
          >
            <div
              style={{
                fontFamily: TITLE,
                fontWeight: 800,
                fontSize: 330,
                lineHeight: 0.9,
                letterSpacing: -12,
                transformOrigin: "0% 80%",
                transform: `scale(${counterIn * bump * impact})`,
                whiteSpace: "pre",
              }}
            >
              {`${n} h`}
            </div>
            <div style={{ overflow: "hidden", marginTop: 26, padding: "0 0 10px" }}>
              <div
                style={{
                  fontFamily: BODY,
                  fontWeight: 700,
                  fontSize: 66,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  transform: `translateY(${(1 - sub) * 115}%)`,
                }}
              >
                gagnées chaque semaine
              </div>
            </div>
          </div>
        </Layer>
      </Camera>
      {/* déroulé : le cercle devient le trait vertical qui va balayer l'écran */}
      {g >= UNROLL.start && g < SCENES.signature.start && (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path
            d={poly(CIRCLE_PTS.map((p, i) => [lerp(worldToScreen(cam, 1, p[0], p[1])[0], LINE_PTS[i][0], unroll), lerp(worldToScreen(cam, 1, p[0], p[1])[1], LINE_PTS[i][1], unroll)]))}
            stroke={C.ocre}
            strokeWidth={lerp(20, 24, unroll)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </div>
  );
};
