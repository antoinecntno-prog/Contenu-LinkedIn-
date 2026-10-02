import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C } from "../../constants";
import { BODY, MONO, TITLE } from "../../fonts";
import { EIN, EIO, EOUT, drift, ip, lerp, pop } from "../../lib/anim";
import { CODE, CodeLine, DIFF, MONO_ADV, tokenize } from "../code";
import { K, M, PAL, T, W } from "../constants";
import ONDE from "../onde-film-precedent.json";
import { MaskLine, OldFilm, caretOn, rnd } from "../lib/ui";
import { TERM, TITLEBAR } from "./Entrees";
import { MaquetteOffre, MaquetteRecrutement } from "./Maquettes";

const START = 262;

// ------------------------------------------------------------ géométrie

const FS = 27; // corps du code
const ADV = FS * MONO_ADV;
const LH = 42;
const CODE_X = 86;
const codeY = (t: number) => lerp(TITLEBAR + 34, 400, t);

const PREV = { x: 60, y: 380, w: 960, h: 540 };
const TL = { x: 60, w: 960, vy: 996, vh: 80, ay: 1096, ah: 80 };
const SCENE_LEN = [240, 210, 210, 240, 240, 240, 180, 240, 120];
const CLIPS = (() => {
  let acc = 0;
  return SCENE_LEN.map((l) => {
    const x = TL.x + (acc / 1920) * TL.w + 3;
    acc += l;
    return { x, w: (l / 1920) * TL.w - 6 };
  });
})();
const CLIP_LINES = [6, 7, 8, 9, 10, 11, 12, 13, 14];

// Coupes de l'aperçu : image globale de la coupe, image du film précédent montrée
const CUTS = [
  { at: T.cuts[0], from: 30 },
  { at: T.cuts[1], from: 495 },
  { at: T.cuts[2], from: 1680 },
  { at: T.cuts[3], from: 1150 },
];
const RESUME = T.check + 4;
const HAND = { x: 1470, y: 650 };

export const oldFrameAt = (g: number) => {
  if (g < CUTS[0].at) return CUTS[0].from;
  if (g < T.pause) {
    const c = [...CUTS].reverse().find((k) => g >= k.at)!;
    return c.from + (g - c.at);
  }
  if (g < RESUME) return CUTS[3].from + (T.pause - CUTS[3].at);
  return CUTS[3].from + (T.pause - CUTS[3].at) + (g - RESUME);
};

const posOf = (f: number) => TL.x + (f / 1920) * TL.w;

const playheadX = (g: number) => {
  if (g < 476) return TL.x + TL.w * EIO(ip(g, [456, 476], [0, 1]));
  if (g < CUTS[0].at) return lerp(TL.x + TL.w, posOf(CUTS[0].from), EOUT(ip(g, [476, 482], [0, 1])));
  const c = [...CUTS].reverse().find((k) => g >= k.at)!;
  const prev = c.at === CUTS[0].at ? posOf(CUTS[0].from) : posOf(oldFrameAt(c.at - 1));
  return lerp(prev, posOf(oldFrameAt(g)), EOUT(ip(g, [c.at, c.at + 7], [0, 1])));
};

// ------------------------------------------------------------ éléments

const Headline: React.FC<{ g: number; lines: string[]; start: number; exit?: number; top?: number }> = ({
  g,
  lines,
  start,
  exit,
  top = 108,
}) => {
  if (g < start - 2) return null;
  if (exit !== undefined && g > exit + 24) return null;
  return (
    <div style={{ position: "absolute", left: M, top, fontFamily: TITLE, fontWeight: 800, fontSize: 90, lineHeight: 1, letterSpacing: -2.5 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <MaskLine
            t={pop(g, start + i * 7, { damping: 14, stiffness: 170 })}
            u={exit === undefined ? 0 : EIN(ip(g, [exit + i * 3, exit + 14 + i * 3], [0, 1]))}
          >
            <span style={{ color: i === lines.length - 1 ? C.ocre : C.white }}>{l}</span>
          </MaskLine>
        </div>
      ))}
    </div>
  );
};

const lineStart = (i: number) => 268 + i * 6.5;

const Editor: React.FC<{ g: number }> = ({ g }) => {
  const t = EIO(ip(g, [T.grow.start, T.grow.end], [0, 1]));
  const R = {
    x: lerp(TERM.x, 0, t),
    y: lerp(TERM.y, 0, t),
    w: lerp(TERM.w, W, t),
    h: lerp(TERM.h, 1350, t),
    r: lerp(30, 0, t),
  };
  const s = R.w / W;
  const cy = codeY(t);
  const ramp = ip(g, [322, 344], [0, 1], EIO) * ip(g, [406, 420], [1, 0], EIO);
  const rotX = 18 * ramp;
  const rotY = lerp(-16, 10, ip(g, [322, 420], [0, 1])) * ramp;
  const rotZ = -3 * ramp;
  const textOp = ip(g, [T.render, T.render + 6], [1, 0]);
  if (textOp <= 0) return null;
  const current = CODE.findIndex((_, i) => g < lineStart(i) + 6);
  const titleSwap = ip(g, [270, 280], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: R.x,
        top: R.y,
        width: R.w,
        height: R.h,
        borderRadius: R.r,
        overflow: "hidden",
        background: C.bg,
        boxShadow: t < 1 ? "0 40px 90px rgba(0,0,0,0.45)" : undefined,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1350, transformOrigin: "0 0", transform: `scale(${s})` }}>
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: TITLEBAR, background: K.panel, borderBottom: `2px solid ${K.rule}`, opacity: 1 - t }}>
          <div style={{ position: "absolute", left: 32, top: 20, fontFamily: BODY, fontWeight: 500, fontSize: 26, color: K.dim, opacity: 1 - titleSwap }}>Terminal</div>
          <div style={{ position: "absolute", left: 32, top: 20, fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.white, opacity: titleSwap }}>Film.tsx</div>
        </div>
        <div style={{ position: "absolute", inset: 0, perspective: ramp > 0 ? 1400 : undefined, perspectiveOrigin: "50% 40%" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: 1350,
              transformOrigin: `540px ${cy + 11 * LH}px`,
              transform: ramp > 0 ? `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${1 - 0.05 * ramp})` : undefined,
              opacity: textOp,
            }}
          >
            {CODE.map((line, i) => {
              const st = lineStart(i);
              if (g < st) return null;
              const n = Math.ceil(line.length * ip(g, [st, st + 6], [0, 1]));
              const isCur = i === current;
              return (
                <React.Fragment key={i}>
                  {isCur && <div style={{ position: "absolute", left: 0, right: 0, top: cy + i * LH - 4, height: LH, background: "rgba(255,255,255,0.05)" }} />}
                  <div style={{ position: "absolute", left: 14, width: 50, top: cy + i * LH + 2, textAlign: "right", fontFamily: MONO, fontSize: 21, color: K.rule }}>{i + 1}</div>
                  <div style={{ position: "absolute", left: CODE_X, top: cy + i * LH, display: "flex", alignItems: "center" }}>
                    <CodeLine text={line} n={n} size={FS} />
                    {isCur && caretOn(g, 420) && <div style={{ width: 15, height: 30, background: C.ocre, marginLeft: 2 }} />}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Les lignes de code deviennent des barres, puis les plans de la timeline
const Bars: React.FC<{ g: number }> = ({ g }) => {
  if (g < T.render || g > 500) return null;
  const appear = ip(g, [T.render, T.render + 6], [0, 1]);
  const cy = codeY(1);
  let j = 0;
  return (
    <>
      {CODE.map((line, i) => {
        if (!line.trim()) return null;
        const lead = line.length - line.trimStart().length;
        const len = line.trim().length;
        const toks = tokenize(line.trim());
        const col = toks[0]?.c ?? K.id;
        const x0 = CODE_X + lead * ADV;
        const y0 = cy + i * LH + 14;
        const k = CLIP_LINES.indexOf(i);
        const a = T.render + 4 + j++ * 1.3;
        const q = ip(g, [a, a + 24], [0, 1]);
        const e = Easing.inOut(Easing.cubic)(q);
        const arc = Math.sin(Math.PI * e) * -90;
        if (k >= 0) {
          const target = CLIPS[k];
          if (g > 470) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: lerp(x0, target.x, e),
                top: lerp(y0, TL.vy, e) + arc,
                width: lerp(len * ADV, target.w, e),
                height: lerp(14, TL.vh, e),
                borderRadius: lerp(4, 12, e),
                background: q < 0.5 ? col : k % 2 ? C.bordeaux : C.bordeaux2,
                opacity: appear,
              }}
            />
          );
        }
        const tx = TL.x + 40 + rnd(`bx${i}`) * (TL.w - 80);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: lerp(x0, tx, e),
              top: lerp(y0, TL.ay + TL.ah / 2 - 4, e) + arc,
              width: lerp(len * ADV, 8, e),
              height: lerp(14, 8, e),
              borderRadius: 4,
              background: q < 0.6 ? col : C.ocre,
              opacity: appear * (1 - ip(q, [0.75, 1], [0, 1])),
            }}
          />
        );
      })}
    </>
  );
};

const Timeline: React.FC<{ g: number }> = ({ g }) => {
  if (g < 446 || g > 672) return null;
  const out = EIN(ip(g, [650, 668], [0, 1]));
  const ph = playheadX(g);
  const tag = pop(g, 500, { damping: 11, stiffness: 200 });
  const active = (() => {
    let acc = 0;
    const f = oldFrameAt(g);
    for (let i = 0; i < SCENE_LEN.length; i++) {
      acc += SCENE_LEN[i];
      if (f < acc) return i;
    }
    return 8;
  })();
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${out * 260}px)`, opacity: 1 - out }}>
      {g >= 470 &&
        CLIPS.map((c, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: c.x,
              top: TL.vy,
              width: c.w,
              height: TL.vh,
              borderRadius: 12,
              background: k % 2 ? C.bordeaux : C.bordeaux2,
              boxShadow: g >= T.drop && k === active ? `inset 0 0 0 4px ${C.ocre}` : undefined,
            }}
          >
            <div style={{ position: "absolute", left: 10, right: 10, top: 12, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.22)" }} />
          </div>
        ))}
      <div style={{ position: "absolute", left: TL.x, top: TL.ay, width: TL.w, height: TL.ah, borderRadius: 12, background: K.panel }} />
      <svg width={W} height={1350} style={{ position: "absolute", inset: 0 }}>
        {ONDE.map((v: number, i: number) => {
          const x = TL.x + (i + 0.5) * (TL.w / ONDE.length);
          const k = pop(g, 452 + i * 0.25, { damping: 12, stiffness: 180 });
          const pulse = g >= T.drop && Math.abs(x - ph) < 30 ? 1.25 : 1;
          const h = (8 + v * 56) * k * pulse;
          return <rect key={i} x={x - 3} y={TL.ay + TL.ah / 2 - h / 2} width={6} height={h} rx={3} fill={C.ocre} opacity={x < ph ? 0.95 : 0.4} />;
        })}
        {g >= 452 && (
          <g transform={`translate(${ph}, 0)`}>
            <rect x={-3} y={TL.vy - 26} width={6} height={TL.ay + TL.ah - TL.vy + 36} rx={3} fill={C.ocre} />
            <path d="M -16,-0 L 16,0 L 0,18 Z" transform={`translate(0, ${TL.vy - 40})`} fill={C.ocre} />
          </g>
        )}
      </svg>
      {g >= 500 && (
        <div
          style={{
            position: "absolute",
            left: TL.x + 14,
            top: TL.ay + 16,
            height: 48,
            padding: "0 18px 0 12px",
            borderRadius: 10,
            background: C.ocre,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: 30,
            color: C.bg,
            transformOrigin: "0 50%",
            transform: `scale(${tag})`,
          }}
        >
          <svg width={28} height={28} viewBox="0 0 28 28">
            <path d="M 3,10 L 9,10 L 16,4 L 16,24 L 9,18 L 3,18 Z" fill={C.bg} />
            <path d="M 20,9 Q 24,14 20,19" stroke={C.bg} strokeWidth={3} fill="none" strokeLinecap="round" />
          </svg>
          son compris
        </div>
      )}
    </div>
  );
};

// Boucle d'annotation tracée à la main autour de la main qui pointe
const LOOP = (() => {
  const cx = 722;
  const cy = 336;
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const a = -1.9 + (i / 80) * Math.PI * 2.25;
    const r = 1 + 0.035 * Math.sin(a * 2 + 0.6) + 0.06 * (i / 80);
    pts.push(`${i ? "L" : "M"}${(cx + Math.cos(a) * 158 * r).toFixed(1)},${(cy + Math.sin(a) * 150 * r).toFixed(1)}`);
  }
  return pts.join(" ");
})();

const Review: React.FC<{ g: number; y: number }> = ({ g, y }) => {
  if (g < T.pause || g > 724) return null;
  const pauseIcon = pop(g, T.pause, { damping: 10, stiffness: 220 }) * ip(g, [624, 634], [1, 0]);
  const loopT = ip(g, [628, 650], [0, 1], EIO);
  const evo = evolvePath(loopT, LOOP);
  const card = pop(g, 644, { damping: 12, stiffness: 190 });
  const msg = "L'index doit être côté pouce.";
  const typed = Math.floor(msg.length * ip(g, [648, 676], [0, 1]));
  const stamp = pop(g, T.check, { damping: 9, stiffness: 240 });
  const fade = ip(g, [708, 722], [1, 0]);
  return (
    <div style={{ position: "absolute", left: PREV.x, top: y, width: PREV.w, height: PREV.h, opacity: fade }}>
      {pauseIcon > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: PREV.w / 2 - 60,
            top: PREV.h / 2 - 60,
            width: 120,
            height: 120,
            borderRadius: 60,
            background: "rgba(22,16,14,0.75)",
            transform: `scale(${pauseIcon})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div style={{ width: 16, height: 48, borderRadius: 4, background: C.white }} />
          <div style={{ width: 16, height: 48, borderRadius: 4, background: C.white }} />
        </div>
      )}
      <svg width={PREV.w} height={PREV.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={LOOP} stroke={C.ocre} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
        {card > 0.01 && <path d={`M 520,${108} Q 560,${130} 584,${200}`} stroke={C.ocre} strokeWidth={4} fill="none" strokeLinecap="round" opacity={card} />}
      </svg>
      {g >= 642 && (
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 40,
            width: 500,
            height: 108,
            borderRadius: 20,
            background: C.white,
            boxShadow: `0 20px 50px rgba(0,0,0,0.4)${stamp > 0.5 ? `, 0 0 0 4px ${C.ocre}` : ""}`,
            transformOrigin: "100% 100%",
            transform: `scale(${card})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 24,
              width: 60,
              height: 60,
              borderRadius: 30,
              background: C.bordeaux,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 24,
              color: C.white,
            }}
          >
            AC
          </div>
          <div style={{ position: "absolute", left: 94, top: 18, fontFamily: BODY, fontWeight: 500, fontSize: 20, color: C.n5 }}>Antoine</div>
          <div style={{ position: "absolute", left: 94, top: 46, fontFamily: BODY, fontWeight: 700, fontSize: 29, color: C.bg, whiteSpace: "pre" }}>
            {msg.slice(0, typed)}
            {typed < msg.length && caretOn(g, 676) && <span style={{ display: "inline-block", width: 3, height: 30, background: C.bordeaux, verticalAlign: "middle" }} />}
          </div>
          {g >= T.check && (
            <svg width={80} height={80} style={{ position: "absolute", right: -30, top: -30, overflow: "visible" }}>
              <g transform={`translate(40, 40) scale(${stamp})`}>
                <circle r={32} fill={C.ocre} />
                <path d="M -14,1 L -4,11 L 15,-10" stroke={C.white} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {Array.from({ length: 8 }).map((_, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  const p = ip(g, [T.check, T.check + 16], [0, 1]);
                  const r0 = 40 + p * 30;
                  return (
                    <line
                      key={i}
                      x1={Math.cos(a) * r0}
                      y1={Math.sin(a) * r0}
                      x2={Math.cos(a) * (r0 + 14 * (1 - p))}
                      y2={Math.sin(a) * (r0 + 14 * (1 - p))}
                      stroke={C.ocre}
                      strokeWidth={5}
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

const Diff: React.FC<{ g: number }> = ({ g }) => {
  if (g < 656 || g > 736) return null;
  const inT = EOUT(ip(g, [656, 676], [0, 1]));
  const outT = EIN(ip(g, [716, 734], [0, 1]));
  const strike = ip(g, [674, 684], [0, 1], EIO);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 1000,
        width: 960,
        height: 236,
        borderRadius: 22,
        background: K.panel,
        border: `2px solid ${K.rule}`,
        transform: `translateY(${(1 - inT) * 120 + outT * 300}px)`,
        opacity: inT * (1 - outT),
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 24, top: 16, fontFamily: BODY, fontWeight: 700, fontSize: 24, color: K.dim }}>bureau.tsx</div>
      {DIFF.map((d, i) => {
        const removed = d.sign === "-";
        const at = removed ? 664 + i * 5 : 680 + (i - 2) * 8;
        const show = ip(g, [at, at + 6], [0, 1]);
        const n = removed ? Infinity : Math.ceil(d.text.length * ip(g, [at, at + 12], [0, 1]));
        if (show <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              top: 56 + i * 42,
              height: 38,
              borderRadius: 8,
              background: removed ? K.del : K.add,
              opacity: show * (removed ? lerp(1, 0.55, strike) : 1),
              transform: `translateX(${(1 - EOUT(show)) * -40}px)`,
            }}
          >
            <div style={{ position: "absolute", left: 14, top: 3, fontFamily: MONO, fontWeight: 700, fontSize: 24, color: removed ? K.kw : K.str }}>{d.sign}</div>
            <div style={{ position: "absolute", left: 46, top: 3 }}>
              <CodeLine text={d.text} n={n} size={24} />
            </div>
            {removed && <div style={{ position: "absolute", left: 44, top: 18, height: 3, width: strike * d.text.length * 24 * MONO_ADV, background: C.white, opacity: 0.7 }} />}
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ couleurs de la maison

const SW = { y: 1110, x1: 124, x2: 226, r: 44 };
const PAIRS = [
  [C.bordeaux2, C.ocre],
  [PAL.offre.a, PAL.offre.b],
  [PAL.recrut.a, PAL.recrut.b],
];

const Swatches: React.FC<{ g: number }> = ({ g }) => {
  if (g < 726) return null;
  return (
    <svg width={W} height={1350} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {PAIRS.map((pair, p) => {
        const tin = p === 0 ? 728 : T.swaps[p - 1] + 2;
        const tout = p === 0 ? T.swaps[0] - 2 : p === 1 ? T.swaps[1] - 2 : 99999;
        if (g < tin) return null;
        return pair.map((col, k) => {
          const st = tin + k * 4;
          const kin = pop(g, st, { damping: 10, stiffness: 200, mass: 0.6 });
          const o = EIN(ip(g, [tout + k * 2, tout + 14 + k * 2], [0, 1]));
          if (o >= 1) return null;
          const cx = k === 0 ? SW.x1 : SW.x2;
          const yy = SW.y + lerp(-180, 0, Math.min(1, kin)) * (g < st ? 1 : 1) + o * 260;
          return (
            <g key={`${p}${k}`} transform={`translate(${cx}, ${yy}) rotate(${o * (k ? 50 : -40)}) scale(${g < st ? 0 : 0.4 + 0.6 * kin})`} opacity={1 - o}>
              <circle r={SW.r} fill={col} stroke={C.white} strokeWidth={5} />
            </g>
          );
        });
      })}
    </svg>
  );
};

const CAPTIONS = ["Présentation d'offre", "Vidéo de recrutement"];

const Preview: React.FC<{ g: number }> = ({ g }) => {
  if (g < 438) return null;
  const y = lerp(PREV.y, 450, EIO(ip(g, [716, 744], [0, 1])));
  const frameDraw = ip(g, [440, 466], [0, 1], EIO);
  const rectPath = `M ${PREV.x + 18},${PREV.y} L ${PREV.x + PREV.w - 18},${PREV.y} Q ${PREV.x + PREV.w},${PREV.y} ${PREV.x + PREV.w},${PREV.y + 18} L ${PREV.x + PREV.w},${PREV.y + PREV.h - 18} Q ${PREV.x + PREV.w},${PREV.y + PREV.h} ${PREV.x + PREV.w - 18},${PREV.y + PREV.h} L ${PREV.x + 18},${PREV.y + PREV.h} Q ${PREV.x},${PREV.y + PREV.h} ${PREV.x},${PREV.y + PREV.h - 18} L ${PREV.x},${PREV.y + 18} Q ${PREV.x},${PREV.y} ${PREV.x + 18},${PREV.y} Z`;
  const evo = evolvePath(frameDraw, rectPath);
  const fill = ip(g, [452, 462], [0, 1]);
  const filmIn = ip(g, [470, 480], [0, 1]);
  const count = Math.round(1920 * Easing.out(Easing.quad)(ip(g, [446, 474], [0, 1])));

  // coupe : petit coup de zoom et éclair
  const lastCut = [...CUTS].reverse().find((k) => g >= k.at);
  const punch = lastCut && g < T.pause ? 1 + 0.045 * (1 - pop(g, lastCut.at, { damping: 12, stiffness: 260 })) : 1;
  const flash = lastCut && g < T.pause ? ip(g, [lastCut.at, lastCut.at + 5], [0.35, 0]) : 0;

  // zoom sur la main pendant la relecture
  const zIn = ip(g, [606, 640], [0, 1], EIO);
  const zOut = ip(g, [RESUME, RESUME + 28], [0, 1], EIO);
  const zoom = lerp(1, 1.9, zIn * (1 - zOut));

  // bascule 3D à chaque changement de couleurs
  const swing = T.swaps.reduce((acc, s) => (g >= s ? 13 * (1 - pop(g, s, { damping: 9, stiffness: 120 })) : acc), 0);
  const wipe = (s: number) => lerp(0, 1250, EIO(ip(g, [s, s + 24], [0, 1])));
  const sweepSheen = T.swaps.map((s) => ip(g, [s + 6, s + 30], [0, 1]));

  const glowCol = g >= T.swaps[1] ? PAL.recrut.b : g >= T.swaps[0] ? PAL.offre.b : C.bordeaux2;
  const glowA = ip(g, [720, 750], [0, 0.32]);

  return (
    <>
      {glowA > 0 && (
        <div
          style={{
            position: "absolute",
            left: PREV.x - 200,
            top: y - 200,
            width: PREV.w + 400,
            height: PREV.h + 400,
            background: `radial-gradient(closest-side, ${glowCol} 0%, rgba(0,0,0,0) 100%)`,
            opacity: glowA,
          }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, perspective: Math.abs(swing) > 0.01 ? 1800 : undefined }}>
        <div
          style={{
            position: "absolute",
            left: PREV.x,
            top: y,
            width: PREV.w,
            height: PREV.h,
            borderRadius: 18,
            overflow: "hidden",
            background: K.code,
            opacity: fill,
            transform: Math.abs(swing) > 0.01 ? `rotateY(${swing}deg) scale(${punch})` : `scale(${punch})`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        >
          {filmIn < 1 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 30, color: K.dim }}>Rendu</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 72, color: C.white, fontVariantNumeric: "tabular-nums" }}>
                {count >= 1000 ? `${Math.floor(count / 1000)} ${String(count % 1000).padStart(3, "0")}` : count} images
              </div>
            </div>
          )}
          {g >= 466 && g < T.swaps[0] + 26 && (
            <div style={{ position: "absolute", inset: 0, opacity: filmIn }}>
              <OldFilm frame={oldFrameAt(g)} w={PREV.w} zoom={zoom} zx={HAND.x} zy={HAND.y} />
            </div>
          )}
          {g >= RESUME - 4 && g < RESUME + 12 && (
            <div style={{ position: "absolute", left: PREV.w / 2 - 60, top: PREV.h / 2 - 60, width: 120, height: 120, borderRadius: 60, background: "rgba(22,16,14,0.75)", transform: `scale(${pop(g, RESUME - 4) * ip(g, [RESUME + 4, RESUME + 12], [1, 0])})` }}>
              <svg width={120} height={120}>
                <path d="M 48,36 L 86,60 L 48,84 Z" fill={C.white} />
              </svg>
            </div>
          )}
          {g >= T.swaps[0] && g < T.swaps[1] + 26 && (
            <div style={{ position: "absolute", inset: 0, clipPath: `circle(${wipe(T.swaps[0])}px at ${SW.x1 - PREV.x}px ${SW.y - y}px)` }}>
              <MaquetteOffre lf={g - T.swaps[0]} />
            </div>
          )}
          {g >= T.swaps[1] && (
            <div style={{ position: "absolute", inset: 0, clipPath: `circle(${wipe(T.swaps[1])}px at ${SW.x1 - PREV.x}px ${SW.y - y}px)` }}>
              <MaquetteRecrutement lf={g - T.swaps[1]} />
            </div>
          )}
          {sweepSheen.map((p, i) =>
            p > 0 && p < 1 ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: -100,
                  bottom: -100,
                  width: 160,
                  left: lerp(-300, PREV.w + 140, p),
                  background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)",
                  transform: "rotate(14deg)",
                }}
              />
            ) : null,
          )}
          {flash > 0 && <div style={{ position: "absolute", inset: 0, background: C.white, opacity: flash }} />}
        </div>
      </div>
      {frameDraw > 0 && frameDraw < 1 && (
        <svg width={W} height={1350} style={{ position: "absolute", inset: 0 }}>
          <path d={rectPath} stroke={C.ocre} strokeWidth={6} fill="none" strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
        </svg>
      )}
      <Review g={g} y={y} />
      {CAPTIONS.map((c, i) => {
        const s = T.swaps[i];
        if (g < s) return null;
        const outAt = i === 0 ? T.swaps[1] - 4 : undefined;
        return (
          <div key={i} style={{ position: "absolute", left: 300, top: SW.y - 30, fontFamily: BODY, fontWeight: 700, fontSize: 46, color: C.white }}>
            <MaskLine t={pop(g, s + 6, { damping: 14 })} u={outAt === undefined ? 0 : EIN(ip(g, [outAt, outAt + 10], [0, 1]))}>
              {c}
            </MaskLine>
          </div>
        );
      })}
    </>
  );
};

export const Studio: React.FC = () => {
  const g = useCurrentFrame() + START;
  const cam = { x: drift(g, 31, 4), y: drift(g, 32, 3) };
  const gradA = ip(g, [328, 340], [0, 1]) * ip(g, [412, 424], [1, 0]);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {g >= T.grow.end - 4 && <div style={{ position: "absolute", inset: 0, background: C.bg, opacity: ip(g, [T.grow.end - 4, T.grow.end], [0, 1]) }} />}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${cam.x}px, ${cam.y}px)` }}>
        <Editor g={g} />
        {gradA > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 520, background: `linear-gradient(${C.bg} 62%, rgba(22,16,14,0))`, opacity: gradA }} />
        )}
        <Bars g={g} />
        <Timeline g={g} />
        <Preview g={g} />
        <Diff g={g} />
        <Swatches g={g} />
        <Headline g={g} lines={["Remotion transforme", "le code en vidéo."]} start={336} exit={594} />
        <Headline g={g} lines={["Ma part :", "relire et corriger."]} start={606} exit={714} />
        <Headline g={g} lines={["La même méthode,", "aux couleurs", "de la maison."]} start={726} />
      </div>
    </div>
  );
};
