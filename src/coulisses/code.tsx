import React from "react";
import { C } from "../constants";
import { MONO } from "../fonts";
import { K } from "./constants";

// Extraits du code du film précédent, raccourcis pour tenir dans la largeur
export const CODE: string[] = [
  `import { Sequence, spring } from "remotion";`,
  `import { S1Route } from "./scenes/S1Route";`,
  `import { S3Regle } from "./scenes/S3Regle";`,
  ``,
  `// Une scène par fichier, calée à 60 i/s`,
  `export const Film = () => (`,
  `  <AbsoluteFill style={{ background: C.bg }}>`,
  `    <Sequence name="1 La route" from={0}>`,
  `      <S1Route />`,
  `    </Sequence>`,
  `    <Sequence name="3 Règle n° 1" from={450}>`,
  `      <S3Regle />`,
  `    </Sequence>`,
  `    <Sequence name="8 10 h" from={1560}>`,
  `      <S8DixHeures />`,
  `    </Sequence>`,
  `  </AbsoluteFill>`,
  `);`,
  ``,
  `// Le 1 claque au centre, avec rebond`,
  `const k = pop(g, 476, { damping: 11 });`,
  `const y = ip(g, [462, 476], [-900, 0], EIN);`,
];

// Lignes du correctif réel de la main qui pointe (src/scenes/bureau.tsx, commit 1ee67f2)
export const DIFF: { sign: "-" | "+"; text: string }[] = [
  { sign: "-", text: `<rect x={-30} y={-262} width={32} height={150} />` },
  { sign: "-", text: `<rect x={4} y={-150} width={30} height={50} />` },
  { sign: "+", text: `<rect x={-62} y={-264} width={32} height={152} />` },
  { sign: "+", text: `<rect x={-28} y={-152} width={30} height={50} />` },
];

type Tok = { t: string; c: string };

const KW = new Set(["import", "from", "export", "const", "return"]);

// Coloration syntaxique minimale, suffisante pour ces extraits
export const tokenize = (line: string): Tok[] => {
  if (line.trim().startsWith("//")) return [{ t: line, c: K.dim }];
  const out: Tok[] = [];
  const re = /("[^"]*"|'[^']*')|(\d+)|(<\/?[A-Za-z0-9]+|\/>|>)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [s, str, num, tag, id, ws] = m;
    if (str) out.push({ t: s, c: K.str });
    else if (num) out.push({ t: s, c: K.str });
    else if (tag) out.push({ t: s, c: C.ocre });
    else if (id) {
      const next = line[re.lastIndex];
      out.push({ t: s, c: KW.has(s) ? K.kw : next === "=" ? K.attr : K.id });
    } else if (ws) out.push({ t: s, c: K.id });
    else out.push({ t: s, c: K.dim });
  }
  return out;
};

// Ligne de code colorée, tronquée à n caractères
export const CodeLine: React.FC<{ text: string; n?: number; size?: number; style?: React.CSSProperties }> = ({
  text,
  n = Infinity,
  size = 27,
  style,
}) => {
  const toks = tokenize(text);
  let left = n;
  return (
    <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: size, whiteSpace: "pre", ...style }}>
      {toks.map((tk, i) => {
        if (left <= 0) return null;
        const s = tk.t.slice(0, left);
        left -= tk.t.length;
        return (
          <span key={i} style={{ color: tk.c }}>
            {s}
          </span>
        );
      })}
    </div>
  );
};

export const MONO_ADV = 0.6; // chasse de JetBrains Mono, en em
