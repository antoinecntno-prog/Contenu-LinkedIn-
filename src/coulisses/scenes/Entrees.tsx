import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { C } from "../../constants";
import { BODY, MONO, TITLE } from "../../fonts";
import { EIN, EOUT, drift, glide, ip, lerp, pop } from "../../lib/anim";
import { K, M, T, W } from "../constants";
import { MaskLine, Panel, caretOn } from "../lib/ui";
import { O } from "./Accroche";

// Terminal : même rectangle que la fenêtre d'éditeur au départ de la scène suivante
export const TERM = { x: 80, y: 450, w: 920, h: 780 };
export const TITLEBAR = 70;
const CHIP = { x: 40, y0: 170, h: 104, gap: 20, w: 840 };
const PROMPT_Y = 690;

const CHIPS = ["Le déroulé, scène par scène", "Deux couleurs", "Le texte à l'écran", "Une vidéo de référence"];

const Icon: React.FC<{ k: number; g: number }> = ({ k, g }) => {
  if (k === 0)
    return (
      <svg width={72} height={72} viewBox="0 0 72 72">
        {[0, 1, 2, 3].map((i) => {
          const s = pop(g, T.chips[0] + 4 + i * 3, { damping: 12 });
          return (
            <rect
              key={i}
              x={12 + (i % 2) * 26}
              y={14 + Math.floor(i / 2) * 24}
              width={22}
              height={18}
              rx={4}
              fill={i === 3 ? C.ocre : C.white}
              transform={`translate(${23 + (i % 2) * 26}, ${23 + Math.floor(i / 2) * 24}) scale(${s}) translate(${-23 - (i % 2) * 26}, ${-23 - Math.floor(i / 2) * 24})`}
            />
          );
        })}
      </svg>
    );
  if (k === 1) {
    const s = pop(g, T.chips[1] + 4, { damping: 10 });
    return (
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={28 - 4 * s} cy={36} r={17} fill={C.bordeaux2} stroke={C.bg} strokeWidth={3} />
        <circle cx={44 + 4 * s} cy={36} r={17} fill={C.ocre} stroke={C.bg} strokeWidth={3} />
      </svg>
    );
  }
  if (k === 2)
    return (
      <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TITLE, fontWeight: 800, fontSize: 38, color: C.white }}>
        Aa
      </div>
    );
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <rect x={12} y={18} width={48} height={36} rx={7} fill="none" stroke={C.white} strokeWidth={4} />
      <path d="M 31,28 L 44,36 L 31,44 Z" fill={C.ocre} />
    </svg>
  );
};

type ChipState = { tx: number; ty: number; fly: number; side: number; sq: number; ab: number; y: number };

// Position d'une carte à l'instant gg (fractions d'image acceptées)
const chipAt = (k: number, gg: number): ChipState | null => {
  const L = T.chips[k];
  const side = k % 2 === 0 ? -1 : 1;
  const fly = Easing.out(Easing.cubic)(ip(gg, [L - 18, L], [0, 1]));
  const land = gg >= L ? pop(gg, L, { damping: 9, stiffness: 230, mass: 0.6 }) : 0;
  const sq = gg >= L ? 1 - land : 0;
  const absorbAt = T.enter + 1 + (3 - k) * 3;
  const ab = EIN(ip(gg, [absorbAt, absorbAt + 14], [0, 1]));
  const y = CHIP.y0 + k * (CHIP.h + CHIP.gap);
  if (gg < L - 18 || ab >= 1) return null;
  const tx = lerp(side * 1150, 0, fly) + lerp(0, 72 - CHIP.w / 2, ab);
  const ty = lerp(-260, 0, fly) + lerp(0, PROMPT_Y + 22 - (y + CHIP.h / 2), ab);
  return { tx, ty, fly, side, sq, ab, y };
};

const TRAIL = [
  { d: 0.75, a: 0.16 },
  { d: 0.5, a: 0.24 },
  { d: 0.25, a: 0.36 },
];

const ChipCard: React.FC<{ k: number; g: number; label: string; st: ChipState; alpha: number; ghost?: boolean }> = ({
  k,
  g,
  label,
  st,
  alpha,
  ghost,
}) => {
  const { tx, ty, fly, side, sq, ab, y } = st;
  const labelT = pop(g, T.chips[k] + 3, { damping: 13, stiffness: 190 });
  return (
    <div
      style={{
        position: "absolute",
        left: CHIP.x,
        top: y,
        width: CHIP.w,
        height: CHIP.h,
        borderRadius: 20,
        background: K.panel2,
        border: `2px solid ${K.rule}`,
        transformOrigin: "50% 50%",
        transform: `translate(${tx}px, ${ty}px) rotateZ(${(1 - fly) * side * -22}deg) rotateY(${(1 - fly) * side * 55}deg) scale(${lerp(1.25, 1, fly) * (1 - 0.95 * ab)}) scale(${1 + 0.1 * sq}, ${1 - 0.16 * sq})`,
        opacity: alpha * (1 - ip(ab, [0.7, 1], [0, 1])),
        boxShadow: ghost ? undefined : "0 18px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ position: "absolute", left: 16, top: 16, width: 72, height: 72, borderRadius: 14, background: k === 1 ? C.bg : C.bordeaux }}>
        <Icon k={k} g={g} />
      </div>
      {!ghost && (
        <div style={{ position: "absolute", left: 112, top: 30, fontFamily: BODY, fontWeight: 700, fontSize: 36, color: C.white }}>
          <MaskLine t={labelT}>{label}</MaskLine>
        </div>
      )}
    </div>
  );
};

export const Entrees: React.FC = () => {
  const g = useCurrentFrame() + 104;

  // La plongée continue : la scène arrive grossie et se pose
  const inZ = lerp(1.55, 1, EOUT(ip(g, [T.zoom.start, T.zoom.end + 26], [0, 1])));
  const cam = {
    x: drift(g, 21, 5),
    y: drift(g, 22, 4),
  };

  // Onde de choc à l'atterrissage
  const ring = ip(g, [T.zoom.end - 4, T.zoom.end + 30], [0, 1]);

  // Titre
  const h1 = pop(g, 156, { damping: 14, stiffness: 160 });
  const h2 = pop(g, 164, { damping: 14, stiffness: 160 });
  const hOut = EIN(ip(g, [296, 312], [0, 1]));

  // Terminal
  const tIn = glide(g, 150, 34);
  const enterPunch = g >= T.enter ? 1 + 0.018 * (1 - pop(g, T.enter, { damping: 10, stiffness: 240 })) : 1;
  const enterFlash = g >= T.enter ? ip(g, [T.enter, T.enter + 12], [1, 0]) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, background: C.bordeaux, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${O.x}px ${O.y}px`,
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${inZ})`,
        }}
      >
        {/* motif discret : grille de points */}
        <svg width={W} height={1350} style={{ position: "absolute", inset: 0, opacity: 0.16 }}>
          <defs>
            <pattern id="dots" width={40} height={40} patternUnits="userSpaceOnUse" patternTransform={`translate(${(g * 0.6) % 40}, ${(g * 0.3) % 40})`}>
              <circle cx={2} cy={2} r={2} fill={C.white} />
            </pattern>
          </defs>
          <rect width={W} height={1350} fill="url(#dots)" />
        </svg>
        {ring > 0 && ring < 1 && (
          <svg width={W} height={1350} style={{ position: "absolute", inset: 0 }}>
            <circle cx={O.x} cy={O.y} r={lerp(40, 1100, EOUT(ring))} fill="none" stroke={C.ocre} strokeWidth={lerp(26, 0, ring)} opacity={1 - ring * 0.4} />
            <circle cx={O.x} cy={O.y} r={lerp(20, 700, EOUT(ring))} fill="none" stroke={C.white} strokeWidth={lerp(8, 0, ring)} opacity={0.5} />
          </svg>
        )}

        <div style={{ position: "absolute", left: M, top: 130, fontFamily: TITLE, fontWeight: 800, fontSize: 112, lineHeight: 1, letterSpacing: -3 }}>
          <MaskLine t={h1} u={hOut}>
            <span style={{ color: C.white }}>Claude Code</span>
          </MaskLine>
          <div style={{ height: 12 }} />
          <MaskLine t={h2} u={EIN(ip(g, [299, 315], [0, 1]))}>
            <span style={{ color: C.ocre }}>l'a programmée.</span>
          </MaskLine>
        </div>

        {/* perspective seulement pendant l'arrivée : le flou de mouvement peint les calques 3D au-dessus des autres */}
        <div style={{ position: "absolute", inset: 0, perspective: tIn < 0.999 ? 1600 : undefined }}>
          <Panel
            style={{
              left: TERM.x,
              top: TERM.y,
              width: TERM.w,
              height: TERM.h,
              transformOrigin: "50% 100%",
              transform: tIn < 0.999 ? `translateY(${(1 - tIn) * 320}px) rotateX(${(1 - tIn) * 48}deg) scale(${enterPunch})` : `scale(${enterPunch})`,
              opacity: ip(g, [150, 160], [0, 1]),
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: TITLEBAR, background: K.panel, borderBottom: `2px solid ${K.rule}` }}>
              <div style={{ position: "absolute", left: 32, top: 20, fontFamily: BODY, fontWeight: 500, fontSize: 26, color: K.dim }}>Terminal</div>
            </div>
            <div style={{ position: "absolute", left: CHIP.x, top: 102, fontFamily: BODY, fontWeight: 700, fontSize: 30, color: K.dim }}>
              <MaskLine t={pop(g, 170, { damping: 14 })}>Au départ, je lui ai donné</MaskLine>
            </div>

            {CHIPS.map((label, k) => {
              // traînée : copies décalées d'une fraction d'image derrière la carte quand elle file
              const now = chipAt(k, g);
              const before = chipAt(k, g - 1);
              if (!now) return null;
              const speed = before ? Math.hypot(now.tx - before.tx, now.ty - before.ty) : 99;
              const ghosts = speed > 6 ? TRAIL.map((tr) => ({ ...tr, st: chipAt(k, g - tr.d) })) : [];
              return (
                <React.Fragment key={k}>
                  {ghosts.map((gh, i) => (gh.st ? <ChipCard key={i} k={k} g={g} label={label} st={gh.st} alpha={gh.a} ghost /> : null))}
                  <ChipCard k={k} g={g} label={label} st={now} alpha={1} />
                </React.Fragment>
              );
            })}

            {/* ligne de saisie */}
            <div style={{ position: "absolute", left: 24, right: 24, top: PROMPT_Y, height: 64, borderRadius: 14, background: `rgba(200,134,42,${0.12 + 0.6 * enterFlash})`, border: `2px solid rgba(200,134,42,0.35)` }}>
              <div style={{ position: "absolute", left: 22, top: 6, fontFamily: MONO, fontWeight: 700, fontSize: 40, color: C.ocre }}>›</div>
              {caretOn(g) && <div style={{ position: "absolute", left: 62, top: 14, width: 16, height: 36, background: enterFlash > 0.3 ? C.bg : C.ocre }} />}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
