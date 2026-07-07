# Skill: Spring Boot Properties — KLAP BYSF

## Cuándo usar este skill

Cuando necesitas crear o completar los archivos de configuración de un microservicio nuevo o existente.
El equipo usa **4 ambientes obligatorios**: `local`, `develop`, `qa`, `master`.

---

## Reglas del equipo

**DO:**
- Usar formato `.properties` (no `.yml`) para los archivos de ambiente
- Nombrar los archivos `application-{ambiente}.properties` o `{servicio}-{ambiente}.properties`
- Definir los 4 ambientes siempre: `local`, `develop`, `qa`, `master`
- Credenciales Confluent en variables de entorno: `${BYSF_LIQSVBO_BOOTSTRAP_SERVER_CONFLUENT}`, etc.
- `enable.metrics.push=false` en todos los ambientes cloud — CRÍTICO para evitar OOM
- `max.poll.records=1` siempre
- `linger.ms=0` cuando el envío es síncrono con `.get()`
- `max.poll.interval.ms=3600000` en develop/qa/master (soporta procesamiento pesado)
- `compression-type=lz4` en develop/qa/master; `none` en local
- `max.request.size=10485760` (10MB) en develop/qa/master para listas grandes
- `logging.level.{paquete-raiz}=DEBUG` en local y develop/qa; `INFO` en master

**DON'T:**
- No hardcodear bootstrap servers ni credenciales en ningún archivo — siempre `${VAR}`
- No dejar `sasl.jaas.config` con valores reales en local — vacío o placeholder
- No usar `enable.auto.commit=true`
- No omitir `enable.metrics.push=false` en ambientes con Confluent/MSK
- No poner `linger.ms > 0` con envío síncrono
- No usar `OFFSET/LIMIT` en properties de paginación — ver skill `repository.md`

---

## Estructura de archivos

```
src/main/resources/
├── application.properties          # config base (spring.application.name, server.port, actuator)
├── application-local.properties    # Kafka local, BD local, DEBUG logging
├── application-develop.properties  # Kafka Confluent DESA, variables de entorno
├── application-qa.properties       # Kafka Confluent QA, variables de entorno
└── application-master.properties   # Kafka Confluent PROD, INFO logging
```

> Si el proyecto usa carpeta `properties/`, respetar la estructura existente.

---

## Template LOCAL (`application-local.properties`)

```properties
# ===================================================================
# KAFKA - TOPICS
# ===================================================================
app.kafka.topic.input={nombre-topico-entrada}
app.kafka.topic.output={nombre-topico-salida}
app.kafka.topic.notification={nombre-topico-notificacion}
app.kafka.topic.dlt=dlq-{nombre-topico-entrada}
app.kafka.group-id={consumer-group}-local

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
spring.kafka.consumer.group-id={consumer-group}-local
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
# linger.ms=0: envio sincrono con .get(), batching nunca ocurre con max.poll.records=1
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

---

## Template DEVELOP (`application-develop.properties`)

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
# Deshabilita telemetria KIP-714 — evita OOM por ZSTD bajo presion de heap
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
# 1h — soporta procesamiento pesado (BD, Lambda, APIs externas)
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
logging.level.{paquete-raiz}=DEBUG
logging.level.org.apache.kafka=ERROR
logging.level.org.springframework.kafka=ERROR
```

---

## Template QA (`application-qa.properties`)

Idéntico a `develop`, reemplazando variables de entorno si el broker QA es distinto.
Si los brokers DESA y QA son el mismo Confluent, el archivo puede importar o copiar develop.

```properties
# Igual que develop — ajustar solo si el broker QA difiere
spring.kafka.bootstrap-servers=${BYSF_LIQSVBO_BOOTSTRAP_SERVER_CONFLUENT}
spring.kafka.properties.sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username='${BYSF_LIQSVBO_USER_NAME_CONFLUENT}' password='${BYSF_LIQSVBO_PASSWORD_CONFLUENT}';
# ... resto igual que develop
```

---

## Template MASTER (`application-master.properties`)

Igual que develop/qa con estas diferencias:

```properties
# UNICA diferencia respecto a develop/qa:
logging.level.{paquete-raiz}=INFO   # INFO en produccion — nunca DEBUG

# El resto es identico a develop/qa
spring.kafka.bootstrap-servers=${BYSF_LIQSVBO_BOOTSTRAP_SERVER_CONFLUENT}
spring.kafka.properties.security.protocol=SASL_SSL
spring.kafka.properties.sasl.mechanism=PLAIN
spring.kafka.properties.sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username='${BYSF_LIQSVBO_USER_NAME_CONFLUENT}' password='${BYSF_LIQSVBO_PASSWORD_CONFLUENT}';
spring.kafka.properties.enable.metrics.push=false
spring.kafka.consumer.properties.max.poll.interval.ms=3600000
spring.kafka.consumer.properties.max.poll.records=1
spring.kafka.producer.compression-type=lz4
spring.kafka.producer.properties.max.request.size=10485760
logging.level.org.apache.kafka=ERROR
logging.level.org.springframework.kafka=ERROR
```

---

## Diferencias clave entre ambientes

| Propiedad | local | develop/qa | master |
|-----------|-------|------------|--------|
| `bootstrap-servers` | `127.0.0.1:9092` | `${VAR_ENTORNO}` | `${VAR_ENTORNO}` |
| `security.protocol` | `PLAINTEXT` | `SASL_SSL` | `SASL_SSL` |
| `sasl.jaas.config` | vacío | `${USER}` / `${PASS}` | `${USER}` / `${PASS}` |
| `enable.metrics.push` | (omitido) | `false` | `false` |
| `max.poll.interval.ms` | `300000` (5 min) | `3600000` (1 h) | `3600000` (1 h) |
| `compression-type` | `none` | `lz4` | `lz4` |
| `max.request.size` | `1048576` (1 MB) | `10485760` (10 MB) | `10485760` (10 MB) |
| `logging.level.{paquete}` | `DEBUG` | `DEBUG` | `INFO` |

---

## Integración con build.gradle

El `build.gradle` tiene un `processResources` que reemplaza tokens en `application*.yml` al compilar:

```gradle
processResources {
    filesMatching('application*.yml') {
        filter(org.apache.tools.ant.filters.ReplaceTokens,
               tokens: [gitVersion: gitVersion, projectVersion: project.version],
               beginToken: '@',
               endToken: '@')
    }
}
```

Usar el delimitador `@` (no `${}`) para no conflictuar con las variables de Spring:

```yaml
# En application.yml base
info:
  app:
    version: @gitVersion@
    build: @projectVersion@
```
