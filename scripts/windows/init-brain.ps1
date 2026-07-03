# =============================================================
# init-brain.ps1 — Levanta el contenedor e inicializa Team Brain
# Idempotente: se puede ejecutar varias veces sin romper nada
# Uso: .\init-brain.ps1
#      .\init-brain.ps1 -Host 192.168.1.50 -Password "mi-password"
# =============================================================

param(
    [string]$Neo4jHost = "localhost",
    [string]$Neo4jPort = "7474",
    [string]$User      = "neo4j",
    [string]$Password  = "team-brain-2025"
)

$BaseUrl = "http://${Neo4jHost}:${Neo4jPort}"
$Creds   = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${User}:${Password}"))
$Headers = @{ "Content-Type" = "application/json"; "Authorization" = "Basic $Creds" }
$ComposeFile = Join-Path $PSScriptRoot "..\..\docker-compose.yml"

function Write-Step($msg) { Write-Host "  -> $msg" -NoNewline }
function Write-Ok        { Write-Host " [OK]"  -ForegroundColor Green }
function Write-Warn($c)  { Write-Host " [WARN] HTTP $c" -ForegroundColor Yellow }

function Invoke-Cypher($db, $query, $desc) {
    Write-Step $desc
    $body = '{"statements":[{"statement":"' + $query + '"}]}'
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl/db/$db/tx/commit" `
            -Method POST -Headers $Headers -Body $body `
            -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -in 200,201) { Write-Ok } else { Write-Warn $r.StatusCode }
    } catch { Write-Warn $_.Exception.Response.StatusCode.value__ }
}

# ── Banner ────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Team Brain -- Inicializacion de base de datos"      -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Host: $BaseUrl"
Write-Host ""

# ── Levantar contenedor Neo4j ────────────────────────────────
Write-Host "Levantando contenedor Neo4j..."
docker compose -f $ComposeFile up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Contenedor Neo4j corriendo." -ForegroundColor Green
} else {
    Write-Host "[ERROR] No se pudo levantar el contenedor. Verifica que Docker Desktop este abierto." -ForegroundColor Red
    exit 1
}
Write-Host ""

# ── Esperar Neo4j ─────────────────────────────────────────────
Write-Host "Esperando que Neo4j este disponible..."
$ready = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl/db/neo4j/tx/commit" `
            -Method POST -Headers $Headers `
            -Body '{"statements":[{"statement":"RETURN 1"}]}' `
            -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -in 200,201) { $ready = $true; break }
    } catch {}
    Write-Host "  Intento $i/30..."
    Start-Sleep -Seconds 3
}
if (-not $ready) { Write-Host "[ERROR] Neo4j no respondio." -ForegroundColor Red; exit 1 }
Write-Host "  Neo4j listo." -ForegroundColor Green
Write-Host ""

# ── Detectar edicion (Community vs Enterprise) ────────────────
Write-Host "Verificando edicion de Neo4j..."
$useDb = "neo4j"   # default para Community

try {
    $edBody = '{"statements":[{"statement":"CALL dbms.components() YIELD edition RETURN edition"}]}'
    $edResp = Invoke-WebRequest -Uri "$BaseUrl/db/system/tx/commit" `
        -Method POST -Headers $Headers -Body $edBody `
        -UseBasicParsing -ErrorAction Stop
    if ($edResp.Content -match "enterprise") {
        $useDb = "memory"
        Write-Host "  Edicion Enterprise detectada. Creando base de datos 'memory'..."
        Invoke-Cypher "system" "CREATE DATABASE memory IF NOT EXISTS" "Crear DB memory"
        Write-Host "  Esperando que la DB memory quede online..."
        Start-Sleep -Seconds 8
    } else {
        Write-Host "  Edicion Community detectada." -ForegroundColor Yellow
        Write-Host "  Community no soporta multiples bases de datos." -ForegroundColor Yellow
        Write-Host "  Usando la base de datos por defecto: 'neo4j'" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  No se pudo detectar edicion. Usando 'neo4j'." -ForegroundColor Yellow
}
Write-Host ""

# ── Constraints e indices ─────────────────────────────────────
Write-Host "Creando constraints e indices en DB: $useDb..."
Invoke-Cypher $useDb "CREATE CONSTRAINT entity_name IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE"        "Constraint Entity.name unico"
Invoke-Cypher $useDb "CREATE INDEX entity_type_idx IF NOT EXISTS FOR (e:Entity) ON (e.entityType)"               "Indice Entity.entityType"
Invoke-Cypher $useDb "CREATE INDEX observation_idx IF NOT EXISTS FOR (o:Observation) ON (o.content)"             "Indice Observation.content"
Invoke-Cypher $useDb "CREATE INDEX entity_created_idx IF NOT EXISTS FOR (e:Entity) ON (e.createdAt)"             "Indice Entity.createdAt"

# ── Nodos base ────────────────────────────────────────────────
Write-Host ""
Write-Host "Creando nodos base del equipo..."
Invoke-Cypher $useDb "MERGE (t:Entity {name: 'Team', entityType: 'Organization'}) SET t.createdAt = datetime(), t.description = 'Equipo de desarrollo'" "Nodo Team"
Invoke-Cypher $useDb "MERGE (p:Entity {name: 'Architecture', entityType: 'Topic'}) SET p.createdAt = datetime()" "Nodo Architecture"
Invoke-Cypher $useDb "MERGE (d:Entity {name: 'Decisions', entityType: 'Topic'}) SET d.createdAt = datetime()"    "Nodo Decisions"
Invoke-Cypher $useDb "MERGE (c:Entity {name: 'Conventions', entityType: 'Topic'}) SET c.createdAt = datetime()"  "Nodo Conventions"

# ── Resultado ─────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Team Brain inicializado correctamente"               -ForegroundColor Green
Write-Host ""
Write-Host "  Neo4j Browser : $BaseUrl"
Write-Host "  Usuario       : $User"
Write-Host "  Base de datos : $useDb"
Write-Host "  Bolt URI      : bolt://${Neo4jHost}:7687"
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
# ── Instalar commands y workflows en ~/.claude ───────────────
Write-Host "Instalando commands y workflows en Claude Code..."
$installScript = Join-Path $PSScriptRoot "install-commands.ps1"
if (Test-Path $installScript) {
    & $installScript
} else {
    Write-Host "[WARN] install-commands.ps1 no encontrado, omitiendo." -ForegroundColor Yellow
}

# ── Instalar skills en ~/.claude/skills ──────────────────────
Write-Host "Instalando skills en Claude Code..."
$skillsScript = Join-Path $PSScriptRoot "install-skills.ps1"
if (Test-Path $skillsScript) {
    & $skillsScript
} else {
    Write-Host "[WARN] install-skills.ps1 no encontrado, omitiendo." -ForegroundColor Yellow
}

# ── Registrar MCPs (team-brain + Context7) ───────────────────
Write-Host "Registrando MCPs en Claude Code..."
$mcpScript = Join-Path $PSScriptRoot "brain.ps1"
if (Test-Path $mcpScript) {
    & $mcpScript -Action mcp
} else {
    Write-Host "[WARN] brain.ps1 no encontrado, omitiendo registro de MCPs." -ForegroundColor Yellow
    Write-Host "Registra manualmente con: klap mcp"
}
Write-Host ""