# Kafka Config Standard

**Tipo:** `KafkaConfig`

## Propiedades

- **reintentos**: 3 reintentos con 5s backoff antes de DLQ
- **nonRetryable**: NonRetryableClientDataException para errores deterministas - va a DLQ sin reintentos
- **seguridad**: local: PLAINTEXT, otros perfiles: SASL_SSL con AWS_MSK_IAM
- **ackMode**: MANUAL - control explicito de commits at-least-once
- **maxPollRecords**: max.poll.records=1 - procesa de a 1 para backpressure y evitar timeouts
- **deserializer**: ErrorHandlingDeserializer como wrapper de JsonDeserializer - mensajes malformados van a DLQ automaticamente
- **idempotencia**: ACKS=all en producers
- **metricas**: enable.metrics.push=false - CRITICO para evitar OOM en MSK/Confluent
- **nota**: NO es @Configuration - es clase base abstracta
- **clase**: global/config/KafkaConfig.java

## Conecta con

- [[Kafka Topics Standard]] `GESTIONA`

## Referenciado desde

- [[Standard KLAP BYSF]] `DEFINE`

