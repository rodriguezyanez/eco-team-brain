# SKILL: Creación de Historia de Usuario — SDD

## Cuándo usar esta skill

Usa esta skill cuando el agente necesite:
- Crear una **Historia de Usuario (HU)** a partir de una necesidad de negocio.
- El PO o interesado dice: "crea una HU", "necesito una historia de usuario", "registra este requerimiento".

**Posición en el flujo SDD:**
```
[SKILL-HU] → Spec de Feature → ADR → STRIDE → CATI → Desarrollo → RDC → PROD
```

---

## Prerequisitos — preguntar siempre antes de comenzar

El agente debe obtener estos datos del PO **antes** de iniciar la elicitación:

| Dato | Por qué se necesita |
|------|-------------------|
| **Proyecto Jira** | Las HU no son solo del proyecto BYSF — pueden ser de cualquier proyecto. El PO lo indica. |
| **Épica GOBI** | Toda HU debe vincularse a una épica de Gobierno de Iniciativas. Pedir el código (ej: GOBI-1076). |
| **spaceId Confluence** | Los artefactos se crean en el espacio del equipo dueño del proyecto, no siempre en bysf. |

---

## Infraestructura de referencia (bysf)

```
cloudId:              db4dd528-0e0b-4bdf-b3dd-1e2e4e792a43
Template HU pageId:   5465145369
URL template:         https://multicaja-cloud.atlassian.net/wiki/spaces/bysf/pages/5465145369
```

> Para otros espacios, el agente debe obtener el `spaceId` del equipo correspondiente.

---

## Paso 1 — Elicitación guiada con DOR integrado

La elicitación se hace en **dos niveles simultáneos** en una conversación con el PO.
No hacer todas las preguntas de golpe — ir por bloques temáticos y adaptar según las respuestas.

### Nivel 1 — Criterios INVEST (DOR)

| Criterio | Pregunta al PO |
|----------|---------------|
| **I** — Independiente | ¿Esta historia puede desarrollarse sin depender de otra que no esté terminada? |
| **N** — Negociable | ¿El "cómo" está sin definir, dejando libertad al equipo técnico para elegir la solución? |
| **V** — Valor | ¿Qué valor concreto aporta y a quién? ¿Puedes calificarlo como Alto / Medio / Bajo? |
| **E** — Estimable | ¿El equipo tiene suficiente información para estimar el esfuerzo? |
| **S** — Small | ¿Cabe en un sprint? (referencia: menos de 13 puntos) Si no, ¿podemos dividirla? |
| **T** — Testeable | ¿Podemos verificar que está lista con criterios de aceptación Dado/Cuando/Entonces? |

### Nivel 2 — Extensibilidad y modelo de negocio

Estas preguntas son críticas porque el modelo de negocio determina el comportamiento del sistema,
que determina los criterios de aceptación. Sus respuestas se convierten directamente en CA de la HU.

```
¿Este requerimiento aplica solo a este caso específico,
o puede extenderse a otros actores / clientes / bancos / negocios en el futuro?

¿El volumen de datos o transacciones puede escalar significativamente?

¿Hay variantes de comportamiento previsibles según el tipo de usuario o contexto?

¿El sistema debe soportar múltiples instancias o ser multi-tenant?
```

> **Regla:** Las respuestas de extensibilidad se capturan como criterios de aceptación
> adicionales en la HU y como contexto para el ingeniero en la Etapa 2 (Spec ligera).

---

## Paso 2 — Construir el JSON de datos

Con las respuestas del PO, construir el siguiente JSON antes de crear cualquier artefacto:

```json
{
  "proyecto_jira": "BYSF",
  "epica_gobi": "GOBI-XXXX",
  "space_id_confluence": "2478211099",
  "titulo": "[PROYECTO-XXX] Nombre descriptivo de la historia",

  "necesidad_negocio": "Descripción del contexto de negocio: qué problema resuelve, para qué proceso o cliente, y por qué es relevante ahora.",

  "hu": {
    "rol": "rol del usuario o sistema",
    "necesita": "acción o funcionalidad concreta",
    "para": "beneficio o valor esperado"
  },

  "criterios_aceptacion": [
    {
      "nro": 1,
      "escenario": "Nombre del escenario principal",
      "dado_que": "estado inicial o condición",
      "cuando": "acción del usuario o sistema",
      "entonces": "resultado observable y verificable"
    },
    {
      "nro": 2,
      "escenario": "Escenario alternativo",
      "dado_que": "...",
      "cuando": "...",
      "entonces": "..."
    },
    {
      "nro": 3,
      "escenario": "Escenario de error o borde — incluir uno por extensibilidad si aplica",
      "dado_que": "...",
      "cuando": "...",
      "entonces": "..."
    }
  ],

  "tareas_notas": [
    { "tarea": "Descripción de tarea o nota técnica", "detalle": "Detalle adicional" }
  ],

  "mock": {
    "link": "",
    "estado": "Pendiente"
  },

  "extensibilidad": "Resumen de las respuestas del PO sobre el alcance futuro del sistema. Ej: Se anticipa integración con otros bancos → patrón Strategy en Etapa 2.",

  "valor": "Alto | Medio | Bajo",
  "invest_cumplido": true
}
```

---

## Paso 3 — Crear el issue en Jira

Usar MCP Jira para crear el issue con los siguientes campos:

```
project:     {proyecto_jira del JSON}
issuetype:   Historia (o Story)
summary:     {titulo del JSON}
description: Formato Atlassian Document Format (ADF) con las secciones:
             - Necesidad de Negocio
             - Como / Necesito / Para
             - Criterios de Aceptación (tabla Dado/Cuando/Entonces)
             - Extensibilidad (contexto para el equipo técnico)
parent/epic: {epica_gobi del JSON}
labels:      ["SDD", "lean"]
```

**Formato de la descripción en Jira (ADF simplificado):**

```
**Necesidad de Negocio**
{necesidad_negocio}

**Historia de Usuario**
Como {hu.rol}
Necesito {hu.necesita}
Para {hu.para}

**Criterios de Aceptación**
CA-01: {escenario}
  Dado que {dado_que}
  Cuando {cuando}
  Entonces {entonces}

CA-02: ...
CA-03: ...

**Contexto de Extensibilidad**
{extensibilidad}
```

> **Convención de identificadores:** Los criterios de aceptación se numeran como `CA-01`, `CA-02`, etc.
> Los casos límite identificados se numeran como `CL-01`, `CL-02`, etc.
> Estos identificadores los usa el orquestador de Etapa 5 para trazabilidad en los tests.

---

## Paso 4 — Crear la página en Confluence

Crear la página usando el **HTML exacto del template** definido a continuación,
reemplazando los placeholders con los datos del JSON.

**Parámetros de creación:**
```
cloudId:       db4dd528-0e0b-4bdf-b3dd-1e2e4e792a43  (o el del equipo)
spaceId:       {space_id_confluence del JSON}
parentId:      ID de la carpeta SDD del equipo (preguntar si no se conoce)
contentFormat: html
title:         {titulo del JSON}
```

**HTML del template (replicar fielmente):**

```html
<div data-type="panel-info">
  <p><strong>Instrucción de uso:</strong> Esta página fue generada por el agente SDD.
  Revisa cada sección y ajusta si es necesario antes de aprobarla para refinamiento.</p>
</div>

<h2>Necesidad de Negocio</h2>
<p>{necesidad_negocio}</p>

<h2>Especificación de Historia de Usuario</h2>
<table>
  <thead>
    <tr>
      <th><p><strong>Rol</strong></p></th>
      <th><p><strong>Característica / Funcionalidad</strong></p></th>
      <th><p><strong>Razón / Resultado</strong></p></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><p><strong>Como</strong> {hu.rol}</p></td>
      <td><p><strong>Necesito</strong> {hu.necesita}</p></td>
      <td><p><strong>Para</strong> {hu.para}</p></td>
    </tr>
  </tbody>
</table>

<h2>Criterios de Aceptación</h2>
<table>
  <thead>
    <tr>
      <th><p><strong>N°</strong></p></th>
      <th><p><strong>Escenario</strong></p></th>
      <th><p><strong>Contexto</strong></p></th>
      <th><p><strong>Evento</strong></p></th>
      <th><p><strong>Resultado Esperado</strong></p></th>
    </tr>
  </thead>
  <tbody>
    <!-- Repetir por cada criterio de aceptación -->
    <tr>
      <td><p>{CA-nro}</p></td>
      <td><p>{escenario}</p></td>
      <td><p><strong>Dado que</strong> {dado_que}</p></td>
      <td><p><strong>Cuando</strong> {cuando}</p></td>
      <td><p><strong>Entonces</strong> {entonces}</p></td>
    </tr>
  </tbody>
</table>

<h2>Tareas / Funcionalidades / Notas</h2>
<table>
  <thead>
    <tr>
      <th><p><strong>Tarea / Nota</strong></p></th>
      <th><p><strong>Detalle</strong></p></th>
    </tr>
  </thead>
  <tbody>
    <!-- Repetir por cada tarea/nota -->
    <tr>
      <td><p>{tarea}</p></td>
      <td><p>{detalle}</p></td>
    </tr>
  </tbody>
</table>

<h2>Mock / Prototipo</h2>
<div data-type="panel-note">
  <p><em>Sección SDD lean — completar antes de iniciar el desarrollo.
  Adjuntar link de Figma o HTML mock validado con el PO.</em></p>
</div>
<table>
  <thead>
    <tr>
      <th><p><strong>Artefacto</strong></p></th>
      <th><p><strong>Link</strong></p></th>
      <th><p><strong>Estado</strong></p></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><p>Wireframe / Mock Figma</p></td>
      <td><p>{mock.link}</p></td>
      <td><p><span data-type="status" data-color="yellow">Pendiente</span></p></td>
    </tr>
  </tbody>
</table>

<h2>Contexto de Extensibilidad</h2>
<div data-type="panel-note">
  <p><em>Esta sección es insumo para el ingeniero en la Etapa 2 (Spec ligera).
  Refleja las decisiones de modelo de negocio que impactan el diseño técnico.</em></p>
</div>
<p>{extensibilidad}</p>

<h2>Vinculaciones</h2>
<table>
  <thead>
    <tr>
      <th><p><strong>Tipo</strong></p></th>
      <th><p><strong>Referencia</strong></p></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><p>Issue Jira</p></td>
      <td><p><a href="https://multicaja-cloud.atlassian.net/browse/{issue_key}"
               data-card-appearance="inline">{issue_key}</a></p></td>
    </tr>
    <tr>
      <td><p>Épica GOBI</p></td>
      <td><p><a href="https://multicaja-cloud.atlassian.net/browse/{epica_gobi}"
               data-card-appearance="inline">{epica_gobi}</a></p></td>
    </tr>
    <tr>
      <td><p>Spec de Feature</p></td>
      <td><p>[Pendiente — se vincula en Etapa 2]</p></td>
    </tr>
    <tr>
      <td><p>ADR relacionado</p></td>
      <td><p>[Pendiente — se vincula en Etapa 2]</p></td>
    </tr>
  </tbody>
</table>

<h2>Estado de la Historia</h2>
<p>
  <span data-type="status" data-color="blue">Borrador</span>
  &nbsp;→&nbsp;
  <span data-type="status" data-color="yellow">En refinamiento</span>
  &nbsp;→&nbsp;
  <span data-type="status" data-color="green">Lista para sprint (DoR cumplido)</span>
  &nbsp;→&nbsp;
  <span data-type="status" data-color="red">Bloqueada</span>
</p>
```

---

## Paso 5 — Actualizar la vinculación Jira ↔ Confluence

Una vez creada la página en Confluence, actualizar el issue Jira con el link de la página:

```
Agregar en la descripción o en un campo de link del issue:
"Página Confluence: {url_de_la_pagina_creada}"
```

---

## Paso 6 — Verificación DOR antes de cerrar

Antes de declarar la HU como lista, verificar el checklist INVEST:

```
[ ] I — La HU puede desarrollarse de forma independiente
[ ] N — El "cómo" está sin prescribir (libertad técnica)
[ ] V — El valor de negocio está explícito y calificado (Alto/Medio/Bajo)
[ ] E — El equipo tiene suficiente contexto para estimar
[ ] S — Cabe en un sprint (< 13 puntos estimados)
[ ] T — Todos los CA tienen Dado/Cuando/Entonces verificables
[ ] Extensibilidad documentada en la sección correspondiente
[ ] Issue Jira creado y vinculado a la épica GOBI
[ ] Página Confluence creada y vinculada al issue Jira
```

Si algún ítem falla → iterar con el PO antes de avanzar a Etapa 2.

---

## Salidas de esta skill

| Artefacto | Ubicación | Estado al salir |
|-----------|-----------|----------------|
| Issue HU | Jira — proyecto indicado por el PO, vinculado a épica GOBI | Creado, con CA-XX y CL-XX |
| Página HU | Confluence — espacio del equipo dueño del proyecto | Borrador, vinculada al issue |
| JSON de contexto | Contexto del agente (no persiste en archivo) | Disponible para Etapa 2 |

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Crear la HU en el proyecto BYSF siempre | Asumir el proyecto | Siempre preguntar al PO en qué proyecto crear |
| No vincular a la épica GOBI | Olvidar el prerequisito | El GOBI es obligatorio — si el PO no lo tiene, bloquearse hasta obtenerlo |
| CA sin Dado/Cuando/Entonces completo | Elicitación incompleta | No avanzar hasta que los tres campos estén definidos |
| Extensibilidad no capturada | Saltarse el nivel 2 de elicitación | Las preguntas de extensibilidad son obligatorias — definen el diseño técnico en Etapa 2 |
| Página Confluence en espacio incorrecto | Asumir el spaceId | Preguntar si no es inferible del proyecto Jira |

---

## Referencia de template

- **Template Confluence:** https://multicaja-cloud.atlassian.net/wiki/spaces/bysf/pages/5465145369
- **pageId template:** `5465145369`
- **Estructura base:** Necesidad de Negocio → HU (Como/Necesito/Para) → Criterios de Aceptación (tabla N°/Escenario/Dado/Cuando/Entonces) → Tareas/Notas → Mock/Prototipo → Extensibilidad → Vinculaciones → Estado
