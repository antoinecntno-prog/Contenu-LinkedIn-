import { continueRender, delayRender, staticFile } from "remotion";

// Polices servies depuis public/fonts : le rendu ne dépend d'aucun accès réseau.
// Fichiers variables, sous-ensemble latin, repris de Google Fonts (licence SIL Open Font License).
const load = (family: string, file: string) => {
  if (typeof document === "undefined") return family;
  const handle = delayRender(`Police ${family}`);
  const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, {
    weight: "100 900",
    style: "normal",
  });
  face
    .load()
    .then(() => {
      document.fonts.add(face);
      continueRender(handle);
    })
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
  return family;
};

export const TITLE = load("Bricolage Grotesque", "BricolageGrotesque-latin.woff2");
export const BODY = load("DM Sans", "DMSans-latin.woff2");
export const MONO = load("JetBrains Mono", "JetBrainsMono-latin.woff2");
