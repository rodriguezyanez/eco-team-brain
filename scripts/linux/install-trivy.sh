#!/usr/bin/env bash
# =============================================================
# install-trivy.sh — Instala Trivy (scanner de seguridad) para /auditoria
# Uso: chmod +x install-trivy.sh && ./install-trivy.sh
# =============================================================
set -euo pipefail

# --- Colores ANSI ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}[OK]${NC}   $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*"; }
info() { echo -e "${CYAN}[INFO]${NC}  $*"; }

echo ""
info "Team Brain — Instalador de Trivy"
echo ""

# -----------------------------------------------------------
# Idempotencia: si ya esta instalado, no hacer nada
# -----------------------------------------------------------
if command -v trivy >/dev/null 2>&1; then
    ok "Trivy ya esta instalado ($(trivy --version 2>/dev/null | head -n1))."
    info "Para actualizarlo: brew upgrade trivy  /  apt-get update && apt-get upgrade trivy"
    echo ""
    exit 0
fi

INSTALLED=false

# -----------------------------------------------------------
# Estrategia 1: Homebrew (mac / linuxbrew)
# -----------------------------------------------------------
if command -v brew >/dev/null 2>&1; then
    info "Instalando Trivy con Homebrew..."
    if brew install trivy; then INSTALLED=true; fi
fi

# -----------------------------------------------------------
# Estrategia 2: script oficial de Aqua Security
# -----------------------------------------------------------
if [[ "${INSTALLED}" == false ]] && command -v curl >/dev/null 2>&1; then
    info "Instalando Trivy con el script oficial de Aqua Security..."
    # Destino: /usr/local/bin si hay permisos, si no ~/.local/bin
    if [[ -w /usr/local/bin ]] || [[ "$(id -u)" -eq 0 ]]; then
        DEST="/usr/local/bin"
    else
        DEST="${HOME}/.local/bin"
        mkdir -p "${DEST}"
    fi
    if curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b "${DEST}"; then
        INSTALLED=true
        case ":${PATH}:" in
            *":${DEST}:"*) : ;;
            *) warn "Agrega ${DEST} a tu PATH:  export PATH=\"${DEST}:\$PATH\"" ;;
        esac
    fi
fi

# -----------------------------------------------------------
# Resumen
# -----------------------------------------------------------
echo ""
echo -e "${CYAN}=============================================================${NC}"
echo -e "${CYAN} RESUMEN DE INSTALACION — Trivy${NC}"
echo -e "${CYAN}=============================================================${NC}"

if [[ "${INSTALLED}" == true ]]; then
    ok "Trivy instalado. Verifica con: trivy --version"
else
    warn "No se pudo instalar Trivy automaticamente (no se encontro brew ni curl)."
    info "Instalalo manualmente con una de estas opciones:"
    echo "       brew install trivy"
    echo "       sudo apt-get install trivy   (requiere el repo de Aqua Security)"
    echo "       curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin"
fi
echo ""
info "/auditoria usara Trivy para: trivy fs . / trivy image <img> / trivy config ."
echo -e "${CYAN}=============================================================${NC}"
echo ""
