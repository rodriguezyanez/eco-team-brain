---
name: web-artifacts-builder
description: Construye dashboards y artefactos web HTML autocontenidos (una sola pagina, sin CDNs, CSP-safe) a partir de un objeto de datos. Genera graficos con SVG y JS vanilla inline (dona, barras, gauges), KPIs y tablas de detalle. Reutilizable en cualquier proyecto; usada por el comando /auditoria para su dashboard de resultados. Estetica accesible, sin dependencias externas.
allowed-tools: Read, Write, Glob, Bash
---

# Web Artifacts Builder — Dashboards HTML autocontenidos

Genera **un unico archivo `.html` autocontenido** a partir de un objeto de datos. Sirve para dashboards de
resultados (auditorias, metricas, reportes) reutilizables en cualquier proyecto. No requiere build, ni Node,
ni Parcel, ni React: es HTML + CSS + JS **inline**.

## Cuando usar

- El dev (o otra skill, como `/auditoria`) necesita visualizar datos como un dashboard: graficos arriba,
  detalle abajo.
- Se quiere un entregable portable que se abra en cualquier navegador sin servidor ni internet.

Para SPAs complejas con routing/estado usa el toolkit oficial React/Vite; aqui el objetivo es un dashboard
estatico de datos, y para eso este enfoque liviano es superior.

## Reglas duras (no negociables)

1. **Autocontenido**: todo el CSS y JS va inline en el `.html`. **Cero** recursos externos: sin `<script src>`,
   sin `<link href>` a CDNs, sin fuentes remotas, sin imagenes por URL. Cualquier asset va como data URI.
2. **CSP-safe**: nada que dependa de red. Los graficos se dibujan con **SVG generado por JS vanilla** o SVG
   estatico; no uses librerias de charts por CDN.
3. **Datos incrustados**: serializa el objeto de datos como `const DATA = { ... }` en un `<script>` inline y
   renderiza desde ahi. Nunca hagas `fetch`.
4. **Responsive**: usa fly/grid con unidades relativas; `max-width:100%` en SVG; tablas anchas dentro de un
   contenedor con `overflow-x:auto` (el body nunca hace scroll horizontal).
5. **Accesible y sobrio** (evitar "AI slop"): fuente de sistema (no Inter por defecto), **sin gradientes
   morados**, sin esquinas uniformemente redondeadas exageradas. Contraste AA. Colores por significado, no
   decorativos.

## Paleta (tokens accesibles, semaforo por estado)

```
--ok:      #1a7f4b   (verde — PASSED/OK/APTO)
--warn:    #b26a00   (ambar — observaciones/medio)
--fail:    #c0392b   (rojo — FAILED/critico/NO APTO)
--info:    #2c5aa0   (azul — neutro/acento)
--ink:     #1c2024   (texto)
--muted:   #5b6470   (texto secundario)
--line:    #e3e6ea   (bordes)
--bg:      #f7f8fa   (fondo pagina)
--card:    #ffffff   (fondo tarjetas)
```

Severidades: CRITICO=`--fail`, ALTO=`#e06c1f`, MEDIO=`--warn`, BAJO=`--info`, SUGERENCIA=`--muted`.

## Contrato de datos (generico)

La skill acepta un objeto con, al menos: un titulo, una fecha, un veredicto/estado global, una lista de
"gates"/indicadores con estado, metricas numericas con umbral, conteos por categoria, y una lista de
hallazgos/filas de detalle con su remediacion. El caso `/auditoria` usa exactamente el JSON del PASO 6.1 de
ese skill (`verdict`, `gates[]`, `metrics{}`, `findingsBySeverity{}`, `findings[]`, `blockers[]`).

## Estructura del dashboard

1. **Header**: titulo, subtitulo (proyecto + fecha + stacks), y **banner de veredicto** con color por estado.
2. **Fila de KPIs / graficos (arriba)**:
   - Tarjetas de estado por gate (pill OK/FAIL con color).
   - **Dona** de hallazgos por severidad.
   - **Gauges** de cobertura y duplicacion vs umbral (verde si cumple, rojo si no).
3. **Detalle (abajo)**:
   - **Tabla de hallazgos**: severidad (badge de color), gate, `archivo:linea`, descripcion y **Como
     solucionar** (remediacion). Dentro de `overflow-x:auto`.
   - **Checklist de bloqueantes**.

## Esqueleto HTML (base a rellenar)

Parte del siguiente esqueleto. Sustituye `__DATA__` por el objeto JSON real y ajusta el render segun los
datos. Los helpers `donut()`, `bars()` y `gauge()` devuelven SVG string y ya son CSP-safe.

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard</title>
<style>
  :root{--ok:#1a7f4b;--warn:#b26a00;--fail:#c0392b;--info:#2c5aa0;--ink:#1c2024;--muted:#5b6470;--line:#e3e6ea;--bg:#f7f8fa;--card:#fff}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  .wrap{max-width:1100px;margin:0 auto;padding:24px}
  h1{font-size:22px;margin:0 0 2px} .sub{color:var(--muted);margin:0 0 16px}
  .verdict{padding:14px 18px;border-radius:8px;color:#fff;font-weight:600;font-size:18px;margin-bottom:20px}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-bottom:20px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px}
  .card h3{margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
  .pill{display:inline-block;padding:3px 10px;border-radius:999px;color:#fff;font-size:12px;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:14px} th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
  th{color:var(--muted);font-size:12px;text-transform:uppercase} .scroll{overflow-x:auto}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;color:#fff;font-size:11px;font-weight:700}
  code{background:#eef1f4;padding:1px 5px;border-radius:4px}
  ul.blockers{list-style:none;padding:0} ul.blockers li{padding:6px 0;border-bottom:1px solid var(--line)}
</style>
</head>
<body>
<div class="wrap">
  <h1 id="title"></h1>
  <p class="sub" id="subtitle"></p>
  <div class="verdict" id="verdict"></div>
  <div class="grid" id="gates"></div>
  <div class="grid">
    <div class="card"><h3>Hallazgos por severidad</h3><div id="donut"></div></div>
    <div class="card"><h3>Cobertura</h3><div id="gaugeCov"></div></div>
    <div class="card"><h3>Duplicacion</h3><div id="gaugeDup"></div></div>
  </div>
  <div class="card"><h3>Detalle de hallazgos</h3><div class="scroll"><table id="findings"></table></div></div>
  <div class="card" style="margin-top:16px"><h3>Bloqueantes para certificar</h3><ul class="blockers" id="blockers"></ul></div>
</div>
<script>
const DATA = __DATA__;
const C={ok:'#1a7f4b',warn:'#b26a00',fail:'#c0392b',info:'#2c5aa0',muted:'#5b6470'};
const SEV={CRITICO:'#c0392b',ALTO:'#e06c1f',MEDIO:'#b26a00',BAJO:'#2c5aa0',SUGERENCIA:'#5b6470'};
const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

// Dona: data = [{label,value,color}]
function donut(data,size=160){
  const tot=data.reduce((s,d)=>s+d.value,0)||1, r=size/2, ir=r*0.6; let a=-Math.PI/2, seg='';
  for(const d of data){ if(d.value<=0) continue; const a2=a+2*Math.PI*d.value/tot;
    const x1=r+r*Math.cos(a),y1=r+r*Math.sin(a),x2=r+r*Math.cos(a2),y2=r+r*Math.sin(a2);
    const xi1=r+ir*Math.cos(a2),yi1=r+ir*Math.sin(a2),xi2=r+ir*Math.cos(a),yi2=r+ir*Math.sin(a);
    const big=(a2-a)>Math.PI?1:0;
    seg+=`<path d="M${x1} ${y1} A${r} ${r} 0 ${big} 1 ${x2} ${y2} L${xi1} ${yi1} A${ir} ${ir} 0 ${big} 0 ${xi2} ${yi2} Z" fill="${d.color}"></path>`; a=a2; }
  const leg=data.map(d=>`<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin:2px 0"><span style="width:10px;height:10px;background:${d.color};border-radius:2px;display:inline-block"></span>${esc(d.label)}: <b>${d.value}</b></div>`).join('');
  return `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${seg}<text x="${r}" y="${r+5}" text-anchor="middle" font-size="20" font-weight="700">${tot}</text></svg><div>${leg}</div></div>`;
}

// Gauge semicircular: val vs umbral. higherIsBetter=true (cobertura) o false (duplicacion)
function gauge(val,threshold,higherIsBetter,unit='%'){
  if(val==null) return '<p style="color:#5b6470">Sin dato</p>';
  const w=200,h=120,r=80,cx=w/2,cy=h; const pct=Math.max(0,Math.min(100,val));
  const ok=higherIsBetter?val>=threshold:val<=threshold; const col=ok?C.ok:C.fail;
  const a=Math.PI*(1-pct/100); const x=cx+r*Math.cos(a),y=cy-r*Math.sin(a);
  const tA=Math.PI*(1-threshold/100),tx=cx+r*Math.cos(tA),ty=cy-r*Math.sin(tA);
  return `<svg width="${w}" height="${h+30}" viewBox="0 0 ${w} ${h+30}">
    <path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="#e3e6ea" stroke-width="14"/>
    <path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${x} ${y}" fill="none" stroke="${col}" stroke-width="14"/>
    <line x1="${tx}" y1="${ty}" x2="${cx+(r-16)*Math.cos(tA)}" y2="${cy-(r-16)*Math.sin(tA)}" stroke="#1c2024" stroke-width="2"/>
    <text x="${cx}" y="${cy-10}" text-anchor="middle" font-size="26" font-weight="700" fill="${col}">${val}${unit}</text>
    <text x="${cx}" y="${h+22}" text-anchor="middle" font-size="12" fill="#5b6470">umbral ${threshold}${unit} ${ok?'✓':'✗'}</text>
  </svg>`;
}

// ---- Render (adaptar a los datos reales) ----
document.getElementById('title').textContent = DATA.title || ('Auditoria — '+(DATA.project||''));
document.getElementById('subtitle').textContent = [DATA.project,DATA.date,(DATA.stacks||[]).join(', ')].filter(Boolean).join(' · ');
const vmap={'APTO':C.ok,'APTO CON OBSERVACIONES':C.warn,'NO APTO':C.fail};
const vEl=document.getElementById('verdict'); vEl.textContent='Veredicto: '+(DATA.verdict||'—'); vEl.style.background=vmap[DATA.verdict]||C.muted;

document.getElementById('gates').innerHTML=(DATA.gates||[]).map(g=>{
  const ok=/^(PASSED|OK)$/i.test(g.status); const col=ok?C.ok:C.fail;
  return `<div class="card"><h3>${esc(g.name)}</h3><span class="pill" style="background:${col}">${esc(g.status)}</span><p class="sub" style="margin:8px 0 0;font-size:12px">Umbral: ${esc(g.threshold)}<br>Fuente: ${esc(g.source)} · ${esc(g.executed)}</p></div>`;
}).join('');

const fbs=DATA.findingsBySeverity||{};
document.getElementById('donut').innerHTML=donut(Object.keys(SEV).map(k=>({label:k,value:fbs[k]||0,color:SEV[k]})));
const m=DATA.metrics||{};
document.getElementById('gaugeCov').innerHTML=gauge(m.coverage,m.coverageThreshold??95,true);
document.getElementById('gaugeDup').innerHTML=gauge(m.duplication,m.duplicationThreshold??3,false);

document.getElementById('findings').innerHTML='<tr><th>Severidad</th><th>Gate</th><th>Ubicacion</th><th>Descripcion</th><th>Como solucionar</th></tr>'+
  (DATA.findings||[]).map(f=>`<tr><td><span class="badge" style="background:${SEV[f.severity]||C.muted}">${esc(f.severity)}</span></td><td>${esc(f.gate)}</td><td><code>${esc(f.location)}</code></td><td>${esc(f.description)}</td><td>${esc(f.remediation)}</td></tr>`).join('');

document.getElementById('blockers').innerHTML=(DATA.blockers||[]).length
  ? DATA.blockers.map(b=>`<li>☐ ${esc(b)}</li>`).join('')
  : '<li style="color:#1a7f4b">Sin bloqueantes ✓</li>';
</script>
</body>
</html>
```

## Procedimiento

1. Recibe/arma el objeto de datos.
2. Toma el esqueleto y reemplaza `__DATA__` por el JSON serializado (JSON valido, no JS con comentarios).
3. Ajusta titulos/secciones si el caso de uso no es una auditoria (el esqueleto es generico; para otros
   dominios cambia las tarjetas de KPI y columnas de la tabla, manteniendo las reglas duras).
4. Escribe el archivo con `Write` en la ruta pedida (por defecto la raiz del proyecto).
5. Abre/verifica mentalmente: sin recursos externos, tabla dentro de `.scroll`, colores por significado.
6. Reporta la ruta del `.html` generado.

## Checklist antes de entregar

- [ ] Cero `src=`/`href=` a dominios externos; cero `fetch`/CDN.
- [ ] `DATA` incrustado y valido; el dashboard renderiza aunque falten campos opcionales (usa `||`/`??`).
- [ ] Tabla ancha dentro de `overflow-x:auto`; sin scroll horizontal del body.
- [ ] Colores semaforo por estado; texto AA; fuente de sistema.
- [ ] La columna "Como solucionar" (remediacion) esta presente en el detalle.
