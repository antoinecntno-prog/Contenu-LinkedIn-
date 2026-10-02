import React from "react";
import { C } from "../../constants";
import { BODY, TITLE } from "../../fonts";
import { EIO, blink, ip, lerp, pop } from "../../lib/anim";
import { PAL } from "../constants";
import { Letters, MaskLine } from "../lib/ui";

// Deux vidéos d'entreprise fictives, dessinées dans l'aperçu (960 × 540)

export const MaquetteOffre: React.FC<{ lf: number }> = ({ lf }) => {
  const P = PAL.offre;
  const logo = pop(lf, 6, { damping: 12 });
  const under = EIO(ip(lf, [22, 38], [0, 1]));
  const heights = [120, 190, 150, 270];
  return (
    <div style={{ position: "absolute", inset: 0, background: P.a, overflow: "hidden" }}>
      <svg width={960} height={540} style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
        <circle cx={900} cy={-40} r={lerp(160, 240, ip(lf, [0, 90], [0, 1]))} fill="none" stroke={P.b} strokeWidth={36} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 48,
          top: 42,
          width: 196,
          height: 58,
          border: "3px dashed rgba(255,255,255,0.55)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 21,
          letterSpacing: 2,
          color: "rgba(255,255,255,0.8)",
          transform: `scale(${logo})`,
        }}
      >
        VOTRE LOGO
      </div>
      <Letters
        text="Notre offre"
        g={lf}
        start={10}
        stagger={1.2}
        style={{ position: "absolute", left: 46, top: 150, fontFamily: TITLE, fontWeight: 800, fontSize: 100, lineHeight: 1, letterSpacing: -3, color: C.white }}
      />
      <div style={{ position: "absolute", left: 50, top: 270, width: 380 * under, height: 12, borderRadius: 6, background: P.b }} />
      <div style={{ position: "absolute", left: 50, top: 312, fontFamily: BODY, fontWeight: 500, fontSize: 34, color: "rgba(255,255,255,0.8)" }}>
        <MaskLine t={pop(lf, 20, { damping: 14 })}>pour votre projet</MaskLine>
      </div>
      <svg width={960} height={540} style={{ position: "absolute", inset: 0 }}>
        <line x1={560} y1={470} x2={920} y2={470} stroke="rgba(255,255,255,0.3)" strokeWidth={3} />
        {heights.map((h, k) => {
          const s = pop(lf, 16 + k * 4, { damping: 11, stiffness: 160 });
          const hh = h * s;
          return <rect key={k} x={584 + k * 84} y={470 - hh} width={56} height={hh} rx={8} fill={k === 3 ? P.b : "rgba(255,255,255,0.28)"} />;
        })}
      </svg>
    </div>
  );
};

export const MaquetteRecrutement: React.FC<{ lf: number }> = ({ lf }) => {
  const P = PAL.recrut;
  const bust = pop(lf, 4, { damping: 11, stiffness: 150 });
  const wave = Math.sin(lf / 5) * 18;
  const eyes = blink(lf + 30, 7);
  const btn = pop(lf, 22, { damping: 12 });
  const cur = EIO(ip(lf, [34, 58], [0, 1]));
  const press = lf >= 60 ? 1 - 0.07 * (1 - pop(lf, 60, { damping: 9, stiffness: 300 })) : 1;
  const ripple = ip(lf, [60, 80], [0, 1]);
  return (
    <div style={{ position: "absolute", inset: 0, background: P.a, overflow: "hidden" }}>
      <svg width={960} height={540} style={{ position: "absolute", inset: 0, opacity: 0.16 }}>
        <rect x={600} y={-60} width={420} height={420} rx={60} fill="none" stroke={P.b} strokeWidth={34} transform={`rotate(${12 + lf * 0.08}, 810, 150)`} />
      </svg>
      <Letters
        text="On recrute"
        g={lf}
        start={8}
        stagger={1.3}
        style={{ position: "absolute", left: 46, top: 64, fontFamily: TITLE, fontWeight: 800, fontSize: 108, lineHeight: 1, letterSpacing: -3, color: C.white }}
      />
      <div style={{ position: "absolute", left: 50, top: 204, fontFamily: BODY, fontWeight: 700, fontSize: 36, color: P.b }}>
        <MaskLine t={pop(lf, 16, { damping: 14 })}>Technicien·ne de maintenance</MaskLine>
      </div>
      {/* bouton */}
      <div
        style={{
          position: "absolute",
          left: 50,
          top: 330,
          width: 240,
          height: 76,
          borderRadius: 14,
          background: P.b,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 32,
          color: C.white,
          transform: `scale(${btn * press})`,
          boxShadow: ripple > 0 && ripple < 1 ? `0 0 0 ${ripple * 30}px rgba(255,122,89,${0.5 * (1 - ripple)})` : undefined,
        }}
      >
        Postuler
      </div>
      {/* curseur */}
      {lf >= 30 && (
        <svg width={960} height={540} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${lerp(520, 210, cur)}, ${lerp(520, 380, cur)}) scale(${lf >= 60 && lf < 66 ? 0.88 : 1})`}>
            <path d="M 0,0 L 0,38 L 10,29 L 17,45 L 24,42 L 17,26 L 30,26 Z" fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          </g>
        </svg>
      )}
      {/* buste avec casque */}
      <svg width={960} height={540} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(760, 560) scale(${bust}) translate(-760, -560)`}>
          <path d="M 620,560 L 620,440 Q 620,370 690,370 L 830,370 Q 900,370 900,440 L 900,560 Z" fill={C.white} />
          <path d="M 715,370 L 760,420 L 805,370 Z" fill={P.b} />
          {/* bras qui salue */}
          <g transform={`rotate(${-30 + wave}, 880, 420)`}>
            <rect x={866} y={300} width={34} height={130} rx={17} fill={C.white} />
            <circle cx={883} cy={298} r={26} fill="#D9A07A" />
          </g>
          <rect x={744} y={340} width={32} height={40} fill="#C48A66" />
          <circle cx={760} cy={290} r={68} fill="#D9A07A" />
          <ellipse cx={738} cy={292} rx={6} ry={7 * eyes} fill={C.ink} />
          <ellipse cx={782} cy={292} rx={6} ry={7 * eyes} fill={C.ink} />
          <path d="M 740,318 Q 760,334 780,318" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M 684,262 Q 684,190 760,190 Q 836,190 836,262 Z" fill={P.b} />
          <rect x={672} y={256} width={176} height={16} rx={8} fill={P.b} />
          <rect x={752} y={196} width={16} height={60} rx={6} fill="rgba(255,255,255,0.35)" />
        </g>
      </svg>
    </div>
  );
};
