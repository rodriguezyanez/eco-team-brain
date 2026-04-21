# Template KafkaListener

**Tipo:** `CodeTemplate`

## Propiedades

- **anotaciones**: @Component @Slf4j @RequiredArgsConstructor
- **flujo**: 1-validarMensaje 2-xxxProcessor.procesarXxx 3-acknowledgment.acknowledge 4-trackear tiempo procesamiento
- **circuitBreaker**: AtomicInteger consecutiveFailures, threshold=10, reset timeout=60s
- **errorInfraestructura**: Exception generica -> re-throw para que KafkaConfig maneje reintentos automaticos
- **metodo**: consumir(@Payload XxxInputDto mensaje, @Header topic/partition/offset, Acknowledgment)
- **errorDeterminista**: IllegalArgumentException o IllegalStateException -> enviarADlqManual + acknowledge
- **tracking**: AtomicLong maxProcessingTimeMs para ajustar max.poll.interval.ms
- **clase**: XxxKafkaListener

## Referenciado desde

- [[Standard KLAP BYSF]] `PROVEE`

