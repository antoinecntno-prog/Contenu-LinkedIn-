import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { HtmlInCanvasMotionBlur } from "@remotion/motion-blur";
import { BLUR_WINDOWS, C, SCENES, W, sceneLength } from "./constants";
import { ip } from "./lib/anim";
import { S1Route, windowRect } from "./scenes/S1Route";
import { S2Notes } from "./scenes/S2Notes";
import { S3Regle } from "./scenes/S3Regle";
import { S4Ordinateur } from "./scenes/S4Ordinateur";
import { S5Questions } from "./scenes/S5Questions";
import { S6Reponses } from "./scenes/S6Reponses";
import { S7Joie } from "./scenes/S7Joie";
import { S8DixHeures } from "./scenes/S8DixHeures";
import { S9Signature } from "./scenes/S9Signature";

const from = (k: keyof typeof SCENES) => SCENES[k].start - SCENES[k].pre;

// La scène 2 apparaît dans la fenêtre éclairée et grandit avec elle
const WindowPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const g = useCurrentFrame() + from("notes");
  if (g >= SCENES.notes.start) return <AbsoluteFill>{children}</AbsoluteFill>;
  const r = windowRect(g);
  const s = r.w / W;
  const tint = ip(s, [0.06, 0.4], [0.55, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: 1080,
        transformOrigin: "0 0",
        transform: `translate(${r.x}px, ${r.y}px) scale(${s})`,
        overflow: "hidden",
      }}
    >
      {children}
      <div style={{ position: "absolute", inset: 0, background: "#E9B46A", opacity: tint }} />
    </div>
  );
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Sequence name="1 La route" from={from("route")} durationInFrames={sceneLength("route")}>
      <S1Route />
    </Sequence>
    <Sequence name="2 Elle raconte, je note" from={from("notes")} durationInFrames={sceneLength("notes")}>
      <WindowPortal>
        <S2Notes />
      </WindowPortal>
    </Sequence>
    <Sequence name="3 Règle n° 1" from={from("regle")} durationInFrames={sceneLength("regle")}>
      <S3Regle />
    </Sequence>
    <Sequence name="4 L'ordinateur ouvert" from={from("ordi")} durationInFrames={sceneLength("ordi")}>
      <S4Ordinateur />
    </Sequence>
    <Sequence name="5 Ses questions" from={from("questions")} durationInFrames={sceneLength("questions")}>
      <S5Questions />
    </Sequence>
    <Sequence name="6 Mes réponses" from={from("reponses")} durationInFrames={sceneLength("reponses")}>
      <S6Reponses />
    </Sequence>
    <Sequence name="7 Elle est contente" from={from("joie")} durationInFrames={sceneLength("joie")}>
      <S7Joie />
    </Sequence>
    <Sequence name="8 10 h" from={from("dixh")} durationInFrames={sceneLength("dixh")}>
      <S8DixHeures />
    </Sequence>
    <Sequence name="9 Signature" from={from("signature")} durationInFrames={sceneLength("signature")}>
      <S9Signature />
    </Sequence>
  </AbsoluteFill>
);

// Film complet : rendu net, sauf sur les fenêtres rapides où le flou de mouvement prend le relais
export const JourneeFormation: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const inBlur = BLUR_WINDOWS.some(([a, b]) => frame >= a && frame < b);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {!inBlur && <Film />}
      {BLUR_WINDOWS.map(([a, b]) => (
        <HtmlInCanvasMotionBlur
          key={a}
          name={`Flou ${a}`}
          from={a}
          durationInFrames={b - a}
          width={width}
          height={height}
          samples={8}
          shutterAngle={200}
        >
          <Sequence from={-a} layout="none">
            <Film />
          </Sequence>
        </HtmlInCanvasMotionBlur>
      ))}
    </AbsoluteFill>
  );
};
