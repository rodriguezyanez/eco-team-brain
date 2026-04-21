#!/usr/bin/env bash
# =============================================================
# rollback.sh — Revierte la instalación del Ecosistema Klap
# =============================================================

# -- Colores ---------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${NC}   $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "  ${CYAN}[INFO]${NC} $1"; }

echo
echo -e "${RED}=====================================================${NC}"
echo -e "${RED}  Ecosistema Klap -- Rollback / Desinstalación${NC}"
echo -e "${RED}=====================================================${NC}"
echo
echo "  Este proceso eliminará:"
echo "    - Contenedor Neo4j y sus datos (docker compose down -v)"
echo "    - MCPs: team-brain, context7, sequential-thinking"
echo "    - Plugins de Claude Code"
echo "    - Skills locales de ~/.claude/skills/"
echo "    - CLAUDE.md de ~/.claude/"
echo
echo "  Los programas instalados (Docker, Node.js, Claude Code)"
echo "  NO serán desinstalados."
echo
read -rp "   Confirmar desinstalación? [s/N]: " CONFIRM
if [[ ! "${CONFIRM}" =~ ^[sS]$ ]]; then
    echo
    echo "  Desinstalación cancelada."
    echo
    exit 0
fi
echo

# -- 1. Detener y eliminar Neo4j + datos --------------------
info "Deteniendo Neo4j y eliminando datos ─────────────────"
DOCKER_FILE="$(dirname "$0")/../../docker-compose.yml"
if [ -f "$DOCKER_FILE" ]; then
    docker compose -f "$DOCKER_FILE" down -v
    ok "Contenedor Neo4j detenido y datos eliminados."
else
    warn "No se encontró docker-compose.yml en $DOCKER_FILE. Intenta apagarlo manualmente."
fi

BACKUP_DIR="$HOME/.claude/team-brain-backup"
SKILL_FILES=(kafka-config.md kafka-listener.md processor.md repository.md webclient.md exceptions.md testing.md openapi.md skill-registry.md sdd-microservice.md sdd-checklist.md crear-microfrontend.md)

if [ -d "$BACKUP_DIR" ]; then
    # ── Restauracion completa desde backup ──────────────────
    info "Restaurando desde backup ──────────────────────────────"

    # .claude.json
    if [ -f "$BACKUP_DIR/claude.json" ]; then
        cp "$BACKUP_DIR/claude.json" "$HOME/.claude.json"
        ok ".claude.json restaurado."
    fi

    # settings.json
    if [ -f "$BACKUP_DIR/settings.json" ]; then
        cp "$BACKUP_DIR/settings.json" "$HOME/.claude/settings.json"
        ok "settings.json restaurado."
    fi

    # CLAUDE.md
    if [ -f "$BACKUP_DIR/CLAUDE.md" ]; then
        cp "$BACKUP_DIR/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
        ok "CLAUDE.md restaurado."
    fi

    # Skills
    SKILLS_DIR="$HOME/.claude/skills"
    for f in "${SKILL_FILES[@]}"; do rm -f "$SKILLS_DIR/$f"; done
    if [ -d "$BACKUP_DIR/skills" ]; then
        mkdir -p "$SKILLS_DIR"
        for f in "$BACKUP_DIR/skills"/*.md; do
            [ -f "$f" ] && cp "$f" "$SKILLS_DIR/$(basename "$f")" && ok "Restaurado skill: $(basename "$f")"
        done
    fi

else
    # ── Sin backup: eliminar solo entradas de Team Brain ────
    warn "No se encontró backup previo. Eliminando manualmente ──"

    # Eliminar MCPs vía Node
    CLAUDE_JSON="$HOME/.claude.json"
    if [ -f "$CLAUDE_JSON" ]; then
        node -e "
const fs = require('fs');
const path = '$CLAUDE_JSON';
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e) {}
const mcps = ['team-brain', 'context7', 'sequential-thinking'];
if (cfg.mcpServers) {
    mcps.forEach(m => { if (cfg.mcpServers[m]) { delete cfg.mcpServers[m]; console.log('  [OK] MCP ' + m + ' eliminado.'); } });
}
fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
" 2>/dev/null
    fi

    # Eliminar Plugins vía Node
    SETTINGS_FILE="$HOME/.claude/settings.json"
    if [ -f "$SETTINGS_FILE" ]; then
        node -e "
const fs = require('fs');
const path = '$SETTINGS_FILE';
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e) {}
const plugins = ['superpowers@claude-plugins-official','context-mode@context-mode','context7@claude-plugins-official','code-simplifier@claude-plugins-official','code-review@claude-plugins-official','pr-review-toolkit@claude-plugins-official','commit-commands@claude-plugins-official','feature-dev@claude-plugins-official','claude-md-management@claude-plugins-official'];
if (cfg.enabledPlugins) {
    plugins.forEach(p => { if (p in cfg.enabledPlugins) { delete cfg.enabledPlugins[p]; console.log('  [OK] Plugin ' + p + ' eliminado.'); } });
}
if (cfg.extraKnownMarketplaces && cfg.extraKnownMarketplaces['context-mode']) { delete cfg.extraKnownMarketplaces['context-mode']; }
fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
" 2>/dev/null
    fi

    # Eliminar skills y CLAUDE.md
    SKILLS_DIR="$HOME/.claude/skills"
    for f in "${SKILL_FILES[@]}"; do
        [ -f "$SKILLS_DIR/$f" ] && rm -f "$SKILLS_DIR/$f" && ok "Eliminado: $f"
    done
    [ -f "$HOME/.claude/CLAUDE.md" ] && rm -f "$HOME/.claude/CLAUDE.md" && ok "CLAUDE.md eliminado."
fi

echo
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}  Ecosistema Klap desinstalado correctamente.${NC}"
echo -e "${GREEN}  Backup preservado en: $BACKUP_DIR${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo
echo "  Recuerda desinstalar el paquete global si lo deseas:"
echo "  npm uninstall -g ecosistema-klap"
echo
