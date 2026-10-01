import React from "react";
import { pop } from "./anim";

// Ligne révélée lettre par lettre : chaque lettre monte depuis un masque
export const MaskedLine: React.FC<{
  text: string;
  f: number;
  start: number;
  stagger?: number;
  style?: React.CSSProperties;
  from?: "below" | "above";
}> = ({ text, f, start, stagger = 1.4, style, from = "below" }) => {
  const chars = Array.from(text);
  return (
    <div style={{ display: "flex", whiteSpace: "pre", ...style }}>
      {chars.map((ch, i) => {
        const t = pop(f, start + i * stagger, { damping: 13, stiffness: 190, mass: 0.6 });
        const off = (1 - t) * (from === "below" ? 115 : -115);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              padding: "0.14em 0 0.16em",
              margin: "-0.14em 0 -0.16em",
            }}
          >
            <span style={{ display: "inline-block", transform: `translateY(${off}%)` }}>
              {ch === " " ? " " : ch}
            </span>
          </span>
        );
      })}
    </div>
  );
};
