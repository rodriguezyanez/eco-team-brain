# Template Excepciones

**Tipo:** `CodeTemplate`

## Propiedades

- **jerarquia**: RuntimeException -> KafkaMessageException / JsonProcessingException / XxxException -> XxxClientException / XxxPersistenceException
- **cliente**: XxxClientException extends XxxException con statusCode + responseBody
- **nonRetryable**: NonRetryableClientDataException para errores de datos irrecuperables DLQ sin reintentos
- **persistencia**: XxxPersistenceException extends XxxException
- **base**: XxxException extends RuntimeException con constructores String y String+Throwable

## Referenciado desde

- [[Standard KLAP BYSF]] `PROVEE`

