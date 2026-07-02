# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ¿Qué es este repositorio?

`eco-team-brain` es el paquete Node.js (`@rodriguezyanez/eco-team-brain`) que instala y gestiona el **Ecosistema Klap**: una memoria compartida para el equipo KLAP BYSF basada en Neo4j + Claude Code + MCP. El CLI expone el comando `klap`, que delega en scripts PowerShell (Windows) o Bash (Linux/macOS).

## Comandos principales

```bash
# Instalación del ecosistema
klap init                  # Inicializa Neo4j, carga nodos base, instala skills + commands + workflows y registra MCPs
klap install               # Solo instala commands/ y workflows/ en ~/.claude (sin reinicializar Neo4j)
klap mcp                   # Solo registra MCPs (team-brain + Context7) en Claude Code
klap rollback              # Revierte instalación y detiene Neo4j

# Gestión de datos
klap sync                  # Sincroniza memorias locales pendientes con Neo4j
klap update                # Actualiza arquitectura de referencia KLAP BYSF en Neo4j (incremental, sin borrar memoria)
klap export                # Exporta grafo Neo4j a JSON
klap import                # Importa/mergea un JSON en Neo4j
klap obsidian              # Exporta grafo a Markdown para Obsidian

# Ciclo de vida de Neo4j
klap up / down / restart   # Levantar, detener, reiniciar el contenedor
klap status / logs         # Estado y logs en vivo
klap browser               # Abre Neo4j Browser en http://localhost:7474

# Configuración de conexión
klap config show           # Ver config actual
klap config set -Host X -Password Y
klap config reset

# Backups
klap backup                # Gestión de backups de volúmenes Docker

# Herramientas de seguridad (gates de /auditoria)
klap trivy                 # Instala Trivy (scanner de vulnerabilidades)
klap depcheck              # Instala OWASP Dependency-Check CLI (mismo gate que Jenkins)
```

Los scripts directos están en `scripts/windows/` (`.ps1`) y `scripts/linux/` (`.sh`). El CLI en `bin/klap.js` los invoca con `spawn`.

## Arquitectura

```
Dev (Claude Code)  ──→  MCP team-brain  ──→  Neo4j (bolt://localhost:7687)
                         @knowall-ai/mcp-neo4j-agent-memory
```

- **`docker-compose.yml`**: Neo4j 5.18 Community en Docker. Puertos 7474 (UI) y 7687 (Bolt). Credenciales por defecto: `neo4j / team-brain-2025`. Cuatro volúmenes persistentes (los datos sobreviven a `docker compose down`).
- **`bin/klap.js`**: Orquestador CLI. Detecta plataforma (`isWin`) y ejecuta el script correspondiente. También hace un check de actualizaciones contra GitHub en cada ejecución.
- **`CLAUDE-TEMPLATE.md`**: System prompt del equipo. `klap init` lo copia a `%USERPROFILE%\.claude\CLAUDE.md` (Windows) o `~/.claude/CLAUDE.md` (Linux). Es el protocolo de asistencia que Claude debe seguir en todos los proyectos del equipo.
- **`skills/`**: Fallback local cuando Neo4j no está disponible. `klap init` los instala en `~/.claude/skills/`. Siempre leer `skill-registry.md` primero.

## Flujo de datos de memoria

Cuando Neo4j no está disponible, Claude guarda entradas en `%USERPROFILE%\.claude\pending-memories.jsonl`. `klap sync` lee ese archivo y sincroniza con Neo4j, conservando solo las entradas fallidas.

## Publicación

El paquete se publica en el GitHub Package Registry:
```bash
npm publish   # requiere .npmrc con token de GitHub
```
El registro destino está en `package.json` → `publishConfig.registry`.

## Estructura de scripts relevante

| Script | Propósito |
|--------|-----------|
| `scripts/windows/init-brain.ps1` | Crea constraints, índices y nodos base en Neo4j via HTTP API; llama a `install-commands.ps1` al final |
| `scripts/windows/install-commands.ps1` | Copia `commands/` y `workflows/` recursivamente a `~/.claude/` |
| `scripts/windows/brain.ps1` | Comandos de ciclo de vida de Neo4j y registro de MCPs |
| `scripts/windows/brain-sync.ps1` | Sincronización de `pending-memories.jsonl` con Neo4j |
| `scripts/windows/brain-update.ps1` | MERGE incremental de nodos de referencia (no borra Decision/Fix/Pattern) |
| `scripts/windows/brain-export.ps1` / `brain-import.ps1` | Export/import del grafo en JSON |
| `scripts/windows/install-skills.ps1` | Copia `skills/*.md` a `~/.claude/skills/` |
| `scripts/windows/install-hooks.ps1` | Instala hook pre-commit de Guardian Angel en un proyecto destino |
| `scripts/windows/install-trivy.ps1` | Instala Trivy (winget/choco); idempotente, no aborta si falta el gestor |
| `scripts/windows/install-depcheck.ps1` | Instala OWASP Dependency-Check CLI (choco o ZIP de release, v12.2.0) |

Cada script Windows tiene su equivalente `.sh` en `scripts/linux/`.

## Consideraciones al modificar scripts

- Los scripts PS1 leen configuración desde `brain-config.ps1` (no hardcodear credenciales en scripts nuevos).
- `brain-update.ps1` usa `MERGE` (no `CREATE`) para preservar la memoria del equipo. Cualquier nuevo nodo de referencia debe seguir este patrón.
- El registro de MCPs en `brain.ps1` (acción `mcp`) debe escapar las comillas dobles del JSON con `-replace '"', '\"'` porque PowerShell 5.1 las corrompe al pasarlas como argumento a `claude.exe`.
