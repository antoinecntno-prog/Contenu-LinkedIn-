# usage-band

Bandeau au-dessus du prompt de Claude Code CLI : limites 5h et 7 jours (consommation, temps écoulé, compte à rebours), tokens de la session (↑ entrée, ↓ sortie, ≋ lus en cache) et coût. La même info s'affiche aussi en ligne de statut sous le prompt.

## Installation pour toutes les sessions (Windows)

Dans le terminal PowerShell de VS Code :

```powershell
git clone -b claude/usage-band https://github.com/antoinecntno-prog/contenu-linkedin-.git
powershell -ExecutionPolicy Bypass -File .\contenu-linkedin-\claude-mods\usage-band\install.ps1
```

Le script copie le mod dans `%USERPROFILE%\.claude\mods\usage-band` et ajoute ce dossier à `CLAUDE_CODE_PLUGIN_DIRS` dans le bloc `env` de `%USERPROFILE%\.claude\settings.json`, après une sauvegarde `settings.json.bak`. Le reste du fichier est conservé. Chaque session `claude` lancée ensuite charge le mod.

## Installation pour toutes les sessions (macOS, Linux)

```bash
git clone -b claude/usage-band https://github.com/antoinecntno-prog/contenu-linkedin-.git
bash contenu-linkedin-/claude-mods/usage-band/install.sh
```

Même fonctionnement, avec `~/.claude`. Le script demande `python3`.

## Où il s'affiche

Dans le terminal, celui de VS Code compris, et dans l'onglet Code de l'app desktop. Le panneau graphique de l'extension VS Code, Claude Code web et l'app mobile n'affichent pas le bandeau.

## Vérifier

```bash
claude plugin validate ~/.claude/mods/usage-band
claude plugin test ~/.claude/mods/usage-band
```
