# =============================================================
# config-neo4j.ps1 — klap config <show|set|reset>
#
# Uso:
#   klap config show
#   klap config set -Host 10.0.0.50 -Password nueva-pass
#   klap config reset
#
# Persiste en %USERPROFILE%\.claude\brain-config.json mediante
# las funciones de brain-config.ps1.
# =============================================================

param(
    [Parameter(Position=0)]
    [ValidateSet("show","set","reset")]
    [string]$Action = "show",

    [Alias("Host")]
    [string]$NeoHost,
    [string]$User,
    [string]$Password,
    [int]$BoltPort,
    [int]$HttpPort,
    [string]$Database
)

. "$PSScriptRoot\brain-config.ps1"

function Show-BrainConfig {
    param($Cfg)

    if ($Cfg.password) {
        $masked = '*' * [Math]::Min(8, "$($Cfg.password)".Length)
    } else {
        $masked = "(vacia)"
    }

    Write-Host ""
    Write-Host "Configuracion Neo4j (Team Brain)" -ForegroundColor Cyan
    Write-Host "  Archivo  : $(Get-BrainConfigPath)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Host     : $($Cfg.host)"
    Write-Host "  Bolt     : bolt://$($Cfg.host):$($Cfg.boltPort)"
    Write-Host "  HTTP     : http://$($Cfg.host):$($Cfg.httpPort)"
    Write-Host "  Usuario  : $($Cfg.user)"
    Write-Host "  Password : $masked"
    Write-Host "  Database : $($Cfg.database)"
    Write-Host ""
}

switch ($Action) {

    "show" {
        Show-BrainConfig -Cfg (Get-BrainConfig)
    }

    "set" {
        $params = @{}
        if ($PSBoundParameters.ContainsKey('NeoHost'))  { $params.NeoHost  = $NeoHost }
        if ($PSBoundParameters.ContainsKey('User'))     { $params.User     = $User }
        if ($PSBoundParameters.ContainsKey('Password')) { $params.Password = $Password }
        if ($PSBoundParameters.ContainsKey('BoltPort')) { $params.BoltPort = $BoltPort }
        if ($PSBoundParameters.ContainsKey('HttpPort')) { $params.HttpPort = $HttpPort }
        if ($PSBoundParameters.ContainsKey('Database')) { $params.Database = $Database }

        if ($params.Count -eq 0) {
            Write-Host ""
            Write-Host "[ERROR] 'set' requiere al menos un parametro." -ForegroundColor Red
            Write-Host "        Disponibles: -Host -User -Password -BoltPort -HttpPort -Database" -ForegroundColor Yellow
            Write-Host ""
            exit 1
        }

        $updated = Set-BrainConfig @params
        Write-Host ""
        Write-Host "[OK] Configuracion actualizada." -ForegroundColor Green
        Show-BrainConfig -Cfg $updated
    }

    "reset" {
        $cfg = Reset-BrainConfig
        Write-Host ""
        Write-Host "[OK] Configuracion restaurada a valores por defecto." -ForegroundColor Green
        Show-BrainConfig -Cfg $cfg
    }
}
