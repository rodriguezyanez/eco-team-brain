#!/usr/bin/env bash
# =============================================================
# brain.sh — Comandos rapidos para Team Brain en Linux/macOS
#
# Uso:
#   ./brain.sh up       -> levantar Neo4j
#   ./brain.sh down     -> detener Neo4j
#   ./brain.sh restart  -> reiniciar Neo4j
#   ./brain.sh status   -> ver estado del contenedor
#   ./brain.sh logs     -> ver logs en vivo
#   ./brain.sh browser  -> abrir Neo4j Browser
#   ./brain.sh mcp      -> registrar MCPs (team-brain + Context7) en Claude Code
#   ./brain.sh update   -> sincronizacion incremental de Neo4j (preserva memoria)
#   ./brain.sh sync     -> sincronizar memorias pendientes locales con Neo4j
#
# Paridad con scripts/windows/brain.ps1.
# =============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../../docker-compose.yml"
DC="docker compose -f ${COMPOSE_FILE}"

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

ACTION="${1:-}"

if [[ -z "$ACTION" ]]; then
    echo ""
    echo -e "${CYAN}Team Brain -- Comandos disponibles:${NC}"
    echo ""
    echo "  brain.sh up       Levantar Neo4j"
    echo "  brain.sh down     Detener Neo4j (datos persisten)"
    echo "  brain.sh restart  Reiniciar Neo4j"
    echo "  brain.sh status   Ver estado del contenedor"
    echo "  brain.sh logs     Ver logs en vivo"
    echo "  brain.sh browser  Abrir Neo4j Browser"
    echo "  brain.sh mcp      Registrar MCPs (team-brain + Context7) en Claude Code"
    echo "  brain.sh update   Sincronizar arquitectura en Neo4j (preserva memoria)"
    echo "  brain.sh sync     Sincronizar memorias pendientes locales con Neo4j"
    echo ""
    exit 0
fi

case "$ACTION" in

    up)
        echo ""
        echo "Levantando Team Brain..."
        if $DC up -d; then
            echo -e "${GREEN}[OK] Neo4j corriendo.${NC}"
            echo "     Browser : http://localhost:7474"
            echo "     Bolt    : bolt://localhost:7687"
        else
            echo -e "${RED}[ERROR] Fallo al levantar. Verifica que Docker este corriendo.${NC}"
        fi
        ;;

    down)
        echo ""
        echo "Deteniendo Team Brain..."
        $DC down
        echo -e "${GREEN}[OK] Contenedor detenido. Los datos persisten en los volumenes.${NC}"
        ;;

    restart)
        echo ""
        echo "Reiniciando Neo4j..."
        $DC restart neo4j
        echo -e "${GREEN}[OK] Reiniciado.${NC}"
        ;;

    status)
        echo ""
        $DC ps
        ;;

    logs)
        echo ""
        echo "Logs en vivo (Ctrl+C para salir)..."
        echo ""
        $DC logs -f neo4j
        ;;

    browser)
        echo ""
        echo "Abriendo Neo4j Browser..."
        if command -v xdg-open &>/dev/null; then
            xdg-open "http://localhost:7474"
        elif command -v open &>/dev/null; then
            open "http://localhost:7474"
        else
            echo -e "${GRAY}Abre manualmente: http://localhost:7474${NC}"
        fi
        ;;

    mcp)
        # shellcheck source=/dev/null
        . "${SCRIPT_DIR}/brain-config.sh"
        load_brain_config

        echo ""
        echo -e "${CYAN}Registrando MCPs en Claude Code...${NC}"
        echo -e "${GRAY}  Neo4j : bolt://${BRAIN_HOST}:${BRAIN_BOLT_PORT}${NC}"
        echo ""

        local_mcp=$(jq -n \
            --arg uri "bolt://${BRAIN_HOST}:${BRAIN_BOLT_PORT}" \
            --arg user "$BRAIN_USER" \
            --arg pass "$BRAIN_PASSWORD" \
            --arg db "$BRAIN_DATABASE" \
            '{command:"npx", args:["-y","@knowall-ai/mcp-neo4j-agent-memory"], env:{NEO4J_URI:$uri, NEO4J_USERNAME:$user, NEO4J_PASSWORD:$pass, NEO4J_DATABASE:$db}}')

        # 'add-json' no es idempotente: falla si el server ya existe.
        # Se elimina primero (ignorando el error) y luego se agrega.
        echo "Registrando team-brain..."
        claude mcp remove "team-brain" --scope user &>/dev/null || true
        claude mcp add-json "team-brain" "$local_mcp" --scope user
        ok_team_brain=$?

        echo ""
        echo "Registrando Context7 (documentacion en tiempo real)..."
        claude mcp remove "context7" --scope user &>/dev/null || true
        claude mcp add-json "context7" '{"command":"npx","args":["-y","@upstash/context7-mcp"]}' --scope user
        ok_context7=$?

        if [[ $ok_team_brain -eq 0 && $ok_context7 -eq 0 ]]; then
            echo ""
            echo -e "${GREEN}[OK] MCPs registrados. Verificando...${NC}"
            claude mcp list
        else
            echo ""
            echo -e "${RED}[ERROR] Fallo el registro de algun MCP.${NC}"
            echo "        Asegurate de tener Claude Code instalado:"
            echo "        npm install -g @anthropic-ai/claude-code"
        fi
        ;;

    update)
        echo ""
        echo -e "${CYAN}Sincronizando arquitectura de referencia en Neo4j...${NC}"
        echo -e "${GRAY}(Preserva decisiones, bugs, patterns y memoria del equipo)${NC}"
        echo ""
        if [[ -f "${SCRIPT_DIR}/brain-update.sh" ]]; then
            bash "${SCRIPT_DIR}/brain-update.sh"
        else
            echo -e "${RED}[ERROR] brain-update.sh no encontrado en linux/.${NC}"
        fi
        ;;

    sync)
        echo ""
        echo -e "${CYAN}Sincronizando memorias pendientes locales con Neo4j...${NC}"
        echo ""
        if [[ -f "${SCRIPT_DIR}/brain-sync.sh" ]]; then
            bash "${SCRIPT_DIR}/brain-sync.sh"
        else
            echo -e "${RED}[ERROR] brain-sync.sh no encontrado en linux/.${NC}"
        fi
        ;;

    *)
        echo -e "${RED}[ERROR] Accion desconocida: $ACTION${NC}"
        exit 1
        ;;
esac

echo ""
