# Ecosistema Klap — Guía Práctica

> **Punto de partida:** Docker Desktop abierto y corriendo. Node.js y npm instalados.

---

## ¿Qué es el Ecosistema Klap?

Un ecosistema de memoria compartida para el equipo KLAP BYSF empaquetado como una herramienta CLI de Node.js. Conecta a todos los desarrolladores a un grafo de conocimiento Neo4j a través de Claude Code + MCP. El asistente recuerda decisiones técnicas, patrones, convenciones y arquitectura entre sesiones y entre desarrolladores.

---

## Instalación

El ecosistema se distribuye como un paquete NPM. Para instalarlo de forma global en tu máquina:

```bash
# Desde la carpeta local donde descargaste el código
npm install -g ./ecosistema-klap
```

Esto habilitará el comando global `klap` en tu terminal.

---

## Setup Paso a Paso

### PASO 1 — Levantar Neo4j

Desde la carpeta raíz del ecosistema:
**Windows (CMD/PowerShell)**
```bat
.\scripts\windows\brain.bat up
```
**Linux / macOS**
```bash
docker compose up -d
```

### PASO 2 — Inicializar el entorno (UNA SOLA VEZ)

Usa el nuevo comando global del CLI:
```bash
klap init
```
*(Esto crea los constraints, índices, los 4 nodos base en Neo4j e instala las habilidades locales).*

### PASO 3 — Registrar el MCP en Claude Code (UNA SOLA VEZ POR MÁQUINA)

**Windows**
```bat
.\scripts\windows\brain.bat mcp
```
**Linux / macOS**
```bash
claude mcp add-json "team-brain" \
  '{"command":"npx","args":["-y","@knowall-ai/mcp-neo4j-agent-memory"],"env":{"NEO4J_URI":"bolt://localhost:7687","NEO4J_USERNAME":"neo4j","NEO4J_PASSWORD":"team-brain-2025","NEO4J_DATABASE":"neo4j"}}' \
  --scope user

claude mcp add-json "context7" \
  '{"command":"npx","args":["-y","@upstash/context7-mcp"]}' \
  --scope user
```
*Verifica que aparezcan conectados usando `claude mcp list`.*

### PASO 4 — Actualizar arquitectura (Opcional si usaste klap init)

Si necesitas recargar los estándares sin borrar tu memoria personal:
```bash
klap update
```

### PASO 5 — Activar el CLAUDE.md global

Copia el archivo `CLAUDE-TEMPLATE.md` del paquete a tu directorio global de Claude:
**Windows**
```bat
copy CLAUDE-TEMPLATE.md %USERPROFILE%\.claude\CLAUDE.md
```
**Linux / macOS**
```bash
cp CLAUDE-TEMPLATE.md ~/.claude/CLAUDE.md
```

---

## Uso del CLI `klap`

El paquete instala el comando global `klap`, el cual expone atajos para las operaciones principales:

- `klap init`: Inicializa la base de datos Neo4j y las habilidades.
- `klap sync`: Sincroniza las memorias locales pendientes (`pending-memories.jsonl`) con Neo4j.
- `klap update`: Sincroniza la arquitectura de referencia en Neo4j de forma incremental.
- `klap rollback`: Revierte la instalación, detiene Neo4j y restaura backups.

---

## Uso diario y scripts directos

Para operaciones avanzadas, usa los scripts en `scripts/windows/` (Windows) o `scripts/linux/` (Linux):

- **Gestionar Neo4j:** `brain.bat status / logs / browser / down`
- **Backup de Datos:** `backup.bat backup / list / restore`
- **Exportar Grafo:** `brain.bat export [archivo.json]`
- **Importar Grafo:** `brain.bat import <archivo.json>`
- **Guardian Angel (Code Review):**
  ```bat
  .\scripts\windows\install-hooks.bat C:\ruta\a\tu\proyecto
  ```

---

## Cómo trabajar con Claude

### 1. Selección de Proyecto
Al abrir Claude Code, siempre preguntará:
> "¿En qué proyecto o microservicio vas a trabajar hoy?"

### 2. Flujo SDD (Spec-Driven Development)
Si el proyecto es nuevo o vas a construir una nueva feature, usa el activador SDD:
```
sdd: [descripción de lo que quieres construir]
```
Claude ejecutará las 5 fases (Explorar, Proponer, Validar, Implementar, Verificar).

### 3. Context7 (Documentación en tiempo real)
Agrega `use context7` a cualquier prompt para obtener documentación exacta:
```
use context7, ¿cómo configuro un CircuitBreaker con Resilience4j 2.2.0?
```
