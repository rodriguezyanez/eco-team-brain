# SDD Workflow — Protocolo de referencia KLAP BYSF
**Versión:** 3.0 · **Fuente:** CLAUDE.md · **Actualizado:** 2026-06-01

---

## Activación

El flujo SDD se activa cuando el dev escribe:
```
sdd: [descripción de la funcionalidad a implementar]
```

El agente `sdd-orchestrator` coordina las 5 fases en secuencia estricta.

---

## Las 5 fases

| Fase | Nombre | Agente alias | Agente canónico | Modelo | Pausa obligatoria |
|------|--------|-------------|-----------------|--------|-------------------|
| 1 | Explorar | `sdd-analyst` | `sdd-requirements-analyst` | opus | ✅ Sí — esperar `ok` del dev |
| 2 | Proponer | `sdd-architect` | `sdd-architecture-designer` | opus | ✅ Sí — esperar `ok` del dev |
| 3 | Validar | `sdd-planner` | `sdd-task-planner` | sonnet | ✅ Sí — esperar `ok` del dev |
| 4 | Implementar | `sdd-implementer` | `tdd-implementer` | sonnet | ❌ No |
| 4.5 | Security Gate | — | `static-security-auditor` | opus | ❌ No (bloquea si CRITICAL/HIGH) |
| 5 | Verificar | — | `sdd-validator` | sonnet | ❌ No (ciclo hasta 100% verde) |

---

## Criterios de entregable por fase

### Fase 1 — Explorar (`sdd-requirements-analyst`)
Debe incluir obligatoriamente:
- [ ] Responsabilidad del microservicio en el dominio
- [ ] Topics Kafka involucrados (input, output, DLQ, notificación)
- [ ] Tablas PostgreSQL que gestiona
- [ ] Servicios externos que consume (WebClient)
- [ ] Componentes a crear y sus dependencias
- [ ] Requisitos funcionales (RF) con criterios de aceptación (`CA-XX`)
- [ ] Requisitos no funcionales (RNF)
- [ ] Casos límite documentados como `CL-XX` (formatos incorrectos, nulos, rangos fuera de límite, caracteres especiales)
- [ ] Consulta a Neo4j confirmada (`memory_search`) o fallback a `skill-registry.md`
- [ ] Si proyecto nuevo: registrado en Neo4j al completar

### Fase 2 — Proponer (`sdd-architecture-designer`)
Debe incluir obligatoriamente:
- [ ] Arquitectura en capas con estructura de paquetes
- [ ] Contratos de interfaces (firmas de métodos públicos)
- [ ] Decisiones técnicas con justificación
- [ ] Patrones de diseño aplicados
- [ ] Análisis de seguridad: OWASP Top 10 + amenazas de stack (SSRF, SpEL, deserialización Kafka, Mass Assignment, Actuator) + controles NIST SP 800-53 + técnicas MITRE ATT&CK mapeadas por módulo
- [ ] Alineación con estándar KLAP BYSF confirmada
- [ ] Desviaciones del estándar explícitamente señaladas

### Fase 3 — Validar (`sdd-task-planner`)
Debe incluir obligatoriamente:
- [ ] Reporte ✅/❌ por cada regla DO/DON'T del equipo
- [ ] Verificación de naming conventions
- [ ] Tabla de tareas atómicas con orden de dependencias
- [ ] Estimación de tamaño por tarea (S/M/L)
- [ ] Trazabilidad: cada tarea referencia sus `CA-XX` y `CL-XX`
- [ ] Plan de tests por tarea (unitarios e integración distinguidos explícitamente)
- [ ] Al menos un test de integración por cada componente que interactúe con infraestructura externa (Kafka, PostgreSQL, WebClient)
- [ ] `~/.claude/commands/sdd-checklist.md` consultado y reportado
- [ ] `~/.claude/commands/defectos-tipicos-checklist.md` consultado: las 6 categorías de defectos típicos verificadas en el plan — si alguna no está cubierta, consultar al dev con las preguntas sugeridas antes de cerrar el plan

### Fase 4 — Implementar (`tdd-implementer`)
Debe incluir obligatoriamente:
- [ ] Ciclo Red-Green-Refactor por cada tarea del plan
- [ ] JavaDoc en todos los métodos públicos
- [ ] Naming conventions seguidas
- [ ] Sin placeholders ni TODOs sin reportar
- [ ] Autocheck de calidad al finalizar cada tarea
- [ ] Skill file correspondiente leído antes de generar código

### Fase 4.5 — Security Gate (`static-security-auditor`)
Debe incluir obligatoriamente:
- [ ] Análisis estático ejecutado sobre todo el código de Fase 4
- [ ] OWASP Top 10 verificado (A01–A10 de 2021)
- [ ] Amenazas de stack verificadas: SSRF (CWE-918), deserialización Kafka (CWE-502), SpEL Injection (CWE-917), Mass Assignment (CWE-915), Actuator expuesto (CWE-200)
- [ ] NIST SP 800-53: controles AC-3, AU-3, SC-8 evaluados
- [ ] MITRE ATT&CK: técnicas T1190, T1552, T1059 descartadas
- [ ] Sin findings CRITICAL ni HIGH sin resolver — bloquean el avance a Fase 5
- [ ] Findings MEDIUM/LOW documentados como observaciones — no bloquean

### Fase 5 — Verificar (`sdd-validator`)
Debe incluir obligatoriamente:
- [ ] Cobertura de cada `CA-XX` con su test correspondiente
- [ ] Cobertura de cada `CL-XX` con su test correspondiente
- [ ] Tests unitarios 100% en verde (`./mvnw test` sin failures)
- [ ] Tests de integración 100% en verde (`./mvnw verify` sin failures)
- [ ] Resultado de ejecución verificado — cobertura de código ≥95% como métrica secundaria, pero tests en rojo = desarrollo NO terminado sin excepciones
- [ ] JavaDoc completo verificado
- [ ] Naming conventions verificadas
- [ ] Reglas DO/DON'T re-chequeadas
- [ ] `~/.claude/commands/sdd-checklist.md` Fase 5 consultado
- [ ] `~/.claude/commands/defectos-tipicos-checklist.md` verificado: las 6 categorías de defectos típicos resueltas en la implementación
- [ ] Resultado final: ✅ "Implementación verificada" o lista de defectos con routing

---

## Ciclo Fase 4 → Security Gate → Fase 5

```
Fase 4 (implementer) → Security Gate (static-security-auditor) → Fase 5 (validator)
        ↑                         |                                       |
        |   CRITICAL/HIGH         |                                       |
        └─────────────────────────┘        test failures / defects        |
                                           ←──────────────────────────────┘
```

- **Security Gate bloquea** si hay findings CRITICAL o HIGH → vuelve a Fase 4
- **Security Gate pasa** (solo MEDIUM/LOW o cero findings) → avanza a Fase 5
- **Fase 5 bloquea** si hay tests en rojo o defectos → vuelve a Fase 4
- El desarrollo está terminado solo cuando Security Gate pasa Y todos los tests están 100% en verde

---

## Matriz de routing de defectos

| Tipo de defecto | Fase destino | Agente |
|-----------------|-------------|--------|
| Análisis de dominio incompleto o incorrecto | Fase 1 | `sdd-requirements-analyst` |
| Problema de arquitectura o diseño | Fase 2 | `sdd-architecture-designer` |
| Gap en checklist o planificación | Fase 3 | `sdd-task-planner` |
| Calidad de código, JavaDoc, naming, lógica | Fase 4 | `tdd-implementer` |
| Test unitario falla (assertion incorrecta o lógica rota) | Fase 4 | `tdd-implementer` — incluir nombre del test, assertion que falla y stacktrace |
| Test de integración falla por configuración de infraestructura o contrato entre servicios | Fase 2 | `sdd-architecture-designer` — incluir nombre del test, error de conexión/contrato y stacktrace |
| Finding CRITICAL/HIGH en Security Gate (OWASP/NIST/MITRE) | Fase 4 | `tdd-implementer` — incluir CWE, categoría OWASP, técnica MITRE ATT&CK y remediación |
| Finding de Security Gate causado por diseño arquitectónico | Fase 2 | `sdd-architecture-designer` — re-ejecutar Fases 3, 4, Security Gate y 5 |

Al rutear un defecto, el orquestador re-ejecuta **todas las fases posteriores** a la fase corregida.

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

Ubicación: `~/.claude/commands/`

| Skill | Cuándo leerlo |
|-------|--------------|
| `~/.claude/commands/skill-registry.md` | Siempre primero en modo fallback |
| `~/.claude/commands/kafka-config.md` | Antes de crear `XxxKafkaConfig` |
| `~/.claude/commands/kafka-listener.md` | Antes de crear `XxxKafkaListener` |
| `~/.claude/commands/processor.md` | Antes de crear `XxxProcessor/XxxProcessorImpl` |
| `~/.claude/commands/repository.md` | Antes de crear `XxxRepository` |
| `~/.claude/commands/webclient.md` | Antes de crear `XxxClient` o `XxxClientConfig` |
| `~/.claude/commands/exceptions.md` | Antes de definir jerarquía de excepciones |
| `~/.claude/commands/testing.md` | Antes de escribir tests unitarios |
| `~/.claude/commands/openapi.md` | Antes de crear `OpenApiConfig` |
| `~/.claude/commands/sdd-checklist.md` | En Fase 3 (validación) y Fase 5 (verificación) |
| `~/.claude/commands/defectos-tipicos-checklist.md` | En Fase 3 (verificar cobertura del plan) y Fase 5 (verificar resolución en implementación) |
