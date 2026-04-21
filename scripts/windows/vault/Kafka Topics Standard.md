# Kafka Topics Standard

**Tipo:** `KafkaTopics`

## Propiedades

- **envio**: SINCRONICO en dominios financieros - usa .get() para garantizar consistencia
- **output**: xxx-output-topic: topic de salida que publica el producer
- **input**: xxx-input-topic: topic de entrada que consume el listener
- **notification**: bysf-liqsvbo-notificacion: topic de notificaciones cross-domain
- **groupId**: xxx-consumer-group (sufijo -local en perfil local)
- **dlq**: xxx-dlq-topic: dead letter queue para mensajes fallidos

## Referenciado desde

- [[Kafka Config Standard]] `GESTIONA`

