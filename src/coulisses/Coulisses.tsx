import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { HtmlInCanvasMotionBlur } from "@remotion/motion-blur";
import { C } from "../constants";
import { BLUR, SEQ, T } from "./constants";
import { Grain } from "./lib/ui";
import { Accroche, oHole } from "./scenes/Accroche";
import { Entrees } from "./scenes/Entrees";
import { Studio } from "./scenes/Studio";
import { Fin } from "./scenes/Fin";

const len = (k: keyof typeof SEQ) => SEQ[k].to - SEQ[k].from;

// La scène des éléments fournis s'ouvre dans le trou du « o » de « code »
const OPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const g = useCurrentFrame() + SEQ.entrees.from;
  if (g >= T.zoom.end) return <AbsoluteFill>{children}</AbsoluteFill>;
  const h = oHole(g);
  return <AbsoluteFill style={{ clipPath: `ellipse(${h.rx}px ${h.ry}px at ${h.x}px ${h.y}px)` }}>{children}</AbsoluteFill>;
};

export const CoulissesFilm: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Sequence name="1 Accroche" from={SEQ.accroche.from} durationInFrames={len("accroche")}>
      <Accroche />
    </Sequence>
    <Sequence name="2 Ce que je lui ai donné" from={SEQ.entrees.from} durationInFrames={len("entrees")}>
      <OPortal>
        <Entrees />
      </OPortal>
    </Sequence>
    <Sequence name="3 Code, rendu, relecture, maison" from={SEQ.studio.from} durationInFrames={len("studio")}>
      <Studio />
    </Sequence>
    <Sequence name="4 Question et signature" from={SEQ.fin.from} durationInFrames={len("fin")}>
      <Fin />
    </Sequence>
  </AbsoluteFill>
);

const Habillage: React.FC = () => {
  const g = useCurrentFrame();
  return <Grain g={g} />;
};

// Film complet : flou de mouvement sur les fenêtres rapides, grain par-dessus
export const Coulisses: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const inBlur = BLUR.some(([a, b]) => frame >= a && frame < b);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {!inBlur && <CoulissesFilm />}
      {BLUR.map(([a, b]) => (
        <HtmlInCanvasMotionBlur key={a} name={`Flou ${a}`} from={a} durationInFrames={b - a} width={width} height={height} samples={8} shutterAngle={200}>
          <Sequence from={-a} layout="none">
            <CoulissesFilm />
          </Sequence>
        </HtmlInCanvasMotionBlur>
      ))}
      <Habillage />
    </AbsoluteFill>
  );
};
