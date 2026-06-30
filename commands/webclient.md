# Skill: RestClient (Cliente HTTP Externo)

## Cuándo usar este skill

Cuando necesites llamar a una API externa (REST) desde un servicio KLAP BYSF.
El stack usa `spring-boot-starter-web` (Tomcat, MVC bloqueante). El cliente HTTP es `RestClient` — **no WebFlux, no WebClient**.

No aplica para comunicación interna entre microservicios vía Kafka.

---

## Reglas del equipo

**DO:**
- Usar `RestClient` — está incluido en `spring-boot-starter-web`, no requiere dependencia extra
- Definir timeouts con `SimpleClientHttpRequestFactory` — `setConnectTimeout(Duration)` + `setReadTimeout(Duration)`
- Configurar el bean en una clase `XxxClientConfig` con `@Bean("restClientXxx")` y `@Qualifier`
- Usar constructor manual en `XxxClient` con `@Qualifier` en el parámetro (Lombok `@RequiredArgsConstructor` no soporta `@Qualifier`)
- Mapear `4xx` → `XxxClientNonRetryableException` y `5xx` → `XxxClientException` con `statusCode` + `responseBody`
- Loguear el error con `statusCode` y `body` antes de lanzar la excepción
- Aplicar reintentos con `@Retry(name = "xxx")` de Resilience4j en el método del cliente
- Externalizar `base-url`, `connect-timeout-ms` y `response-timeout-ms` en `application.yml`

**DON'T:**
- No agregar `spring-boot-starter-webflux` solo para hacer llamadas HTTP — `RestClient` ya está disponible
- No hardcodear la base URL en `XxxClient` — siempre en `XxxClientConfig` via `@Value`
- No reintentar errores `4xx` — son deterministas (datos inválidos), no cambian con reintentos
- No usar `@RequiredArgsConstructor` con `@Qualifier` — generará un constructor sin el qualifier; usar constructor manual
- No ignorar el body del error — incluirlo siempre en la excepción para debug en producción

---

## Dependencia Gradle

```groovy
// RestClient viene incluido en spring-boot-starter-web — no agregar dependencia extra
implementation 'org.springframework.boot:spring-boot-starter-web'

// Resilience4j para reintentos (@Retry)
implementation 'io.github.resilience4j:resilience4j-spring-boot3:2.2.0'
implementation 'org.springframework.boot:spring-boot-starter-aop'
```

---

## Skeleton de código

### `application.yml`

```yaml
app:
  xxx-api:
    base-url: https://api.externa.cl
    connect-timeout-ms: 3000
    response-timeout-ms: 10000
```

---

### `XxxClientConfig.java`

```java
package cl.klap.bysf.svbo.liquidacion.dominio.liquidacion.client.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Configuración del RestClient para consumir la API externa XxxApi.
 * Define timeouts explícitos de conexión y lectura mediante SimpleClientHttpRequestFactory.
 */
@Slf4j
@Configuration
public class XxxClientConfig {

    @Value("${app.xxx-api.base-url}")
    private String baseUrl;

    @Value("${app.xxx-api.connect-timeout-ms:3000}")
    private int connectTimeoutMs;

    @Value("${app.xxx-api.response-timeout-ms:10000}")
    private int responseTimeoutMs;

    /**
     * Crea el RestClient configurado con timeouts para la API externa XxxApi.
     *
     * @return RestClient listo para inyectar en {@link XxxClient}
     */
    @Bean("restClientXxx")
    public RestClient restClientXxx() {
        log.info("Configurando RestClient XxxApi - baseUrl: {}, connectTimeout: {}ms, responseTimeout: {}ms",
                baseUrl, connectTimeoutMs, responseTimeoutMs);

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(responseTimeoutMs));

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }
}
```

---

### `XxxClient.java`

```java
package cl.klap.bysf.svbo.liquidacion.dominio.liquidacion.client;

import cl.klap.bysf.svbo.liquidacion.dominio.liquidacion.client.dto.XxxRequestDto;
import cl.klap.bysf.svbo.liquidacion.dominio.liquidacion.client.dto.XxxResponseDto;
import cl.klap.bysf.svbo.liquidacion.dominio.liquidacion.exception.XxxClientException;
import cl.klap.bysf.svbo.liquidacion.dominio.liquidacion.exception.XxxClientNonRetryableException;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Cliente HTTP para la API externa XxxApi.
 * Encapsula manejo de errores HTTP y mapeo a excepciones del dominio.
 * Reintentos automáticos para 5xx via Resilience4j (@Retry).
 */
@Slf4j
@Component
public class XxxClient {

    private static final String URI_OPERACION = "/v1/operaciones";

    private final RestClient restClient;

    public XxxClient(@Qualifier("restClientXxx") RestClient restClient) {
        this.restClient = restClient;
    }

    /**
     * Envía una solicitud a la API externa y retorna su respuesta.
     * Reintenta automáticamente en errores 5xx (instancia Resilience4j "xxx").
     * No reintenta errores 4xx — son deterministas.
     *
     * @param request datos del request a enviar
     * @return respuesta de la API mapeada a {@link XxxResponseDto}
     * @throws XxxClientNonRetryableException si la API responde con 4xx
     * @throws XxxClientException             si la API responde con 5xx tras agotar reintentos
     */
    @Retry(name = "xxx")
    public XxxResponseDto enviarSolicitud(XxxRequestDto request) {
        log.info("Llamando a XxxApi - id: {}", request.getId());

        return restClient.post()
                .uri(URI_OPERACION)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(), (req, resp) -> {
                    String body = readBody(resp);
                    log.error("XxxApi 4xx - status: {}, body: {}", resp.getStatusCode().value(), body);
                    throw new XxxClientNonRetryableException(
                            "Error de datos en XxxApi", resp.getStatusCode().value(), body);
                })
                .onStatus(status -> status.is5xxServerError(), (req, resp) -> {
                    String body = readBody(resp);
                    log.error("XxxApi 5xx - status: {}, body: {}", resp.getStatusCode().value(), body);
                    throw new XxxClientException(
                            "Error de servidor en XxxApi", resp.getStatusCode().value(), body);
                })
                .body(XxxResponseDto.class);
    }

    /**
     * Lee el cuerpo de la respuesta HTTP como String.
     *
     * @param resp respuesta HTTP del cliente
     * @return cuerpo como texto, o string vacío si hay error de lectura
     */
    private String readBody(org.springframework.http.client.ClientHttpResponse resp) {
        try {
            return new String(resp.getBody().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }
}
```

---

### `XxxClientTest.java` (patrón mock chain)

```java
class XxxClientTest {

    @Mock private RestClient restClient;
    @Mock private RestClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock private RestClient.RequestBodySpec requestBodySpec;
    @Mock private RestClient.ResponseSpec responseSpec;

    private XxxClient client;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        client = new XxxClient(restClient);
    }

    private void stubChain() {
        doReturn(requestBodyUriSpec).when(restClient).post();
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(anyString());
        doReturn(requestBodySpec).when(requestBodySpec).contentType(any());
        doReturn(requestBodySpec).when(requestBodySpec).body(any(XxxRequestDto.class));
        doReturn(responseSpec).when(requestBodySpec).retrieve();
    }

    @Test
    void enviarSolicitud_200_debeRetornarResponse() {
        XxxResponseDto expected = XxxResponseDto.builder().id("123").build();
        stubChain();
        doReturn(responseSpec).when(responseSpec).onStatus(any(), any());
        doReturn(expected).when(responseSpec).body(XxxResponseDto.class);

        XxxResponseDto result = client.enviarSolicitud(buildRequest());

        assertThat(result.getId()).isEqualTo("123");
    }

    @Test
    void enviarSolicitud_400_debeLanzarNonRetryable() {
        stubChain();
        when(responseSpec.onStatus(any(), any())).thenAnswer(invocation -> {
            Predicate<HttpStatusCode> predicate = invocation.getArgument(0);
            RestClient.ResponseSpec.ErrorHandler handler = invocation.getArgument(1);
            if (predicate.test(HttpStatus.BAD_REQUEST)) {
                handler.handle(null, mock(ClientHttpResponse.class));
            }
            return responseSpec;
        });

        assertThatThrownBy(() -> client.enviarSolicitud(buildRequest()))
                .isInstanceOf(XxxClientNonRetryableException.class);
    }

    @Test
    void enviarSolicitud_500_debeLanzarClientException() {
        stubChain();
        when(responseSpec.onStatus(any(), any())).thenAnswer(invocation -> {
            Predicate<HttpStatusCode> predicate = invocation.getArgument(0);
            RestClient.ResponseSpec.ErrorHandler handler = invocation.getArgument(1);
            if (predicate.test(HttpStatus.INTERNAL_SERVER_ERROR)) {
                handler.handle(null, mock(ClientHttpResponse.class));
            }
            return responseSpec;
        });

        assertThatThrownBy(() -> client.enviarSolicitud(buildRequest()))
                .isInstanceOf(XxxClientException.class);
    }
}
```

---

## Anti-patrones a evitar

- **Agregar webflux para hacer HTTP:** `RestClient` ya está en `spring-boot-starter-web`
- **URL hardcodeada en el client:** usar `@Value` en `XxxClientConfig`
- **`@RequiredArgsConstructor` con `@Qualifier`:** Lombok no propaga el qualifier; usar constructor manual
- **Reintentar 4xx:** error de datos — determinista, los reintentos no sirven
- **Ignorar el body del error:** incluirlo siempre en la excepción para debug en producción
- **Sin timeouts:** `RestClient.create(url)` sin `requestFactory` — el thread puede quedar bloqueado indefinidamente
