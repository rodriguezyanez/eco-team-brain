# Reglas DONT

**Tipo:** `AntiPatterns`

## Propiedades

- **r2**: No crear nuevos error handlers Kafka sin extender el de KafkaConfig
- **r3**: No modificar NotificationMessageDto sin coordinacion cross-team
- **r4**: No usar JPA/Hibernate: arquitectura basada en JDBC puro con JdbcTemplate
- **r5**: No hacer bypass del service layer: siempre usar las interfaces
- **r6**: No usar OFFSET/LIMIT para paginacion sobre tablas grandes: cursor-based por PK
- **r7**: No crear multiples consumer groups para el mismo topic sin justificacion documentada
- **r8**: No omitir enable.metrics.push=false: provoca OOM progresivo en MSK en produccion
- **r9**: No hardcodear SQL fuera de ConstantsQuery
- **r10**: No ignorar max.poll.interval.ms: si procesamiento supera el intervalo Kafka expulsa al consumer
- **r12**: No enviar a DLQ desde listener para errores de infraestructura: dejar que KafkaConfig maneje reintentos
- **r11**: No usar cache sin TTL en repositorios: datos congelados generan bugs dificiles de diagnosticar
- **r13**: No omitir JavaDoc en metodos publicos
- **r1**: No duplicar configuracion Kafka: extender la clase base KafkaConfig

## Referenciado desde

- [[Standard KLAP BYSF]] `DEFINE`

