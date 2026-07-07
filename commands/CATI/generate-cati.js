#!/usr/bin/env node
/**
 * Generador de presentación CATI — Comité de Arquitectura Técnica e Infraestructura
 * Klap — Diseño Técnico SDD
 *
 * Uso:
 *   node generate-cati.js --data data.json --output CATI_MiProyecto.pptx
 *   node generate-cati.js --template   (genera el PPTX vacío con placeholders)
 *
 * El JSON de entrada sigue el esquema definido en SKILL.md
 */

const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ─── Paleta Klap (extraída del original) ────────────────────────────────────
const C = {
  navy:      "002B49",  // Fondo portada / cierre
  green:     "26D07C",  // Acento principal
  white:     "FFFFFF",
  lightBg:   "F4F6F8",  // Fondo slides de contenido
  textDark:  "002B49",
  textGray:  "5A6A7A",
  borderGray:"D0D7DE",
  tableHead: "002B49",
  tableRow1: "FFFFFF",
  tableRow2: "EEF2F6",
  risk_high: "E53E3E",
  risk_med:  "DD6B20",
  risk_low:  "38A169",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ph(text) {
  // Devuelve placeholder si no hay valor
  return text || "[ completar ]";
}

function slideHeader(slide, title, subtitle) {
  // Barra superior navy con título
  slide.addShape("rect", {
    x: 0, y: 0, w: 10, h: 0.7,
    fill: { color: C.navy }, line: { color: C.navy }
  });
  // Triángulo verde decorativo (chevron) — ícono de marca
  slide.addShape("rect", {
    x: 0.3, y: 0.18, w: 0.06, h: 0.34,
    fill: { color: C.green }, line: { color: C.green }
  });
  slide.addText(title, {
    x: 0.5, y: 0.05, w: 7.5, h: 0.55,
    fontSize: 16, bold: true, color: C.white,
    fontFace: "Calibri", valign: "middle", margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.05, w: 9, h: 0.55,
      fontSize: 11, color: "26D07C",
      fontFace: "Calibri", valign: "middle", align: "right", margin: 0
    });
  }
  // Logo klap (texto estilizado — en producción reemplazar con imagen)
  slide.addText([
    { text: "k", options: { color: C.white, bold: true } },
    { text: "lap", options: { color: C.green, bold: true } }
  ], {
    x: 8.8, y: 0.1, w: 1, h: 0.5,
    fontSize: 20, fontFace: "Calibri", align: "right", margin: 0
  });
  // Número de slide (pie)
  slide.addShape("rect", {
    x: 0, y: 5.45, w: 10, h: 0.18,
    fill: { color: C.navy }, line: { color: C.navy }
  });
}

function pageNumber(slide, num) {
  slide.addText(String(num), {
    x: 0, y: 5.42, w: 10, h: 0.2,
    fontSize: 9, color: C.white, align: "center",
    fontFace: "Calibri", margin: 0
  });
}

// ─── Slides ──────────────────────────────────────────────────────────────────

function addCoverSlide(pres, d) {
  const slide = pres.addSlide();
  // Fondo navy
  slide.background = { color: C.navy };

  // Franja verde central
  slide.addShape("rect", {
    x: 0, y: 2.7, w: 10, h: 0.12,
    fill: { color: C.green }, line: { color: C.green }
  });

  // Título del proyecto
  slide.addText(ph(d.project_name), {
    x: 0.6, y: 1.1, w: 8.8, h: 1.2,
    fontSize: 36, bold: true, color: C.white,
    fontFace: "Calibri", valign: "bottom", margin: 0
  });

  // Subtítulo "Presentación CATI"
  slide.addText("Presentación CATI", {
    x: 0.6, y: 2.35, w: 8, h: 0.45,
    fontSize: 14, color: C.green,
    fontFace: "Calibri", margin: 0
  });

  // Fecha
  slide.addText(ph(d.date), {
    x: 0.6, y: 4.8, w: 8, h: 0.4,
    fontSize: 11, color: C.white,
    fontFace: "Calibri", margin: 0
  });

  // Logo
  slide.addText([
    { text: "k", options: { color: C.white, bold: true } },
    { text: "lap", options: { color: C.green, bold: true } }
  ], {
    x: 8.5, y: 4.8, w: 1.2, h: 0.5,
    fontSize: 24, fontFace: "Calibri", align: "right", margin: 0
  });

  slide.addNotes("Slide de portada. Completar nombre del proyecto, célula y fecha antes de presentar al CATI.");
}

function addAgendaSlide(pres, d) {
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  slideHeader(slide, "AGENDA", "");
  pageNumber(slide, 2);

  const items = d.agenda || [
    "Propuesta de valor",
    "Alcance de la iniciativa",
    "¿Cómo será la implementación?",
    "Diagramas técnicos",
    "Costos de infraestructura",
    "Requerimientos no funcionales"
  ];

  items.forEach((item, i) => {
    const y = 0.9 + i * 0.7;
    // Número en círculo verde
    slide.addShape("ellipse", {
      x: 0.4, y: y, w: 0.45, h: 0.45,
      fill: { color: C.green }, line: { color: C.green }
    });
    slide.addText(String(i + 1), {
      x: 0.4, y: y, w: 0.45, h: 0.45,
      fontSize: 14, bold: true, color: C.white,
      fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    slide.addText(item, {
      x: 1.0, y: y + 0.03, w: 8.5, h: 0.4,
      fontSize: 15, color: C.textDark,
      fontFace: "Calibri", valign: "middle", margin: 0
    });
  });

  slide.addNotes("Agenda de la presentación CATI. Ajustar según el contenido real del proyecto.");
}

function addValueSlide(pres, d) {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slideHeader(slide, "Propuesta de valor", "");
  pageNumber(slide, 3);

  slide.addText(ph(d.value_proposition?.summary), {
    x: 0.4, y: 0.85, w: 9.2, h: 0.6,
    fontSize: 13, color: C.textGray,
    fontFace: "Calibri", margin: 0
  });

  const benefits = d.value_proposition?.benefits || [
    "Monitoreo del proceso en puntos críticos",
    "Desacoplamiento de los procesos sistémicos",
    "Aislamiento de los problemas, facilitando su resolución",
    "Automatización de procesos y reducción de tareas manuales",
    "Escalabilidad"
  ];

  slide.addText("Beneficios para Klap", {
    x: 0.4, y: 1.5, w: 9, h: 0.35,
    fontSize: 13, bold: true, color: C.textDark,
    fontFace: "Calibri", margin: 0
  });

  slide.addText(
    benefits.map(b => ({ text: b, options: { bullet: true, breakLine: true, color: C.textDark } })),
    {
      x: 0.4, y: 1.9, w: 9.2, h: 3.2,
      fontSize: 13, fontFace: "Calibri",
      paraSpaceAfter: 6
    }
  );

  slide.addNotes("Describir los beneficios de negocio y técnicos que justifican la iniciativa ante el comité.");
}

function addScopeSlide(pres, d) {
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  slideHeader(slide, "Alcance de la Iniciativa", "");
  pageNumber(slide, 4);

  slide.addText(ph(d.scope?.description), {
    x: 0.4, y: 0.85, w: 9.2, h: 3.8,
    fontSize: 13, color: C.textDark,
    fontFace: "Calibri", margin: 0, valign: "top"
  });

  slide.addNotes("Definir claramente el alcance: qué incluye el proyecto, qué queda fuera, integraciones clave y dependencias.");
}

function addDiagramSlide(pres, d, title, subtitle, noteText, pageNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  slideHeader(slide, title, subtitle);
  pageNumber(slide, pageNum);

  // Área de diagrama con borde punteado — placeholder para imagen/diagrama
  slide.addShape("rect", {
    x: 0.4, y: 0.85, w: 9.2, h: 4.3,
    fill: { color: "F8FAFB" },
    line: { color: C.borderGray, dashType: "dash", width: 1 }
  });

  slide.addText([
    { text: "📌 Insertar diagrama aquí\n", options: { bold: true, breakLine: true, color: C.textGray } },
    { text: noteText, options: { color: C.textGray, fontSize: 11 } }
  ], {
    x: 0.4, y: 0.85, w: 9.2, h: 4.3,
    fontSize: 13, fontFace: "Calibri",
    align: "center", valign: "middle"
  });

  slide.addNotes(`Insertar el diagrama correspondiente: ${subtitle}. Exportar desde Lucidchart, Draw.io o Confluence y pegar como imagen.`);
}

function addInfrastructureCostSlide(pres, d, pageNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  slideHeader(slide, "Costos de Infraestructura", "");
  pageNumber(slide, pageNum);

  const costs = d.infrastructure_costs || [];

  if (costs.length === 0) {
    slide.addText("[ Completar con estimación de costos de infraestructura AWS / cloud ]", {
      x: 0.4, y: 1.0, w: 9.2, h: 1.0,
      fontSize: 13, color: C.textGray, fontFace: "Calibri"
    });
  } else {
    // Tabla de costos
    const header = [
      { text: "Servicio", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      { text: "Tipo", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      { text: "Especificación", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      { text: "Costo mensual (USD)", options: { bold: true, color: C.white, fill: { color: C.navy } } },
    ];

    const rows = [header, ...costs.map((c, i) => [
      { text: c.service || "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 } } },
      { text: c.type || "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 } } },
      { text: c.spec || "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 } } },
      { text: c.monthly_cost_usd || "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 }, align: "right" } },
    ])];

    slide.addTable(rows, {
      x: 0.4, y: 0.85, w: 9.2,
      fontSize: 11, fontFace: "Calibri",
      border: { pt: 0.5, color: C.borderGray },
      colW: [2.2, 1.5, 3.5, 2.0]
    });

    const total = d.infrastructure_total_usd;
    if (total) {
      slide.addText(`Total estimado ambiente PROD: USD ${total}/mes`, {
        x: 0.4, y: 4.9, w: 9.2, h: 0.4,
        fontSize: 12, bold: true, color: C.navy,
        fontFace: "Calibri", align: "right", margin: 0
      });
    }
  }

  slide.addNotes("Completar con la estimación de costos de infraestructura AWS. Incluir todos los servicios: ECS, RDS, Lambda, S3, MSK (Kafka), etc.");
}

function addNFRSlide(pres, d, pageNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  slideHeader(slide, "Requerimientos No Funcionales", "");
  pageNumber(slide, pageNum);

  const nfrs = d.nfr || [];

  const categories = {
    "Disponibilidad":  [],
    "Rendimiento":     [],
    "Seguridad":       [],
    "Escalabilidad":   [],
    "Monitoreo":       [],
    "Otros":           []
  };

  nfrs.forEach(n => {
    const cat = n.category || "Otros";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(n);
  });

  const header = [
    { text: "Categoría", options: { bold: true, color: C.white, fill: { color: C.navy } } },
    { text: "Requerimiento", options: { bold: true, color: C.white, fill: { color: C.navy } } },
    { text: "Valor / Descripción", options: { bold: true, color: C.white, fill: { color: C.navy } } },
    { text: "S", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
    { text: "N", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
    { text: "Estado", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
  ];

  const defaultNFRs = [
    { category: "Disponibilidad",  req: "SLA del servicio",               value: "99.9% uptime mensual",              applies: true,  status: "Pendiente" },
    { category: "Disponibilidad",  req: "RTO (Recovery Time Objective)",  value: "< 4 horas",                         applies: true,  status: "Pendiente" },
    { category: "Disponibilidad",  req: "RPO (Recovery Point Objective)", value: "< 1 hora",                          applies: true,  status: "Pendiente" },
    { category: "Rendimiento",     req: "Latencia P95",                   value: "< 500ms por transacción",           applies: true,  status: "Pendiente" },
    { category: "Rendimiento",     req: "Throughput máximo",              value: "[ TPS esperado ]",                  applies: true,  status: "Pendiente" },
    { category: "Seguridad",       req: "Autenticación",                  value: "JWT / OAuth2, roles por servicio",  applies: true,  status: "Pendiente" },
    { category: "Seguridad",       req: "Cifrado en tránsito",            value: "TLS 1.2+",                          applies: true,  status: "Pendiente" },
    { category: "Seguridad",       req: "Cifrado en reposo",              value: "AES-256 para datos PCI",            applies: true,  status: "Pendiente" },
    { category: "Seguridad",       req: "SAST en pipeline",               value: "SonarQube, umbral definido",        applies: true,  status: "Pendiente" },
    { category: "Escalabilidad",   req: "Escalamiento horizontal",        value: "Auto-scaling en ECS / Lambda",      applies: true,  status: "Pendiente" },
    { category: "Escalabilidad",   req: "Multi-datacenter / HA",          value: "2 datacenters activos",             applies: true,  status: "Pendiente" },
    { category: "Monitoreo",       req: "APM / Trazabilidad",             value: "Datadog / CloudWatch configurado",  applies: true,  status: "Pendiente" },
    { category: "Monitoreo",       req: "Alertas de negocio",             value: "Umbrales definidos por servicio",   applies: true,  status: "Pendiente" },
  ];

  const source = nfrs.length > 0 ? nfrs : defaultNFRs;

  const rows = [header, ...source.map((n, i) => [
    { text: n.category || "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 }, bold: true, color: C.navy } },
    { text: n.req || n.requirement || "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 } } },
    { text: n.value || n.description || "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 } } },
    { text: n.applies !== false ? "✓" : "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 }, align: "center", color: C.green, bold: true } },
    { text: n.applies === false ? "✓" : "", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 }, align: "center" } },
    { text: n.status || "Pendiente", options: { fill: { color: i % 2 === 0 ? C.tableRow1 : C.tableRow2 }, align: "center", color: C.textGray } },
  ])];

  slide.addTable(rows, {
    x: 0.3, y: 0.82, w: 9.4,
    fontSize: 9, fontFace: "Calibri",
    border: { pt: 0.5, color: C.borderGray },
    colW: [1.5, 2.2, 2.8, 0.5, 0.5, 1.4]
  });

  slide.addNotes("Completar la columna 'Valor / Descripción' con los valores reales del proyecto. Marcar S (Sí aplica) o N (No aplica) para cada requerimiento.");
}

function addClosingSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: C.navy };

  slide.addShape("rect", {
    x: 0, y: 2.55, w: 10, h: 0.12,
    fill: { color: C.green }, line: { color: C.green }
  });

  slide.addText("¡GRACIAS!", {
    x: 0, y: 1.8, w: 10, h: 1.0,
    fontSize: 40, bold: true, color: C.white,
    fontFace: "Calibri", align: "center", valign: "middle", margin: 0
  });

  slide.addText([
    { text: "k", options: { color: C.white, bold: true } },
    { text: "lap", options: { color: C.green, bold: true } }
  ], {
    x: 8.5, y: 4.9, w: 1.2, h: 0.5,
    fontSize: 24, fontFace: "Calibri", align: "right", margin: 0
  });

  slide.addNotes("Slide de cierre. Espacio para preguntas del comité CATI.");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const templateMode = args.includes("--template");
  const dataIdx = args.indexOf("--data");
  const outIdx = args.indexOf("--output");

  let d = {};
  if (!templateMode && dataIdx >= 0 && args[dataIdx + 1]) {
    const dataPath = path.resolve(args[dataIdx + 1]);
    d = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  }

  const outputFile = outIdx >= 0 && args[outIdx + 1]
    ? args[outIdx + 1]
    : (templateMode ? "CATI_TEMPLATE.pptx" : "CATI_output.pptx");

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Claude Code — SDD CATI Generator";
  pres.title = d.project_name || "Presentación CATI";

  // Slide 1 — Portada
  addCoverSlide(pres, d);

  // Slide 2 — Agenda
  addAgendaSlide(pres, d);

  // Slide 3 — Propuesta de valor
  addValueSlide(pres, d);

  // Slide 4 — Alcance
  addScopeSlide(pres, d);

  // Slide 5 — Diagrama de contexto
  addDiagramSlide(pres, d,
    "¿Cómo será la implementación?", "Diagrama de Contexto",
    "Insertar diagrama de contexto del sistema: actores externos, integraciones y flujos de datos principales.",
    5
  );

  // Slide 6 — Diagrama de secuencia diario (o proceso principal)
  addDiagramSlide(pres, d,
    "¿Cómo será la implementación?", "Diagrama de Secuencia — Proceso Diario",
    "Insertar diagrama de secuencia del proceso diario/online: servicios involucrados, mensajes y orden de llamadas.",
    6
  );

  // Slide 7 — Diagrama de secuencia mensual / batch
  addDiagramSlide(pres, d,
    "¿Cómo será la implementación?", "Diagrama de Secuencia — Proceso Batch / Mensual",
    "Insertar diagrama de secuencia del proceso batch o mensual. Incluir manejo de errores y reintentos.",
    7
  );

  // Slide 8 — Diagrama de flujo
  addDiagramSlide(pres, d,
    "¿Cómo será la implementación?", "Diagrama de Flujo",
    "Insertar diagrama de flujo end-to-end del proceso de negocio. Incluir puntos de decisión y caminos alternativos.",
    8
  );

  // Slide 9 — Infraestructura
  addDiagramSlide(pres, d,
    "¿Cómo será la implementación?", "Diagrama de Infraestructura Propuesta",
    "Insertar diagrama de infraestructura AWS: ECS, RDS, Lambda, S3, MSK, API Gateway, balanceadores, VPC.",
    9
  );

  // Slide 10-11 — Costos de infraestructura
  addInfrastructureCostSlide(pres, d, 10);

  // Slide 12-13 — Requerimientos no funcionales
  addNFRSlide(pres, d, 12);

  // Slide 14 — Cierre
  addClosingSlide(pres);

  await pres.writeFile({ fileName: outputFile });
  console.log(`✅ PPTX generado: ${outputFile}`);
}

main().catch(err => {
  console.error("❌ Error generando PPTX:", err.message);
  process.exit(1);
});
