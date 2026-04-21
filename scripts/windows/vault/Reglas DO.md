# Reglas DO

**Tipo:** `BestPractices`

## Propiedades

- **r2**: Usar Lombok: @Data @Builder @RequiredArgsConstructor @Slf4j
- **r3**: Logging apropiado: DEBUG local INFO produccion - incluir idProceso y codigoSucursal
- **r4**: Tests unitarios: 95 XxxException XxxClientException XxxPersistenceException
- **r6**: JdbcTemplate para PostgreSQL - nunca JPA/Hibernate
- **r7**: Factory Pattern para Kafka: extender KafkaConfig base
- **r8**: Naming DTOs consistente: InputDto OutputDto RequestDto ResponseDto
- **r9**: AckMode MANUAL en Kafka para at-least-once
- **r21**: JavaDoc OBLIGATORIO en todos los metodos explicando objetivo o funcionamiento
- **r10**: max.poll.records=1 para backpressure
- **r20**: Ajustar max.poll.interval.ms segun tiempo real de procesamiento con AtomicLong
- **r12**: ErrorHandlingDeserializer como wrapper de JsonDeserializer
- **r11**: enable.metrics.push=false CRITICO para evitar OOM en MSK
- **r14**: Cache con TTL en repositorio para datos de configuracion
- **r13**: Paginacion cursor-based para tablas con mas de 500 registros
- **r16**: Timeout explicito 3s en PostgresHealthIndicator
- **r15**: Envio Kafka sincrono en dominios financieros
- **r18**: Clasificar errores listener: deterministas a DLQ inmediato vs infraestructura re-throw
- **r17**: RowMappers en paquete mapper/ para 20+ columnas o reutilizados
- **r19**: NonRetryableClientDataException para errores irrecuperables hacia DLQ sin reintentos
- **r1**: Usar service interfaces: siempre definir interface antes de implementacion

## Referenciado desde

- [[Standard KLAP BYSF]] `DEFINE`

