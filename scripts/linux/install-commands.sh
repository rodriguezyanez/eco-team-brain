#!/usr/bin/env bash
# =============================================================
# install-commands.sh — Instala commands/ y workflows/ en Claude Code
# =============================================================
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLAUDE_ROOT="${HOME}/.claude"

DIRS=(
    "commands"
    "workflows"
)

echo ""
echo "Team Brain — Instalador de Commands y Workflows"
echo "Destino raíz: ${CLAUDE_ROOT}"
echo ""

ERRORS=0

for name in "${DIRS[@]}"; do
    src="${REPO_ROOT}/${name}"
    dest="${CLAUDE_ROOT}/${name}"

    if [ ! -d "$src" ]; then
        echo "[WARN] Carpeta '${name}' no encontrada en el repo, se omite."
        continue
    fi

    echo "[INFO] Instalando ${name}..."

    mkdir -p "$dest"
    cp -r "${src}/." "${dest}/"

    count=$(find "$dest" -type f | wc -l | tr -d ' ')
    echo "[OK] ${name} instalado (${count} archivos)"
done

echo ""
if [ "$ERRORS" -eq 0 ]; then
    echo "[OK] Commands y workflows instalados correctamente."
else
    echo "[WARN] Instalación completada con ${ERRORS} error(es)."
fi
echo ""
