# TASK — Fix incidencias PowerShell del CLI `klap`

Rama: `feature/20260618_rvs_fix_incidencias_powershell`
Última actualización: 2026-06-18

## Contexto
El commit `44f4035` agregó referencias a `brain-config.ps1` y `config-neo4j.ps1` en `klap.js`, `brain.ps1`, `brain-sync.ps1` y `brain.bat`, pero nunca creó esos archivos. Esto rompe `klap config` (total), `klap sync`/`klap mcp` (dependen de `Get-BrainConfig`) y ensucia `status/logs/up/down/restart/browser` con un error visible de dot-source.

## Evidencia (pruebas no-mutantes ejecutadas)
- `klap` → ✅ ayuda OK (exit 0)
- `klap comando-invalido` → ✅ "Comando desconocido" (exit 1, esperado)
- `klap config show` → ❌ `-File '...config-neo4j.ps1' no existe`
- `klap status` → ⚠️ error `. brain-config.ps1` pero igual corre `docker compose ps`

## Actividades

| # | Actividad | Estado |
|---|-----------|--------|
| 1 | Diagnóstico y captura de errores (pruebas no-mutantes) | ✅ Completado |
| 2 | Crear `scripts/windows/brain-config.ps1` (`Get/Set/Reset-BrainConfig`, persistencia en `~/.claude/brain-config.json`, defaults del compose) | ✅ Completado |
| 3 | Crear `scripts/windows/config-neo4j.ps1` (`show` / `set` / `reset`) | ✅ Completado |
| 4 | Quitar `version: "3.9"` obsoleto de `docker-compose.yml` (warning Compose) | ✅ Completado |
| 5 | Verificar: `config show/set/reset`, `status` limpio, re-test tabla de evidencia | ✅ Completado |
| 6 | Paridad Linux completa (ver Fase 2) | ✅ Completado |

## Fase 2 — Registro de bug + Paridad Linux (2026-06-18)

| # | Actividad | Estado |
|---|-----------|--------|
| 2.0 | Registrar bug en Neo4j (label `bug`, `_id: 26`) | ✅ Completado |
| 2.1 | Crear `scripts/linux/brain-config.sh` (`load_brain_config`, `brain_config_path`) | ✅ Completado |
| 2.2 | Crear `scripts/linux/config-neo4j.sh` (`show/set/reset`, flags `-Host` etc, jq) | ✅ Completado |
| 2.3 | Crear `scripts/linux/brain.sh` (`up/down/restart/status/logs/browser/mcp/update/sync`) | ✅ Completado |
| 2.4 | Fix `bin/klap.js`: enrutar gestión Linux a `brain.sh` (no `brain-sync.sh`) | ✅ Completado |
| 2.5 | `scripts/linux/brain-sync.sh` usa config compartida (env override preservado) | ✅ Completado |
| 2.6 | (Fuera de alcance) Retrofit resto de scripts Linux a `brain-config.json` | ⬜ Pendiente |

## Fase 3 — Fix `klap mcp` (reportado al probar) (2026-06-18)

Síntoma: `brain.bat mcp` → `Invalid configuration: : Invalid input`.

| # | Actividad | Estado |
|---|-----------|--------|
| 3.1 | `brain.ps1` mcp: escapar comillas dobles del JSON (`-replace '"','\"'`) — PowerShell 5.1 rompe el JSON al pasarlo a `claude.exe` | ✅ Completado |
| 3.2 | `brain.ps1` mcp: hacer idempotente (`mcp remove` antes de `add-json`) + detección de éxito por server | ✅ Completado |
| 3.3 | Espejo en `brain.sh` (Linux): idempotencia remove-then-add | ✅ Completado |

Verificado: `brain.ps1 mcp` → "Added ... team-brain", "Added ... context7", `[OK]`, ambos ✔ Connected.
Nota: el error `SessionEnd hook ... ENOENT ...Programs\Git` al final es de un hook del entorno del dev (`.pixel-agents`), ajeno a klap.

### Verificación Fase 2
- ✅ `bash -n` OK en los 4 scripts (`brain-config.sh`, `config-neo4j.sh`, `brain.sh`, `brain-sync.sh`).
- ✅ `brain.sh status` → corre `docker compose ps` (EXIT 0). **Bug de enrutamiento resuelto.**
- ✅ `config-neo4j.sh show` sin `jq` → guard dispara con EXIT 1 (comportamiento esperado).
- ⏳ Happy-path `config set/show/reset` NO ejecutado en este host: `jq` no instalado en Git Bash (dependencia preexistente de los scripts Linux). Pendiente de correr en un entorno Linux/macOS con `jq`. Lógica es espejo de la versión Windows ya verificada.
- ℹ️ Nota de entorno: el `bash` del PATH es el relay de WSL (sin distro); usar el bash de Git for Windows en `%LOCALAPPDATA%\Programs\Git\bin\bash.exe`.

## Resultado de verificación (2026-06-18)
- `klap config show` → ✅ exit 0, password enmascarada.
- `klap config set -Host localhost -Password team-brain-2025 -BoltPort 7687` → ✅ persiste `~/.claude/brain-config.json`.
- `klap config reset` → ✅ vuelve a defaults.
- `klap status` → ✅ limpio, sin error de `brain-config.ps1` ni warning de `version` en Compose.

## Contrato `Get-BrainConfig` (consumidores: brain.ps1:24,91 · brain-sync.ps1:22-23,25)
Devuelve objeto con: `host`, `httpPort` (7474), `boltPort` (7687), `user` (neo4j), `password` (team-brain-2025), `database` (neo4j).
Defaults tomados de `docker-compose.yml` (`NEO4J_AUTH: neo4j/team-brain-2025`).

## Verificación final
1. `node bin/klap.js config show` → imprime config, exit 0, password enmascarada.
2. `node bin/klap.js config set -Host localhost -Password team-brain-2025` → persiste JSON.
3. `node bin/klap.js config reset` → defaults.
4. `node bin/klap.js status` → sin error de `brain-config.ps1`.
