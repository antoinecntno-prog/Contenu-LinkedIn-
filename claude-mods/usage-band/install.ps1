# Installe le mod usage-band pour toutes les sessions Claude Code CLI (Windows).
# Usage : powershell -ExecutionPolicy Bypass -File install.ps1
$ErrorActionPreference = 'Stop'

$UserHome = if ($env:USERPROFILE) { $env:USERPROFILE } else { $HOME }
$Src = $PSScriptRoot
$Dest = Join-Path $UserHome '.claude\mods\usage-band'
$Settings = Join-Path $UserHome '.claude\settings.json'

New-Item -ItemType Directory -Force -Path $Dest | Out-Null
foreach ($item in '.claude-plugin', 'hooks', 'types', 'tests', 'tsconfig.json') {
  Copy-Item -Recurse -Force -Path (Join-Path $Src $item) -Destination $Dest
}
Write-Host "Mod copie dans $Dest"

if (Test-Path $Settings) {
  Copy-Item -Force $Settings "$Settings.bak"
  $raw = [IO.File]::ReadAllText($Settings)
  $data = if ($raw.Trim()) { $raw | ConvertFrom-Json } else { [pscustomobject]@{} }
} else {
  $data = [pscustomobject]@{}
}

if (-not ($data.PSObject.Properties.Name -contains 'env')) {
  $data | Add-Member -NotePropertyName env -NotePropertyValue ([pscustomobject]@{})
}
$current = $data.env.CLAUDE_CODE_PLUGIN_DIRS
$dirs = @()
if ($current) { $dirs = @($current -split ';' | Where-Object { $_ }) }
if ($dirs -notcontains $Dest) { $dirs += $Dest }
$value = $dirs -join ';'
if ($data.env.PSObject.Properties.Name -contains 'CLAUDE_CODE_PLUGIN_DIRS') {
  $data.env.CLAUDE_CODE_PLUGIN_DIRS = $value
} else {
  $data.env | Add-Member -NotePropertyName CLAUDE_CODE_PLUGIN_DIRS -NotePropertyValue $value
}

$json = $data | ConvertTo-Json -Depth 100
[IO.File]::WriteAllText($Settings, $json + "`n", (New-Object Text.UTF8Encoding($false)))
Write-Host "CLAUDE_CODE_PLUGIN_DIRS ajoute dans $Settings (sauvegarde : $Settings.bak)"
Write-Host "Ferme puis relance claude dans le terminal de VS Code."
