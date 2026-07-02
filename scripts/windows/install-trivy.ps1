# =============================================================
# install-trivy.ps1 — Instala Trivy (scanner de seguridad) para /auditoria
# Si PowerShell bloquea: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# =============================================================
param()

Write-Host ""
Write-Host "Team Brain — Instalador de Trivy" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------
# Idempotencia: si ya esta instalado, no hacer nada
# -----------------------------------------------------------
$trivyCmd = Get-Command trivy -ErrorAction SilentlyContinue
if ($trivyCmd) {
    $ver = (& trivy --version 2>$null | Select-Object -First 1)
    Write-Host "[OK] Trivy ya esta instalado ($ver)." -ForegroundColor Green
    Write-Host "[INFO] Para actualizarlo: winget upgrade AquaSecurity.Trivy  /  choco upgrade trivy" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

$installed = $false

# -----------------------------------------------------------
# Estrategia 1: winget
# -----------------------------------------------------------
if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host "[INFO] Instalando Trivy con winget..." -ForegroundColor Cyan
    try {
        winget install -e --id AquaSecurity.Trivy --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -eq 0) { $installed = $true }
    } catch {
        Write-Host "[WARN] winget fallo: $_" -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------
# Estrategia 2: chocolatey
# -----------------------------------------------------------
if (-not $installed -and (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "[INFO] Instalando Trivy con Chocolatey..." -ForegroundColor Cyan
    try {
        choco install trivy -y
        if ($LASTEXITCODE -eq 0) { $installed = $true }
    } catch {
        Write-Host "[WARN] choco fallo: $_" -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------
# Resumen
# -----------------------------------------------------------
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host " RESUMEN DE INSTALACION — Trivy"                              -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

if ($installed) {
    Write-Host "[OK] Trivy instalado. Abri una nueva terminal y verifica con: trivy --version" -ForegroundColor Green
} else {
    Write-Host "[WARN] No se pudo instalar Trivy automaticamente (no se encontro winget ni choco)." -ForegroundColor Yellow
    Write-Host "[INFO] Instalalo manualmente con una de estas opciones:" -ForegroundColor Cyan
    Write-Host "       winget install -e --id AquaSecurity.Trivy"
    Write-Host "       choco install trivy -y"
    Write-Host "       o descarga el binario de https://github.com/aquasecurity/trivy/releases"
}
Write-Host ""
Write-Host "[INFO] /auditoria usara Trivy para: trivy fs . / trivy image <img> / trivy config ." -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
