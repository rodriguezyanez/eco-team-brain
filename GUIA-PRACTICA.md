# Ecosistema Klap — Guía Práctica

> **Punto de partida:** Docker Desktop abierto y corriendo. Node.js y npm instalados.
> **Tiempo estimado:** 5 minutos con el CLI `klap`.

---

## ¿Qué es el Ecosistema Klap?

Un ecosistema de memoria compartida para el equipo KLAP BYSF empaquetado como una herramienta CLI de Node.js. Conecta a todos los desarrolladores a un grafo de conocimiento Neo4j a través de Claude Code + MCP. El asistente recuerda decisiones técnicas, patrones, convenciones y arquitectura entre sesiones y entre desarrolladores.

```
Dev 1 (Claude Code)
Dev 2 (Claude Code)  ──→  MCP team-brain  ──→  Neo4j (grafo de conocimiento)
Dev 3 (Claude Code)
```

---

## Instalación

El ecosistema se distribuye como un paquete NPM local. Para habilitar el comando global `klap` en tu terminal:

```bash
# Desde la carpeta raíz del ecosistema (donde está el package.json)
npm install -g .
```

---

## Comandos del CLI `klap`

### Operaciones Principales
| Comando | Descripción |
|---------|-------------|
| `klap init` | **Setup inicial completo**: Inicializa DB, carga estándares e instala skills. |
| `klap sync` | Sincroniza memorias locales pendientes (`pending-memories.jsonl`) con Neo4j. |
| `klap update` | Actualización incremental del Standard (sin borrar memoria acumulada). |
| `klap rollback`| **Desinstalación**: Revierte cambios en Claude y detiene Neo4j. |
| `klap config` | Ver o cambiar la conexión Neo4j post-instalación. |

### Operaciones Avanzadas
| Comando | Descripción |
|---------|-------------|
| `klap export [file]` | Exporta el grafo completo a un archivo JSON para compartirlo. |
| `klap import <file>` | Importa y mergea un JSON de otro dev en tu Neo4j local. |
| `klap obsidian` | Exporta el grafo a archivos Markdown compatibles con Obsidian. |
| `klap backup <cmd>` | Gestión de backups: `backup`, `list`, `restore <archivo>`. |

### Gestión de Neo4j
| Comando | Función |
|---------|---------|
| `klap up` | Levanta el contenedor Neo4j. |
| `klap down` | Detiene el contenedor (datos persisten). |
| `klap status` | Muestra el estado del contenedor. |
| `klap logs` | Muestra logs en vivo de Neo4j. |
| `klap browser` | Abre Neo4j Browser en el navegador (http://localhost:7474). |

---

## Archivos del Ecosistema

| Directorio / Archivo | Descripción |
|----------------------|-------------|
| `bin/klap.js` | Orquestador principal del CLI. |
| `scripts/windows/` | Implementación de scripts PowerShell/Batch para Windows. |
| `scripts/linux/` | Implementación de scripts Bash para Linux/macOS. |
| `skills/` | Templates de habilidades (Kafka, Saga, JdbcTemplate, etc.) |
| `CLAUDE-TEMPLATE.md` | Sistema prompt base que se instala en el perfil del usuario. |
| `docker-compose.yml` | Configuración de Neo4j 5.18 Community. |

---

## Setup Manual Paso a Paso

Usa estos pasos si prefieres control total o si `klap init` falla en tu entorno.

### PASO 1 — Levantar Neo4j
```bash
klap up
```
Verifica con `klap status` hasta ver el estado `healthy`. Neo4j tarda ~20 segundos en arrancar.

### PASO 2 — Inicializar la Base de Datos
```bash
# Solo una vez. Crea constraints, índices y nodos base.
klap init
```

### PASO 3 — Registrar MCPs en Claude Code
```bash
# Windows
.\scripts\windows\brain.bat mcp
```
*(Próximamente disponible vía `klap mcp`)*. Verifica con `claude mcp list` que aparezcan `team-brain` y `context7` conectados.

### PASO 4 — Instalar Skills y CLAUDE.md
Copia manualmente el sistema prompt y las habilidades locales (fallback):
```bash
# Windows
copy CLAUDE-TEMPLATE.md %USERPROFILE%\.claude\CLAUDE.md
.\scripts\windows\install-skills.bat
```

---

## Flujos de Trabajo Avanzados

### Consolidación de grafos entre desarrolladores
Cada dev trabaja con su Neo4j local. Para consolidar la información en un único master:

1. **Exportar**: `klap export` → genera `teambrain-export-<hostname>.json`.
2. **Compartir**: Envía el archivo al responsable del master.
3. **Importar**: El responsable ejecuta `klap import <archivo.json>`.
   - El import agrega lo nuevo y mergea observaciones sin sobreescribir datos existentes.

### Exportación a Obsidian
Para visualizar el grafo completo visualmente:
1. Ejecuta `klap obsidian`.
2. Se generará una carpeta `vault/` en la raíz.
3. Abre [Obsidian](https://obsidian.md/), selecciona **Abrir vault** y elige la carpeta `vault/`.
4. Navega usando los `[[wikilinks]]` entre archivos Markdown.

### Cambiar la conexión Neo4j

La instalación inicial apunta a `localhost`. Para apuntar a un Neo4j compartido del equipo sin reinstalar:

```bash
# Ver qué conexión está activa
klap config show

# Apuntar a un Neo4j remoto (actualiza el MCP automáticamente)
klap config set -Host 10.0.0.50 -Password pass-del-equipo

# Volver a localhost
klap config reset
```

La configuración se guarda en `%USERPROFILE%\.claude\team-brain.json` (por máquina, no versionada). Después de un `set` o `reset` hay que **reiniciar Claude Code** para que el MCP tome los nuevos valores.

---

### Guardian Angel (Code Review)
Instala el hook pre-commit en tu proyecto para que Claude valide tu código antes de cada commit:
```bash
# Windows
.\scripts\windows\install-hooks.bat C:\ruta\a\tu\proyecto
```
Bypass urgente: `git commit --no-verify`.

---

## Troubleshooting (Solución de Problemas)

| Problema | Causa | Solución |
|----------|-------|----------|
| `klap` no se reconoce | No se instaló globalmente | Ejecuta `npm install -g .` en la raíz del paquete. |
| `HTTP 401` en init | Password incorrecta | Revisa `NEO4J_AUTH` en `docker-compose.yml`. |
| MCP `disconnected` | Neo4j no está corriendo | Ejecuta `klap up`. |
| MCP apunta al host incorrecto | Config desactualizada | Ejecuta `klap config show` y corrige con `klap config set`. |
| `No se esperaba REQUIRE` | Error de escape en CMD | Usa `klap init` (usa PowerShell internamente). |
| Neo4j en loop de restart | Volúmenes corruptos | `klap down`, borra volúmenes y `klap init` de nuevo. |

---

*Ecosistema Klap · GUIA-PRACTICA.md v3.1 · Abril 2026*
