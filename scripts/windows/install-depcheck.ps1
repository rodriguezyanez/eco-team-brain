# =============================================================
# install-depcheck.ps1 — Instala OWASP Dependency-Check CLI para /auditoria
# Alinea con el plugin Gradle del equipo: org.owasp.dependencycheck:12.2.0
# Si PowerShell bloquea: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# =============================================================
param(
    [string]$Version = "12.2.0"
)

$ToolsDir = Join-Path $env:USERPROFILE ".klap\tools"
$DcDir    = Join-Path $ToolsDir "dependency-check"
$DcBin    = Join-Path $DcDir "bin\dependency-check.bat"

Write-Host ""
Write-Host "Team Brain — Instalador de OWASP Dependency-Check CLI (v$Version)" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------
# Prerequisito: Java
# -----------------------------------------------------------
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] No se encontro 'java' en el PATH. Dependency-Check requiere Java (JRE/JDK)." -ForegroundColor Yellow
    Write-Host "[WARN] Instala Java 11+ y configura JAVA_HOME antes de correr dependency-check." -ForegroundColor Yellow
}

# -----------------------------------------------------------
# Idempotencia: ya instalado (PATH o carpeta de klap)
# -----------------------------------------------------------
if (Get-Command dependency-check -ErrorAction SilentlyContinue) {
    Write-Host "[OK] dependency-check ya esta disponible en el PATH." -ForegroundColor Green
    Write-Host ""
    exit 0
}
if (Test-Path $DcBin) {
    Write-Host "[OK] Dependency-Check ya esta instalado en: $DcDir" -ForegroundColor Green
    Write-Host "[INFO] Ejecutalo con: `"$DcBin`" --version" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

$installed = $false

# -----------------------------------------------------------
# Estrategia 1: chocolatey
# -----------------------------------------------------------
if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "[INFO] Intentando instalar con Chocolatey..." -ForegroundColor Cyan
    try {
        choco install dependency-check -y
        if ($LASTEXITCODE -eq 0 -and (Get-Command dependency-check -ErrorAction SilentlyContinue)) {
            $installed = $true
        }
    } catch {
        Write-Host "[WARN] choco fallo: $_" -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------
# Estrategia 2: descarga del release ZIP oficial
# -----------------------------------------------------------
if (-not $installed) {
    $Url = "https://github.com/dependency-check/DependencyCheck/releases/download/v$Version/dependency-check-$Version-release.zip"
    $Zip = Join-Path $env:TEMP "dependency-check-$Version-release.zip"
    Write-Host "[INFO] Descargando Dependency-Check $Version desde GitHub..." -ForegroundColor Cyan
    try {
        if (-not (Test-Path $ToolsDir)) { New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null }
        if (Test-Path $DcDir) { Remove-Item $DcDir -Recurse -Force }
        Invoke-WebRequest -Uri $Url -OutFile $Zip -UseBasicParsing
        Write-Host "[INFO] Extrayendo en $ToolsDir ..." -ForegroundColor Cyan
        Expand-Archive -Path $Zip -DestinationPath $ToolsDir -Force
        Remove-Item $Zip -Force
        if (Test-Path $DcBin) { $installed = $true }
    } catch {
        Write-Host "[ERROR] No se pudo descargar/extraer Dependency-Check: $_" -ForegroundColor Red
    }
}

# -----------------------------------------------------------
# Agregar bin al PATH de usuario (si se instalo por ZIP)
# -----------------------------------------------------------
if ($installed -and (Test-Path $DcBin)) {
    $DcBinDir = Join-Path $DcDir "bin"
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$DcBinDir*") {
        try {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$DcBinDir", "User")
            Write-Host "[OK] $DcBinDir agregado al PATH de usuario (reinicia la terminal)." -ForegroundColor Green
        } catch {
            Write-Host "[WARN] No se pudo modificar el PATH. Agregalo manualmente: $DcBinDir" -ForegroundColor Yellow
        }
    }
}

# -----------------------------------------------------------
# Resumen
# -----------------------------------------------------------
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host " RESUMEN DE INSTALACION — OWASP Dependency-Check"             -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

if ($installed) {
    Write-Host "[OK] Dependency-Check instalado. Verifica con: dependency-check --version" -ForegroundColor Green
} else {
    Write-Host "[WARN] No se pudo instalar Dependency-Check automaticamente." -ForegroundColor Yellow
    Write-Host "[INFO] Alternativas:" -ForegroundColor Cyan
    Write-Host "       - Es el mismo gate que Jenkins: en proyectos con el plugin Gradle basta '.\gradlew dependencyCheckAnalyze'."
    Write-Host "       - CLI: descarga dependency-check-$Version-release.zip de github.com/dependency-check/DependencyCheck/releases"
}
Write-Host ""
Write-Host "[INFO] IMPORTANTE: solicita una NVD API Key para acelerar la base NVD:" -ForegroundColor Cyan
Write-Host "       https://nvd.nist.gov/developers/request-an-api-key"
Write-Host "       Sin ella, la primera actualizacion puede tardar horas."
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
