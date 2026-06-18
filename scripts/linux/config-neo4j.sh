#!/usr/bin/env bash
# =============================================================
# config-neo4j.sh — klap config <show|set|reset>
#
# Uso:
#   klap config show
#   klap config set -Host 10.0.0.50 -Password nueva-pass
#   klap config reset
#
# Persiste en ${HOME}/.claude/brain-config.json (mismas claves
# que el lado Windows). Paridad con config-neo4j.ps1.
#
# Requiere: jq
# =============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "${SCRIPT_DIR}/brain-config.sh"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

if ! command -v jq &>/dev/null; then
    echo -e "${RED}[ERROR] 'jq' no encontrado. Instalalo primero (apt install jq / brew install jq).${NC}"
    exit 1
fi

show_config() {
    load_brain_config
    local masked
    if [[ -n "$BRAIN_PASSWORD" ]]; then masked="********"; else masked="(vacia)"; fi
    echo ""
    echo -e "${CYAN}Configuracion Neo4j (Team Brain)${NC}"
    echo -e "${GRAY}  Archivo  : $(brain_config_path)${NC}"
    echo ""
    echo "  Host     : ${BRAIN_HOST}"
    echo "  Bolt     : bolt://${BRAIN_HOST}:${BRAIN_BOLT_PORT}"
    echo "  HTTP     : http://${BRAIN_HOST}:${BRAIN_HTTP_PORT}"
    echo "  Usuario  : ${BRAIN_USER}"
    echo "  Password : ${masked}"
    echo "  Database : ${BRAIN_DATABASE}"
    echo ""
}

set_config() {
    # Punto de partida: config actual (o defaults).
    load_brain_config
    local new_host="$BRAIN_HOST"
    local new_http="$BRAIN_HTTP_PORT"
    local new_bolt="$BRAIN_BOLT_PORT"
    local new_user="$BRAIN_USER"
    local new_pass="$BRAIN_PASSWORD"
    local new_db="$BRAIN_DATABASE"
    local changed=0

    # Acepta flags estilo Windows (-Host -User ...) tal como los pasa klap.js.
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -Host)     new_host="$2"; changed=1; shift 2 ;;
            -User)     new_user="$2"; changed=1; shift 2 ;;
            -Password) new_pass="$2"; changed=1; shift 2 ;;
            -BoltPort) new_bolt="$2"; changed=1; shift 2 ;;
            -HttpPort) new_http="$2"; changed=1; shift 2 ;;
            -Database) new_db="$2";   changed=1; shift 2 ;;
            *) echo -e "${YELLOW}[WARN] Parametro ignorado: $1${NC}"; shift ;;
        esac
    done

    if [[ "$changed" -eq 0 ]]; then
        echo ""
        echo -e "${RED}[ERROR] 'set' requiere al menos un parametro.${NC}"
        echo -e "${YELLOW}        Disponibles: -Host -User -Password -BoltPort -HttpPort -Database${NC}"
        echo ""
        exit 1
    fi

    local path dir
    path="$(brain_config_path)"
    dir="$(dirname "$path")"
    mkdir -p "$dir"

    jq -n \
        --arg host "$new_host" \
        --argjson httpPort "$new_http" \
        --argjson boltPort "$new_bolt" \
        --arg user "$new_user" \
        --arg password "$new_pass" \
        --arg database "$new_db" \
        '{host:$host, httpPort:$httpPort, boltPort:$boltPort, user:$user, password:$password, database:$database}' \
        > "$path"

    echo ""
    echo -e "${GREEN}[OK] Configuracion actualizada.${NC}"
    show_config
}

reset_config() {
    local path
    path="$(brain_config_path)"
    [[ -f "$path" ]] && rm -f "$path"
    echo ""
    echo -e "${GREEN}[OK] Configuracion restaurada a valores por defecto.${NC}"
    show_config
}

ACTION="${1:-show}"
shift || true

case "$ACTION" in
    show)  show_config ;;
    set)   set_config "$@" ;;
    reset) reset_config ;;
    *)
        echo -e "${RED}[ERROR] Subcomando desconocido: $ACTION${NC}"
        echo -e "${YELLOW}        Uso: klap config <show|set|reset>${NC}"
        exit 1
        ;;
esac
