import React from "react";
import { C } from "../constants";
import { clamp, lerp } from "./anim";

// Pose : angles en degrés. Bras : a depuis la verticale basse (positif vers l'extérieur),
// e = pliure du coude ajoutée à a. Jambes : l depuis la verticale, k = pliure du genou.
export type Pose = {
  aL: number;
  eL: number;
  aR: number;
  eR: number;
  head: number;
  turn: number;
  lean: number;
  lL: number;
  kL: number;
  lR: number;
  kR: number;
};

export const P0: Pose = {
  aL: 12,
  eL: -20,
  aR: 12,
  eR: -20,
  head: 0,
  turn: 0,
  lean: 0,
  lL: 4,
  kL: 0,
  lR: 4,
  kR: 0,
};

export type Mouth =
  | "neutral"
  | "smile"
  | "grin"
  | "talkA"
  | "talkB"
  | "open"
  | "puzzled"
  | "o";

export type PoseKey = { f: number; p: Partial<Pose> };

const lerpPose = (a: Pose, b: Pose, t: number): Pose => {
  const out = { ...a };
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => {
    out[k] = lerp(a[k], b[k], t);
  });
  return out;
};

// Dessins intermédiaires d'un changement de pose en 4 images :
// tenus, avec un léger dépassement sur le troisième, façon papier découpé.
const CUT_STEPS = [0.35, 0.8, 1.08, 1];

export const poseAt = (f: number, keys: PoseKey[], base: Pose = P0): Pose => {
  let prev: Pose = { ...base, ...keys[0].p };
  if (f < keys[0].f || keys.length === 1) return prev;
  for (let i = 1; i < keys.length; i++) {
    const cur: Pose = { ...prev, ...keys[i].p };
    if (f < keys[i].f) return prev;
    const d = Math.floor(f - keys[i].f);
    if (d < CUT_STEPS.length) {
      return lerpPose(prev, cur, CUT_STEPS[d]);
    }
    prev = cur;
  }
  return prev;
};

// Bouche qui parle : s'ouvre et se ferme par paliers
export const talkMouth = (f: number, seed = 0): Mouth => {
  const k = Math.floor((f + seed * 7) / 5);
  const r = Math.abs(Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453) % 1;
  if (r < 0.38) return "talkA";
  if (r < 0.75) return "talkB";
  return "neutral";
};

type Who = "moi" | "elle";

const LOOK = {
  moi: {
    skin: C.skinMoi,
    skinShade: C.skinMoiShade,
    hair: C.hairMoi,
    torso: C.n7,
    sleeve: "#C2B5AB",
    trousers: C.n1,
  },
  elle: {
    skin: C.skinElle,
    skinShade: C.skinElleShade,
    hair: C.hairElle,
    torso: C.bordeaux2,
    sleeve: "#7A2236",
    trousers: C.n2,
  },
};

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (a: number, s: number): [number, number] => [s * Math.sin(rad(a)), Math.cos(rad(a))];

const TORSO =
  "M -50,-186 L 50,-186 Q 76,-186 77,-160 L 67,-10 Q 65,0 54,0 L -54,0 Q -65,0 -67,-10 L -77,-160 Q -76,-186 -50,-186 Z";

export type CharacterProps = {
  who: Who;
  x: number;
  y: number;
  scale?: number;
  pose: Pose;
  mouth?: Mouth;
  eyes?: "open" | "happy";
  blinkOpen?: number;
  brows?: number;
  sx?: number;
  sy?: number;
  pivotY?: number;
  breathe?: number;
  legs?: boolean;
  view?: "front" | "back";
  flip?: boolean;
  headDy?: number;
};

const Arm: React.FC<{
  s: number;
  a: number;
  e: number;
  color: string;
  skin: string;
}> = ({ s, a, e, color, skin }) => {
  const sh: [number, number] = [s * 66, -166];
  const d1 = dir(a, s);
  const el: [number, number] = [sh[0] + d1[0] * 84, sh[1] + d1[1] * 84];
  const d2 = dir(a + e, s);
  const ha: [number, number] = [el[0] + d2[0] * 78, el[1] + d2[1] * 78];
  return (
    <g>
      <path
        d={`M ${sh[0]},${sh[1]} L ${el[0]},${el[1]} L ${ha[0]},${ha[1]}`}
        stroke={color}
        strokeWidth={30}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={ha[0]} cy={ha[1]} r={18} fill={skin} />
    </g>
  );
};

const Leg: React.FC<{ s: number; l: number; k: number; color: string }> = ({ s, l, k, color }) => {
  const hip: [number, number] = [s * 32, -10];
  const d1 = dir(l, s);
  const kn: [number, number] = [hip[0] + d1[0] * 92, hip[1] + d1[1] * 92];
  const d2 = dir(l + k, s);
  const ft: [number, number] = [kn[0] + d2[0] * 92, kn[1] + d2[1] * 92];
  return (
    <g>
      <path
        d={`M ${hip[0]},${hip[1]} L ${kn[0]},${kn[1]} L ${ft[0]},${ft[1]}`}
        stroke={color}
        strokeWidth={36}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse cx={ft[0] + s * 8} cy={ft[1] + 10} rx={30} ry={15} fill={C.ink} />
    </g>
  );
};

const MouthShape: React.FC<{ m: Mouth; x: number }> = ({ m, x }) => {
  const y = -236;
  const t = `translate(${x}, ${y})`;
  switch (m) {
    case "neutral":
      return <path transform={t} d="M -13,0 L 13,0" stroke={C.mouth} strokeWidth={5} strokeLinecap="round" />;
    case "smile":
      return (
        <path transform={t} d="M -24,-5 Q 0,15 24,-5" stroke={C.mouth} strokeWidth={6} strokeLinecap="round" fill="none" />
      );
    case "grin":
      return (
        <g transform={t}>
          <path d="M -28,-6 Q 0,28 28,-6 Q 0,0 -28,-6 Z" fill={C.mouth} />
          <path d="M -20,-4 Q 0,-1 20,-4 L 18,1 Q 0,4 -18,1 Z" fill={C.white} />
        </g>
      );
    case "talkA":
      return (
        <g transform={t}>
          <ellipse cx={0} cy={2} rx={15} ry={12} fill={C.mouth} />
          <ellipse cx={0} cy={8} rx={8} ry={4} fill={C.bordeaux2} />
        </g>
      );
    case "talkB":
      return <ellipse transform={t} cx={0} cy={1} rx={12} ry={6} fill={C.mouth} />;
    case "open":
      return (
        <g transform={t}>
          <path d="M -32,-8 Q 0,46 32,-8 Q 0,-2 -32,-8 Z" fill={C.mouth} />
          <ellipse cx={0} cy={18} rx={13} ry={7} fill={C.bordeaux2} />
        </g>
      );
    case "puzzled":
      return (
        <path
          transform={t}
          d="M -21,2 q 7,-8 14,0 q 7,8 14,0 q 4,-4 7,-3"
          stroke={C.mouth}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      );
    case "o":
      return <ellipse transform={t} cx={0} cy={2} rx={9} ry={11} fill={C.mouth} />;
    default:
      return null;
  }
};

export const Character: React.FC<CharacterProps> = ({
  who,
  x,
  y,
  scale = 1,
  pose,
  mouth = "neutral",
  eyes = "open",
  blinkOpen = 1,
  brows = 0,
  sx = 1,
  sy = 1,
  pivotY = 0,
  breathe = 0,
  legs = false,
  view = "front",
  flip = false,
  headDy = 0,
}) => {
  const L = LOOK[who];
  const tx = pose.turn * 24;
  const br = breathe;
  const headT = `translate(0, ${br * 1.6 + headDy}) rotate(${pose.head}, 0, -205)`;
  const browBase = -314 - Math.max(0, brows) * 9;
  const browInner = browBase + Math.min(0, brows) * 11;

  const face =
    view === "front" ? (
      <g>
        {/* yeux */}
        {[-1, 1].map((s) =>
          eyes === "happy" ? (
            <path
              key={s}
              d={`M ${s * 30 + tx - 13},-278 Q ${s * 30 + tx},-294 ${s * 30 + tx + 13},-278`}
              stroke={C.ink}
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <ellipse key={s} cx={s * 30 + tx} cy={-283} rx={8.5} ry={8.5 * clamp(blinkOpen, 0.08, 1)} fill={C.ink} />
          ),
        )}
        {/* sourcils */}
        {[-1, 1].map((s) => (
          <path
            key={`b${s}`}
            d={`M ${s * 44 + tx},${browBase + 2} L ${s * 17 + tx},${browInner}`}
            stroke={L.hair}
            strokeWidth={6}
            strokeLinecap="round"
          />
        ))}
        {/* nez */}
        <path
          d={`M ${tx * 1.25 - 6},-262 Q ${tx * 1.25},-255 ${tx * 1.25 + 6},-262`}
          stroke={L.skinShade}
          strokeWidth={4.5}
          strokeLinecap="round"
          fill="none"
        />
        {who === "elle" &&
          [-1, 1].map((s) => (
            <circle key={`c${s}`} cx={s * 50 + tx} cy={-252} r={15} fill={C.bordeaux2} opacity={0.32} />
          ))}
        <MouthShape m={mouth} x={tx} />
      </g>
    ) : null;

  const hairFront =
    who === "elle" ? (
      <path
        d={`M -89,-282 C -91,-362 -40,-380 ${4 + tx * 0.3},-378 C 60,-376 93,-342 89,-282 C 72,-318 40,-334 ${10 + tx * 0.5},-333 C -20,-331 -50,-317 -66,-297 C -74,-289 -82,-285 -89,-282 Z`}
        fill={L.hair}
      />
    ) : (
      <g>
        <path
          d={`M -87,-288 C -93,-362 -30,-392 20,-383 C 72,-374 97,-340 87,-286 C 80,-310 62,-327 ${30 + tx * 0.4},-330 C 0,-333 -40,-327 -60,-309 C -72,-300 -80,-294 -87,-288 Z`}
          fill={L.hair}
        />
        <path d="M -88,-292 L -86,-262 L -80,-262 L -80,-298 Z" fill={L.hair} />
        <path d="M 88,-292 L 86,-262 L 80,-262 L 80,-298 Z" fill={L.hair} />
      </g>
    );

  const hairBack =
    who === "elle" ? (
      <g>
        <circle cx={6} cy={-392} r={36} fill={L.hair} />
        <path
          d="M -100,-262 C -110,-362 -60,-396 0,-396 C 60,-396 110,-362 100,-262 L 100,-210 Q 82,-196 70,-212 L -70,-212 Q -82,-196 -100,-210 Z"
          fill={L.hair}
        />
      </g>
    ) : null;

  const torsoDetails =
    who === "moi" ? (
      <g>
        <path d="M 0,-160 L 0,-6" stroke="#B9ADA4" strokeWidth={3} />
        {[-138, -98, -58, -20].map((by) => (
          <circle key={by} cx={0} cy={by} r={4} fill="#B9ADA4" />
        ))}
        <path d="M -22,-188 L -2,-160 L -34,-170 Z" fill="#EEE7E2" />
        <path d="M 22,-188 L 2,-160 L 34,-170 Z" fill="#EEE7E2" />
      </g>
    ) : (
      <g>
        <path d="M -26,-187 L 0,-118 L 26,-187 Z" fill={C.n6} />
        <path d="M -26,-187 L -4,-122 L -36,-148 Z" fill={C.bordeaux} />
        <path d="M 26,-187 L 4,-122 L 36,-148 Z" fill={C.bordeaux} />
        <circle cx={0} cy={-78} r={5} fill={C.bordeaux} />
        <circle cx={0} cy={-46} r={5} fill={C.bordeaux} />
      </g>
    );

  const back = view === "back";

  return (
    <g transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}>
      <g transform={`translate(0, ${pivotY}) scale(${sx}, ${sy}) translate(0, ${-pivotY})`}>
        {legs && (
          <g>
            <Leg s={-1} l={pose.lL} k={pose.kL} color={L.trousers} />
            <Leg s={1} l={pose.lR} k={pose.kR} color={L.trousers} />
          </g>
        )}
        <g transform={`rotate(${pose.lean}, 0, 0)`}>
          {view === "back" && (
            <g>
              <Arm s={-1} a={pose.aL} e={pose.eL} color={L.sleeve} skin={L.skin} />
              <Arm s={1} a={pose.aR} e={pose.eR} color={L.sleeve} skin={L.skin} />
            </g>
          )}
          {/* buste qui respire */}
          <g transform={`translate(0, ${-br * 1.2}) scale(1, ${1 + br * 0.012})`}>
            <path d={TORSO} fill={L.torso} />
            {!back && torsoDetails}
            {back && <path d="M 0,-180 L 0,-6" stroke={who === "moi" ? "#B9ADA4" : C.bordeaux} strokeWidth={4} />}
          </g>
          <rect x={-16} y={-210} width={32} height={34} rx={8} fill={L.skinShade} />
          <g transform={headT}>
            {!back && hairBack}
            {[-1, 1].map((s) => (
              <circle key={s} cx={s * 84} cy={-280} r={14} fill={L.skin} />
            ))}
            <circle cx={0} cy={-285} r={86} fill={L.skin} />
            {!back && face}
            {!back && hairFront}
            {back && (
              <g>
                {who === "elle" && <circle cx={0} cy={-392} r={36} fill={L.hair} />}
                {pose.turn !== 0 && (
                  <g>
                    <circle
                      cx={Math.sign(pose.turn) * 78}
                      cy={-292}
                      r={7}
                      fill={C.ink}
                      opacity={clamp(Math.abs(pose.turn) * 1.6) * clamp(blinkOpen * 1.2)}
                    />
                  </g>
                )}
                <path
                  d={
                    who === "elle"
                      ? `M ${-90 + pose.turn * 18},-262 C -96,-362 -50,-374 0,-374 C 50,-374 96,-362 ${90 + pose.turn * 18},-262 L ${92 + pose.turn * 10},-210 Q 0,-196 ${-92 + pose.turn * 10},-210 Z`
                      : `M ${-89 + pose.turn * 22},-262 C -94,-362 -40,-380 0,-380 C 40,-380 94,-362 ${89 + pose.turn * 22},-262 L ${84 + pose.turn * 14},-226 Q 40,-206 0,-204 Q -40,-206 ${-84 + pose.turn * 14},-226 Z`
                  }
                  fill={L.hair}
                />
              </g>
            )}
          </g>
          {view === "front" && (
            <g>
              <Arm s={-1} a={pose.aL} e={pose.eL} color={L.sleeve} skin={L.skin} />
              <Arm s={1} a={pose.aR} e={pose.eR} color={L.sleeve} skin={L.skin} />
            </g>
          )}
        </g>
      </g>
    </g>
  );
};

// Cinématique inverse à deux segments : angles du bras pour atteindre une cible.
// Cible donnée dans le repère du personnage (avant mise à l'échelle).
export const armIK = (s: number, tx: number, ty: number, elbowOut = true): { a: number; e: number } => {
  const sx0 = s * 66;
  const sy0 = -166;
  const L1 = 84;
  const L2 = 78;
  const vx = tx - sx0;
  const vy = ty - sy0;
  const d = Math.min(Math.hypot(vx, vy), L1 + L2 - 0.5);
  const aV = (Math.atan2(s * vx, vy) * 180) / Math.PI;
  const alpha = (Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)) * 180) / Math.PI;
  const beta = (Math.acos((L2 * L2 + d * d - L1 * L1) / (2 * L2 * d)) * 180) / Math.PI;
  const k = elbowOut ? 1 : -1;
  const a = aV + k * alpha;
  const fore = aV - k * beta;
  return { a, e: fore - a };
};
