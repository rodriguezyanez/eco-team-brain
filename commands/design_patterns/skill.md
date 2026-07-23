# Design Patterns — Skill KLAP BYSF
**Versión:** 2.1 · **Fecha:** 2026-07-13

Guía de referencia para el agente de Fase 2 (sdd-architecture-designer). Para cada patrón: señales en el código existente que lo activan, cuándo NO aplicarlo, ejemplos en distintos dominios por lenguaje y contexto KLAP BYSF.

**Dominios usados en los ejemplos:** 🎮 Juegos · 🛒 Retail · 🏦 Banca · 🏥 Salud · 📦 Logística · 🎵 Media

---

## Índice

### Creacionales
[Abstract Factory](#abstract-factory) · [Builder](#builder) · [Factory Method](#factory-method) · [Prototype](#prototype) · [Singleton](#singleton)

### Estructurales
[Adapter](#adapter) · [Bridge](#bridge) · [Composite](#composite) · [Decorator](#decorator) · [Facade](#facade) · [Flyweight](#flyweight) · [Proxy](#proxy)

### Comportamiento
[Chain of Responsibility](#chain-of-responsibility) · [Command](#command) · [Iterator](#iterator) · [Mediator](#mediator) · [Memento](#memento) · [Observer](#observer) · [State](#state) · [Strategy](#strategy) · [Template Method](#template-method) · [Visitor](#visitor)

---

## Abstract Factory

**Categoría:** Creacional

### Cuándo aplicar
- El código crea familias de objetos relacionados que varían juntos según un contexto (`if (env == "test") { new StubA(); new StubB(); }`)
- Los objetos de una familia deben usarse juntos y no mezclarse entre familias
- Agregar una nueva familia no debe modificar el código existente

### Cuándo NO aplicar
- Solo hay una familia de productos — Factory Method es suficiente
- Las familias comparten tan poco que no tienen interfaz común

### Java / Spring Boot — 🎮 Juegos
```java
// Familia de objetos que varía según plataforma (PC vs Mobile)
public interface PlatformFactory {
    InputHandler createInputHandler();   // teclado vs touch
    RenderEngine createRenderEngine();   // OpenGL vs Metal
    AudioPlayer  createAudioPlayer();    // DirectSound vs CoreAudio
}

@Profile("pc")
@Component
public class PcPlatformFactory implements PlatformFactory {
    public InputHandler  createInputHandler()  { return new KeyboardMouseHandler(); }
    public RenderEngine  createRenderEngine()  { return new OpenGlEngine(); }
    public AudioPlayer   createAudioPlayer()   { return new DirectSoundPlayer(); }
}

@Profile("mobile")
@Component
public class MobilePlatformFactory implements PlatformFactory {
    public InputHandler  createInputHandler()  { return new TouchHandler(); }
    public RenderEngine  createRenderEngine()  { return new MetalEngine(); }
    public AudioPlayer   createAudioPlayer()   { return new CoreAudioPlayer(); }
}
```

### TypeScript — 🛒 Retail
```typescript
// Familia de pasarelas de pago por país
interface PaymentFactory {
  createGateway(): PaymentGateway;
  createFraudDetector(): FraudDetector;
  createReceiptRenderer(): ReceiptRenderer;
}

class ChilePaymentFactory implements PaymentFactory {
  createGateway()        { return new TransbankGateway(); }
  createFraudDetector()  { return new ChileFraudDetector(); }
  createReceiptRenderer(){ return new BolettaRenderer(); }
}

class BrazilPaymentFactory implements PaymentFactory {
  createGateway()        { return new PagarMeGateway(); }
  createFraudDetector()  { return new BrazilFraudDetector(); }
  createReceiptRenderer(){ return new NotaFiscalRenderer(); }
}

function getFactory(country: string): PaymentFactory {
  return country === 'CL' ? new ChilePaymentFactory() : new BrazilPaymentFactory();
}
```

### JavaScript — 🏥 Salud
```javascript
// Familia de integraciones según sistema hospitalario
class HisFactory {
  createPatientReader()      { throw new Error('abstract'); }
  createAppointmentWriter()  { throw new Error('abstract'); }
}
class HL7Factory extends HisFactory {
  createPatientReader()     { return new HL7PatientReader(); }
  createAppointmentWriter() { return new HL7AppointmentWriter(); }
}
class FhirFactory extends HisFactory {
  createPatientReader()     { return new FhirPatientReader(); }
  createAppointmentWriter() { return new FhirAppointmentWriter(); }
}
const factory = config.HIS_PROTOCOL === 'HL7' ? new HL7Factory() : new FhirFactory();
```

### Python — 📦 Logística
```python
from abc import ABC, abstractmethod

class CarrierFactory(ABC):
    @abstractmethod
    def create_label_printer(self): ...
    @abstractmethod
    def create_tracker(self): ...

class FedexFactory(CarrierFactory):
    def create_label_printer(self): return FedexLabelPrinter()
    def create_tracker(self):        return FedexTracker()

class DhlFactory(CarrierFactory):
    def create_label_printer(self): return DhlLabelPrinter()
    def create_tracker(self):        return DhlTracker()

factory = FedexFactory() if settings.CARRIER == 'FEDEX' else DhlFactory()
```

### Otros dominios
| Dominio | Familia que varía |
|---------|------------------|
| 🏦 Banca | Clientes de core bancario: stub (tests) vs real (producción) |
| 🎵 Media | Encoders de audio/video según formato de salida (MP3/AAC, H264/AV1) |
| 🎮 Juegos | IA de enemigos según dificultad (fácil/difícil): distinto `PathFinder` + `AttackStrategy` |

### En el contexto KLAP BYSF
Preferir `@Profile` de Spring sobre factory manual — Spring inyecta la familia correcta según el ambiente. Usar cuando el microservicio tiene múltiples clientes externos que deben swapear juntos (stub en local/test, real en qa/master).

---

## Builder

**Categoría:** Creacional

### Cuándo aplicar
- Constructor o función con 4+ parámetros, varios opcionales
- La construcción tiene pasos con validaciones intermedias
- Se construyen queries dinámicas con cláusulas opcionales

### Cuándo NO aplicar
- Objeto con 1-3 campos obligatorios — constructor simple es suficiente
- Todos los campos son requeridos sin variación — no hay construcción diferida

### Java / Spring Boot — 🛒 Retail
```java
// Búsqueda de productos con filtros opcionales
@Builder
public record ProductSearchQuery(
    String keyword,
    String category,
    BigDecimal minPrice,
    BigDecimal maxPrice,
    Boolean inStock,
    String sortBy
) {}

// Query dinámica en el repository
public List<Product> search(ProductSearchQuery q) {
    var sql = new StringBuilder("SELECT * FROM product WHERE active = true");
    var params = new MapSqlParameterSource();
    if (q.keyword()   != null) { sql.append(" AND name ILIKE :kw");        params.addValue("kw", "%" + q.keyword() + "%"); }
    if (q.category()  != null) { sql.append(" AND category = :cat");       params.addValue("cat", q.category()); }
    if (q.minPrice()  != null) { sql.append(" AND price >= :min");         params.addValue("min", q.minPrice()); }
    if (q.inStock()   != null) { sql.append(" AND stock > 0"); }
    return jdbc.query(sql.toString(), params, productRowMapper);
}
```

### TypeScript — 🎮 Juegos
```typescript
// Creación de personaje con atributos opcionales
class CharacterBuilder {
  private data: Partial<Character> = { level: 1, hp: 100 };

  withName(name: string)       { this.data.name = name; return this; }
  withClass(cls: CharClass)    { this.data.cls = cls; return this; }
  withSkills(skills: Skill[])  { this.data.skills = skills; return this; }
  withEquipment(eq: Equipment) { this.data.equipment = eq; return this; }

  build(): Character {
    if (!this.data.name) throw new Error('name es obligatorio');
    return this.data as Character;
  }
}

const hero = new CharacterBuilder()
  .withName('Aldric')
  .withClass('WARRIOR')
  .withSkills([SLASH, SHIELD_BASH])
  .build();
```

### JavaScript — 🏥 Salud
```javascript
class PatientReportBuilder {
  #sections = [];
  #filters = {};

  withDiagnoses()    { this.#sections.push('diagnoses'); return this; }
  withPrescriptions(){ this.#sections.push('prescriptions'); return this; }
  withLabResults()   { this.#sections.push('labs'); return this; }
  fromDate(d)        { this.#filters.from = d; return this; }
  toDate(d)          { this.#filters.to = d; return this; }

  build() { return { sections: this.#sections, filters: this.#filters }; }
}

const report = new PatientReportBuilder()
  .withDiagnoses().withLabResults()
  .fromDate('2026-01-01')
  .build();
```

### Python — 🏦 Banca
```python
from dataclasses import dataclass
from typing import Optional
from datetime import date

@dataclass
class TransactionQuery:
    account_id: str
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    min_amount: Optional[float] = None
    transaction_type: Optional[str] = None

    def build_sql(self):
        conditions = ["account_id = %(account_id)s", "reversed = false"]
        params = {'account_id': self.account_id}
        if self.from_date:          conditions.append("date >= %(from_date)s");        params['from_date'] = self.from_date
        if self.to_date:            conditions.append("date <= %(to_date)s");          params['to_date'] = self.to_date
        if self.min_amount:         conditions.append("amount >= %(min_amount)s");     params['min_amount'] = self.min_amount
        if self.transaction_type:   conditions.append("type = %(type)s");              params['type'] = self.transaction_type
        return f"SELECT * FROM transaction WHERE {' AND '.join(conditions)}", params
```

### PostgreSQL — 🛒 Retail
```sql
-- Builder pattern en SQL: filtros opcionales sin concatenación
SELECT * FROM product
WHERE active = true
  AND ($1::text    IS NULL OR name ILIKE '%' || $1 || '%')
  AND ($2::text    IS NULL OR category = $2)
  AND ($3::numeric IS NULL OR price >= $3)
  AND ($4::numeric IS NULL OR price <= $4)
  AND ($5::boolean IS NULL OR (stock > 0) = $5)
ORDER BY created_at DESC;
```

### Otros dominios
| Dominio | Objeto construido |
|---------|-----------------|
| 📦 Logística | `ShipmentQuery` con filtros de carrier, estado, rango de fechas, origen/destino |
| 🎵 Media | `PlaylistBuilder` con géneros, BPM, duración, artistas excluidos |
| 🏥 Salud | `AppointmentScheduler` con especialidad, médico, franja horaria, modalidad (presencial/telemedicina) |

### En el contexto KLAP BYSF
En Java usar **Lombok `@Builder`** en records de dominio y DTOs. Para queries dinámicas en `XxxRepositoryImpl` usar `StringBuilder` + `MapSqlParameterSource` — nunca concatenar strings con valores de usuario (SQL injection). En PostgreSQL usar parámetros anulables en lugar de queries dinámicas generadas.

---

## Factory Method

**Categoría:** Creacional

### Cuándo aplicar
- El código tiene `if/switch` para instanciar distintas implementaciones de una misma interfaz
- La lógica de creación varía según el tipo de mensaje, evento o entidad
- Se quiere que el código sea extensible sin modificarlo (agregar un tipo = agregar una clase)

### Cuándo NO aplicar
- Solo existe un tipo de objeto a crear — constructor directo alcanza
- La variación está en el comportamiento, no en la creación — usar Strategy

### Java / Spring Boot — 🏦 Banca
```java
// Procesador distinto por tipo de transacción
public interface TransactionProcessor {
    TransactionResult process(Transaction tx);
}

@Component
public class TransactionProcessorFactory {
    private final Map<String, TransactionProcessor> processors;

    // Spring inyecta todos los beans que implementan TransactionProcessor
    public TransactionProcessorFactory(List<TransactionProcessor> list) {
        this.processors = list.stream()
            .collect(Collectors.toMap(p -> p.getClass().getAnnotation(TxType.class).value(), p -> p));
    }

    public TransactionProcessor getProcessor(String type) {
        return Optional.ofNullable(processors.get(type))
            .orElseThrow(() -> new UnsupportedTransactionException(type));
    }
}

@TxType("TRANSFER")   @Component public class TransferProcessor implements TransactionProcessor { ... }
@TxType("WITHDRAWAL") @Component public class WithdrawalProcessor implements TransactionProcessor { ... }
@TxType("DEPOSIT")    @Component public class DepositProcessor implements TransactionProcessor { ... }
```

### TypeScript — 🎵 Media
```typescript
interface ContentEncoder { encode(file: Buffer): Promise<Buffer>; }

const encoders: Record<string, ContentEncoder> = {
  mp3:  new Mp3Encoder(),
  aac:  new AacEncoder(),
  flac: new FlacEncoder(),
};

function getEncoder(format: string): ContentEncoder {
  const enc = encoders[format];
  if (!enc) throw new Error(`Formato no soportado: ${format}`);
  return enc;
}

// Uso
const encoder = getEncoder(uploadRequest.targetFormat);
const encoded = await encoder.encode(rawAudio);
```

### JavaScript — 📦 Logística
```javascript
// Handler de eventos de tracking según carrier
const handlers = {
  FEDEX:  new FedexTrackingHandler(),
  DHL:    new DhlTrackingHandler(),
  CHILEX: new ChilexTrackingHandler(),
};

function getTrackingHandler(carrier) {
  if (!handlers[carrier]) throw new Error(`Carrier no soportado: ${carrier}`);
  return handlers[carrier];
}
```

### Python — 🏥 Salud
```python
from abc import ABC, abstractmethod

class AppointmentHandler(ABC):
    @abstractmethod
    def schedule(self, request: dict) -> dict: ...

class TelemedicineHandler(AppointmentHandler):
    def schedule(self, req): # genera link de videollamada
        return {'type': 'TELEMEDICINE', 'link': generate_video_link(req)}

class InPersonHandler(AppointmentHandler):
    def schedule(self, req): # asigna box físico
        return {'type': 'IN_PERSON', 'room': assign_room(req)}

_registry = {
    'TELEMEDICINE': TelemedicineHandler(),
    'IN_PERSON':    InPersonHandler(),
}

def get_handler(appointment_type: str) -> AppointmentHandler:
    if appointment_type not in _registry:
        raise ValueError(f'Tipo no soportado: {appointment_type}')
    return _registry[appointment_type]
```

### Otros dominios
| Dominio | Variante de la factory |
|---------|----------------------|
| 🎮 Juegos | `EnemyFactory.create(type)` → `GoblinEnemy`, `DragonEnemy`, `BossEnemy` |
| 🛒 Retail | `DiscountFactory.get(type)` → `PercentageDiscount`, `FixedDiscount`, `BuyXGetYDiscount` |
| 🏦 Banca | `ReportFactory.get(format)` → `PdfReport`, `ExcelReport`, `CsvReport` |

### En el contexto KLAP BYSF
Registrar processors como `@Component` con Spring y resolver con `Map<String, XxxProcessor>` inyectado — evita el `if/switch`. La clave del Map debe ser el discriminador del tipo del evento Kafka o del campo `tipo` de la entidad. Cada processor se testea en aislamiento.

---

## Prototype

**Categoría:** Creacional

### Cuándo aplicar
- Crear un objeto es costoso y se necesitan múltiples copias con variaciones menores
- Se necesitan objetos de prueba (test fixtures) con una base común y campos que varían
- El tipo exacto del objeto no se conoce en tiempo de compilación pero debe copiarse

### Cuándo NO aplicar
- Los objetos son simples records/structs sin estado mutable — constructor directo
- La "copia" es en realidad una transformación de datos — usar mapper o Builder

### Java / Spring Boot — 🎮 Juegos
```java
// Clonar enemigos desde una plantilla base
public record Enemy(String type, int hp, int damage, Position position, List<Skill> skills) {
    public Enemy at(Position newPosition) {
        return new Enemy(type, hp, damage, newPosition, skills);
    }
    public Enemy withHp(int newHp) {
        return new Enemy(type, newHp, damage, position, skills);
    }
}

// Plantilla registrada una sola vez, clonada N veces al spawnear
Enemy goblinTemplate = new Enemy("GOBLIN", 50, 10, Position.ZERO, List.of(SLASH));
Enemy goblin1 = goblinTemplate.at(new Position(10, 20));
Enemy goblin2 = goblinTemplate.at(new Position(30, 40)).withHp(75); // variante boss
```

### TypeScript — 🛒 Retail
```typescript
// Variantes de producto desde un producto base
interface Product { sku: string; name: string; price: number; color?: string; size?: string; }

function createVariant(base: Product, overrides: Partial<Product>): Product {
  return { ...base, ...overrides, sku: generateSku(base.sku, overrides) };
}

const baseShirt: Product = { sku: 'SHIRT-001', name: 'Camiseta básica', price: 15990 };
const redL  = createVariant(baseShirt, { color: 'RED',  size: 'L' });
const blueM = createVariant(baseShirt, { color: 'BLUE', size: 'M', price: 14990 });
```

### Python — 🏥 Salud
```python
import dataclasses
from dataclasses import dataclass

@dataclass(frozen=True)
class Prescription:
    patient_id: str
    drug: str
    dose_mg: int
    frequency: str
    duration_days: int

base_rx = Prescription('P-001', 'Amoxicillin', 500, 'EVERY_8H', 7)
# Clonar con ajuste de dosis para paciente pediátrico
pediatric_rx = dataclasses.replace(base_rx, dose_mg=250, duration_days=5)
```

### Otros dominios
| Dominio | Objeto prototipado |
|---------|-------------------|
| 🏦 Banca | Plantilla de `LoanOffer` base clonada con distintos plazos/tasas por segmento de cliente |
| 📦 Logística | `ShipmentTemplate` clonado para envíos periódicos al mismo destinatario |
| 🎮 Juegos | `Level` con layout base clonado con variantes de dificultad (más enemigos, menos tiempo) |

### En el contexto KLAP BYSF
Más útil en **tests**: crear un objeto base (`ProductMother.active()`) y derivar variantes con `with*` methods. En Java preferir records con métodos `withXxx` sobre `Cloneable` (API legacy). Evitar clonar objetos con conexiones, streams o recursos externos.

---

## Singleton

**Categoría:** Creacional

### Cuándo aplicar
- Se necesita exactamente una instancia compartida (config, pool de conexiones, caché en memoria)
- La instancia es costosa de crear y debe reutilizarse

### Cuándo NO aplicar
- **En Spring Boot: no implementar Singleton manualmente** — `@Component`, `@Service`, `@Repository` son singletons por defecto
- Cuando el estado compartido genera race conditions difíciles de aislar en tests
- Para configuración estática — constantes o archivos de configuración son más simples

### Java / Spring Boot — 🏦 Banca
```java
// Spring maneja esto — NO hacer esto:
// public class FraudEngine { private static FraudEngine instance; ... }

// Sí hacer esto: Spring crea una sola instancia, inyectable en toda la app
@Service
public class FraudDetectionEngine {
    private final RuleSet rules;
    public FraudDetectionEngine(RuleSetLoader loader) {
        this.rules = loader.loadRules(); // costoso — se hace UNA vez
    }
    public FraudResult evaluate(Transaction tx) { return rules.evaluate(tx); }
}
```

### TypeScript — 🛒 Retail
```typescript
// Módulo como singleton (patrón idiomático — Node cachea el módulo)
// pricing-config.ts
export const pricingConfig = {
  vatRate:       0.19,
  currencyCode:  'CLP',
  roundingMode:  'HALF_UP',
} as const;

// Clase singleton para estado mutable (ej: caché de precios)
class PriceCache {
  private static instance: PriceCache;
  private readonly cache = new Map<string, number>();
  private constructor() {}
  static getInstance(): PriceCache {
    PriceCache.instance ??= new PriceCache();
    return PriceCache.instance;
  }
  get(sku: string)            { return this.cache.get(sku); }
  set(sku: string, p: number) { this.cache.set(sku, p); }
}
```

### Python — 🎮 Juegos
```python
# Módulo como singleton (idiomático en Python)
# game_config.py
import os
MAX_PLAYERS   = int(os.getenv('MAX_PLAYERS', '4'))
TICK_RATE_HZ  = int(os.getenv('TICK_RATE', '60'))
MAP_SEED      = int(os.getenv('MAP_SEED', '42'))

# Metaclase singleton para estado mutable (session manager)
class SingletonMeta(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class GameSessionManager(metaclass=SingletonMeta):
    def __init__(self): self._sessions = {}
    def register(self, session_id, session): self._sessions[session_id] = session
```

### Otros dominios
| Dominio | Singleton útil |
|---------|---------------|
| 🏥 Salud | `IcdCodeRegistry` — catálogo de códigos de diagnóstico cargado una vez al iniciar |
| 📦 Logística | `CarrierRateTable` — tabla de tarifas cargada desde BD al arrancar la app |
| 🎵 Media | `ContentDeliveryConfig` — configuración de CDN compartida por todos los encoders |

### En el contexto KLAP BYSF
En Spring Boot no implementar Singleton manualmente — el contenedor lo gestiona. En TypeScript/Node, el módulo ES module es singleton natural. Usar clase Singleton explícita solo cuando se necesita inicialización lazy o control fino sobre el momento de creación.

---

## Adapter

**Categoría:** Estructural

### Cuándo aplicar
- Una librería o API externa tiene interfaz incompatible con lo que el dominio espera
- Se wrappea código legacy para que encaje en la nueva arquitectura
- Se quiere aislar el dominio de los detalles de contrato de una integración

### Cuándo NO aplicar
- Las interfaces ya son compatibles — el adapter sería un pass-through sin valor
- La adaptación es solo un mapeo de campos — un mapper DTO es suficiente

### Java / Spring Boot — 🏥 Salud
```java
// El dominio usa PatientRecord; el sistema externo retorna Hl7Message
public interface PatientGateway {
    PatientRecord findByRut(String rut);  // interfaz del dominio
}

@Component
public class Hl7PatientAdapter implements PatientGateway {
    private final Hl7Client hl7Client;

    public PatientRecord findByRut(String rut) {
        Hl7Message msg = hl7Client.sendQuery("QBP^Q22", rut);
        // Adapta: HL7 usa segmentos PID, dominio usa PatientRecord plano
        return PatientRecord.builder()
            .rut(msg.getPid().getPatientId())
            .name(msg.getPid().getPatientName().getFullName())
            .birthDate(msg.getPid().parseBirthDate())
            .build();
    }
}
```

### TypeScript — 🎵 Media
```typescript
// El dominio espera TrackInfo; el proveedor externo retorna SpotifyTrack
interface TrackInfo { id: string; title: string; artistName: string; durationMs: number; }

class SpotifyTrackAdapter {
  constructor(private readonly spotifySdk: SpotifyWebApi) {}

  async getTrack(trackId: string): Promise<TrackInfo> {
    const raw = await this.spotifySdk.tracks.get(trackId);
    return {
      id:          raw.id,
      title:       raw.name,
      artistName:  raw.artists.map(a => a.name).join(', '),
      durationMs:  raw.duration_ms,
    };
  }
}
```

### JavaScript — 📦 Logística
```javascript
// El dominio usa ShipmentStatus; FedEx retorna su propio formato
class FedexStatusAdapter {
  constructor(fedexApi) { this.api = fedexApi; }

  async getStatus(trackingNumber) {
    const raw = await this.api.getTracking({ trackingInfo: [{ trackingNumberInfo: { trackingNumber } }] });
    const event = raw.output.completeTrackResults[0].trackResults[0].latestStatusDetail;
    return { code: event.statusByLocale, location: event.scanLocation?.city ?? 'UNKNOWN' };
  }
}
```

### Python — 🎮 Juegos
```python
# El dominio usa Vector2D; motor externo usa tuplas (x, y)
class Vector2D:
    def __init__(self, x: float, y: float):
        self.x, self.y = x, y

class PhysicsEngineAdapter:
    def __init__(self, engine):
        self._engine = engine  # usa (x, y) tuples internamente

    def get_velocity(self, body_id: str) -> Vector2D:
        vx, vy = self._engine.get_body_velocity(body_id)
        return Vector2D(vx, vy)

    def apply_force(self, body_id: str, force: Vector2D):
        self._engine.apply_force(body_id, (force.x, force.y))
```

### Otros dominios
| Dominio | Adaptación |
|---------|-----------|
| 🏦 Banca | `SbifAdapter` adapta respuesta XML de la SBIF a `ExchangeRate` del dominio |
| 🛒 Retail | `ErpAdapter` convierte `SapProduct` (estructura ERP) a `Product` del catálogo |
| 🏥 Salud | `FhirPatientAdapter` convierte recurso FHIR R4 a `PatientRecord` interno |

### En el contexto KLAP BYSF
Patrón estándar para `XxxClientImpl`: el dominio define la interfaz, el impl adapta la respuesta de la API externa al tipo que el dominio necesita. Nunca filtrar objetos de respuesta externos hacia el `Processor` — el adapter traduce al tipo de dominio.

---

## Bridge

**Categoría:** Estructural

### Cuándo aplicar
- Dos dimensiones de variación independientes generarían explosión de subclases (`EmailAlerta`, `SmsAlerta`, `PushAlerta`, `EmailReporte`, `SmsReporte`...)
- Se quiere cambiar la implementación en runtime sin tocar la abstracción

### Cuándo NO aplicar
- Solo una dimensión varía — Strategy o herencia simple alcanza
- Las combinaciones son pocas y estables (≤3) — clases concretas son más simples

### Java / Spring Boot — 🛒 Retail
```java
// Abstracción: tipo de comunicación (Alerta, Factura, Promoción)
// Implementación: canal (Email, SMS, Push, WhatsApp)
public interface NotificationChannel {
    void send(String recipient, String subject, String body);
}

@Component("emailChannel") public class EmailChannel implements NotificationChannel { ... }
@Component("smsChannel")   public class SmsChannel   implements NotificationChannel { ... }

public abstract class RetailCommunication {
    protected final NotificationChannel channel;
    protected RetailCommunication(NotificationChannel channel) { this.channel = channel; }
    public abstract void notify(Customer customer, Object data);
}

public class OrderAlert extends RetailCommunication {
    public void notify(Customer c, Object data) {
        channel.send(c.email(), "Alerta de pedido", formatAlert(data));
    }
}
public class PromoBlast extends RetailCommunication {
    public void notify(Customer c, Object data) {
        channel.send(c.phone(), "Oferta especial", formatPromo(data));
    }
}
```

### TypeScript — 🎮 Juegos
```typescript
// Abstracción: tipo de efecto (Explosión, Curación, Teletransporte)
// Implementación: renderer (WebGL, Canvas2D, Headless para tests)
interface Renderer { drawParticles(x: number, y: number, color: string, count: number): void; }
class WebGLRenderer   implements Renderer { drawParticles(x, y, color, n) { /* GPU */ } }
class Canvas2DRenderer implements Renderer { drawParticles(x, y, color, n) { /* CPU */ } }

abstract class GameEffect {
  constructor(protected renderer: Renderer) {}
  abstract trigger(x: number, y: number): void;
}
class ExplosionEffect extends GameEffect {
  trigger(x, y) { this.renderer.drawParticles(x, y, 'orange', 200); }
}
class HealEffect extends GameEffect {
  trigger(x, y) { this.renderer.drawParticles(x, y, 'green', 50); }
}
```

### Python — 🏥 Salud
```python
from abc import ABC, abstractmethod

class ReportChannel(ABC):
    @abstractmethod
    def deliver(self, recipient: str, content: bytes): ...

class EmailChannel(ReportChannel):
    def deliver(self, recipient, content): ...  # SMTP attachment

class PrinterChannel(ReportChannel):
    def deliver(self, recipient, content): ...  # envía a impresora local

class MedicalReport(ABC):
    def __init__(self, channel: ReportChannel):
        self._channel = channel
    @abstractmethod
    def generate(self, patient_id: str) -> bytes: ...
    def send(self, patient_id: str, recipient: str):
        content = self.generate(patient_id)
        self._channel.deliver(recipient, content)

class LabResultReport(MedicalReport):
    def generate(self, patient_id): ...  # genera PDF de resultados de laboratorio
```

### Otros dominios
| Dominio | Dimensiones que varían independientemente |
|---------|------------------------------------------|
| 🏦 Banca | Tipo de estado de cuenta (resumen, detalle, XML SII) × formato de entrega (email, portal, API) |
| 📦 Logística | Tipo de etiqueta (nacional, internacional, peligrosa) × impresora (térmica, láser, PDF) |
| 🎵 Media | Tipo de contenido (podcast, música, video) × calidad de streaming (alta, media, baja) |

### En el contexto KLAP BYSF
Usar cuando el microservicio envía notificaciones donde **tipo** y **canal** varían independientemente. Si solo hay un canal o solo un tipo, Strategy es suficiente y más simple.

---

## Composite

**Categoría:** Estructural

### Cuándo aplicar
- Estructura de árbol donde nodos hoja y compuestos deben tratarse igual
- Reglas o validaciones que se componen: reglas simples + grupos de reglas
- Jerarquías de categorías, permisos u org charts

### Cuándo NO aplicar
- La estructura no es jerárquica — lista plana de objetos
- Hoja y compuesto tienen interfaces radicalmente distintas

### Java / Spring Boot — 🛒 Retail
```java
// Reglas de descuento componibles
public interface DiscountRule {
    Optional<BigDecimal> apply(CartItem item);
}

public class SeasonalDiscount implements DiscountRule {
    public Optional<BigDecimal> apply(CartItem item) {
        return isInSeason(item) ? Optional.of(item.price().multiply(new BigDecimal("0.10"))) : Optional.empty();
    }
}

public class CompositeDiscountRule implements DiscountRule {
    private final List<DiscountRule> rules;
    public CompositeDiscountRule(DiscountRule... rules) { this.rules = List.of(rules); }

    public Optional<BigDecimal> apply(CartItem item) {
        return rules.stream()
            .map(r -> r.apply(item))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .reduce(BigDecimal.ZERO, BigDecimal::add, BigDecimal::add)
            .describeConstable()
            .filter(d -> d.compareTo(BigDecimal.ZERO) > 0);
    }
}

DiscountRule allDiscounts = new CompositeDiscountRule(
    new SeasonalDiscount(), new LoyaltyDiscount(), new BundleDiscount()
);
```

### TypeScript — 🎮 Juegos
```typescript
// Árbol de entidades del juego: escena → grupo → entidad individual
interface GameEntity { update(delta: number): void; render(): void; }

class Sprite implements GameEntity {
  constructor(private texture: string, private x: number, private y: number) {}
  update(delta: number) { /* mover */ }
  render() { /* dibujar texture en (x,y) */ }
}

class EntityGroup implements GameEntity {
  private children: GameEntity[] = [];
  add(e: GameEntity) { this.children.push(e); }
  update(delta: number) { this.children.forEach(c => c.update(delta)); }
  render() { this.children.forEach(c => c.render()); }
}

const scene = new EntityGroup();
const enemies = new EntityGroup();
enemies.add(new Sprite('goblin', 10, 20));
enemies.add(new Sprite('orc', 30, 40));
scene.add(enemies);
scene.update(0.016); // actualiza toda la jerarquía
```

### Python — 🏢 RRHH
```python
from abc import ABC, abstractmethod

class OrgNode(ABC):
    @abstractmethod
    def get_headcount(self) -> int: ...
    @abstractmethod
    def get_payroll(self) -> float: ...

class Employee(OrgNode):
    def __init__(self, name: str, salary: float):
        self.name, self.salary = name, salary
    def get_headcount(self): return 1
    def get_payroll(self):   return self.salary

class Department(OrgNode):
    def __init__(self, name: str):
        self.name = name
        self._members: list[OrgNode] = []
    def add(self, node: OrgNode): self._members.append(node)
    def get_headcount(self): return sum(m.get_headcount() for m in self._members)
    def get_payroll(self):   return sum(m.get_payroll()   for m in self._members)

engineering = Department('Engineering')
engineering.add(Employee('Ana', 3_500_000))
engineering.add(Employee('Luis', 3_200_000))
print(engineering.get_headcount())  # 2
```

### Otros dominios
| Dominio | Estructura compuesta |
|---------|---------------------|
| 🏦 Banca | Portafolio de inversiones: `Portfolio` contiene `Fund` y `Stock` — `getTotalValue()` recursivo |
| 🏥 Salud | Protocolo de tratamiento: `TreatmentPlan` contiene `Phase` que contiene `Procedure` |
| 📦 Logística | `Container` que contiene `Package` o sub-`Container` — cálculo de peso total recursivo |

### En el contexto KLAP BYSF
Usar para validaciones en `XxxProcessorImpl` cuando las reglas de negocio son componibles (cada regla testeable por separado, combinadas en producción). Evitar condicionales anidados — una `ReglasCompuestas` es más legible y extensible.

---

## Decorator

**Categoría:** Estructural

### Cuándo aplicar
- Agregar comportamiento (logging, caché, retry, auditoría) a objetos individuales sin modificar la clase
- La herencia generaría demasiadas subclases para cada combinación de comportamientos

### Cuándo NO aplicar
- El comportamiento aplica a toda la clase — `@Aspect` (AOP) o herencia es más apropiado
- El decorator necesita acceso a estado privado del decorado

### Java / Spring Boot — 🏦 Banca
```java
// Decorator de auditoría sobre AccountRepository
public class AuditedAccountRepository implements AccountRepository {
    private final AccountRepository delegate;
    private final AuditLogger auditLogger;

    public Account findById(String id) {
        Account account = delegate.findById(id);
        auditLogger.log("READ", "account", id, SecurityContext.getCurrentUser());
        return account;
    }

    public void debit(String id, BigDecimal amount) {
        delegate.debit(id, amount);
        auditLogger.log("DEBIT", "account", id, amount.toString());
    }
}
// En Spring preferir @Aspect para no ensamblar decoradores manualmente
```

### TypeScript — 🛒 Retail
```typescript
// Decorator de caché sobre ProductCatalog
class CachingProductCatalog implements ProductCatalog {
  private cache = new Map<string, Product>();

  constructor(private delegate: ProductCatalog, private ttlMs = 300_000) {}

  async getProduct(sku: string): Promise<Product> {
    if (this.cache.has(sku)) return this.cache.get(sku)!;
    const product = await this.delegate.getProduct(sku);
    this.cache.set(sku, product);
    setTimeout(() => this.cache.delete(sku), this.ttlMs);
    return product;
  }
}
```

### JavaScript — 🎮 Juegos
```javascript
// Higher-order function como decorator de timing
function withTiming(fn, label) {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    console.log(`[${label}] ${(performance.now() - start).toFixed(2)}ms`);
    return result;
  };
}

const timedPathfinder = withTiming(pathfinder.findPath.bind(pathfinder), 'A*');
const path = await timedPathfinder(start, goal);
```

### Python — 🏥 Salud
```python
import functools, logging

def require_authorization(roles: list[str]):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(self, *args, **kwargs):
            user = get_current_user()
            if not any(r in user.roles for r in roles):
                raise PermissionError(f'{func.__name__} requiere rol: {roles}')
            return func(self, *args, **kwargs)
        return wrapper
    return decorator

class PrescriptionService:
    @require_authorization(['DOCTOR', 'PHARMACIST'])
    def issue_prescription(self, patient_id: str, drug: str, dose: str): ...

    @require_authorization(['DOCTOR'])
    def cancel_prescription(self, rx_id: str): ...
```

### PostgreSQL — 🛒 Retail
```sql
-- Vista como decorator sobre tabla base
CREATE VIEW active_products AS
  SELECT * FROM product WHERE active = true AND deleted_at IS NULL;

-- Vista adicional que agrega información de precio con descuento
CREATE VIEW products_with_price AS
  SELECT p.*, p.price * (1 - COALESCE(d.rate, 0)) AS final_price
  FROM active_products p
  LEFT JOIN active_discount d ON d.category = p.category;
```

### Otros dominios
| Dominio | Comportamiento decorado |
|---------|------------------------|
| 📦 Logística | `RetryableShipmentClient` — reintenta la llamada al carrier hasta 3 veces con backoff |
| 🎮 Juegos | `LoggingGameEventBus` — loggea cada evento antes de despacharlo a los handlers |
| 🏦 Banca | `RateLimitedFraudClient` — limita llamadas a la API de detección a N/segundo |

### En el contexto KLAP BYSF
En Spring Boot usar `@Cacheable` (caché automático) y `@Aspect` (logging/timing) en lugar de decoradores manuales. Decorator manual para casos donde Spring AOP no aplica (clases no administradas por Spring, lambdas, funciones puras). En PostgreSQL, vistas apiladas son el equivalente natural.

---

## Facade

**Categoría:** Estructural

### Cuándo aplicar
- Un subsistema tiene múltiples componentes con interfaces complejas y el cliente solo necesita una operación de alto nivel
- El código cliente repite la misma secuencia de llamadas a varios objetos
- Se quiere reducir el acoplamiento entre capas

### Cuándo NO aplicar
- El subsistema tiene una sola clase — facade es redundante
- El cliente necesita acceso granular al subsistema — facade lo limitaría

### Java / Spring Boot — 🛒 Retail
```java
// CheckoutFacade orquesta: inventario + pago + envío + notificación
@Service
public class CheckoutFacade {
    private final InventoryService inventory;
    private final PaymentGateway payment;
    private final ShipmentService shipment;
    private final NotificationService notification;

    public OrderConfirmation checkout(CartId cartId, PaymentInfo paymentInfo) {
        Cart cart = inventory.reserveItems(cartId);         // 1. reservar stock
        PaymentResult paid = payment.charge(paymentInfo, cart.total()); // 2. cobrar
        Shipment ship = shipment.schedule(cart.items(), cart.address()); // 3. agendar envío
        notification.sendOrderConfirmation(cart.customerId(), ship);     // 4. notificar
        return new OrderConfirmation(cart.id(), ship.trackingNumber());
    }
}
// El controller solo llama checkout() — no conoce inventory/payment/shipment
```

### TypeScript — 🏥 Salud
```typescript
// AppointmentFacade orquesta: disponibilidad + agenda + notificación + billing
class AppointmentFacade {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly agenda: AgendaService,
    private readonly notifier: NotificationService,
    private readonly billing: BillingService
  ) {}

  async book(request: BookingRequest): Promise<Appointment> {
    const slot  = await this.availability.findNext(request.specialty, request.preferredDate);
    const appt  = await this.agenda.reserve(slot, request.patientId);
    await this.notifier.sendReminder(appt, request.patientId);
    await this.billing.createCharge(appt.id, request.insuranceId);
    return appt;
  }
}
```

### Python — 🎮 Juegos
```python
class GameSessionFacade:
    def __init__(self, lobby, matchmaker, world_loader, event_bus):
        self._lobby = lobby
        self._matchmaker = matchmaker
        self._world = world_loader
        self._events = event_bus

    def start_match(self, player_ids: list[str]) -> str:
        match_id = self._matchmaker.create(player_ids)
        world    = self._world.load(match_id)
        self._lobby.move_players_to_match(player_ids, match_id)
        self._events.publish('MATCH_STARTED', {'match_id': match_id, 'players': player_ids})
        return match_id
```

### Otros dominios
| Dominio | Operación de alto nivel que el facade oculta |
|---------|----------------------------------------------|
| 🏦 Banca | `LoanApplicationFacade.apply()` → credit score + risk assessment + document storage + notify |
| 📦 Logística | `ShipmentFacade.dispatch()` → label generation + carrier API + tracking setup + alert |
| 🎵 Media | `TrackPublishFacade.publish()` → encode + CDN upload + metadata index + playlist update |

### En el contexto KLAP BYSF
El `XxxProcessorImpl` **es** el Facade del dominio en KLAP BYSF: oculta repository, clients y validaciones al controller. El controller solo llama `processor.crear(request)` — no conoce los subsistemas. El Facade no contiene lógica de persistencia ni HTTP directamente — solo orquesta.

---

## Flyweight

**Categoría:** Estructural

### Cuándo aplicar
- Gran cantidad de objetos con estado inmutable compartible entre instancias
- El consumo de memoria es un problema medible por la cantidad de objetos creados
- Los objetos tienen un "estado intrínseco" (compartido) y "estado extrínseco" (por instancia)

### Cuándo NO aplicar
- La cantidad de objetos es pequeña — optimización prematura
- Los objetos no tienen suficiente estado compartible para justificar la complejidad

### Java / Spring Boot — 🎮 Juegos
```java
// Estado intrínseco (compartido): textura, sonido, estadísticas base del tipo de enemigo
// Estado extrínseco (por instancia): posición, HP actual
public record EnemyType(String name, String texture, int baseHp, int baseDamage) {}

@Component
public class EnemyTypeRegistry {
    private final Map<String, EnemyType> cache = new ConcurrentHashMap<>();
    private final EnemyTypeRepository repository;

    public EnemyType get(String name) {
        return cache.computeIfAbsent(name, repository::findByName);
    }
}

// En runtime: N instancias de Enemy comparten UN EnemyType
public record Enemy(EnemyType type, int currentHp, Position position) {}
```

### TypeScript — 🎵 Media
```typescript
// Metadatos de codec compartidos entre miles de pistas
interface CodecProfile { name: string; bitrate: number; sampleRate: number; }

class CodecProfileFactory {
  private static cache = new Map<string, CodecProfile>();

  static get(codec: string, quality: 'HQ' | 'MQ' | 'LQ'): CodecProfile {
    const key = `${codec}:${quality}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, loadCodecProfile(codec, quality));
    }
    return this.cache.get(key)!;
  }
}

// Millones de Track comparten el mismo CodecProfile
interface Track { id: string; title: string; codec: CodecProfile; }
```

### Python — 🏥 Salud
```python
from functools import lru_cache

@lru_cache(maxsize=500)
def get_icd_code(code: str) -> dict:
    """Carga una vez el código ICD-10 desde BD; reutilizado en millones de diagnósticos."""
    return db.query_one("SELECT * FROM icd_code WHERE code = %s", [code])

# Millones de Diagnosis usan el mismo ICD code object sin duplicar en memoria
```

### PostgreSQL — 🛒 Retail
```sql
-- Tabla de referencia inmutable (flyweight store)
CREATE TABLE tax_category (
    code        VARCHAR(10) PRIMARY KEY,
    description VARCHAR(100) NOT NULL,
    rate        NUMERIC(5,4) NOT NULL
);
-- Los productos referencian por FK — no duplican el rate en cada fila
ALTER TABLE product ADD COLUMN tax_category_code VARCHAR(10) REFERENCES tax_category(code);
-- La app cachea tax_category en memoria al iniciar — evita hits de BD por cada producto
```

### Otros dominios
| Dominio | Estado intrínseco compartido |
|---------|------------------------------|
| 🏦 Banca | `CurrencyCode` (ISO 4217) — compartido entre millones de transacciones |
| 📦 Logística | `PackagingType` — peso/dimensiones estándar compartidos entre miles de envíos |
| 🛒 Retail | `TaxCategory` — tasa de IVA compartida entre todos los productos de la misma categoría |

### En el contexto KLAP BYSF
Aplicar en tablas de referencia pequeñas y estables: `tipo_pago`, `codigo_error`, `tipo_moneda`. Cachear en memoria con `ConcurrentHashMap` o `@Cacheable` de Spring. Los flyweights deben ser **inmutables** — si cambian, invalidar el caché completo.

---

## Proxy

**Categoría:** Estructural

### Cuándo aplicar
- Control de acceso: verificar permisos antes de delegar al objeto real
- Lazy loading: el objeto real es costoso y no siempre se necesita
- Caché: evitar llamadas repetidas con el mismo resultado
- Logging/auditoría transparente sin modificar el objeto real

### Cuándo NO aplicar
- En Spring Boot: `@Cacheable`, `@PreAuthorize` y AOP reemplazan proxies manuales
- El objeto real es barato y siempre se necesita — proxy agrega overhead sin beneficio

### Java / Spring Boot — 🏥 Salud
```java
// Proxy de control de acceso sobre PatientRecordRepository
public class AccessControlledPatientRepo implements PatientRecordRepository {
    private final PatientRecordRepository delegate;
    private final AccessControlService acl;

    public PatientRecord findById(String patientId) {
        if (!acl.canRead(SecurityContext.getCurrentUser(), patientId))
            throw new AccessDeniedException("No autorizado para acceder al paciente: " + patientId);
        return delegate.findById(patientId);
    }
}

// O con Spring @PreAuthorize (proxy AOP automático)
@Service
public class PatientService {
    @PreAuthorize("hasRole('DOCTOR') and @acl.canAccess(#patientId)")
    public PatientRecord getRecord(String patientId) { ... }
}
```

### TypeScript — 🛒 Retail
```typescript
// Proxy de caché sobre ProductCatalogService
const catalogProxy = new Proxy(catalogService, {
  get(target, prop) {
    if (prop === 'getProduct') {
      return async (sku: string) => {
        const cached = await redis.get(`product:${sku}`);
        if (cached) return JSON.parse(cached);
        const product = await target.getProduct(sku);
        await redis.set(`product:${sku}`, JSON.stringify(product), 'EX', 300);
        return product;
      };
    }
    return (target as any)[prop];
  }
});
```

### Python — 🎮 Juegos
```python
# Proxy de lazy loading para assets de juego costosos
class LazyTextureProxy:
    def __init__(self, path: str):
        self._path = path
        self._texture = None  # no carga hasta que se necesite

    def draw(self, x: float, y: float):
        if self._texture is None:
            self._texture = TextureLoader.load(self._path)  # carga costosa
        self._texture.draw(x, y)

# El juego crea miles de LazyTextureProxy al arrancar — carga solo cuando aparecen en pantalla
```

### PostgreSQL — 🏦 Banca
```sql
-- Vista como proxy de acceso controlado (Row Level Security)
CREATE VIEW my_accounts AS
  SELECT * FROM account
  WHERE owner_rut = current_setting('app.current_user_rut')
    AND status != 'CLOSED';

-- RLS directamente en tabla
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
CREATE POLICY account_owner ON account
  USING (owner_rut = current_setting('app.current_user_rut'));
```

### Otros dominios
| Dominio | Tipo de proxy |
|---------|--------------|
| 📦 Logística | `RateLimitedCarrierProxy` — controla que no se supere el límite de llamadas/minuto al carrier |
| 🎵 Media | `GeofencedContentProxy` — verifica que el usuario esté en una región con licencia antes de entregar el contenido |
| 🏢 RRHH | `ApprovalRequiredProxy` sobre `SalaryService` — requiere aprobación del manager antes de ejecutar |

### En el contexto KLAP BYSF
En Spring Boot usar `@Cacheable` (caché automático) y `@PreAuthorize` (acceso controlado) — ambos son proxies AOP generados por Spring. Usar proxy manual solo cuando Spring no administra el objeto (clase legacy, función pura, lambda).

---

## Chain of Responsibility

**Categoría:** Comportamiento

### Cuándo aplicar
- Una request debe pasar por múltiples handlers en secuencia y cualquiera puede procesarla o cortarla
- Los handlers se pueden reordenar o agregar sin modificar los existentes
- El código tiene `if/else if` largos que verifican condiciones antes de procesar

### Cuándo NO aplicar
- Todos los handlers siempre procesan la request — usar pipeline/lista de funciones directamente
- La cadena es fija y tiene ≤3 pasos — llamadas directas son más claras

### Java / Spring Boot — 🏦 Banca
```java
// Cadena de detección de fraude
public abstract class FraudHandler {
    protected FraudHandler next;
    public FraudHandler setNext(FraudHandler next) { this.next = next; return next; }
    public abstract FraudResult check(Transaction tx);
    protected FraudResult passToNext(Transaction tx) {
        return next != null ? next.check(tx) : FraudResult.APPROVED;
    }
}

@Component public class VelocityCheckHandler extends FraudHandler {
    public FraudResult check(Transaction tx) {
        if (txCountLastHour(tx.accountId()) > 10) return FraudResult.blocked("Velocity exceeded");
        return passToNext(tx);
    }
}
@Component public class AmountCheckHandler extends FraudHandler {
    public FraudResult check(Transaction tx) {
        if (tx.amount().compareTo(new BigDecimal("5000000")) > 0) return FraudResult.review("High amount");
        return passToNext(tx);
    }
}
@Component public class GeolocationHandler extends FraudHandler {
    public FraudResult check(Transaction tx) {
        if (isUnusualCountry(tx)) return FraudResult.blocked("Unusual location");
        return passToNext(tx);
    }
}
```

### TypeScript — 🛒 Retail
```typescript
// Pipeline de validación de orden
type OrderHandler = (order: Order, next: () => ValidationResult) => ValidationResult;

function chain(...handlers: OrderHandler[]) {
  return (order: Order): ValidationResult => {
    let i = 0;
    const next = (): ValidationResult =>
      i < handlers.length ? handlers[i++](order, next) : { valid: true };
    return next();
  };
}

const validateOrder = chain(
  (order, next) => order.items.length === 0 ? { valid: false, reason: 'Carrito vacío' } : next(),
  (order, next) => !order.address ? { valid: false, reason: 'Dirección requerida' } : next(),
  (order, next) => order.total < 0 ? { valid: false, reason: 'Total inválido' } : next(),
);
```

### Python — 🏥 Salud
```python
from typing import Optional

class PrescriptionApprovalHandler:
    def __init__(self):
        self._next: Optional['PrescriptionApprovalHandler'] = None

    def set_next(self, handler: 'PrescriptionApprovalHandler') -> 'PrescriptionApprovalHandler':
        self._next = handler
        return handler

    def approve(self, rx: dict) -> str:
        if self._next:
            return self._next.approve(rx)
        return 'APPROVED'

class DrugInteractionCheck(PrescriptionApprovalHandler):
    def approve(self, rx):
        if has_interaction(rx['drug'], rx['patient_current_drugs']):
            return 'REJECTED:INTERACTION'
        return super().approve(rx)

class DosageCheck(PrescriptionApprovalHandler):
    def approve(self, rx):
        if rx['dose_mg'] > max_dose(rx['drug'], rx['patient_weight_kg']):
            return 'REJECTED:OVERDOSE'
        return super().approve(rx)
```

### Otros dominios
| Dominio | Cadena de handlers |
|---------|-------------------|
| 🎮 Juegos | Input handling: `UIHandler → HUDHandler → GameWorldHandler` — cada uno consume el evento si aplica |
| 📦 Logística | Reglas de routing: `WeightRule → DimensionRule → HazmatRule → DefaultCarrierRule` |
| 🏢 RRHH | Aprobación de vacaciones: `DirectManagerApproval → HRApproval → DirectorApproval` (según días solicitados) |

### En el contexto KLAP BYSF
Usar para validaciones en `XxxProcessorImpl` cuando hay 3+ reglas independientes que deben ejecutarse en orden. Para 2 reglas simples, `if` directo es más claro. Alternativa idiomática en Spring: lista de `@Component` validators inyectados y ejecutados en secuencia.

---

## Command

**Categoría:** Comportamiento

### Cuándo aplicar
- Se necesita registrar operaciones para auditoría o replay
- Operaciones que deben encolarse y ejecutarse en diferido
- Soporte de undo/redo
- Múltiples lugares del código disparan la misma operación con distintos parámetros

### Cuándo NO aplicar
- La operación es simple y directa sin necesidad de registro ni diferimiento
- No hay undo, ni cola, ni auditoría — llamada directa es más simple

### Java / Spring Boot — 🏦 Banca
```java
// Command para operaciones auditables sobre cuentas
public interface AccountCommand {
    TransactionResult execute();
    String describe();  // para audit log
}

public class DebitCommand implements AccountCommand {
    private final String accountId;
    private final BigDecimal amount;
    private final AccountRepository repo;

    public TransactionResult execute() { return repo.debit(accountId, amount); }
    public String describe() { return String.format("DEBIT account=%s amount=%s", accountId, amount); }
}

@Service
public class AccountCommandBus {
    private final AuditLog auditLog;
    public TransactionResult execute(AccountCommand cmd) {
        TransactionResult result = cmd.execute();
        auditLog.record(cmd.describe(), result.status(), LocalDateTime.now());
        return result;
    }
}
```

### TypeScript — 🎮 Juegos
```typescript
// Command pattern para sistema de undo/redo en editor de mapas
interface MapCommand { execute(): void; undo(): void; }

class PlaceTileCommand implements MapCommand {
  private previousTile: Tile | null = null;
  constructor(private map: GameMap, private x: number, private y: number, private tile: Tile) {}
  execute() { this.previousTile = this.map.get(this.x, this.y); this.map.set(this.x, this.y, this.tile); }
  undo()    { if (this.previousTile) this.map.set(this.x, this.y, this.previousTile); }
}

class CommandHistory {
  private stack: MapCommand[] = [];
  execute(cmd: MapCommand) { cmd.execute(); this.stack.push(cmd); }
  undo() { this.stack.pop()?.undo(); }
}
```

### Python — 🛒 Retail
```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime

class OrderCommand(ABC):
    @abstractmethod
    def execute(self) -> dict: ...
    @abstractmethod
    def describe(self) -> str: ...

@dataclass
class ApplyDiscountCommand(OrderCommand):
    order_id: str
    discount_rate: float
    repo: object

    def execute(self):
        return self.repo.apply_discount(self.order_id, self.discount_rate)

    def describe(self):
        return f'APPLY_DISCOUNT order={self.order_id} rate={self.discount_rate}'

class CommandBus:
    def __init__(self, audit_log):
        self._audit = audit_log

    def execute(self, cmd: OrderCommand) -> dict:
        result = cmd.execute()
        self._audit.record(cmd.describe(), datetime.utcnow())
        return result
```

### Otros dominios
| Dominio | Uso del Command |
|---------|----------------|
| 🏥 Salud | `PrescriptionCommand` encolado para dispensar en farmacia en diferido |
| 📦 Logística | `RescheduleDeliveryCommand` con undo que revierte el slot de agenda |
| 🎮 Juegos | `UseItemCommand` con undo que devuelve el ítem al inventario si la acción falla |

### En el contexto KLAP BYSF
Usar cuando el microservicio necesita **audit log** de operaciones ejecutadas. En sistemas simples, loggear en el `XxxProcessorImpl` con MDC es suficiente. Usar Command explícito cuando se necesita encolar operaciones (Kafka como command bus) o cuando el equipo de auditoría requiere replay de eventos.

---

## Iterator

**Categoría:** Comportamiento

### Cuándo aplicar
- Iterar sobre una colección sin exponer su representación interna
- Cursor-based pagination sobre resultados de BD para colecciones grandes
- Múltiples tipos de traversal sobre la misma colección

### Cuándo NO aplicar
- La colección es pequeña y en memoria — los iteradores nativos del lenguaje son suficientes
- No hay necesidad de encapsular la traversal

### Java / Spring Boot — 📦 Logística
```java
// Cursor-based iteration sobre millones de envíos para procesamiento batch
public record ShipmentPage(List<Shipment> items, Long nextCursor) {
    public boolean hasMore() { return nextCursor != null; }
}

// Repository
public ShipmentPage findPage(Long cursor, int size) {
    String sql = "SELECT * FROM shipment WHERE status = 'PENDING'" +
                 (cursor != null ? " AND id > :cursor" : "") +
                 " ORDER BY id LIMIT :size";
    var params = new MapSqlParameterSource().addValue("size", size);
    if (cursor != null) params.addValue("cursor", cursor);
    List<Shipment> items = jdbc.query(sql, params, shipmentRowMapper);
    Long next = items.size() == size ? items.getLast().id() : null;
    return new ShipmentPage(items, next);
}
```

### TypeScript — 🎵 Media
```typescript
// Generator para iterar playlist completa de forma lazy
async function* playlistTracks(playlistId: string, repo: TrackRepository) {
  let cursor: string | null = null;
  do {
    const page = await repo.getTrackPage(playlistId, cursor, 50);
    yield* page.tracks;
    cursor = page.nextCursor;
  } while (cursor !== null);
}

for await (const track of playlistTracks('PL-001', repo)) {
  await transcodeTrack(track);
}
```

### Python — 🏥 Salud
```python
from typing import Generator

def patient_records_cursor(repo, batch_size: int = 100) -> Generator:
    """Itera sobre todos los pacientes activos sin cargar todo en memoria."""
    cursor = None
    while True:
        page = repo.find_page(cursor, batch_size)
        yield from page['records']
        cursor = page.get('next_cursor')
        if not cursor:
            break

for patient in patient_records_cursor(repo):
    run_annual_checkup_reminder(patient)
```

### PostgreSQL — 📦 Logística
```sql
-- Cursor-based pagination (más eficiente que OFFSET en tablas grandes)
SELECT *
FROM shipment
WHERE status = 'PENDING'
  AND id > $1           -- cursor = último id retornado
ORDER BY id
LIMIT $2;              -- page_size

-- Para la primera página: WHERE id > 0 (o sin el filtro de cursor)
-- El cliente usa el último id de la página como cursor para la siguiente
```

### Otros dominios
| Dominio | Colección iterada con cursor |
|---------|------------------------------|
| 🏦 Banca | Extracto de cuenta: millones de transacciones paginadas por `transaction_date + id` |
| 🛒 Retail | Catálogo de productos para sincronización con ERP: paginado por `updated_at + sku` |
| 🎮 Juegos | Replay de partida: iteración sobre stream de eventos almacenados en orden cronológico |

### En el contexto KLAP BYSF
Preferir **cursor-based pagination** sobre `OFFSET/LIMIT` en tablas con muchos registros — `OFFSET` deteriora con el tiempo porque escanea filas descartadas. El cursor (generalmente `id` o `created_at + id`) debe ser indexado. Exponer `nextCursor` en la respuesta REST en lugar de número de página.

---

## Mediator

**Categoría:** Comportamiento

### Cuándo aplicar
- Múltiples componentes se comunican entre sí creando acoplamiento en malla
- Se quiere centralizar la coordinación para que los componentes no se conozcan mutuamente
- El código tiene dependencias circulares entre servicios

### Cuándo NO aplicar
- Solo hay 2 componentes que se comunican — dependencia directa es más simple
- El mediator acumula demasiada lógica y se convierte en un God object

### Java / Spring Boot — 🛒 Retail
```java
// Spring ApplicationEvent como mediator entre componentes
@Service
public class OrderProcessorImpl implements OrderProcessor {
    private final ApplicationEventPublisher publisher;

    public OrderConfirmation placeOrder(CartId cartId) {
        Order order = buildAndSaveOrder(cartId);
        publisher.publishEvent(new OrderPlacedEvent(order)); // desacoplado
        return toConfirmation(order);
    }
}

// Listeners independientes — no se conocen entre sí
@Component public class InventoryListener {
    @EventListener public void on(OrderPlacedEvent e) { inventory.reserve(e.order().items()); }
}
@Component public class ShipmentListener {
    @EventListener public void on(OrderPlacedEvent e) { shipment.schedule(e.order()); }
}
@Component public class EmailListener {
    @EventListener public void on(OrderPlacedEvent e) { email.sendConfirmation(e.order()); }
}
```

### TypeScript — 🎮 Juegos
```typescript
// Event bus como mediator entre sistemas de juego
class GameEventBus {
  private handlers = new Map<string, Set<Function>>();

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }
  emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach(h => h(data));
  }
}

const bus = new GameEventBus();
bus.on('PLAYER_DIED', (e) => soundSystem.play('death'));
bus.on('PLAYER_DIED', (e) => uiSystem.showDeathScreen(e.player));
bus.on('PLAYER_DIED', (e) => achievementSystem.check('FIRST_DEATH', e.player));
```

### Python — 🏥 Salud
```python
from collections import defaultdict

class DomainEventBus:
    _handlers = defaultdict(list)

    @classmethod
    def subscribe(cls, event_type: type, handler):
        cls._handlers[event_type].append(handler)

    @classmethod
    def publish(cls, event):
        for handler in cls._handlers[type(event)]:
            handler(event)

# Registro en startup
DomainEventBus.subscribe(AppointmentBookedEvent, notify_patient)
DomainEventBus.subscribe(AppointmentBookedEvent, block_doctor_calendar)
DomainEventBus.subscribe(AppointmentBookedEvent, create_billing_record)
```

### Otros dominios
| Dominio | Mediator utilizado |
|---------|-------------------|
| 🏦 Banca | `TransactionSettledEvent` → notifica a fraud system + notify client + update ledger |
| 📦 Logística | `ShipmentDeliveredEvent` → cierra tracking + genera factura + libera depósito |
| 🎵 Media | `TrackUploadedEvent` → dispara encoding + thumbnail generation + catalog indexing |

### En el contexto KLAP BYSF
El mediator natural en Spring Boot es `ApplicationEventPublisher`. El `XxxProcessorImpl` emite eventos de dominio y los listeners reaccionan sin que el Processor los conozca. En Kafka, el broker actúa como mediator distribuido entre microservicios.

---

## Memento

**Categoría:** Comportamiento

### Cuándo aplicar
- Se necesita guardar y restaurar el estado anterior (undo)
- Auditoría que requiere snapshot del estado antes del cambio
- El estado interno no puede ser reconstruido desde afuera

### Cuándo NO aplicar
- El estado es público y reconstruible — loggear el cambio es suficiente
- La historia de estados es ilimitada — consumo de memoria sin control

### Java / Spring Boot — 🏦 Banca
```java
// Snapshot de estado de cuenta antes de cada operación
public record AccountSnapshot(String accountId, BigDecimal balance,
                               String operationType, String operatorId,
                               LocalDateTime timestamp) {}

@Service
public class AccountProcessorImpl implements AccountProcessor {
    public TransactionResult debit(String accountId, BigDecimal amount) {
        Account account = repository.findById(accountId);
        snapshotRepo.save(new AccountSnapshot(
            accountId, account.balance(), "DEBIT", securityCtx.getUser(), LocalDateTime.now()
        ));
        return repository.debit(accountId, amount);
    }
}
```

### TypeScript — 🎮 Juegos
```typescript
// Save/Load del estado del juego
interface GameSave { level: number; playerHp: number; inventory: Item[]; position: Position; timestamp: Date; }

class SaveSlot {
  private saves: GameSave[] = [];

  save(state: GameState): void {
    this.saves.push({ ...state, timestamp: new Date() });
    if (this.saves.length > 3) this.saves.shift(); // máximo 3 save slots
  }

  load(slotIndex: number): GameSave | null {
    return this.saves[slotIndex] ?? null;
  }
}
```

### Python — 🛒 Retail
```python
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass(frozen=True)
class CartSnapshot:
    cart_id: str
    items: tuple      # inmutable
    total: float
    coupon: str | None
    saved_at: datetime

class Cart:
    def __init__(self, cart_id: str):
        self.id = cart_id
        self._items = []
        self._history: list[CartSnapshot] = []

    def save_snapshot(self):
        self._history.append(CartSnapshot(
            cart_id=self.id, items=tuple(self._items),
            total=self._calculate_total(), coupon=self._coupon,
            saved_at=datetime.utcnow()
        ))

    def restore_last(self):
        if self._history:
            snap = self._history.pop()
            self._items = list(snap.items)
```

### PostgreSQL — 🏦 Banca
```sql
-- Tabla de auditoría como memento store
CREATE TABLE account_audit (
    id              BIGSERIAL PRIMARY KEY,
    account_id      VARCHAR(20) NOT NULL,
    balance_before  NUMERIC(15,2) NOT NULL,
    balance_after   NUMERIC(15,2) NOT NULL,
    operation       VARCHAR(20) NOT NULL,
    operator_id     VARCHAR(100) NOT NULL,
    timestamp       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_account_balance() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO account_audit(account_id, balance_before, balance_after, operation, operator_id)
    VALUES (OLD.id, OLD.balance, NEW.balance, TG_ARGV[0], current_setting('app.current_user'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_account_audit
AFTER UPDATE OF balance ON account
FOR EACH ROW EXECUTE FUNCTION audit_account_balance('BALANCE_CHANGE');
```

### Otros dominios
| Dominio | Estado snapshotteado |
|---------|---------------------|
| 🏥 Salud | `PatientChartSnapshot` — estado del historial clínico antes de cada actualización |
| 📦 Logística | `ShipmentStatusSnapshot` — estado del envío antes de cada cambio de estado |
| 🎵 Media | `PlaylistSnapshot` — estado de la playlist antes de edición para permitir undo |

### En el contexto KLAP BYSF
Implementar como tabla `*_audit` en BD + trigger (auditoría automática) o como inserción explícita en el `XxxProcessorImpl` (auditoría con contexto de negocio: usuario, operación, motivo). El trigger captura todo pero no tiene contexto de negocio; la inserción explícita es más rica pero requiere disciplina de implementación.

---

## Observer

**Categoría:** Comportamiento

### Cuándo aplicar
- Un cambio en un objeto debe notificar a múltiples otros sin acoplarlos directamente
- El número de reactores varía en runtime o es desconocido en tiempo de diseño
- Eventos de dominio: orden creada, pago procesado, estado cambiado

### Cuándo NO aplicar
- Solo hay un observer fijo que nunca cambiará — llamada directa es más clara
- La reacción es siempre la misma — considerar si es lógica del mismo dominio

### Java / Spring Boot — 🏥 Salud
```java
public record AppointmentBookedEvent(Appointment appointment) {}

@Service
public class AppointmentProcessorImpl implements AppointmentProcessor {
    private final ApplicationEventPublisher publisher;
    public Appointment book(BookingRequest req) {
        Appointment appt = repository.save(buildAppointment(req));
        publisher.publishEvent(new AppointmentBookedEvent(appt));
        return appt;
    }
}

@Component public class PatientReminderObserver {
    @EventListener
    public void on(AppointmentBookedEvent e) { smsService.send(e.appointment().patientPhone(), buildReminder(e.appointment())); }
}
@Component public class DoctorCalendarObserver {
    @EventListener
    public void on(AppointmentBookedEvent e) { calendar.block(e.appointment().doctorId(), e.appointment().slot()); }
}
@Component public class BillingObserver {
    @EventListener
    public void on(AppointmentBookedEvent e) { billing.createCharge(e.appointment().id(), e.appointment().fee()); }
}
```

### TypeScript — 🎮 Juegos
```typescript
type Handler<T> = (event: T) => void;

class GameEventEmitter<T extends Record<string, unknown>> {
  private handlers: Partial<{ [K in keyof T]: Handler<T[K]>[] }> = {};

  on<K extends keyof T>(event: K, handler: Handler<T[K]>) {
    (this.handlers[event] ??= []).push(handler);
  }
  emit<K extends keyof T>(event: K, data: T[K]) {
    this.handlers[event]?.forEach(h => h(data));
  }
}

type GameEvents = { ENEMY_KILLED: { enemy: Enemy; killer: Player }; LEVEL_UP: { player: Player; newLevel: number }; };
const events = new GameEventEmitter<GameEvents>();

events.on('ENEMY_KILLED', e => score.add(e.enemy.points));
events.on('ENEMY_KILLED', e => sound.play('kill'));
events.on('ENEMY_KILLED', e => achievement.check('FIRST_KILL', e.killer));
```

### Python — 📦 Logística
```python
from collections import defaultdict

class ShipmentEventBus:
    _handlers = defaultdict(list)

    @classmethod
    def on(cls, event: str, handler):
        cls._handlers[event].append(handler)

    @classmethod
    def emit(cls, event: str, data: dict):
        for h in cls._handlers[event]:
            h(data)

ShipmentEventBus.on('DELIVERED', lambda e: invoice_service.generate(e['shipment_id']))
ShipmentEventBus.on('DELIVERED', lambda e: warehouse.release_slot(e['origin']))
ShipmentEventBus.on('DELIVERED', lambda e: notify_customer(e['customer_id']))
```

### PostgreSQL — 🛒 Retail
```sql
-- LISTEN/NOTIFY: observer pattern en BD
-- Trigger que emite notificación cuando stock cae bajo mínimo
CREATE OR REPLACE FUNCTION notify_low_stock() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock < NEW.min_stock THEN
        PERFORM pg_notify('low_stock_alert', json_build_object(
            'sku', NEW.sku, 'stock', NEW.stock, 'min_stock', NEW.min_stock
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_low_stock
AFTER UPDATE OF stock ON product
FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- El servicio escucha: LISTEN low_stock_alert;
```

### Otros dominios
| Dominio | Evento y observers |
|---------|-------------------|
| 🏦 Banca | `TransactionApprovedEvent` → notifica a cliente + actualiza ledger + dispara fraud review |
| 🎮 Juegos | `PlayerLevelUpEvent` → actualiza UI + desbloquea habilidades + guarda estadísticas |
| 🎵 Media | `TrackPublishedEvent` → notifica suscriptores + actualiza índice de búsqueda + genera thumbnail |

### En el contexto KLAP BYSF
Usar `ApplicationEventPublisher` para eventos **intra-servicio**. Para eventos **inter-servicio** usar Kafka. Los eventos de dominio deben ser records inmutables con datos mínimos necesarios — no pasar el objeto completo del dominio para evitar dependencias de estado mutable.

---

## State

**Categoría:** Comportamiento

### Cuándo aplicar
- El comportamiento de un objeto cambia drásticamente según su estado interno
- El código tiene múltiples `if/switch` que verifican el mismo campo de estado
- Las transiciones entre estados tienen reglas de negocio propias que deben validarse

### Cuándo NO aplicar
- El objeto tiene solo 2 estados simples — boolean + if es suficiente
- Los estados comparten exactamente el mismo comportamiento — enum simple alcanza

### Java / Spring Boot — 🛒 Retail
```java
// Estados de una orden con transiciones y comportamiento propios
public interface OrderState {
    void pay(Order order, OrderRepository repo);
    void ship(Order order, OrderRepository repo);
    void cancel(Order order, OrderRepository repo);
}

public class PendingState implements OrderState {
    public void pay(Order o, OrderRepository r)    { r.updateState(o.id(), "PAID"); }
    public void ship(Order o, OrderRepository r)   { throw new OrderStateException("Paga primero"); }
    public void cancel(Order o, OrderRepository r) { r.updateState(o.id(), "CANCELLED"); }
}
public class PaidState implements OrderState {
    public void pay(Order o, OrderRepository r)    { throw new OrderStateException("Ya pagada"); }
    public void ship(Order o, OrderRepository r)   { r.updateState(o.id(), "SHIPPED"); }
    public void cancel(Order o, OrderRepository r) { r.updateState(o.id(), "CANCELLED"); refund(o); }
}
public class ShippedState implements OrderState {
    public void pay(Order o, OrderRepository r)    { throw new OrderStateException("Ya pagada"); }
    public void ship(Order o, OrderRepository r)   { throw new OrderStateException("Ya enviada"); }
    public void cancel(Order o, OrderRepository r) { throw new OrderStateException("No se puede cancelar"); }
}
```

### TypeScript — 🎮 Juegos
```typescript
// Máquina de estados del personaje
type PlayerState = 'IDLE' | 'RUNNING' | 'ATTACKING' | 'DEAD';

const transitions: Record<PlayerState, Partial<Record<string, PlayerState>>> = {
  IDLE:      { startRun: 'RUNNING', attack: 'ATTACKING', die: 'DEAD' },
  RUNNING:   { stop: 'IDLE',        attack: 'ATTACKING', die: 'DEAD' },
  ATTACKING: { finish: 'IDLE',      die: 'DEAD' },
  DEAD:      {},  // estado terminal — ninguna transición válida
};

function transition(current: PlayerState, action: string): PlayerState {
  const next = transitions[current][action];
  if (!next) throw new Error(`Transición inválida: ${current} --${action}--> ?`);
  return next;
}
```

### Python — 🏥 Salud
```python
from enum import Enum

class AppointmentStatus(Enum):
    SCHEDULED = 'SCHEDULED'
    CONFIRMED = 'CONFIRMED'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'
    CANCELLED = 'CANCELLED'

TRANSITIONS = {
    AppointmentStatus.SCHEDULED:   {'confirm': AppointmentStatus.CONFIRMED,   'cancel': AppointmentStatus.CANCELLED},
    AppointmentStatus.CONFIRMED:   {'start':   AppointmentStatus.IN_PROGRESS, 'cancel': AppointmentStatus.CANCELLED},
    AppointmentStatus.IN_PROGRESS: {'complete':AppointmentStatus.COMPLETED},
    AppointmentStatus.COMPLETED:   {},
    AppointmentStatus.CANCELLED:   {},
}

def transition(status: AppointmentStatus, action: str) -> AppointmentStatus:
    next_status = TRANSITIONS[status].get(action)
    if not next_status:
        raise ValueError(f'Transición inválida: {status.value} --{action}-->')
    return next_status
```

### PostgreSQL — 🏦 Banca
```sql
-- Constraint que define los valores válidos de estado
ALTER TABLE loan
    ADD CONSTRAINT chk_loan_status
    CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'CLOSED', 'REJECTED'));

-- Trigger que valida que la transición sea permitida
CREATE OR REPLACE FUNCTION validate_loan_transition() RETURNS TRIGGER AS $$
DECLARE
    valid_next TEXT[] := CASE OLD.status
        WHEN 'PENDING'      THEN ARRAY['UNDER_REVIEW', 'REJECTED']
        WHEN 'UNDER_REVIEW' THEN ARRAY['APPROVED', 'REJECTED']
        WHEN 'APPROVED'     THEN ARRAY['DISBURSED', 'REJECTED']
        WHEN 'DISBURSED'    THEN ARRAY['CLOSED']
        ELSE ARRAY[]::TEXT[]
    END;
BEGIN
    IF NOT (NEW.status = ANY(valid_next)) THEN
        RAISE EXCEPTION 'Transición inválida: % -> %', OLD.status, NEW.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Otros dominios
| Dominio | Estados y transiciones |
|---------|----------------------|
| 📦 Logística | Envío: `CREATED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED` (o `RETURNED`) |
| 🎵 Media | Track: `UPLOADED → PROCESSING → READY → PUBLISHED` (o `REJECTED`) |
| 🏢 RRHH | Solicitud de vacaciones: `DRAFT → SUBMITTED → APPROVED → TAKEN` (o `REJECTED`) |

### En el contexto KLAP BYSF
Para objetos con 2-3 estados y transiciones simples, un **mapa de transiciones** es más legible que clases de estado. Usar clases de estado cuando cada estado tiene comportamiento propio complejo. Validar transiciones en **dos capas**: dominio (Processor) y BD (trigger/constraint) para garantizar integridad incluso ante accesos directos.

---

## Strategy

**Categoría:** Comportamiento

### Cuándo aplicar
- El código tiene `if/switch` que seleccionan un algoritmo según un tipo o parámetro
- El algoritmo debe poder intercambiarse en runtime
- Múltiples variantes de procesamiento que deben testarse por separado

### Cuándo NO aplicar
- Solo hay un algoritmo que nunca variará — abstracción prematura
- Las variantes son triviales (2 líneas) — condicional inline es más claro

### Java / Spring Boot — 🛒 Retail
```java
// Estrategia de pricing según tipo de cliente
public interface PricingStrategy {
    BigDecimal calculate(BigDecimal basePrice, Customer customer);
}

@Component("STANDARD") public class StandardPricing implements PricingStrategy {
    public BigDecimal calculate(BigDecimal p, Customer c) { return p; }
}
@Component("PREMIUM") public class PremiumPricing implements PricingStrategy {
    public BigDecimal calculate(BigDecimal p, Customer c) { return p.multiply(new BigDecimal("0.85")); }
}
@Component("EMPLOYEE") public class EmployeePricing implements PricingStrategy {
    public BigDecimal calculate(BigDecimal p, Customer c) { return p.multiply(new BigDecimal("0.50")); }
}

@Service
public class PriceCalculatorImpl {
    private final Map<String, PricingStrategy> strategies;
    public BigDecimal getPrice(Product product, Customer customer) {
        return Optional.ofNullable(strategies.get(customer.segment()))
            .orElseThrow(() -> new UnsupportedSegmentException(customer.segment()))
            .calculate(product.basePrice(), customer);
    }
}
```

### TypeScript — 🎮 Juegos
```typescript
// Estrategia de movimiento según tipo de personaje
type MoveStrategy = (pos: Position, target: Position, dt: number) => Position;

const strategies: Record<string, MoveStrategy> = {
  WALK:   (pos, tgt, dt) => moveTowards(pos, tgt, 100 * dt),
  FLY:    (pos, tgt, dt) => moveTowards(pos, tgt, 200 * dt, true /* ignora colisiones */),
  SWIM:   (pos, tgt, dt) => moveTowards(pos, tgt, 60 * dt),
  CHARGE: (pos, tgt, dt) => moveTowards(pos, tgt, 400 * dt),
};

class Enemy {
  constructor(private moveType: string) {}
  move(pos: Position, target: Position, dt: number) {
    return strategies[this.moveType](pos, target, dt);
  }
}
```

### Python — 🏥 Salud
```python
from typing import Callable

DiagnosisStrategy = Callable[[dict], list[str]]

def symptom_based(patient_data: dict) -> list[str]:
    return match_symptoms_to_diagnoses(patient_data['symptoms'])

def lab_based(patient_data: dict) -> list[str]:
    return analyze_lab_results(patient_data['lab_results'])

def imaging_based(patient_data: dict) -> list[str]:
    return analyze_imaging(patient_data['imaging'])

strategies: dict[str, DiagnosisStrategy] = {
    'EMERGENCY': symptom_based,
    'ROUTINE':   lab_based,
    'ONCOLOGY':  imaging_based,
}

def suggest_diagnoses(visit_type: str, patient_data: dict) -> list[str]:
    strategy = strategies.get(visit_type)
    if not strategy:
        raise ValueError(f'Tipo de visita no soportado: {visit_type}')
    return strategy(patient_data)
```

### PostgreSQL — 📦 Logística
```sql
-- Tabla de estrategias de tarifas por carrier (configurable sin deployar)
CREATE TABLE carrier_rate (
    carrier      VARCHAR(20) NOT NULL,
    zone         VARCHAR(10) NOT NULL,
    base_rate    NUMERIC(10,2) NOT NULL,
    per_kg_rate  NUMERIC(8,4) NOT NULL,
    PRIMARY KEY (carrier, zone)
);

-- Query que aplica la estrategia desde la tabla
SELECT s.weight * cr.per_kg_rate + cr.base_rate AS shipping_cost
FROM shipment s
JOIN carrier_rate cr ON cr.carrier = s.carrier AND cr.zone = s.destination_zone
WHERE s.id = $1;
```

### Otros dominios
| Dominio | Estrategias que varían |
|---------|----------------------|
| 🏦 Banca | `InterestCalculationStrategy`: simple, compuesto, ajustado por inflación |
| 📦 Logística | `RouteOptimizationStrategy`: más rápido, más barato, menor huella de carbono |
| 🎵 Media | `RecommendationStrategy`: por historial, por popularidad, por similitud de artista |

### En el contexto KLAP BYSF
Registrar strategies como `@Component` en Spring y resolver con `Map<String, XxxStrategy>` inyectado — evita `if/switch`. La clave del Map debe ser el discriminador del tipo. Cada strategy se testea en aislamiento con su propio test unitario.

---

## Template Method

**Categoría:** Comportamiento

### Cuándo aplicar
- Varios algoritmos comparten la misma estructura (esqueleto) pero difieren en pasos específicos
- Se quiere reutilizar el flujo de orquestación y variar solo pasos concretos
- El mismo pipeline (validar → procesar → notificar) aplica a múltiples tipos con variantes en cada paso

### Cuándo NO aplicar
- Los pasos varían tanto que no hay esqueleto común real — usar Strategy + composición
- El lenguaje favorece composición funcional (TS/JS/Python) — funciones de orden superior son más simples

### Java / Spring Boot — 🏦 Banca
```java
// Flujo común de solicitud de crédito con pasos especializables
public abstract class LoanApplicationProcessor {

    // Template method — esqueleto fijo
    public final LoanDecision process(LoanApplication app) {
        validateApplication(app);          // paso fijo
        CreditScore score = scoreCredit(app); // abstracto — varía por tipo de crédito
        RiskLevel risk = assessRisk(app, score); // abstracto
        LoanDecision decision = decide(app, score, risk); // abstracto
        notifyApplicant(app, decision);    // hook con default — puede sobreescribirse
        return decision;
    }

    protected abstract CreditScore scoreCredit(LoanApplication app);
    protected abstract RiskLevel assessRisk(LoanApplication app, CreditScore score);
    protected abstract LoanDecision decide(LoanApplication app, CreditScore score, RiskLevel risk);

    protected void notifyApplicant(LoanApplication app, LoanDecision d) {
        emailService.send(app.email(), buildDecisionEmail(d)); // default: solo email
    }
    private void validateApplication(LoanApplication app) { /* validación común */ }
}

public class MortgageLoanProcessor extends LoanApplicationProcessor {
    protected CreditScore scoreCredit(LoanApplication app) { /* score hipotecario */ }
    protected RiskLevel assessRisk(LoanApplication app, CreditScore score) { /* evalúa LTV */ }
    protected LoanDecision decide(LoanApplication app, CreditScore score, RiskLevel risk) { /* decisión hipoteca */ }
}
```

### TypeScript — 🛒 Retail
```typescript
// Pipeline de checkout con pasos intercambiables
function createCheckoutPipeline(opts: {
  validateInventory: (cart: Cart) => void;
  applyDiscounts: (cart: Cart) => Cart;
  processPayment: (cart: Cart, payment: PaymentInfo) => PaymentResult;
}) {
  return async (cart: Cart, payment: PaymentInfo): Promise<OrderConfirmation> => {
    opts.validateInventory(cart);                         // paso 1: fijo implícito
    const discountedCart = opts.applyDiscounts(cart);    // paso 2: variable
    const result = opts.processPayment(discountedCart, payment); // paso 3: variable
    return buildConfirmation(discountedCart, result);    // paso 4: fijo
  };
}

const guestCheckout  = createCheckoutPipeline({ validateInventory: checkStock, applyDiscounts: noDiscount, processPayment: chargeCard });
const memberCheckout = createCheckoutPipeline({ validateInventory: checkStock, applyDiscounts: applyLoyalty, processPayment: chargeCard });
```

### Python — 🏥 Salud
```python
from abc import ABC, abstractmethod

class ClinicalProtocol(ABC):
    def execute(self, patient: dict) -> dict:   # template method
        self._triage(patient)                   # paso fijo
        diagnosis = self._diagnose(patient)     # abstracto
        treatment = self._treat(patient, diagnosis)  # abstracto
        self._document(patient, diagnosis, treatment) # fijo
        return treatment

    @abstractmethod
    def _diagnose(self, patient: dict) -> dict: ...

    @abstractmethod
    def _treat(self, patient: dict, diagnosis: dict) -> dict: ...

    def _triage(self, patient):     # paso fijo común
        if patient.get('is_emergency'): prioritize(patient)

    def _document(self, p, d, t):  # paso fijo común
        medical_record.save({'patient': p, 'diagnosis': d, 'treatment': t})

class EmergencyProtocol(ClinicalProtocol):
    def _diagnose(self, patient): return fast_assessment(patient)
    def _treat(self, patient, diagnosis): return immediate_intervention(patient, diagnosis)
```

### Otros dominios
| Dominio | Esqueleto compartido |
|---------|---------------------|
| 🎮 Juegos | `GameMatch.run()`: setup → main loop → teardown. Setup y teardown fijos; main loop varía por modo (PvP, PvE, coop) |
| 📦 Logística | `ShipmentProcess.dispatch()`: validate → label → notify carrier → track. La notificación varía por carrier |
| 🎵 Media | `ContentPublisher.publish()`: validate → encode → upload → index. El encoding varía por formato destino |

### En el contexto KLAP BYSF
El `XxxProcessorImpl` **es** el Template Method del dominio en KLAP BYSF: define el flujo fijo (validar → verificar → persistir → notificar) y delega los pasos variables a métodos protegidos o colaboradores (Strategy). Preferir composición sobre herencia profunda — más de 2 niveles de herencia es señal de rediseño.

---

## Visitor

**Categoría:** Comportamiento

### Cuándo aplicar
- Se necesita ejecutar operaciones distintas sobre una jerarquía de clases sin modificarlas
- Agregar nuevas operaciones es frecuente pero agregar nuevos tipos es raro
- Serialización, exportación o cálculo diferente por cada tipo de la jerarquía

### Cuándo NO aplicar
- La jerarquía de tipos cambia frecuentemente — cada nuevo tipo requiere actualizar todos los visitors
- Solo hay una operación — método en la clase misma es más simple

### Java / Spring Boot — 🛒 Retail
```java
// Cálculo de impuesto diferente por tipo de producto
public interface TaxVisitor {
    BigDecimal visit(FoodProduct product);
    BigDecimal visit(ElectronicsProduct product);
    BigDecimal visit(ClothingProduct product);
}

public interface Product { BigDecimal accept(TaxVisitor visitor); }

public record FoodProduct(String name, BigDecimal price) implements Product {
    public BigDecimal accept(TaxVisitor v) { return v.visit(this); }
}
public record ElectronicsProduct(String name, BigDecimal price) implements Product {
    public BigDecimal accept(TaxVisitor v) { return v.visit(this); }
}

public class ChileTaxVisitor implements TaxVisitor {
    public BigDecimal visit(FoodProduct p)       { return BigDecimal.ZERO; } // alimentos exentos
    public BigDecimal visit(ElectronicsProduct p){ return p.price().multiply(new BigDecimal("0.19")); }
    public BigDecimal visit(ClothingProduct p)   { return p.price().multiply(new BigDecimal("0.19")); }
}
```

### TypeScript — 🏦 Banca
```typescript
// Risk assessment diferente por tipo de producto financiero
type FinancialProduct =
  | { type: 'MORTGAGE';    ltv: number; propertyValue: number }
  | { type: 'PERSONAL_LOAN'; income: number; debtRatio: number }
  | { type: 'CREDIT_CARD'; creditScore: number; requestedLimit: number };

function assessRisk(product: FinancialProduct): 'LOW' | 'MEDIUM' | 'HIGH' {
  switch (product.type) {
    case 'MORTGAGE':     return product.ltv > 0.8 ? 'HIGH' : 'LOW';
    case 'PERSONAL_LOAN':return product.debtRatio > 0.4 ? 'HIGH' : 'MEDIUM';
    case 'CREDIT_CARD':  return product.creditScore < 600 ? 'HIGH' : 'LOW';
  }
}
// TypeScript verifica exhaustividad en compile time — nuevo tipo = error de compilación
```

### Python — 🎮 Juegos
```typescript
// Serialización diferente por tipo de entidad del juego para guardar partida
```
```python
from functools import singledispatch
import json

@singledispatch
def serialize_entity(entity) -> dict:
    raise NotImplementedError(f'Tipo no soportado: {type(entity).__name__}')

@serialize_entity.register
def _(e: Player) -> dict:
    return {'type': 'PLAYER', 'id': e.id, 'hp': e.hp, 'level': e.level, 'inventory': [i.id for i in e.inventory]}

@serialize_entity.register
def _(e: Enemy) -> dict:
    return {'type': 'ENEMY', 'id': e.id, 'hp': e.hp, 'position': {'x': e.x, 'y': e.y}}

@serialize_entity.register
def _(e: Chest) -> dict:
    return {'type': 'CHEST', 'id': e.id, 'opened': e.opened, 'items': [i.id for i in e.items]}

# Serializar toda la escena
save_data = [serialize_entity(entity) for entity in game_scene.entities]
```

### Otros dominios
| Dominio | Visitor para operación variable |
|---------|--------------------------------|
| 📦 Logística | `LabelPrinterVisitor` — formato de etiqueta distinto por tipo de envío (nacional, internacional, peligroso) |
| 🏥 Salud | `InsuranceBillingVisitor` — código de facturación diferente por tipo de procedimiento (consulta, cirugía, laboratorio) |
| 🎵 Media | `MetadataExporterVisitor` — esquema de metadatos diferente por tipo de contenido (podcast, track, video) |

### En el contexto KLAP BYSF
En TypeScript, los **discriminated unions** con `switch` exhaustivo son el equivalente idiomático y más seguro — el compilador fuerza que todos los tipos estén cubiertos. En Java 21, usar **Pattern Matching** en switch expressions (`switch (product) { case FoodProduct f -> ...; }`). En Python, `functools.singledispatch` es la alternativa idiomática.
