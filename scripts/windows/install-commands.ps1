# =============================================================
# install-commands.ps1 — Instala commands/ y workflows/ en Claude Code
# Si PowerShell bloquea: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# =============================================================
param()

$RepoRoot      = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ClaudeRoot    = Join-Path $env:USERPROFILE ".claude"

$Dirs = @(
    @{ Src = Join-Path $RepoRoot "commands";  Dest = Join-Path $ClaudeRoot "commands" },
    @{ Src = Join-Path $RepoRoot "workflows"; Dest = Join-Path $ClaudeRoot "workflows" }
)

Write-Host ""
Write-Host "Team Brain — Instalador de Commands y Workflows" -ForegroundColor Cyan
Write-Host "Destino raiz: $ClaudeRoot" -ForegroundColor Cyan
Write-Host ""

$TotalErrors = 0

foreach ($dir in $Dirs) {
    $name = Split-Path $dir.Src -Leaf

    if (-not (Test-Path $dir.Src)) {
        Write-Host "[WARN] Carpeta '$name' no encontrada en el repo, se omite." -ForegroundColor Yellow
        continue
    }

    Write-Host "[INFO] Instalando $name..." -ForegroundColor Cyan

    try {
        if (-not (Test-Path $dir.Dest)) {
            New-Item -ItemType Directory -Path $dir.Dest -Force | Out-Null
        }
        # Copia recursiva; -Force sobreescribe archivos existentes
        Copy-Item -Path (Join-Path $dir.Src "*") -Destination $dir.Dest -Recurse -Force
        $count = (Get-ChildItem $dir.Dest -Recurse -File).Count
        Write-Host "[OK] $name instalado ($count archivos)" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] No se pudo instalar ${name}: $_" -ForegroundColor Red
        $TotalErrors++
    }
}

Write-Host ""
if ($TotalErrors -eq 0) {
    Write-Host "[OK] Commands y workflows instalados correctamente." -ForegroundColor Green
} else {
    Write-Host "[WARN] Instalacion completada con $TotalErrors error(es)." -ForegroundColor Yellow
}
Write-Host ""
