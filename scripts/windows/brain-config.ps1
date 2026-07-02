# =============================================================
# brain-config.ps1 — Configuracion de conexion Neo4j (Team Brain)
#
# Solo define funciones (idempotente al hacer dot-source).
# Consumidores: brain.ps1, brain-sync.ps1, config-neo4j.ps1
#
# La config se persiste en: %USERPROFILE%\.claude\brain-config.json
# Si el archivo no existe, se devuelven los valores por defecto
# (alineados con docker-compose.yml: NEO4J_AUTH neo4j/team-brain-2025).
# =============================================================

$script:BrainConfigDefaults = @{
    host     = "localhost"
    httpPort = 7474
    boltPort = 7687
    user     = "neo4j"
    password = "team-brain-2025"
    database = "neo4j"
}

function Get-BrainConfigPath {
    $dir = Join-Path $env:USERPROFILE ".claude"
    return (Join-Path $dir "brain-config.json")
}

function Get-BrainConfig {
    $cfg = @{}
    foreach ($k in $script:BrainConfigDefaults.Keys) { $cfg[$k] = $script:BrainConfigDefaults[$k] }

    $path = Get-BrainConfigPath
    if (Test-Path $path) {
        try {
            $saved = Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($k in @($cfg.Keys)) {
                $val = $saved.$k
                if ($null -ne $val -and "$val" -ne "") { $cfg[$k] = $val }
            }
        } catch {
            Write-Warning "brain-config.json invalido, usando defaults: $($_.Exception.Message)"
        }
    }
    return [PSCustomObject]$cfg
}

function Set-BrainConfig {
    param(
        [string]$NeoHost,
        [string]$User,
        [string]$Password,
        [int]$BoltPort,
        [int]$HttpPort,
        [string]$Database
    )

    $current = Get-BrainConfig
    $cfg = @{
        host     = $current.host
        httpPort = $current.httpPort
        boltPort = $current.boltPort
        user     = $current.user
        password = $current.password
        database = $current.database
    }

    if ($PSBoundParameters.ContainsKey('NeoHost'))  { $cfg.host     = $NeoHost }
    if ($PSBoundParameters.ContainsKey('User'))     { $cfg.user     = $User }
    if ($PSBoundParameters.ContainsKey('Password')) { $cfg.password = $Password }
    if ($PSBoundParameters.ContainsKey('BoltPort')) { $cfg.boltPort = $BoltPort }
    if ($PSBoundParameters.ContainsKey('HttpPort')) { $cfg.httpPort = $HttpPort }
    if ($PSBoundParameters.ContainsKey('Database')) { $cfg.database = $Database }

    $path = Get-BrainConfigPath
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    ($cfg | ConvertTo-Json -Depth 5) | Set-Content -Path $path -Encoding UTF8

    return [PSCustomObject]$cfg
}

function Reset-BrainConfig {
    $path = Get-BrainConfigPath
    if (Test-Path $path) { Remove-Item $path -Force }
    return Get-BrainConfig
}
