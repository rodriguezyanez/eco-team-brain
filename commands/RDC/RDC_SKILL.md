# SKILL: Generador de RDC en Confluence

## Cuándo usar esta skill

Usa esta skill cuando el agente necesite crear o completar un **RDC (Registro de Despliegue de Cambios)** en Confluence para gestionar el despliegue en ambientes de certificación (QA) y producción.

Triggers típicos: "genera el RDC", "crea el documento de despliegue", "prepara el RDC", "completa el plan de PROD en el RDC".

---

## Ciclo de vida del RDC

El RDC se crea **al terminar el desarrollo**, antes del primer despliegue en QA. Se completa en **dos etapas**. Es prerequisito para el pase a producción — **no** para el despliegue en QA.

```
Desarrollo terminado
    ↓
[RDC Etapa 1] — crear documento con plan despliegue QA
    ↓
Despliegue QA  ← sin CAB
    ↓
Certificación QA aprobada
    ↓
[RDC Etapa 2] — completar sección PROD → presentar al CAB
    ↓
CAB aprueba → Producción
```

| Etapa | Cuándo | Qué se completa |
|-------|--------|-----------------|
| **1 — Creación** | Al terminar desarrollo, antes de despliegue QA | Todo el documento con plan QA. Sección PROD queda con placeholders. Estado PIM: Pendiente. |
| **2 — Completar PROD + CAB** | Al aprobar certificación QA | Sección "Despliegue Deployment": repos master/, variables Jenkins PROD, plan PROD, rollback PROD, Kong configs. Estado PIM: Certificado. |
| **Post-CAB** | CAB aprueba | Ejecutar despliegue productivo. |

---

## Posición en el flujo SDD

```
HU → Spec → ADR → STRIDE → CATI → Desarrollo
    → [RDC Etapa 1] → Despliegue QA → Certificación
    → [RDC Etapa 2] → CAB → Producción
```

---

## Infraestructura Atlassian

| Campo | Valor |
|-------|-------|
| cloudId | `db4dd528-0e0b-4bdf-b3dd-1e2e4e792a43` |
| Sitio | `multicaja-cloud.atlassian.net` |
| Espacio bysf (spaceId) | `2478211099` |
| **Carpeta padre RDC (parentId)** | **`4393402419`** |
| RDC de referencia | https://multicaja-cloud.atlassian.net/wiki/spaces/bysf/pages/5167054860 |

---

## Patrones de pipelines Jenkins

| Ambiente | Tipo | Patrón URL |
|----------|------|-----------|
| QA | Microservicio deploy | `http://10.179.20.28:8080/job/qa-{nombre-componente}/` |
| QA | DB migrate-up | `http://10.179.20.28:8080/job/qa-db-mc-tlog-scripts-migrate-up/` |
| QA | DB rollback | `http://10.179.20.28:8080/view/DATABASE-QA/job/qa-db-mc-tlog-scripts-rollback/` |
| QA | Rollback microservicios | `http://10.179.20.28:8080/job/central-docker-rollback-qa/` |
| PROD | Microservicio deploy | `http://10.117.1.36:8080/job/prod-{nombre-componente}/` |
| PROD | DB migrate-up | `http://10.117.1.36:8080/job/prod-cd-backoffice-db-mc-tlog-scripts-migrate-up/` |
| PROD | DB rollback | `http://10.117.1.36:8080/job/prod-cd-backoffice-db-mc-tlog-scripts-rollback/` |
| PROD | Variables globales Jenkins | `http://10.117.1.36:8080/configure` |

- Rollback microservicios: parámetros `NOMBRE_PIPELINE` + `ROLLBACK_VERSION`
- Rollback DB: parámetros `PROYECTO` + `CANTIDAD_DE_VECES`

---

## Convenciones de nombres

| Campo | Convención |
|-------|-----------|
| Título página RDC | `[BYSF-XXX] Nombre del proyecto RDC R.M V{version} [{DD.MM.AA}]` |
| Nombre proyecto DB pipelines | `AAAAMMDD_nombre_corto_sin_espacios` (ej: `20260224_autoconfiguracion_itau`) |
| Pipeline QA microservicio | `qa-{nombre-repo-sin-prefijo-mcs-central-bysf-}` |
| Pipeline PROD microservicio | `prod-{nombre-repo-sin-prefijo-mcs-central-bysf-}` |

---

## Estructura del RDC — 20 secciones en orden

La estructura replica **fielmente** el RDC de referencia (BYSF-956). El agente debe respetar el mismo orden de secciones, tipos de paneles, tablas y checkboxes. Solo cambian los datos del proyecto.

| # | Sección | Panel | Etapa | Descripción |
|---|---------|-------|-------|-------------|
| 1 | Detalles del Cambio | success (verde) | 1 | Link Jira issue |
| 2 | Descripción del Cambio | success (verde) | 1 | Área, líder, teléfono, descripción req, solución, servicios afectados, usuarios afectados, consecuencias, validador, plan validación |
| 3 | Requisitos Previos | info (azul) | 1 | Checkboxes: Redes / Infraestructura / BD No críticas / BD Críticas + tabla BD crítica (nombre, DBA, resultado) + tickets IT Service |
| 4 | Diagrama Técnico | note | 1 | Aplica / No Aplica + link |
| 5 | ¿Requiere Monitoreo? | info (azul) | 1 | Servicio nuevo / ya monitoreado + descripción |
| 6 | ¿Depreca componente? | note | 1 | Sí / No / No Aplica + nombre componente |
| 7 | Respaldo antes de eliminar | warning (amarillo) | 1 | Sí / No |
| 8 | Negocio | success (verde) | 1 | Negocio impactado (PCI/Multiservicio/Verticales) + Ambiente (Prod/Pre-Prod/Sandbox/Sodexo) |
| 9 | Sistema(s) Relacionado(s) | success (verde) | 1 | Lista de 18 categorías con subsistemas expandibles (ver lista completa abajo) |
| 10 | Horario de Ejecución | info (azul) | 1 | Sin restricción / Con restricción |
| 11 | Día y hora coordinada con Deployment | info (azul) | 1 | Texto libre o vacío |
| 12 | Asistido | success (verde) | 1 | No Aplica / Semi asistido / Asistido + nombre responsable |
| 13 | Dependencia con otro RDC | success (verde) | 1 | Aplica / No Aplica + link |
| 14 | Cambio | success (verde) | 1 | Tipo (Software/Infra/Redes/SO/BD/Procedimiento/Seguridad/Datos) + Urgencia + Categoría + Impacto + Prioridad |
| 15 | Programar Corte | warning (amarillo) | 1 | Aplica/No + impacto Alto/Medio/Bajo — comunicar 72hrs antes a comercios |
| 16 | Respaldos | note | 1 | App-Jar-War + BD-Esquema-Tabla-Funciones |
| 17 | PIM - Componentes de Software | note | 1→2 | Tabla: Nro / Componente / Versión / Estado / Jenkins QA / Parámetros. Estado inicial: Pendiente. Actualizar a Certificado en etapa 2. |
| 18 | Despliegue QA | note (collapsible) | 1 | Historias a certificar + repos qa/ + plan despliegue QA (microservicios + BD) + rollback QA |
| 19 | Despliegue Deployment | note (collapsible) | 2 | Repos master/ + variables Jenkins PROD + plan PROD (microservicios + BD) + rollback PROD + Kong configs |
| 20 | Plan de Mitigación CAB 2.0 | note | 1→2 | Responsable + casos de falla |
| 21 | Aprobaciones | info (azul) | 2 | Tabla: Dueño Cambio / QA / DBA / Deployment con Sí/No/Observaciones |

### Lista de 18 categorías — Sistemas Relacionados

Copiar esta lista completa en el RDC. Marcar con `checked` los que aplican según el proyecto.

```
1. Afiliacion y Contrato (1.1→1.10)
2. APM (2.1→2.13)
3. Boleta Electronica y Multiservicios (3.1→3.34)
4. Adquirencia E-Commerce (4.1→4.3)
5. E-Commerce-Checkout (5.1→5.9)
6. Servicios de Valor Agregado (6.1→6.3)
7. App Klap (7.1)
8. Web (8.1→8.3)
9. Facturacion y SSFF (9.1→9.18)
10. BO y Multiservicio Central (10.1→10.20)
11. Adquirencia Transaccional (11.1→11.9)
12. Adquirencia Clearing/RealNear (12.1→12.8)
13. Adquirencia H2H/SmartCell (13.1→13.3)
14. POS (14.1→14.6)
15. SmartVista (15.1→15.5)
16. Liquidaciones WEB (16.1)
17. Data Analytics (17.1→17.3)
18. OTI (18.1→18.4)
```

### Estados válidos para tabla PIM

`Pendiente` | `Error de Despliegue` | `Instalado en QA` | `Certificado` | `Listo para PROD`

---

## JSON de entrada para el agente

```json
{
  "title": "[BYSF-XXX] Nombre del proyecto — RDC R.M V.1 [DD.MM.AA]",
  "jira_issue": "https://multicaja-cloud.atlassian.net/browse/BYSF-XXX",
  "area": "GERENCIA DE TECNOLOGIA (CEL-BYSF)",
  "lider_tecnico": "Nombre del ingeniero líder",
  "telefono": "",
  "descripcion_requerimiento": "Descripción breve de qué se construyó.",
  "solucion_requerimiento": "Descripción de la solución técnica implementada.",
  "servicios_afectados": "N/a",
  "usuarios_afectados": "N/a",
  "consecuencias_no_aprobacion": "Descripción del impacto si no se aprueba.",
  "validador": "Nombre del validador",
  "plan_validacion": "Descripción del plan de validación post-despliegue.",

  "requisitos_previos": {
    "redes": false,
    "infraestructura": true,
    "bd_no_criticas": true,
    "bd_criticas": false,
    "bd_critica_nombre": "mc_tlog",
    "bd_critica_dba": "Nombre del DBA",
    "tickets_it_service": [
      "https://itservices.klap.cl/support/tickets/XXXXX"
    ]
  },

  "diagrama_tecnico": { "aplica": false, "link": "" },
  "monitoreo": { "servicio_nuevo": true, "descripcion": "" },
  "depreca_componente": { "aplica": false, "nombre": "" },
  "respaldo_antes_eliminar": false,

  "negocio": {
    "impactado": ["Multiservicio"],
    "ambiente": ["Producción"]
  },

  "sistemas_relacionados": ["10. BO y Multiservicio Central"],
  "sistemas_relacionados_detalle": ["10.3 - Backoffice: Mantenimientos operaciones sobre BO"],

  "horario": {
    "sin_restriccion": true,
    "fecha_hora_coordinada": ""
  },

  "asistido": {
    "tipo": "Semi asistido",
    "responsable": "Nombre del responsable"
  },

  "dependencia_rdc": { "aplica": false, "link": "" },

  "cambio": {
    "tipo": ["Software", "Base de Datos"],
    "urgencia": "Normal",
    "categoria": "Proyecto",
    "impacto": "Bajo",
    "prioridad": "Alta"
  },

  "corte_programado": { "aplica": false, "impacto": "" },
  "respaldos": { "app_jar_war": "", "base_datos": "" },

  "componentes": [
    {
      "nro": 1,
      "nombre": "mcs-central-bysf-nombre-servicio",
      "version": "1.0.0",
      "estado": "Pendiente",
      "jenkins_qa_url": "http://10.179.20.28:8080/job/qa-nombre-servicio/",
      "parametros": ""
    }
  ],

  "despliegue_qa": {
    "historias_certificar": [
      "https://multicaja-cloud.atlassian.net/browse/BYSF-XXX"
    ],
    "repositorios_microservicios": [
      "https://bitbucket.org/multicaja-cloud/nombre-repo/src/qa/"
    ],
    "repositorios_bd": [
      "https://bitbucket.org/multicaja-cloud/db-mc-tlog/src/qa/"
    ],
    "plan_microservicios": [
      {
        "nombre_pipeline": "qa-nombre-servicio",
        "version": "1.0.0",
        "url": "http://10.179.20.28:8080/job/qa-nombre-servicio/"
      }
    ],
    "plan_bd": {
      "proyecto": "AAAAMMDD_nombre_proyecto",
      "url": "http://10.179.20.28:8080/job/qa-db-mc-tlog-scripts-migrate-up/"
    },
    "rollback_bd": {
      "proyecto": "AAAAMMDD_nombre_proyecto",
      "cantidad_veces": 1,
      "url": "http://10.179.20.28:8080/view/DATABASE-QA/job/qa-db-mc-tlog-scripts-rollback/"
    },
    "rollback_microservicios": [
      {
        "nombre_pipeline": "qa-nombre-servicio",
        "rollback_version": "0",
        "url": "http://10.179.20.28:8080/job/central-docker-rollback-qa/"
      }
    ]
  },

  "despliegue_prod": {
    "repositorios_microservicios": [
      "https://bitbucket.org/multicaja-cloud/nombre-repo/src/master/"
    ],
    "repositorios_bd": [
      "https://bitbucket.org/multicaja-cloud/db-mc-tlog/src/master/develop/AAAAMMDD_nombre_proyecto/db/migrations/"
    ],
    "variables_jenkins": [
      { "nombre": "DB_URL_SERVICIO", "valor": "<jdbc:postgresql://HOST_PROD:PUERTO/mc_tlog>" },
      { "nombre": "DB_USER_SERVICIO", "valor": "<USER_MC_TLOG>" },
      { "nombre": "DB_PASS_SERVICIO", "valor": "<PASS_MC_TLOG>" }
    ],
    "plan_microservicios": [
      {
        "nombre_pipeline": "prod-nombre-servicio",
        "version": "1.0.0",
        "url": "http://10.117.1.36:8080/job/prod-nombre-servicio/"
      }
    ],
    "plan_bd": {
      "proyecto": "AAAAMMDD_nombre_proyecto",
      "url": "http://10.117.1.36:8080/job/prod-cd-backoffice-db-mc-tlog-scripts-migrate-up/"
    },
    "rollback_bd": {
      "proyecto": "AAAAMMDD_nombre_proyecto",
      "cantidad_veces": 1,
      "url": "http://10.117.1.36:8080/job/prod-cd-backoffice-db-mc-tlog-scripts-rollback/"
    },
    "rollback_microservicios": [
      {
        "nombre_pipeline": "prod-nombre-servicio",
        "rollback_version": "0",
        "url": "pendiente"
      }
    ],
    "kong_configs": []
  },

  "plan_mitigacion": [
    "Indicar responsable a contactar si el despliegue falla.",
    "Indicar posibles casos de falla y correcciones alternativas."
  ],

  "aprobaciones": {
    "dueno_cambio": "Nombre del dueño del cambio",
    "qa": "Nombre del QA",
    "dba": "Nombre del DBA",
    "deployment": "Nombre del responsable deployment"
  }
}
```

---

## Instrucciones paso a paso

### ETAPA 1 — Crear el RDC al terminar el desarrollo

**Paso 1 — Recopilar datos** desde:
- **Spec de Feature** → descripción, solución, servicios afectados
- **ADR** → tipo de cambio
- **Issues Jira** → HUs que van en el despliegue
- **Ingeniero líder** → nombre y teléfono
- **Componentes** → nombres exactos de microservicios y versiones
- **Repositorios Bitbucket** → URLs de ramas `qa/` de cada componente

**Paso 2 — Construir el JSON** con todos los campos de la sección anterior.

**Paso 3 — Crear la página en Confluence** usando el MCP de Atlassian:
- `cloudId`: `db4dd528-0e0b-4bdf-b3dd-1e2e4e792a43`
- `spaceId`: `2478211099`
- `parentId`: `4393402419`
- `contentFormat`: `html`
- Replicar **fielmente** la estructura del RDC de referencia (BYSF-956): mismos paneles, mismas tablas, mismos checkboxes, collapsibles para QA y PROD.
- Sección "Despliegue Deployment" queda con placeholders — se completa en Etapa 2.
- Estado inicial de componentes PIM: **Pendiente**

**Paso 4 — Despliegue en QA** ← sin CAB. El equipo ejecuta los pipelines según el plan del RDC.

### ETAPA 2 — Completar sección PROD y presentar al CAB

**Paso 5 — Actualizar la página** (usar `updateConfluencePage`) al aprobar la certificación QA:
- Actualizar estado de componentes PIM a **Certificado**
- Completar sección "Despliegue Deployment" con repos `master/`, variables Jenkins PROD, plan PROD y rollback PROD

**Paso 6 — Presentar al CAB** con el RDC completo para aprobación del pase a producción.

**Paso 7 — Checklist pre-PROD**
- [ ] Todos los componentes PIM en estado "Certificado" o "Listo para PROD"
- [ ] URLs pipelines PROD verificadas (10.117.1.36:8080)
- [ ] Repos Bitbucket apuntan a rama `master/`
- [ ] Variables Jenkins PROD completas
- [ ] Rollback PROD documentado para cada componente
- [ ] Aprobaciones firmadas: Dueño Cambio, QA, DBA, Deployment
- [ ] CAB aprobado

---

## Errores comunes

| Error | Solución |
|-------|----------|
| Solicitar CAB para despliegue QA | El CAB **solo aplica para producción**. QA no requiere CAB. |
| Completar sección PROD antes de certificar QA | La sección "Despliegue Deployment" se completa SOLO después de aprobar QA. |
| Repos apuntan a rama incorrecta | Plan QA usa rama `qa/` — Plan PROD usa rama `master/` |
| URL pipeline incorrecta | QA: `10.179.20.28:8080` — PROD: `10.117.1.36:8080` |
| Estado PIM no reconocido | Valores exactos: `Pendiente`, `Error de Despliegue`, `Instalado en QA`, `Certificado`, `Listo para PROD` |
| Estructura del RDC diferente al template | Respetar el orden y paneles del RDC de referencia BYSF-956 |
