import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { C } from "../../constants";
import { TITLE } from "../../fonts";
import { EIN, EIO, EOUT, drift, ip, lerp, pop, shake, zoomLerp } from "../../lib/anim";
import { CODE, CodeLine } from "../code";
import { H, M, T, W } from "../constants";
import { Letters, caretOn, rnd } from "../lib/ui";

const LINES_A = ["Ma dernière", "vidéo de", "formation IA"];
const SIZE_A = 148;
const TOP_A = 340;
const STEP_A = 160;
const typeAt = (i: number) => 8 + i * 1.1;
const EXIT_A = 54;

const TOP_B1 = 410;
const TOP_B2 = 580;
const SIZE_B1 = 152;
const SIZE_B2 = 214;
export const START_B = 70;

// Centre et rayons intérieurs du « o » de « code », mesurés sur une image fixe de la scène (marge de 0,8 px)
export const O = { x: 558.5, y: 702, rx: 24.6, ry: 35.6 };

// Caméra de la scène : légère poussée, dérive, secousse à l'impact. Plus de dérive pendant la plongée.
const camScale = (g: number) => 1 + 0.05 * ip(g, [0, 116], [0, 1], EIO);
const camOff = (g: number) => {
  const amp = ip(g, [90, 112], [1, 0]);
  return {
    x: drift(g, 11, 6) * amp + shake(g, T.impactCode, 16, 16, 3),
    y: drift(g, 12, 5) * amp + shake(g, T.impactCode, 16, 12, 4),
  };
};

export const zoomAt = (g: number) =>
  zoomLerp(1, 70, ip(g, [T.zoom.start, T.zoom.end], [0, 1], Easing.inOut(Easing.quad)));

// Position du trou du « o » à l'écran, pour ouvrir la scène suivante dedans
export const oHole = (g: number) => {
  const s = camScale(g);
  const off = camOff(g);
  const x = (O.x - W / 2) * s + W / 2 + off.x;
  const y = (O.y - H / 2) * s + H / 2 + off.y;
  const k = s * zoomAt(g);
  return { x, y, rx: O.rx * k, ry: O.ry * k };
};

const CodeRain: React.FC<{ g: number }> = ({ g }) => {
  const a = ip(g, [64, 90], [0, 1]) * ip(g, [112, 130], [1, 0]);
  if (a <= 0) return null;
  const layers = [
    { speed: 2.4, size: 26, op: 0.22, x: 60, y0: 1400 },
    { speed: 1.3, size: 20, op: 0.12, x: 420, y0: 1100 },
  ];
  return (
    <>
      {layers.map((L, li) => (
        <div key={li} style={{ position: "absolute", left: L.x, top: L.y0 - (g - 64) * L.speed, opacity: L.op * a }}>
          {[...CODE, ...CODE].map((line, i) => (
            <CodeLine key={i} text={line} size={L.size} style={{ lineHeight: 1.7, opacity: 0.6 + 0.4 * rnd(`rain${li}${i}`) }} />
          ))}
        </div>
      ))}
    </>
  );
};

const GLYPHS = Array.from("{}<>/=;()[]*#");

export const Accroche: React.FC = () => {
  const g = useCurrentFrame();
  const s = camScale(g);
  const off = camOff(g);
  const z = zoomAt(g);

  // Phase A : la phrase se tape
  let idx = 0;
  const typedLines = LINES_A.map((line) => {
    const chars = Array.from(line).map((ch) => ({ ch, i: idx++ }));
    return chars;
  });
  const typedCount = Math.floor((g - 8) / 1.1) + 1;
  const caretLine = g < typeAt(11) ? 0 : g < typeAt(19) ? 1 : 2;

  // Phase B : impact sur « code. »
  const punch = 1 + 0.07 * (1 - pop(g, T.impactCode, { damping: 9, stiffness: 260, mass: 0.5 })) * (g >= T.impactCode ? 1 : 0);
  const flash = ip(g, [T.impactCode, T.impactCode + 14], [1, 0]) * (g >= T.impactCode ? 1 : 0);

  const codeWord = Array.from("en code.");
  const resolveAt = (i: number) => (i < 3 ? 0 : T.impactCode - 8 + (i - 3) * 2);

  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${W / 2}px ${H / 2}px`,
          transform: `translate(${off.x}px, ${off.y}px) scale(${s})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${O.x}px ${O.y}px`,
            transform: `scale(${z})`,
          }}
        >
          <CodeRain g={g} />

          {/* Phase A */}
          {g < EXIT_A + 24 &&
            typedLines.map((chars, li) => {
              const u = EIN(ip(g, [EXIT_A + li * 3, EXIT_A + 14 + li * 3], [0, 1]));
              return (
                <div
                  key={li}
                  style={{
                    position: "absolute",
                    left: M,
                    top: TOP_A + li * STEP_A,
                    overflow: "hidden",
                    padding: "0.1em 0.2em 0.2em 0",
                    margin: "-0.1em 0 -0.2em 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      fontFamily: TITLE,
                      fontWeight: 800,
                      fontSize: SIZE_A,
                      lineHeight: 1,
                      letterSpacing: -3,
                      color: C.white,
                      whiteSpace: "pre",
                      transform: `translateY(${-u * 120}%)`,
                    }}
                  >
                    {chars
                      .filter((c) => c.i < typedCount)
                      .map(({ ch, i }) => {
                        const k = pop(g, typeAt(i), { damping: 12, stiffness: 260, mass: 0.5 });
                        return (
                          <span
                            key={i}
                            style={{
                              display: "inline-block",
                              transformOrigin: "50% 90%",
                              transform: `translateY(${(1 - k) * 28}px) scale(${lerp(0.35, 1, k)})`,
                            }}
                          >
                            {ch === " " ? " " : ch}
                          </span>
                        );
                      })}
                    {caretLine === li && g < EXIT_A && caretOn(g, typeAt(31) + 4) && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 13,
                          height: SIZE_A * 0.78,
                          marginLeft: 8,
                          background: C.ocre,
                          alignSelf: "center",
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}

          {/* Phase B */}
          {g >= START_B - 2 && (
            <>
              <Letters
                text="est écrite"
                g={g}
                start={START_B}
                stagger={1.2}
                style={{
                  position: "absolute",
                  left: M,
                  top: TOP_B1,
                  fontFamily: TITLE,
                  fontWeight: 800,
                  fontSize: SIZE_B1,
                  lineHeight: 1,
                  letterSpacing: -3,
                  color: C.white,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: M,
                  top: TOP_B2,
                  transformOrigin: `${O.x - M}px ${O.y - TOP_B2}px`,
                  transform: `scale(${punch})`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontFamily: TITLE,
                    fontWeight: 800,
                    fontSize: SIZE_B2,
                    lineHeight: 1,
                    letterSpacing: -5,
                    color: C.ocre,
                    whiteSpace: "pre",
                    textShadow: flash > 0 ? `0 0 ${40 * flash}px rgba(232,171,82,${0.8 * flash})` : undefined,
                  }}
                >
                  {codeWord.map((ch, i) => {
                    const k = pop(g, START_B + 8 + i * 1.6, { damping: 11, stiffness: 210, mass: 0.6 });
                    const resolved = g >= resolveAt(i);
                    const glyph = resolved ? ch : GLYPHS[Math.floor(rnd(`gl${i}-${Math.floor(g / 3)}`) * GLYPHS.length)];
                    return (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          overflow: "hidden",
                          padding: "0.1em 0 0.2em",
                          margin: "-0.1em 0 -0.2em",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            transform: `translateY(${(1 - k) * 140}%)`,
                            color: resolved ? C.ocre : C.white,
                          }}
                        >
                          {/* la chasse reste celle de la lettre finale pendant le brouillage */}
                          <span style={{ position: "relative", display: "inline-block" }}>
                            <span style={{ opacity: resolved ? 1 : 0 }}>{ch === " " ? " " : ch}</span>
                            {!resolved && (
                              <span style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center" }}>{glyph}</span>
                            )}
                          </span>
                        </span>
                      </span>
                    );
                  })}
                  {g >= T.impactCode && g < T.zoom.start && caretOn(g) && (
                    <span style={{ display: "inline-block", width: 16, height: SIZE_B2 * 0.72, marginLeft: 10, background: C.ocre, alignSelf: "center" }} />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* lueur qui annonce la plongée */}
      {g >= T.zoom.start - 6 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: C.bg,
            opacity: EOUT(ip(g, [T.zoom.end - 10, T.zoom.end], [0, 1])),
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

// Pour la mesure du « o » : la ligne seule, sans animation
export const OProbe: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "#000" }}>
    <div
      style={{
        position: "absolute",
        left: M,
        top: TOP_B2,
        display: "flex",
        fontFamily: TITLE,
        fontWeight: 800,
        fontSize: SIZE_B2,
        lineHeight: 1,
        letterSpacing: -5,
        whiteSpace: "pre",
        color: "transparent",
      }}
    >
      {Array.from("en code.").map((ch, i) => (
        <span
          key={i}
          style={{ display: "inline-block", overflow: "hidden", padding: "0.1em 0 0.2em", margin: "-0.1em 0 -0.2em", color: i === 4 ? "#fff" : "transparent" }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </div>
  </div>
);
