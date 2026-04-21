# mcs-bysf-itau-tef

**Tipo:** `Service`

## Propiedades

- **responsabilidad**: Consume mensajes Kafka del topic bysf-itau-transfer, registra en tabla auditoria_transfer con estado PENDIENTE, llama a ITAU onlineAdvance API y actualiza estado (EXITOSO, ERROR_NEGOCIO, ERROR_TECNICO). Expone endpoint REST POST /v1/transfers/{id}/retry para reintento desde MCS admin.
- **apiExterna**: ITAU onlineAdvance - POST outer/businessservices/payments/paymentsexecution/v1/onlineAdvance
- **groupId**: group-id-itau-transfer
- **created_at**: 2026-04-15T19:50:28.184Z
- **topicDlq**: bysf-itau-transfer-dlq
- **resilience4j**: 3 reintentos con backoff fijo para errores 5xx/timeout ITAU
- **estados**: PENDIENTE, EXITOSO, ERROR_NEGOCIO (VPP00002-VPP00009), ERROR_TECNICO (5xx/timeout)
- **componentes**: TransferKafkaListener, TransferProcessorImpl, ItauTransferClientImpl, AuditoriaTransferRepository, TransferRetryController, AwsSsmService
- **packageBase**: cl.klap.bysf.itau.tef
- **topicInput**: bysf-itau-transfer
- **registradoPor**: juan.rodriguez el 2026-04-15
- **tabla**: auditoria_transfer
- **credenciales**: AWS SSM Parameter Store (x-ibm-client-id, x-ibm-client-secret, agreement, client_id, channel-id)

## Conecta con

- [[Standard KLAP BYSF]] `APLICA`

## Referenciado desde

- [[mcs-bysf-itau-tef-admin]] `DEPENDE_DE`

