#!/usr/bin/env bash
# =============================================================
# brain-config.sh — Configuracion de conexion Neo4j (Team Brain)
#
# Sourceable (solo define funciones). Paridad con brain-config.ps1.
# Consumidores: brain.sh, brain-sync.sh, config-neo4j.sh
#
# Persiste en: ${HOME}/.claude/brain-config.json
# (mismas claves que el lado Windows: host, httpPort, boltPort,
#  user, password, database). Defaults desde docker-compose.yml.
#
# Requiere: jq
# =============================================================

brain_config_path() {
    echo "${HOME}/.claude/brain-config.json"
}

# Lee el JSON (si existe) y exporta las variables BRAIN_*.
# Cualquier clave ausente o invalida cae al default.
load_brain_config() {
    local def_host="localhost"
    local def_http="7474"
    local def_bolt="7687"
    local def_user="neo4j"
    local def_pass="team-brain-2025"
    local def_db="neo4j"

    local path
    path="$(brain_config_path)"

    if [[ -f "$path" ]] && command -v jq &>/dev/null; then
        BRAIN_HOST=$(jq -r --arg d "$def_host" '.host       // $d' "$path" 2>/dev/null || echo "$def_host")
        BRAIN_HTTP_PORT=$(jq -r --arg d "$def_http" '.httpPort // $d' "$path" 2>/dev/null || echo "$def_http")
        BRAIN_BOLT_PORT=$(jq -r --arg d "$def_bolt" '.boltPort // $d' "$path" 2>/dev/null || echo "$def_bolt")
        BRAIN_USER=$(jq -r --arg d "$def_user" '.user         // $d' "$path" 2>/dev/null || echo "$def_user")
        BRAIN_PASSWORD=$(jq -r --arg d "$def_pass" '.password  // $d' "$path" 2>/dev/null || echo "$def_pass")
        BRAIN_DATABASE=$(jq -r --arg d "$def_db" '.database    // $d' "$path" 2>/dev/null || echo "$def_db")
    else
        BRAIN_HOST="$def_host"
        BRAIN_HTTP_PORT="$def_http"
        BRAIN_BOLT_PORT="$def_bolt"
        BRAIN_USER="$def_user"
        BRAIN_PASSWORD="$def_pass"
        BRAIN_DATABASE="$def_db"
    fi

    export BRAIN_HOST BRAIN_HTTP_PORT BRAIN_BOLT_PORT BRAIN_USER BRAIN_PASSWORD BRAIN_DATABASE
}
