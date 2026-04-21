# Convenciones Logging

**Tipo:** `LoggingConventions`

## Propiedades

- **emojis**: Recomendado: check exito X error advertencia sobre mensaje-recibido mensaje-enviado rojo-circuit-breaker
- **warn**: WARN: situaciones anormales pero recuperables
- **debug**: DEBUG: payloads queries SQL - solo en local
- **error**: ERROR: errores que requieren investigacion inmediata
- **info**: INFO: inicio/fin procesamiento publicacion Kafka
- **contexto**: Incluir siempre idProceso y codigoSucursal en logs

## Referenciado desde

- [[Standard KLAP BYSF]] `DEFINE`

