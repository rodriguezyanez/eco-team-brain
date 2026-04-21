# Template Repository

**Tipo:** `CodeTemplate`

## Propiedades

- **cache**: Cache con TTL para datos de configuracion leidos frecuentemente
- **rowMapper**: En paquete mapper/ si tiene 20+ columnas o se reutiliza en multiples metodos
- **paginacion**: Cursor-based: WHERE id > :lastId ORDER BY id LIMIT :pageSize para tablas grandes
- **dependencia**: JdbcTemplate (inyeccion por constructor)
- **queries**: Siempre usar ConstantsQuery.XXX - NUNCA hardcodear SQL inline
- **errores**: Envolver DataAccessException en XxxPersistenceException
- **clase**: XxxRepository con @Repository @RequiredArgsConstructor @Slf4j

## Referenciado desde

- [[Standard KLAP BYSF]] `PROVEE`

