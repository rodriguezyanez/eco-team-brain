---
name: kafka-audit
description: Audita si la implementación Kafka de un microservicio Spring Boot existente cumple con el estándar definido en kafka-implement. Revisa KafkaConfig base, configuración de dominio, listener, producer, properties de los 4 ambientes y tests unitarios. Reporta desviaciones con severidad y ofrece corregirlas.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash Edit Write TaskCreate TaskUpdate TaskList
---

# Auditoría de cumplimiento Kafka — Estándar kafka-implement

Vas a auditar si la implementación Kafka de este proyecto cumple con el estándar arquitectural establecido. El estándar es el definido por la skill `kafka-implement`. Cada desviación es un hallazgo.

---

## PASO 1 — Exploración del proyecto

Localiza todos los archivos Kafka del proyecto usando Glob y Grep:

```
src/main/java/**/*.java  →  buscar clases con @KafkaListener, KafkaTemplate, ConsumerFactory, ProducerFactory, DefaultErrorHandler, KafkaConfig
src/test/java/**/*.java  →  buscar tests de listener y producer
properties/**            →  todos los archivos .properties por ambiente
src/main/resources/**   →  application*.properties / application*.yml
```

Identifica y lee:
1. **KafkaConfig base** (clase abstracta sin @Configuration)
2. **KafkaConfig de dominio** (extiende la base, tiene @Configuration)
3. **Listener(s)** (tienen @KafkaListener)
4. **KafkaProducerService** (interfaz + implementación)
5. **Excepciones Kafka** (KafkaProcessingException, KafkaMessageException, NonRetryableClientDataException)
6. **Properties** de los 4 ambientes (local, develop, qa, master)
7. **Tests** del listener y del producer

---

## PASO 2 — Auditoría por componente

Evalúa cada punto. Registra cada desviación como hallazgo con su severidad:
- **Crítica** → bug que causa pérdida de datos, bucles infinitos o fallo silencioso en producción
- **Alta** → comportamiento incorrecto bajo carga o en ambientes no locales
- **Media** → configuración subóptima o inconsistente entre ambientes
- **Baja** → calidad de código, naming, claridad

---

### A. KafkaConfig base

#### A.1 ¿Existe la clase base?
- Si no existe ninguna clase abstracta de KafkaConfig → **Crítica**: la implementación no sigue el patrón Template Method. Todo está duplicado o mezclado en la config de dominio.

#### A.2 Anotaciones correctas
- [ ] **NO tiene `@Configuration`** — los beans concretos van en las subclases (**Alta** si la tiene)
- [ ] Tiene `@Slf4j` y `@Data`
- [ ] No tiene `@EnableKafka` — va en la subclase (**Media**)

#### A.3 Propiedades @Value requeridas
Verificar que cada una de estas existe como campo con `@Value`:

| Propiedad | Campo esperado | Severidad si falta |
|---|---|---|
| `${spring.kafka.bootstrap-servers}` | `bootstrapServers` | Crítica |
| `${spring.kafka.consumer.auto-offset-reset}` | `autoOffsetReset` | Media |
| `${spring.kafka.properties.security.protocol}` | `securityProtocol` | Alta |
| `${spring.kafka.properties.sasl.mechanism}` | `saslMechanism` | Alta |
| `${spring.kafka.properties.sasl.jaas.config}` | `saslJaasConfig` | Alta |
| `${spring.kafka.consumer.properties.request.timeout.ms}` | `requestTimeoutMs` | Media |
| `${spring.kafka.properties.client.dns.lookup}` | `dnsLookup` | Baja |
| `${spring.application.name}` | `applicationName` | Media |
| `${HOSTNAME:unknown}` | `hostname` | Baja |
| `${spring.kafka.consumer.properties.max.poll.interval.ms:300000}` | `maxPollIntervalMs` | Alta |
| `${spring.kafka.consumer.properties.max.poll.records:1}` | `maxPollRecords` | Alta |
| `${spring.kafka.producer.properties.buffer.memory:5242880}` | `producerBufferMemory` | Media |
| `${spring.kafka.producer.compression-type:none}` | `compressionType` | Media |
| `${spring.kafka.producer.retries:3}` | `producerRetries` | Alta |
| `${spring.kafka.producer.properties.max.request.size:1048576}` | `producerMaxRequestSize` | Alta |

> **Crítica especial — retries hardcodeado:** Si `getProducerProperties()` usa una constante Java (ej: `MAX_RETRY_ATTEMPTS = 3`) en lugar del campo `producerRetries` leído desde @Value, el valor del properties es ignorado en todos los ambientes.

> **Crítica especial — max.request.size ignorado:** Si `getProducerProperties()` no incluye `ProducerConfig.MAX_REQUEST_SIZE_CONFIG`, el producer usa 1MB por defecto. En modo FULL con listas grandes de transacciones, el send fallará silenciosamente.

#### A.4 Método `getConsumerProperties(String groupId)`
- [ ] `ENABLE_AUTO_COMMIT_CONFIG = false` (**Crítica** si falta — offsets se commitean sin garantía)
- [ ] `VALUE_DESERIALIZER_CLASS_CONFIG = ErrorHandlingDeserializer.class` (**Alta** — sin esto, mensajes malformados crashean el consumer)
- [ ] `MAX_POLL_RECORDS_CONFIG` usando el campo `maxPollRecords` (**Alta** — no hardcodeado)
- [ ] `MAX_POLL_INTERVAL_MS_CONFIG` usando el campo `maxPollIntervalMs` (**Alta** — no hardcodeado)
- [ ] `FETCH_MIN_BYTES_CONFIG = 1` (**Media** — sin esto, fetch espera acumulación innecesaria)
- [ ] `CONNECTIONS_MAX_IDLE_MS_CONFIG = 540000` (**Baja**)
- [ ] `enable.metrics.push = false` (**Alta** — sin esto, riesgo de OOM con Confluent Cloud)
- [ ] `CLIENT_ID_CONFIG = applicationName + "-" + hostname` (**Media** — sin hostname no se distinguen instancias ECS)
- [ ] Llama a `addSecurityPropsIfNeeded(props)` (**Crítica** si falta — sin seguridad en producción)

#### A.5 Método `getProducerProperties()`
- [ ] `ACKS_CONFIG = "all"` (**Alta** — sin esto se pueden perder mensajes)
- [ ] `RETRIES_CONFIG` usando campo `producerRetries` (no constante Java) (**Alta**)
- [ ] `ENABLE_IDEMPOTENCE_CONFIG = true` (**Alta** — sin esto, reintentos generan duplicados)
- [ ] `LINGER_MS_CONFIG = 0` (**Media** — con envío síncrono `.get()`, linger > 0 solo agrega latencia)
- [ ] `MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION = 5` (**Media** — correcto con idempotencia)
- [ ] `MAX_REQUEST_SIZE_CONFIG` usando campo `producerMaxRequestSize` (**Alta**)
- [ ] `enable.metrics.push = false` (**Alta**)
- [ ] Llama a `addSecurityPropsIfNeeded(props)` (**Crítica**)

#### A.6 Método `addSecurityPropsIfNeeded(Map props)`
- [ ] Verifica el perfil activo con `environment.getActiveProfiles()` (**Alta**)
- [ ] Solo aplica SASL cuando el perfil NO es `"local"` (**Alta** — en local no debe autenticar)
- [ ] Agrega `security.protocol`, `sasl.mechanism`, `sasl.jaas.config` (**Alta**)

#### A.7 Métodos privados anti-duplicidad

- [ ] Existe método privado `putCommonProducerProperties(Map<String, Object> props)` (**Baja** — sin él, las 4 líneas comunes —bootstrap, key serializer, metrics push, security— se repiten en cada producer factory)
  - Verificar que es llamado desde `getProducerProperties()`, el producer de String (DLQ) y el producer de health check
- [ ] Existe método privado `buildBaseListenerFactory(ConsumerFactory<String, T>)` (**Baja** — sin él, las 3 líneas de setup —instancia, setConsumerFactory, setAckMode MANUAL— se repiten en cada variante de listener factory)
  - Verificar que es llamado desde todos los `createListenerContainerFactory*()` que existan en la clase

---

#### A.8 Manejo de DLQ
- [ ] Existe método `createListenerContainerFactoryWithDlq(consumerFactory, dlqTopic)` (**Alta**)
- [ ] `AckMode.MANUAL` configurado en el factory (**Crítica** — sin esto el offset se commitea automáticamente)
- [ ] `DefaultErrorHandler` con `FixedBackOff(5000L, 3)` (**Media**)
- [ ] Recovery callback llama a `sendToDlq()` (**Alta**)
- [ ] `sendToDlq()` usa `.send().get()` — **NO** fire-and-forget (**Alta** — fallo silencioso si es async)
- [ ] `sendToDlq()` declara `throws Exception` (**Alta** — sin esto no compila con `.get()`)
- [ ] Fallback con log estructurado si `sendToDlq()` falla (**Media** — para recovery manual)
- [ ] `NonRetryableClientDataException` en `addNotRetryableExceptions()` (**Media**)
- [ ] `sharedStringKafkaTemplate` con `volatile` + double-checked locking (**Media** — sin esto, cada DLQ abre nueva conexión TCP)

---

### B. KafkaConfig de dominio

- [ ] Tiene `@Configuration` + `@EnableKafka` (**Alta**)
- [ ] Extiende la `KafkaConfig` base (**Alta** — sin esto duplica toda la configuración)
- [ ] Tiene `@Slf4j`, `@Data`, `@EqualsAndHashCode(callSuper = true)` (**Baja**)
- [ ] `consumerGroupId` leído de `${spring.kafka.consumer.group-id}` via `@Value` (**Alta**)
- [ ] `dltTopic` leído de `${app.kafka.topic.dlt}` via `@Value` (**Alta**)
- [ ] Bean `ConsumerFactory` usa `createConsumerFactory(consumerGroupId, Dto.class)` (**Alta**)
- [ ] Bean `ListenerContainerFactory` usa `createListenerContainerFactoryWithDlq(...)` (**Crítica** — si usa factory sin DLQ, los mensajes fallidos se pierden)
- [ ] Nombres de beans descriptivos y coherentes con el dominio (**Baja** — ej: no debe llamarse `saldoCLienteKafkaTemplate` si es un template de preliquidación)
- [ ] Bean `KafkaTemplate<String, Object> dlqKafkaTemplate()` presente para envíos manuales al DLQ (**Baja**)

---

### C. Listener

- [ ] Anotado con `@Component`, `@Slf4j`, `@RequiredArgsConstructor` (**Baja**)
- [ ] `@KafkaListener` referencia `containerFactory` con el factory del dominio (**Alta** — si usa el factory por defecto, no tiene DLQ ni AckMode.MANUAL)
- [ ] Parámetro `Acknowledgment acknowledgment` en el método (**Crítica**)
- [ ] Headers `@Header(KafkaHeaders.RECEIVED_TOPIC)`, `RECEIVED_PARTITION`, `OFFSET` para logging (**Baja**)
- [ ] **Check null con ACK antes del return:**
  ```java
  if (message == null) {
      acknowledgment.acknowledge(); // ← OBLIGATORIO
      return;
  }
  ```
  (**Crítica** si falta el acknowledge — el offset no avanza → bucle infinito de reentrega)
- [ ] `acknowledgment.acknowledge()` está DESPUÉS del procesamiento, no antes (**Crítica**)
- [ ] El bloque `catch` **relanza la excepción** con `throw e` (**Crítica** — si la captura sin relanzar, el mensaje nunca llega al DLQ)
- [ ] `AtomicLong maxProcessingTimeMs` para tracking de tiempos de procesamiento (**Baja** — ayuda a ajustar `max.poll.interval.ms`)
- [ ] Log del tiempo de procesamiento con aviso si supera el máximo histórico (**Baja**)

---

### D. KafkaProducerService

#### D.1 Interfaz
- [ ] Existe interfaz separada de la implementación (**Media**)
- [ ] Método `enviarMensaje({OutputDto})` (**Alta**)
- [ ] Método `enviarMensajeNotificacion(NotificationMessageDto)` si hay tópico de notificaciones (**Alta**)

#### D.2 Implementación
- [ ] Anotada con `@Service` y `@Slf4j` (**Baja**)
- [ ] Topics inyectados via `@Value`, no hardcodeados (**Alta**)
- [ ] `KafkaTemplate` inyectado por constructor, no `@Autowired` en campo (**Media**)
- [ ] **Envío síncrono:** `.send(...).get()` — **NO** `.send(...)` solo (**Alta** — sin `.get()` es fire-and-forget, el mensaje puede perderse sin error)
- [ ] Clave de partición es el identificador de negocio correcto (ej: codigoSucursal, rutComercio) (**Alta** — una clave incorrecta rompe el orden garantizado)
- [ ] Log con topic, partition y offset en envío exitoso (**Baja**)
- [ ] Catch lanza `KafkaMessageException` (no relanza la excepción original directamente) (**Media**)

---

### E. Excepciones Kafka

- [ ] `KafkaProcessingException extends RuntimeException` existe (**Media**)
- [ ] `KafkaMessageException extends RuntimeException` existe (**Media**)
- [ ] `NonRetryableClientDataException extends RuntimeException` existe (**Media** — sin ella, todos los errores de negocio se reintentan 3 veces innecesariamente)

---

### F. Properties — Consistencia entre ambientes

Comparar los 4 archivos (local, develop, qa, master) en estos puntos:

#### F.1 Consumer group-id
- [ ] `spring.kafka.consumer.group-id` tiene el **mismo valor** en los 4 ambientes (**Crítica** — si cambia entre deploys, los offsets se resetean y el consumer reprocesa desde el inicio)

#### F.2 Nombres de tópicos
- [ ] Los nombres de tópicos son consistentes en todos los ambientes (mismos nombres en `app.kafka.topic.*`) (**Alta**)
- [ ] El DLQ sigue el patrón `dlq-{nombre-topico-entrada}` en todos los ambientes (**Media**)

#### F.3 Local
- [ ] `spring.kafka.properties.security.protocol=PLAINTEXT` — **NO** `SASL_SSL` (**Alta** — con SASL_SSL en local sin credenciales, el consumer no arranca)
- [ ] **Sin credenciales en texto plano** — usar `${VAR:fallback}` (**Crítica** — credenciales en el repositorio es un riesgo de seguridad)
- [ ] `spring.kafka.consumer.properties.max.poll.interval.ms` apropiado para local (ej: 300000 = 5 min) (**Media**)

#### F.4 Develop / QA / Master
- [ ] `spring.kafka.properties.security.protocol=SASL_SSL` (**Crítica** — sin SASL, el broker rechaza la conexión)
- [ ] Credenciales via variables de entorno: `${BOOTSTRAP_VAR}`, `${USER_VAR}`, `${PASS_VAR}` (**Crítica**)
- [ ] `spring.kafka.properties.enable.metrics.push=false` (**Alta** — riesgo OOM con Confluent Cloud)
- [ ] `spring.kafka.consumer.properties.max.poll.interval.ms=3600000` en producción (**Alta** si es menor — rebalanceos falsos con procesamiento pesado)
- [ ] `spring.kafka.producer.retries=3` (**Media** — debe ser configurable, no depender del default de Kafka)
- [ ] `spring.kafka.producer.properties.max.request.size=10485760` (10MB) (**Alta** — el default 1MB puede fallar con mensajes grandes)
- [ ] `spring.kafka.producer.properties.linger.ms=0` (**Media** — con envío síncrono, linger > 0 agrega latencia inútil)

#### F.5 Master específicamente
- [ ] `logging.level.{paquete-raiz}=INFO` — **NO** `DEBUG` (**Media** — DEBUG en producción genera ruido excesivo y presión sobre el I/O)
- [ ] El paquete en `logging.level.*` corresponde a un paquete que **realmente existe** en el código (**Media** — un paquete inexistente no aplica el nivel a ninguna clase)

#### F.6 Propiedades ignoradas (información)
> Las siguientes propiedades están en los properties files pero son **ignoradas** cuando la aplicación define `ConsumerFactory`/`ProducerFactory` manualmente (Spring Boot desactiva su auto-configuración). Son útiles como documentación pero **no tienen efecto real**:
> `spring.kafka.consumer.key-deserializer`, `value-deserializer`, `enable-auto-commit`,
> `spring.kafka.producer.key-serializer`, `value-serializer`, `acks`,
> `spring.kafka.producer.properties.enable.idempotence`, `max.in.flight.*`, `batch.size`
>
> Si el proyecto tiene alguna de estas con un valor incorrecto y el equipo cree que están activas, reportarlo como **Media**.

---

### G. Tests unitarios

#### G.1 Test del Listener
- [ ] Existe clase de test para el listener (**Alta**)
- [ ] **Caso éxito:** servicio llamado + `acknowledge()` invocado (**Alta**)
- [ ] **Caso null:** `acknowledge()` invocado + servicio **no** llamado (**Crítica** — sin este test, el bug del ACK sin acknowledge puede pasar desapercibido)
- [ ] **Caso excepción:** `acknowledge()` **no** invocado + excepción propagada (**Alta**)
- [ ] **Caso orden:** servicio invocado **antes** que `acknowledge()` via `InOrder` (**Alta**)

#### G.2 Test del Producer
- [ ] Existe clase de test para el producer (**Alta**)
- [ ] **Caso enviarMensaje éxito:** `kafkaTemplate.send()` invocado con la clave de partición correcta (**Alta**)
- [ ] **Caso enviarMensajeNotificacion éxito** (si aplica) (**Media**)
- [ ] **Caso error:** se lanza `KafkaMessageException` (**Alta**)
- [ ] Mock del `CompletableFuture` retornado por `.send().get()` (**Media** — sin esto, el test no compila o lanza NPE)

---

## PASO 3 — Informe de hallazgos

Genera el informe con este formato:

```
## Informe de Auditoría Kafka — Cumplimiento con Estándar kafka-implement

### Resumen ejecutivo
[Estado general: CUMPLE / CUMPLE PARCIALMENTE / NO CUMPLE]
[N hallazgos: X Críticos, Y Altos, Z Medios, W Bajos]

### Hallazgos

| # | Severidad | Componente | Descripción | Archivo:Línea |
|---|-----------|------------|-------------|---------------|
| 1 | Crítica   | Listener   | ...         | Foo.java:52   |
| 2 | Alta      | KafkaConfig| ...         | Bar.java:287  |
...

### Componentes sin hallazgos
[Lista de componentes que cumplen el estándar completamente]
```

---

## PASO 4 — Correcciones

Tras presentar el informe, pregunta:

> ¿Quieres que aplique las correcciones? Puedo ejecutarlas todas o indicarme cuáles priorizar.

Si el usuario acepta:
1. Crea un `TaskCreate` por cada hallazgo Crítico y Alto
2. Ejecuta las correcciones en orden: Críticos → Altos → Medios → Bajos
3. Marca cada tarea como completada con `TaskUpdate`
4. Ejecuta `./gradlew build -x test` para verificar compilación
5. Si hay tests que fallaban antes, ejecuta `./gradlew test` para confirmar que pasan
