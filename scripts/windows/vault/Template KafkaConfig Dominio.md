# Template KafkaConfig Dominio

**Tipo:** `CodeTemplate`

## Propiedades

- **anotaciones**: @Configuration @EnableKafka
- **patron**: Extender KafkaConfig base y usar factory methods protegidos
- **beans**: xxxConsumerFactory() + xxxListenerContainerFactory() + xxxProducerFactory() + xxxKafkaTemplate() + notificationKafkaTemplate() + dlqKafkaTemplate()
- **nota**: NO duplicar logica de configuracion: usar createConsumerFactory() createProducerFactory() createKafkaTemplate() createListenerContainerFactoryWithDlq()
- **clase**: XxxKafkaConfig extends KafkaConfig

## Referenciado desde

- [[Standard KLAP BYSF]] `PROVEE`

