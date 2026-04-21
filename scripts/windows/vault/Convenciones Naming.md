# Convenciones Naming

**Tipo:** `NamingConventions`

## Propiedades

- **javadoc**: OBLIGATORIO en todos los metodos - debe explicar objetivo o funcionamiento del metodo
- **configs**: XxxConfig XxxKafkaConfig XxxClientConfig con @Configuration
- **metodos**: procesarXxx() consultarXxx() registrarXxx() para servicios - findById() findAll() insert() update() para repos - consumir() enviarMensaje() para kafka
- **interfaces**: XxxService XxxProcessor XxxRepository
- **listeners**: XxxKafkaListener con @Component
- **implementaciones**: XxxServiceImpl XxxProcessorImpl con @Service
- **dtos**: XxxInputDto XxxOutputDto XxxRequestDto XxxResponseDto
- **exceptions**: XxxException XxxClientException XxxPersistenceException

## Referenciado desde

- [[Standard KLAP BYSF]] `DEFINE`

