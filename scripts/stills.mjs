// Rend des images fixes de la composition, en un seul regroupement.
// Usage : node scripts/stills.mjs <dossier> <composition> <image> [image...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [outDir, compId, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_CHROME ?? null;
const composition = await selectComposition({ serveUrl, id: compId, browserExecutable });
for (const fr of frames) {
  const frame = Number(fr);
  const output = path.join(outDir, `${compId}-${String(frame).padStart(4, "0")}.${process.env.STILL_EXT ?? "jpg"}`);
  await renderStill({ composition, serveUrl, frame, output, ...(output.endsWith(".png") ? { imageFormat: "png" } : { imageFormat: "jpeg", jpegQuality: 85 }), browserExecutable });
  console.log("ok", output);
}
