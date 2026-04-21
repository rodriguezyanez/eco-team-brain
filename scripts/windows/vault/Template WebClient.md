# Template WebClient

**Tipo:** `CodeTemplate`

## Propiedades

- **envio**: SIEMPRE .block() sincrono para dominios financieros
- **cliente**: XxxClient @Component con WebClient inyectado
- **config**: XxxClientConfig @Configuration con WebClient Bean y timeout explicitoRN
- **retry**: Retry.fixedDelay(maxAttempts, backoffDelay) - NO reintenta IllegalArgumentException
- **timeout**: CONNECT_TIMEOUT + responseTimeout + ReadTimeoutHandler + WriteTimeoutHandler
- **errores**: onStatus 4xx -> XxxClientException con statusCode + body / 5xx -> igual

## Referenciado desde

- [[Standard KLAP BYSF]] `PROVEE`

