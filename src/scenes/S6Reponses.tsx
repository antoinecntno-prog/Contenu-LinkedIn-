import React from "react";
import { useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C, SCENES, W } from "../constants";
import { TITLE } from "../fonts";
import { Camera, Layer, WorldSvg, worldToScreen } from "../lib/camera";
import { Character, poseAt, Mouth } from "../lib/Character";
import { EIO, EIN, EOUT, blink, breath, drift, ip, lerp, pop, poly } from "../lib/anim";
import { morphPts, placePts } from "../lib/morph";
import {
  BIG,
  BUBBLES,
  BackWall,
  BigBubble,
  Bubble,
  CHECKPTS,
  Chair,
  ELLE,
  FLIP0,
  FLIP_STEP,
  FREEZE,
  HandFG,
  LAPTOP,
  Laptop,
  MERGE,
  Mug,
  SHOT,
  Table,
  WRENCHPTS,
  bubblePos,
  camBureau,
  flipT,
  flyT,
  glyphAt,
} from "./bureau";
import { ELLE_KEYS } from "./S5Questions";

const START = SCENES.reponses.start;

// Le trait ocre part de la clé et file vers elle
export const SHOT_PATH = `M ${LAPTOP.x + 600},${LAPTOP.y + 92} C 2100,60 1200,240 ${ELLE.x + 150},780`;

const KEYS6 = [
  ...ELLE_KEYS,
  { f: 1150, p: { head: -6, turn: -0.3 } },
  { f: 1172, p: { turn: 0.05, head: 3 } },
  { f: 1196, p: { turn: 0.35, head: -3 } },
  { f: 1226, p: { turn: 0.85, head: 4, aL: 40, eL: -70 } },
  { f: 1356, p: { turn: 0.1, head: 0, aL: 18, eL: -95 } },
];

const mouth6 = (g: number): Mouth => {
  if (g < 1172) return "o";
  if (g < 1206) return "smile";
  return "grin";
};

const TEXT = { x: LAPTOP.x + 70, y: LAPTOP.y + 140, w: 590 };
const SWEEP = { start: 1268, end: 1288 };
const ICON = { x: LAPTOP.x + 610, y: LAPTOP.y + 92 };

// Carte « outil » affichée sur l'écran (aussi utilisée par la scène 7)
export const ToolCardRect: React.FC<{ g: number }> = ({ g }) => {
  const card = g < MERGE - 12 ? 0 : pop(g, MERGE - 12, { damping: 12 });
  return (
    <g transform={`translate(${LAPTOP.x + LAPTOP.w / 2}, ${LAPTOP.y + LAPTOP.h / 2}) scale(${card}) translate(${-LAPTOP.x - LAPTOP.w / 2}, ${-LAPTOP.y - LAPTOP.h / 2})`}>
      <rect x={LAPTOP.x + 24} y={LAPTOP.y + 22} width={LAPTOP.w - 48} height={LAPTOP.h - 44} rx={14} fill={C.white} />
    </g>
  );
};

export const ToolText: React.FC<{ g: number }> = ({ g }) => {
  const sweep = ip(g, [SWEEP.start, SWEEP.end], [0, 1], EIO);
  return (
    <div
      style={{
        position: "absolute",
        left: TEXT.x,
        top: TEXT.y,
        width: TEXT.w + 40,
        fontFamily: TITLE,
        fontWeight: 800,
        fontSize: 60,
        lineHeight: 1.08,
        letterSpacing: -1,
        color: C.bordeaux,
        clipPath: `inset(-20px ${(1 - sweep) * 100}% -20px -20px)`,
      }}
    >
      <div>Chaque réponse</div>
      <div>devient un outil.</div>
    </div>
  );
};

const wrenchState = (g: number) => {
  const merge = ip(g, [MERGE, MERGE + 8], [0, 1], EIO);
  const mergePop = pop(g, MERGE, { damping: 9, stiffness: 200 });
  const sweep = ip(g, [SWEEP.start, SWEEP.end], [0, 1], EIO);
  const toIcon = ip(g, [SWEEP.end + 2, SWEEP.end + 14], [0, 1], EIO);
  const wx = lerp(lerp(LAPTOP.x + 80, TEXT.x + TEXT.w + 30, sweep), ICON.x, toIcon);
  const wy = lerp(LAPTOP.y + 205, ICON.y, toIcon);
  const ws = lerp(1.2, 0.85, toIcon) * (g < MERGE ? 0 : mergePop);
  const twist =
    g > 1306 ? Math.sin(((g - 1306) / 26) * Math.PI * 2) * 22 * (Math.floor((g - 1306) / 26) % 2 === 0 ? 1 : 0.4) : 0;
  return { merge, wx, wy, ws, twist };
};

export const ToolWrench: React.FC<{ g: number }> = ({ g }) => {
  if (g < MERGE) return null;
  const w = wrenchState(g);
  const pts = placePts(morphPts(CHECKPTS, WRENCHPTS, w.merge), 0, 0, 1);
  return (
    <g transform={`translate(${w.wx}, ${w.wy}) rotate(${w.twist}) scale(${w.ws})`}>
      <path d={poly(pts)} stroke={C.ocre} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
};

export const S6Reponses: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + START;
  const cam = camBureau(g);
  const pose = poseAt(g, KEYS6);
  const brows = ip(g, [1150, 1190], [0.8, 0.3]);

  // index de la bulle qui bascule
  const cur = Math.max(0, Math.min(BUBBLES.length - 1, Math.floor((g - FLIP0) / FLIP_STEP)));

  // ma main pointe chaque bulle, puis sort du cadre
  const base = { x: 1560, y: 790 };
  const tgt = worldToScreen(cam, 1, ...bubblePos(cur, FREEZE));
  const aim = (Math.atan2(tgt[0] - base.x, -(tgt[1] - base.y)) * 180) / Math.PI;
  const local = g - (FLIP0 + cur * FLIP_STEP);
  const tap = g >= FLIP0 && local >= 0 && local < 3 ? 26 : 0;
  const handOut = ip(g, [1222, 1240], [0, 1], EIN);
  const handPoint = g >= 1146;
  const handRot = g < 1146 ? -6 : Math.max(-60, Math.min(20, aim * 0.55));

  // clé : les coches se rejoignent ici
  const { wx, wy } = wrenchState(g);
  const shotP = ip(g, [SHOT.start, SHOT.end], [0, 1], EIO);
  const evoShot = evolvePath(shotP, SHOT_PATH);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Camera cam={cam} background={C.bg}>
        <Layer depth={0.55}>
          <WorldSvg>
            <BackWall g={g} />
          </WorldSvg>
        </Layer>
        <Layer depth={1}>
          <WorldSvg>
            <Chair />
            <Character
              who="elle"
              x={ELLE.x}
              y={ELLE.y}
              scale={ELLE.s}
              pose={pose}
              mouth={mouth6(g)}
              blinkOpen={blink(g, 13)}
              brows={brows}
              breathe={breath(g, 3)}
            />
            <Table />
            <Mug g={g} />
            <Laptop>
              <ToolCardRect g={g} />
            </Laptop>
            {/* bulles : ? qui deviennent des coches, puis s'envolent */}
            {BUBBLES.map((b, i) => {
              const [x, y] = bubblePos(i, Math.min(g, FREEZE));
              const ft = flyT(i, g);
              const burst = pop(g, 1222 + i * 2, { damping: 14, stiffness: 260 });
              const s = g < 1222 + i * 2 ? 1 : Math.max(0, 1 - burst * 1.1);
              const fl = FLIP0 + i * FLIP_STEP;
              const ring = ip(g, [fl, fl + 12], [0, 1]);
              return (
                <g key={i}>
                  {s > 0.01 && (
                    <Bubble
                      x={x}
                      y={y}
                      r={b.r}
                      scale={s}
                      glyph={glyphAt(i, g, x, y)}
                      dot={1 - flipT(i, g)}
                      strokeW={12 * (b.r / 62)}
                      glyphOpacity={ft > 0 ? 0 : 1}
                    />
                  )}
                  {g >= fl && g < fl + 12 && (
                    <g>
                      <circle cx={x} cy={y} r={b.r * (1 + ring * 0.8)} fill="none" stroke={C.ocre} strokeWidth={10 * (1 - ring)} />
                      {[0, 1, 2, 3, 4, 5].map((k) => {
                        const a = (k / 6) * Math.PI * 2 + i;
                        const r0 = b.r * (1.1 + ring * 0.5);
                        const r1 = b.r * (1.3 + ring * 0.9);
                        return (
                          <path
                            key={k}
                            d={`M ${x + Math.cos(a) * r0},${y + Math.sin(a) * r0} L ${x + Math.cos(a) * r1},${y + Math.sin(a) * r1}`}
                            stroke={k % 2 ? C.white : C.ocre}
                            strokeWidth={7}
                            strokeLinecap="round"
                            opacity={1 - ring}
                          />
                        );
                      })}
                    </g>
                  )}
                  {ft > 0 && ft < 1 && (
                    <path
                      d={poly(
                        placePts(CHECKPTS, lerp(x, wx, ft), lerp(y, wy, ft) - Math.sin(Math.PI * ft) * 300, lerp(b.r / 62, 1.2, ft), ft * 360 * (i % 2 ? 1 : -1)),
                      )}
                      stroke={C.ocre}
                      strokeWidth={12 * lerp(b.r / 62, 1.2, ft)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                </g>
              );
            })}
            <BigBubble g={g} />
            {g >= 1148 && g < 1166 &&
              [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
                const a = (k / 8) * Math.PI * 2;
                const t = ip(g, [1148, 1166], [0, 1], EOUT);
                return <circle key={k} cx={BIG.x + Math.cos(a) * (300 + t * 220)} cy={BIG.y + Math.sin(a) * (110 + t * 140)} r={24 * (1 - t)} fill={C.white} />;
              })}
          </WorldSvg>
          {/* texte déposé par la clé sur l'écran */}
          <ToolText g={g} />
          <WorldSvg>
            <ToolWrench g={g} />
            {g >= SHOT.start && (
              <g>
                <path d={SHOT_PATH} stroke={C.ocre} strokeWidth={12} strokeLinecap="round" fill="none" strokeDasharray={evoShot.strokeDasharray} strokeDashoffset={evoShot.strokeDashoffset} />
              </g>
            )}
          </WorldSvg>
        </Layer>
      </Camera>
      {handOut < 1 && (
        <svg width={W} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <HandFG
            x={base.x + drift(g, 81, 6, 80) + Math.sin((handRot * Math.PI) / 180) * tap}
            y={base.y + drift(g, 82, 5, 70) - Math.cos((handRot * Math.PI) / 180) * tap + handOut * 700}
            rot={handRot}
            shape={handPoint ? "point" : "open"}
          />
        </svg>
      )}
    </div>
  );
};
