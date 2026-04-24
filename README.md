# Ecosistema Klap

> **Memoria compartida y estandarización de desarrollo para el equipo KLAP BYSF**

CLI de Node.js que conecta a todos los desarrolladores a un grafo de conocimiento Neo4j a través de Claude Code + MCP. El asistente recuerda decisiones técnicas, patrones, convenciones y arquitectura entre sesiones y entre desarrolladores.

```
Dev 1 (Claude Code)
Dev 2 (Claude Code)  ──→  MCP team-brain  ──→  Neo4j (grafo de conocimiento)
Dev 3 (Claude Code)
```

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [GUIA-PRACTICA.md](GUIA-PRACTICA.md) | Comandos, flujos avanzados y troubleshooting |
| [ONBOARDING.md](ONBOARDING.md) | Guía de incorporación: SDD, Guardian Angel, JavaDoc y Context7 |

---

## Instalación

**Prerrequisitos:** Docker Desktop corriendo · Node.js y npm instalados

### Opción A — Instalación local (sin token)

```bash
# Desde la carpeta raíz del ecosistema (donde está el package.json)
npm install -g .
```

### Opción B — Instalación desde GitHub Packages

El paquete está publicado en GitHub Packages bajo el scope `@rodriguezyanez`. Para instalarlo necesitas configurar tu npm con un Personal Access Token (PAT) de GitHub.

#### Paso 1 — Crear tu PAT en GitHub

1. Ir a **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Hacer clic en **Generate new token (classic)**
3. Asignar solo el permiso `read:packages`
4. Copiar el token generado (`ghp_...`)

#### Paso 2 — Configurar npm (una sola vez por máquina)

```bash
npm config set @rodriguezyanez:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken <tu-PAT>
```

O agregar manualmente al archivo `~/.npmrc` (Windows: `%USERPROFILE%\.npmrc`):

```
@rodriguezyanez:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_TU_TOKEN_AQUI
```

#### Paso 3 — Instalar

```bash
npm install -g @rodriguezyanez/eco-team-brain
```

Una vez instalado, el comando `klap` queda disponible globalmente en tu terminal.

---

## Comandos del CLI `klap`

### Operaciones principales

| Comando | Descripción |
|---------|-------------|
| `klap init` | Setup completo: levanta Neo4j, inicializa la DB, carga estándares e instala skills |
| `klap sync` | Sincroniza memorias locales pendientes (`pending-memories.jsonl`) con Neo4j |
| `klap update` | Actualización incremental del Standard KLAP BYSF sin borrar memoria acumulada |
| `klap rollback` | Desinstalación: revierte cambios en Claude Code y detiene Neo4j |
| `klap config` | Ver o cambiar la conexión Neo4j (host, usuario, password) |

### Operaciones avanzadas

| Comando | Descripción |
|---------|-------------|
| `klap export [file]` | Exporta el grafo completo a JSON para compartir entre devs |
| `klap import <file>` | Importa y mergea un JSON de otro dev en tu Neo4j local |
| `klap obsidian` | Exporta el grafo a archivos Markdown para visualizar en Obsidian |
| `klap backup <cmd>` | Gestión de backups: `backup`, `list`, `restore <archivo>` |

### Gestión de Neo4j

| Comando | Función |
|---------|---------|
| `klap up` | Levanta el contenedor Neo4j |
| `klap down` | Detiene el contenedor (los datos persisten) |
| `klap status` | Muestra el estado del contenedor |
| `klap logs` | Muestra logs en vivo de Neo4j |
| `klap browser` | Abre Neo4j Browser en `http://localhost:7474` |

---

## Funcionalidades del ecosistema

### Memoria compartida del equipo

Claude consulta Neo4j al inicio de cada sesión para cargar el contexto del proyecto en el que vas a trabajar: responsabilidades del microservicio, topics Kafka, tablas, dependencias externas y decisiones técnicas previas.

### SDD — Spec-Driven Development

Flujo de 5 fases para implementar cualquier feature siguiendo el estándar del equipo:

```
sdd: implementar KafkaListener para el dominio de tarifas
```

| Fase | Nombre | Qué hace |
|------|--------|----------|
| 1 | Explorar | Lee el dominio, consulta la memoria, mapea dependencias |
| 2 | Proponer | Presenta estructura de paquetes y decisiones arquitectónicas |
| 3 | Validar | Verifica la propuesta contra reglas DO/DON'T |
| 4 | Implementar | Código limpio siguiendo los skill files del equipo |
| 5 | Verificar | Tests 95%+, JavaDoc completo, naming correcto |

### Guardian Angel — Code review pre-commit

Hook que revisa cada commit contra las reglas del equipo antes de permitirlo:

```bash
# Instalar en tu proyecto
.\scripts\windows\install-hooks.bat C:\ruta\a\tu\proyecto   # Windows
./scripts/linux/install-hooks.sh /ruta/a/tu/proyecto         # Linux/macOS

# Bypass para urgencias
git commit --no-verify -m "hotfix urgente"
```

### Context7 — Documentación en tiempo real

Agrega `use context7` a cualquier prompt para obtener documentación actualizada de la versión exacta del stack:

```
use context7, ¿cómo configuro un CircuitBreaker con Resilience4j 2.2.0?
```

### Fallback de memoria local

Cuando Neo4j no está disponible, Claude guarda las memorias pendientes en `~/.claude/pending-memories.jsonl` y las sincroniza automáticamente con `klap sync` cuando Neo4j vuelve a estar disponible.

### Exportación a Obsidian

Visualiza el grafo de conocimiento completo de forma gráfica:

```bash
klap obsidian
# Se genera vault/ en la raíz — ábrela directamente en Obsidian
```

---

## Estructura del paquete

```
ecosistema-klap/
├── bin/                    # Orquestadores CLI en Node.js
├── scripts/
│   ├── windows/            # Scripts PowerShell/Batch para Windows
│   └── linux/              # Scripts Bash para Linux/macOS
├── skills/                 # Skill files del equipo (templates de componentes)
├── docs/                   # Documentación técnica y planes de ejecución
├── CLAUDE-TEMPLATE.md      # Sistema prompt base que se instala en el perfil del usuario
├── docker-compose.yml      # Configuración de Neo4j 5.18 Community
├── GUIA-PRACTICA.md        # Referencia completa de comandos y flujos
└── ONBOARDING.md           # Guía de incorporación al equipo
```

---

## Actualización

```bash
npm update -g @rodriguezyanez/eco-team-brain
```

---

## Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| `klap` no se reconoce | Ejecuta `npm install -g .` en la raíz del paquete |
| `HTTP 401` en init | Revisa `NEO4J_AUTH` en `docker-compose.yml` o ejecuta `klap config show` |
| MCP `disconnected` | Ejecuta `klap up` y espera ~20 segundos |
| Neo4j en loop de restart | `klap down`, borra volúmenes y ejecuta `klap init` de nuevo |
| MCP apunta a host incorrecto | Ejecuta `klap config show` y corrige con `klap config set` |

Para troubleshooting detallado ver [GUIA-PRACTICA.md](GUIA-PRACTICA.md#troubleshooting-solución-de-problemas).

---

*Ecosistema Klap · v1.0.2 · 2026*
