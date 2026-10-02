import React from "react";
import { useCurrentFrame } from "remotion";
import { C, SCENES, W } from "../constants";
import { BODY } from "../fonts";
import { Cam, Camera, Layer, WorldSvg, worldToScreen } from "../lib/camera";
import { Character, P0, armIK } from "../lib/Character";
import { EIO, blink, breath, drift, ip, lerp, pop, zoomLerp } from "../lib/anim";

// Écran de l'ordinateur dans le monde
const SX0 = 640;
const SY0 = 240;
const SW = 640;
const SH = 410;
const HINGE_WY = 654;
const Z0 = 3;

// État de la charnière à la première image (raccord avec la scène 3)
export const HINGE0 = { y: 1000, width: 8 * Z0 };
const CAMY0 = HINGE_WY - (HINGE0.y - 540) / Z0;

// Panoramique filé vers la scène 5 (images globales)
export const WHIP = { start: 866, end: 906 };
const START = SCENES.ordi.start;

export const camS4 = (f: number): Cam => {
  const ramp = ip(f, [0, 40], [0, 1]);
  const pull = ip(f, [0, 52], [0, 1], EIO);
  const push = ip(f, [52, 206], [0, 1], EIO);
  const out = ip(f, [204, 246], [0, 1], EIO);
  const z = zoomLerp(zoomLerp(Z0, 1.45, pull) * lerp(1, 1.07, push), 1.12, out);
  return {
    x: lerp(960 + drift(f, 31, 10) * ramp, 760, out),
    y: lerp(lerp(CAMY0, 520, pull) + drift(f, 32, 6) * ramp, 560, out),
    zoom: z,
    rot: drift(f, 33, 0.5) * ramp + lerp(0, -5, out),
  };
};

export const whipOffset = (g: number) => ip(g, [WHIP.start, WHIP.end], [0, W], EIO);

// Extrémités de la charnière à l'écran, glissement compris
export const hingeScreen = (g: number) => {
  const cam = camS4(g - START);
  const off = whipOffset(g);
  const a = worldToScreen(cam, 1, SX0, HINGE_WY);
  const b = worldToScreen(cam, 1, SX0 + SW, HINGE_WY);
  return { a: [a[0] + off, a[1]] as [number, number], b: [b[0] + off, b[1]] as [number, number], width: 8 * cam.zoom };
};

const ELLE = { x: 470, y: 1210, s: 1.7 };
const MOI = { x: 1440, y: 1210, s: 1.7 };
const PAD = { x: 1112, y: 748 };

const MSG = "Son compte, réglé sur son métier.";

const Bar: React.FC<{ w: number; p: number; color: string; top: number; left?: number }> = ({ w, p, color, top, left = 0 }) => (
  <div style={{ position: "absolute", top, left, width: w * p, height: 13, borderRadius: 7, background: color }} />
);

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg
    width={40}
    height={50}
    style={{ position: "absolute", left: x, top: y, overflow: "visible", transform: `scale(${press})`, transformOrigin: "0 0" }}
  >
    <path d="M 0,0 L 0,36 L 9,27 L 16,43 L 23,40 L 16,25 L 28,25 Z" fill={C.white} stroke={C.n1} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

const ChatUI: React.FC<{ f: number }> = ({ f }) => {
  const open = pop(f, 40, { damping: 12, stiffness: 160 });
  const nType = Math.floor(ip(f, [74, 122], [0, MSG.length]));
  const typed = MSG.slice(0, nType);
  const rest = MSG.slice(nType);
  const send = ip(f, [134, 152], [0, 1], EIO);
  const scroll = send * 150;

  // curseur : glisse vers l'envoi, clic à 130
  const cx = lerp(380 + drift(f, 41, 14, 70), 552, ip(f, [108, 128], [0, 1], EIO));
  const cy = lerp(150 + drift(f, 42, 10, 60), 334, ip(f, [108, 128], [0, 1], EIO));
  const press = f >= 130 && f < 135 ? 0.82 : 1;
  const ripple = ip(f, [130, 150], [0, 1]);

  // bulle envoyée : part du champ de saisie et monte
  const inBox = { left: 14, top: 228, w: 492, h: 132 };
  const bubble = { left: 86, top: 52, w: 492, h: 132 };
  const bl = lerp(inBox.left, bubble.left, send);
  const bt = lerp(inBox.top, bubble.top, send);
  const bw = lerp(inBox.w, bubble.w, send);

  const replyIn = (i: number) => ip(f, [162 + i * 10, 172 + i * 10], [0, 1], EIO);

  return (
    <div
      style={{
        position: "absolute",
        left: 22,
        top: 18,
        width: SW - 44,
        height: SH - 36,
        background: C.white,
        borderRadius: 14,
        overflow: "hidden",
        transform: `scale(${open})`,
        opacity: f < 40 ? 0 : 1,
        fontFamily: BODY,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 34, background: "#F1ECE8" }}>
        <div style={{ position: "absolute", left: 16, top: 11, width: 12, height: 12, borderRadius: 6, background: C.bordeaux2 }} />
        <div style={{ position: "absolute", left: 38, top: 12, width: 120, height: 10, borderRadius: 5, background: C.n6 }} />
      </div>
      {/* fil de messages factices */}
      <div style={{ position: "absolute", left: 0, top: -scroll, right: 0 }}>
        <div style={{ position: "absolute", left: 18, top: 50, width: 340, height: 64, borderRadius: 12, background: "#EEE7E2" }}>
          <Bar w={290} p={ip(f, [50, 60], [0, 1], EIO)} color={C.n5} top={14} left={16} />
          <Bar w={200} p={ip(f, [58, 68], [0, 1], EIO)} color={C.n5} top={36} left={16} />
        </div>
        <div style={{ position: "absolute", left: 360, top: 128, width: 210, height: 42, borderRadius: 12, background: C.bordeaux2, opacity: f < 64 ? 0 : 1 }}>
          <Bar w={170} p={ip(f, [66, 76], [0, 1], EIO)} color="#E8C9CF" top={15} left={20} />
        </div>
      </div>
      {/* réponse factice après l'envoi */}
      <div
        style={{
          position: "absolute",
          left: 18,
          top: 196,
          width: 380,
          height: 86,
          borderRadius: 12,
          background: "#EEE7E2",
          opacity: f < 158 ? 0 : 1,
          transform: `scale(${f < 158 ? 0.8 : pop(f, 158)})`,
          transformOrigin: "0 0",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Bar key={i} w={[330, 300, 320, 180][i]} p={replyIn(i)} color={C.n5} top={10 + i * 18} left={16} />
        ))}
      </div>
      {/* champ de saisie qui rapetisse après l'envoi */}
      <div
        style={{
          position: "absolute",
          left: 14,
          top: lerp(228, 296, send),
          width: 492,
          height: lerp(132, 64, send),
          borderRadius: 12,
          border: `3px solid ${C.n6}`,
          background: C.white,
        }}
      />
      {/* texte tapé, puis porté par la bulle */}
      <div
        style={{
          position: "absolute",
          left: bl,
          top: bt,
          width: bw,
          height: lerp(inBox.h, bubble.h, send),
          borderRadius: 12,
          background: send > 0 ? `rgba(142, 39, 64, ${send})` : "transparent",
          padding: "12px 16px",
          boxSizing: "border-box",
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.18,
          color: send > 0.5 ? C.white : C.n1,
        }}
      >
        <span>{typed}</span>
        {nType < MSG.length && nType > 0 && (
          <span style={{ display: "inline-block", width: 4, height: 44, background: C.bordeaux2, verticalAlign: "-8px", margin: "0 -4px 0 0" }} />
        )}
        {nType === MSG.length && send === 0 && Math.floor(f / 9) % 2 === 0 && (
          <span style={{ display: "inline-block", width: 4, height: 44, background: C.bordeaux2, verticalAlign: "-8px", margin: "0 -4px 0 0" }} />
        )}
        <span style={{ color: "transparent" }}>{rest}</span>
      </div>
      {/* bouton d'envoi */}
      <div
        style={{
          position: "absolute",
          right: 14,
          top: lerp(298, 296, send),
          width: 64,
          height: 64,
          borderRadius: 12,
          background: f >= 130 && f < 138 ? C.bordeaux : C.bordeaux2,
          transform: `scale(${f >= 130 && f < 136 ? 0.9 : 1})`,
          overflow: "visible",
        }}
      >
        <svg width={64} height={64} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={32} cy={32} r={10 + ripple * 60} fill="none" stroke={C.bordeaux2} strokeWidth={6 * (1 - ripple)} opacity={f >= 130 ? 1 - ripple : 0} />
          <path d="M 18,32 L 44,32 M 34,21 L 45,32 L 34,43" stroke={C.white} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <Cursor x={cx} y={cy} press={press} />
    </div>
  );
};

export const S4Ordinateur: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + START;
  const cam = camS4(f);
  const unfold = f < 4 ? 0 : pop(f, 4, { damping: 11, stiffness: 180 });
  const lid = 1 + 0.035 * (1 - pop(f, 8, { damping: 8, stiffness: 160 }));

  // ma main suit le curseur sur le pavé tactile
  const cxp = ip(f, [108, 128], [0, 1], EIO);
  const target = { x: PAD.x + lerp(-12, 14, cxp) + drift(f, 51, 4, 60), y: PAD.y + lerp(-4, 6, cxp) - (f >= 130 && f < 135 ? -4 : 0) };
  const ik = armIK(-1, (target.x - MOI.x) / MOI.s, (target.y - MOI.y) / MOI.s, false);
  const poseMoi = { ...P0, aL: ik.a, eL: ik.e, turn: ip(f, [172, 178], [0, -0.7]) * ip(f, [214, 220], [1, 0]) };
  const poseElle = { ...P0, aR: 20, eR: -30, turn: ip(f, [158, 162], [0, 0.85]) * ip(f, [222, 226], [1, 0]) };
  const nodElle = f > 150 && f < 214 ? Math.max(0, Math.sin((f - 150) / 7)) * 9 : 0;
  const nodMoi = f > 176 && f < 232 ? Math.max(0, Math.sin((f - 176) / 7)) * 9 : 0;

  const steam = (i: number) => {
    const ph = ((f + i * 20) % 60) / 60;
    return { x: 806 + i * 12 + Math.sin(ph * 6 + i) * 8, y: 760 - ph * 110, o: Math.sin(ph * Math.PI) * 0.55 * ip(f, [24, 44], [0, 1]) };
  };

  const off = whipOffset(g);
  const hingeVisible = g < WHIP.start;

  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${off}px)` }}>
      <Camera cam={cam} background={C.bg}>
        <Layer depth={0.7}>
          <WorldSvg>
            <g transform={`rotate(${Math.sin(f / 40) * 3}, 300, -100)`}>
              <path d="M 300,-100 L 300,90" stroke={C.n3} strokeWidth={5} />
              <path d="M 250,130 Q 254,88 300,86 Q 346,88 350,130 Z" fill={C.bordeaux} />
            </g>
            <rect x={1460} y={150} width={260} height={190} rx={6} fill={C.n2} />
            <rect x={1476} y={166} width={228} height={158} fill={C.bordeaux} />
            <circle cx={1550} cy={260} r={40} fill={C.bordeaux2} />
          </WorldSvg>
        </Layer>
        <Layer depth={1}>
          <WorldSvg>
            <path d="M -600,600 L 2600,600 L 2600,1500 L -600,1500 Z" fill={C.n2} />
            <rect x={-600} y={596} width={3200} height={10} fill={C.n3} />
            {/* clavier qui se déplie sous la charnière */}
            <g transform={`translate(0, ${HINGE_WY}) scale(1, ${unfold}) translate(0, ${-HINGE_WY})`}>
              <path d="M 630,656 L 1290,656 L 1352,774 L 568,774 Z" fill={C.n1} />
              {Array.from({ length: 4 }, (_, r) =>
                Array.from({ length: 12 }, (_, k) => {
                  const y = 668 + r * 16;
                  const inset = (r * 16 * 62) / 118;
                  const x0 = 640 - inset;
                  const w = (640 + inset * 2) / 12;
                  return <rect key={`${r}-${k}`} x={x0 + k * w + 3} y={y} width={w - 6} height={11} rx={2} fill={C.n2} />;
                }),
              )}
              <rect x={1060} y={736} width={120} height={30} rx={5} fill={C.n2} />
            </g>
            {/* écran qui rebondit sur sa charnière */}
            <g transform={`translate(0, ${HINGE_WY}) scale(1, ${lid}) translate(0, ${-HINGE_WY})`}>
              <rect x={SX0 - 18} y={SY0 - 18} width={SW + 36} height={SH + 18 + 4} rx={16} fill={C.n1} />
              <rect x={SX0} y={SY0} width={SW} height={SH} fill={C.bordeaux} />
            </g>
            {hingeVisible && (
              <path d={`M ${SX0},${HINGE_WY} L ${SX0 + SW},${HINGE_WY}`} stroke={C.ocre} strokeWidth={8} strokeLinecap="round" />
            )}
          </WorldSvg>
          <div
            style={{
              position: "absolute",
              left: SX0,
              top: SY0,
              width: SW,
              height: SH,
              transformOrigin: `0 ${HINGE_WY - SY0}px`,
              transform: `scaleY(${lid})`,
            }}
          >
            <ChatUI f={f} />
          </div>
          <WorldSvg>
            {/* tasse qui fume */}
            <g>
              <path d="M 830,776 C 856,776 856,812 830,812" stroke={C.n6} strokeWidth={8} fill="none" />
              <rect x={770} y={762} width={62} height={66} rx={10} fill={C.n6} />
              <ellipse cx={801} cy={764} rx={31} ry={7} fill={C.n1} />
              {[0, 1, 2].map((i) => {
                const s = steam(i);
                return (
                  <path key={i} d={`M ${s.x},${s.y} q 10,-16 0,-32 q -10,-16 0,-32`} stroke={C.n6} strokeWidth={5} strokeLinecap="round" fill="none" opacity={s.o} />
                );
              })}
            </g>
            <Character
              who="elle"
              view="back"
              x={ELLE.x}
              y={ELLE.y}
              scale={ELLE.s}
              pose={poseElle}
              breathe={breath(f, 2)}
              headDy={nodElle}
              blinkOpen={blink(f, 7)}
            />
            <Character
              who="moi"
              view="back"
              x={MOI.x}
              y={MOI.y}
              scale={MOI.s}
              pose={poseMoi}
              breathe={breath(f, 4)}
              headDy={nodMoi}
              blinkOpen={blink(f, 8)}
            />
          </WorldSvg>
        </Layer>
      </Camera>
    </div>
  );
};
