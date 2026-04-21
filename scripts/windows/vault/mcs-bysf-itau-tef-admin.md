# mcs-bysf-itau-tef-admin

**Tipo:** `Service`

## Propiedades

- **responsabilidad**: CRUD REST para transacciones ITAU TEF. Lista con cursor-based pagination y filtros (estado, fechaDesde, fechaHasta). Permite corregir campos del beneficiario (numberId, account.number, bankId, type, amount) en registros PENDIENTE/ERROR_NEGOCIO/ERROR_TECNICO. Dispara reintento llamando al endpoint REST de mcs-bysf-itau-tef.
- **endpoints**: GET /v1/transfers, PATCH /v1/transfers/{id}, POST /v1/transfers/{id}/retry
- **autenticacion**: Sin auth - frontend maneja sesiones
- **camposCorregibles**: numberId, account.number, bankId, type, amount - transactionId es inmutable
- **created_at**: 2026-04-15T19:50:28.714Z
- **componentes**: TransferController, TransferServiceImpl, AuditoriaTransferRepository, McsTransferClientImpl
- **packageBase**: cl.klap.bysf.itau.tef
- **paginacion**: Cursor-based por PK con filtros estado + fechaDesde + fechaHasta
- **registradoPor**: juan.rodriguez el 2026-04-15
- **tabla**: auditoria_transfer (compartida con mcs-bysf-itau-tef)
- **clienteDependencia**: mcs-bysf-itau-tef POST /v1/transfers/{id}/retry via WebClient

## Conecta con

- [[Standard KLAP BYSF]] `APLICA`
- [[mcs-bysf-itau-tef]] `DEPENDE_DE`

