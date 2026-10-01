import React from "react";
import { C } from "../constants";

// Petite voiture de profil. Origine : point de contact au sol, au centre.
export const Car: React.FC<{
  x: number;
  y: number;
  scale?: number;
  wheelRot: number;
  tilt?: number;
  sx?: number;
  sy?: number;
  bob?: number;
  headBob?: number;
}> = ({ x, y, scale = 1, wheelRot, tilt = 0, sx = 1, sy = 1, bob = 0, headBob = 0 }) => {
  const wheel = (cx: number) => (
    <g transform={`translate(${cx}, -28)`}>
      <circle r={29} fill={C.ink} />
      <circle r={14} fill={C.n6} />
      <g transform={`rotate(${wheelRot})`}>
        {[0, 120, 240].map((a) => (
          <rect key={a} x={-2.5} y={-13} width={5} height={13} rx={2} fill={C.n2} transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r={4} fill={C.n2} />
    </g>
  );
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={2} rx={140} ry={9} fill={C.ink} opacity={0.5} />
      <g transform={`translate(0, -30) scale(${sx}, ${sy}) rotate(${tilt}, 0, 0) translate(0, ${30 + bob})`}>
        {/* habitacle et vitres */}
        <path
          d="M -62,-84 L -40,-128 Q -34,-137 -22,-137 L 46,-137 Q 58,-137 66,-127 L 98,-84 Z"
          fill={C.n6}
        />
        <path d="M -50,-88 L -33,-124 L 2,-124 L 2,-88 Z" fill={C.n1} />
        <path d="M 12,-88 L 12,-124 L 46,-124 Q 53,-124 57,-118 L 82,-88 Z" fill={C.n1} />
        {/* conducteur */}
        <g transform={`translate(34, ${-102 + headBob})`}>
          <circle r={17} fill={C.skinMoi} />
          <path d="M -17,-3 C -18,-20 -4,-24 6,-22 C 16,-20 19,-10 17,-2 C 12,-10 4,-12 -4,-11 C -10,-10 -14,-7 -17,-3 Z" fill={C.hairMoi} />
          <circle cx={9} cy={-1} r={2.6} fill={C.ink} />
        </g>
        {/* caisse */}
        <path
          d="M -134,-42 Q -136,-84 -100,-86 L 112,-86 Q 138,-82 138,-56 L 138,-42 Q 138,-30 126,-30 L -124,-30 Q -134,-30 -134,-42 Z"
          fill={C.n7}
        />
        <rect x={-130} y={-66} width={264} height={9} fill={C.bordeaux2} />
        <path d="M -6,-86 L -6,-36" stroke={C.n5} strokeWidth={3} />
        <rect x={8} y={-80} width={18} height={5} rx={2.5} fill={C.n5} />
        <ellipse cx={134} cy={-74} rx={6} ry={8} fill={C.white} />
        <rect x={-137} y={-80} width={7} height={15} rx={2} fill={C.bordeaux2} />
      </g>
      {wheel(-82)}
      {wheel(86)}
    </g>
  );
};
