#!/usr/bin/env bash
# =============================================================
# install-depcheck.sh — Instala OWASP Dependency-Check CLI para /auditoria
# Alinea con el plugin Gradle del equipo: org.owasp.dependencycheck:12.2.0
# Uso: chmod +x install-depcheck.sh && ./install-depcheck.sh
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

VERSION="${DEPCHECK_VERSION:-12.2.0}"
TOOLS_DIR="${HOME}/.klap/tools"
DC_DIR="${TOOLS_DIR}/dependency-check"
DC_BIN="${DC_DIR}/bin/dependency-check.sh"

echo ""
info "Team Brain — Instalador de OWASP Dependency-Check CLI (v${VERSION})"
echo ""

# -----------------------------------------------------------
# Prerequisito: Java
# -----------------------------------------------------------
if ! command -v java >/dev/null 2>&1; then
    warn "No se encontro 'java' en el PATH. Dependency-Check requiere Java (JRE/JDK) 11+."
    warn "Instala Java y configura JAVA_HOME antes de correr dependency-check."
fi

# -----------------------------------------------------------
# Idempotencia
# -----------------------------------------------------------
if command -v dependency-check >/dev/null 2>&1; then
    ok "dependency-check ya esta disponible en el PATH."
    echo ""
    exit 0
fi
if [[ -f "${DC_BIN}" ]]; then
    ok "Dependency-Check ya esta instalado en: ${DC_DIR}"
    info "Ejecutalo con: ${DC_BIN} --version"
    echo ""
    exit 0
fi

INSTALLED=false

# -----------------------------------------------------------
# Estrategia 1: Homebrew (mac / linuxbrew)
# -----------------------------------------------------------
if command -v brew >/dev/null 2>&1; then
    info "Intentando instalar con Homebrew..."
    if brew install dependency-check; then INSTALLED=true; fi
fi

# -----------------------------------------------------------
# Estrategia 2: descarga del release ZIP oficial
# -----------------------------------------------------------
if [[ "${INSTALLED}" == false ]] && command -v curl >/dev/null 2>&1 && command -v unzip >/dev/null 2>&1; then
    URL="https://github.com/dependency-check/DependencyCheck/releases/download/v${VERSION}/dependency-check-${VERSION}-release.zip"
    ZIP="$(mktemp -d)/dependency-check.zip"
    info "Descargando Dependency-Check ${VERSION} desde GitHub..."
    mkdir -p "${TOOLS_DIR}"
    rm -rf "${DC_DIR}"
    if curl -sfL "${URL}" -o "${ZIP}"; then
        info "Extrayendo en ${TOOLS_DIR} ..."
        unzip -q "${ZIP}" -d "${TOOLS_DIR}"
        rm -f "${ZIP}"
        if [[ -f "${DC_BIN}" ]]; then
            chmod +x "${DC_BIN}"
            INSTALLED=true
            case ":${PATH}:" in
                *":${DC_DIR}/bin:"*) : ;;
                *) warn "Agrega el binario a tu PATH:  export PATH=\"${DC_DIR}/bin:\$PATH\"" ;;
            esac
        fi
    else
        err "No se pudo descargar Dependency-Check desde ${URL}"
    fi
fi

# -----------------------------------------------------------
# Resumen
# -----------------------------------------------------------
echo ""
echo -e "${CYAN}=============================================================${NC}"
echo -e "${CYAN} RESUMEN DE INSTALACION — OWASP Dependency-Check${NC}"
echo -e "${CYAN}=============================================================${NC}"

if [[ "${INSTALLED}" == true ]]; then
    ok "Dependency-Check instalado. Verifica con: dependency-check --version"
else
    warn "No se pudo instalar Dependency-Check automaticamente."
    info "Alternativas:"
    echo "       - Es el mismo gate que Jenkins: en proyectos con el plugin Gradle basta './gradlew dependencyCheckAnalyze'."
    echo "       - CLI: brew install dependency-check"
    echo "       - CLI: descarga dependency-check-${VERSION}-release.zip de github.com/dependency-check/DependencyCheck/releases"
fi
echo ""
info "IMPORTANTE: solicita una NVD API Key para acelerar la base NVD:"
echo "       https://nvd.nist.gov/developers/request-an-api-key"
echo "       Sin ella, la primera actualizacion puede tardar horas."
echo -e "${CYAN}=============================================================${NC}"
echo ""
