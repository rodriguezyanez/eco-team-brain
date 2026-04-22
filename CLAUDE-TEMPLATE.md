# Ecosistema Klap — Protocolo de memoria y asistencia KLAP BYSF

---

## Comportamiento

- Va directo al punto.
- Asume conocimiento profundo de Spring Boot, Kafka y los patrones del equipo.
- Solo menciona contexto si hay algo no obvio o una decisión que rompe el estándar.
- Consulta la memoria antes de proponer algo que ya esté decidido.
- Código limpio sin comentarios explicativos innecesarios.

---

## Protocolo de inicio de sesión

Al comenzar SIEMPRE seguir este flujo — no asumir ningún proyecto:

### Paso 1 — Seleccionar proyecto

Preguntar al dev:
> "¿En qué proyecto o microservicio vas a trabajar hoy?"

### Paso 2 — Buscar el proyecto en Neo4j

```
memory_search("[nombre del proyecto o servicio]")
```

**Si el proyecto existe en Neo4j → Paso 3**
**Si el proyecto NO existe → Paso 4**

### Paso 3 — Cargar contexto del proyecto (proyecto existente)

Con el contexto encontrado:
1. Resumir brevemente: responsabilidad del servicio, topics Kafka relevantes, tablas principales, dependencias externas.
2. Buscar decisiones y patrones específicos del proyecto: `memory_search("[proyecto] decisions")` + `memory_search("[proyecto] patterns")`
3. Cargar reglas DO/DON'T: `memory_search("Reglas DO")` + `memory_search("Reglas DONT")`
4. Continuar con la tarea.

### Paso 4 — Proyecto nuevo: investigar con SDD antes de registrar

Avisar al dev que el proyecto no está en la memoria del equipo y proponer usar SDD para investigarlo y planificarlo:

> "No encontré '[nombre]' en la memoria del equipo. Antes de comenzar a implementar, te propongo usar el flujo SDD para explorar y entender el dominio. Esto nos va a permitir registrar el proyecto correctamente y planificar la implementación con el estándar del equipo."
>
> "Cuando estés listo, escribe:
> `sdd: [descripción del proyecto o funcionalidad a implementar]`"

**Al completar la Fase 1 del SDD**, guardar automáticamente el proyecto en Neo4j con el contexto explorado:

```
memory_create({
  name: "[NombreServicio]",
  entityType: "Service",
  observations: [
    "Responsabilidad: [descripción surgida del SDD Fase 1]",
    "Topics Kafka: input=[topic], output=[topic], dlq=[topic]",
    "Tablas: [tabla1], [tabla2]",
    "Servicios externos: [api1], [api2]",
    "Componentes planificados: [KafkaListener, Processor, Repository, ...]",
    "Registrado por: [dev] el [fecha]"
  ]
})
```

Confirmar al dev:
> "✅ [NombreServicio] registrado en la memoria del equipo con el contexto explorado en el SDD."

---

## Context7 — Documentación en tiempo real

Cuando el dev trabaja con APIs del stack, agregar `use context7` al prompt para obtener la documentación de la versión exacta instalada en el equipo.

### Cuándo usar Context7

| Librería | Versión del equipo | Ejemplo de prompt |
|----------|--------------------|-------------------|
| Spring Boot | 3.5.11 | `use context7, ¿cómo configuro un HealthIndicator en Spring Boot 3.5.11?` |
| Spring Kafka | (spring-kafka) | `use context7, ¿cómo funciona el ErrorHandlingDeserializer en Spring Kafka?` |
| Resilience4j | 2.2.0 | `use context7, ¿cómo configuro un CircuitBreaker con Resilience4j 2.2.0?` |
| WebClient | (spring-webflux) | `use context7, ¿cómo configuro timeouts en WebClient con Spring Boot 3.5.11?` |
| springdoc-openapi | 2.8.12 | `use context7, ¿cómo desactivo Swagger en producción con springdoc 2.8.12?` |

---

## Fallback de memoria local (cuando Neo4j no está disponible)

Cuando `mcp__team-brain__create_memory` o `mcp__team-brain__create_connection` falla por Neo4j no disponible:

1. Avisar: "Neo4j no disponible — guardando memoria localmente para sync posterior"
2. Appender al archivo de cola:
   - Windows: `%USERPROFILE%\.claude\pending-memories.jsonl`
   - Linux/macOS: `~/.claude/pending-memories.jsonl`
3. Formato: `{"timestamp":"<ISO8601>","type":"memory","name":"<nombre>","entityType":"<tipo>","observations":["<obs1>"]}`
4. Confirmar: "✅ Guardado localmente. Ejecutá `klap sync` cuando Neo4j vuelva a estar disponible."

### Protocolo de inicio de sesión — chequeo de pendientes

Al iniciar sesión, **antes de preguntar el proyecto**, verificar si existe el archivo de cola. Si existe → avisar:

> "⚠️ Hay memorias pendientes de sincronizar con Neo4j. Ejecutá `klap sync` para volcarlas antes de continuar."

---

## Skill registry local (fallback cuando Neo4j no está disponible)

Usa los skill files locales en `~/.claude/skills/` (Linux/macOS) o `%USERPROFILE%\.claude\skills\` (Windows).

### Skills disponibles

| Skill | Cuándo leerlo |
|-------|--------------|
| `skill-registry.md` | Siempre primero — es el índice |
| `kafka-config.md` | Antes de crear un `XxxKafkaConfig` |
| `kafka-listener.md` | Antes de crear un `XxxKafkaListener` |
| `processor.md` | Antes de crear un `XxxProcessor/XxxProcessorImpl` |
| `repository.md` | Antes de crear un `XxxRepository` |
| `webclient.md` | Antes de crear un `XxxClient` o `XxxClientConfig` |
| `exceptions.md` | Antes de definir la jerarquía de excepciones |
| `testing.md` | Antes de escribir tests unitarios |
| `openapi.md` | Antes de crear `OpenApiConfig` |

---

## Regla JavaDoc (obligatoria)

**JavaDoc es obligatorio en todos los métodos públicos**, sin excepción.

```java
/**
 * [Objetivo del método en una oración clara].
 *
 * @param nombreParam descripción
 * @return descripción (omitir si es void)
 * @throws XxxException cuando [condición]
 */
```

---

## SDD — Spec-Driven Development para KLAP BYSF

### Activación
Cuando el dev escribe `sdd: [descripción]`, activa el flujo de 5 fases:
1. **Explorar**: Lee el dominio, consulta memoria, mapea dependencias.
2. **Proponer**: Presenta enfoque y estructura de paquetes.
3. **Validar**: Verifica contra reglas DO/DON'T (usar `skills/sdd-checklist.md`).
4. **Implementar**: Código siguiendo skill files y JavaDoc obligatorio.
5. **Verificar**: Tests 95%+, JavaDoc completo, naming validado.

---

*Ecosistema Klap · CLAUDE.md v2.0 · Abril 2026*
