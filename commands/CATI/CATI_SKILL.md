# SKILL: Generador de Presentación CATI

## Cuándo usar esta skill

Usa esta skill cuando el agente necesite:
- Generar el documento CATI al finalizar la etapa de **diseño técnico** en el flujo SDD.
- Crear o actualizar la presentación para el **Comité de Arquitectura Técnica e Infraestructura (CATI)** de Klap.
- Producir el artefacto `.pptx` listo para presentar antes de iniciar el desarrollo de una iniciativa.

**Trigger típico:** el ingeniero dice "genera el CATI", "prepara la presentación para arquitectura", "completa el artefacto de diseño técnico".

---

## Contexto del proceso SDD

El CATI se ubica **al final de la etapa de diseño técnico** y **antes de comenzar el desarrollo**:

```
HU (PO)  →  Spec de Feature  →  ADR  →  Evaluación Seguridad STRIDE  →  CATI  →  Desarrollo
```

El agente debe haber completado los siguientes artefactos antes de generar el CATI:
- [ ] Spec de Feature aprobada (Confluence)
- [ ] ADR(s) redactado(s) (Confluence)
- [ ] Evaluación de Seguridad STRIDE completada (Confluence)
- [ ] Diagramas técnicos exportados (contexto, secuencia, flujo, infraestructura)
- [ ] Estimación de costos de infraestructura AWS

---

## Estructura de la presentación CATI

| Slide | Contenido |
|-------|-----------|
| 1 | Portada: nombre del proyecto, célula, fecha |
| 2 | Agenda |
| 3 | Propuesta de valor y beneficios para Klap |
| 4 | Alcance de la iniciativa |
| 5 | Diagrama de Contexto |
| 6 | Diagrama de Secuencia — Proceso Diario / Online |
| 7 | Diagrama de Secuencia — Proceso Batch / Mensual |
| 8 | Diagrama de Flujo |
| 9 | Diagrama de Infraestructura propuesta (AWS) |
| 10 | Costos de Infraestructura |
| 11 | (adicional costos si necesario) |
| 12–13 | Requerimientos No Funcionales (tabla STRIDE-aware) |
| 14 | Cierre / Gracias |

---

## Instrucciones paso a paso para el agente

### Paso 1 — Recopilar datos del proyecto

El agente debe construir el archivo `cati_data.json` con la siguiente estructura:

```json
{
  "project_name": "Nombre del Proyecto",
  "date": "DD de Mes del AAAA",
  "squad": "BO y Servicios Financieros",
  "jira_epic": "BYSF-XXX",
  "confluence_spec": "URL de la Spec en Confluence",

  "agenda": ["ítem 1", "ítem 2", "..."],

  "value_proposition": {
    "summary": "Descripción del problema que resuelve.",
    "benefits": [
      "Beneficio 1",
      "Beneficio 2"
    ]
  },

  "scope": {
    "description": "Descripción completa del alcance. Puede ser párrafo largo."
  },

  "diagrams": {
    "context":          "Ruta al archivo de imagen o [placeholder]",
    "sequence_daily":   "Ruta al archivo de imagen o [placeholder]",
    "sequence_monthly": "Ruta al archivo de imagen o [placeholder]",
    "flow":             "Ruta al archivo de imagen o [placeholder]",
    "infrastructure":   "Ruta al archivo de imagen o [placeholder]"
  },

  "infrastructure_costs": [
    {
      "service": "ECS (Fargate)",
      "type": "Cómputo",
      "spec": "2 vCPU, 4 GB RAM x 3 réplicas",
      "monthly_cost_usd": "180"
    }
  ],
  "infrastructure_total_usd": "805",

  "nfr": [
    {
      "category": "Disponibilidad",
      "req": "SLA del servicio",
      "value": "99.9% uptime mensual",
      "applies": true,
      "status": "Pendiente"
    }
  ]
}
```

**Categorías válidas para NFR:** `Disponibilidad`, `Rendimiento`, `Seguridad`, `Escalabilidad`, `Monitoreo`, `Otros`.

**Fuentes de datos para el agente:**
- Extraer `project_name`, `jira_epic`, `value_proposition`, `scope` desde la **Spec de Feature** en Confluence.
- Extraer decisiones técnicas desde los **ADR** para reflejarlas en NFR y diagramas.
- Extraer amenazas STRIDE desde la **Evaluación de Seguridad** para alimentar la sección NFR de seguridad.
- Obtener costos desde la estimación AWS o documentación de arquitectura.

---

### Paso 2 — Preparar diagramas

Los diagramas se insertan como placeholders por defecto. Para insertar imágenes reales:

1. Exportar cada diagrama desde Confluence / Lucidchart / Draw.io como PNG o JPG.
2. Guardar en el directorio de trabajo con nombres estándar:
   - `diagram_context.png`
   - `diagram_sequence_daily.png`
   - `diagram_sequence_monthly.png`
   - `diagram_flow.png`
   - `diagram_infrastructure.png`
3. Actualizar los campos `diagrams.*` en `cati_data.json` con las rutas.

---

### Paso 3 — Ejecutar el generador

```bash
# Instalar dependencia (solo la primera vez)
npm install -g pptxgenjs

# Generar con datos reales
node generate-cati.js --data cati_data.json --output CATI_NombreProyecto.pptx

# Generar template vacío (para comenzar a llenar manualmente)
node generate-cati.js --template --output CATI_TEMPLATE.pptx
```

El script `generate-cati.js` se encuentra junto a este `SKILL.md`.

---

### Paso 4 — Validar el output

```bash
# Verificar contenido textual
extract-text CATI_NombreProyecto.pptx

# Verificar visualmente
python3 scripts/thumbnail.py CATI_NombreProyecto.pptx
```

Revisar que:
- [ ] Nombre del proyecto correcto en portada y metadatos
- [ ] Fecha actualizada
- [ ] Costos coherentes con la estimación aprobada
- [ ] NFR todos con `value` completado (no dice "[ completar ]")
- [ ] Diagramas insertados (no dice "📌 Insertar diagrama aquí")
- [ ] Número de slides correcto (mínimo 14)

---

### Paso 5 — Subir a Confluence (opcional)

```bash
# Adjuntar el PPTX como attachment en la página de la Spec de Feature
# usando el MCP de Atlassian disponible en el agente
```

El agente puede usar el MCP de Atlassian para adjuntar el archivo PPTX generado a la página de la Spec correspondiente en Confluence.

---

## Checklist de completitud antes de presentar al CATI

- [ ] Spec de Feature aprobada y vinculada
- [ ] Todos los diagramas insertados (no placeholders)
- [ ] Costos de infraestructura validados con arquitectura
- [ ] Requerimientos no funcionales completos (sin "Pendiente" en columna Estado)
- [ ] Evaluación STRIDE adjunta o vinculada
- [ ] ADR(s) documentados y vinculados
- [ ] Presentación revisada por el ingeniero líder y el PO

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot find module 'pptxgenjs'` | pptxgenjs no instalado | `npm install -g pptxgenjs` |
| `ENOENT: cati_data.json` | Archivo de datos no existe | Crear el JSON con los datos del proyecto |
| Placeholders en el output | Campos no completados en JSON | Completar todos los campos del JSON |
| Diagramas en blanco | Ruta de imagen incorrecta | Verificar rutas en `diagrams.*` |

---

## Paleta de colores Klap (referencia)

| Color | Hex | Uso |
|-------|-----|-----|
| Navy | `#002B49` | Fondo portada, headers, tabla headers |
| Verde | `#26D07C` | Acento, íconos, logo "lap" |
| Blanco | `#FFFFFF` | Fondo contenido, texto sobre navy |
| Gris claro | `#F4F6F8` | Fondo alternativo slides |
| Gris texto | `#5A6A7A` | Texto secundario |
