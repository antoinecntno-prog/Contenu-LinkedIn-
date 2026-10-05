import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../constants";
import { BODY, TITLE } from "../../fonts";
import { Car } from "../../lib/Car";
import { EIN, EIO, EOUT, drift, ip, lerp, poly, pop, shake } from "../../lib/anim";
import { GLYPH, QUESTION_DOT, morphPts, placePts, samplePath } from "../../lib/morph";
import { H, M, T, W } from "../constants";
import { Letters, MaskLine, caretOn } from "../lib/ui";

const START = 926;
const SIZE_Q = 108;
const TOP_Q = 440;
const STEP_Q = 124;

// Emplacement du « ? » mesuré sur une image fixe (coin haut gauche de la réserve en fin de ligne 3)
export const QBOX = { x: 871, y: 688, w: 74, h: 108 };
const Q_SCALE = 1.08;
const qOrigin = () => ({ x: QBOX.x + 36, y: QBOX.y + 62 });

const LINE_Y = 792;
const LINE = { x0: M, x1: W - M };
const Q_PTS = samplePath(GLYPH.question, 64);
const LINE_PTS: [number, number][] = Q_PTS.map((_, i) => [lerp(LINE.x0, LINE.x1, i / (Q_PTS.length - 1)), LINE_Y]);

const WORDS: { text: string; line: number }[] = [
  { text: "Quelle", line: 0 },
  { text: "vidéo", line: 0 },
  { text: "repoussez-vous", line: 1 },
  { text: "faute", line: 2 },
  { text: "de", line: 2 },
  { text: "temps", line: 2 },
];

const Question: React.FC<{ g: number; probe?: boolean }> = ({ g, probe }) => (
  <div style={{ position: "absolute", left: M, top: TOP_Q }}>
    {[0, 1, 2].map((li) => (
      <div
        key={li}
        style={{
          display: "flex",
          gap: SIZE_Q * 0.24,
          height: STEP_Q,
          fontFamily: TITLE,
          fontWeight: 800,
          fontSize: SIZE_Q,
          lineHeight: 1,
          letterSpacing: -3,
          color: C.white,
        }}
      >
        {WORDS.map((w, i) =>
          w.line === li ? <Letters key={i} text={w.text} g={probe ? 9999 : g} start={T.words[i]} stagger={0.8} /> : null,
        )}
        {li === 2 && <div style={{ width: QBOX.w, height: QBOX.h, flexShrink: 0, marginLeft: -SIZE_Q * 0.08, background: probe ? "#f00" : undefined }} />}
      </div>
    ))}
  </div>
);

export const Fin: React.FC = () => {
  const g = useCurrentFrame() + START;

  // balayage d'entrée
  const sx = lerp(-40, W + 40, EIO(ip(g, [T.sweep.start, T.sweep.end], [0, 1])));

  // rideau : le panneau bordeaux tombe, le « ? » reste et devient le trait
  const cur = EIN(ip(g, [T.curtain.start, T.curtain.end], [0, 1]));
  const camQ = {
    s: 1 + 0.035 * ip(g, [930, 1062], [0, 1], EIO),
    x: drift(g, 41, 5) + shake(g, T.words[6], 14, 10, 7),
    y: drift(g, 42, 4) + shake(g, T.words[6], 14, 8, 8),
  };

  // le « ? »
  const qIn = pop(g, T.words[6], { damping: 8, stiffness: 200, mass: 0.7 });
  const antic = ip(g, [1052, 1062], [0, 1], EIO) * ip(g, [1062, 1068], [1, 0]);
  const m = EIO(ip(g, [T.curtain.start, T.curtain.start + 20], [0, 1]));
  const o = qOrigin();
  // position écran du « ? » quand le panneau bouge encore avec sa caméra
  const qx = (o.x - W / 2) * camQ.s + W / 2 + camQ.x;
  const qy = (o.y - H / 2) * camQ.s + H / 2 + camQ.y;
  const qs = Q_SCALE * camQ.s * lerp(0.2, 1, Math.min(1, qIn)) * (1 + 0.15 * antic);
  const qRot = (1 - Math.min(1, qIn)) * -40 + Math.sin(g / 9) * 3 * (1 - m);
  const glyph = placePts(Q_PTS, qx, qy, qs * (qIn > 1 ? 1 + (qIn - 1) * 0.6 : 1), qRot);
  const pts = morphPts(glyph, LINE_PTS, m);
  const dot = placePts([QUESTION_DOT], qx, qy, qs, qRot)[0];
  const dotR = 12.5 * qs * (1 - m);
  const landed = g >= T.curtain.start + 20;
  const lineBump = landed ? 1 + 0.6 * (1 - pop(g, T.curtain.start + 20, { damping: 8, stiffness: 260 })) : 1;

  // signature
  const camS = {
    s: 1 + 0.03 * ip(g, [1080, 1320], [0, 1], EIO),
    x: drift(g, 51, 4) + shake(g, T.final, 14, 9, 9),
    y: drift(g, 52, 3) + shake(g, T.final, 14, 7, 10),
  };
  const carStart = 1100;
  const carX = lerp(-170, 860, EOUT(ip(g, [carStart, 1162], [0, 1])));
  const brake = g >= 1158 ? 1 - pop(g, 1158, { damping: 8, stiffness: 220 }) : 0;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${Math.max(0, W - sx)}px 0 0)` }}>
      {/* signature, sous le rideau */}
      {g >= T.curtain.start && (
        <div style={{ position: "absolute", inset: 0, background: C.bg }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%", transform: `translate(${camS.x}px, ${camS.y}px) scale(${camS.s})` }}>
            {["Antoine", "Contino"].map((word, li) => (
              <div
                key={li}
                style={{
                  position: "absolute",
                  left: M - 4,
                  top: 404 + li * 178,
                  display: "flex",
                  fontFamily: TITLE,
                  fontWeight: 800,
                  fontSize: 186,
                  lineHeight: 1,
                  letterSpacing: -6,
                  color: C.white,
                  whiteSpace: "pre",
                }}
              >
                {Array.from(word).map((ch, i) => {
                  // première ligne qui tombe, seconde qui monte : les deux se rejoignent sur le trait
                  const k = pop(g, T.final + li * 4 + i * 1.5, { damping: 10, stiffness: 220, mass: 0.6 });
                  return (
                    <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.1em 0 0.2em", margin: "-0.1em 0 -0.2em" }}>
                      <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * (li === 0 ? -140 : 140)}%)` }}>{ch}</span>
                    </span>
                  );
                })}
              </div>
            ))}
            <div style={{ position: "absolute", left: M, top: LINE_Y + 26, fontFamily: BODY, fontWeight: 700, fontSize: 46, color: C.white }}>
              <MaskLine t={-pop(g, 1094, { damping: 14 }) + 2}>
                <span style={{ display: "inline-block" }}>L'IA simplifiée et taillée sur mesure.</span>
              </MaskLine>
            </div>
            <div style={{ position: "absolute", left: M, top: LINE_Y + 110, fontFamily: BODY, fontWeight: 500, fontSize: 38, color: "rgba(255,255,255,0.78)" }}>
              <MaskLine t={-pop(g, 1104, { damping: 14 }) + 2}>30 minutes pour en parler</MaskLine>
            </div>
            <div style={{ position: "absolute", left: M, top: LINE_Y + 162, display: "flex", alignItems: "center", fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.ocre }}>
              <MaskLine t={-pop(g, 1110, { damping: 14 }) + 2}>calendly.com/antoine-cntno/30min</MaskLine>
              {g >= 1130 && caretOn(g) && <div style={{ width: 5, height: 44, marginLeft: 6, background: C.ocre }} />}
            </div>
            <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {landed && <path d={`M ${LINE.x0},${LINE_Y} L ${LINE.x1},${LINE_Y}`} stroke={C.ocre} strokeWidth={12 * lineBump} strokeLinecap="round" />}
              {g >= carStart && (
                <Car
                  x={carX}
                  y={LINE_Y - 6}
                  scale={0.46}
                  wheelRot={(carX / 29) * 57.3}
                  tilt={brake * 6}
                  sy={1 - 0.08 * brake}
                  sx={1 + 0.05 * brake}
                  bob={Math.sin(g * 0.9) * 1.4}
                  headBob={Math.sin(g * 0.9 + 1) * 2 + brake * 5}
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {/* question sur aplat bordeaux */}
      {cur < 1 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${cur * H * 1.05}px)` }}>
          <div style={{ position: "absolute", inset: 0, background: C.bordeaux }}>
            <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%", transform: `translate(${camQ.x}px, ${camQ.y}px) scale(${camQ.s})` }}>
              <Question g={g} />
            </div>
          </div>
        </div>
      )}

      {/* le « ? » puis le trait, au-dessus de tout */}
      {g >= T.words[6] && !landed && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={poly(pts)} stroke={C.ocre} strokeWidth={lerp(21 * qs, 12, m)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {dotR > 0.5 && <circle cx={dot[0]} cy={dot[1]} r={dotR} fill={C.ocre} />}
        </svg>
      )}

      </div>
      {sx < W + 30 && (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M ${sx},-60 L ${sx},${H + 60}`} stroke={C.ocre} strokeWidth={26} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

export const FinProbe: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "#000" }}>
    <Question g={0} probe />
  </div>
);
