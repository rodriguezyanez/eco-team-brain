---
name: auditoria
description: Audita un entregable KLAP (microservicio Spring Boot, AWS Lambda, API REST o sitio Angular) antes de pasar a certificacion. Predice si pasara los quality gates del pipeline Jenkins (SonarQube, OWASP Dependency-Check, Trivy) y el estandar KLAP BYSF, y emite un veredicto unico APTO / NO APTO con informe de hallazgos por severidad (Markdown) y un dashboard HTML con graficos. Solo lectura: no modifica codigo.
disable-model-invocation: true
allowed-tools: Read, Write, Grep, Glob, Bash, TaskCreate, TaskUpdate, TaskList
---

# Auditoria de pre-certificacion — Estandar KLAP + gates de Jenkins

Vas a auditar si este entregable esta **listo para pasar a certificacion**. El objetivo concreto es
**predecir si pasara los quality gates del pipeline Jenkins** (SonarQube, OWASP Dependency-Check, Trivy)
y si cumple el estandar KLAP BYSF. Cada desviacion es un hallazgo con severidad.

> **Esta auditoria es de solo lectura.** No modificas codigo. Solo detectas, ejecutas escaneres cuando estan
> disponibles, analizas y reportas. Las correcciones las hace el dev con las skills correspondientes.

---

## PASO 1 — Deteccion de stack

Detecta el tipo de entregable con Glob/Grep sobre la raiz del proyecto. Puede haber mas de uno (monorepo).

| Stack | Marcadores |
|-------|-----------|
| **Microservicio Spring Boot** | `build.gradle` / `pom.xml` + clase con `@SpringBootApplication` |
| **AWS Lambda** | `template.yaml` (SAM), `serverless.yml`, o CDK (`cdk.json`) + handlers; runtime Java o Node |
| **API REST** | controllers REST / `openapi`/`swagger` y NO es Lambda |
| **Sitio Angular** | `angular.json` + `package.json` con `@angular/core` |

Registra el/los stack(s) detectado(s). Las dimensiones del **PASO 3** (estandar KLAP) se aplican **solo** a los
stacks presentes. Los gates de Jenkins (**PASO 2**) aplican a **todos**.

---

## PASO 2 — Autodeteccion de umbrales

Antes de evaluar, determina los umbrales **reales** del proyecto. Lee, si existen, y usa el valor declarado;
si no existe, usa el **fallback KLAP** indicado. Siempre registra la **fuente** de cada umbral (repo vs KLAP).

| Fuente en el repo | Que extraer | Fallback KLAP |
|-------------------|-------------|---------------|
| `Jenkinsfile` / `Jenkinsfile.*` | etapas y umbrales de Sonar/OWASP/Trivy declarados (`waitForQualityGate`, `failOnCVSS`, `--severity`, `--exit-code`) | ver filas siguientes |
| `sonar-project.properties` / config del quality gate | `sonar.qualitygate`, `sonar.coverage.exclusions`, quality profile | Quality gate `PASSED`; cobertura >=95%; 0 bugs; 0 vulnerabilities; hotspots revisados; duplicaciones <=3% |
| config OWASP Dependency-Check (`dependency-check.*`, `suppressions.xml`, `failOnCVSS` en `build.gradle`/`pom.xml`) | CVSS de corte y suppressions | 0 CVE con CVSS >= 7.0 (HIGH/CRITICAL) |
| config Trivy (`.trivyignore`, `trivy.yaml`, args en Jenkins) | severidades que fallan y ignores | 0 vuln CRITICAL/HIGH en imagen, FS e IaC |

---

## PASO 3 — Gates de Jenkins (aplican a TODOS los stacks)

Cada gate en rojo es un hallazgo **CRITICO** (bloquea certificacion). Ejecuta lo que puedas localmente; lo que
no puedas ejecutar, **predicelo estaticamente y marcalo como "no ejecutado localmente"** — nunca lo silencies.

### 3.1 SonarQube quality gate (replicado analiticamente)

No requiere server Sonar. Si existe un reporte previo (`.scannerwork/report-task.txt`, `build/sonar`,
`target/sonar`), usalo; si no, estima desde el codigo y los reportes de cobertura (`jacocoTestReport`,
`coverage/` de Angular). Evalua:

- **Bugs / Reliability rating** — nulls, recursos sin cerrar, comparaciones erroneas.
- **Vulnerabilities / Security rating** — inyeccion, secrets hardcodeados, deserializacion insegura.
- **Security hotspots** — deben estar revisados (crypto, SSRF, CORS, permisos).
- **Code smells / Maintainability rating** — complejidad ciclomatica (CC<10), duplicacion, metodos largos, dead code.
- **Cobertura** — >= umbral (fallback 95%). Reporta el % encontrado y de donde lo sacaste.
- **Duplicaciones** — <= umbral (fallback 3%).

Resultado: `PASSED` / `FAILED` (predicho) + metricas que lo determinan.

### 3.2 OWASP Dependency-Check (CVEs en dependencias)

- Si `dependency-check` esta instalado: correr sobre `build.gradle`/`pom.xml`/`package.json` y leer el reporte.
- Si no: analizar el arbol de dependencias declaradas y reportar CVEs conocidos por version.
- Aplicar suppressions del repo si existen. Reportar cada CVE por **CVSS**, componente y version.
- **Bloqueante:** cualquier CVE con CVSS >= umbral (fallback 7.0) sin supresion justificada.

### 3.3 Trivy (imagen / filesystem / IaC)

- `trivy fs .` — vulnerabilidades en dependencias y secrets en el arbol.
- `trivy image <img>` — si hay `Dockerfile` o imagen publicada (analizar imagen base y capas).
- `trivy config .` — misconfiguraciones de IaC: `Dockerfile`, `template.yaml` (SAM), `serverless.yml`, CDK.
- Respetar `.trivyignore`. Reportar por severidad.
- **Bloqueante:** vuln CRITICAL/HIGH o secret detectado sin ignore justificado.

---

## PASO 4 — Estandar KLAP por stack (reusa skills existentes)

Aplica **solo** a los stacks detectados. Reutiliza las reglas de las skills ya instaladas — no dupliques criterios.

### 4.1 Java (microservicio Spring Boot / Lambda-Java)
- `code-review-expert` — arquitectura, SOLID, manejo de errores, performance, observabilidad.
- `sdd-checklist` — naming (`XxxService/Impl`, `XxxRepository`, `XxxKafkaListener`...), JavaDoc obligatorio en
  metodos publicos, packages en minusculas (regex `^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$`), JdbcTemplate (NUNCA JPA),
  queries en `ConstantsQuery`, paginacion cursor-based, cobertura >=95%.
- `defectos-tipicos-checklist` — 6 categorias: duplicados, nulls, validacion de inputs, edge cases (DLQ/retry/alertas),
  trazabilidad (idProceso + codigoSucursal), control de acceso (OWASP A01).
- `kafka-audit` — **solo si el proyecto usa Kafka** (hay `@KafkaListener`/`KafkaTemplate`).

### 4.2 AWS Lambda
- Cold start / timeout / memoria dimensionados; sin logica pesada en el handler init sin justificar.
- Permisos IAM de minimo privilegio (revisar policies en SAM/serverless/CDK).
- Secrets desde Secrets Manager / SSM / env, **nunca hardcodeados**.
- Idempotencia y manejo de reintentos (SQS/EventBridge/DLQ).
- Logging estructurado con correlation id; sin datos sensibles en logs.

### 4.3 API REST
- Contrato OpenAPI/Swagger presente y coherente.
- Validacion de inputs (`@Valid`/schemas), manejo de errores centralizado, codigos HTTP correctos.
- Autenticacion/autorizacion y CORS configurados; sin endpoints sensibles expuestos.

### 4.4 Angular
- `ng lint` sin errores; `npm audit` sin CRITICAL/HIGH.
- Cobertura de tests (Karma/Jest) >= umbral.
- `ng build --configuration production` sin warnings; sin secrets en el bundle; source maps de prod controlados.

---

## PASO 5 — Veredicto de certificacion

| Veredicto | Condicion |
|-----------|-----------|
| **APTO** | Sonar quality gate `PASSED` (predicho) **y** 0 CVE CVSS>=umbral (OWASP DC) **y** 0 Trivy CRITICAL/HIGH **y** cobertura >= umbral **y** 0 hallazgos CRITICO/ALTO del estandar KLAP |
| **APTO CON OBSERVACIONES** | Todos los gates en verde y solo hallazgos MEDIO / BAJO / SUGERENCIA |
| **NO APTO** | Cualquier gate en rojo, o cualquier hallazgo CRITICO/ALTO |

Severidades de hallazgos (alineadas a `code-review-expert` / `kafka-audit`):
- **CRITICO** — bloquea certificacion (gate rojo, perdida de datos, vuln CRITICAL, secret expuesto).
- **ALTO** — corregir antes de certificar (vuln HIGH, cobertura bajo umbral, bug de seguridad).
- **MEDIO** — configuracion suboptima / inconsistencia.
- **BAJO / SUGERENCIA** — calidad, naming, mejoras.

---

## PASO 6 — Informe Markdown

Genera el archivo `auditoria-{nombre-proyecto}-{YYYY-MM-DD}.md` con este formato:

```markdown
# Informe de Auditoria de Certificacion — {NOMBRE_PROYECTO}

**Fecha:** {FECHA}
**Stack(s) detectado(s):** {Spring Boot / Lambda / API REST / Angular}
**Veredicto:** APTO / APTO CON OBSERVACIONES / NO APTO

## Resumen de gates de Jenkins

| Gate | Estado | Umbral usado | Fuente umbral | Ejecutado |
|------|--------|--------------|---------------|-----------|
| SonarQube quality gate | PASSED/FAILED | cobertura>=95%, 0 bugs... | repo / KLAP | analitico |
| OWASP Dependency-Check | OK/FAIL | CVSS>=7.0 | repo / KLAP | trivy? dc? / estatico |
| Trivy (image/fs/config) | OK/FAIL | CRITICAL/HIGH | repo / KLAP | ejecutado / no ejecutado |

## Resumen de hallazgos

| Severidad | Cantidad |
|-----------|----------|
| CRITICO | X |
| ALTO | X |
| MEDIO | X |
| BAJO | X |
| SUGERENCIA | X |

## Hallazgos (por severidad)

### [CRITICO-001] {Titulo}
**Gate/Dimension:** Sonar / OWASP DC / Trivy / KLAP-{stack}
**Archivo:** `{ruta}:{linea}`
**Descripcion:** {que y por que bloquea certificacion}
**Accion requerida:** {como resolverlo — que skill usar}

(... resto de severidades con la misma estructura ...)

## Bloqueantes para certificar
- [ ] [CRITICO-00X] {breve}
- [ ] [ALTO-00X] {breve}
```

No apliques correcciones. Si el dev pide arreglar, indicale la skill correspondiente
(`code-review-expert`, `kafka-audit`, `sdd-microservice`, etc.) por cada bloqueante.

### 6.1 Datos estructurados (fuente del dashboard)

Ademas del Markdown, construye en memoria un objeto de datos con **exactamente** esta forma. Es la
**unica fuente** del dashboard HTML (PASO 7): no re-parsees el Markdown para graficar.

```json
{
  "project": "{nombre-proyecto}",
  "date": "{YYYY-MM-DD}",
  "stacks": ["Spring Boot", "Angular"],
  "verdict": "APTO | APTO CON OBSERVACIONES | NO APTO",
  "gates": [
    { "name": "SonarQube", "status": "PASSED|FAILED", "threshold": "cobertura>=95%, 0 bugs...", "source": "repo|KLAP", "executed": "analitico" },
    { "name": "OWASP Dependency-Check", "status": "OK|FAIL", "threshold": "CVSS>=7.0", "source": "repo|KLAP", "executed": "ejecutado|estatico" },
    { "name": "Trivy", "status": "OK|FAIL", "threshold": "CRITICAL/HIGH", "source": "repo|KLAP", "executed": "ejecutado|no ejecutado" }
  ],
  "metrics": { "coverage": 87.5, "coverageThreshold": 95, "duplication": 4.1, "duplicationThreshold": 3 },
  "findingsBySeverity": { "CRITICO": 0, "ALTO": 0, "MEDIO": 0, "BAJO": 0, "SUGERENCIA": 0 },
  "findings": [
    { "id": "CRITICO-001", "severity": "CRITICO", "gate": "Trivy", "location": "Dockerfile:3", "description": "...", "remediation": "Como solucionarlo para la proxima iteracion (que skill usar)" }
  ],
  "blockers": ["[CRITICO-001] breve", "[ALTO-001] breve"]
}
```

Reglas: `metrics.coverage`/`duplication` son numeros (usa `null` si no se pudo medir). `findingsBySeverity`
son conteos. Cada `finding.remediation` debe decir **como solucionar la incidencia** para pasar en la
siguiente iteracion. `blockers` lista solo CRITICO/ALTO.

---

## PASO 7 — Dashboard HTML

Invoca la skill **`web-artifacts-builder`** pasandole el objeto JSON del PASO 6.1 para generar el archivo
`auditoria-{nombre-proyecto}-{YYYY-MM-DD}.html` en la raiz del proyecto, junto al informe `.md`.

El dashboard debe tener:
- **Arriba (graficos):** banner de veredicto, estado por gate (Sonar/OWASP/Trivy), dona/barras de hallazgos
  por severidad, y gauges de cobertura y duplicacion vs umbral.
- **Abajo (detalle):** tabla de hallazgos con severidad, gate, `archivo:linea`, descripcion y **como
  solucionar** (columna de remediacion), mas el checklist de bloqueantes.

El HTML es autocontenido (sin CDNs, CSP-safe). Reporta al dev la ruta del `.md` y del `.html` generados.
