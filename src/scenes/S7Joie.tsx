import React from "react";
import { useCurrentFrame } from "remotion";
import { getLength } from "@remotion/paths";
import { C, SCENES } from "../constants";
import { Camera, Layer, WorldSvg } from "../lib/camera";
import { Character, P0, Pose, poseAt, Mouth } from "../lib/Character";
import { EIO, EIN, EOUT, blink, breath, ip, lerp, pop } from "../lib/anim";
import {
  BackWall,
  CONF_HANDOFF,
  Chair,
  ELLE,
  JUMP,
  Laptop,
  Mug,
  Table,
  camBureau,
  confettiAt,
} from "./bureau";
import { SHOT_PATH, ToolCardRect, ToolText, ToolWrench } from "./S6Reponses";

const START = SCENES.joie.start;
const SHOT_LEN = getLength(SHOT_PATH);
const STAND_Y = 812;

const KEYS7: { f: number; p: Partial<Pose> }[] = [
  { f: 1300, p: { ...P0, aL: 18, eL: -95, aR: 18, eR: -95, turn: 0.1 } },
  { f: 1386, p: { turn: 0, head: -4, aL: 30, eL: -60, aR: 30, eR: -60 } },
  { f: JUMP.crouch, p: { aL: 32, eL: 24, aR: 32, eR: 24, head: 7, lL: 4, kL: 0, lR: 4, kR: 0 } },
  { f: JUMP.launch, p: { aL: 168, eL: 10, aR: 168, eR: 10, head: -6, lL: 2, kL: 0, lR: 2, kR: 0 } },
  { f: 1428, p: { aL: 150, eL: 30, aR: 172, eR: 4, lL: 100, kL: -92, lR: 100, kR: -92 } },
  { f: 1436, p: { aL: 172, eL: 4, aR: 150, eR: 30 } },
  { f: 1444, p: { aL: 150, eL: 30, aR: 172, eR: 4 } },
  { f: 1452, p: { aL: 172, eL: 4, aR: 150, eR: 30 } },
  { f: 1462, p: { aL: 160, eL: 14, aR: 160, eR: 14, lL: 8, kL: 0, lR: 8, kR: 0 } },
  { f: JUMP.land, p: { aL: 120, eL: 40, aR: 120, eR: 40, head: 6 } },
  { f: 1500, p: { aL: 150, eL: 70, aR: 150, eR: 70, head: -2 } },
  { f: JUMP.hop, p: { aL: 168, eL: 10, aR: 168, eR: 10, head: -5 } },
  { f: 1528, p: { aL: 140, eL: 80, aR: 165, eR: 20 } },
  { f: 1538, p: { aL: 165, eL: 20, aR: 140, eR: 80 } },
  { f: 1548, p: { aL: 140, eL: 80, aR: 165, eR: 20 } },
  { f: 1558, p: { aL: 165, eL: 20, aR: 140, eR: 80 } },
];

const mouth7 = (g: number): Mouth => {
  if (g < 1388) return "grin";
  if (g < JUMP.crouch) return "o";
  if (g < JUMP.launch) return "grin";
  return "open";
};

export const S7Joie: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + START;
  const cam = camBureau(g);
  const pose = poseAt(g, KEYS7);

  // hauteur des hanches : assise, envol, chute, debout, petit bond
  const rise = ip(g, [JUMP.launch, JUMP.apex], [0, 1], EOUT);
  const fallT = ip(g, [JUMP.apex + 6, JUMP.land], [0, 1], EIN);
  const apexY = ELLE.y - 400;
  let hy = ELLE.y;
  if (g >= JUMP.launch) hy = lerp(ELLE.y, apexY, rise);
  if (g >= JUMP.apex + 6) hy = lerp(apexY, STAND_Y, fallT);
  const hop = ip(g, [JUMP.hop, JUMP.hop + 10], [0, 1], EOUT) * ip(g, [JUMP.hop + 12, JUMP.hop + 22], [1, 0], EIN);
  hy -= hop * 70;

  // écrasement à l'appel et à l'atterrissage, étirement en vol
  let sy = 1;
  let pivotY = 0;
  if (g >= JUMP.crouch && g < JUMP.launch) sy = lerp(1, 0.8, ip(g, [JUMP.crouch, JUMP.crouch + 6], [0, 1], EOUT));
  if (g >= JUMP.launch && g < JUMP.apex) sy = 1 + 0.18 * (1 - pop(g, JUMP.launch, { damping: 10, stiffness: 160 }));
  if (g >= JUMP.apex + 6 && g < JUMP.land) sy = lerp(1, 1.07, fallT);
  if (g >= JUMP.land) {
    sy = 1 - 0.2 * (1 - pop(g, JUMP.land, { damping: 8, stiffness: 220, mass: 0.7 }));
    pivotY = 190;
  }
  if (g >= JUMP.hop + 20) {
    sy = Math.min(sy, 1 - 0.1 * (1 - pop(g, JUMP.hop + 20, { damping: 9, stiffness: 240 })));
  }
  const sx = 1 / Math.sqrt(sy);
  const legs = g >= JUMP.launch - 2;

  // le trait ocre se rétracte dans la chaise, étincelle au contact
  const tail = ip(g, [1380, 1394], [0, 1], EIO);
  const spark = ip(g, [1380, 1394], [0, 1]);

  // la chaise recule sous la poussée
  const chairRot = ip(g, [JUMP.launch, JUMP.launch + 8, JUMP.launch + 30], [0, -6, 0], EIO);

  const conf = g < CONF_HANDOFF ? confettiAt(g) : [];

  return (
    <Camera cam={cam} background={C.bg}>
      <Layer depth={0.55}>
        <WorldSvg>
          <BackWall g={g} />
        </WorldSvg>
      </Layer>
      <Layer depth={1}>
        <WorldSvg>
          <g transform={`rotate(${chairRot}, ${ELLE.x}, 930)`}>
            <Chair />
          </g>
          <Character
            who="elle"
            x={ELLE.x}
            y={hy}
            scale={ELLE.s}
            pose={pose}
            mouth={mouth7(g)}
            eyes={g >= JUMP.launch - 4 && g < 1540 ? "happy" : "open"}
            blinkOpen={blink(g, 13)}
            brows={0.7}
            breathe={breath(g, 3)}
            sx={sx}
            sy={sy}
            pivotY={pivotY}
            legs={legs}
          />
          <Table />
          <Mug g={g} />
          <Laptop>
            <ToolCardRect g={g} />
            <ToolWrench g={g} />
          </Laptop>
          {tail < 1 && (
            <path
              d={SHOT_PATH}
              stroke={C.ocre}
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${SHOT_LEN} ${SHOT_LEN}`}
              strokeDashoffset={-SHOT_LEN * tail}
            />
          )}
          {spark > 0 && spark < 1 && (
            <g>
              <circle cx={ELLE.x + 150} cy={780} r={20 + spark * 90} fill="none" stroke={C.ocre} strokeWidth={10 * (1 - spark)} />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
                const a = (k / 8) * Math.PI * 2;
                return (
                  <path
                    key={k}
                    d={`M ${ELLE.x + 150 + Math.cos(a) * (30 + spark * 60)},${780 + Math.sin(a) * (30 + spark * 60)} L ${ELLE.x + 150 + Math.cos(a) * (50 + spark * 110)},${780 + Math.sin(a) * (50 + spark * 110)}`}
                    stroke={k % 2 ? C.white : C.ocre}
                    strokeWidth={6}
                    strokeLinecap="round"
                    opacity={1 - spark}
                  />
                );
              })}
            </g>
          )}
          {conf.map((c, i) =>
            c ? (
              <rect
                key={i}
                x={-c.w / 2}
                y={-c.h / 2}
                width={c.w}
                height={c.h}
                rx={2}
                fill={c.color}
                transform={`translate(${c.x}, ${c.y}) rotate(${c.rot}) scale(${c.flip}, 1)`}
              />
            ) : null,
          )}
        </WorldSvg>
        <ToolText g={g} />
      </Layer>
    </Camera>
  );
};
