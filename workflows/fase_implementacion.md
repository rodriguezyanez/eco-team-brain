# Fase Implementación — SDD
**Versión:** 1.1 · **Fecha:** 2026-06-04

---

## Propósito y alcance

Este flujo cubre las fases 4, 4.5 y 5 del proceso SDD: implementación TDD, security gate y verificación. Toma como input los archivos spec generados por `fase_spec.md` y entrega código implementado, testeado y verificado.

**Aplica a:** desarrollos nuevos validados por el flujo `fase_spec.md`.
**Queda fuera:** fixes, hotfixes y mantenciones de sistemas ya desarrollados.

---

## Activación

```
sdd-impl-spec
```

El workflow busca automáticamente en el directorio `spec/` del proyecto:
- `spec/*-spec.md` — requerimientos y arquitectura (output Fases 1 y 2)
- `spec/*-plan.md` — tabla de tareas y plan de tests (output Fase 3)

| Situación | Acción |
|-----------|--------|
| Un par de archivos encontrado | Continuar con esos archivos |
| Más de un par encontrado | Preguntar al dev cuál ejecutar |
| Ningún archivo encontrado | Informar que debe completarse `fase_spec.md` primero |
| Plan con tareas `[x]` o `[!]` | Modo reanudación — continuar desde la primera tarea incompleta |

---

## Gestión de estado del plan

El workflow actualiza el estado de cada tarea **directamente en `spec/*-plan.md`** a medida que avanza. Los estados posibles son:

| Marca | Estado | Significado |
|-------|--------|-------------|
| `[ ]` | pendiente | Tarea no iniciada |
| `[>]` | en-progreso | Tarea actualmente en ejecución |
| `[x]` | completada | Tarea terminada exitosamente |
| `[!]` | bloqueada | Tarea no pudo completarse — ver detalle en informe de bloqueo |

### Protocolo de actualización por tarea

```
1. Marcar tarea como [>] en-progreso  → actualizar plan.md
2. Ejecutar implementación (agent())
3a. Éxito  → marcar [x] completada   → actualizar plan.md
3b. Fallo  → marcar [!] bloqueada    → actualizar plan.md + registrar motivo
```

### Sección de estado del ciclo en el plan

Al inicio del primer ciclo, el workflow agrega al final de `spec/*-plan.md` una sección de seguimiento:

```markdown
## Estado de implementación

| Iteración | Security Gate | Fase 5 | Resultado |
|-----------|--------------|--------|-----------|
| 1/5       | pendiente    | pendiente | — |
```

Esta tabla se actualiza al finalizar cada fase del ciclo. Ejemplo tras la primera iteración:

```markdown
## Estado de implementación

| Iteración | Security Gate | Fase 5 | Resultado |
|-----------|--------------|--------|-----------|
| 1/5       | ❌ 2 MEDIUM  | ❌ cobertura 87% | bloqueado |
| 2/5       | ✅ ok        | pendiente | — |
```

---

## Reanudación tras interrupción

Cuando `sdd-impl-spec` detecta tareas en estado `[x]` o `[>]` en el plan, entra en **modo reanudación**:

1. Leer `spec/*-plan.md` y construir el mapa de estado de todas las tareas
2. Tareas `[x]` → omitir, ya completadas
3. Tareas `[>]` → re-ejecutar desde cero (la interrupción puede haber dejado código incompleto)
4. Tareas `[ ]` → ejecutar normalmente
5. Tareas `[!]` → omitir, están bloqueadas — el informe de bloqueo ya las documenta
6. Leer la sección **Estado de implementación** para determinar en qué iteración del ciclo se estaba
7. Continuar desde el punto de interrupción sin preguntar al dev

> **Nota para el workflow ejecutable:** cada tarea debe ser una llamada `agent()` independiente para que el mecanismo `resumeFromRunId` del motor pueda cachear los resultados completados y reanudar desde el punto exacto de interrupción.

---

## Flujo general

```
sdd-impl-spec
    ↓
Leer spec/*-spec.md + spec/*-plan.md
    ↓
¿Hay tareas [x] o [>]? → Modo reanudación (saltar completadas)
    ↓
Fase 4 — Implementar ──────────────────────────────────────────
    → Agrupar tareas pendientes por nivel de dependencia
    → Por cada nivel:
        → Marcar tareas del nivel como [>]
        → Ejecutar tareas del nivel en paralelo (parallel())
        → Marcar cada tarea completada como [x] (o [!] si falla)
    → Repetir hasta completar todos los niveles
    ↓
┌── Ciclo (máx. 5 iteraciones) ─────────────────────────────────┐
│   Registrar iteración actual en sección "Estado de impl."     │
│                                                               │
│  Fase 4.5 — Security Gate                                     │
│      → Análisis estático sobre todo el código                 │
│      → Actualizar columna Security Gate en tabla de estado    │
│      → CRITICAL/HIGH/MEDIUM → vuelve a Fase 4 (tareas fijas) │
│      → Sin CRITICAL/HIGH/MEDIUM → avanza                      │
│          ↓                                                    │
│  Fase 5 — Verificar                                           │
│      → Ejecutar tests unitarios e integración                 │
│      → Actualizar columna Fase 5 en tabla de estado           │
│      → Cobertura < 95% o tests en rojo → vuelve a Fase 4     │
│      → Cobertura ≥ 95% y tests 100% verde → ✅ completo      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
    ↓ (si 5 iteraciones sin éxito)
Informe de bloqueo → FIN con pendientes documentados en plan.md
```

---

## Reglas de ejecución de tareas

Las tareas del `*-plan.md` se agrupan por niveles de dependencia:

- Las tareas del mismo nivel se implementan en **paralelo** → `parallel()` en el workflow
- No se inicia el nivel siguiente hasta que todas las tareas del nivel anterior estén `[x]`
- Si una tarea queda `[!]` bloqueada, las tareas del nivel siguiente que dependan de ella también se marcan `[!]`
- Dentro de cada tarea se sigue el ciclo **Red → Green → Refactor**
- El agente lee el skill file correspondiente **antes** de generar el código

**Ejemplo de ejecución por niveles:**
```
Nivel 1: T-01 [ ], T-02 [ ], T-03 [ ]  → parallel() → T-01 [x], T-02 [x], T-03 [x]
Nivel 2: T-04 [ ], T-05 [ ]             → parallel() → T-04 [x], T-05 [x]
Nivel 3: T-06 [ ]                       → agent()    → T-06 [x]
```

> **Nota para el workflow ejecutable:** cada tarea es una llamada `agent()` independiente dentro de un `parallel()` por nivel. Esto garantiza que el motor pueda cachear resultados individuales al reanudar con `resumeFromRunId`.

---

## Reglas del ciclo 4 → 4.5 → 5

### Criterios de éxito
El ciclo se considera exitoso cuando se cumplen **ambas** condiciones:
- Cobertura de tests unitarios **≥ 95%** (JaCoCo)
- **Cero** findings CRITICAL, HIGH o MEDIUM en el Security Gate

### Límite de iteraciones
- **Máximo 5 iteraciones** del ciclo completo
- Cada iteración queda registrada en la sección **Estado de implementación** del plan
- Al superar 5 iteraciones se genera un **informe de bloqueo** y el workflow termina

### Informe de bloqueo (tras 5 iteraciones sin éxito)

Se agrega al final de `spec/*-plan.md` y debe incluir:

- [ ] Tabla de iteraciones con lo que se intentó y el resultado de cada una
- [ ] Tests que no alcanzaron el 95%: clase, método y porcentaje actual
- [ ] Findings de seguridad no resueltos: CWE, severidad, clase afectada y motivo
- [ ] Recomendación de routing:
  - Bloqueo por diseño → rutear a `fase_spec.md` Fase 2
  - Deuda técnica aceptable → documentar como observación para el dev

---

## Manejo de cambios de scope durante implementación

| Tipo de cambio | Acción |
|----------------|--------|
| Cambio de requisito o diseño arquitectónico | Marcar tareas afectadas como `[ ]` → dev actualiza `spec/*-spec.md` → relanzar `sdd-impl-spec` |
| Nuevo CA o CL detectado | Marcar tareas afectadas como `[ ]` → dev actualiza ambos spec → relanzar |
| Ajuste menor de naming o reorganización de tareas | El agente propone el ajuste, espera confirmación del dev y continúa |
| Tarea más compleja de lo estimado (S→M o M→L) | El agente informa al dev, re-estima y continúa |

---

## Fase 4 — Implementar

**Agente:** `tdd-implementer` · **Modelo:** sonnet · **Unidad:** una llamada `agent()` por tarea

### Antes de generar — leer skill files obligatorios

| Tarea | Skill a leer |
|-------|-------------|
| `XxxKafkaConfig` | `~/.claude/commands/kafka-config.md` |
| `XxxKafkaListener` | `~/.claude/commands/kafka-listener.md` |
| `XxxProcessor / XxxProcessorImpl` | `~/.claude/commands/processor.md` |
| `XxxRepository` | `~/.claude/commands/repository.md` |
| `XxxClient / XxxClientConfig` | `~/.claude/commands/webclient.md` |
| Jerarquía de excepciones | `~/.claude/commands/exceptions.md` |
| Tests unitarios e integración | `~/.claude/commands/testing.md` |
| `OpenApiConfig` | `~/.claude/commands/openapi.md` |

### Entregable obligatorio por tarea

- [ ] Tarea marcada `[>]` en `spec/*-plan.md` antes de iniciar
- [ ] Test en rojo primero (Red)
- [ ] Implementación mínima que hace pasar el test (Green)
- [ ] Refactor sin romper tests (Refactor)
- [ ] JavaDoc en todos los métodos públicos
- [ ] Naming conventions del equipo seguidas
- [ ] Sin placeholders ni TODOs sin reportar al dev
- [ ] Autocheck de calidad al finalizar
- [ ] Tarea marcada `[x]` en `spec/*-plan.md` al completar

---

## Fase 4.5 — Security Gate

**Agente:** `static-security-auditor` · **Modelo:** opus · **Unidad:** una llamada `agent()` por iteración

### Entregable obligatorio

- [ ] Análisis estático sobre todo el código generado en Fase 4
- [ ] OWASP Top 10 (2021): A01–A10
- [ ] Amenazas de stack: SSRF (CWE-918), Kafka deserialization (CWE-502), SpEL (CWE-917), Mass Assignment (CWE-915), Actuator (CWE-200)
- [ ] NIST SP 800-53: AC-3, AU-3, SC-8
- [ ] MITRE ATT&CK: T1190, T1552, T1059 descartadas
- [ ] Findings clasificados: CRITICAL / HIGH / MEDIUM / LOW
- [ ] Resultado registrado en tabla **Estado de implementación** del plan

### Criterio de avance

| Resultado | Acción |
|-----------|--------|
| Findings CRITICAL o HIGH | Bloquea → Fase 4 con CWE, categoría OWASP y remediación |
| Findings MEDIUM | Bloquea → Fase 4 con detalle del finding |
| Solo LOW o ninguno | Avanza a Fase 5 |

---

## Fase 5 — Verificar

**Agente:** `sdd-validator` · **Modelo:** sonnet · **Unidad:** una llamada `agent()` por iteración

### Entregable obligatorio

- [ ] Cobertura de cada `CA-XX` con su test
- [ ] Cobertura de cada `CL-XX` con su test
- [ ] Tests unitarios 100% verde (`./gradlew test`)
- [ ] Tests de integración 100% verde (`./gradlew verify`)
- [ ] Cobertura ≥ 95% verificada con JaCoCo
- [ ] JavaDoc completo en métodos públicos
- [ ] Naming conventions verificadas
- [ ] Reglas DO/DON'T re-chequeadas
- [ ] `~/.claude/commands/sdd-checklist.md` consultado
- [ ] `~/.claude/commands/defectos-tipicos-checklist.md`: 6 categorías resueltas
- [ ] Resultado registrado en tabla **Estado de implementación** del plan

### Criterio de avance

| Resultado | Acción |
|-----------|--------|
| Tests en rojo | Bloquea → Fase 4 con test, assertion y stacktrace |
| Cobertura < 95% | Bloquea → Fase 4 con clases y métodos sin cubrir |
| Test integración falla por contrato | Bloquea → `fase_spec.md` Fase 2 con error y stacktrace |
| Todo verde + cobertura ≥ 95% | ✅ Implementación verificada |

---

## Matriz de routing de defectos

| Tipo de defecto | Destino | Contexto requerido |
|-----------------|---------|-------------------|
| Calidad de código, JavaDoc, naming, lógica | Fase 4 | Archivo, método, descripción |
| Test unitario falla | Fase 4 | Nombre del test, assertion, stacktrace |
| Cobertura < 95% | Fase 4 | Clases y métodos sin cubrir |
| Finding CRITICAL/HIGH/MEDIUM | Fase 4 | CWE, OWASP, MITRE ATT&CK, remediación |
| Test integración falla por contrato/infraestructura | `fase_spec.md` Fase 2 | Test, error de conexión/contrato, stacktrace |
| Finding por diseño arquitectónico | `fase_spec.md` Fase 2 | CWE, descripción del problema de diseño |
| Cambio de requisito detectado | `fase_spec.md` completo | Descripción del gap |

---

## Consideraciones para el workflow ejecutable

Esta sección describe cómo las reglas de este documento se traducen al motor `Workflow`:

| Concepto del documento | Implementación en el workflow |
|------------------------|------------------------------|
| Una tarea = una unidad de trabajo | Una llamada `agent()` independiente por tarea |
| Tareas del mismo nivel en paralelo | `parallel()` por grupo de nivel |
| Niveles secuenciales | Llamadas `parallel()` encadenadas en secuencia |
| Marcar tarea `[>]` / `[x]` / `[!]` | El `agent()` de cada tarea actualiza `spec/*-plan.md` al inicio y al final |
| Reanudación tras interrupción | `resumeFromRunId` del motor + lectura del plan para saltar tareas `[x]` |
| Ciclo 4→4.5→5 con máx. 5 iteraciones | Bucle `while (iteracion <= 5 && !exitoso)` con `agent()` para Security Gate y Fase 5 |
| Tabla de estado del ciclo | El agente de cada fase actualiza la sección **Estado de implementación** en el plan |

---

## Skill files de referencia

| Skill | Cuándo leerlo |
|-------|--------------|
| `~/.claude/commands/kafka-config.md` | Antes de implementar `XxxKafkaConfig` |
| `~/.claude/commands/kafka-listener.md` | Antes de implementar `XxxKafkaListener` |
| `~/.claude/commands/processor.md` | Antes de implementar `XxxProcessor/XxxProcessorImpl` |
| `~/.claude/commands/repository.md` | Antes de implementar `XxxRepository` |
| `~/.claude/commands/webclient.md` | Antes de implementar `XxxClient` o `XxxClientConfig` |
| `~/.claude/commands/exceptions.md` | Antes de implementar jerarquía de excepciones |
| `~/.claude/commands/testing.md` | Antes de escribir tests |
| `~/.claude/commands/openapi.md` | Antes de implementar `OpenApiConfig` |
| `~/.claude/commands/sdd-checklist.md` | En Fase 5 (verificación) |
| `~/.claude/commands/defectos-tipicos-checklist.md` | En Fase 5 (verificación) |
