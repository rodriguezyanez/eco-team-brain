# Persistencia Standard

**Tipo:** `Database`

## Propiedades

- **motor**: PostgreSQL Aurora (AWS)
- **cache**: Cache con TTL en repositorio para datos de configuracion leidos en cada mensaje
- **acceso**: JdbcTemplate - NO JPA/Hibernate
- **rowMappers**: En paquete mapper/ cuando son complejos 20+ columnas o reutilizados
- **paginacion**: Cursor-based por PK para tablas con mas de 500 registros - NO OFFSET/LIMIT
- **auditoria**: AuditoriaXxxRepository para trazabilidad de todas las operaciones
- **errorHandling**: Envolver DataAccessException en XxxPersistenceException
- **queries**: Centralizadas en ConstantsQuery.java - no hardcodear SQL

## Referenciado desde

- [[Standard KLAP BYSF]] `DEFINE`

