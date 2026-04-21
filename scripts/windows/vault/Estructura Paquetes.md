# Estructura Paquetes

**Tipo:** `PackageStructure`

## Propiedades

- **regla1**: global/: codigo transversal compartido entre dominios - AWS integrations, KafkaConfig base, OpenApiConfig, PostgresHealthIndicator, Constants, ConstantsQuery, Utils
- **regla2**: dominio/: todo lo especifico del negocio - listener, processor, client HTTP, repositorios, DTOs del dominio, excepciones del dominio
- **regla3**: Application.java va en la RAIZ del package (cl.klap.bysf.{modulo}.{app}), a la par de global/ y dominio/ - NO dentro de dominio/{nombre}/
- **regla4**: client/ contiene la INTERFAZ + config/ opcional, client/impl/ contiene la implementacion @Component
- **regla5**: repositories/mapper/ contiene los RowMappers, NO en un mapper/ separado al nivel del dominio
- **regla6**: services/ solo interfaces, services/impl/ solo implementaciones con @Service
- **regla7**: AWS services en global/aws/{nombre-servicio}/: config/ + model/ + service/ (ej: global/aws/lambda/, global/aws/ssm/)
- **dominio**: dominio/{nombre_dominio}/: {NombreApp}Application.java + client/ + client/impl/ + config/ + controller/ + exception/ + helpers/ + listener/ + model/dto/ + model/entities/ + repositories/ + repositories/mapper/ + services/ + services/impl/
- **global**: global/: aws/{servicio}/config/ + aws/{servicio}/model/ + aws/{servicio}/service/ + config/ + enums/ + exceptions/ + model/dto/ + utils/
- **raiz**: src/main/java/cl/klap/bysf/{modulo}/{aplicacion}/
- **referencia**: mcs-bysf-liqsvbo-validacion-tarifas (proyecto de referencia real)

## Referenciado desde

- [[Standard KLAP BYSF]] `DEFINE`

