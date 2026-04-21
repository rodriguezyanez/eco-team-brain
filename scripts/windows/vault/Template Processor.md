# Template Processor

**Tipo:** `CodeTemplate`

## Propiedades

- **impl**: XxxProcessorImpl en services/impl/ con @Service @Slf4j @RequiredArgsConstructor
- **compensacion**: Fallos en pasos 2-6: auditar como PENDIENTE o ERROR para retry manual
- **patron**: Saga: 1-validar 2-consultar API externa 3-procesar logica negocio 4-persistir DB 5-publicar Kafka output 6-publicar notificacion
- **interface**: XxxProcessor en services/
- **nota**: Orquestador principal - coordina todos los servicios del dominio

## Referenciado desde

- [[Standard KLAP BYSF]] `PROVEE`

