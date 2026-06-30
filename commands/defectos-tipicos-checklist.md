# Checklist de Defectos Típicos — KLAP BYSF

**Versión:** 1.0 · **Actualizado:** 2026-06-04

---

## Propósito y protocolo de uso

Este documento lista los defectos recurrentes detectados en los desarrollos del equipo.
Los agentes del workflow SDD deben consultarlo para asegurar que el plan de implementación los aborda explícitamente.

### Cuándo usar

| Fase | Agente | Acción |
|------|--------|--------|
| Fase 3 — Planificar | `sdd-task-planner` | Verificar que el plan de tareas cubre cada categoría. Si algún criterio no está explícito, **consultar al dev antes de continuar**. |
| Fase 5 — Verificar | `sdd-validator` | Verificar que la implementación resuelve cada categoría. Si alguna falla, rutear a Fase 4. |

### Regla de oro

> Si el plan omite los criterios de una categoría, **NO agregar tareas automáticamente**.
> Consultar al dev con las preguntas sugeridas para cada categoría y registrar la decisión.

---

## 1. Registros o Transacciones Duplicadas

**Riesgo:** cobros duplicados, estados inconsistentes, violación de integridad referencial.
**Contexto del stack:** Kafka opera en modo at-least-once — el mismo mensaje puede procesarse más de una vez ante un reintento o rebalance.

### Criterios mínimos que debe cubrir el plan

- [ ] Identificado el punto donde puede ocurrir la duplicación (reintento Kafka, retry de WebClient, reintento manual del operador)
- [ ] Definida la estrategia de idempotencia: `UNIQUE constraint` en tabla, tabla de eventos procesados (`tarifa_auditoria`), o campo `procesado_at`
- [ ] Especificado el comportamiento cuando se detecta un duplicado: ignorar silenciosamente, registrar en log, o alertar
- [ ] El plan incluye una tarea de test que simule el procesamiento duplicado del mismo mensaje

### Preguntas a consultar al dev si el plan no los incluye

1. "¿Puede el mismo mensaje Kafka o la misma solicitud llegar más de una vez al sistema? ¿En qué escenario concreto ocurre esto?"
2. "¿Qué debe pasar si se detecta un duplicado: ignorar silenciosamente, registrar en log, o generar una alerta?"
3. "¿Hay un `UNIQUE constraint` en la tabla que proteja contra duplicados a nivel de base de datos, o la idempotencia se maneja en la lógica de negocio?"

---

## 2. Datos Nulos

**Riesgo:** `NullPointerException` en producción, procesamiento silencioso de datos incompletos, registros con campos obligatorios vacíos.
**Contexto del stack:** los mensajes Kafka se deserializan desde JSON — campos ausentes llegan como `null` sin advertencia.

### Criterios mínimos que debe cubrir el plan

- [ ] Listados los campos críticos del payload que pueden llegar nulos (desde Kafka, WebClient o PostgreSQL)
- [ ] Definido el comportamiento para cada campo nulo: rechazar mensaje, usar valor por defecto, o enviar al DLQ
- [ ] Los nulos representativos están documentados como casos límite `CL-XX` en la Fase 1
- [ ] El plan incluye una tarea de test con payload Kafka con campos nulos o ausentes

### Preguntas a consultar al dev si el plan no los incluye

1. "¿Qué campos del payload Kafka son obligatorios y cuáles pueden venir nulos? ¿Está documentado esto en el contrato del topic?"
2. "¿Qué debe pasar cuando llega un campo nulo en un campo obligatorio: rechazar el mensaje y enviarlo al DLQ, o usar un valor por defecto?"
3. "¿Hay campos que pueden llegar nulos desde el WebClient o desde PostgreSQL que deban manejarse explícitamente?"

---

## 3. Validación de Entrada

**Riesgo:** SQL injection, datos corruptos en base de datos, errores en integraciones por formatos incorrectos.
**Contexto del stack:** JDBC sin JPA — las queries se construyen manualmente; los datos llegan desde Kafka sin validación previa del productor.

### Criterios mínimos que debe cubrir el plan

- [ ] Definidos los formatos esperados para cada campo de entrada: RUT, email, fecha ISO-8601, monto, teléfono
- [ ] Especificado qué validaciones se aplican: regex, rango numérico, longitud máxima, lista de valores permitidos
- [ ] Definido el comportamiento para entradas inválidas: rechazar con log, enviar al DLQ, o responder con error
- [ ] Confirmado que **todas las queries JDBC usan `PreparedStatement`** — ninguna concatena strings del payload
- [ ] El plan incluye una tarea de test con inputs inválidos: caracteres especiales, strings vacíos, emails malformados, SQL injection strings

### Preguntas a consultar al dev si el plan no los incluye

1. "¿Qué campos requieren validación de formato (RUT, email, fecha ISO-8601, monto positivo)? ¿Existe un contrato de validación definido por el equipo?"
2. "¿Qué se hace cuando un campo tiene formato inválido: se rechaza el mensaje, se envía al DLQ, o se transforma a un valor canónico?"
3. "¿Todas las queries JDBC del repositorio usan `PreparedStatement`? ¿Hay alguna query que construya el SQL concatenando valores del payload?"

---

## 4. Casos de Borde — Criterios de Tratamiento

**Riesgo:** mensajes Kafka perdidos sin DLQ, procesos que fallan silenciosamente sin alerta, inconsistencia de estado ante fallos parciales, MTTR alto por falta de visibilidad.
**Contexto del stack:** Resilience4j disponible para retry/circuit breaker; DLQ es el mecanismo de fallback estándar del equipo.

### Criterios mínimos que debe cubrir el plan

- [ ] Definido el comportamiento cuando un servicio externo (WebClient) no responde o devuelve error HTTP
- [ ] Definida la estrategia de retry: número de reintentos, backoff, condición de activación (Resilience4j)
- [ ] Definido el comportamiento de DLQ: qué mensajes van al DLQ y qué información mínima se loguea
- [ ] Definido si se envía notificación de alerta (email, SNS, Slack) ante fallos críticos y a quién
- [ ] Definido qué logs de monitoreo se generan para cada tipo de fallo: nivel (`ERROR`/`WARN`), campos clave incluidos
- [ ] Especificado el comportamiento ante timeout del WebClient y el valor del timeout configurado
- [ ] Especificado qué pasa en fallos parciales (ej: guardó en BD pero falló el WebClient): rollback o estado parcial aceptado
- [ ] El plan incluye tareas de test para: timeout, HTTP 500 del externo, DLQ hit, reintentos agotados

### Preguntas a consultar al dev si el plan no los incluye

1. "¿Qué pasa si el servicio externo no responde en el timeout configurado? ¿Se reintenta, se descarta el mensaje, o va al DLQ?"
2. "¿Cuántos reintentos se hacen y con qué espera entre ellos (exponential backoff)? ¿Quién configura el Resilience4j para este servicio?"
3. "¿Se envía alguna notificación (email, SNS, Slack) cuando un proceso falla después de agotar todos los reintentos?"
4. "¿Qué información mínima debe aparecer en el log cuando un mensaje falla: ID de transacción, topic, offset, causa raíz?"
5. "¿Qué pasa si el proceso es parcialmente exitoso (ej: se guardó en BD pero falló el WebClient): se hace rollback o se acepta el estado parcial y se alerta?"

---

## 5. Trazabilidad

**Riesgo:** imposibilidad de reconstruir el flujo de un mensaje en producción, logs inutilizables para debugging, MTTR alto en incidentes.
**Contexto del stack:** arquitectura multi-servicio con Kafka — un mensaje cruza KafkaListener → Processor → Repository → WebClient; sin correlation ID el hilo se pierde.

### Criterios mínimos que debe cubrir el plan

- [ ] Definido el identificador de trazabilidad que se propaga en todo el flujo (correlation ID, transaction ID, RUT+folio+fecha u otro)
- [ ] Especificado cómo se propaga el ID entre componentes: header Kafka, campo del payload, MDC de Slf4j
- [ ] Definidos los eventos clave que se loguean con su nivel (`INFO`, `WARN`, `ERROR`) y campos mínimos obligatorios
- [ ] Especificado que el correlation ID aparece en **todos** los logs del hilo de procesamiento (via MDC)
- [ ] El plan incluye una tarea de test que verifique que el correlation ID está presente en los logs de cada etapa

### Preguntas a consultar al dev si el plan no los incluye

1. "¿Cuál es el identificador único de trazabilidad para este flujo (ej: `numero_folio`, `transaction_id`, `correlationId`)?"
2. "¿Cómo se propaga ese ID entre el KafkaListener, el Processor, el Repository y los WebClients: como campo del payload, como header Kafka, o como MDC?"
3. "¿Qué eventos mínimos deben loguearse explícitamente: mensaje recibido, procesamiento iniciado, llamada a externo, resultado guardado, mensaje completado?"
4. "¿Se usa MDC (`Mapped Diagnostic Context`) de Slf4j para que el correlation ID aparezca automáticamente en todos los logs del hilo de procesamiento?"

---

## 6. Control de Acceso

**Riesgo:** endpoints expuestos sin autenticación, Actuator accesible en producción, datos sensibles accesibles sin autorización.
**OWASP:** A01:2021 — Broken Access Control. Esta categoría es el defecto más frecuente según OWASP Top 10.

### Criterios mínimos que debe cubrir el plan

- [ ] Listados todos los endpoints REST y Actuator expuestos por el servicio
- [ ] Definido qué endpoints son públicos y cuáles requieren autenticación/autorización
- [ ] Especificado el mecanismo de autenticación: JWT, mTLS, API key interna, Spring Security
- [ ] Confirmado que Actuator solo expone `health` e `info` en producción (el resto bloqueado por configuración)
- [ ] Definidos los roles o scopes requeridos por endpoint si aplica RBAC
- [ ] El plan incluye una tarea de test que verifique rechazo de acceso sin credenciales válidas (HTTP 401/403)

### Preguntas a consultar al dev si el plan no los incluye

1. "¿Qué endpoints REST expone este servicio? ¿Cuáles requieren autenticación y cuáles son de acceso público?"
2. "¿Qué endpoints de Actuator están habilitados? ¿Está confirmado que solo `health` e `info` son accesibles fuera de la red interna en producción?"
3. "¿El servicio usa Spring Security? ¿Cuál es el mecanismo de autenticación: JWT, mTLS, API key?"
4. "¿Hay roles o scopes específicos por endpoint (ej: solo `ROLE_ADMIN` puede llamar `/admin/*`)?"

---

## Resumen — Tabla de verificación rápida

Usar en Fase 3 para el cierre del plan y en Fase 5 para la verificación final.

| # | Categoría | Criterio mínimo | Plan lo cubre | Implementación lo resuelve |
|---|-----------|----------------|:---:|:---:|
| 1 | Duplicados | Estrategia de idempotencia definida y testeada | ☐ | ☐ |
| 2 | Nulos | Campos críticos listados y comportamiento definido | ☐ | ☐ |
| 3 | Validación | Formatos validados y `PreparedStatement` confirmado | ☐ | ☐ |
| 4 | Casos de borde | DLQ, retry, alertas y comportamiento parcial definidos | ☐ | ☐ |
| 5 | Trazabilidad | Correlation ID definido y propagado via MDC | ☐ | ☐ |
| 6 | Control de acceso | Endpoints listados, autenticación y Actuator configurados | ☐ | ☐ |

**Regla de cierre:** el plan de Fase 3 está completo solo cuando las 6 columnas "Plan lo cubre" están marcadas.
El desarrollo de Fase 5 está terminado solo cuando las 6 columnas "Implementación lo resuelve" están marcadas.
