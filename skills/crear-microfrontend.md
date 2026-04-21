# Skill: Crear un Microfrontend Angular + BFF (Spring Boot)

> Guia paso a paso para replicar la creacion de un MCF + integracion BFF
> como se hizo con `mcf-bo-perfiles-roles`.

---

## Cuando usarlo

| Situacion | Patron |
|-----------|--------|
| MCF backoffice con CRUD sobre Aurora PostgreSQL | Patron 1: `mcf-bo-*` + BFF existente `ms-central-bff-bysf-bo-menu` |
| MCF bysf que proxea una API externa (sin BD propia) | Patron 2: `mcf-bysf-*` + BFF propio `ms-bff-bysf-*` |

---

## Diferencias clave entre patrones

| Aspecto | Patron 1 (bo + menu BFF) | Patron 2 (bysf + BFF propio) |
|---|---|---|
| Prefijo MCF | `mcf-bo-*` | `mcf-bysf-*` |
| BFF | Extension de `ms-central-bff-bysf-bo-menu` | Nuevo proyecto Spring Boot independiente |
| Base de datos | Aurora PostgreSQL (JdbcTemplate) | Ninguna — proxy hacia API externa |
| Auth MCF→BFF | Sin token especial | `window.__AUTH_TOKEN_API__.getToken()` + `clientid` header |
| Config runtime MCF | `window.__BFF_X_URL__` | `window.__env.BFF_X_URL` (con fallback chain) |
| Puerto MCF | 900X | 9010 (u otro disponible) |
| Puerto BFF | 8080 | 8083 (u otro disponible) |
| `extra-webpack` | Simple | Extendido: splitChunks/runtimeChunk false, CORS headers devServer |
| Dockerfile | No | Si — imagen propia `eclipse-temurin:17-jre-alpine` |

---

# PATRON 1: MCF bo + BFF existente (CRUD Aurora PostgreSQL)

## Arquitectura

```
mcf-bo-cloud-base (Shell :9000)
  └─ mcf-bo-<nombre> (:900X)
       └─> ms-central-bff-bysf-bo-menu (:8080)
             └─> Controller → Service → Repository
                   └─> sql/<nombre>/*.sql
                         └─> Aurora PostgreSQL (schema: backoffice)
```

## Estructura MCF Angular

```
mcf-bo-<nombre>/
├── angular.json
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.spec.json
├── extra-webpack.config.js   # SystemJS library target
└── src/
    ├── main.ts               # Bootstrap standalone (NO single-spa)
    ├── main.single-spa.ts    # Bootstrap single-spa
    ├── index.html
    ├── styles.scss
    └── app/
        ├── app.component.ts
        ├── app.routes.ts
        ├── empty-route/empty-route.component.ts
        ├── models/index.ts
        ├── services/<nombre>.service.ts
        ├── shared/confirm-dialog/ y notification/
        └── views/<entidad>/<entidad>.component.ts
```

## Dependencias clave (package.json)

```json
{
  "dependencies": {
    "@angular/core": "^19.2.0",
    "@angular/router": "^19.2.0",
    "@angular/common": "^19.2.0",
    "@angular/forms": "^19.2.0",
    "single-spa-angular": "^9.2.0",
    "rxjs": "~7.8.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-builders/custom-webpack": "^19.0.0",
    "@angular-devkit/build-angular": "^19.2.0",
    "@angular/cli": "^19.2.0"
  }
}
```

## angular.json — Targets clave

```jsonc
{
  "projects": {
    "mcf-bo-<nombre>": {
      "architect": {
        "build": {
          "builder": "@angular-builders/custom-webpack:browser",
          "options": {
            "main": "src/main.single-spa.ts",
            "outputPath": "dist",
            "deployUrl": "http://localhost:900X/",
            "customWebpackConfig": { "path": "./extra-webpack.config.js" }
          }
        },
        "serve": {
          "builder": "@angular-builders/custom-webpack:dev-server",
          "options": { "port": 900X }
        },
        "build-standalone": {
          "builder": "@angular-devkit/build-angular:application",
          "options": { "browser": "src/main.ts", "outputPath": "dist-standalone", "index": "src/index.html" }
        },
        "serve-standalone": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": { "buildTarget": "mcf-bo-<nombre>:build-standalone", "port": 4201 }
        }
      }
    }
  }
}
```

## extra-webpack.config.js

```js
const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;

module.exports = (config, options) => {
  const singleSpaConfig = singleSpaAngularWebpack(config, options);
  singleSpaConfig.output.library = { type: 'system' };
  singleSpaConfig.externals = ['single-spa', /^@mcf-bo\/.+$/];
  return singleSpaConfig;
};
```

## Servicio Angular (patron de conexion al BFF)

```typescript
@Injectable({ providedIn: 'root' })
export class MiService {
  private readonly apiUrl: string;

  constructor(private readonly http: HttpClient) {
    const isLocal = window.location.hostname === 'localhost';
    if (isLocal) {
      this.apiUrl = 'http://localhost:8080/ms-central-bff-bysf-bo-menu/bff/<base>';
    } else {
      const bffUrl = (window as any).__BFF_<NOMBRE>_URL__;
      this.apiUrl = bffUrl || `${window.location.origin}/ms-central-bff-bysf-bo-menu/bff/<base>`;
    }
  }

  getItems(page = 0, size = 10, search = ''): Observable<PaginatedResponse<Item>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedResponse<Item>>(`${this.apiUrl}/items`, { params });
  }
}
```

## Modelos TypeScript

```typescript
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface MiEntidad {
  id: number;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';  // BFF convierte boolean <-> string
}
```

---

## Integracion BFF existente (ms-central-bff-bysf-bo-menu)

### Archivos a crear en el BFF

| Ubicacion | Archivo | Patron |
|-----------|---------|--------|
| `src/main/resources/sql/<nombre>/` | `*.sql` | Queries con `?` |
| `src/.../controller/dto/` | `*Request.java` / `*Response.java` | POJOs con getters/setters |
| `src/.../menu/aurora/repo/` | `Bo<Nombre>Repository.java` | `@Repository` + `JdbcTemplate` |
| `src/.../menu/service/` | `<Nombre>Service.java` | `@Service` |
| `src/.../menu/controller/` | `<Nombre>Controller.java` | `@RestController` |
| `src/.../config/` | `SecurityConfig.java` | Agregar `.requestMatchers("/bff/<base>/**").permitAll()` |

### SQL files — Convenciones

```
sql/<nombre>/
├── <entidad>_listar.sql        # SELECT ... LIMIT ? OFFSET ?
├── <entidad>_contar.sql        # SELECT COUNT(*)
├── <entidad>_obtener.sql       # SELECT ... WHERE id = ?
├── <entidad>_insertar.sql      # INSERT ... RETURNING ...
├── <entidad>_actualizar.sql    # UPDATE ... WHERE id = ? RETURNING ...
├── <entidad>_eliminar.sql      # DELETE ... WHERE id = ?
├── <entidad>_todos.sql         # SELECT ... ORDER BY (sin paginacion, para lookups)
└── V1__<nombre>_ddl.sql        # ALTER TABLE IF NOT EXISTS (migracion)
```

**Reglas SQL:**
- Schema siempre `backoffice.*`
- Estado en BD es `boolean` → Java convierte a `"ACTIVO"/"INACTIVO"`
- PKs: `bo_menu.id`, `bo_rol.id_rol`, `bo_accion.id_accion`, `bo_funcionalidad.id`, `bo_perfil.id_perfil`
- Usar `RETURNING` de PostgreSQL para INSERT/UPDATE
- Busqueda: `WHERE (? IS NULL OR ? = '' OR LOWER(col) LIKE LOWER(CONCAT('%', ?, '%')))`

### Repository — Patron JdbcTemplate

```java
@Repository
public class Bo<Nombre>Repository {
    private final JdbcTemplate jdbc;
    private final ResourceLoader resourceLoader;
    private static final String SQL_BASE = "classpath:sql/<nombre>/";

    public Bo<Nombre>Repository(JdbcTemplate jdbc, ResourceLoader resourceLoader) {
        this.jdbc = jdbc;
        this.resourceLoader = resourceLoader;
    }

    public List<MiResponse> findItems(String search, int limit, int offset) {
        try {
            String sql = readSql("<entidad>_listar.sql");
            return jdbc.query(sql, (rs, rowNum) -> {
                MiResponse r = new MiResponse();
                r.setId(rs.getLong("id"));
                r.setNombre(rs.getString("nombre"));
                r.setEstadoFromBoolean(rs.getBoolean("estado"));
                return r;
            }, search, search, search, limit, offset);
        } catch (IOException e) {
            return Collections.emptyList();
        }
    }

    private String readSql(String filename) throws IOException {
        try (InputStream is = resourceLoader.getResource(SQL_BASE + filename).getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
```

### Service — Patron

```java
@Service
public class <Nombre>Service {
    private final Bo<Nombre>Repository repository;

    @Autowired
    public <Nombre>Service(@Autowired(required = false) Optional<Bo<Nombre>Repository> repo) {
        this.repository = repo.orElse(null);
    }

    public PaginatedResponse<MiResponse> getItems(int page, int size, String search) {
        checkRepository();
        List<MiResponse> content = repository.findItems(search, size, page * size);
        long total = repository.countItems(search);
        return new PaginatedResponse<>(content, total, size, page);
    }

    private void checkRepository() {
        if (repository == null) throw new IllegalStateException("Repository no disponible");
    }
}
```

### Controller — Patron

```java
@RestController
@RequestMapping("/bff/<base>")
@Tag(name = "<Nombre>", description = "CRUD de <entidades>")
public class <Nombre>Controller {
    private final <Nombre>Service service;

    @GetMapping(value = "/<entidad>", produces = APPLICATION_JSON_VALUE)
    public ResponseEntity<PaginatedResponse<MiResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(service.getItems(page, size, search));
    }

    @PostMapping(value = "/<entidad>", consumes = APPLICATION_JSON_VALUE)
    public ResponseEntity<MiResponse> create(@Valid @RequestBody MiRequest req) {
        return ResponseEntity.status(CREATED).body(service.createItem(req));
    }
    // PUT /<entidad>/{id}, DELETE /<entidad>/{id}, GET /<entidad>/all
}
```

## Registro en Shell (mcf-bo-cloud-base)

```json
// config.json
{ "BOMC_MCF_<NOMBRE>_PATH": "http://localhost:900X/main.js" }
```

```html
<!-- index.ejs — Import map -->
"@mcf-bo/mcf-bo-<nombre>": "<%= BOMC_MCF_<NOMBRE>_PATH %>"

<!-- microfrontend-layout.html -->
<route path="<nombre>">
  <application name="@mcf-bo/mcf-bo-<nombre>"></application>
</route>
```

## Levantar localmente (Patron 1)

```bash
# BFF
cd ms-central-bff-bysf-bo-menu
SPRING_PROFILES_ACTIVE=local gradle bootRun --args='--security.oauth2.enabled=false'

# MCF standalone (sin shell)
cd mcf-bo-<nombre>
npx ng run mcf-bo-<nombre>:serve-standalone
# → http://localhost:4201
```

## Checklist Patron 1

- [ ] MCF Angular creado con single-spa + standalone builds
- [ ] Modelos TypeScript definidos
- [ ] Servicio Angular apuntando al BFF
- [ ] Componentes CRUD para cada entidad
- [ ] SQL files creados (listar, contar, obtener, insertar, actualizar, eliminar, todos)
- [ ] DDL migration SQL (V1__<nombre>_ddl.sql)
- [ ] DTOs Java (Request + Response por entidad)
- [ ] Repository Java (JdbcTemplate + SQL files)
- [ ] Service Java (delega a repository)
- [ ] Controller Java (@RestController con endpoints)
- [ ] SecurityConfig actualizado con nuevas rutas
- [ ] CorsFilterConfig permite localhost (para dev)
- [ ] Shell: config.json + index.ejs + microfrontend-layout.html
- [ ] `gradle compileJava` → BUILD SUCCESSFUL
- [ ] MCF standalone compila y sirve en :4201

---

# PATRON 2: MCF bysf + BFF Independiente (Proxy API Externa)

> Referencia: `mcf-bysf-imed-cod-lector-lugar` + `ms-bff-bysf-imed`

## Estructura MCF bysf

```
mcf-bysf-<nombre>/
├── angular.json
├── package.json
├── extra-webpack.config.js      # Extendido (splitChunks false, CORS devServer)
├── proxy.conf.json              # Proxy local → BFF
└── src/
    ├── env.js                   # window.__env = {} (reemplazado en pipeline)
    ├── index.html / styles.css
    ├── main.ts / main.single-spa.ts
    └── app/
        ├── app.component.ts
        ├── app.config.ts        # provideHttpClient + authTokenInterceptor
        ├── app.routes.ts
        ├── auth-token.interceptor.ts
        ├── config/env.ts        # getBffXxxBaseUrl() con fallback chain
        └── <feature>/
```

## src/env.js

```js
window.__env = window.__env || {};
```

## src/app/config/env.ts

```typescript
type RuntimeEnv = { BFF_<NOMBRE>_URL?: string; [key: string]: any; };

export function getBff<Nombre>BaseUrl(): string {
  const env = (window as any).__env || {};
  const w = window as any;
  const isLocal = window.location.hostname === 'localhost';

  if (env.BFF_<NOMBRE>_URL) return env.BFF_<NOMBRE>_URL;
  if (w.__BFF_<NOMBRE>_URL__) return w.__BFF_<NOMBRE>_URL__;
  if (w.BOMC_MCF_BFF_<NOMBRE>_URL) return w.BOMC_MCF_BFF_<NOMBRE>_URL;
  if (isLocal) return 'http://localhost:<PUERTO_BFF>/api';
  return window.location.origin + '/api/bff-<nombre>';
}
```

## auth-token.interceptor.ts

```typescript
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authTokenAPI = (window as any).__AUTH_TOKEN_API__;

  return from(authTokenAPI?.getToken() ?? Promise.resolve(null)).pipe(
    switchMap((token: string | null) => {
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: token, clientid: 'backoffice-v2' } })
        : req;

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 && authTokenAPI) {
            return from(authTokenAPI.getTokenWithRefresh()).pipe(
              switchMap((refreshedToken: string | null) => refreshedToken
                ? next(req.clone({ setHeaders: { Authorization: refreshedToken, clientid: 'backoffice-v2' } }))
                : throwError(() => error)
              ),
              catchError(() => throwError(() => error))
            );
          }
          return throwError(() => error);
        })
      );
    })
  );
};
```

## app.config.ts

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideAnimations(),
    { provide: APP_BASE_HREF, useValue: '/' },
  ],
};
```

## main.single-spa.ts

```typescript
const lifecycles = singleSpaAngular({
  bootstrapFunction: () => bootstrapApplication(AppComponent, appConfig),
  template: '<app-<nombre>></app-<nombre>>',
  NgZone,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
```

## extra-webpack.config.js (version bysf extendida)

```js
const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;

module.exports = (config, options) => {
  const singleSpaWebpackConfig = singleSpaAngularWebpack(config, options);
  const isProd = options?.configuration === 'production' || process.env.NODE_ENV === 'production';

  singleSpaWebpackConfig.output = {
    ...singleSpaWebpackConfig.output,
    filename: 'main.js',
    publicPath: isProd ? 'https://apps-front-dev.mcdesaqa.cl/mcf-bysf-<nombre>/' : 'auto',
    environment: {
      arrowFunction: false, bigIntLiteral: false, const: false,
      destructuring: false, dynamicImport: false, forOf: false, module: false
    }
  };

  singleSpaWebpackConfig.optimization = {
    ...singleSpaWebpackConfig.optimization,
    splitChunks: false,
    runtimeChunk: false
  };

  singleSpaWebpackConfig.devServer = {
    port: <PUERTO_MCF>,
    historyApiFallback: true,
    hot: false,
    liveReload: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
    },
  };

  singleSpaWebpackConfig.externals = {};
  singleSpaWebpackConfig.output.libraryTarget = 'system';
  return singleSpaWebpackConfig;
};
```

## angular.json — Targets (bysf)

```jsonc
{
  "build": {
    "builder": "@angular-builders/custom-webpack:browser",
    "options": {
      "outputPath": "dist/mcf-bysf-<nombre>",
      "main": "src/main.single-spa.ts",
      "customWebpackConfig": { "path": "extra-webpack.config.js", "libraryTarget": "system" },
      "sourceMap": { "scripts": false, "styles": false, "vendor": false }
    },
    "configurations": {
      "production": { "outputHashing": "none" },
      "development": { "outputHashing": "none" }
    }
  },
  "serve": {
    "options": { "port": "<PUERTO_MCF>", "proxyConfig": "proxy.conf.json", "liveReload": false, "hmr": false }
  }
}
```

## proxy.conf.json

```json
{
  "/api": {
    "target": "http://localhost:<PUERTO_BFF>",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## BFF Independiente (ms-bff-bysf-<nombre>)

### Estructura

```
ms-bff-bysf-<nombre>/
├── build.gradle / settings.gradle / gradlew
├── Dockerfile
└── src/main/java/cl/multicaja/bo/
    ├── MsBffBysf<Nombre>Application.java
    ├── config/
    │   ├── SecurityConfig.java        # Stateless, permitAll, CORS
    │   ├── RestClientConfig.java      # RestTemplate + timeouts + logger
    │   └── GlobalExceptionHandler.java
    ├── controller/<Entidad>Controller.java
    ├── dto/<Entidad>GetRequest/SetRequest/Response.java
    └── service/<Nombre>Service.java
```

### build.gradle

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.5'
    id 'io.spring.dependency-management' version '1.1.6'
}
group = 'cl.multicaja.bo'
java { toolchain { languageVersion = JavaLanguageVersion.of(17) } }
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

### application.yml

```yaml
server:
  port: <PUERTO_BFF>
  servlet:
    context-path: /api
spring:
  application:
    name: ms-bff-bysf-<nombre>
  jackson:
    default-property-inclusion: non_null
<nombre>:
  base-url: ${<NOMBRE>_BASE_URL:https://upstream-dev.dominio.cl/ruta/base}
  auth-token: ${<NOMBRE>_AUTH_TOKEN:Bearer <token-default-dev>}
management:
  endpoints:
    web:
      exposure:
        include: health,info
```

### RestClientConfig.java

```java
@Configuration @Slf4j
public class RestClientConfig {
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(10))
            .setReadTimeout(Duration.ofSeconds(30))
            .messageConverters(List.of(
                new StringHttpMessageConverter(StandardCharsets.UTF_8),
                new MappingJackson2HttpMessageConverter()
            ))
            .interceptors((request, body, execution) -> {
                log.info(">>> {} {}", request.getMethod(), request.getURI());
                ClientHttpResponse response = execution.execute(request, body);
                log.info(">>> Response: {}", response.getStatusCode());
                return response;
            })
            .build();
    }
}
```

### SecurityConfig.java (BFF propio)

```java
@Configuration @EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### Service — Patron proxy

```java
@Service @Slf4j
public class <Nombre>Service {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${<nombre>.base-url}") private String upstreamBaseUrl;
    @Value("${<nombre>.auth-token}") private String upstreamAuthToken;

    public <EntidadResponse> getEntidad(<EntidadGetRequest> request, String authToken) {
        String url = upstreamBaseUrl + "/ruta/del/upstream";
        HttpEntity<<EntidadGetRequest>> entity = new HttpEntity<>(request, buildHeaders(authToken));
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        checkUpstreamError(response.getBody());
        return deserialize(response.getBody(), <EntidadResponse>.class);
    }

    private HttpHeaders buildHeaders(String authToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String token = (authToken != null && !authToken.isBlank()) ? authToken : upstreamAuthToken;
        headers.set("Authorization", token);
        return headers;
    }

    private void checkUpstreamError(String body) {
        try {
            JsonNode node = objectMapper.readTree(body);
            if (node.has("code") && node.get("code").asInt() != 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Upstream error: " + node.get("message").asText());
            }
        } catch (ResponseStatusException e) { throw e; }
        catch (Exception ignored) {}
    }

    private <T> T deserialize(String body, Class<T> clazz) {
        try { return objectMapper.readValue(body, clazz); }
        catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error procesando respuesta del upstream");
        }
    }
}
```

### DTOs (Lombok)

```java
@Data public class <Entidad>GetRequest {
    @NotBlank private String campo_requerido_string;
    @NotNull  private Long campo_requerido_long;
}

@Data public class <Entidad>Response {
    private Integer code;
    private String message;
    private String timestamp;
}
```

### Dockerfile

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY build/libs/*.jar app.jar
EXPOSE <PUERTO_BFF>
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Levantar localmente (Patron 2)

```bash
# BFF
cd ms-bff-bysf-<nombre>
./gradlew bootRun
# → http://localhost:<PUERTO_BFF>/api

# MCF single-spa
cd mcf-bysf-<nombre>
npm run start
# → http://localhost:<PUERTO_MCF>/main.js

# MCF standalone
npm run serve:standalone
# → http://localhost:4201
```

## Checklist Patron 2

### MCF
- [ ] `extra-webpack.config.js` con `splitChunks: false`, `runtimeChunk: false`, CORS headers en devServer
- [ ] `src/env.js` con `window.__env = window.__env || {}`
- [ ] `config/env.ts` con `getBff<Nombre>BaseUrl()` y fallback chain completa
- [ ] `auth-token.interceptor.ts` con `window.__AUTH_TOKEN_API__` + refresh + header `clientid`
- [ ] `app.config.ts` con `provideHttpClient(withInterceptors([authTokenInterceptor]))`
- [ ] `main.single-spa.ts` exporta `bootstrap`, `mount`, `unmount`
- [ ] `angular.json`: `outputHashing: none` en prod Y dev
- [ ] `proxy.conf.json` apuntando al BFF local
- [ ] `npm run build:single-spa` genera `dist/mcf-bysf-<nombre>/main.js`

### BFF
- [ ] `build.gradle` con Spring Boot 3.3.5, Java 17, sin dependencias de BD
- [ ] `application.yml`: port, context-path `/api`, propiedades `<nombre>.base-url` y `<nombre>.auth-token`
- [ ] `RestClientConfig` con timeouts (10s connect, 30s read) + interceptor de logging
- [ ] `SecurityConfig` stateless + CORS permisivo
- [ ] `GlobalExceptionHandler` maneja `HttpClientErrorException` y `HttpServerErrorException`
- [ ] `Service`: `buildHeaders()` con prioridad token MCF > token config, `checkUpstreamError()`, `deserialize()`
- [ ] `Dockerfile` con `eclipse-temurin:17-jre-alpine`
- [ ] `./gradlew build` → BUILD SUCCESSFUL
