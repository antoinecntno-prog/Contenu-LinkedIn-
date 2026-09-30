// Injecte scenes.json dans index.html (bloc <script id="schedule">).
import fs from "node:fs";
const root = new URL("../", import.meta.url);
const html = fs.readFileSync(new URL("index.html", root), "utf8");
const json = JSON.stringify(JSON.parse(fs.readFileSync(new URL("scenes.json", root), "utf8")));
const out = html.replace(/(<script type="application\/json" id="schedule">)[\s\S]*?(<\/script>)/, `$1\n${json}\n    $2`);
fs.writeFileSync(new URL("index.html", root), out);
console.log("planning injecté :", JSON.parse(json).duration, "s");
