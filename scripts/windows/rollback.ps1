# =============================================================
# rollback.ps1 — Revierte la instalación del Ecosistema Klap
# =============================================================

$BackupDir = Join-Path $env:USERPROFILE ".claude\team-brain-backup"
$SkillFiles = @("kafka-config.md", "kafka-listener.md", "processor.md", "repository.md", "webclient.md", "exceptions.md", "testing.md", "openapi.md", "skill-registry.md", "sdd-microservice.md", "sdd-checklist.md", "crear-microfrontend.md")

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Red
Write-Host "  Ecosistema Klap -- Rollback / Desinstalación" -ForegroundColor Red
Write-Host "=====================================================" -ForegroundColor Red
Write-Host ""
Write-Host "  Este proceso eliminará:" -ForegroundColor White
Write-Host "    - Contenedor Neo4j y sus datos (docker compose down -v)"
Write-Host "    - MCPs: team-brain, context7, sequential-thinking"
Write-Host "    - Plugins de Claude Code"
Write-Host "    - Skills locales de %USERPROFILE%\.claude\skills\"
Write-Host "    - CLAUDE.md de %USERPROFILE%\.claude\"
Write-Host ""
Write-Host "  Los programas instalados (Docker, Node.js, Claude Code)"
Write-Host "  NO serán desinstalados."
Write-Host ""

$confirm = Read-Host "   Confirmar desinstalación? [s/N]"
if ($confirm -notmatch "^[sS]$") {
    Write-Host ""
    Write-Host "  Desinstalación cancelada." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "-- Deteniendo Neo4j y eliminando datos ---------------------" -ForegroundColor Cyan
# Asumimos que docker-compose.yml está en la raíz de ecosistema-klap o un nivel arriba
$DockerPath = Join-Path $PSScriptRoot "..\..\docker-compose.yml"
if (Test-Path $DockerPath) {
    docker compose -f $DockerPath down -v
    Write-Host "  [OK] Contenedor Neo4j detenido y datos eliminados." -ForegroundColor Green
} else {
    Write-Host "  [WARN] No se encontró docker-compose.yml en $DockerPath. Intenta apagarlo manualmente." -ForegroundColor Yellow
}

if (Test-Path $BackupDir) {
    Write-Host ""
    Write-Host "-- Restaurando desde backup --------------------------------" -ForegroundColor Cyan

    # .claude.json
    if (Test-Path (Join-Path $BackupDir "claude.json")) {
        Copy-Item (Join-Path $BackupDir "claude.json") (Join-Path $env:USERPROFILE ".claude.json") -Force
        Write-Host "  [OK] .claude.json restaurado." -ForegroundColor Green
    }

    # settings.json
    if (Test-Path (Join-Path $BackupDir "settings.json")) {
        Copy-Item (Join-Path $BackupDir "settings.json") (Join-Path $env:USERPROFILE ".claude\settings.json") -Force
        Write-Host "  [OK] settings.json restaurado." -ForegroundColor Green
    }

    # CLAUDE.md
    if (Test-Path (Join-Path $BackupDir "CLAUDE.md")) {
        Copy-Item (Join-Path $BackupDir "CLAUDE.md") (Join-Path $env:USERPROFILE ".claude\CLAUDE.md") -Force
        Write-Host "  [OK] CLAUDE.md restaurado." -ForegroundColor Green
    }

    # Skills
    $SkillsDest = Join-Path $env:USERPROFILE ".claude\skills"
    foreach ($f in $SkillFiles) {
        if (Test-Path (Join-Path $SkillsDest $f)) { Remove-Item (Join-Path $SkillsDest $f) -Force }
    }
    if (Test-Path (Join-Path $BackupDir "skills")) {
        Get-ChildItem (Join-Path $BackupDir "skills\*.md") | ForEach-Object {
            Copy-Item $_.FullName (Join-Path $SkillsDest $_.Name) -Force
            Write-Host "  [OK] Restaurado skill: $($_.Name)" -ForegroundColor Green
        }
    }
} else {
    Write-Host ""
    Write-Host "-- Sin backup: eliminando entradas manualmente -------------" -ForegroundColor Yellow

    # Eliminar MCPs vía PowerShell (limpio)
    $cf = Join-Path $env:USERPROFILE ".claude.json"
    if (Test-Path $cf) {
        $cfg = Get-Content $cf -Raw | ConvertFrom-Json -AsHashtable
        if ($cfg.ContainsKey('mcpServers')) {
            @('team-brain', 'context7', 'sequential-thinking') | ForEach-Object {
                if ($cfg['mcpServers'].ContainsKey($_)) {
                    $cfg['mcpServers'].Remove($_)
                    Write-Host "  [OK] MCP '$_' eliminado." -ForegroundColor Green
                }
            }
            $cfg | ConvertTo-Json -Depth 10 | Set-Content $cf -Encoding UTF8
        }
    }

    # Eliminar Plugins vía PowerShell
    $s = Join-Path $env:USERPROFILE ".claude\settings.json"
    if (Test-Path $s) {
        $cfg = Get-Content $s -Raw | ConvertFrom-Json -AsHashtable
        $plugins = @('superpowers@claude-plugins-official','context-mode@context-mode','context7@claude-plugins-official','code-simplifier@claude-plugins-official','code-review@claude-plugins-official','pr-review-toolkit@claude-plugins-official','commit-commands@claude-plugins-official','feature-dev@claude-plugins-official','claude-md-management@claude-plugins-official')
        if ($cfg.ContainsKey('enabledPlugins')) {
            $plugins | ForEach-Object {
                if ($cfg['enabledPlugins'].ContainsKey($_)) {
                    $cfg['enabledPlugins'].Remove($_)
                    Write-Host "  [OK] Plugin '$_' eliminado." -ForegroundColor Green
                }
            }
        }
        if ($cfg.ContainsKey('extraKnownMarketplaces') -and $cfg['extraKnownMarketplaces'].ContainsKey('context-mode')) {
            $cfg['extraKnownMarketplaces'].Remove('context-mode')
            Write-Host "  [OK] Marketplace context-mode eliminado." -ForegroundColor Green
        }
        $cfg | ConvertTo-Json -Depth 10 | Set-Content $s -Encoding UTF8
    }

    # Eliminar skills y CLAUDE.md
    $SkillsDest = Join-Path $env:USERPROFILE ".claude\skills"
    foreach ($f in $SkillFiles) {
        if (Test-Path (Join-Path $SkillsDest $f)) {
            Remove-Item (Join-Path $SkillsDest $f) -Force
            Write-Host "  [OK] Eliminado: $f" -ForegroundColor Green
        }
    }
    $claudeMd = Join-Path $env:USERPROFILE ".claude\CLAUDE.md"
    if (Test-Path $claudeMd) {
        Remove-Item $claudeMd -Force
        Write-Host "  [OK] CLAUDE.md eliminado." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Ecosistema Klap desinstalado correctamente." -ForegroundColor Green
Write-Host "  Backup preservado en: $BackupDir" -ForegroundColor Gray
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Recuerda desinstalar el paquete global si lo deseas:"
Write-Host "  npm uninstall -g ecosistema-klap"
Write-Host ""
