# Setup MCP Neo4j Memory

Configura el servidor MCP de Neo4j para guardar memoria de conversaciones en Claude Code.

## Datos de conexión requeridos

- `NEO4J_URI`: URI del servidor (ej: `bolt://localhost:7687`)
- `NEO4J_USERNAME`: Usuario (ej: `neo4j`)
- `NEO4J_PASSWORD`: Contraseña
- `NEO4J_DATABASE`: Base de datos (ej: `neo4j`)

---

## Windows

### 1. Instalar uv

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Agrega al PATH en la terminal actual:
```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 2. Instalar mcp-neo4j-memory

```bash
uv tool install mcp-neo4j-memory
```

Ruta del ejecutable: `C:\Users\<usuario>\.local\bin\uvx.exe`

### 3. Verificar que Neo4j está corriendo

```powershell
Test-NetConnection -ComputerName localhost -Port 7687
```

### 4. Registrar el MCP en Claude Code

Edita `~/.claude.json`. Busca la clave del proyecto activo con forward slashes (`"C:/Users/<usuario>"`) y agrega en `"mcpServers"`:

```json
"neo4j-memory": {
  "type": "stdio",
  "command": "C:\\Users\\<usuario>\\.local\\bin\\uvx.exe",
  "args": ["mcp-neo4j-memory"],
  "env": {
    "NEO4J_URI": "bolt://localhost:7687",
    "NEO4J_USERNAME": "neo4j",
    "NEO4J_PASSWORD": "<password>",
    "NEO4J_DATABASE": "neo4j"
  }
}
```

> **Nota Windows:** Usa siempre la entrada con forward slashes (`C:/Users/...`) como clave de proyecto — es la que Claude Code usa activamente. El comando `claude mcp add-json` falla con rutas con backslashes en Windows; editar `.claude.json` directamente es la solución.

---

## macOS

### 1. Instalar uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Agrega al PATH (o reinicia la terminal):
```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 2. Instalar mcp-neo4j-memory

```bash
uv tool install mcp-neo4j-memory
```

Ruta del ejecutable: `/Users/<usuario>/.local/bin/uvx`

### 3. Verificar que Neo4j está corriendo

```bash
nc -zv localhost 7687
```

### 4. Registrar el MCP en Claude Code

```bash
claude mcp add-json neo4j-memory '{
  "type": "stdio",
  "command": "/Users/<usuario>/.local/bin/uvx",
  "args": ["mcp-neo4j-memory"],
  "env": {
    "NEO4J_URI": "bolt://localhost:7687",
    "NEO4J_USERNAME": "neo4j",
    "NEO4J_PASSWORD": "<password>",
    "NEO4J_DATABASE": "neo4j"
  }
}'
```

O edita directamente `~/.claude.json` en la clave del proyecto activo (`"/Users/<usuario>"`).

---

## Ubuntu / Linux

### 1. Instalar uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
```

### 2. Instalar mcp-neo4j-memory

```bash
uv tool install mcp-neo4j-memory
```

Ruta del ejecutable: `/home/<usuario>/.local/bin/uvx`

### 3. Verificar que Neo4j está corriendo

```bash
nc -zv localhost 7687
```

### 4. Registrar el MCP en Claude Code

```bash
claude mcp add-json neo4j-memory '{
  "type": "stdio",
  "command": "/home/<usuario>/.local/bin/uvx",
  "args": ["mcp-neo4j-memory"],
  "env": {
    "NEO4J_URI": "bolt://localhost:7687",
    "NEO4J_USERNAME": "neo4j",
    "NEO4J_PASSWORD": "<password>",
    "NEO4J_DATABASE": "neo4j"
  }
}'
```

---

## Verificación final (todos los SO)

```bash
claude mcp list
```

Debe mostrar:
```
neo4j-memory: ... - ✓ Connected
```

Reinicia Claude Code para que los tools del MCP (`create_entities`, `add_observations`, `search_nodes`, etc.) estén disponibles en la sesión.
