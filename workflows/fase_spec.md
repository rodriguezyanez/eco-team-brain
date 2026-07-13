# Fase Spec — Diseño y Planificación SDD
**Versión:** 2.1 · **Fecha:** 2026-07-13

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
- [ ] Mecanismos de integración asíncrona identificados (topics/queues de entrada, salida, DLQ) — si la arquitectura incluye mensajería
- [ ] Tablas PostgreSQL que gestiona
- [ ] Servicios externos que consume (HTTP, gRPC, mensajería saliente, SDK externo, etc.)
- [ ] Componentes a crear y sus dependencias
- [ ] **Candidatos a Builder identificados en los requerimientos** — al analizar CAs y RFs, documentar:
  - Objetos de dominio con 4+ campos donde al menos 2 son opcionales según los CAs
  - Queries de búsqueda con 3+ filtros opcionales descritos en los requerimientos
  → Documentar para que Fase 2 los diseñe con Builder desde el inicio. Si no hay ninguno: registrar "no aplica"
- [ ] Requisitos funcionales (RF) con criterios de aceptación (`CA-XX`)
- [ ] Requisitos no funcionales (RNF)
- [ ] **Operaciones I/O-bound identificadas en el diseño propuesto:**
  - Llamadas HTTP a servicios externos
  - Queries a BD en secuencia que podrían paralelizarse
  - Lecturas de mensajería o archivos en el hilo principal
  → Para cada una: documentar si debe ser async o síncrona y por qué. Si no hay ninguna: registrar "no aplica"
- [ ] **Operaciones CPU-bound identificadas en el diseño propuesto:**
  - Transformaciones de datos en volumen, cálculos intensivos, generación de archivos (PDF, imágenes)
  → Si no hay ninguna: registrar explícitamente "no aplica"
- [ ] **Escenarios TOCTOU (check-then-act) potenciales en el diseño:**
  - ¿Hay pares verificar→crear o leer→actualizar que podrían ejecutarse simultáneamente en N réplicas?
  - ¿Hay recursos compartidos que múltiples instancias podrían modificar en paralelo?
  → Para cada par: documentar qué ocurriría si dos instancias ejecutan simultáneamente
- [ ] **Si el diseño incluye `@Scheduled`:** documentar réplicas previstas y requerimiento de lock distribuido desde el inicio
  → Si no hay `@Scheduled`: registrar "no aplica"
- [ ] **Escala horizontal asumida siempre:** el nuevo servicio correrá con N réplicas — diseñar concurrencia en consecuencia
- [ ] Casos límite documentados como `CL-XX` (formatos incorrectos, nulos, rangos fuera de límite, caracteres especiales)
- [ ] Defectos típicos del equipo cubiertos como `CL-XX`: duplicados, nulos, validación de entrada, casos de borde, trazabilidad, control de acceso — consultar `~/.claude/commands/defectos-tipicos-checklist.md` para verificar que las 6 categorías están representadas
- [ ] Consulta a Neo4j confirmada (`memory_search`) o fallback a `~/.claude/commands/skill-registry.md`
- [ ] Si proyecto nuevo: registrado en Neo4j al completar

### Preguntas sugeridas al desarrollador

El agente hace estas preguntas **solo si la información no es derivable del contexto**:

- ¿Con cuántas réplicas correrá el servicio en producción? _(relevante para calibrar urgencia real de concurrencia y scheduler sin lock)_
- ¿Hay Redis u otra herramienta de coordinación distribuida disponible en la infraestructura? _(informa las soluciones de concurrencia en Fase 2)_

---

## Fase 2 — Proponer

**Agente:** `sdd-architecture-designer` · **Modelo:** opus

### Antes de generar — leer skill files obligatorios

El agente debe leer los skills correspondientes a los componentes identificados en Fase 1 **antes** de proponer la arquitectura. La estructura de paquetes, naming y patrones deben derivarse de estos archivos, no de conocimiento general.

| Componente identificado en Fase 1 | Skill a leer |
|----------------------------------|-------------|
| Todo desarrollo nuevo (siempre) | `~/.claude/commands/design_patterns/skill.md` |
| Kafka consumer | `~/.claude/commands/kafka-listener.md` |
| Kafka config | `~/.claude/commands/kafka-config.md` |
| Configuración de microservicio con Kafka | `~/.claude/commands/spring-properties.md` |
| Lógica de negocio (Saga) | `~/.claude/commands/processor.md` |
| Acceso a datos | `~/.claude/commands/repository.md` |
| Cliente HTTP externo | `~/.claude/commands/webclient.md` |
| Jerarquía de excepciones | `~/.claude/commands/exceptions.md` |
| Endpoints REST | `~/.claude/commands/openapi.md` |

### Identificación de patrones de diseño

Leer `design_patterns/skill.md` y contrastar contra los requerimientos de Fase 1. Si existe ambigüedad sobre el comportamiento del dominio, usar estas guías para identificar qué patrones proponer en la arquitectura:

Antes de evaluar por categoría, cruzar explícitamente con los hallazgos de Fase 1:
- **Candidatos a Builder detectados en Fase 1** → evaluar siempre en Creacionales. Builder debe aparecer en la tabla de aplicados o descartados.
- **TOCTOU identificados en Fase 1** → evaluar Strategy/State según el tipo de recurso compartido y la frecuencia del acceso concurrente.
- **`@Scheduled` en el diseño** → evaluar lock distribuido como parte del diseño de concurrencia.

Luego evaluar por categoría:

- **Creacionales** — ¿La creación de objetos de dominio varía según el tipo de mensaje o contexto? ¿Existen entidades que deben replicarse desde una plantilla base?
- **Estructurales** — ¿Hay subsistemas externos (APIs, Kafka, BD) que el resto del código debería consumir sin conocer su complejidad? ¿Se necesita adaptar contratos de interfaces incompatibles?
- **Comportamiento** — ¿La lógica de procesamiento cambia según el estado actual de la entidad o el tipo de evento recibido? ¿Varios componentes necesitan reaccionar ante un mismo cambio? ¿Se requiere registrar, revertir o auditar cambios de estado? ¿Existe una secuencia de pasos con variantes por tipo?

### Análisis de concurrencia y paralelismo

Para cada hallazgo de Fase 1, documentar la decisión tomada con justificación. **No omitir ningún hallazgo** — la ausencia silenciosa no se acepta.

**I/O-bound** — para cada operación identificada en Fase 1:
- ¿Debe ser async? Si **sí**: proponer `CompletableFuture` / `WebClient` + `ThreadPoolTaskExecutor` dedicado especificando `corePoolSize`, `maxPoolSize`, `queueCapacity`, timeout máximo del Future y política de rechazo si el pool se agota.
- Si **no**: justificar por qué síncrono es aceptable (operación rápida, consistencia transaccional requerida, etc.)

**CPU-bound** — para cada operación identificada en Fase 1:
- Evaluar `@Async` + `ThreadPoolTaskExecutor` para aislar del hilo principal.
- Si no hay operaciones CPU-bound: confirmar explícitamente "no aplica" y no proponer ThreadPoolTaskExecutor innecesario.

**TOCTOU (check-then-act)** — para cada par identificado en Fase 1, documentar las estrategias evaluadas y la elegida:

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `UNIQUE` constraint en BD | Sí | _Elegida / Descartada_ | _Razón_ |
| `SELECT FOR UPDATE` | Sí | _Elegida / Descartada_ | _Razón_ |
| Lock distribuido (Redis) | Sí | _Elegida / Descartada_ | _Razón_ |
| Clave de idempotencia | Sí | _Elegida / Descartada_ | _Razón_ |

**`@Scheduled` sin lock distribuido** — si el diseño incluye `@Scheduled`, documentar estrategia elegida y alternativas descartadas:

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `Redisson RLock.tryLock()` | Sí | _Elegida / Descartada_ | _Razón_ |
| `ShedLock` (tabla en BD) | Sí | _Elegida / Descartada_ | _Razón_ |
| `pg_try_advisory_lock` | Sí | _Elegida / Descartada_ | _Razón_ |
| Reducir réplicas a 1 solo para el scheduler | Sí | _Elegida / Descartada_ | _Razón_ |

**Si Fase 1 no identificó escenarios de concurrencia:**
Documentar explícitamente: *"No se identificaron race conditions, TOCTOU, @Scheduled ni operaciones paralelizables. El servicio es stateless y no comparte recursos mutables entre hilos."* Esta justificación es **obligatoria** — la sección no puede quedar vacía ni omitirse.

### Entregable obligatorio

- [ ] Skills relevantes leídos y aplicados — listar cuáles se consultaron
- [ ] **Patrones de diseño GoF aplicados** — nombre + componente + justificación basada en hallazgos de Fase 1
- [ ] **Patrones de diseño GoF evaluados y descartados** — tabla obligatoria para cada patrón NO aplicado:

  | Patrón | Evaluado | Decisión | Justificación |
  |--------|----------|----------|---------------|
  | Builder | Sí | _Aplica / No aplica_ | _Razón_ |
  | ...    | ... | ... | ... |

  **Regla:** ningún patrón puede omitirse en silencio. Si Builder no aparece en esta tabla, el entregable está incompleto.
- [ ] Arquitectura en capas con separación **global / dominio** y estructura de paquetes completa (`cl.klap.bysf.{modulo}.{aplicacion}` + `dominio/{nombre_dominio}/`)
- [ ] Contratos de interfaces con package correcto en cada firma
- [ ] Decisiones técnicas con justificación
- [ ] Análisis de seguridad: OWASP Top 10 + amenazas de stack según componentes identificados en Fase 1 (SSRF si hay HTTP externo · deserialización de mensajes/datos si hay mensajería o datos serializados · SpEL Injection si hay expresiones dinámicas · Mass Assignment si hay REST con binding automático · Actuator si está habilitado) + controles NIST SP 800-53 + técnicas MITRE ATT&CK mapeadas por módulo
- [ ] Alineación con estándar KLAP BYSF confirmada
- [ ] Desviaciones del estándar explícitamente señaladas
- [ ] Archivos `application-{ambiente}.properties` diseñados para los 4 ambientes (local/develop/qa/master) — si el microservicio incluye Kafka
- [ ] **Modelo de concurrencia** — para cada hallazgo de Fase 1: decisión async/sync + herramienta propuesta (`CompletableFuture`, `WebClient`, `@Async`) con `ThreadPoolTaskExecutor` dimensionado (corePoolSize / maxPoolSize / queueCapacity / timeout / política de rechazo) si aplica
- [ ] **Race conditions** — para cada TOCTOU identificado en Fase 1: tabla de estrategias evaluadas + elegida + descartadas con justificación explícita
- [ ] **Justificación de ausencia de concurrencia** — si no hay operaciones concurrentes ni race conditions: declaración explícita de por qué no aplica. Campo obligatorio — no puede quedar vacío

---

## Fase 3 — Validar

**Agente:** `sdd-task-planner` · **Modelo:** sonnet

### Entregable obligatorio

- [ ] Reporte ✅/❌ por cada regla DO/DON'T del equipo
- [ ] Verificación de naming conventions
- [ ] **Tabla de tareas atómicas** con orden de dependencias y columna **Tipo**:

  **Tipos de tarea:**

  | Tipo | Cuándo usar |
  |------|-------------|
  | `Nuevo` | Tarea ejecutada por el dev — nueva funcionalidad |
  | `[EXT]` | Dependencia externa — ejecutada por otro equipo (infra, DevOps, seguridad). Bloquea tareas posteriores pero no la ejecuta el dev. Documentar quién la ejecuta y cómo confirmar que está lista |

- [ ] Estimación de tamaño por tarea (S/M/L)
- [ ] Trazabilidad: cada tarea referencia sus `CA-XX` y `CL-XX`
- [ ] Plan de tests por tarea (unitarios e integración distinguidos explícitamente)
- [ ] Al menos un test de integración por cada componente que interactúe con infraestructura externa (broker de mensajes, BD, API HTTP, sistema de archivos, u otro recurso externo identificado en Fase 1)
- [ ] `~/.claude/commands/sdd-checklist.md` consultado y reportado
- [ ] `~/.claude/commands/defectos-tipicos-checklist.md` consultado: las 6 categorías de defectos típicos verificadas en el plan — si alguna no está cubierta, consultar al dev con las preguntas sugeridas antes de cerrar el plan
- [ ] Plan de tests incluye escenarios de concurrencia para componentes I/O-bound (ejecución paralela, orden de resolución, timeout handling)
- [ ] Race conditions cubiertas con tests: acceso concurrente al mismo recurso e idempotencia verificada si el componente puede recibir la misma operación más de una vez
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
| `~/.claude/commands/design_patterns/skill.md` | Siempre en Fase 2 — antes de proponer arquitectura |
| `~/.claude/commands/kafka-config.md` | Antes de proponer `XxxKafkaConfig` |
| `~/.claude/commands/kafka-listener.md` | Antes de proponer `XxxKafkaListener` |
| `~/.claude/commands/processor.md` | Antes de proponer `XxxProcessor/XxxProcessorImpl` |
| `~/.claude/commands/repository.md` | Antes de proponer `XxxRepository` |
| `~/.claude/commands/webclient.md` | Antes de proponer `XxxClient` o `XxxClientConfig` |
| `~/.claude/commands/exceptions.md` | Antes de definir jerarquía de excepciones |
| `~/.claude/commands/testing.md` | Antes de definir plan de tests |
| `~/.claude/commands/openapi.md` | Antes de proponer `OpenApiConfig` |
| `~/.claude/commands/spring-properties.md` | Antes de proponer configuración Kafka/ambientes |
| `~/.claude/commands/sdd-checklist.md` | En Fase 3 (validación) |
| `~/.claude/commands/defectos-tipicos-checklist.md` | En Fase 1 (verificar CL-XX por categoría) y Fase 3 (verificar cobertura del plan) |
