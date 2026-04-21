# Arquitectura Capas

**Tipo:** `Architecture`

## Propiedades

- **tipo**: Event-Driven Microservice
- **capa1**: Kafka Input Layer: XxxKafkaListener consume topic input
- **capa2**: Orchestration Layer: XxxProcessor coordina flujo completo
- **capa3**: Domain Service + Repository + Kafka Producer + External API Client
- **capa4**: Infrastructure Layer: PostgreSQL Aurora + Kafka Topics + External APIs

## Conecta con

- [[Principios Arquitectonicos]] `APLICA`

