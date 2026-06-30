---
name: kafka-implement
description: Genera una implementación completa y production-ready de Apache Kafka en un microservicio Spring Boot nuevo. Crea consumer (listener), producer, configuración base, configuración de dominio, manejo de errores con DLQ, properties para 4 ambientes y tests unitarios. Sigue los patrones arquitecturales establecidos en el pipeline liquidacion-svb.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash Edit Write TaskCreate TaskUpdate TaskList
---

# Implementación completa de Kafka — Spring Boot

Vas a implementar Apache Kafka de manera completa y production-ready en este proyecto. Sigue cada paso en orden estricto.

---

## PASO 1 — Recolección de información

Antes de escribir una sola línea de código, haz las siguientes preguntas al usuario **en un solo mensaje**. No continúes hasta tener todas las respuestas:

```
Para generar la implementación necesito algunos datos:

1. **Nombre del dominio** (PascalCase, ej: ValidacionTarifa, PagoComercio, SaldoCliente)
   → Se usará como prefijo en nombres de clases y beans.

2. **Paquete base del proyecto** (ej: cl.klap.bysf.liqsvbo.dominio.validaciontarifa)
   → Estructura de paquetes donde irán las clases generadas.

3. **Paquete global** (ej: cl.klap.bysf.liqsvbo.global)
   → Donde irá la KafkaConfig base (si no existe) y las excepciones.

4. **DTO de entrada** (nombre de la clase, ej: PreliqMessageDto)
   → El tipo que deserializará el consumer desde Kafka.

5. **¿El DTO de salida es diferente al de entrada?**
   → Responde: SÍ (indica el nombre) / NO (se reutiliza el mismo enriquecido)

6. **Tópicos Kafka** — ¿cuántos tópicos de salida tiene este servicio?
   a) Entrada + Salida + Notificaciones (3 tópicos)
   b) Entrada + Notificaciones solamente (2 tópicos, sin reenvío al pipeline)
   c) Otro (describe)

   Para cada tópico indica el nombre que tendrá en properties
   (ej: bysf-liqsvbo-preliquidacion, bysf-liqsvbo-validacion-op, bysf-liqsvbo-notificacion)

7. **Nombre del consumer group** (ej: group-bysf-liquidacion-svbo)

8. **¿Existe ya una clase KafkaConfig base** (abstract, sin @Configuration) en el proyecto?
   → Responde: SÍ (indica la ruta) / NO

9. **¿Existe ya NotificationMessageDto** en el proyecto?
   → Responde: SÍ (indica el paquete) / NO (se generará una versión básica)
```

---

## PASO 2 — Exploración del proyecto existente

Con las respuestas del usuario, antes de crear cualquier archivo:

1. Usa `Glob` para detectar la estructura real del proyecto:
   - `src/main/java/**/*.java` → identificar paquetes y clases existentes
   - `src/test/java/**/*.java` → identificar estructura de tests
   - `build.gradle` o `pom.xml` → verificar dependencias de Kafka
   - `properties/**` o `src/main/resources/application*.properties` → ver properties existentes

2. **Verificar dependencia Kafka en build.gradle:**
   Si no existe `spring-kafka`, informar al usuario que debe agregarla:
   ```gradle
   implementation 'org.springframework.kafka:spring-kafka'
   testImplementation 'org.springframework.kafka:spring-kafka-test'
   ```

3. **Verificar si KafkaConfig base existe** (según respuesta del usuario):
   - Si existe → leerla y validarla contra la checklist del PASO 3
   - Si no existe → crearla en PASO 4

4. **Verificar si las clases de excepción existen:**
   Buscar `KafkaProcessingException`, `KafkaMessageException`, `NonRetryableClientDataException`

---

## PASO 3 — Validación de KafkaConfig base (si existe)

Si la KafkaConfig base ya existe, verifica que cumple **todos** estos requisitos. Por cada punto que falle, corrígelo:

**Propiedades @Value requeridas:**
- [ ] `spring.kafka.bootstrap-servers`
- [ ] `spring.kafka.consumer.auto-offset-reset`
- [ ] `spring.kafka.properties.security.protocol`
- [ ] `spring.kafka.properties.sasl.mechanism`
- [ ] `spring.kafka.properties.sasl.jaas.config`
- [ ] `spring.kafka.consumer.properties.request.timeout.ms`
- [ ] `spring.kafka.properties.client.dns.lookup`
- [ ] `spring.application.name`
- [ ] `HOSTNAME:unknown`
- [ ] `spring.kafka.consumer.properties.max.poll.interval.ms:300000`
- [ ] `spring.kafka.consumer.properties.max.poll.records:1`
- [ ] `spring.kafka.producer.properties.buffer.memory:5242880`
- [ ] `spring.kafka.producer.compression-type:none`
- [ ] `spring.kafka.producer.retries:3`
- [ ] `spring.kafka.producer.properties.max.request.size:1048576`

**Método `getConsumerProperties(String groupId)`:**
- [ ] `ENABLE_AUTO_COMMIT_CONFIG = false`
- [ ] `VALUE_DESERIALIZER_CLASS_CONFIG = ErrorHandlingDeserializer.class`
- [ ] `MAX_POLL_RECORDS_CONFIG` leído de `maxPollRecords` (@Value)
- [ ] `MAX_POLL_INTERVAL_MS_CONFIG` leído de `maxPollIntervalMs` (@Value)
- [ ] `FETCH_MIN_BYTES_CONFIG = 1`
- [ ] `CONNECTIONS_MAX_IDLE_MS_CONFIG = 540000`
- [ ] `enable.metrics.push = false`
- [ ] `CLIENT_ID_CONFIG = applicationName + "-" + hostname`
- [ ] Llama a `addSecurityPropsIfNeeded(props)`

**Método `getProducerProperties()`:**
- [ ] `ACKS_CONFIG = "all"`
- [ ] `RETRIES_CONFIG` leído de `producerRetries` (@Value)
- [ ] `ENABLE_IDEMPOTENCE_CONFIG = true`
- [ ] `LINGER_MS_CONFIG = 0`
- [ ] `MAX_REQUEST_SIZE_CONFIG` leído de `producerMaxRequestSize` (@Value)
- [ ] `enable.metrics.push = false`
- [ ] Llama a `addSecurityPropsIfNeeded(props)`

**Método `addSecurityPropsIfNeeded(Map props)`:**
- [ ] Solo aplica seguridad si el perfil activo NO es "local"
- [ ] Agrega `security.protocol`, `sasl.mechanism`, `sasl.jaas.config`

**Manejo de DLQ:**
- [ ] `createListenerContainerFactoryWithDlq(consumerFactory, dlqTopic)` con AckMode.MANUAL
- [ ] `DefaultErrorHandler` con `FixedBackOff(5000L, 3)` intentos
- [ ] Recovery callback llama a `sendToDlq()` envuelto en try-catch con log estructurado fallback
- [ ] `sendToDlq()` usa `.get()` (síncrono) y declara `throws Exception`
- [ ] `NonRetryableClientDataException` en `addNotRetryableExceptions()`
- [ ] `sharedStringKafkaTemplate` con double-checked locking (volatile + synchronized)

---

## PASO 4 — Creación de archivos

Crea un `TaskCreate` por cada archivo a generar. Luego créalos en este orden:

### 4.1 KafkaConfig base (si no existe)

**Ruta:** `src/main/java/{paquete-global}/config/KafkaConfig.java`

Genera la clase con exactamente este patrón:

```java
package {paquete-global}.config;

// imports...

/**
 * Clase base para configuración de Apache Kafka con métodos factory reutilizables.
 * NO está anotada con @Configuration — los beans concretos van en subclases por dominio.
 *
 * Métodos privados de apoyo para evitar duplicidad:
 *  - putCommonProducerProperties(): propiedades comunes a todos los producers
 *  - buildBaseListenerFactory():    setup común a todos los listener container factories
 */
@Slf4j
@Data
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.auto-offset-reset}")
    private String autoOffsetReset;

    @Value("${spring.kafka.properties.security.protocol}")
    private String securityProtocol;

    @Value("${spring.kafka.properties.sasl.mechanism}")
    private String saslMechanism;

    @Value("${spring.kafka.properties.sasl.jaas.config}")
    private String saslJaasConfig;

    @Value("${spring.kafka.consumer.properties.request.timeout.ms}")
    private String requestTimeoutMs;

    @Value("${spring.kafka.properties.client.dns.lookup}")
    private String dnsLookup;

    @Value("${spring.application.name}")
    private String applicationName;

    // Hostname del contenedor — único por ECS task, diferencia instancias en Confluent
    @Value("${HOSTNAME:unknown}")
    private String hostname;

    // DEBE leerse del properties para soportar órdenes con 400K+ transacciones
    @Value("${spring.kafka.consumer.properties.max.poll.interval.ms:300000}")
    private int maxPollIntervalMs;

    // Con procesamiento pesado usar 1 para mantener max.poll.interval.ms bajo control
    @Value("${spring.kafka.consumer.properties.max.poll.records:1}")
    private int maxPollRecords;

    // 5MB es suficiente con max.poll.records=1; 32MB (default) agrava presión sobre heap
    @Value("${spring.kafka.producer.properties.buffer.memory:5242880}")
    private long producerBufferMemory;

    @Value("${spring.kafka.producer.compression-type:none}")
    private String compressionType;

    // Configurable por ambiente — develop/qa/master pueden sobreescribir en properties
    @Value("${spring.kafka.producer.retries:3}")
    private int producerRetries;

    // Modo FULL con listas grandes puede superar el default de 1MB
    @Value("${spring.kafka.producer.properties.max.request.size:1048576}")
    private int producerMaxRequestSize;

    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long RETRY_BACKOFF_MS = 5000L;
    private static final int PRODUCER_RETRY_BACKOFF_MS = 100;
    private static final String PRODUCER_ACKS_CONFIG = "all";

    // Deshabilita telemetría KIP-714 hacia Confluent Cloud.
    // CRÍTICO: sin esto, ClientTelemetryReporter puede causar OOM con ZSTD bajo presión de heap.
    // DEBE setearse programáticamente — es ignorado en spring.kafka.properties.* cuando
    // Spring Boot desactiva su auto-configuración al detectar beans factory manuales.
    private static final String ENABLE_METRICS_PUSH = "enable.metrics.push";

    // Template compartido para DLQ con double-checked locking.
    // Sin esto, cada mensaje DLQ abriría una nueva conexión TCP con su propio ClientTelemetryReporter.
    private volatile KafkaTemplate<String, String> sharedStringKafkaTemplate;

    @Autowired
    private Environment environment;

    @PostConstruct
    public void validateConfiguration() {
        if (bootstrapServers == null || bootstrapServers.isBlank()) {
            throw new IllegalStateException("spring.kafka.bootstrap-servers no puede estar vacío");
        }
        if (requestTimeoutMs == null || requestTimeoutMs.isBlank()) {
            throw new IllegalStateException("spring.kafka.consumer.properties.request.timeout.ms no puede estar vacío");
        }
        log.info("✓ Configuración Kafka validada — Bootstrap: {}", bootstrapServers);
    }

    // -------------------------------------------------------------------------
    // MÉTODOS PRIVADOS DE APOYO — evitan duplicidad entre factories
    // -------------------------------------------------------------------------

    /**
     * Propiedades comunes a todos los producers: bootstrap, key serializer,
     * telemetría deshabilitada y seguridad por perfil.
     * Usado por getProducerProperties(), createStringProducerFactory() y
     * createHealthCheckProducerFactory() para eliminar duplicidad.
     */
    private void putCommonProducerProperties(Map<String, Object> props) {
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ENABLE_METRICS_PUSH, false);
        addSecurityPropsIfNeeded(props);
    }

    /**
     * Setup base común a todos los listener container factories:
     * instancia, consumer factory asignado y AckMode.MANUAL.
     * Usado por createListenerContainerFactory*() para eliminar duplicidad.
     */
    private <T> ConcurrentKafkaListenerContainerFactory<String, T> buildBaseListenerFactory(
            ConsumerFactory<String, T> consumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, T> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.getContainerProperties().setAckMode(
                org.springframework.kafka.listener.ContainerProperties.AckMode.MANUAL);
        return factory;
    }

    /**
     * Solo aplica SASL si el perfil activo NO es "local".
     * Permite Kafka sin autenticación en local y SASL_SSL en develop/qa/master.
     */
    private void addSecurityPropsIfNeeded(Map<String, Object> props) {
        String[] profiles = environment.getActiveProfiles();
        if (profiles.length > 0 && !"local".equals(profiles[0])) {
            props.put("security.protocol", securityProtocol);
            props.put("sasl.mechanism", saslMechanism);
            props.put("sasl.jaas.config", saslJaasConfig);
        }
    }

    // -------------------------------------------------------------------------
    // MÉTODOS PROTEGIDOS — usados por subclases de dominio
    // -------------------------------------------------------------------------

    protected Map<String, Object> getConsumerProperties(String groupId) {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ConsumerConfig.REQUEST_TIMEOUT_MS_CONFIG, requestTimeoutMs);
        props.put(ConsumerConfig.DEFAULT_API_TIMEOUT_MS_CONFIG, requestTimeoutMs);
        props.put(ConsumerConfig.CLIENT_DNS_LOOKUP_CONFIG, dnsLookup);
        props.put(ConsumerConfig.CLIENT_ID_CONFIG, applicationName + "-" + hostname);
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, maxPollRecords);
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, maxPollIntervalMs);
        props.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, 1);
        props.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG, 500);
        props.put(ConsumerConfig.CONNECTIONS_MAX_IDLE_MS_CONFIG, 540000L);
        props.put(ENABLE_METRICS_PUSH, false);
        addSecurityPropsIfNeeded(props);
        log.info("Consumer configurado: max.poll.records={}, max.poll.interval.ms={}, client.id={}",
                maxPollRecords, maxPollIntervalMs, applicationName + "-" + hostname);
        return props;
    }

    protected Map<String, Object> getProducerProperties() {
        Map<String, Object> props = new HashMap<>();
        putCommonProducerProperties(props);                                      // bootstrap + key serializer + metrics + security
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        props.put(ProducerConfig.CLIENT_ID_CONFIG, applicationName);
        props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, requestTimeoutMs);
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, compressionType);
        props.put(ProducerConfig.ACKS_CONFIG, PRODUCER_ACKS_CONFIG);
        props.put(ProducerConfig.RETRIES_CONFIG, producerRetries);
        props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, PRODUCER_RETRY_BACKOFF_MS);
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
        // linger.ms=0: envío síncrono con .get() + max.poll.records=1 → batching nunca ocurre
        props.put(ProducerConfig.LINGER_MS_CONFIG, 0);
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, producerBufferMemory);
        props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
        props.put(ProducerConfig.CONNECTIONS_MAX_IDLE_MS_CONFIG, 540000L);
        // max.request.size leído de @Value — ignorado si se leyera solo del properties con factory manual
        props.put(ProducerConfig.MAX_REQUEST_SIZE_CONFIG, producerMaxRequestSize);
        return props;
    }

    protected <T> ConsumerFactory<String, T> createConsumerFactory(String groupId, Class<T> targetType) {
        Map<String, Object> config = getConsumerProperties(groupId);
        JsonDeserializer<T> jsonDeserializer = new JsonDeserializer<>(targetType);
        jsonDeserializer.addTrustedPackages("*");
        jsonDeserializer.setUseTypeHeaders(false);
        ErrorHandlingDeserializer<T> errorHandlingDeserializer = new ErrorHandlingDeserializer<>(jsonDeserializer);
        return new DefaultKafkaConsumerFactory<>(config, new StringDeserializer(), errorHandlingDeserializer);
    }

    protected <T> ProducerFactory<String, T> createProducerFactory() {
        return new DefaultKafkaProducerFactory<>(getProducerProperties());
    }

    protected <T> KafkaTemplate<String, T> createKafkaTemplate(ProducerFactory<String, T> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    protected <T> ConcurrentKafkaListenerContainerFactory<String, T> createListenerContainerFactoryWithDlq(
            ConsumerFactory<String, T> consumerFactory, String dlqTopic) {
        ConcurrentKafkaListenerContainerFactory<String, T> factory = buildBaseListenerFactory(consumerFactory);
        factory.setCommonErrorHandler(createErrorHandler(dlqTopic));
        log.info("ListenerContainerFactory configurado: {} reintentos, backoff {}ms, DLQ: {}",
                MAX_RETRY_ATTEMPTS, RETRY_BACKOFF_MS, dlqTopic);
        return factory;
    }

    protected KafkaTemplate<String, Object> createDlqKafkaTemplate() {
        return new KafkaTemplate<>(createProducerFactory());
    }

    // -------------------------------------------------------------------------
    // MÉTODOS PRIVADOS — DLQ y string producer
    // -------------------------------------------------------------------------

    private DefaultErrorHandler createErrorHandler(String dlqTopic) {
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
                (record, exception) -> {
                    log.error("[Kafka] Enviando a DLQ tras {} reintentos: {}", MAX_RETRY_ATTEMPTS, exception.getMessage());
                    try {
                        sendToDlq(record, exception, dlqTopic);
                    } catch (Exception dlqEx) {
                        log.error("[Kafka DLQ FAILED] Topic: {}, Partition: {}, Offset: {}, Error: {}, Payload: {}",
                                record.topic(), record.partition(), record.offset(),
                                exception.getMessage(), record.value(), dlqEx);
                    }
                },
                new FixedBackOff(RETRY_BACKOFF_MS, MAX_RETRY_ATTEMPTS)
        );
        errorHandler.addNotRetryableExceptions(NonRetryableClientDataException.class);
        return errorHandler;
    }

    private void sendToDlq(ConsumerRecord<?, ?> record, Exception exception, String dlqTopic) throws Exception {
        KafkaTemplate<String, String> template = createStringKafkaTemplate();
        String payload = record.value() != null ? record.value().toString() : "null";
        String error = exception.getMessage() != null
                ? exception.getMessage().replace("\"", "'") : "unknown";
        String errorMsg = String.format(
                "{\"topic\":\"%s\",\"partition\":%d,\"offset\":%d,\"error\":\"%s\",\"payload\":%s}",
                record.topic(), record.partition(), record.offset(), error, payload);
        template.send(dlqTopic, errorMsg).get();
        log.info("[Kafka] Mensaje enviado a DLQ: {}", dlqTopic);
    }

    // String producer factory para DLQ — usa putCommonProducerProperties para no duplicar
    private ProducerFactory<String, String> createStringProducerFactory() {
        Map<String, Object> props = new HashMap<>();
        putCommonProducerProperties(props);                                      // bootstrap + key serializer + metrics + security
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.CLIENT_ID_CONFIG, applicationName);
        props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, requestTimeoutMs);
        return new DefaultKafkaProducerFactory<>(props);
    }

    // Inicialización lazy con double-checked locking — una sola conexión TCP para todos los DLQ
    private KafkaTemplate<String, String> createStringKafkaTemplate() {
        if (sharedStringKafkaTemplate == null) {
            synchronized (this) {
                if (sharedStringKafkaTemplate == null) {
                    sharedStringKafkaTemplate = new KafkaTemplate<>(createStringProducerFactory());
                }
            }
        }
        return sharedStringKafkaTemplate;
    }
}
```

### 4.2 Excepciones Kafka (si no existen)

**Rutas:**
- `src/main/java/{paquete-dominio}/exception/KafkaProcessingException.java`
- `src/main/java/{paquete-global}/exceptions/KafkaMessageException.java`
- `src/main/java/{paquete-dominio}/exception/NonRetryableClientDataException.java`

Patrones:

```java
// KafkaProcessingException — error durante procesamiento del mensaje
public class KafkaProcessingException extends RuntimeException {
    public KafkaProcessingException(String message) { super(message); }
    public KafkaProcessingException(String message, Throwable cause) { super(message, cause); }
}

// KafkaMessageException — error al enviar mensaje al broker
public class KafkaMessageException extends RuntimeException {
    public KafkaMessageException(String message) { super(message); }
    public KafkaMessageException(String message, Throwable cause) { super(message, cause); }
}

// NonRetryableClientDataException — error de negocio, va directo al DLQ sin reintentos
public class NonRetryableClientDataException extends RuntimeException {
    public NonRetryableClientDataException(String message) { super(message); }
    public NonRetryableClientDataException(String message, Throwable cause) { super(message, cause); }
}
```

### 4.3 Configuración de dominio

**Ruta:** `src/main/java/{paquete-dominio}/config/{Dominio}KafkaConfig.java`

```java
@EqualsAndHashCode(callSuper = true)
@Slf4j
@Data
@EnableKafka
@Configuration
public class {Dominio}KafkaConfig extends KafkaConfig {

    @Value("${spring.kafka.consumer.group-id}")
    private String consumerGroupId;

    @Value("${app.kafka.topic.dlt}")
    private String dltTopic;

    @Bean
    public ConsumerFactory<String, {InputDto}> {dominio}ConsumerFactory() {
        log.info("[{Dominio}KafkaConfig] ConsumerFactory para {InputDto} - Group: {}", consumerGroupId);
        return createConsumerFactory(consumerGroupId, {InputDto}.class);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, {InputDto}> {dominio}ListenerContainerFactory() {
        log.info("[{Dominio}KafkaConfig] ListenerContainerFactory con DLQ: {}", dltTopic);
        return createListenerContainerFactoryWithDlq({dominio}ConsumerFactory(), dltTopic);
    }

    // Si OutputDto == InputDto, solo un ProducerFactory basta
    @Bean
    public ProducerFactory<String, {OutputDto}> {dominio}ProducerFactory() {
        log.info("[{Dominio}KafkaConfig] ProducerFactory para {OutputDto}");
        return createProducerFactory();
    }

    @Bean
    public KafkaTemplate<String, {OutputDto}> {dominio}KafkaTemplate() {
        log.info("[{Dominio}KafkaConfig] KafkaTemplate para {OutputDto}");
        return createKafkaTemplate({dominio}ProducerFactory());
    }

    // Solo si hay tópico de notificaciones
    @Bean
    public ProducerFactory<String, NotificationMessageDto> notificationProducerFactory() {
        log.info("[{Dominio}KafkaConfig] ProducerFactory para NotificationMessageDto");
        return createProducerFactory();
    }

    @Bean
    public KafkaTemplate<String, NotificationMessageDto> notificationKafkaTemplate() {
        log.info("[{Dominio}KafkaConfig] KafkaTemplate para NotificationMessageDto");
        return createKafkaTemplate(notificationProducerFactory());
    }

    @Bean
    public KafkaTemplate<String, Object> dlqKafkaTemplate() {
        log.info("[{Dominio}KafkaConfig] KafkaTemplate genérico para DLQ manual - Topic: {}", dltTopic);
        return createDlqKafkaTemplate();
    }
}
```

### 4.4 Listener (Consumer)

**Ruta:** `src/main/java/{paquete-dominio}/listener/{Dominio}Listener.java`

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class {Dominio}Listener {

    private final {Dominio}Service {dominio}Service;
    private final AtomicLong maxProcessingTimeMs = new AtomicLong(0);

    @KafkaListener(
            topics = "${app.kafka.topic.input}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "{dominio}ListenerContainerFactory"
    )
    public void listen(@Payload {InputDto} message,
                       Acknowledgment acknowledgment,
                       @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                       @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                       @Header(KafkaHeaders.OFFSET) long offset) {
        try {
            log.info("[listen] Mensaje recibido - topic: {}, partition: {}, offset: {}", topic, partition, offset);

            if (message == null) {
                log.warn("[listen] Mensaje null recibido, descartando.");
                acknowledgment.acknowledge();
                return;
            }

            long start = System.currentTimeMillis();
            {dominio}Service.process(message);
            long elapsed = System.currentTimeMillis() - start;

            long prevMax = maxProcessingTimeMs.getAndUpdate(prev -> Math.max(prev, elapsed));
            if (elapsed > prevMax) {
                log.warn("[max-poll-tuning] Nuevo máximo: {} ms (anterior: {} ms)", elapsed, prevMax);
            } else {
                log.info("[max-poll-tuning] Procesamiento: {} ms (máx: {} ms)", elapsed, maxProcessingTimeMs.get());
            }

            acknowledgment.acknowledge();
            log.info("[listen] Procesamiento finalizado - offset: {}", offset);

        } catch (Exception e) {
            log.error("[listen] Error procesando mensaje - topic: {}, partition: {}, offset: {}, error: {}",
                    topic, partition, offset, e.getMessage(), e);
            throw e;
        }
    }
}
```

### 4.5 KafkaProducerService (interfaz + implementación)

**Ruta interfaz:** `src/main/java/{paquete-dominio}/services/KafkaProducerService.java`

```java
public interface KafkaProducerService {
    void enviarMensaje({OutputDto} mensaje);
    void enviarMensajeNotificacion(NotificationMessageDto notificacion); // solo si hay tópico notificación
}
```

**Ruta impl:** `src/main/java/{paquete-dominio}/services/impl/KafkaProducerServiceImpl.java`

```java
@Slf4j
@Service
public class KafkaProducerServiceImpl implements KafkaProducerService {

    private final KafkaTemplate<String, {OutputDto}> kafkaTemplate;
    private final KafkaTemplate<String, NotificationMessageDto> notificationKafkaTemplate;

    @Value("${app.kafka.topic.output}")
    private String outputTopic;

    @Value("${app.kafka.topic.notification}")
    private String notificationTopic;

    public KafkaProducerServiceImpl(
            KafkaTemplate<String, {OutputDto}> kafkaTemplate,
            KafkaTemplate<String, NotificationMessageDto> notificationKafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.notificationKafkaTemplate = notificationKafkaTemplate;
    }

    @Override
    public void enviarMensaje({OutputDto} mensaje) {
        log.info("[enviarMensaje] Enviando a {}: id={}", outputTopic, mensaje.getId());
        try {
            // Envío síncrono: garantiza entrega antes de continuar
            // La clave de partición garantiza orden por entidad de negocio
            var result = kafkaTemplate.send(outputTopic, String.valueOf(mensaje.getPartitionKey()), mensaje).get();
            log.info("[enviarMensaje] Enviado — topic: {}, partition: {}, offset: {}",
                    outputTopic, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
        } catch (Exception e) {
            log.error("[enviarMensaje] Error enviando a {} — id: {}", outputTopic, mensaje.getId(), e);
            throw new KafkaMessageException("Error al enviar mensaje a " + outputTopic, e);
        }
    }

    @Override
    public void enviarMensajeNotificacion(NotificationMessageDto notificacion) {
        log.info("[enviarMensajeNotificacion] Enviando notificación a {}", notificationTopic);
        try {
            var result = notificationKafkaTemplate.send(notificationTopic,
                    String.valueOf(notificacion.getCodigoSucursal()), notificacion).get();
            log.info("[enviarMensajeNotificacion] Enviada — topic: {}, partition: {}, offset: {}",
                    notificationTopic, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
        } catch (Exception e) {
            log.error("[enviarMensajeNotificacion] Error enviando notificación", e);
            throw new KafkaMessageException("Error al enviar notificación a " + notificationTopic, e);
        }
    }
}
```

> **Nota para Claude:** Adaptar los métodos `getId()` y `getPartitionKey()` según los campos reales del DTO que el usuario indicó. La clave de partición debe ser el identificador que garantiza orden por entidad de negocio (ej: codigoSucursal, rutComercio, etc.). Preguntar al usuario si no es obvio.

### 4.6 Properties — 4 ambientes

Crear o completar los properties para cada ambiente. Si ya existen, agregar solo las secciones Kafka faltantes.

**Template LOCAL** (`properties/...-local.properties` o `application-local.properties`):

```properties
# ===================================================================
# KAFKA - TOPICS
# ===================================================================
app.kafka.topic.input={nombre-topico-entrada}
app.kafka.topic.output={nombre-topico-salida}           # omitir si no aplica
app.kafka.topic.notification={nombre-topico-notificacion}
app.kafka.topic.dlt=dlq-{nombre-topico-entrada}
app.kafka.group-id={consumer-group}

# ===================================================================
# KAFKA - BROKER / SEGURIDAD
# ===================================================================
spring.kafka.bootstrap-servers=127.0.0.1:9092
# Sin autenticacion en local — addSecurityPropsIfNeeded() la omite para perfil "local"
spring.kafka.properties.security.protocol=PLAINTEXT
spring.kafka.properties.sasl.mechanism=PLAIN
spring.kafka.properties.sasl.jaas.config=
spring.kafka.properties.client.dns.lookup=use_all_dns_ips

# ===================================================================
# KAFKA - CONSUMER
# ===================================================================
spring.kafka.consumer.group-id={consumer-group}
spring.kafka.consumer.auto-offset-reset=latest
spring.kafka.consumer.enable-auto-commit=false
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=*
spring.kafka.consumer.properties.spring.json.use.type.headers=false
spring.kafka.consumer.properties.request.timeout.ms=30000
spring.kafka.consumer.properties.session.timeout.ms=45000
spring.kafka.consumer.properties.max.poll.interval.ms=300000
spring.kafka.consumer.properties.max.poll.records=1
spring.kafka.consumer.properties.fetch.max.bytes=52428800
spring.kafka.consumer.properties.fetch.min.bytes=1

# ===================================================================
# KAFKA - PRODUCER
# ===================================================================
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.producer.acks=all
spring.kafka.producer.retries=3
spring.kafka.producer.properties.spring.json.add.type.headers=false
spring.kafka.producer.properties.spring.json.trusted.packages=*
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5
spring.kafka.producer.properties.delivery.timeout.ms=120000
spring.kafka.producer.properties.request.timeout.ms=20000
spring.kafka.producer.properties.max.block.ms=60000
spring.kafka.producer.compression-type=none
spring.kafka.producer.properties.batch.size=16384
spring.kafka.producer.properties.buffer.memory=5242880
# linger.ms=0: envio sincrono con .get(), no hay batching real
spring.kafka.producer.properties.linger.ms=0
spring.kafka.producer.properties.max.request.size=1048576

# ===================================================================
# LOGGING
# ===================================================================
logging.level.root=INFO
logging.level.{paquete-raiz}=DEBUG
logging.level.org.apache.kafka=WARN
logging.level.org.springframework.kafka=WARN
```

**Template DEVELOP/QA** (`...-develop.properties` / `...-qa.properties`):

```properties
# ===================================================================
# KAFKA - TOPICS
# ===================================================================
app.kafka.topic.input={nombre-topico-entrada}
app.kafka.topic.output={nombre-topico-salida}
app.kafka.topic.notification={nombre-topico-notificacion}
app.kafka.topic.dlt=dlq-{nombre-topico-entrada}
app.kafka.group-id={consumer-group}

# ===================================================================
# KAFKA - BROKER / SEGURIDAD
# ===================================================================
spring.kafka.bootstrap-servers=${BYSF_LIQSVBO_BOOTSTRAP_SERVER_CONFLUENT}
spring.kafka.properties.security.protocol=SASL_SSL
spring.kafka.properties.sasl.mechanism=PLAIN
spring.kafka.properties.sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username='${BYSF_LIQSVBO_USER_NAME_CONFLUENT}' password='${BYSF_LIQSVBO_PASSWORD_CONFLUENT}';
spring.kafka.properties.client.dns.lookup=use_all_dns_ips
spring.kafka.properties.session.timeout.ms=45000
spring.kafka.properties.client.id=${spring.application.name}
# Deshabilita telemetría KIP-714 — evita OOM por ZSTD bajo presión de heap
spring.kafka.properties.enable.metrics.push=false

# ===================================================================
# KAFKA - CONSUMER
# ===================================================================
spring.kafka.consumer.group-id={consumer-group}
spring.kafka.consumer.auto-offset-reset=latest
spring.kafka.consumer.enable-auto-commit=false
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=*
spring.kafka.consumer.properties.spring.json.use.type.headers=false
spring.kafka.consumer.properties.request.timeout.ms=30000
# Aumentado para soportar mensajes con procesamiento pesado (consultas BD, Lambda, etc.)
spring.kafka.consumer.properties.max.poll.interval.ms=3600000
spring.kafka.consumer.properties.max.poll.records=1
spring.kafka.consumer.properties.fetch.max.bytes=52428800
spring.kafka.consumer.properties.fetch.min.bytes=1

# ===================================================================
# KAFKA - PRODUCER
# ===================================================================
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.producer.acks=all
spring.kafka.producer.retries=3
spring.kafka.producer.properties.spring.json.add.type.headers=false
spring.kafka.producer.properties.spring.json.trusted.packages=*
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5
spring.kafka.producer.properties.delivery.timeout.ms=120000
spring.kafka.producer.properties.request.timeout.ms=20000
spring.kafka.producer.properties.max.block.ms=60000
spring.kafka.producer.compression-type=lz4
spring.kafka.producer.properties.batch.size=16384
spring.kafka.producer.properties.buffer.memory=5242880
spring.kafka.producer.properties.linger.ms=0
# 10MB — soporta modo FULL con listas grandes de transacciones en notificaciones
spring.kafka.producer.properties.max.request.size=10485760

# ===================================================================
# LOGGING
# ===================================================================
logging.level.root=INFO
logging.level.{paquete-raiz}=DEBUG          # DEBUG en develop/qa
logging.level.org.apache.kafka=ERROR
logging.level.org.springframework.kafka=ERROR
```

**Template MASTER** (igual que develop/qa, con estas diferencias):

```properties
# En master:
logging.level.{paquete-raiz}=INFO           # INFO, no DEBUG en producción
spring.kafka.consumer.properties.max.poll.interval.ms=3600000
```

---

## PASO 5 — Tests unitarios

### 5.1 Test del Listener

**Ruta:** `src/test/java/{paquete-dominio}/listener/{Dominio}ListenerTest.java`

Incluir estos casos de prueba:

```java
@ExtendWith(MockitoExtension.class)
class {Dominio}ListenerTest {

    @Mock private {Dominio}Service {dominio}Service;
    @Mock private Acknowledgment acknowledgment;

    @InjectMocks private {Dominio}Listener listener;

    // CASO 1: Procesamiento exitoso → servicio llamado → ACK realizado
    @Test
    void listen_mensajeValido_procesaYAcknowledge() {
        {InputDto} message = // crear instancia de prueba
        listener.listen(message, acknowledgment, "topic", 0, 0L);
        verify({dominio}Service).process(message);
        verify(acknowledgment).acknowledge();
    }

    // CASO 2: Mensaje null → ACK sin procesar → servicio NO llamado
    @Test
    void listen_mensajeNull_acknowledgeYDescarta() {
        listener.listen(null, acknowledgment, "topic", 0, 0L);
        verify(acknowledgment).acknowledge();
        verifyNoInteractions({dominio}Service);
    }

    // CASO 3: Servicio lanza excepción → NO se hace ACK → excepción propagada (DLQ la captura)
    @Test
    void listen_servicioLanzaExcepcion_noAcknowledgeYPropagaError() {
        {InputDto} message = // crear instancia de prueba
        doThrow(new RuntimeException("error de prueba")).when({dominio}Service).process(any());
        assertThrows(RuntimeException.class,
                () -> listener.listen(message, acknowledgment, "topic", 0, 0L));
        verify(acknowledgment, never()).acknowledge();
    }

    // CASO 4: Orden correcto → servicio ANTES que acknowledge
    @Test
    void listen_ordenCorrecto_servicioAntesQueAcknowledge() {
        {InputDto} message = // crear instancia de prueba
        InOrder inOrder = inOrder({dominio}Service, acknowledgment);
        listener.listen(message, acknowledgment, "topic", 0, 0L);
        inOrder.verify({dominio}Service).process(message);
        inOrder.verify(acknowledgment).acknowledge();
    }
}
```

### 5.2 Test del Producer

**Ruta:** `src/test/java/{paquete-dominio}/services/impl/KafkaProducerServiceImplTest.java`

```java
@ExtendWith(MockitoExtension.class)
class KafkaProducerServiceImplTest {

    @Mock private KafkaTemplate<String, {OutputDto}> kafkaTemplate;
    @Mock private KafkaTemplate<String, NotificationMessageDto> notificationKafkaTemplate;

    @InjectMocks private KafkaProducerServiceImpl kafkaProducerService;

    // CASO 1: enviarMensaje exitoso → send llamado con clave correcta
    @Test
    void enviarMensaje_exitoso_enviaMensajeConClaveCorrecta() throws Exception {
        {OutputDto} dto = // crear instancia
        var sendResult = mockSendResult(kafkaTemplate);
        kafkaProducerService.enviarMensaje(dto);
        verify(kafkaTemplate).send(any(), eq(String.valueOf(dto.getPartitionKey())), eq(dto));
    }

    // CASO 2: enviarMensajeNotificacion exitoso
    @Test
    void enviarMensajeNotificacion_exitoso_enviaMensaje() throws Exception {
        NotificationMessageDto notif = // crear instancia
        var sendResult = mockSendResult(notificationKafkaTemplate);
        kafkaProducerService.enviarMensajeNotificacion(notif);
        verify(notificationKafkaTemplate).send(any(), any(), eq(notif));
    }

    // CASO 3: error en send → lanza KafkaMessageException
    @Test
    void enviarMensaje_errorEnSend_lanzaKafkaMessageException() {
        {OutputDto} dto = // crear instancia
        when(kafkaTemplate.send(any(), any(), any()))
                .thenThrow(new RuntimeException("broker no disponible"));
        assertThrows(KafkaMessageException.class,
                () -> kafkaProducerService.enviarMensaje(dto));
    }

    // Helper: mockear CompletableFuture retornado por kafkaTemplate.send().get()
    private <T> CompletableFuture<SendResult<String, T>> mockSendResult(
            KafkaTemplate<String, T> template) throws Exception {
        var future = mock(CompletableFuture.class);
        var sendResult = mock(SendResult.class);
        var metadata = mock(RecordMetadata.class);
        when(template.send(any(), any(), any())).thenReturn(future);
        when(future.get()).thenReturn(sendResult);
        when(sendResult.getRecordMetadata()).thenReturn(metadata);
        when(metadata.partition()).thenReturn(0);
        when(metadata.offset()).thenReturn(100L);
        return future;
    }
}
```

---

## PASO 6 — Verificación final

Una vez creados todos los archivos:

1. Ejecutar compilación:
   ```bash
   ./gradlew build -x test
   ```
   (En Windows: `gradlew.bat build -x test`)

2. Si compila correctamente, ejecutar tests:
   ```bash
   ./gradlew test
   ```

3. Reportar al usuario:
   - Lista de archivos creados con su ruta
   - Resultado de compilación y tests
   - Recordatorio de variables de entorno requeridas en local:
     ```
     SPRING_PROFILES_ACTIVE=local
     APP_NAME={nombre-aplicacion}
     SPRING_CONFIG_SERVER=http://localhost:8888
     ```
   - Recordatorio de ajustar los getters del DTO en `KafkaProducerServiceImpl` según los campos reales

---

## Reglas generales

- **Nunca** usar `enable.auto.commit=true`
- **Nunca** hacer `acknowledgment.acknowledge()` antes del procesamiento
- **Nunca** devolver `return` en null sin hacer ACK primero
- **Nunca** enviar al DLQ con fire-and-forget (siempre `.get()`)
- **Nunca** hardcodear retries como constante Java — leer desde `@Value`
- **Nunca** commitear credenciales en texto plano — siempre `${VAR:fallback}`
- **Nunca** usar `linger.ms > 0` con envío síncrono (`.get()`)
- **Nunca** olvidar `enable.metrics.push=false` en proyectos con Confluent Cloud
- Los factories son **siempre manuales** — no confiar en la auto-configuración de Spring Boot para Kafka
- La clave de partición debe ser el identificador de negocio que garantiza orden (ej: codigoSucursal, rutComercio)
