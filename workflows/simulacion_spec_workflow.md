# Registro de Simulaciones — Workflows SDD KLAP BYSF

Este archivo consolida todas las simulaciones ejecutadas de los workflows SDD.
Cada simulación tiene un folio secuencial. **El folio más alto es la simulación más reciente.**

| Folio | Proyecto | Dominio | Fecha | Workflow | Versión |
|-------|---------|---------|-------|---------|---------|
| [001](#folio-001) | `mandato-service` | 🏦 Banca — mandatos de pago | 2026-07-13 | `fase_spec_refactor.md` | v1.1 |
| [002](#folio-002) | `agenda-service` | 🏥 Salud — agenda médica | 2026-07-13 | `fase_spec_refactor.md` | v1.1 |
| [003](#folio-003) | `inventario-service` | 🛒 Retail — inventario | 2026-07-13 | `fase_spec_refactor.md` | v1.2 |
| [004](#folio-004) | `envio-service` | 📦 Logística — despacho y envíos | 2026-07-13 | `fase_spec_refactor.md` | v1.2 |
| [005](#folio-005) | `factura-service` | 💰 Finanzas — facturas electrónicas | 2026-07-13 | `fase_spec.md` | v2.1 |
| [006](#folio-006) | `conciliacion-batch` | 💳 Finanzas — batch conciliación de pagos | 2026-07-15 | `fase_spec_refactor.md` | v1.2+ |

---

## Folio 001

**Proyecto:** `mandato-service`
**Dominio:** 🏦 Banca — gestión de mandatos de pago
**Versión del workflow:** `fase_spec_refactor.md` v1.1
**Ámbito:** Solo Refactorización (sin nuevos requerimientos)
**Fecha:** 2026-07-13
**Hallazgos clave:** God class 850 líneas · token activo en repo · sin soft delete · tests con `@Ignore` en CI
**Nota:** Primera simulación — el workflow aún no tenía los ítems de Builder ni concurrencia profunda. Builder y TOCTOU no fueron detectados proactivamente.

---

### Conversación

**[Dev]**
```
sdd-refactor:
```

**[Agente]**
> Leyendo proyecto local...
> Detecté `mandato-service` — Java 8 · Spring Boot 2.3.12 · Maven.
> ¿Hay nuevos requerimientos además de la refactorización?
> - Si **sí**: dime la fuente
> - Si **no**: procedemos con el análisis

**[Dev]**
> No, solo refactorización.

**[Agente]**
> Ámbito activo: solo Refactorización. Comienzo Fase 1.
> *(leyendo `pom.xml`, estructura de paquetes, `application.properties`, clases principales y tests...)*
>
> **Pregunta 1 —** Encontré la URL de la API bancaria hardcodeada en `MandatoService.java` y un token en `application.properties` en texto plano. ¿Este token ya fue rotado o sigue activo en producción?
>
> **Pregunta 2 —** El único test existente (`MandatoServiceTest`) hace `@SpringBootTest` y conecta a BD real. ¿Hay ambiente de pruebas con BD disponible en CI, o los tests están saltados en el pipeline?
>
> **Pregunta 3 —** `DELETE /mandatos/{id}` hace borrado físico. ¿Existe requisito de auditoría que obligue a conservar el historial?

**[Dev]**
> El token sigue activo, hay que rotarlo urgente. Los tests están saltados en CI con `@Ignore`. El borrado físico debería ser soft delete — los mandatos eliminados los consulta el equipo de auditoría.

**[Agente]**
> Anotado. Token activo = riesgo crítico — T1 bloqueante. Soft delete requerido. Tests saltados → characterization tests como primera tarea.
>
> **Pregunta 4 —** ¿Hay servicios o el frontend que consuman `POST /mandatos` o `GET /mandatos/{id}`? ¿Los contratos REST son inamovibles?

**[Dev]**
> Sí, el frontend y un microservicio de cobranza consumen ambos endpoints. Contratos inamovibles.

**[Agente]**
> Contratos REST congelados. Generando entregable de Fase 1...

---

### Entregable Fase 1

**Estado actual:** Java 8 · Spring Boot 2.3.12 · MVC sin separación real de capas

**Inventario:**
```
cl.klap.mandato/
├── controller/  MandatoController       ← validación inline
├── service/     MandatoService          ← God class 850 líneas
├── repository/  MandatoRepository       ← JpaRepository
├── model/       Mandato                 ← @Entity JPA
├── dto/         MandatoRequest/Response
└── config/      RestTemplateConfig      ← sin timeout/retry/CB
```

**Deuda técnica:**

| Categoría | Detalle | Severidad |
|-----------|---------|-----------|
| Versión obsoleta | Java 8 EOL + Spring Boot 2.3.x + CVEs en Hibernate 5.4.x | Alta |
| Antipatrón | God class `MandatoService` 850 líneas | Alta |
| Sin resiliencia | `RestTemplate` sin timeout/retry/CB | Alta |
| Config hardcodeada | URL API bancaria como constante en código | Alta |
| **Credencial activa** | Token en `application.properties` texto plano | Crítica |
| Tests inutilizables | `@SpringBootTest` con `@Ignore` — cobertura efectiva 0% | Alta |
| Sin logging estructurado | `System.out.println` + `e.printStackTrace()`, sin MDC | Media |
| Sin soft delete | Borrado físico — auditoría no puede consultar mandatos eliminados | Media |

**Contratos externos inamovibles:** `POST /mandatos`, `GET /mandatos/{id}`, `DELETE /mandatos/{id}`

**Riesgos:** Token activo en repo (Crítica) · `javax.*` → `jakarta.*` en Java 21 (Media) · Soft delete requiere migración Flyway (Media)

**Casos límite:**

| ID | Descripción |
|----|-------------|
| CL-01 | RUT nulo o vacío |
| CL-02 | Mandato duplicado mismo RUT activo |
| CL-03 | API bancaria retorna 404 |
| CL-04 | API bancaria timeout |
| CL-05 | `GET` con ID inexistente |
| CL-06 | `DELETE` de mandato ya eliminado |
| CL-07 | Sin correlation ID — error no trazable |
| CL-08 | Sin control de acceso — cualquier cliente puede eliminar |

**RF/CA:** RF-01 Crear mandato (CA-01: HTTP 201 + ACTIVO) · RF-02 Retornar por ID (CA-02: HTTP 200/404) · RF-03 Soft delete (CA-03: `deleted_at` seteado + HTTP 204)

---

**[Dev]** > si (aprueba Fase 1)

---

**[Agente]**
> *(leyendo design_patterns, processor, repository, webclient, exceptions, openapi...)*
>
> **Pregunta 1 —** Servicio pequeño, contratos congelados → recomiendo **Big Bang**. ¿O preferís Branch by Abstraction?
>
> **Pregunta 2 —** Circuit breaker API bancaria: ¿el equipo ya usa Resilience4j?

**[Dev]**
> Big Bang. Resilience4j ya lo usamos.

---

### Entregable Fase 2

**Estrategia:** Big Bang

**Arquitectura objetivo:**
```
cl.klap.bysf.mandato/
├── global/ config/ exception/ web/
└── dominio/mandato/
    ├── api/         MandatoController
    ├── application/ MandatoProcessor + MandatoProcessorImpl
    ├── infrastructure/repository/ MandatoRepository + Impl
    │               client/      BancariaClient + Impl
    └── model/       Mandato (record), MandatoRequest, MandatoResponse
```

**Patrones aplicados:** Template Method (MandatoProcessor) · Facade (MandatoProcessorImpl) · Strategy (manejo errores API bancaria)

**Mapa de transformación:**

| Componente actual | Acción | Componente objetivo |
|-------------------|--------|---------------------|
| `MandatoService` God class | Dividir | `MandatoProcessorImpl` (Saga) |
| `MandatoController` (con validación) | Limpiar | Thin controller |
| `MandatoRepository` (JPA) | Reemplazar | `JdbcTemplate` |
| `RestTemplateConfig` | Reemplazar | `BancariaClientImpl` WebClient + Resilience4j |
| Sin soft delete | Agregar | `deleted_at` + constraint único parcial |
| Token en properties | Reemplazar | `${BANCARIA_TOKEN}` env var |

**Concurrencia:**
- I/O-bound: `BancariaClientImpl` → WebClient timeout 3s + CB
- Race condition: `INSERT` + `UNIQUE (rut) WHERE deleted_at IS NULL` — BD rechaza duplicado
- CPU-bound: ninguna identificada

**Rollback:** `deleted_at` es NULL por defecto — revertir JAR no rompe el servicio anterior

---

**[Dev]** > avancemos (aprueba Fase 2)

---

**[Agente]**
> **Pregunta 1 —** El token activo: ¿lo rotás fuera del plan o lo incluimos como T1 bloqueante?

**[Dev]**
> inclúyela como T1, así queda registrado.

---

### Entregable Fase 3

**Tabla de tareas:**

| # | Tarea | Dep | Tam | Riesgo | CA/CL |
|---|-------|-----|-----|--------|-------|
| T1 | Rotar token + mover a `${BANCARIA_TOKEN}` en 4 properties | — | S | **Crítico** | RNF-03 |
| T2 | Characterization tests: POST, GET, DELETE comportamiento actual | T1 | M | Bajo | RF-01..03 |
| T3 | Flyway: `deleted_at` + constraint UNIQUE parcial | T1 | S | Medio | RF-03, CL-02 |
| T4 | Actualizar `pom.xml`: Java 21 + Spring Boot 3.5.x | T2 | M | **Alto** | RNF-01 |
| T5 | Crear jerarquía excepciones + GlobalExceptionHandler | T4 | S | Bajo | CL-03..06 |
| T6 | Crear `MandatoRepositoryImpl` JdbcTemplate (save/findById/findByRutActivo/softDelete) | T4, T5 | M | Bajo | CA-01..03, CL-02 |
| T7 | Crear `BancariaClientImpl` WebClient + CB Resilience4j + timeout 3s | T4, T5 | M | Medio | CA-01, CL-03, CL-04 |
| T8 | Crear `MandatoProcessorImpl` | T6, T7 | M | Bajo | CA-01..03, CL-01..02 |
| T9 | Refactorizar `MandatoController` thin | T8 | S | Bajo | CA-01..03 |
| T10 | MDC + correlation ID | T8 | S | Bajo | CL-07, RNF-04 |
| T11 | WebClientConfig + ResilienceConfig + OpenApiConfig | T4 | S | Bajo | RNF-01 |
| T12 | Tests de regresión + contrato REST | T9, T10 | M | Medio | RF-01..03 |

**Archivos generados:** `spec/mandato-service-refactor-spec.md` · `spec/mandato-service-refactor-plan.md`

---

---

## Folio 002

**Proyecto:** `agenda-service`
**Dominio:** 🏥 Salud — agenda médica de citas
**Versión del workflow:** `fase_spec_refactor.md` v1.1
**Ámbito:** Solo Refactorización (sin nuevos requerimientos)
**Fecha:** 2026-07-13
**Hallazgos clave:** MySQL → PostgreSQL · Google Calendar async best-effort · soft delete para auditoría · tests @Ignore en CI · dependencia externa de infraestructura
**Nota:** Segunda simulación — el workflow aún no tenía los ítems de Builder ni concurrencia profunda. Builder no fue detectado. TOCTOU mencionado solo como CL, sin tabla de estrategias descartadas. Se incorporó task `[EXT]` para dependencia de infraestructura.

---

### Conversación

**[Dev]**
```
sdd-refactor:
```

**[Agente]**
> Leyendo proyecto local...
> Detecté `agenda-service` — Java 11 · Spring Boot 2.4.5 · Maven · MySQL.
> ¿Hay nuevos requerimientos además de la refactorización?

**[Dev]**
> No, solo refactorización.

**[Agente]**
> Ámbito activo: solo Refactorización. Arrancando Fase 1.
>
> **Pregunta 1 —** El servicio usa MySQL pero el estándar KLAP BYSF es PostgreSQL. ¿La migración está en el alcance o MySQL debe mantenerse?
>
> **Pregunta 2 —** Hay una API key de Google Calendar en `application.properties` en texto plano. ¿Sigue activa?
>
> **Pregunta 3 —** `cancelarCita()` hace borrado físico. ¿Hay requisito de auditoría sobre citas canceladas?

**[Dev]**
> La migración a PostgreSQL sí está en el alcance, infraestructura ya lo aprobó. La key de Google sigue activa, hay que rotarla urgente. Las citas canceladas las necesita el área de estadísticas, así que necesitamos soft delete.

**[Agente]**
> Anotado. API key activa = T1 crítico. Soft delete requerido. Migración MySQL → PostgreSQL incluida.
>
> **Pregunta 4 —** ¿Hay otros microservicios o frontend que consuman los endpoints REST? ¿Los contratos son inamovibles?

**[Dev]**
> Sí, el portal de pacientes y el microservicio de recordatorios consumen esos endpoints. Contratos inamovibles.

**[Agente]**
> Contratos REST congelados. Generando entregable de Fase 1...

---

### Entregable Fase 1

**Estado actual:** Java 11 · Spring Boot 2.4.5 · MySQL · MVC sin separación

**Inventario:**
```
cl.klap.agenda/
├── controller/  AgendaController        ← validación inline + disponibilidad
├── service/     AgendaService           ← God class 620 líneas
├── repository/  CitaRepository          ← JpaRepository<Cita, Long>
│                MedicoRepository        ← JpaRepository<Medico, Long>
├── model/       Cita, Medico, Paciente  ← @Entity JPA bidireccional
├── dto/         CitaRequest, CitaResponse
└── config/      GoogleCalendarConfig    ← RestTemplate sin timeout
```

**Deuda técnica:**

| Categoría | Detalle | Severidad |
|-----------|---------|-----------|
| Versión obsoleta | Java 11 + Spring Boot 2.4.x sin soporte | Alta |
| BD no estándar | MySQL en lugar de PostgreSQL | Alta |
| Antipatrón | `AgendaService` God class 620 líneas | Alta |
| Antipatrón | Validación disponibilidad inline en controller | Media |
| Sin resiliencia | RestTemplate Google Calendar sin timeout/retry/CB | Alta |
| **Credencial activa** | Google API key en properties texto plano | Crítica |
| Sin soft delete | `cancelarCita()` hace DELETE físico | Alta |
| JPA bidireccional | `@OneToMany`/`@ManyToOne` lazy no controlado — riesgo N+1 | Media |
| Tests inutilizables | 2 `@SpringBootTest` con MySQL real — tardan 90s, fallan en CI | Alta |
| Sin logging estructurado | Logs sin MDC ni correlation ID | Media |

**Contratos externos inamovibles:** `POST /citas`, `GET /citas/{id}`, `PUT /citas/{id}/cancelar`

**Casos límite:**

| ID | Descripción |
|----|-------------|
| CL-01 | `POST /citas` con médico sin disponibilidad |
| CL-02 | Cita duplicada — mismo paciente, médico y horario |
| CL-03 | Google Calendar timeout o no disponible |
| CL-04 | `GET` de cita cancelada — debe retornar con `cancelled_at` |
| CL-05 | `PUT cancelar` sobre cita ya cancelada |
| CL-06 | `PUT cancelar` con ID inexistente → HTTP 404 |
| CL-07 | Sin correlation ID — error no trazable |
| CL-08 | Sin control de que el paciente solo cancele sus propias citas |

---

**[Dev]** > si (aprueba Fase 1)

---

**[Agente]**
> **Pregunta 1 —** Servicio pequeño, contratos congelados → recomiendo **Big Bang** para MySQL → PostgreSQL. ¿O Branch by Abstraction?
>
> **Pregunta 2 —** Una caída de Google Calendar: ¿bloquea la creación de citas o la cita se crea igual y la sync es best-effort?

**[Dev]**
> Big Bang, tenemos ventana de mantención. Google Calendar no debe bloquear — cita se crea siempre, sync best-effort.

---

### Entregable Fase 2

**Estrategia:** Big Bang — contratos inamovibles · Google Calendar async best-effort

**Arquitectura objetivo:**
```
cl.klap.bysf.agenda/
├── global/ config/ (WebClient, Resilience, OpenApi) exception/ web/
└── dominio/agenda/
    ├── api/         AgendaController
    ├── application/ CitaProcessor + CitaProcessorImpl + CatalogoSyncJob
    ├── infrastructure/repository/ CitaRepositoryImpl + MedicoRepositoryImpl (JdbcTemplate + PostgreSQL)
    │               client/      GoogleCalendarClientImpl (WebClient async)
    └── model/       Cita, Medico (records), CitaRequest, CitaResponse (inalterados)
```

**Patrones aplicados:** Facade (CitaProcessorImpl) · Observer (CitaCreadaEvent / CitaCanceladaEvent → sync async desacoplada) · Template Method (flujo crear/cancelar)

**Concurrencia:**
- I/O-bound: `GoogleCalendarClientImpl` → `CompletableFuture` async + timeout 5s
- Race condition: `UNIQUE (medico_id, slot) WHERE cancelled_at IS NULL` + captura `DataIntegrityViolationException`
- *Nota: Builder no fue detectado ni evaluado en esta simulación (gap del workflow v1.1)*

**Dependencia externa:** Infraestructura provisiona PostgreSQL antes del sprint

**Rollback:** `cancelled_at` NULL por defecto — revertir JAR no rompe servicio anterior

---

**[Dev]** > aprobado (aprueba Fase 2)

---

**[Agente]**
> **Pregunta 1 —** La migración MySQL → PostgreSQL: ¿la gestiona infraestructura por separado o es task del dev?

**[Dev]**
> Infraestructura lo gestiona por separado, pero necesito que quede documentado como dependencia externa bloqueante.

---

### Entregable Fase 3

**Tabla de tareas:**

| # | Tipo | Tarea | Dep | Tam | Riesgo | CA/CL |
|---|------|-------|-----|-----|--------|-------|
| T1 | Refact. | Rotar API key Google + mover a `${GOOGLE_CALENDAR_KEY}` | — | S | **Crítico** | RNF-03 |
| T2 | [EXT] | Infraestructura provisiona PostgreSQL | T1 | — | **Alto** | — |
| T3 | Refact. | Characterization tests: POST/GET/PUT cancelar en MySQL actual | T1 | M | Bajo | RF-01..03 |
| T4 | Refact. | Auditar queries MySQL-específicas + documentar equivalentes PostgreSQL | T1 | S | Medio | — |
| T5 | Refact. | Actualizar `pom.xml`: Java 21, Spring Boot 3.5.x, driver PG, Resilience4j | T3 | M | **Alto** | RNF-01 |
| T6 | Refact. | Crear jerarquía excepciones + GlobalExceptionHandler | T5 | S | Bajo | CL-03..06 |
| T7 | Refact. | Crear CitaRepositoryImpl + MedicoRepositoryImpl JdbcTemplate + PostgreSQL | T2, T5, T6 | L | Medio | CA-01..03, CL-01, CL-02 |
| T8 | Refact. | Crear GoogleCalendarClientImpl WebClient async + retry + NoOpStrategy local | T5, T6 | M | Medio | CA-01, CA-03, CL-03 |
| T9 | Refact. | Crear CitaProcessorImpl + ApplicationEventPublisher | T7, T8 | M | Bajo | CA-01..03, CL-01, CL-02, CL-05 |
| T10 | Refact. | Refactorizar AgendaController thin | T9 | S | Bajo | CA-01..03 |
| T11 | Refact. | MDC + correlation ID | T9 | S | Bajo | CL-07, RNF-04 |
| T12 | Refact. | Script migración datos MySQL → PostgreSQL + validación integridad | T2, T4 | M | **Alto** | — |
| T13 | Refact. | Tests de regresión + contrato REST + concurrencia mismo slot | T10, T11 | M | Medio | RF-01..03, CL-02 |

**Archivos generados:** `spec/agenda-service-refactor-spec.md` · `spec/agenda-service-refactor-plan.md`

---

---

## Folio 003

**Proyecto:** `inventario-service`
**Dominio:** 🛒 Retail — gestión de inventario y catálogo de productos
**Versión del workflow:** `fase_spec_refactor.md` v1.2
**Ámbito:** Solo Refactorización (sin nuevos requerimientos)
**Fecha:** 2026-07-13
**Hallazgos clave:** SQL injection por concatenación · overselling real en producción (TOCTOU) · scheduler sin lock distribuido en 3 réplicas · CPU-bound 80k productos · Builder detectado proactivamente · tabla completa de patrones descartados
**Nota:** Primera simulación con workflow v1.2. Builder detectado en Fase 1. TOCTOU documentado con tabla de 4 estrategias evaluadas. 17 patrones GoF evaluados y justificados (aplicados + descartados). ThreadPoolTaskExecutor dimensionado explícitamente. Scheduler distribuido con Redisson. CPU-bound identificado y eliminado moviendo a SQL.

---

### Conversación

**[Dev]**
```
sdd-refactor:
```

**[Agente]**
> Leyendo proyecto local...
> Detecté `inventario-service` — Java 8 · Spring Boot 2.2.6 · Maven · PostgreSQL.
> ¿Hay nuevos requerimientos además de la refactorización?

**[Dev]**
> No, solo refactorización.

**[Agente]**
> Ámbito activo: solo Refactorización. Arrancando Fase 1.
>
> **Pregunta 1 —** `InventarioService.buscarProductos()` construye SQL concatenando strings con `if` para 5 parámetros opcionales. ¿Existen otras queries similares en el código o es la única?
>
> **Pregunta 2 —** `@Scheduled sincronizarCatalogo()` llama a la API del proveedor cada hora. ¿El servicio corre con múltiples réplicas? Si es así, todas dispararán la sync simultáneamente.
>
> **Pregunta 3 —** `actualizarStock()` y `verificarDisponibilidad()` son dos operaciones separadas — dos requests simultáneas al mismo SKU pueden generar overselling. ¿Esto ha ocurrido en producción?
>
> **Pregunta 4 —** API key del proveedor en `application.properties` en texto plano. ¿Sigue activa?

**[Dev]**
> Solo esa query de búsqueda tiene filtros opcionales. Sí corremos con 3 réplicas y nadie se dio cuenta del problema del scheduler — hay que resolverlo. El overselling ha ocurrido algunas veces. La key del proveedor sigue activa, hay que rotarla.

**[Agente]**
> Cuatro impactos críticos confirmados: Builder (SQL injection), scheduler distribuido, TOCTOU real, API key activa.
>
> **Pregunta 5 —** Los reportes generan agregaciones en memoria iterando sobre todos los productos. ¿Hay un volumen aproximado?

**[Dev]**
> Cerca de 80.000 productos activos. Los reportes a veces se ponen lentos.

**[Agente]**
> Con 80k productos las agregaciones en memoria son CPU-bound significativas. Las muevo a SQL. Generando Fase 1...

---

### Entregable Fase 1

**Estado actual:** Java 8 · Spring Boot 2.2.6 · PostgreSQL · MVC sin separación

**Inventario:**
```
cl.klap.inventario/
├── controller/  InventarioController    ← validación inline + paginación
├── service/     InventarioService       ← God class 720 líneas
├── repository/  ProductoRepository      ← JpaRepository<Producto, String>
│                StockMovimientoRepository ← JpaRepository<StockMovimiento, Long>
├── model/       Producto, StockMovimiento ← @Entity JPA
├── dto/         ProductoRequest/Response, StockUpdateRequest
└── config/      ProveedorApiConfig      ← RestTemplate sin timeout/retry
```

**Deuda técnica:**

| Categoría | Detalle | Severidad |
|-----------|---------|-----------|
| Versión obsoleta | Java 8 EOL + Spring Boot 2.2.x sin soporte | Alta |
| Antipatrón | God class `InventarioService` 720 líneas | Alta |
| **SQL injection** | `buscarProductos()` concatena strings con valores de usuario | Crítica |
| Sin resiliencia | `RestTemplate` sin timeout/retry/CB | Alta |
| **Credencial activa** | API key proveedor en properties texto plano | Crítica |
| **Scheduler sin lock** | `@Scheduled sincronizarCatalogo()` en 3 réplicas — sync triplicada + conflictos | Alta |
| **TOCTOU confirmado** | `verificarDisponibilidad()` + `actualizarStock()` no atómicas — overselling real | Alta |
| CPU-bound sin aislar | Agregaciones en memoria sobre 80k productos — degrada hilo de negocio | Media |
| Tests inutilizables | 3 `@SpringBootTest` — lentos e inestables en CI | Alta |
| Sin logging estructurado | Logs sin MDC ni correlation ID | Media |

**Señales de Builder identificadas:**

| Candidato | Señal |
|-----------|-------|
| `InventarioService.buscarProductos(String, String, Double, Double, Boolean)` | 5 params opcionales + SQL concatenado sin parametrizar → **candidato prioritario** |
| `ProductoResponse` | 8 campos construidos manualmente en varios puntos → candidato a `@Builder` |

**Operaciones I/O-bound:**

| Operación | Estado actual | Problema |
|-----------|--------------|---------|
| `RestTemplate` a `api.proveedor.cl` en scheduler | Síncrono bloqueante | Sin timeout — fallo del proveedor congela el thread |
| `StockMovimientoRepository.findAllBySku()` en loop en reporte | N+1 queries | Con 80k productos genera miles de queries secuenciales |

**Operaciones CPU-bound:**

| Operación | Estado actual | Problema |
|-----------|--------------|---------|
| Agregación stock en `generarReporte()` | 80k productos en memoria con `stream().groupingBy()` | Consume CPU del hilo de negocio durante el reporte |

**Escenarios TOCTOU:**

| Par no atómico | Race condition | Evidencia |
|----------------|---------------|-----------|
| `verificarDisponibilidad(sku, cantidad)` → `actualizarStock(sku, -cantidad)` | Dos requests pasan verificación → ambas descuentan → stock negativo | Overselling confirmado en producción |

**Escala horizontal:** 3 réplicas en producción — toda race condition es real y frecuente.

**Casos límite:**

| ID | Descripción |
|----|-------------|
| CL-01 | `GET /productos` sin filtros — debe paginar, no retornar 80k |
| CL-02 | `PUT /stock` concurrente mismo SKU — no debe generar stock negativo |
| CL-03 | API proveedor timeout durante sincronizarCatalogo() |
| CL-04 | `GET /productos/{sku}` con SKU inexistente → HTTP 404 |
| CL-05 | `PUT /stock` con cantidad que llevaría stock a < 0 |
| CL-06 | Scheduler disparado simultáneamente por 3 réplicas |
| CL-07 | Sin correlation ID — error en reporte no trazable |
| CL-08 | `GET /productos` sin paginación — response de 80k registros |

---

**[Dev]** > aprobado (aprueba Fase 1)

---

**[Agente]**
> **Pregunta 1 —** Lock distribuido para el scheduler: ¿el equipo tiene Redis disponible, o propongo `pg_try_advisory_lock` en PostgreSQL?
>
> **Pregunta 2 —** Las agregaciones del reporte las propongo mover a SQL. ¿El reporte tiene SLA de tiempo o puede tolerar 2-3 segundos?

**[Dev]**
> Tenemos Redis. El reporte puede tolerar hasta 5 segundos.

**[Agente]**
> Lock distribuido con Redis (Redisson). Agregaciones en SQL con tolerancia 5s. Generando arquitectura...

---

### Entregable Fase 2

**Estrategia:** Big Bang — contratos inamovibles · schema PostgreSQL existente se mantiene

**Arquitectura objetivo:**
```
cl.klap.bysf.inventario/
├── global/ config/ (WebClient, Resilience, Redisson, OpenApi) exception/ web/
└── dominio/inventario/
    ├── api/         InventarioController
    ├── application/ ProductoProcessor + ProductoProcessorImpl + CatalogoSyncJob (con Redisson tryLock)
    ├── infrastructure/repository/ ProductoRepositoryImpl + StockRepositoryImpl (JdbcTemplate + Builder)
    │               client/      ProveedorClientImpl (WebClient async + CompletableFuture)
    └── model/       Producto (record @Builder), ProductoSearchQuery (record @Builder),
                     ProductoRequest (inalterado), ProductoResponse (@Builder)
```

**Patrones GoF aplicados:**

| Patrón | Componente | Justificación |
|--------|-----------|--------------|
| **Builder** | `ProductoSearchQuery` + `ProductoRepositoryImpl.buscar()` + `ProductoResponse` | Fase 1: 5 params opcionales + SQL injection + 8 campos en response |
| **Facade** | `ProductoProcessorImpl` | Fase 1: God class con 4 responsabilidades mezcladas |
| **Strategy** | `CatalogoSyncJob`: FullSync vs DeltaSync | Fase 1: sync siempre completa — permitir incremental |
| **Proxy** | `@Cacheable` sobre `findBySku()` | Fase 1: `GET /{sku}` consultado frecuentemente por microservicio pedidos |
| **Iterator** | Cursor-based pagination en `ProductoRepositoryImpl` | Fase 1: CL-01 y CL-08 — 80k productos sin límite |

**Patrones GoF evaluados y descartados:**

| Patrón | Evaluado | Decisión | Justificación |
|--------|----------|----------|---------------|
| Abstract Factory | Sí | No aplica | No hay familias de objetos que varíen por contexto |
| Prototype | Sí | No aplica | No hay objetos costosos de crear ni variantes desde plantilla |
| Singleton | Sí | No aplica | Spring gestiona ciclo de vida de todos los beans |
| Adapter | Sí | No aplica | API del proveedor es REST/JSON compatible — sin adaptación de interfaz incompatible |
| Bridge | Sí | No aplica | No hay dos dimensiones independientes de variación |
| Composite | Sí | No aplica | No hay jerarquías de objetos ni reglas componibles |
| Decorator | Sí | No aplica | `@Cacheable` (AOP Spring) cubre el caso — no se necesita decorator manual |
| Flyweight | Sí | No aplica | Metadatos de categorías ya en BD — `@Cacheable` es suficiente |
| Chain of Responsibility | Sí | No aplica | 2 validaciones de stock — `if` directo más claro |
| Command | Sí | No aplica | Sin requisito de undo ni audit log de operaciones de stock |
| Mediator | Sí | No aplica | Sin comunicación compleja entre componentes internos |
| Memento | Sí | No aplica | `StockMovimiento` ya actúa como log histórico |
| Observer | Sí | No aplica | Sin eventos de dominio con múltiples reactores |
| State | Sí | No aplica | `Producto` solo tiene campo `activo` boolean — sin máquina de estados |
| Template Method | Sí | Aplica en `CatalogoSyncJob` | Esqueleto de sync fijo, algoritmo varía — ver Strategy |
| Visitor | Sí | No aplica | Sin jerarquía de tipos de producto con operaciones distintas |

**Análisis de concurrencia y paralelismo:**

*I/O-bound — `ProveedorClient` (HTTP al proveedor):*
- Decisión: **async** — sync no debe bloquear scheduler thread
- `WebClient` + `CompletableFuture` + `ThreadPoolTaskExecutor` dedicado: core=2, max=5, queue=10, timeout=30s, política: `CallerRunsPolicy`

*I/O-bound — N+1 queries en `generarReporte()`:*
- Decisión: **eliminar** — mover a `GROUP BY` en PostgreSQL, una sola query

*CPU-bound — agregaciones en memoria 80k productos:*
- Decisión: **eliminar** — movido a PostgreSQL con `GROUP BY`
- Post-refactorización: no hay operaciones CPU-bound — confirmado "no aplica"

*TOCTOU — `verificarDisponibilidad()` + `actualizarStock()`:*

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `UPDATE stock SET cantidad = cantidad - :delta WHERE sku = :sku AND cantidad >= :delta` | Sí | **Elegida** | Atómica en BD — PostgreSQL garantiza no stock negativo sin locks explícitos |
| `SELECT FOR UPDATE` | Sí | Descartada | Requiere transacción larga — bloquea lecturas del mismo SKU bajo carga |
| Lock distribuido Redis por SKU | Sí | Descartada | Overhead innecesario — UPDATE condicional resuelve en BD |
| Clave de idempotencia | Sí | Descartada | No aplica — el caller no hace retry de actualizaciones |

*Scheduler sin lock distribuido — 3 réplicas:*

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `Redisson RLock.tryLock()` al inicio del job | Sí | **Elegida** | Solo la réplica con lock ejecuta — las otras saltan silenciosamente |
| `ShedLock` (librería Spring) | Sí | Descartada | Requiere tabla en BD — Redis disponible, preferir Redisson |
| `pg_try_advisory_lock` | Sí | Descartada | Redis disponible — no sobrecargar PostgreSQL con locks de aplicación |

---

**[Dev]** > aprobado (aprueba Fase 2)

---

**[Agente]**
> **Pregunta 1 —** La migración del scheduler con Redisson puede deployarse independientemente. ¿Querés que sea el primer release o todo en un único release?

**[Dev]**
> Todo en un único release, así lo validamos junto.

---

### Entregable Fase 3

**Tabla de tareas:**

| # | Ámbito | Tarea | Dep | Tam | Riesgo | CA/CL |
|---|--------|-------|-----|-----|--------|-------|
| T1 | Refact. | Rotar API key proveedor + mover a `${PROVEEDOR_API_KEY}` en 4 properties | — | S | **Crítico** | RNF-03 |
| T2 | Refact. | Characterization tests: GET /productos, GET /{sku}, PUT /stock, GET /reportes/stock | T1 | M | Bajo | RF-01..04 |
| T3 | Refact. | Actualizar `pom.xml`: Java 21, Spring Boot 3.5.x, Resilience4j, Redisson | T2 | M | **Alto** | RNF-01 |
| T4 | Refact. | Crear jerarquía excepciones + GlobalExceptionHandler | T3 | S | Bajo | CL-04, CL-05 |
| T5 | Refact. | Crear `ProductoRepositoryImpl` JdbcTemplate + Builder queries parametrizado + cursor pagination | T3, T4 | L | Medio | CA-01, CL-01, CL-08, **elimina SQL injection** |
| T6 | Refact. | Crear `StockRepositoryImpl`: UPDATE atómico `WHERE cantidad >= :delta` (resuelve TOCTOU) | T3, T4 | M | **Alto** | CA-02, CL-02, CL-05, **resuelve overselling** |
| T7 | Refact. | Crear `ProveedorClientImpl` WebClient async + ThreadPoolTaskExecutor (core=2, max=5, queue=10, timeout=30s, CallerRunsPolicy) + CB | T3, T4 | M | Medio | CL-03 |
| T8 | Refact. | Crear `CatalogoSyncJob` @Scheduled + Redisson tryLock — solo una réplica ejecuta | T7 | M | Medio | CL-06 |
| T9 | Refact. | Mover agregaciones reporte a SQL GROUP BY + índice `CREATE INDEX ON stock_movimiento(sku)` | T3, T5 | M | Bajo | RNF-01 |
| T10 | Refact. | Crear `ProductoProcessorImpl` Facade (orquesta repository + client) | T5, T6, T7 | M | Bajo | CA-01..04, CL-01..05 |
| T11 | Refact. | Refactorizar `InventarioController` thin | T10 | S | Bajo | CA-01..04 |
| T12 | Refact. | MDC + correlation ID: filter HTTP + propagación en Processor y SyncJob | T10 | S | Bajo | CL-07, RNF-04 |
| T13 | Refact. | Tests de regresión: contratos REST + concurrencia stock (10 threads → sin negativos) + lock distribuido scheduler | T11, T12 | M | Medio | RF-01..04, CL-02, CL-06 |

**Plan de tests por tarea:**

| # | Tests unitarios | Tests de integración |
|---|----------------|---------------------|
| T2 | — | Characterization tests BD real — comportamiento actual capturado |
| T3 | — | Build verde Java 21 |
| T4 | GlobalExceptionHandlerTest MockMvc | — |
| T5 | ProductoRepositoryImplTest: Mockito JdbcTemplate — cada combinación filtros, pagination | PostgreSQL real: queries + verificar no SQL injection |
| T6 | StockRepositoryImplTest: update OK, stock insuficiente | PostgreSQL: 2 threads mismo SKU → uno descuenta, uno rechazado |
| T7 | ProveedorClientImplTest MockWebServer: sync OK, timeout, 5xx, CB | WireMock: proveedor caído → retry → CB abre |
| T8 | CatalogoSyncJobTest: segunda réplica salta con mock Redisson | Integración Redis: 2 instancias → solo una ejecuta |
| T9 | — | PostgreSQL: reporte 1000 movimientos → correcto + < 5s |
| T10 | ProductoProcessorImplTest: cada flujo con mocks | — |
| T11 | InventarioControllerTest: MockMvc + Processor mockeado | — |
| T12 | Test MDC: correlation ID en todos los logs | — |
| T13 | — | Contrato REST idéntico · 10 threads stock limitado → sin negativos · 3 instancias scheduler → solo 1 ejecuta |

**Archivos generados:** `spec/inventario-service-refactor-spec.md` · `spec/inventario-service-refactor-plan.md`

---

## Evolución del workflow por simulación

_Folios 001–004, 006: `fase_spec_refactor.md` · Folio 005: `fase_spec.md`_

| Ítem | Folio 001 | Folio 002 | Folio 003 | Folio 004 | Folio 005 | Folio 006 |
|------|-----------|-----------|-----------|-----------|-----------|-----------|
| Builder detectado en Fase 1 | ❌ | ❌ | ✅ | ✅ | ✅ desde requerimientos | ✅ 14 campos entidad + email body |
| I/O-bound documentado con detalle | ❌ | Parcial | ✅ | ✅ | ✅ dual sync + async | ✅ FTP sync + upload+email async |
| CPU-bound documentado | ❌ | ❌ | ✅ | ✅ async + ThreadPool | ✅ @Async pdfPool | ✅ documentado como riesgo escalabilidad |
| TOCTOU nombrado explícitamente | ❌ | Parcial (CL) | ✅ Tabla 4 estrategias | ✅ Tabla 4 estrategias | ✅ Tabla 4 estrategias | ✅ Tabla 4 estrategias |
| Scheduler sin lock distribuido | ❌ | ❌ | ✅ Redisson | ✅ pg_try_advisory_lock (sin Redis) | ✅ Redisson (Redis disponible) | ✅ ShedLock en BD (sin Redis) |
| Thread pool dimensionado | ❌ | Sin detalles | ✅ core/max/queue/timeout/política | ✅ core/max/queue/política | ✅ 2 pools dimensionados | ✅ core=2/max=4/queue=10/timeout=30s/CallerRuns |
| Patrones descartados justificados | ❌ | ❌ | ✅ 17 patrones | ✅ 17 patrones | ✅ 18 patrones | ✅ tabla completa |
| Justificación ausencia concurrencia | ❌ | ❌ | ✅ | ✅ | N/A (hay escenarios activos) | N/A (hay escenarios activos) |
| Task [EXT] dependencia infra | ❌ | ✅ | ❌ (no aplica) | ✅ PostgreSQL por infra | ✅ certificado SII | ❌ (no aplica — ShedLock usa BD existente) |
| Modelo async 202+jobId | ❌ | ❌ | ❌ | ✅ etiquetas masivas | ❌ (no aplica) | ❌ (no aplica — batch sin frontend) |
| Lock sin Redis (solo PostgreSQL) | ❌ | ❌ | ❌ | ✅ pg_try_advisory_lock | ❌ (Redis disponible → Redisson) | ✅ ShedLock (tabla en BD — sin Redis) |
| Preguntas sugeridas réplicas + Redis | ❌ | ❌ | ❌ | ❌ | ✅ nueva en fase_spec.md v2.1 | ✅ pregunta detectó ausencia Redis → ShedLock |
| **Inventario contratos entrada/salida** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **primera vez** — CSV, FTP, email, BD |
| **spec/contracts/ con snapshots** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **primera vez** — 4 archivos |
| **Plan compatibilidad por tipo de salida** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **primera vez** — tabla por tipo |
| **Characterization tests siempre obligatorios** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **primera vez** — T1 siempre, no condicional |
| **Gate no-regresión de contratos (T13)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **primera vez** — suite T1 sobre código refactorizado |
| **Componente no-microservicio (batch)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **primera vez** — sin REST ni Kafka |

---

## Folio 004

**Proyecto:** `envio-service`
**Dominio:** 📦 Logística — despacho y seguimiento de envíos
**Versión del workflow:** `fase_spec_refactor.md` v1.2
**Ámbito:** Solo Refactorización (sin nuevos requerimientos)
**Fecha:** 2026-07-13
**Hallazgos clave:** SQL injection en búsqueda · @Scheduled sin lock en 4 réplicas (carrier bloqueó por rate limit) · TOCTOU doble-booking de slots · CPU-bound etiquetas masivas 800 envíos · MySQL→PostgreSQL · API key activa · sin Redis disponible → pg_try_advisory_lock
**Nota:** Primera simulación donde el CPU-bound se resuelve con `@Async` + 202/jobId (modelo async real) en lugar de mover a SQL. Lock distribuido con `pg_try_advisory_lock` en lugar de Redis — el workflow v1.2 preguntó por herramientas disponibles y adaptó la solución. 17 patrones GoF evaluados y descartados con justificación. Task [EXT] para PostgreSQL.

---

### Conversación

**[Dev]**
```
sdd-refactor:
```

**[Agente]**
> Leyendo proyecto local...
> Detecté `envio-service` — Java 8 · Spring Boot 2.1.18 · Maven · MySQL.
> ¿Hay nuevos requerimientos además de la refactorización?

**[Dev]**
> No, solo refactorización.

**[Agente]**
> Ámbito activo: solo Refactorización. Arrancando Fase 1.
>
> **Pregunta 1 —** `buscarEnvios()` recibe 5 parámetros opcionales y construye SQL concatenando strings. ¿Hay otras queries similares?
>
> **Pregunta 2 —** `@Scheduled sincronizarEstados()` llama al carrier cada 30 min. ¿Cuántas réplicas corre el servicio?
>
> **Pregunta 3 —** `verificarSlotDisponible()` + `reservarSlot()` son operaciones separadas. ¿Ha generado doble-booking en producción?
>
> **Pregunta 4 —** `generarEtiquetasMasivas()` genera códigos de barras en memoria. ¿Cuántos envíos en el peor caso?
>
> **Pregunta 5 —** API key del carrier en `application.properties`. ¿Sigue activa?

**[Dev]**
> Solo esa query tiene filtros opcionales. 4 réplicas — el scheduler está triplicando las llamadas y ya nos bloquearon por rate limit. Los slots dobles sí han ocurrido. El peor caso de etiquetas es ~800 envíos. La key sigue activa.

**[Agente]**
> Cinco impactos críticos confirmados. Una pregunta más:
>
> **Pregunta 6 —** ¿Hay Redis u otra herramienta de coordinación distribuida disponible?

**[Dev]**
> Solo tenemos PostgreSQL. Redis no está disponible.

**[Agente]**
> Lock distribuido con `pg_try_advisory_lock`. Generando Fase 1...

---

### Resumen Fase 1

- **Java 8 · Spring Boot 2.1.18 · MySQL** — God class 550 líneas
- **SQL injection** en `buscarEnvios()` (5 params + concatenación)
- **`@Scheduled` sin lock** — 4 réplicas, carrier ya bloqueó por rate limit
- **TOCTOU** — `verificarSlotDisponible()` + `reservarSlot()` — doble-booking confirmado
- **CPU-bound** — `generarEtiquetasMasivas()` 800 envíos bloquea hilo principal 10-30s
- **N+1 queries** — `findById()` dentro de loop en generación de etiquetas
- **API key activa** y **borrado físico** (sin soft delete)
- Contratos REST inamovibles · MySQL → PostgreSQL en alcance · 4 réplicas · sin Redis

---

**[Dev]** > aprobado (aprueba Fase 1)

---

**[Agente]**
> **Pregunta 1 —** `generarEtiquetasMasivas()`: propongo `@Async` + 202 + jobId. ¿El frontend puede adaptarse a modelo async?
>
> **Pregunta 2 —** MySQL → PostgreSQL: ¿hay ventana de mantención para Big Bang?

**[Dev]**
> El frontend puede adaptarse. Hay ventana de mantención disponible.

---

### Resumen Fase 2

**Estrategia:** Big Bang · Contratos REST inamovibles excepto `/etiquetas` (→ 202 async coordinado con frontend)

**Patrones aplicados:** Builder (EnvioSearchQuery + EnvioResponse) · Facade (EnvioProcessorImpl) · Template Method (crearEnvio flow) · Command (EtiquetaJob) · Proxy (@Cacheable getCarrierInfo)

**Patrones descartados:** 17 patrones evaluados — Abstract Factory, Prototype, Factory Method, Singleton, Adapter, Bridge, Composite, Decorator, Flyweight, Chain of Responsibility, Mediator, Memento, Observer, State, Strategy, Visitor descartados con justificación explícita. Iterator aplica parcialmente (cursor pagination).

**Concurrencia:**
- CPU-bound etiquetas → `@Async` + `ThreadPoolTaskExecutor` (core=2, max=4, queue=20, CallerRunsPolicy)
- TOCTOU slots → `INSERT` + `UNIQUE (carrier_id, ventana)` — elegida sobre SELECT FOR UPDATE (descartada), Redis lock (no disponible), pg_advisory_lock por slot (overkill)
- `@Scheduled` → `pg_try_advisory_lock` — elegida sobre Redisson (sin Redis), ShedLock (más complejo), réplicas=1 (afecta disponibilidad)
- I/O-bound `crearEnvio()` → síncrono (consistencia requerida para obtener tracking ID)
- Ausencia adicional: confirmada — sin otras race conditions

---

**[Dev]** > aprobado (aprueba Fase 2)

---

**[Agente]**
> **Pregunta 1 —** Migración MySQL → PostgreSQL: ¿incluir como [EXT] bloqueante o gestionan por fuera?

**[Dev]**
> Inclúyela como [EXT] bloqueante.

---

### Resumen Fase 3

**16 tareas** — incluyendo T2 [EXT] PostgreSQL por infraestructura como gate de T7, T8 y T15.

| Tarea destacada | Tipo | Propósito |
|----------------|------|-----------|
| T1 — Rotar API key | Refact. | Crítico — antes de cualquier commit |
| T2 — PostgreSQL | [EXT] | Gate bloqueante para T7, T8, T15 |
| T8 — SlotRepositoryImpl INSERT+UNIQUE | Refact. | Resuelve TOCTOU doble-booking |
| T10 — AsyncConfig ThreadPoolTaskExecutor | Refact. | Aísla CPU-bound del hilo de negocio |
| T11 — EnvioProcessorImpl + etiquetas 202 | Refact. | Facade + modelo async |
| T12 — EstadoSyncJob + pg_try_advisory_lock | Refact. | Resuelve scheduler en 4 réplicas |

**Tests de concurrencia:** 10 threads mismo slot → sin doble-booking · 4 instancias scheduler → 1 ejecuta · 800 etiquetas → 202 en < 500ms

**Archivos generados:** `spec/envio-service-refactor-spec.md` · `spec/envio-service-refactor-plan.md`

---

## Folio 005

**Proyecto:** `factura-service`
**Dominio:** 💰 Finanzas — generación y envío de facturas electrónicas
**Versión del workflow:** `fase_spec.md` v2.1
**Ámbito:** Nuevo desarrollo
**Fecha:** 2026-07-13
**Hallazgos clave:** Builder (búsqueda 5 filtros opcionales) · I/O-bound dual (SII síncrono obligatorio + email async best-effort) · CPU-bound PDF iText local · TOCTOU factura duplicada por evento duplicado · @Scheduled reintentos con Redisson (3 réplicas + Redis disponible) · [EXT] certificado digital SII
**Nota:** Primera simulación con workflow `fase_spec.md` v2.1. Todos los ítems nuevos ejercitados: preguntas sugeridas de réplicas + Redis en apertura, Builder identificado desde requerimientos (antes de diseñar), tabla de 18 patrones GoF evaluados y descartados, dos ThreadPoolTaskExecutor dimensionados (emailPool + pdfPool), Redisson adaptado por disponibilidad de Redis, [EXT] para provisión de certificado digital.

---

### Conversación

**[Dev]**
```
sdd: implementar servicio de generación y envío de facturas electrónicas al confirmar un pago
```

**[Agente]**
> Tengo la descripción. Antes de iniciar Fase 1, dos preguntas de contexto:
>
> **Pregunta 1 —** ¿Con cuántas réplicas correrá el servicio en producción?
>
> **Pregunta 2 —** ¿Hay Redis u otra herramienta de coordinación distribuida disponible en la infraestructura?

**[Dev]**
> 3 réplicas. Tenemos Redis disponible.

**[Agente]**
> Anotado: 3 réplicas + Redis. Arrancando Fase 1.
>
> Antes de generar el análisis, necesito claridad en algunos puntos:
>
> **Pregunta 1 —** La confirmación de pago: ¿llega por Kafka o el servicio la consulta vía REST?
>
> **Pregunta 2 —** El timbraje en el SII: ¿es obligatorio antes de marcar la factura como emitida, o es un proceso background?
>
> **Pregunta 3 —** Si falla el envío por email: ¿se requiere reintento automático o notificación manual?

**[Dev]**
> Kafka. El timbraje es obligatorio — sin él no podemos marcar EMITIDA. Email con reintento automático, máximo 3 intentos.

**[Agente]**
> Una pregunta más:
>
> **Pregunta 4 —** ¿La consulta de facturas requiere filtros? ¿Cuáles?

**[Dev]**
> Sí — por RUT del pagador, rango de fechas, estado (PENDIENTE / EMITIDA / FALLIDA), monto mínimo y monto máximo. Todos opcionales.

**[Agente]**
> 5 filtros opcionales — candidato a Builder confirmado desde los requerimientos. Generando Fase 1...

---

### Entregable Fase 1

**Responsabilidad del microservicio:**
Generar facturas electrónicas timbradas en el SII y enviarlas por email al pagador, disparado por eventos Kafka de pagos confirmados. Expone API REST para consulta y búsqueda de facturas.

**Integración asíncrona:**

| Topic | Dirección | Propósito |
|-------|-----------|-----------|
| `pagos.confirmados` | Entrada | Disparar generación de factura por pago |
| `facturas.emitidas` | Salida | Notificar emisión exitosa a consumidores del dominio |
| `facturas.emitidas.DLQ` | Salida DLQ | Mensajes no procesables — para análisis y reproceso manual |

**Tablas PostgreSQL:**

| Tabla | Propósito |
|-------|-----------|
| `factura` | Registro de facturas (estado, folio SII, monto, rut_pagador, pago_id, fechas) |
| `factura_intento_email` | Historial de intentos de envío (intento, timestamp, resultado, error) |

**Servicios externos que consume:**

| Servicio | Protocolo | Propósito |
|----------|-----------|-----------|
| SII — Servicio de Impuestos Internos | REST/HTTPS + certificado `.p12` | Timbraje electrónico — obligatorio y síncrono |
| SendGrid | REST/HTTPS | Envío de factura PDF al pagador — async best-effort |

**Componentes a crear:**

| Componente | Tipo | Propósito |
|-----------|------|-----------|
| `FacturaKafkaListener` | Listener | Consume `pagos.confirmados` |
| `FacturaKafkaConfig` | Config | Consumer group, deserializer, retry |
| `FacturaProcessor` / `FacturaProcessorImpl` | Processor (Saga) | Orquesta generación → timbraje → persistencia → email |
| `FacturaRepository` / `FacturaRepositoryImpl` | Repository | Persistencia JdbcTemplate + Builder para búsqueda |
| `SiiClient` / `SiiClientImpl` | Client | Timbraje en SII + manejo de errores de negocio |
| `EmailClient` / `EmailClientImpl` | Client | Envío email vía SendGrid |
| `PdfGeneratorService` | Service | Genera PDF iText — CPU-bound, aislado en pool dedicado |
| `FacturaRetryJob` | Scheduler | Reintenta facturas FALLIDAS (max 3 intentos, @Scheduled + Redisson) |
| `FacturaController` | Controller | REST: `GET /facturas/{id}`, `GET /facturas` |

**Candidatos a Builder identificados en los requerimientos:**

| Candidato | Señal |
|-----------|-------|
| `FacturaSearchQuery` | 5 filtros opcionales (RUT, fecha desde/hasta, estado, monto min/max) → query SQL dinámica sin concatenación — **candidato prioritario** |
| `Factura` (model) | 7 campos en construcción donde 3 son opcionales hasta completar el flujo (folio SII, fechaEmision, urlPdf) |

→ `FacturaSearchQuery` diseñada con Builder en Fase 2 desde el inicio.

**Requisitos funcionales y criterios de aceptación:**

| RF | Descripción | CA |
|----|-------------|-----|
| RF-01 | Generar factura al recibir evento de pago confirmado | CA-01: evento → PDF generado → timbre SII → `EMITIDA` + email enviado. Evento duplicado → idempotencia, sin segunda factura |
| RF-02 | Reintentar envío email en facturas FALLIDAS | CA-02: `FacturaRetryJob` reintenta hasta 3 veces. Al 4to fallo → estado `FALLIDA_DEFINITIVA` |
| RF-03 | Consultar factura por ID | CA-03: ID existente → HTTP 200. ID inexistente → HTTP 404 |
| RF-04 | Buscar facturas con filtros opcionales | CA-04: cualquier combinación de los 5 filtros → página de resultados paginada (cursor-based) |

**RNF:**
- `RNF-01` Timbraje SII ≤ 5s p95
- `RNF-02` Procesamiento del evento Kafka ≤ 12s p95 (incluye PDF + timbre)
- `RNF-03` Cobertura ≥ 80% lógica de negocio
- `RNF-04` Correlation ID propagado desde header Kafka y requests HTTP

**Operaciones I/O-bound identificadas:**

| Operación | Async/Sync | Justificación |
|-----------|-----------|--------------|
| `SiiClient.timbrar()` | **Síncrona** | Folio SII es prerequisito para persistir `EMITIDA` — flujo no puede continuar sin él |
| `EmailClient.enviar()` | **Async** | Fallo de email no debe bloquear la emisión; se reintenta con `FacturaRetryJob` |

**Operaciones CPU-bound identificadas:**

| Operación | Problema |
|-----------|---------|
| `PdfGeneratorService.generar()` — iText en JVM | Generación de PDF en memoria puede saturar el hilo del Processor bajo carga — debe aislarse en pool dedicado |

**Escenarios TOCTOU potenciales:**

| Par no atómico | Race condition |
|----------------|---------------|
| `findByPagoId(pagoId)` → si no existe → `save(factura)` | Dos réplicas procesan el mismo evento Kafka simultáneamente → dos facturas para el mismo pago |

**`@Scheduled`:**
`FacturaRetryJob` corre cada 15 min. Con 3 réplicas, las tres dispararían simultáneamente → mismas facturas FALLIDAS procesadas 3 veces → timbre duplicado en SII. Requiere lock distribuido desde el inicio.

**Escala horizontal:** 3 réplicas confirmadas + Redis disponible — toda race condition es real en producción.

**Casos límite:**

| ID | Descripción |
|----|-------------|
| CL-01 | Evento Kafka con `pago_id` ya procesado — idempotencia obligatoria |
| CL-02 | SII retorna código de error de negocio (RUT inválido, monto fuera de rango) |
| CL-03 | SII timeout sin respuesta |
| CL-04 | `GET /facturas` sin filtros — debe paginar, no retornar todas |
| CL-05 | Email con dirección inválida → SendGrid rechaza |
| CL-06 | Factura en estado `EMITIDA` entra al ciclo de retry — no debe re-timbrar |
| CL-07 | `FacturaRetryJob` en 3 réplicas simultáneas — misma factura no debe procesarse dos veces |
| CL-08 | Sin correlation ID en header Kafka — error no trazable |
| CL-09 | Evento sin `pago_id` o con campo nulo |

---

**[Dev]** > aprobado

---

**[Agente]**
> Fase 1 aprobada. Arrancando **Fase 2 — Proponer**.
>
> *(leyendo `design_patterns/skill.md`, `kafka-listener.md`, `kafka-config.md`, `processor.md`, `repository.md`, `webclient.md`, `exceptions.md`, `openapi.md`...)*
>
> **Pregunta 1 —** El PDF: ¿se genera localmente con una librería Java (iText, JasperReports) o llamando a una API externa?

**[Dev]**
> Localmente con iText.

**[Agente]**
> CPU-bound local confirmado. Generando propuesta de arquitectura...

---

### Entregable Fase 2

**Skills consultados:** `design_patterns/skill.md` · `kafka-listener.md` · `kafka-config.md` · `processor.md` · `repository.md` · `webclient.md` · `exceptions.md` · `openapi.md`

**Arquitectura objetivo:**
```
cl.klap.bysf.factura/
├── global/
│   ├── config/
│   │   ├── WebClientConfig.java
│   │   ├── ResilienceConfig.java
│   │   ├── AsyncConfig.java          ← emailPool + pdfPool (ThreadPoolTaskExecutor)
│   │   ├── RedissonConfig.java
│   │   └── OpenApiConfig.java
│   ├── exception/
│   │   ├── FacturaException.java
│   │   ├── FacturaNotFoundException.java
│   │   ├── FacturaDuplicadaException.java
│   │   ├── SiiClientException.java
│   │   └── EmailClientException.java
│   └── web/
│       └── GlobalExceptionHandler.java
│
└── dominio/
    └── factura/
        ├── api/
        │   └── FacturaController.java
        ├── application/
        │   ├── FacturaProcessor.java
        │   ├── FacturaProcessorImpl.java
        │   └── FacturaRetryJob.java       ← @Scheduled + Redisson tryLock
        ├── infrastructure/
        │   ├── kafka/
        │   │   ├── FacturaKafkaListener.java
        │   │   └── FacturaKafkaConfig.java
        │   ├── repository/
        │   │   ├── FacturaRepository.java
        │   │   └── FacturaRepositoryImpl.java  ← JdbcTemplate + Builder queries
        │   └── client/
        │       ├── SiiClient.java
        │       ├── SiiClientImpl.java     ← WebClient síncrono + CB
        │       ├── EmailClient.java
        │       └── EmailClientImpl.java   ← WebClient + CompletableFuture + emailPool
        ├── service/
        │   └── PdfGeneratorService.java   ← @Async("pdfPool") + iText
        └── model/
            ├── Factura.java               ← record
            ├── FacturaSearchQuery.java    ← record @Builder
            ├── PagoConfirmadoEvent.java   ← record (Kafka in)
            └── FacturaResponse.java       ← record
```

**Cross-reference con hallazgos de Fase 1 (antes de evaluar por categoría):**
- **Builder** `FacturaSearchQuery` y `Factura` → evaluar siempre en Creacionales. Builder debe aparecer en tabla aplicados o descartados.
- **TOCTOU** `findByPagoId` → `save` → evaluar Strategy/State: no aplica — la solución es constraint en BD.
- **`@Scheduled`** `FacturaRetryJob` → evaluar lock distribuido: Redisson con Redis disponible.

**Patrones GoF aplicados:**

| Patrón | Componente | Justificación |
|--------|-----------|--------------|
| **Builder** | `FacturaSearchQuery` | Fase 1: 5 filtros opcionales → SQL dinámico parametrizado sin concatenación de strings |
| **Facade** | `FacturaProcessorImpl` | Fase 1: orquesta PDF + SII + BD + email en flujo único; oculta complejidad al Listener |
| **Template Method** | `FacturaProcessor` | Flujo fijo: validar idempotencia → generar PDF → timbrar SII → persistir → email. Variantes en manejo de errores por paso |
| **Strategy** | `SiiClientImpl` — manejo de errores | Fase 1: CL-02 y CL-03 requieren respuestas distintas: `SiiBusinessErrorStrategy` (error de negocio SII) vs `SiiTimeoutStrategy` (timeout/infraestructura) |

**Patrones GoF evaluados y descartados:**

| Patrón | Evaluado | Decisión | Justificación |
|--------|----------|----------|---------------|
| Abstract Factory | Sí | No aplica | No hay familias de objetos que varíen por tipo de factura o contexto de emisión |
| Prototype | Sí | No aplica | No hay objetos costosos de crear que deban replicarse desde plantilla |
| Factory Method | Sí | No aplica | Creación de `Factura` es directa desde el evento Kafka — no varía por subtipo |
| Singleton | Sí | No aplica | Spring gestiona el ciclo de vida de todos los beans como singletons |
| Adapter | Sí | No aplica | APIs SII y SendGrid son REST/JSON — contratos compatibles sin adaptación de interfaz incompatible |
| Bridge | Sí | No aplica | No hay dos dimensiones independientes de variación entre abstracción e implementación |
| Composite | Sí | No aplica | No hay jerarquías de objetos compuestos con comportamiento recursivo |
| Decorator | Sí | No aplica | No hay capas de comportamiento que deban agregarse dinámicamente a los clientes |
| Flyweight | Sí | No aplica | No hay objetos de alta creación repetitiva con estado compartible entre instancias |
| Proxy | Sí | No aplica | `@Cacheable` AOP Spring cubre la consulta frecuente por ID — sin Proxy manual necesario |
| Chain of Responsibility | Sí | No aplica | 2 validaciones de entrada (nulos + duplicado) — `if` directo es más claro que cadena |
| Command | Sí | No aplica | Sin requisito de undo, replay ni audit log de operaciones de facturación |
| Iterator | Sí | No aplica | Cursor-based pagination implementada internamente en `FacturaRepositoryImpl` — sin Iterator explícito |
| Mediator | Sí | No aplica | Sin comunicación compleja entre múltiples componentes que requiera mediación central |
| Memento | Sí | No aplica | `factura_intento_email` actúa como historial — no se necesita captura/restauración de estado en memoria |
| Observer | Sí | No aplica | Evento `facturas.emitidas` al topic Kafka cubre el patrón de notificación — sin Observer interno adicional |
| State | Sí | No aplica | Estados PENDIENTE/EMITIDA/FALLIDA/FALLIDA_DEFINITIVA son simples — enum + Template Method suficientes |
| Visitor | Sí | No aplica | Sin jerarquía de tipos de factura con operaciones distintas según el tipo |

**Análisis de concurrencia y paralelismo:**

*I/O-bound — `SiiClient.timbrar()`:*
- Decisión: **síncrona** — folio SII es prerequisito para persistir `EMITIDA`. No puede paralelizarse.
- `WebClient` con timeout 5s + circuit breaker Resilience4j (sliding-window=5, failure-rate-threshold=50%)

*I/O-bound — `EmailClient.enviar()`:*
- Decisión: **async** — fallo de email no debe bloquear ni revertir la emisión de la factura
- `CompletableFuture` + `ThreadPoolTaskExecutor` `emailPool`: core=2, max=4, queue=50, timeout=10s, política: `CallerRunsPolicy`

*CPU-bound — `PdfGeneratorService.generar()` (iText local):*
- Decisión: **@Async** — iText genera PDF en JVM; bajo carga degrada el hilo del Processor
- `@Async("pdfPool")` + `ThreadPoolTaskExecutor` `pdfPool`: core=2, max=4, queue=10, timeout=15s, política: `CallerRunsPolicy`

*TOCTOU — `findByPagoId()` → `save()`:*

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `UNIQUE` constraint `factura(pago_id)` | Sí | **Elegida** | BD rechaza el segundo insert — capturar `DataIntegrityViolationException` como idempotencia. Atómica sin overhead adicional |
| `SELECT FOR UPDATE` | Sí | Descartada | Requiere transacción larga que bloquea el hilo del Kafka consumer bajo carga concurrente |
| Lock distribuido Redis por `pago_id` | Sí | Descartada | Overhead innecesario — el constraint en BD resuelve de forma más simple y es la fuente de verdad |
| Clave de idempotencia en Kafka consumer | Sí | Descartada | Complementario pero insuficiente como única defensa — el constraint en BD es la garantía real |

*`@Scheduled` — `FacturaRetryJob` en 3 réplicas:*

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `Redisson RLock.tryLock()` al inicio del job | Sí | **Elegida** | Solo una réplica ejecuta el retry — las otras saltan silenciosamente. Redis disponible. |
| `ShedLock` (tabla en BD) | Sí | Descartada | Redis disponible — preferir Redisson; ShedLock agrega tabla de infraestructura innecesaria |
| `pg_try_advisory_lock` | Sí | Descartada | Redis disponible — no sobrecargar PostgreSQL con locks de aplicación |
| Reducir réplicas a 1 solo para el scheduler | Sí | Descartada | Afecta disponibilidad del servicio completo — el scheduler no justifica esa degradación |

**Contratos de interfaces:**

```java
// cl.klap.bysf.factura.dominio.factura.application
public interface FacturaProcessor {
    void procesar(PagoConfirmadoEvent evento);
    void reintentar(Long facturaId);
}

// cl.klap.bysf.factura.dominio.factura.infrastructure.repository
public interface FacturaRepository {
    Factura save(Factura factura);
    Optional<Factura> findById(Long id);
    Optional<Factura> findByPagoId(String pagoId);
    Page<Factura> buscar(FacturaSearchQuery query);
    List<Factura> findParaReintento(int maxIntentos);
    void updateEstado(Long id, EstadoFactura estado);
    void registrarIntentoEmail(Long facturaId, boolean exitoso, String error);
}

// cl.klap.bysf.factura.dominio.factura.infrastructure.client
public interface SiiClient {
    String timbrar(Factura factura);  // retorna folio SII
}
public interface EmailClient {
    CompletableFuture<Void> enviar(String destinatario, byte[] pdf, String numeroFactura);
}
```

**Análisis de seguridad:**

| Amenaza | Componente | Control |
|---------|-----------|---------|
| **SSRF** | `SiiClientImpl`, `EmailClientImpl` | URLs solo desde `application-{ambiente}.properties` — nunca desde input del usuario |
| **Deserialización insegura** | `FacturaKafkaListener` | Schema Registry + validación explícita del `PagoConfirmadoEvent` antes de procesar |
| **Mass Assignment** | `FacturaController` | `FacturaSearchQuery` con campos explícitos + `@Valid` en parámetros |
| **Credencial expuesta** | properties | Certificado SII en vault — `${SII_CERT_PATH}`, `${SII_CERT_PASSWORD}`, `${SENDGRID_API_KEY}` |
| **Actuator expuesto** | Config | Restringir endpoints a red interna en todos los ambientes |

**Archivos de properties por ambiente:**
```properties
# application-local.properties
sii.url=https://maullin.sii.cl/DTEWS
sii.cert.path=${SII_CERT_PATH}
sii.cert.password=${SII_CERT_PASSWORD}
sendgrid.api-key=${SENDGRID_API_KEY}
kafka.bootstrap-servers=localhost:9092
kafka.group-id=factura-service-local
# application-develop.properties / qa.properties / master.properties — mismos keys, distintas URLs
```

---

**[Dev]** > aprobado

---

**[Agente]**
> Fase 2 aprobada. Arrancando **Fase 3 — Validar**.
>
> *(leyendo `sdd-checklist.md`, `defectos-tipicos-checklist.md`, `testing.md`...)*
>
> **Pregunta 1 —** El certificado digital `.p12` para timbrar en SII: ¿lo provisiona infraestructura antes del sprint, o es responsabilidad del dev?

**[Dev]**
> Infraestructura lo gestiona. Es bloqueante para cualquier test real con SII.

---

### Entregable Fase 3

**Reporte DO/DON'T:**

| Regla | Estado |
|-------|--------|
| Lógica de negocio en `Processor`, no en `Controller` ni `Listener` | ✅ `FacturaProcessorImpl` orquesta todo |
| `Repository` solo con `JdbcTemplate`, sin JPA | ✅ |
| `WebClient` para clientes HTTP externos | ✅ `SiiClientImpl` + `EmailClientImpl` |
| Sin secrets en código ni en properties commiteados | ✅ `${SII_CERT_*}`, `${SENDGRID_API_KEY}` |
| Jerarquía de excepciones bajo `global/exception/` | ✅ |
| Estructura `global/` + `dominio/` | ✅ |
| Lock distribuido para `@Scheduled` con N réplicas | ✅ Redisson `tryLock` |
| TOCTOU resuelto con constraint en BD | ✅ `UNIQUE (pago_id)` |
| Builder cuando hay 4+ campos opcionales | ✅ `FacturaSearchQuery` |

**Verificación naming conventions:**

| Elemento | Convención | Estado |
|----------|-----------|--------|
| `FacturaProcessorImpl` | `XxxProcessorImpl` | ✅ |
| `FacturaRepositoryImpl` | `XxxRepositoryImpl` | ✅ |
| `SiiClientImpl` | `XxxClientImpl` | ✅ |
| `EmailClientImpl` | `XxxClientImpl` | ✅ |
| `FacturaNotFoundException` | `XxxNotFoundException` | ✅ |
| Package raíz | `cl.klap.bysf.factura` | ✅ |

**Tabla de tareas atómicas:**

**Tipos de tarea:**

| Tipo | Cuándo usar |
|------|-------------|
| `Nuevo` | Tarea ejecutada por el dev — nueva funcionalidad |
| `[EXT]` | Dependencia externa — ejecutada por otro equipo (infra, DevOps, seguridad). Bloquea tareas posteriores pero no la ejecuta el dev. Documentar quién la ejecuta y cómo confirmar que está lista |

| # | Tipo | Tarea | Dep | Tam | Riesgo | CA/CL |
|---|------|-------|-----|-----|--------|-------|
| T1 | [EXT] | Infraestructura provisiona certificado digital SII `.p12` en vault y configura `${SII_CERT_PATH}` / `${SII_CERT_PASSWORD}` | — | — | **Alto** | RF-01, CL-02, CL-03 |
| T2 | Nuevo | Crear `pom.xml`: Spring Boot 3.5.x, Kafka, JdbcTemplate, WebFlux, Resilience4j, Redisson, iText, springdoc | — | S | Bajo | RNF-01 |
| T3 | Nuevo | Crear estructura de paquetes + jerarquía de excepciones + `GlobalExceptionHandler` | T2 | S | Bajo | CL-02, CL-05, CL-09 |
| T4 | Nuevo | Crear `AsyncConfig`: `emailPool` (core=2, max=4, queue=50, timeout=10s, CallerRuns) + `pdfPool` (core=2, max=4, queue=10, timeout=15s, CallerRuns) | T2 | S | Bajo | RF-01 |
| T5 | Nuevo | Crear `FacturaRepositoryImpl` JdbcTemplate + `FacturaSearchQuery` @Builder (5 filtros + cursor pagination) + constraint `UNIQUE (pago_id)` | T3 | M | Bajo | CA-01, CA-04, CL-01, CL-04 |
| T6 | Nuevo | Crear `SiiClientImpl` WebClient síncrono + CB Resilience4j + timeout 5s + `SiiBusinessErrorStrategy` / `SiiTimeoutStrategy` | T1, T3 | M | **Alto** | CA-01, CL-02, CL-03 |
| T7 | Nuevo | Crear `EmailClientImpl` WebClient + `CompletableFuture` + `emailPool` | T3, T4 | M | Medio | CA-01, CL-05 |
| T8 | Nuevo | Crear `PdfGeneratorService` iText + `@Async("pdfPool")` | T3, T4 | M | Medio | CA-01 |
| T9 | Nuevo | Crear `FacturaProcessorImpl` Saga: idempotencia (UNIQUE) → PDF async → SII sync → persistir EMITIDA → email async | T5, T6, T7, T8 | M | Bajo | CA-01, CL-01, CL-06 |
| T10 | Nuevo | Crear `FacturaRetryJob` @Scheduled 15min + Redisson `tryLock` + máx 3 intentos + `FALLIDA_DEFINITIVA` | T9 | M | Medio | CA-02, CL-06, CL-07 |
| T11 | Nuevo | Crear `FacturaKafkaListener` + `FacturaKafkaConfig` + MDC desde header Kafka | T9 | S | Bajo | CA-01, CL-08, CL-09 |
| T12 | Nuevo | Crear `FacturaController` thin: `GET /facturas/{id}`, `GET /facturas` paginado | T5, T9 | S | Bajo | CA-03, CA-04, CL-04 |
| T13 | Nuevo | `WebClientConfig` + `ResilienceConfig` + `RedissonConfig` + `OpenApiConfig` + 4 `application-{ambiente}.properties` | T2 | S | Bajo | RNF-01, RNF-04 |
| T14 | Nuevo | Tests de regresión: contrato REST + concurrencia (2 eventos mismo `pago_id` → 1 factura) + scheduler (3 instancias → 1 ejecuta) | T10, T12 | M | Medio | CL-01, CL-07 |

**Plan de tests por tarea:**

| # | Tests unitarios | Tests de integración |
|---|----------------|---------------------|
| T3 | `GlobalExceptionHandlerTest` MockMvc — cada excepción mapeada | — |
| T5 | `FacturaRepositoryImplTest`: cada combinación de filtros, paginación cursor, sin resultados | PostgreSQL real: UNIQUE rechaza duplicado · Builder genera SQL correcto · cursor pagination |
| T6 | `SiiClientImplTest` MockWebServer: OK (folio), error negocio, timeout, CB abre | WireMock: 5 timeouts → CB abre → `SiiClientException` sin llamar a SII |
| T7 | `EmailClientImplTest` MockWebServer: OK, 4xx (email inválido), timeout | WireMock: SendGrid caído → CompletableFuture completa con error |
| T8 | `PdfGeneratorServiceTest`: generar PDF con datos mínimos → byte[] no vacío | — |
| T9 | `FacturaProcessorImplTest`: flujo OK, SII falla, email falla, pago_id duplicado | — |
| T10 | `FacturaRetryJobTest`: retry OK, max 3 intentos → FALLIDA_DEFINITIVA, segunda réplica salta (mock Redisson) | Redis real: 3 instancias simultáneas → exactamente 1 ejecuta el job |
| T11 | `FacturaKafkaListenerTest`: evento válido delegado, malformado → DLQ, `pago_id` nulo → CL-09 | Kafka embebido: consumo end-to-end → Processor llamado |
| T12 | `FacturaControllerTest` MockMvc: GET por ID existente/inexistente, búsqueda paginada con filtros | — |
| T14 | — | 2 threads mismo `pago_id` → 1 factura en BD · 3 instancias `FacturaRetryJob` → 1 ejecuta · SII CB: 5 errores → abre → calls detenidas |

**Checklist defectos típicos:**

| Categoría | Cubierto | Referencia |
|-----------|---------|-----------|
| Duplicados | ✅ | CL-01 — idempotencia por `pago_id` |
| Nulos | ✅ | CL-09 — campos nulos en evento Kafka |
| Validación de entrada | ✅ | `@Valid` en Controller + deserialización Kafka validada |
| Casos de borde | ✅ | CL-04 sin filtros · CL-06 EMITIDA en retry · CA-02 max intentos |
| Trazabilidad | ✅ | CL-08 — correlation ID desde header Kafka propagado |
| Control de acceso | ✅ | Análisis OWASP Fase 2 — endpoints protegidos, Actuator restringido |

**Orden de despliegue:**
1. **T1 [EXT]** primero — sin certificado SII no hay integración real ni tests contra SII
2. **T13** puede deployarse independientemente (solo config)
3. El resto en un único release al completar T14

**Archivos generados:** `spec/factura-service-spec.md` · `spec/factura-service-plan.md`

---

## Folio 006

**Proyecto:** `conciliacion-batch`
**Dominio:** 💳 Finanzas — batch de conciliación de pagos
**Versión del workflow:** `fase_spec_refactor.md` v1.2+
**Ámbito:** Solo Refactorización (sin nuevos requerimientos)
**Fecha:** 2026-07-15
**Hallazgos clave:** Batch job (no microservicio) · CSV entrada + CSV salida + FTP upload + email · `@Scheduled` sin lock en N réplicas · TOCTOU duplicados de referencia · God class 812 líneas · 0% tests · credenciales hardcodeadas · ShedLock (sin Redis) · **primera simulación con inventario de contratos, spec/contracts/ y characterization tests obligatorios**
**Nota:** Primera simulación con `fase_spec_refactor.md` v1.2+ que incluye "Inventario de contratos de entrada/salida". El componente es un batch job sin REST ni Kafka — ejercita la capacidad del workflow de manejar salidas de tipo CSV, FTP y email. `spec/contracts/` creado con 4 snapshots. Characterization tests T1 siempre obligatorios (no condicionales). T13 agrega gate de no-regresión ejecutando la misma suite sobre el código refactorizado.

---

### Conversación

**[Dev]**
```
sdd-refactor: conciliacion-batch
```

**[Agente]**
> Leyendo proyecto local... detecté `conciliacion-batch` — Java 11 · Spring Boot 2.5.14 · Maven. No hay endpoints REST ni listeners Kafka — es un batch job.
> ¿Hay nuevos requerimientos además de la refactorización?
> - Si **sí**: dime la fuente
> - Si **no**: procedemos con el análisis

**[Dev]**
> No, solo refactorización.

**[Agente]**
> Ámbito activo: solo Refactorización. Arrancando Fase 1.
> *(leyendo pom.xml, application.properties, estructura de paquetes, clases principales, tests...)*
>
> **Pregunta 1 —** `@Scheduled(cron="0 0 2 * * *")` en `ConciliacionScheduler`. ¿Con cuántas réplicas corre el servicio en producción?
>
> **Pregunta 2 —** Hay credenciales FTP en `application.properties` en texto plano: `ftp.password=klap2024`. ¿Siguen activas?
>
> **Pregunta 3 —** ¿Hay Redis u otra herramienta de coordinación distribuida disponible?

**[Dev]**
> 3 réplicas. Las credenciales FTP siguen activas, hay que rotarlas urgente. No hay Redis disponible.

**[Agente]**
> Anotado: 3 réplicas · credenciales activas = crítico · sin Redis → lock distribuido con ShedLock en BD. Generando Fase 1...

---

### Entregable Fase 1

#### Estado actual del proyecto

| Ítem | Valor |
|------|-------|
| Java | 11 |
| Spring Boot | 2.5.14 |
| Build tool | Maven 3.8 |
| Patrón arquitectónico | Monolítico sin capas — toda la lógica en `ConciliacionService.java` (812 líneas) |

**Dependencias principales:** `spring-batch`, `spring-data-jpa` + Hibernate 5.4, `commons-net` 3.6 (FTP), `spring-boot-starter-mail`. Sin Resilience4j, sin WebClient, sin Testcontainers.

---

#### Inventario de componentes existentes

| Componente | Clase | Responsabilidad actual |
|-----------|-------|----------------------|
| Scheduler | `ConciliacionScheduler.java` | `@Scheduled(cron="0 0 2 * * *")` — dispara el job |
| God Service | `ConciliacionService.java` | Descarga FTP + parsea CSV + valida + persiste + genera CSV resultado + FTP upload + email — 812 líneas |
| Repository | `ConciliacionRepository.java` | `extends JpaRepository<Conciliacion, Long>` |
| Entity | `Conciliacion.java` | 14 campos JPA |
| Config | `AppConfig.java` | Beans de FTPClient, JavaMailSender, datasource |

---

#### Inventario de contratos de entrada/salida

**Entradas:**

| Tipo | Qué capturar |
|------|--------------|
| Trigger schedule | `cron = "0 0 2 * * *"` — sin parámetros de entrada |
| Archivo CSV leído (FTP) | Host: `${ftp.host}`, ruta: `/in/conciliacion_YYYYMMDD.csv`, encoding: UTF-8, delimitador: `;`, columnas en orden: `fecha;monto;cuenta_origen;cuenta_destino;referencia;tipo_operacion` |
| Variables de entorno | `ftp.host`, `ftp.user`, `ftp.password`, `mail.to` — actualmente hardcodeadas en `application.properties` |

**Salidas:**

| Tipo | Qué capturar |
|------|--------------|
| Archivo CSV generado | Ruta: `/tmp/resultado_conciliacion_YYYYMMDD.csv`, encoding UTF-8, delimitador `;`, columnas: `referencia;estado;motivo_rechazo;fecha_proceso` |
| FTP upload | Mismo servidor, ruta: `/out/resultado_conciliacion_YYYYMMDD.csv`, mismo encoding y formato |
| Escritura a BD | Tabla `conciliacion`: columnas `id, referencia, estado, monto, cuenta_origen, cuenta_destino, tipo_operacion, fecha_proceso, motivo_rechazo` |
| Email | Destinatario: `${mail.to}`, subject: `Conciliacion YYYYMMDD - OK/ERROR`, body: texto plano con conteo de procesados/rechazados |

*Snapshots a guardar en `spec/contracts/`:*
- `csv-input-conciliacion.csv` — fila de entrada de ejemplo
- `csv-output-resultado.csv` — fila de salida de ejemplo
- `json-bd-conciliacion.json` — estructura del registro insertado
- `txt-email-body.txt` — template del body del email

---

#### Deuda técnica identificada

| Categoría | Detalle | Severidad |
|-----------|---------|-----------|
| Versiones obsoletas | Java 11 · Spring Boot 2.5.x · Hibernate 5.4 con CVE | Alta |
| God class | `ConciliacionService.java` 812 líneas — 6 responsabilidades mezcladas | Alta |
| Sin resiliencia | `FTPClient` sin retry ni timeout — fallo FTP bloquea hilo indefinidamente | Alta |
| **Credenciales activas** | `ftp.password=klap2024` en `application.properties` commiteado | Crítica |
| Sin tests | 0% cobertura | Alta |
| Logging ausente | Sin MDC, sin correlation ID, sin trazabilidad por ejecución | Media |
| **`@Scheduled` sin lock** | 3 réplicas ejecutan a las 02:00 simultáneamente — duplicados garantizados | Alta |
| JPA/Hibernate innecesario | Solo INSERTs en batch — JdbcTemplate sería más eficiente | Media |

---

#### Señales de Builder identificadas

| Candidato | Señal |
|-----------|-------|
| `Conciliacion` entity | 14 campos, 6 opcionales → **candidato a Builder** |
| Construcción del email body | Concatenación manual con 5 condicionales → **candidato a Builder** |

---

#### Operaciones I/O-bound identificadas

| Operación | ¿Bloqueante? | ¿Paralelizable? |
|-----------|-------------|-----------------|
| Descarga CSV por FTP | Sí — bloquea hilo principal | No — prerequisito del procesamiento |
| Upload CSV resultado por FTP | Sí — bloquea hilo | Sí — independiente del email |
| Envío de email | Sí — bloquea hilo | Sí — independiente del upload FTP |

---

#### Operaciones CPU-bound identificadas

Parseo y validación del CSV: hasta 50.000 registros en memoria. Aceptable en volumen conocido — documentado como riesgo si el volumen supera 200.000 registros.

---

#### `@Scheduled` sin lock distribuido

`ConciliacionScheduler` con `@Scheduled(cron="0 0 2 * * *")`. Con 3 réplicas:
- 3 instancias descargan el mismo CSV simultáneamente
- 3 instancias insertan los mismos registros → **duplicados garantizados**
- 3 emails enviados a `ops@klap.cl`

#### Escenarios TOCTOU identificados

| Par no atómico | Race condition |
|----------------|---------------|
| Verificar si `referencia` existe → insertar | Dos réplicas leen "no existe" y ambas insertan → duplicado |

**Escala horizontal asumida:** 3 réplicas confirmadas — toda race condition es real.

---

#### Casos límite `CL-XX`

| ID | Categoría | Descripción |
|----|-----------|-------------|
| CL-01 | Duplicados | Misma `referencia` procesada por dos réplicas simultáneamente |
| CL-02 | Nulos | CSV con `monto` o `cuenta_origen` vacíos |
| CL-03 | Validación | CSV con encoding distinto a UTF-8 |
| CL-04 | Casos borde | CSV vacío (solo header) |
| CL-05 | Casos borde | FTP no disponible a las 02:00 |
| CL-06 | Trazabilidad | Job ejecutado dos veces el mismo día — ¿sobreescribe o falla? |
| CL-07 | Control de acceso | Credenciales FTP expuestas en logs al nivel DEBUG |

---

#### Requisitos funcionales de refactorización

| ID | Requisito | CA |
|----|-----------|-----|
| RF-01 | Preservar descarga de CSV desde FTP | CA-01: `conciliacion_YYYYMMDD.csv` descargado correctamente en los 4 ambientes |
| RF-02 | Preservar parseo y validación | CA-02: registros con monto ≤ 0 o cuentas nulas → estado `RECHAZADO` con motivo |
| RF-03 | Preservar INSERT en tabla `conciliacion` | CA-03: estructura de columnas y valores derivados idénticos al snapshot `json-bd-conciliacion.json` |
| RF-04 | Preservar generación de CSV resultado | CA-04: formato, encoding, delimitador y columnas idénticos al snapshot `csv-output-resultado.csv` |
| RF-05 | Preservar FTP upload del resultado | CA-05: archivo subido a `/out/resultado_conciliacion_YYYYMMDD.csv` |
| RF-06 | Preservar email de resumen | CA-06: destinatario, subject y body idénticos al snapshot `txt-email-body.txt` |
| RF-07 | Lock distribuido para `@Scheduled` | CA-07: con 3 réplicas, solo una ejecuta el job |
| RF-08 | Idempotencia ante `referencia` duplicada | CA-08: segundo procesamiento no genera duplicado en BD |

---

**[Dev]** > Aprobado. Avanza a Fase 2.

---

### Entregable Fase 2

**[Agente]** *(leyendo processor.md, repository.md, exceptions.md, spring-properties.md, design_patterns/skill.md...)*

#### Estrategia de migración

**Elegida: Big Bang.** Justificación: sin consumidores externos directos, deuda severa, contrato externo observable (CSV + BD) se preserva sin cambio de schema.

#### Arquitectura objetivo

```
cl.klap.bysf.operaciones.conciliacion/
├── global/
│   ├── config/
│   │   ├── FtpConfig.java
│   │   ├── MailConfig.java
│   │   ├── AsyncConfig.java           ← ThreadPoolTaskExecutor para FTP + email
│   │   └── ShedLockConfig.java
│   └── exception/
│       ├── ConciliacionException.java
│       └── FtpConnectionException.java
└── dominio/
    └── conciliacion/
        ├── ConciliacionProcessor.java         ← interfaz
        ├── ConciliacionProcessorImpl.java     ← Saga
        ├── ConciliacionRepository.java        ← interfaz
        ├── ConciliacionRepositoryImpl.java    ← JdbcTemplate batch
        ├── FtpClient.java                     ← interfaz
        ├── FtpClientImpl.java                 ← commons-net + timeout + retry
        ├── MailClient.java                    ← interfaz
        ├── MailClientImpl.java
        ├── ConciliacionRecord.java            ← Builder (input)
        ├── ResultadoConciliacion.java         ← Builder (output)
        └── ConciliacionScheduler.java         ← @Scheduled + @SchedulerLock ShedLock
```

**Versión objetivo:** Java 21, Spring Boot 3.5.x

---

#### Mapa de transformación

| Componente actual | Patrón actual | Componente objetivo | Patrón objetivo | Acción |
|-------------------|---------------|---------------------|-----------------|--------|
| `ConciliacionService.java` (812 líneas) | God class | `ConciliacionProcessorImpl` | Saga | Dividir |
| `ConciliacionRepository extends JpaRepository` | JPA/Hibernate | `ConciliacionRepositoryImpl` | JdbcTemplate batch | Reemplazar |
| `FTPClient` directo en Service | Sin abstracción, sin timeout | `FtpClientImpl` | Interfaz + timeout 30s + retry | Reemplazar |
| `JavaMailSender` directo en Service | Sin abstracción | `MailClientImpl` | Interfaz + async | Extraer |
| `@Scheduled` sin lock | Race condition con 3 réplicas | `ConciliacionScheduler` + ShedLock | `@SchedulerLock` en BD | Agregar |
| Sin tests | 0% | Suite JUnit 5 + Testcontainers | TDD | Agregar |
| Credenciales hardcodeadas | Inseguro | `application-{ambiente}.properties` | Sin credenciales en código | Reemplazar |

---

#### Plan de compatibilidad

| Salida | Tipo | ¿Se preserva? | Estrategia si cambia |
|--------|------|--------------|---------------------|
| `csv-input-conciliacion.csv` leído de FTP | CSV entrada | Sí — mismo path, encoding, delimitador, columnas en mismo orden | — |
| `resultado_conciliacion_YYYYMMDD.csv` generado | CSV salida | Sí — encoding UTF-8, delimitador `;`, columnas en mismo orden | — |
| Upload a `/out/resultado_conciliacion_YYYYMMDD.csv` | FTP upload | Sí — mismo servidor, misma ruta, mismo naming convention | — |
| INSERT en tabla `conciliacion` | BD | Sí — mismas columnas, mismos tipos, mismos valores derivados | — |
| Email a `${mail.to}` | Email | Sí — mismo destinatario pattern, mismo subject pattern, mismo body structure | — |

*Todos los contratos se preservan sin cambio. No se requiere Expand-Contract.*

---

#### Patrones de diseño GoF aplicados

| Patrón | Componente | Justificación |
|--------|-----------|---------------|
| **Builder** | `ConciliacionRecord`, `ResultadoConciliacion` | Fase 1: 14 campos en entidad (6 opcionales) + concatenación manual del email body |
| **Facade** | `ConciliacionProcessorImpl` | Fase 1: God class con 6 responsabilidades mezcladas |
| **Strategy** | `ConciliacionProcessorImpl` | El estado `APROBADO`/`RECHAZADO` depende de reglas de validación configurables por tipo de operación |

#### Patrones GoF evaluados y descartados

| Patrón | Evaluado | Decisión | Justificación |
|--------|----------|----------|---------------|
| Abstract Factory | Sí | No aplica | No hay familias de objetos que varíen por contexto |
| Prototype | Sí | No aplica | No hay objetos costosos de replicar |
| Factory Method | Sí | No aplica | Solo un tipo de registro de conciliación |
| Singleton | Sí | No aplica | Spring gestiona ciclo de vida |
| Adapter | Sí | No aplica | FTP y mail son librerías conocidas — sin adaptación de interfaz incompatible |
| Bridge | Sí | No aplica | Sin dos dimensiones independientes de variación |
| Composite | Sí | No aplica | Sin jerarquías componibles |
| Decorator | Sí | No aplica | Sin comportamiento adicional dinámico |
| Flyweight | Sí | No aplica | Sin objetos de alta creación con estado compartible |
| Proxy | Sí | No aplica | Sin cache ni control de acceso en este componente |
| Chain of Responsibility | Sí | No aplica | 2 validaciones de negocio — `if` directo más claro |
| Command | Sí | No aplica | Sin requisito de undo ni audit log de operaciones |
| Iterator | Sí | No aplica | Lectura línea a línea de CSV con BufferedReader — sin Iterator explícito necesario |
| Mediator | Sí | No aplica | Sin comunicación compleja entre componentes internos |
| Memento | Sí | No aplica | Sin captura/restauración de estado en memoria |
| Observer | Sí | No aplica | Sin múltiples suscriptores al evento de procesamiento |
| State | Sí | No aplica | `APROBADO`/`RECHAZADO` son valores simples — enum suficiente |
| Visitor | Sí | No aplica | Sin jerarquía de tipos de registro con operaciones distintas |
| Template Method | Sí | No aplica | `ConciliacionProcessorImpl` implementa `ConciliacionProcessor` — Facade es suficiente |

---

#### Análisis de concurrencia y paralelismo

**I/O-bound — FTP download:** síncrono — prerequisito del procesamiento, no paralelizable.
`FtpClientImpl` con timeout 30s + retry 3 intentos con backoff exponencial.

**I/O-bound — FTP upload + email:** async en paralelo al finalizar el procesamiento.
`CompletableFuture.allOf()` + `ThreadPoolTaskExecutor`: core=2, max=4, queue=10, timeout=30s, política: `CallerRunsPolicy`.

**CPU-bound:** parseo 50k registros — aceptable en volumen conocido. Documentado como riesgo de escalabilidad. No se propone `@Async` sin evidencia de degradación real.

**TOCTOU — `referencia` duplicada:**

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `UNIQUE` constraint en `conciliacion.referencia` | Sí | **Elegida** | BD rechaza el INSERT duplicado — `DuplicateKeyException` capturada como `ALREADY_PROCESSED` |
| `SELECT FOR UPDATE` | Sí | Descartada | Overhead innecesario — el UNIQUE constraint resuelve en BD |
| Lock distribuido (Redis) | Sí | Descartada | Sin Redis disponible |
| Clave de idempotencia en aplicación | Sí | Descartada | El UNIQUE constraint en BD es la garantía real |

**`@Scheduled` sin lock — 3 réplicas:**

| Estrategia | Evaluada | Decisión | Justificación |
|------------|----------|----------|---------------|
| `ShedLock` (tabla en BD) | Sí | **Elegida** | No requiere Redis — BD ya disponible; simple con Spring Boot 3.x |
| `Redisson RLock.tryLock()` | Sí | Descartada | Sin Redis disponible en la infraestructura |
| `pg_try_advisory_lock` | Sí | Descartada | ShedLock es más portable y mantenible |
| Reducir réplicas a 1 para el scheduler | Sí | Descartada | Elimina alta disponibilidad |

---

#### Análisis de seguridad

| Amenaza | Control |
|---------|---------|
| CWE-312 — Cleartext Storage | `ftp.password=klap2024` y `mail.password` a variables de entorno — nunca en código |
| OWASP A09 — Logging insuficiente | MDC con `jobId` y `fecha` en cada ejecución del scheduler |
| Path traversal en nombre de archivo FTP | Validar que `conciliacion_YYYYMMDD.csv` cumple el patrón antes de descargar |
| NIST AC-3 | Validar que el archivo descargado pertenece a la fecha actual antes de procesar |

#### Plan de rollback

Schema BD sin cambio de breaking (solo se agrega `UNIQUE` constraint y tabla ShedLock). Flyway permite rollback de esas migraciones. Revertir JAR no rompe el servicio anterior.

---

**[Dev]** > Aprobado. Una duda: ¿por qué no usaste WebClient en vez de FtpClientImpl?

**[Agente]**
> WebClient es para HTTP/HTTPS. FTP usa el protocolo FTP nativo — `commons-net` es la librería correcta. Lo que sí se aplica del patrón WebClient es la **abstracción detrás de una interfaz** (`FtpClient`) y la **resiliencia** (timeout 30s + retry). Si el FTP se reemplazara por un endpoint HTTP en el futuro, solo cambiaría la implementación.

**[Dev]** > Perfecto, avanza a Fase 3.

---

### Entregable Fase 3

**[Agente]** *(leyendo sdd-checklist.md, defectos-tipicos-checklist.md, testing.md...)*

#### Reporte DO/DON'T

| Regla | Estado |
|-------|--------|
| Processor implementa interfaz | ✅ |
| Repository usa JdbcTemplate (no JPA) | ✅ |
| Naming `cl.klap.bysf.*` | ✅ |
| Sin credenciales en código | ✅ |
| 4 archivos `application-{ambiente}.properties` | ✅ |
| Builder cuando hay 4+ campos opcionales | ✅ `ConciliacionRecord` (14 campos, 6 opcionales) |
| Lock distribuido para `@Scheduled` con N réplicas | ✅ ShedLock |
| TOCTOU resuelto con constraint en BD | ✅ `UNIQUE (referencia)` |

---

#### Tabla de tareas atómicas

| # | Tipo | Tarea | Depende de | Tamaño | Riesgo | CA/CL | Tests |
|---|------|-------|-----------|--------|--------|-------|-------|
| T1 | Refact. | Capturar snapshots en `spec/contracts/` y escribir characterization tests del comportamiento actual (CSV output campo a campo, INSERT en BD, estructura email, upload FTP) | — | M | Bajo | RF-01..06 | Integración |
| T2 | Refact. | Rotar credenciales FTP + `mail.password` → variables de entorno; crear 4 `application-{ambiente}.properties` | T1 | S | **Crítico** | RNF-02 | — |
| T3 | Refact. | Actualizar `pom.xml`: Java 21, Spring Boot 3.5.x, ShedLock, remover Hibernate | T2 | S | Medio | — | Build verde |
| T4 | Refact. | Crear jerarquía de excepciones: `ConciliacionException`, `FtpConnectionException` | T3 | S | Bajo | CL-05 | Unitario |
| T5 | Refact. | Crear `FtpClientImpl` con timeout 30s, retry 3 intentos, interfaz `FtpClient` | T4 | M | Medio | RF-01, RF-05, CL-05 | Unitario + Integración |
| T6 | Refact. | Crear `MailClientImpl` con interfaz `MailClient` | T4 | S | Bajo | RF-06 | Unitario |
| T7 | Refact. | Crear `ConciliacionRepositoryImpl` JdbcTemplate batch + manejo `DuplicateKeyException` + `UNIQUE (referencia)` | T4 | M | Medio | RF-03, CA-08, CL-01 | Unitario + Integración |
| T8 | Refact. | Crear `ConciliacionRecord` y `ResultadoConciliacion` con Builder | T4 | S | Bajo | CL-02, CL-03 | Unitario |
| T9 | Refact. | Crear `AsyncConfig`: `ThreadPoolTaskExecutor` (core=2, max=4, queue=10, timeout=30s, CallerRunsPolicy) | T3 | S | Bajo | RF-04, RF-05, RF-06 | — |
| T10 | Refact. | Crear `ConciliacionProcessorImpl` (Saga): FtpClient → parse → validate → Repository → generate CSV → async(FtpUpload + Mail) | T5, T6, T7, T8, T9 | L | Alto | RF-01..06, CL-01..07 | Unitario + Integración |
| T11 | Refact. | Crear `ConciliacionScheduler` con ShedLock (`@SchedulerLock`) | T10 | S | Alto | RF-07, CA-07 | Integración |
| T12 | Refact. | Agregar MDC logging (`jobId`, `fecha`) en `ConciliacionProcessorImpl` | T10 | S | Bajo | RNF-03 | Unitario |
| T13 | Refact. | Ejecutar suite de characterization tests (T1) sobre código refactorizado — gate de no-regresión de contratos | T11, T12 | S | **Alto** | RF-01..06 | Integración |

---

#### Plan de tests por tarea

| # | Tests unitarios | Tests de integración |
|---|----------------|---------------------|
| **T1** | — | **Characterization tests obligatorios** ejecutados sobre el código ACTUAL: CSV output campo a campo vs `spec/contracts/csv-output-resultado.csv` · INSERT en BD vs `spec/contracts/json-bd-conciliacion.json` · body email vs `spec/contracts/txt-email-body.txt` · upload FTP en ruta correcta. Guardados como suite reutilizable `*CharacterizationTest.java`. |
| T4 | `FtpConnectionExceptionTest` | — |
| T5 | Mock FTPClient: retry en fallo · timeout | FTP real (Testcontainers FTP): descarga OK · servidor caído → 3 reintentos |
| T7 | Mock JdbcTemplate: INSERT OK · `DuplicateKeyException` → `ALREADY_PROCESSED` | PostgreSQL real: 2 threads misma `referencia` → 1 insertado, 1 `ALREADY_PROCESSED` |
| T10 | Mocks de FtpClient, MailClient, Repository · flujo OK · FTP caído → error · registro con monto 0 → RECHAZADO | Flujo completo con archivos reales + BD Testcontainers |
| T11 | Mock ShedLock: segunda instancia salta sin error | Integración BD: 3 instancias simultáneas del scheduler → exactamente 1 ejecuta el job |
| **T13** | — | **Gate de no-regresión**: misma suite de characterization tests sobre el código refactorizado. Deben pasar GREEN antes de cerrar la implementación. Un fallo RED indica que la refactorización alteró un contrato externo. |

**Checklist defectos típicos:**

| Categoría | Cubierto |
|-----------|---------|
| Duplicados | ✅ CL-01 — `UNIQUE (referencia)` + `ALREADY_PROCESSED` |
| Nulos | ✅ CL-02 — validación de `monto` y `cuenta_origen` |
| Validación de entrada | ✅ CL-03 — validación de encoding CSV |
| Casos de borde | ✅ CL-04 CSV vacío · CL-05 FTP caído · CL-06 rerun mismo día |
| Trazabilidad | ✅ MDC con `jobId` y `fecha` por ejecución |
| Control de acceso | ✅ CL-07 — credenciales FTP no expuestas en logs |

---

**[Dev]** > Dame más detalle de T10.

**[Agente]**
> **T10 — `ConciliacionProcessorImpl` (Saga) — detalle**
>
> ```
> procesarConciliacion(fecha: LocalDate): ResultadoJob
>   │
>   ├─ 1. ftpClient.descargar("/in/conciliacion_{fecha}.csv")  [síncrono]
>   │      └─ Si falla: FtpConnectionException → job termina ERROR
>   │
>   ├─ 2. parsear CSV línea a línea con ConciliacionRecord.builder()
>   │      └─ Encoding inválido → CL-03 → RECHAZADO "encoding_invalido"
>   │
>   ├─ 3. validar cada registro:
>   │      monto ≤ 0 → RECHAZADO "monto_invalido"
>   │      cuenta_origen nula → RECHAZADO "cuenta_origen_nula"
>   │
>   ├─ 4. repository.insertarBatch(registrosValidos)
>   │      DuplicateKeyException → ALREADY_PROCESSED (no error)
>   │
>   ├─ 5. generarCsvResultado(todos) → ResultadoConciliacion.builder()
>   │      escribe /tmp/resultado_conciliacion_{fecha}.csv
>   │
>   └─ 6. CompletableFuture.allOf() con timeout 30s:
>          ├─ ftpClient.subir("/tmp/resultado_{fecha}.csv", "/out/resultado_{fecha}.csv")
>          └─ mailClient.enviar(destinatario, resumen)
>          └─ Si falla: loggear ERROR con MDC, no relanzar (job ya completó)
> ```

**[Dev]** > Perfecto, aprobado.

---

**Archivos generados:**
```
spec/
├── conciliacion-batch-refactor-spec.md
├── conciliacion-batch-refactor-plan.md
└── contracts/
    ├── csv-input-conciliacion.csv
    ├── csv-output-resultado.csv
    ├── json-bd-conciliacion.json
    └── txt-email-body.txt
```
