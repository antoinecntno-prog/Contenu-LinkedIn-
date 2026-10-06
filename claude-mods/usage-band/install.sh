#!/usr/bin/env bash
# Installe le mod usage-band pour toutes les sessions Claude Code CLI (macOS, Linux).
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.claude/mods/usage-band"
SETTINGS="$HOME/.claude/settings.json"

mkdir -p "$DEST"
cp -R "$SRC/.claude-plugin" "$SRC/hooks" "$SRC/types" "$SRC/tests" "$SRC/tsconfig.json" "$DEST/"
echo "Mod copié dans $DEST"

[ -f "$SETTINGS" ] && cp "$SETTINGS" "$SETTINGS.bak"
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"

python3 - "$SETTINGS" "$DEST" <<'PY'
import json, sys
path, dest = sys.argv[1], sys.argv[2]
with open(path) as f:
    data = json.load(f)
env = data.setdefault("env", {})
dirs = [d for d in env.get("CLAUDE_CODE_PLUGIN_DIRS", "").split(":") if d]
if dest not in dirs:
    dirs.append(dest)
env["CLAUDE_CODE_PLUGIN_DIRS"] = ":".join(dirs)
with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY
echo "CLAUDE_CODE_PLUGIN_DIRS ajouté dans $SETTINGS (sauvegarde : $SETTINGS.bak)"
echo "Relance claude dans le terminal de VS Code."
