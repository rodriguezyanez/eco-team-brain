# Fase Spec Refactor — Diseño y Planificación para Refactorización de Proyectos Existentes
**Versión:** 1.2 · **Fecha:** 2026-07-13

---

## Propósito y alcance

Este flujo cubre las fases 1 a 3 del proceso SDD adaptado para **refactorización de proyectos existentes**: análisis del estado actual, diseño de la arquitectura objetivo y planificación de la transformación. El resultado es un par de documentos spec que el desarrollador usa como input para el workflow de implementación (fases 4-5).

**Aplica a:** proyectos Java/Spring Boot existentes que requieren modernización, migración de versiones, reestructuración arquitectónica o eliminación de deuda técnica. El scope es intencionalmente Java/Spring Boot — los skills de referencia (processor, repository, webclient, kafka-listener) son específicos de este stack.
**Queda fuera:** desarrollos nuevos (usar `fase_spec.md`), fixes puntuales, hotfixes y proyectos en otros lenguajes (TypeScript, Python) que no usen el stack KLAP BYSF Java.

---

## Activación

El flujo se activa cuando el desarrollador escribe:

```
sdd-refactor: [descripción opcional]
```

El proyecto a analizar es **siempre el directorio de trabajo actual de la sesión** — el agente lo lee directamente sin preguntar la ruta.

Al activarse, el agente hace **una sola pregunta de descubrimiento**:

> "¿Además de refactorizar el código existente, hay nuevos requerimientos a implementar en este mismo componente?
> - Si **sí**: indícame la fuente (issue key de Jira, documento local en el repositorio, o descríbelos aquí directamente)
> - Si **no**: procedemos directamente con el análisis del proyecto"

Con la respuesta del desarrollador se determinan los ámbitos activos para la sesión.

---

## Ámbitos del workflow

| Ámbito | Activación | Descripción |
|--------|-----------|-------------|
| **Ámbito 1 — Refactorización** | Siempre activo | Analizar el código existente, identificar deuda técnica y proponer la arquitectura objetivo alineada al estándar KLAP BYSF |
| **Ámbito 2 — Nuevos requerimientos** | Solo si el dev lo confirma | Incorporar requerimientos funcionales nuevos para el mismo componente, describiendo cómo se implementan sobre la arquitectura objetivo |

Ambos ámbitos se procesan en las mismas tres fases. Los entregables marcados con `[Ámbito 2]` se generan **únicamente** si el dev confirmó que hay nuevos requerimientos.

---

## Fuentes de contexto para nuevos requerimientos (Ámbito 2)

| Fuente | Mecanismo |
|--------|-----------|
| Issue key de Jira | MCP Atlassian — `mcp__claude_ai_Atlassian` |
| Sprint / filtro de proyecto Jira | MCP Atlassian — listar historias, el dev selecciona |
| Documento local en el repositorio | El dev indica la ruta relativa al proyecto |
| Descripción directa | El dev describe los requerimientos nuevos en el chat |

Si se cargan **múltiples issues o documentos**, el agente pregunta si se analizan juntos (un spec consolidado) o por separado.

---

## Flujo de las 3 fases

```
Activación
    ↓
Descubrimiento inicial
    → Leer proyecto local del directorio de trabajo actual
    → Preguntar: ¿hay nuevos requerimientos además de la refactorización?
         ├── Sí → Resolver fuente (Jira / doc local / descripción directa)
         │        [Ámbito 1 + Ámbito 2 activos]
         └── No → [solo Ámbito 1 activo]
    ↓
Fase 1 — Analizar ────────────────────────────────────────────┐
    → Leer código existente del proyecto local                 │
    → Identificar deuda técnica, versiones y patrones actuales │ iteración libre
    → [Ámbito 2] Analizar nuevos requerimientos               │ hasta visto bueno
    → Preguntar solo si hay ambigüedad o info faltante         │
    → Generar entregable                                       │
    → Esperar aprobación del dev ─────────────────────────────┘
    ↓
Fase 2 — Proponer ────────────────────────────────────────────┐
    → Tomar output de Fase 1 como input                        │
    → Definir arquitectura objetivo y estrategia de migración  │ iteración libre
    → [Ámbito 2] Proponer arquitectura para nuevos req        │ hasta visto bueno
    → Preguntar solo si hay ambigüedad o info faltante         │
    → Generar entregable                                       │
    → Esperar aprobación del dev ─────────────────────────────┘
    ↓
Fase 3 — Validar ─────────────────────────────────────────────┐
    → Tomar output de Fases 1 y 2 como input                   │
    → Generar tabla de tareas unificada (columna Ámbito)       │ iteración libre
    → Preguntar solo si hay ambigüedad o info faltante         │ hasta visto bueno
    → Si dev pide más detalle de una tarea: entregarlo         │
    → Esperar aprobación del dev ─────────────────────────────┘
    ↓
Crear archivos spec en /spec (secciones etiquetadas por ámbito)
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

## Fase 1 — Analizar

**Agente:** `sdd-requirements-analyst` · **Modelo:** opus

### Objetivo de la fase

Construir un mapa completo del estado actual del proyecto: qué hace, cómo está estructurado, qué tecnologías usa, qué deuda técnica acumula y qué riesgos presenta la refactorización. Si Ámbito 2 está activo, incorporar también el análisis de los nuevos requerimientos.

### Lectura del código existente

Antes de generar el entregable, el agente **debe leer** al menos:

| Artefacto | Propósito |
|-----------|-----------|
| `pom.xml` / `build.gradle` | Versiones de dependencias, plugins, Java target |
| `application.properties` / `application.yml` | Configuración actual (datasource, kafka, clients) |
| Estructura de paquetes (`src/main/java`) | Arquitectura y separación de capas actual |
| Clases principales (controllers, services, repositories) | Patrones usados, naming, responsabilidades |
| Clases de configuración (`@Configuration`) | Beans, clientes HTTP, Kafka config |
| Tests existentes (`src/test`) | Cobertura y calidad del suite actual |
| `Dockerfile` / `docker-compose.yml` | Infraestructura de ejecución |
| Métodos `@Scheduled` | Detectar jobs batch sin lock distribuido en entornos multi-réplica |
| Loops sobre colecciones de BD (`for` + query) | Detectar N+1 queries y operaciones CPU-bound en memoria |

### Inventario de contratos de entrada/salida

Antes de analizar la deuda técnica, el agente debe **capturar todos los contratos del componente** — toda forma en que recibe datos y produce resultados, sin asumir que es un microservicio REST/Kafka. Este inventario es el "before" contra el que se valida el resultado del refactor. Los artefactos se guardan en `spec/contracts/`.

**Entradas a inventariar:**

| Tipo | Qué capturar |
|------|--------------|
| Mensajes entrantes (Kafka, SQS, RabbitMQ, etc.) | Topic/queue, schema completo (campo → tipo → nullable), key structure, headers |
| HTTP / REST requests | Método, path, headers requeridos, body schema con tipos y ejemplo |
| Archivos leídos (CSV, TXT, JSON, XML, Excel, binario) | Ruta/patrón de nombre, formato, encoding, delimitador, orden de columnas, ejemplo real |
| Triggers de schedule (batch/cron) | Expresión cron, parámetros de entrada si los hay |
| Argumentos de CLI | Nombre, tipo, obligatorio/opcional, ejemplo |
| Variables de entorno que modifican comportamiento | Nombre, valores posibles, efecto en el flujo |
| Reads de caché (Redis u otro) | Key pattern, estructura del value, ejemplo |

**Salidas a inventariar:**

| Tipo | Qué capturar |
|------|--------------|
| Archivos escritos (CSV, TXT, JSON, XML, Excel, PDF, binario) | Ruta/naming convention, formato, encoding, delimitador, orden de columnas, campos obligatorios vs opcionales, **ejemplo real** |
| Documentos JSON o XML producidos | Estructura completa: campos, tipos, nesting, nullability, arrays vs objetos, **ejemplo real** |
| Mensajes publicados (Kafka u otro broker) | Topic, key structure, schema completo, headers, **ejemplo real** |
| HTTP responses | Status codes posibles, body schema completo con tipos, headers en respuesta, **ejemplos por caso** |
| Escrituras a BD | Tabla, columnas escritas, tipos de dato, valores derivados vs recibidos |
| Emails / notificaciones | Destinatario (patrón), subject (patrón), body template, adjuntos posibles |
| FTP / SFTP uploads | Ruta destino, naming convention, formato, encoding |
| Webhooks disparados | URL pattern, método, body schema, headers, ejemplo |
| Entradas de caché escritas | Key pattern, estructura del value, TTL |
| Llamadas a APIs externas (efectos de salida) | Endpoint, método, body enviado, respuesta esperada |

Para cada salida: capturar un **ejemplo real** del artefacto producido y guardarlo en `spec/contracts/[tipo]-[nombre-descriptivo].[ext]`. Si el entorno no permite captura en tiempo real, construir el ejemplo desde el código fuente.

### Preguntas sugeridas al desarrollador

El agente hace estas preguntas **solo si la información no es derivable del código**:

- ¿Hay servicios en producción que consumen este componente y que podrían verse afectados por la refactorización?
- ¿Existe algún contrato externo (API, topic, esquema de BD) que deba preservarse exactamente?
- ¿Hay restricciones de versión impuestas por la plataforma o el equipo de infraestructura?
- ¿Se conocen SLAs o expectativas de rendimiento que la nueva versión deba cumplir?
- ¿Con cuántas réplicas corre el servicio en producción? _(relevante para calibrar urgencia real de race conditions y scheduler sin lock)_
- ¿Hay Redis u otra herramienta de coordinación distribuida disponible en la infraestructura? _(informa las soluciones de concurrencia en Fase 2)_
- `[Ámbito 2]` ¿Los nuevos requerimientos reemplazan o complementan funcionalidades existentes?

### Entregable obligatorio

#### Ámbito 1 — Refactorización

- [ ] **Estado actual del proyecto**
  - Versión de Java y Spring Boot en uso
  - Dependencias principales con versiones
  - Estructura de paquetes actual (árbol simplificado)
  - Patrón arquitectónico actual (MVC clásico, hexagonal, sin capas, monolítico, etc.)
- [ ] **Inventario de componentes existentes**
  - Controllers / Listeners con sus rutas/topics actuales
  - Services / Processors con su lógica de negocio
  - Repositories / DAOs y tecnología de acceso a datos (JPA, JdbcTemplate, MyBatis, etc.)
  - Clientes HTTP externos (RestTemplate, Feign, OkHttp, etc.)
  - Configuraciones relevantes
- [ ] **Deuda técnica identificada** — clasificada por categoría:
  - Versiones obsoletas (Java < 17, Spring Boot < 3.x, dependencias con CVE)
  - Antipatrones de código (God classes, lógica de negocio en controllers, SQL embebido en services, etc.)
  - Ausencia de patrones de resiliencia (sin circuit breaker, sin retry, sin timeout)
  - Acoplamiento alto (dependencias directas a infraestructura, sin abstracciones de interfaz)
  - Cobertura de tests insuficiente o tests frágiles (dependencia de BD real en unitarios, sin mocks)
  - Configuración hardcodeada o credenciales en código
  - Logging insuficiente o ausente (sin MDC, sin correlation ID, sin niveles apropiados)
- [ ] **Comportamiento actual documentado**
  - Flujos de negocio principales (descripción en lenguaje natural)
  - Integraciones externas activas (DBs, APIs, brokers, sistemas legacy)
  - SLAs o expectativas de performance conocidas
  - **Inventario de entradas** — una entrada por fila: tipo, schema/formato, ejemplo
  - **Inventario de salidas** — una salida por fila: tipo, schema/formato, ejemplo, componentes que la consumen
  - Snapshots de contratos guardados en `spec/contracts/` (un archivo por tipo de salida)
- [ ] **Alcance de la refactorización**
  - Qué se mantiene sin cambios (interfaces externas, contratos de BD, topics)
  - Qué se modifica (estructura interna, patrones, versiones)
  - Qué se elimina (código muerto, dependencias obsoletas, configs no usadas)
  - Qué se agrega (nuevo estándar KLAP BYSF, patrones faltantes, tests)
- [ ] **Riesgos de la refactorización**
  - Breaking changes potenciales para consumidores del servicio
  - Dependencias de datos en BD (migraciones necesarias)
  - Compatibilidad entre versiones de dependencias
  - Servicios que consumen este proyecto en producción
- [ ] **Señales de Builder identificadas** — buscar en el código existente:
  - Constructores o métodos con 4+ parámetros **donde al menos 2 son opcionales**, o 6+ parámetros aunque sean todos requeridos
  - Objetos de dominio o DTOs con muchos campos de construcción variable
  - Métodos que arman queries SQL con cláusulas opcionales (`if` + concatenación de strings)
  → Documentar qué objetos y queries son candidatos a Builder en Fase 2. Si no hay ninguno: registrar explícitamente "no aplica"
- [ ] **Operaciones I/O-bound identificadas** — buscar específicamente:
  - Llamadas HTTP externas síncronas dentro de métodos de negocio (`RestTemplate`, `Feign`)
  - Queries a BD dentro de loops o en secuencia sin paralelismo
  - Lecturas de archivos o mensajería bloqueantes en el hilo principal
  → Para cada una: documentar si actualmente es bloqueante y si puede paralelizarse. Si no hay ninguna: registrar "no aplica"
- [ ] **Operaciones CPU-bound identificadas** — buscar:
  - Transformaciones de datos en volumen (mapeos masivos, cálculos intensivos en memoria)
  → Si no hay ninguna: registrar explícitamente "no aplica — no se identificaron operaciones CPU-bound"
- [ ] **Escenarios TOCTOU (check-then-act) identificados** — buscar pares no atómicos:
  - verificar disponibilidad → insertar (sin atomicidad entre los dos pasos)
  - leer estado → actualizar estado (sin lock entre lectura y escritura)
  - comprobar existencia → crear (race condition en inserts concurrentes)
  → Para cada par: documentar qué pasaría si dos instancias del servicio ejecutan simultáneamente
- [ ] **Patrones async sin control de thread pool** — buscar:
  - `CompletableFuture` / `@Async` sin `ThreadPoolTaskExecutor` explícito configurado
  → Si no hay async: registrar "no aplica"
- [ ] **`@Scheduled` sin lock distribuido** — buscar:
  - Métodos anotados con `@Scheduled` en un servicio que corre con N > 1 réplicas
  → Si existe: documentar qué ocurre si N réplicas ejecutan simultáneamente (trabajo duplicado, conflictos de escritura, llamadas triplicadas a APIs externas)
  → Si no hay `@Scheduled`: registrar "no aplica"
- [ ] **Escala horizontal asumida siempre**: toda race condition identificada es real y frecuente en producción — el servicio corre con N réplicas
- [ ] **Casos límite documentados como `CL-XX`** — incluir los defectos típicos del equipo (duplicados, nulos, validación de entrada, casos de borde, trazabilidad, control de acceso) consultando `~/.claude/commands/defectos-tipicos-checklist.md`
- [ ] **Requisitos funcionales de refactorización (RF) con criterios de aceptación (`CA-XX`)** — derivados del comportamiento actual que debe preservarse
- [ ] **Requisitos no funcionales (RNF)** — rendimiento, seguridad, observabilidad objetivo post-refactorización
- [ ] Consulta a Neo4j confirmada (`memory_search`) o fallback a `~/.claude/commands/skill-registry.md`
- [ ] Si el proyecto ya existe en Neo4j: actualizar con estado actual. Si es nuevo registro: crear con `memory_create`

#### Ámbito 2 — Nuevos requerimientos _(solo si está activo)_

- [ ] **Fuente de los nuevos requerimientos** — identificada y cargada (Jira / doc local / descripción)
- [ ] **Nuevos requisitos funcionales (RF-N-XX)** con criterios de aceptación (`CA-N-XX`) — prefijo `N` para distinguirlos de los RF de refactorización
- [ ] **Nuevos casos límite (`CL-N-XX`)** — derivados de los requerimientos nuevos
- [ ] **Análisis de impacto** — cómo los nuevos requerimientos interactúan con el código existente:
  - ¿Requieren nuevas tablas o columnas en BD?
  - ¿Requieren nuevos topics o cambios en el esquema de mensajes?
  - ¿Modifican contratos de API existentes?
- [ ] **Nuevos componentes identificados** — listado de clases/interfaces que no existen aún y deben crearse

---

## Fase 2 — Proponer

**Agente:** `sdd-architecture-designer` · **Modelo:** opus

### Antes de generar — leer skill files obligatorios

El agente debe leer los skills correspondientes a los componentes **que serán creados o modificados** según el análisis de Fase 1. La estructura de paquetes, naming y patrones deben derivarse de estos archivos.

| Componente a refactorizar o crear | Skill a leer |
|----------------------------------|-------------|
| Todo desarrollo (siempre) | `~/.claude/commands/design_patterns/skill.md` |
| Kafka consumer | `~/.claude/commands/kafka-listener.md` |
| Kafka config | `~/.claude/commands/kafka-config.md` |
| Configuración Kafka/ambientes | `~/.claude/commands/spring-properties.md` |
| Lógica de negocio (Saga) | `~/.claude/commands/processor.md` |
| Acceso a datos | `~/.claude/commands/repository.md` |
| Cliente HTTP externo | `~/.claude/commands/webclient.md` |
| Jerarquía de excepciones | `~/.claude/commands/exceptions.md` |
| Endpoints REST | `~/.claude/commands/openapi.md` |

### Estrategia de migración

Antes de proponer la arquitectura objetivo, definir la estrategia de transición:

| Estrategia | Cuándo aplicar |
|------------|---------------|
| **Big Bang** | Proyecto pequeño, sin consumidores en producción, deuda severa que hace inviable lo incremental |
| **Strangler Fig** | Proyecto grande en producción activa — reemplazar módulo por módulo manteniendo la interfaz externa estable |
| **Branch by Abstraction** | Cambios internos de patrones sin alterar interfaces — introducir interfaz, migrar implementación, eliminar legado |
| **Expand-Contract (Parallel Change)** | Cambios en contratos de BD o API — agregar nuevo campo/endpoint, migrar consumidores, eliminar el viejo |

### Identificación de patrones de diseño

Leer `design_patterns/skill.md` y contrastar contra los hallazgos de Fase 1. **Antes de evaluar por categoría, cruzar explícitamente:**

- **Señales de Builder detectadas en Fase 1** → evaluar siempre en Creacionales, incluso si parecen menores. Builder debe aparecer en la tabla de aplicados o descartados.
- **TOCTOU identificados en Fase 1** → evaluar Strategy/State según el tipo de recurso compartido y la frecuencia del acceso concurrente.
- **`@Scheduled` sin lock identificado en Fase 1** → evaluar lock distribuido (Redisson, ShedLock, pg_try_advisory_lock) como parte del diseño de concurrencia.

Luego evaluar por categoría:

- **Creacionales** — ¿La creación de objetos de dominio varía según el tipo de mensaje o contexto? ¿Existen entidades que deben replicarse desde una plantilla base?
- **Estructurales** — ¿Hay subsistemas externos que el resto del código debería consumir sin conocer su complejidad? ¿Se necesita adaptar contratos de interfaces incompatibles?
- **Comportamiento** — ¿La lógica de procesamiento cambia según el estado actual de la entidad o el tipo de evento recibido? ¿Varios componentes necesitan reaccionar ante un mismo cambio? ¿Se requiere registrar, revertir o auditar cambios de estado?

### Análisis de concurrencia y paralelismo

Para cada hallazgo de Fase 1, documentar la decisión tomada con justificación. **No omitir ningún hallazgo** — la ausencia silenciosa no se acepta.

**I/O-bound** — para cada operación identificada en Fase 1:
- ¿Debe ser async? Si **sí**: proponer `CompletableFuture` / `WebClient` + `ThreadPoolTaskExecutor` dedicado especificando `corePoolSize`, `maxPoolSize`, `queueCapacity`, timeout máximo del Future y política de rechazo si el pool se agota.
- Si **no**: justificar por qué síncrono es aceptable (operación rápida, consistencia transaccional requerida, etc.)

**CPU-bound** — para cada operación identificada en Fase 1:
- Evaluar `@Async` + `ThreadPoolTaskExecutor` para aislar del hilo principal de negocio.
- Si no hay operaciones CPU-bound: confirmar explícitamente "no aplica" y no proponer ThreadPoolTaskExecutor innecesario.

**TOCTOU (check-then-act)** — para cada par identificado en Fase 1, documentar las estrategias evaluadas y la elegida:

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `UNIQUE` constraint en BD | Sí | _Elegida / Descartada_ | _Razón_ |
| `SELECT FOR UPDATE` | Sí | _Elegida / Descartada_ | _Razón_ |
| Lock distribuido (Redis) | Sí | _Elegida / Descartada_ | _Razón_ |
| Clave de idempotencia | Sí | _Elegida / Descartada_ | _Razón_ |

**`@Scheduled` sin lock distribuido** — para cada caso identificado en Fase 1, documentar estrategia elegida y alternativas descartadas:

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `Redisson RLock.tryLock()` | Sí | _Elegida / Descartada_ | _Razón_ |
| `ShedLock` (tabla en BD) | Sí | _Elegida / Descartada_ | _Razón_ |
| `pg_try_advisory_lock` | Sí | _Elegida / Descartada_ | _Razón_ |
| Reducir réplicas a 1 solo para el scheduler | Sí | _Elegida / Descartada_ | _Razón_ |

**Si Fase 1 no identificó escenarios de concurrencia:**
Documentar explícitamente: *"No se identificaron race conditions, TOCTOU, @Scheduled sin lock ni operaciones paralelizables. El servicio es stateless y no comparte recursos mutables entre hilos."* Esta justificación es **obligatoria** — la sección no puede quedar vacía ni omitirse.

### Preguntas sugeridas al desarrollador

El agente hace estas preguntas **solo si la información no es derivable del análisis de Fase 1**:

- ¿Hay preferencia entre Big Bang e incremental dado el contexto del equipo y los plazos?
- ¿Existe alguna dependencia de versión de plataforma que limite la versión de Java o Spring Boot objetivo?
- ¿Hay patrones de resiliencia ya estandarizados en el equipo que deban aplicarse?
- ¿Hay Redis u otra herramienta de coordinación distribuida disponible? _(preguntar solo si no se respondió en Fase 1 y hay `@Scheduled` o race conditions que requieren lock distribuido)_
- `[Ámbito 2]` ¿Los nuevos componentes deben integrarse en el mismo paquete de dominio o en uno nuevo?

### Entregable obligatorio

#### Ámbito 1 — Refactorización

- [ ] **Arquitectura objetivo**
  - Arquitectura en capas con separación **global / dominio** y estructura de paquetes completa (`cl.klap.bysf.{modulo}.{aplicacion}` + `dominio/{nombre_dominio}/`)
  - Versión de Java y Spring Boot objetivo
  - Dependencias a actualizar / agregar / eliminar
- [ ] **Skills relevantes leídos y aplicados** — listar cuáles se consultaron
- [ ] **Estrategia de migración** — elegida y justificada (Big Bang / Strangler Fig / Branch by Abstraction / Expand-Contract)
- [ ] **Mapa de transformación** — tabla comparativa estado actual → estado objetivo por componente:

  | Componente actual | Patrón actual | Componente objetivo | Patrón objetivo | Acción |
  |-------------------|---------------|---------------------|-----------------|--------|
  | `XxxService.java` | God class | `XxxProcessor`, `XxxRepository` | Saga + Repository | Dividir |
  | `RestTemplate` bean | Sin resiliencia | `XxxClient` con `WebClient` | Circuit breaker | Reemplazar |
  | Sin tests | — | Suite JUnit 5 + Mockito | TDD | Agregar |

- [ ] **Plan de compatibilidad** — para cada salida del inventario de Fase 1, verificar explícitamente:
  - ¿Se preserva el **formato exacto**? (encoding, delimitador, orden de columnas, extensión de archivo)
  - ¿Se preserva la **estructura del documento**? (mismos campos, mismos tipos, misma nullability, mismo nesting)
  - ¿Se preserva el **naming convention**? (nombre de archivo, key de caché, topic name, path del endpoint)
  - ¿Se preserva el **comportamiento de error**? (mismos códigos, mismos mensajes, mismo formato del body de error)
  - Si hay cambio: ¿estrategia Expand-Contract aplicada? ¿consumidores migrados antes de eliminar el formato viejo?

  Tabla obligatoria — una fila por cada salida del inventario de Fase 1:

  | Salida | Tipo | ¿Se preserva? | Estrategia si cambia |
  |--------|------|--------------|---------------------|
  | `reporte_diario.csv` | Archivo CSV | Sí / No | — / Expand-Contract |
  | Topic `pagos.procesados` | Kafka | Sí / No | — / Expand-Contract |
  | `GET /api/pagos/{id}` response | REST | Sí / No | — / Versionar endpoint |
  | Tabla `pagos` (columnas escritas) | BD | Sí / No | — / Migración Flyway |
  | … | … | … | … |
- [ ] **Contratos de interfaces** con package correcto en cada firma
- [ ] **Decisiones técnicas** con justificación
- [ ] **Patrones de diseño GoF aplicados** — para cada patrón seleccionado: nombre + componente donde aplica + justificación basada en hallazgos de Fase 1
- [ ] **Patrones de diseño GoF evaluados y descartados** — para cada patrón del skill NO aplicado, documentar explícitamente:

  | Patrón | Evaluado | Decisión | Justificación |
  |--------|----------|----------|---------------|
  | Builder | Sí | No aplica | _Ejemplo: DTOs con ≤3 campos; no hay queries con filtros opcionales_ |
  | Singleton | Sí | No aplica | _Spring gestiona el ciclo de vida — no implementar manualmente_ |
  | ... | ... | ... | ... |

  **Regla:** si un patrón no fue evaluado debe marcarse "Pendiente de revisión" — no se acepta omisión silenciosa. Si Builder no aparece en esta tabla, el entregable está incompleto.
- [ ] **Análisis de seguridad**: OWASP Top 10 + amenazas de stack según componentes de Fase 1 (SSRF si hay HTTP externo · deserialización si hay mensajería · SpEL Injection si hay expresiones dinámicas · Mass Assignment si hay REST con binding automático · Actuator si está habilitado) + controles NIST SP 800-53 + técnicas MITRE ATT&CK mapeadas por módulo
- [ ] **Alineación con estándar KLAP BYSF** confirmada
- [ ] **Desviaciones del estándar** explícitamente señaladas (con justificación si aplica al contexto legacy)
- [ ] **Archivos `application-{ambiente}.properties`** diseñados para los 4 ambientes (local/develop/qa/master) — si el microservicio incluye Kafka o cambia configuración significativamente
- [ ] **Modelo de concurrencia** — para cada hallazgo de Fase 1: decisión async/sync + herramienta propuesta (`CompletableFuture`, `WebClient`, `@Async`) con `ThreadPoolTaskExecutor` dimensionado (corePoolSize / maxPoolSize / queueCapacity / timeout / política de rechazo) si aplica
- [ ] **Race conditions** — para cada TOCTOU identificado en Fase 1: tabla de estrategias evaluadas + elegida + descartadas con justificación explícita
- [ ] **Justificación de ausencia de concurrencia** — si no hay operaciones concurrentes ni race conditions: declaración explícita de por qué no aplica. Campo obligatorio — no puede quedar vacío
- [ ] **Plan de rollback** — cómo revertir si la migración falla en producción

#### Ámbito 2 — Nuevos requerimientos _(solo si está activo)_

- [ ] **Nuevos componentes a crear** — con package, nombre de clase y patrón KLAP BYSF aplicado
- [ ] **Contratos de interfaces nuevas** con firma completa
- [ ] **Integración con la arquitectura objetivo** — cómo los nuevos componentes se conectan con los refactorizados (no duplicar capas, reutilizar repositories/clients ya propuestos)
- [ ] **Cambios en BD** requeridos por los nuevos requerimientos (nuevas tablas, columnas, índices, script Flyway)
- [ ] **Cambios en contratos externos** requeridos (nuevos endpoints, nuevos topics, nuevos campos en esquemas existentes)

---

## Fase 3 — Validar

**Agente:** `sdd-task-planner` · **Modelo:** sonnet

### Consideraciones específicas de refactorización

En proyectos de refactorización, los **characterization tests son siempre obligatorios** — capturan el comportamiento actual como contrato ejecutable antes de modificar una sola línea de código. No son opcionales aunque el proyecto ya tenga tests: los tests existentes validan la implementación interna; los characterization tests validan el contrato externo observable.

Debe existir al menos un characterization test por cada tipo de salida del inventario de Fase 1:

| Tipo de salida | Qué debe verificar el characterization test |
|---------------|---------------------------------------------|
| Archivo CSV / TXT | Mismo encoding, delimitador, orden de columnas, naming convention del archivo |
| Documento JSON / XML | Mismo schema: campos, tipos, nullability, nesting |
| Mensaje Kafka / broker | Mismo topic, misma estructura de key, mismo schema de value |
| HTTP response | Mismo status code, mismo body schema, mismos headers relevantes |
| Escritura a BD | Mismas columnas, mismos valores derivados, misma lógica de transformación |
| Email / webhook | Mismo destinatario/URL pattern, mismo body schema |
| Archivo FTP / SFTP | Mismo naming convention, mismo formato, mismo encoding |

### Preguntas sugeridas al desarrollador

El agente hace estas preguntas **solo si hay decisiones de priorización o secuencia que el dev debe tomar**:

- ¿Se implementan primero las tareas de refactorización y luego los nuevos requerimientos, o en paralelo?
- ¿Hay alguna tarea de alto riesgo que el dev quiera revisar antes de incluirla en el sprint?
- ¿El orden de despliegue entre servicios dependientes está acordado con el equipo?

### Entregable obligatorio

- [ ] **Reporte ✅/❌** por cada regla DO/DON'T del equipo
- [ ] **Verificación de naming conventions**
- [ ] **Tabla de tareas atómicas** con orden de dependencias, columna **Ámbito** y columna **Riesgo** — los characterization tests van SIEMPRE como primeras tareas, antes de cualquier tarea de refactorización.

  **Tipos de tarea:**

  | Tipo | Cuándo usar |
  |------|-------------|
  | `Refact.` | Tarea ejecutada por el dev en esta refactorización |
  | `Nuevo req.` | Tarea de Ámbito 2 — nuevo requerimiento |
  | `[EXT]` | Dependencia externa — ejecutada por otro equipo (infra, DevOps, seguridad). Bloquea tareas posteriores pero no la ejecuta el dev. Documentar quién la ejecuta y cómo confirmar que está lista |

  | # | Tipo | Tarea | Depende de | Tamaño | Riesgo | CA/CL | Tests |
  |---|------|-------|-----------|--------|--------|-------|-------|
  | T1 | Refact. | Escribir characterization tests del comportamiento actual | — | M | Bajo | RF-01..N | Integración |
  | T2 | [EXT] | Infraestructura provisiona recurso externo (ej: PostgreSQL, Redis) | T1 | — | Alto | — | Confirmación del equipo de infra |
  | T3 | Refact. | Actualizar `pom.xml`: Java 21 + Spring Boot 3.5.x | T2 | S | Medio | — | Build verde |
  | T4 | Refact. | Crear `XxxRepository` con `JdbcTemplate` | T3 | M | Bajo | CA-03, CL-02 | Unitario + Integración |
  | T5 | Nuevo req. | Crear `XxxProcessor` para RF-N-01 | T4 | M | Bajo | CA-N-01, CL-N-01 | Unitario + Integración |
  | … | … | … | … | … | … | … | … |

- [ ] **Estimación de tamaño por tarea** (S/M/L)
- [ ] **Trazabilidad**: cada tarea referencia sus `CA-XX` / `CA-N-XX` y `CL-XX` / `CL-N-XX`
- [ ] **Nivel de riesgo por tarea** (Bajo / Medio / Alto) con justificación
- [ ] **Plan de tests por tarea** (unitarios e integración distinguidos explícitamente):
  - **Characterization tests del comportamiento actual** — obligatorios siempre; uno por cada tipo de salida del inventario de Fase 1; ejecutados sobre el código ANTES del refactor para establecer el baseline y guardados como suite reutilizable
  - Tests unitarios de la nueva implementación
  - Tests de integración por componente que interactúe con infraestructura externa
  - **Tests de no-regresión de contratos** — la misma suite de characterization tests ejecutada sobre el código refactorizado; deben pasar en verde antes de cerrar la fase
- [ ] **Al menos un test de integración** por cada componente que interactúe con infraestructura externa (broker de mensajes, BD, API HTTP, sistema de archivos)
- [ ] **`~/.claude/commands/sdd-checklist.md`** consultado y reportado
- [ ] **`~/.claude/commands/defectos-tipicos-checklist.md`** consultado: las 6 categorías de defectos típicos verificadas en el plan
- [ ] **Plan de tests incluye escenarios de concurrencia** para componentes I/O-bound
- [ ] **Race conditions cubiertas con tests**: acceso concurrente e idempotencia
- [ ] **Orden de despliegue** definido si hay múltiples módulos o servicios dependientes
- [ ] Si el dev pide más detalle de una tarea: entregarlo antes de cerrar la fase

---

## Archivos de salida

Los archivos se crean en el directorio `spec/` en la raíz del proyecto. Si el directorio no existe, el agente lo crea.

| Archivo / Directorio | Contenido | Naming |
|---------------------|-----------|--------|
| `spec/[nombre-proyecto]-refactor-spec.md` | Análisis + diseño: output de Fases 1 y 2 (estado actual, deuda técnica, arquitectura objetivo, estrategia de migración). Si Ámbito 2 está activo, incluye sección separada con los nuevos requerimientos y su arquitectura. | Nombre del proyecto en kebab-case + `-refactor-spec` |
| `spec/[nombre-proyecto]-refactor-plan.md` | Plan de trabajo: output de Fase 3 (tabla de tareas unificada con columna Ámbito, tests, trazabilidad, rollback). Ambos ámbitos conviven en una sola tabla ordenada por dependencias. | Nombre del proyecto en kebab-case + `-refactor-plan` |
| `spec/contracts/` | Snapshots de los contratos actuales: un archivo por cada tipo de salida del inventario de Fase 1 (ejemplo real o schema construido desde código). Son el "before" contra el que se ejecutan los characterization tests post-refactor. | `[tipo]-[nombre-descriptivo].[ext]` — ej: `csv-reporte-diario.csv`, `json-response-pago.json`, `kafka-schema-pagos-procesados.json`, `xml-mensaje-salida.xml` |

**Ejemplo:** para el proyecto `tarifa-service` los archivos serían:
```
spec/tarifa-service-refactor-spec.md   ← secciones: [Ámbito 1] Refactorización / [Ámbito 2] Nuevos requerimientos
spec/tarifa-service-refactor-plan.md   ← tabla unificada con columna Ámbito por tarea
```

---

## Integración con Neo4j y skill registry

| Situación | Acción |
|-----------|--------|
| Neo4j disponible | `memory_search("[dominio]")` + `memory_search("Reglas DO")` + `memory_search("Reglas DONT")` |
| Neo4j no disponible | Avisar al dev + leer `~/.claude/commands/skill-registry.md` como fallback |
| Proyecto existente en Neo4j | Actualizar nodo con versión objetivo y deuda técnica identificada |
| Proyecto sin registro en Neo4j | Crear con `memory_create` al completar Fase 1 |
| Pendientes de sync | Escribir en `~/.claude/pending-memories.jsonl` para sync posterior |

---

## Context7 — documentación en tiempo real

Usar `use context7` al comparar versiones o trabajar con APIs del stack para obtener docs de la versión exacta a la que se migra:

| Librería | Versión objetivo |
|----------|-----------------|
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
| `~/.claude/commands/design_patterns/skill.md` | Siempre en Fase 2 — antes de proponer arquitectura objetivo |
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
| `~/.claude/commands/defectos-tipicos-checklist.md` | En Fase 1 (identificar CL-XX en comportamiento actual) y Fase 3 (verificar cobertura del plan) |
