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

Desde la carpeta donde descargaste el código:
**Windows (CMD/PowerShell)**
```bat
.\scripts\windows\brain.bat up
```
**Linux / macOS**
```bash
docker compose up -d
```

### PASO 2 — Inicializar la base de datos (UNA SOLA VEZ)

Usa el nuevo comando global del CLI:
```bash
klap init
```
*(Esto crea los constraints, índices y los 4 nodos base en Neo4j).*

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

### PASO 4 — Cargar la arquitectura de referencia (UNA SOLA VEZ)

**Windows**
```bat
.\scripts\windows\enrich-brain.bat
```
**Linux / macOS**
```bash
./scripts/linux/enrich-brain.sh
```

### PASO 5 — Instalar skill files locales (UNA SOLA VEZ POR MÁQUINA)

**Windows**
```bat
.\scripts\windows\install-skills.bat
```
**Linux / macOS**
```bash
./scripts/linux/install-skills.sh
```

### PASO 6 — Activar el CLAUDE.md global

Copia el archivo `CLAUDE.md` del paquete a tu directorio global de Claude:
**Windows**
```bat
copy CLAUDE.md %USERPROFILE%\.claude\CLAUDE.md
```
**Linux / macOS**
```bash
cp CLAUDE.md ~/.claude/CLAUDE.md
```

---

## Uso del CLI `klap`

El paquete instala el comando global `klap`, el cual expone atajos para las operaciones principales:

- `klap init`: Inicializa la base de datos Neo4j (Paso 2).
- `klap sync`: Sincroniza las memorias locales pendientes (`pending-memories.jsonl`) con la base de datos Neo4j en caso de caídas.
- `klap update`: Sincroniza la arquitectura de referencia en Neo4j, actualizando nodos del estándar sin borrar la memoria acumulada (Decisiones, Bugs, Patterns).
- `klap rollback`: Revierte la instalación, detiene Neo4j y restaura los archivos de configuración originales desde el backup.

*También puedes usar los alias directos: `klap-init`, `klap-sync` y `klap-rollback`.*

---

## Desinstalación Completa

Para eliminar el ecosistema de tu máquina por completo:

1. **Ejecutar Rollback:**
   ```bash
   klap rollback
   ```
   *(Esto restaurará tus archivos de Claude al estado previo a la instalación).*

2. **Desinstalar Paquete Global:**
   ```bash
   npm uninstall -g ecosistema-klap
   ```

---

## Uso diario y scripts directos

Para operaciones de gestión avanzadas, debes ejecutar los scripts directamente desde la carpeta `scripts/` (ej. `scripts/windows/brain.bat` o `scripts/linux/brain-export.sh`):

- **Levantar/Detener Neo4j:** `brain.bat up` / `brain.bat down`
- **Ver logs/status:** `brain.bat logs` / `brain.bat status`
- **Exportar grafo (backup o compartir):** `brain.bat export [archivo.json]`
- **Importar grafo de otro dev:** `brain.bat import <archivo.json>`
- **Exportar a Obsidian:** `export-obsidian.bat`

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
Agrega `use context7` a cualquier prompt para obtener la documentación exacta de las librerías del stack (Spring Boot 3.5.x, WebClient, Kafka):
```
use context7, ¿cómo configuro un CircuitBreaker con Resilience4j 2.2.0?
```

### 4. Guardian Angel (Code Review)
Instala el hook pre-commit en tu repositorio local para que Claude valide tu código antes de cada commit contra las reglas DO/DON'T:
```bat
.\scripts\windows\install-hooks.bat C:\ruta\a\tu\proyecto
```
*(Para saltar la revisión urgente: `git commit --no-verify`)*
