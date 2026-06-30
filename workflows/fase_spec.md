# Fase Spec — Diseño y Planificación SDD
**Versión:** 1.0 · **Fecha:** 2026-06-04

---

## Propósito y alcance

Este flujo cubre las fases 1 a 3 del proceso SDD: análisis de requerimientos, diseño de arquitectura y planificación de tareas. El resultado es un par de documentos spec que el desarrollador usa como input para el workflow de implementación (fases 4-5).

**Aplica a:** desarrollos nuevos — nuevos microservicios o nuevas funcionalidades.
**Queda fuera:** fixes, hotfixes y mantenciones de sistemas ya desarrollados.

---

## Activación

El flujo se activa cuando el desarrollador escribe:

```
sdd: [descripción opcional]
```

Si no se incluye descripción ni fuente de contexto, el agente **debe preguntar al inicio**:

> "¿Desde dónde levantamos el contexto? Puedes indicarme:
> - Un issue key de Jira (ej. `KLAP-123`)
> - Un sprint o filtro de proyecto en Jira
> - Un documento o archivo de contexto
> - Una descripción directa aquí"

---

## Fuentes de contexto soportadas

| Fuente | Mecanismo |
|--------|-----------|
| Issue key de Jira | MCP Atlassian — `mcp__claude_ai_Atlassian` |
| Sprint / filtro de proyecto Jira | MCP Atlassian — listar historias, el dev selecciona |
| Documento externo | El dev indica la ruta o pega el contenido |
| Descripción directa | El dev describe el feature en el chat |

Si se cargan **múltiples historias de Jira**, el agente pregunta si se analizan juntas (un spec consolidado) o por separado (un spec por historia).

---

## Flujo de las 3 fases

```
Activación
    ↓
Resolver fuente de contexto (Jira / doc / descripción)
    ↓
Fase 1 — Explorar ────────────────────────────────────────┐
    → Leer contexto                                        │
    → Preguntar solo si hay ambigüedad o info faltante     │ iteración libre
    → Generar entregable                                   │ hasta visto bueno
    → Esperar aprobación del dev ──────────────────────────┘
    ↓
Fase 2 — Proponer ────────────────────────────────────────┐
    → Tomar output de Fase 1 como input                    │
    → Preguntar solo si hay ambigüedad o info faltante     │ iteración libre
    → Generar entregable                                   │ hasta visto bueno
    → Esperar aprobación del dev ──────────────────────────┘
    ↓
Fase 3 — Validar ─────────────────────────────────────────┐
    → Tomar output de Fases 1 y 2 como input               │
    → Preguntar solo si hay ambigüedad o info faltante     │ iteración libre
    → Generar entregable                                   │ hasta visto bueno
    → Si dev pide más detalle de una tarea: entregarlo     │
    → Esperar aprobación del dev ──────────────────────────┘
    ↓
Crear archivos spec en directorio /spec
    ↓
FIN — el dev gatilla manualmente el workflow de implementación
```

---

## Reglas de iteración

- El proceso **no avanza a la siguiente fase** sin aprobación explícita del desarrollador.
- El proceso **no termina** sin aprobación explícita del desarrollador en Fase 3.
- El agente hace preguntas **solo si detecta ambigüedad o información faltante** — no hay un set fijo de preguntas obligatorias.
- Si el desarrollador **pide más detalle sobre una tarea** en Fase 3, el agente lo entrega antes de dar el proceso por terminado.
- La cantidad de rondas de iteración por fase es **libre** — el dev itera hasta quedar conforme.

---

## Fase 1 — Explorar

**Agente:** `sdd-requirements-analyst` · **Modelo:** opus

### Entregable obligatorio

- [ ] Responsabilidad del microservicio en el dominio
- [ ] Topics Kafka involucrados (input, output, DLQ, notificación)
- [ ] Tablas PostgreSQL que gestiona
- [ ] Servicios externos que consume (WebClient)
- [ ] Componentes a crear y sus dependencias
- [ ] Requisitos funcionales (RF) con criterios de aceptación (`CA-XX`)
- [ ] Requisitos no funcionales (RNF)
- [ ] Casos límite documentados como `CL-XX` (formatos incorrectos, nulos, rangos fuera de límite, caracteres especiales)
- [ ] Defectos típicos del equipo cubiertos como `CL-XX`: duplicados, nulos, validación de entrada, casos de borde, trazabilidad, control de acceso — consultar `~/.claude/commands/defectos-tipicos-checklist.md` para verificar que las 6 categorías están representadas
- [ ] Consulta a Neo4j confirmada (`memory_search`) o fallback a `~/.claude/commands/skill-registry.md`
- [ ] Si proyecto nuevo: registrado en Neo4j al completar

---

## Fase 2 — Proponer

**Agente:** `sdd-architecture-designer` · **Modelo:** opus

### Antes de generar — leer skill files obligatorios

El agente debe leer los skills correspondientes a los componentes identificados en Fase 1 **antes** de proponer la arquitectura. La estructura de paquetes, naming y patrones deben derivarse de estos archivos, no de conocimiento general.

| Componente identificado en Fase 1 | Skill a leer |
|----------------------------------|-------------|
| Kafka consumer | `~/.claude/commands/kafka-listener.md` |
| Kafka config | `~/.claude/commands/kafka-config.md` |
| Lógica de negocio (Saga) | `~/.claude/commands/processor.md` |
| Acceso a datos | `~/.claude/commands/repository.md` |
| Cliente HTTP externo | `~/.claude/commands/webclient.md` |
| Jerarquía de excepciones | `~/.claude/commands/exceptions.md` |
| Endpoints REST | `~/.claude/commands/openapi.md` |

### Entregable obligatorio

- [ ] Skills relevantes leídos y aplicados — listar cuáles se consultaron
- [ ] Arquitectura en capas con separación **global / dominio** y estructura de paquetes completa (`cl.klap.bysf.{modulo}.{aplicacion}` + `dominio/{nombre_dominio}/`)
- [ ] Contratos de interfaces con package correcto en cada firma
- [ ] Decisiones técnicas con justificación
- [ ] Patrones de diseño aplicados
- [ ] Análisis de seguridad: OWASP Top 10 + amenazas de stack (SSRF, SpEL, deserialización Kafka, Mass Assignment, Actuator) + controles NIST SP 800-53 + técnicas MITRE ATT&CK mapeadas por módulo
- [ ] Alineación con estándar KLAP BYSF confirmada
- [ ] Desviaciones del estándar explícitamente señaladas

---

## Fase 3 — Validar

**Agente:** `sdd-task-planner` · **Modelo:** sonnet

### Entregable obligatorio

- [ ] Reporte ✅/❌ por cada regla DO/DON'T del equipo
- [ ] Verificación de naming conventions
- [ ] Tabla de tareas atómicas con orden de dependencias
- [ ] Estimación de tamaño por tarea (S/M/L)
- [ ] Trazabilidad: cada tarea referencia sus `CA-XX` y `CL-XX`
- [ ] Plan de tests por tarea (unitarios e integración distinguidos explícitamente)
- [ ] Al menos un test de integración por cada componente que interactúe con infraestructura externa (Kafka, PostgreSQL, WebClient)
- [ ] `~/.claude/commands/sdd-checklist.md` consultado y reportado
- [ ] `~/.claude/commands/defectos-tipicos-checklist.md` consultado: las 6 categorías de defectos típicos verificadas en el plan — si alguna no está cubierta, consultar al dev con las preguntas sugeridas antes de cerrar el plan
- [ ] Si el dev pide más detalle de una tarea: entregarlo antes de cerrar la fase

---

## Archivos de salida

Los archivos se crean en el directorio `spec/` en la raíz del proyecto. Si el directorio no existe, el agente lo crea.

| Archivo | Contenido | Naming |
|---------|-----------|--------|
| `spec/[nombre-proyecto]-spec.md` | Diseño: output de Fases 1 y 2 (requerimientos + arquitectura) | Nombre del proyecto en kebab-case + `-spec` |
| `spec/[nombre-proyecto]-plan.md` | Plan de trabajo: output de Fase 3 (tabla de tareas, tests, trazabilidad) | Nombre del proyecto en kebab-case + `-plan` |

**Ejemplo:** para el proyecto `tarifa-service` los archivos serían:
```
spec/tarifa-service-spec.md
spec/tarifa-service-plan.md
```

---

## Integración con Neo4j y skill registry

| Situación | Acción |
|-----------|--------|
| Neo4j disponible | `memory_search("[dominio]")` + `memory_search("Reglas DO")` + `memory_search("Reglas DONT")` |
| Neo4j no disponible | Avisar al dev + leer `~/.claude/commands/skill-registry.md` como fallback |
| Proyecto nuevo | Registrar en Neo4j al completar Fase 1 con `memory_create` |
| Pendientes de sync | Escribir en `~/.claude/pending-memories.jsonl` para sync posterior |

---

## Context7 — documentación en tiempo real

Usar `use context7` al trabajar con APIs del stack para obtener docs de la versión exacta instalada:

| Librería | Versión |
|----------|---------|
| Spring Boot | 3.5.14 |
| Spring Kafka | spring-kafka |
| Resilience4j | 2.2.0 |
| WebClient | spring-webflux |
| springdoc-openapi | 2.8.12 |

---

## Skill files de referencia

| Skill | Cuándo leerlo |
|-------|--------------|
| `~/.claude/commands/skill-registry.md` | Siempre primero en modo fallback |
| `~/.claude/commands/kafka-config.md` | Antes de proponer `XxxKafkaConfig` |
| `~/.claude/commands/kafka-listener.md` | Antes de proponer `XxxKafkaListener` |
| `~/.claude/commands/processor.md` | Antes de proponer `XxxProcessor/XxxProcessorImpl` |
| `~/.claude/commands/repository.md` | Antes de proponer `XxxRepository` |
| `~/.claude/commands/webclient.md` | Antes de proponer `XxxClient` o `XxxClientConfig` |
| `~/.claude/commands/exceptions.md` | Antes de definir jerarquía de excepciones |
| `~/.claude/commands/testing.md` | Antes de definir plan de tests |
| `~/.claude/commands/openapi.md` | Antes de proponer `OpenApiConfig` |
| `~/.claude/commands/sdd-checklist.md` | En Fase 3 (validación) |
| `~/.claude/commands/defectos-tipicos-checklist.md` | En Fase 1 (verificar CL-XX por categoría) y Fase 3 (verificar cobertura del plan) |
