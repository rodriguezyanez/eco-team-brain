# Ecosistema Klap — Contexto del proyecto

Este archivo es el punto de entrada para Claude Code. Resume todo lo construido,
el estado actual y los próximos pasos. Léelo completo antes de continuar.

---

## Qué es el Ecosistema Klap

Un ecosistema de memoria compartida para el equipo de desarrollo KLAP BYSF.
Combina Neo4j (grafo de conocimiento), Claude Code (asistente) y MCP (protocolo
de conexión entre ambos). El objetivo es que Claude recuerde el contexto del equipo
entre sesiones y entre devs: decisiones técnicas, patrones, convenciones, arquitectura.

---

## Arquitectura del ecosistema

```
Dev 1 (Claude Code)
Dev 2 (Claude Code)  ──→  MCP team-brain  ──→  Neo4j (bolt://localhost:7687)
Dev 3 (Claude Code)
```

- **Neo4j**: corre en Docker con volúmenes persistentes. Los datos sobreviven a reinicios.
- **MCP**: paquete `@knowall-ai/mcp-neo4j-agent-memory` registrado con scope `user` en Claude Code.
- **CLAUDE-TEMPLATE.md**: sistema prompt que activa protocolos de memoria, niveles de asistencia y JavaDoc obligatorio.

---

## Archivos del ecosistema

```
ecosistema-klap/
│
├── docker-compose.yml         Neo4j 5.18 Community — puertos 7474 y 7687
│                              4 volúmenes persistentes (datos sobreviven a reinicios)
│
├── CLAUDE-TEMPLATE.md         System prompt del equipo para Claude Code
│                              Instalar en: %USERPROFILE%\.claude\CLAUDE.md (Windows)
│                                           ~/.claude/CLAUDE.md (Linux/macOS)
│
├── package.json               Configuración del paquete global Node.js
│
│── bin/ ──────────────────────────────────────────────────────────────
├── klap.js                    Orquestador CLI principal (comando 'klap')
├── klap-init.js               Alias para 'klap init'
├── klap-sync.js               Alias para 'klap sync'
├── klap-rollback.js           Alias para 'klap rollback'
│
│── scripts/ ──────────────────────────────────────────────────────────
├── windows/                   Scripts PowerShell y Batch para Windows
└── linux/                     Scripts Bash para Linux/macOS
│
│── Documentación ─────────────────────────────────────────────────────
├── README.md                  Documentación general y referencia rápida
├── GUIA-PRACTICA.md           Wizard de instalación paso a paso (todos los SO)
├── ONBOARDING.md              Filosofía, flujos de trabajo y porqués del equipo
├── CONTEXT.md                 Este archivo — estado actual y referencia rápida
│
│── Skills locales (fallback cuando Neo4j no está disponible) ──────────
└── skills/                    Copiados a ~/.claude/skills/ por klap init
    ├── skill-registry.md      Índice de skills — leer primero
    ├── kafka-config.md        Template KafkaConfig
    ├── kafka-listener.md      Template KafkaListener
    ├── processor.md           Template Processor/ProcessorImpl
    ├── repository.md          Template Repository con JdbcTemplate
    ├── webclient.md           Template WebClient
    ├── exceptions.md          Jerarquía de excepciones
    ├── testing.md             Tests unitarios (95%+ cobertura)
    ├── openapi.md             OpenApiConfig
    ├── sdd-microservice.md    Flujo SDD completo
    └── sdd-checklist.md       Checklist de verificación por fase SDD
```

---

## Estado actual

### Neo4j
- Corriendo en Docker en la máquina local.
- Base de datos: `neo4j` (Community Edition — no soporta múltiples DBs)
- Nodos base cargados por `klap init`: Team, Architecture, Decisions, Conventions

### MCP
- Paquete: `@knowall-ai/mcp-neo4j-agent-memory`
- Variables de entorno: `NEO4J_URI=bolt://localhost:7687`, `NEO4J_USERNAME=neo4j`, `NEO4J_PASSWORD=team-brain-2025`, `NEO4J_DATABASE=neo4j`
- Estado: **conectado** (`✓ Connected` en `claude mcp list`)
- Scope: user (disponible en todos los proyectos)

### klap init / skills / CLAUDE-TEMPLATE.md
- Arquitectura de referencia KLAP BYSF cargada en Neo4j (20+ nodos)
- Skill files instalados en `%USERPROFILE%\.claude\skills\`
- `CLAUDE-TEMPLATE.md` instalado en `%USERPROFILE%\.claude\CLAUDE.md`

---

## Estructura del grafo Neo4j (después de enrich-brain)

```
Standard KLAP BYSF (raíz)
├── Stack Tecnologico
│   └── Dependencias Principales
├── Arquitectura Capas
│   └── Principios Arquitectonicos
├── Estructura Paquetes
├── Kafka Config Standard
│   └── Kafka Topics Standard
├── Persistencia Standard
├── Convenciones Naming
├── Convenciones Logging
├── Reglas DO (21 reglas)
├── Reglas DONT (13 reglas)
└── Templates (8 nodos independientes)
    ├── Template KafkaConfig Dominio
    ├── Template KafkaListener
    ├── Template Processor
    ├── Template Repository
    ├── Template WebClient
    ├── Template Excepciones
    ├── Template Testing
    └── Template OpenAPI
```

---

## Comportamiento de Claude

El CLAUDE.md asume siempre perfil **senior**: directo al punto, sin explicaciones innecesarias, conocimiento profundo del stack y los patrones del equipo.

Protocolo de inicio de sesión:
1. Preguntar en qué proyecto o microservicio se va a trabajar
2. Buscar el proyecto en Neo4j (`memory_search`)
3. Si existe: cargar contexto + reglas DO/DON'T
4. Si no existe: proponer flujo SDD para explorarlo y registrarlo

---

## Reglas que aplican en todo el código generado

1. **JavaDoc obligatorio** en todos los métodos públicos — describe el objetivo del método
2. **Verificar reglas DO/DON'T** desde Neo4j antes de generar código
3. **Consultar memoria del equipo** al inicio de cada sesión (`memory_search`)

---

## Comandos de referencia rápida (vía CLI `klap`)

```bash
# Operaciones principales
klap init      # Inicializa DB, constraints, nodos base y skills
klap sync      # Sincroniza memorias locales pendientes
klap update    # Sincroniza arquitectura de referencia (incremental)
klap rollback  # Revierte configuración y detiene Neo4j

# Scripts directos (avanzado)
.\scripts\windows\brain.bat up/down/status/logs/browser
.\scripts\windows\backup.bat backup/list/restore
```

---

## Problemas conocidos y soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| `No se esperaba REQUIRE` | Community Edition + escaping CMD | Usar `klap init` (usa archivos JSON temporales) |
| `@jovanhsu/mcp-neo4j-memory-server` 404 | Paquete eliminado de npm | Usar `@knowall-ai/mcp-neo4j-agent-memory` |
| MCP aparece como `local` scope | Se registró sin `--scope user` | `claude mcp remove "team-brain"` y re-registrar con `--scope user` |
| Neo4j en loop de restart | Volúmenes corruptos en primer arranque | `docker compose down -v` y volver a levantar |

---

## Contexto del equipo

- **Equipo**: Liquidación SVBO — KLAP BYSF
- **Stack**: Java 21, Spring Boot 3.5.11, Spring Cloud 2025.0.0, Gradle 9
- **Arquitectura**: Microservicios event-driven con Kafka + PostgreSQL Aurora + AWS MSK
- **Microservicios**: 14 servicios, 90% cumple el estándar documentado en la memoria compartida.

---

*Ecosistema Klap · CONTEXT.md v2.0 · Actualizado el 2026-04-21*
