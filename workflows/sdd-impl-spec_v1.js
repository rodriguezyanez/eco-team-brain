export const meta = {
  name: 'sdd-impl-spec',
  description: 'SDD Implementación: Fase 4 TDD + Security Gate + Verificación con reanudación automática',
  phases: [
    { title: 'Leer Spec',     detail: 'Leer spec files y detectar estado del plan' },
    { title: 'Implementar',   detail: 'TDD por grupos de tareas en paralelo (Red-Green-Refactor)' },
    { title: 'Security Gate', detail: 'OWASP + NIST + MITRE — bloquea CRITICAL/HIGH/MEDIUM' },
    { title: 'Verificar',     detail: 'Tests + cobertura ≥95% — ciclo máx. 5 iteraciones' },
  ]
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    projectName:      { type: 'string' },
    specFile:         { type: 'string' },
    planFile:         { type: 'string' },
    currentIteration: { type: 'number' },
    taskGroups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          level: { type: 'number' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id:          { type: 'string' },
                description: { type: 'string' },
                size:        { type: 'string' },
                status:      { type: 'string' },
                component:   { type: 'string' },
                skillFile:   { type: 'string' }
              },
              required: ['id', 'description', 'status']
            }
          }
        },
        required: ['level', 'tasks']
      }
    }
  },
  required: ['projectName', 'specFile', 'planFile', 'taskGroups', 'currentIteration']
}

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    taskId:       { type: 'string' },
    status:       { type: 'string', enum: ['completada', 'bloqueada'] },
    summary:      { type: 'string' },
    filesCreated: { type: 'array', items: { type: 'string' } },
    blocker:      { type: 'string' }
  },
  required: ['taskId', 'status', 'summary']
}

const SECURITY_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity:      { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          cwe:           { type: 'string' },
          owasp:         { type: 'string' },
          mitre:         { type: 'string' },
          affectedClass: { type: 'string' },
          description:   { type: 'string' },
          remediation:   { type: 'string' }
        },
        required: ['severity', 'description', 'remediation']
      }
    }
  },
  required: ['passed', 'findings']
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    passed:   { type: 'boolean' },
    coverage: { type: 'number' },
    failingTests: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:       { type: 'string' },
          assertion:  { type: 'string' },
          stacktrace: { type: 'string' },
          type:       { type: 'string', enum: ['unit', 'integration'] }
        },
        required: ['name', 'type']
      }
    },
    uncoveredClasses: { type: 'array', items: { type: 'string' } },
    infrastructureFailures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          testName:    { type: 'string' },
          errorType:   { type: 'string' },
          description: { type: 'string' }
        }
      }
    }
  },
  required: ['passed', 'coverage']
}

// ── Fase: Leer Spec ───────────────────────────────────────────────────────────

phase('Leer Spec')
log('Buscando archivos spec y leyendo estado del plan...')

const spec = await agent(
  `Lee los archivos spec/*-spec.md y spec/*-plan.md del proyecto actual.

Extrae:
1. Nombre del proyecto (kebab-case)
2. Rutas absolutas de spec/*-spec.md y spec/*-plan.md
3. Lista completa de tareas con su estado actual:
   - [ ] = pendiente
   - [>] = en-progreso
   - [x] = completada
   - [!] = bloqueada
4. Agrupa las tareas por nivel de dependencia:
   - Nivel 1: tareas sin dependencias
   - Nivel 2: tareas que dependen solo de nivel 1
   - Nivel N: tareas que dependen de nivel N-1
5. Para cada tarea identifica el componente que implementa
   (KafkaListener, Processor, Repository, Client, Exception, Controller, etc.)
   y el skill file correspondiente en ~/.claude/commands/
6. Lee la sección "## Estado de implementación" del plan si existe
   para determinar la iteración actual del ciclo (0 si no existe la sección)

Si no encuentras archivos spec en el directorio spec/, retorna projectName="ERROR: no se encontraron archivos spec. Completa fase_spec primero."
Si hay más de un par de archivos, pregunta al dev cuál usar antes de continuar.`,
  { schema: SPEC_SCHEMA, phase: 'Leer Spec' }
)

if (spec.projectName.startsWith('ERROR')) {
  log(spec.projectName)
  return { error: spec.projectName }
}

log(`Proyecto: ${spec.projectName}`)
log(`Spec:     ${spec.specFile}`)
log(`Plan:     ${spec.planFile}`)

// Clasificar tareas por estado
const allTasks       = spec.taskGroups.flatMap(g => g.tasks)
const completedCount = allTasks.filter(t => t.status === 'completada').length
const blockedCount   = allTasks.filter(t => t.status === 'bloqueada').length
const pendingCount   = allTasks.filter(t => t.status === 'pendiente' || t.status === 'en-progreso').length

if (completedCount > 0) {
  log(`Modo reanudación: ${completedCount} completada(s), ${pendingCount} pendiente(s), ${blockedCount} bloqueada(s)`)
}

// Grupos que aún tienen tareas pendientes o en-progreso
const pendingGroups = spec.taskGroups
  .map(g => ({
    ...g,
    tasks: g.tasks.filter(t => t.status === 'pendiente' || t.status === 'en-progreso')
  }))
  .filter(g => g.tasks.length > 0)

// ── Fase: Implementar ─────────────────────────────────────────────────────────

phase('Implementar')

for (const group of pendingGroups) {
  log(`Nivel ${group.level}: implementando [${group.tasks.map(t => t.id).join(', ')}] en paralelo`)

  const groupResults = await parallel(
    group.tasks.map(task => () => agent(
      `Implementa la tarea ${task.id} del proyecto ${spec.projectName}.

Descripción: ${task.description}
Tamaño estimado: ${task.size || 'M'}
Componente: ${task.component || 'ver descripción'}
Skill file a leer ANTES de generar código: ${task.skillFile || '~/.claude/commands/skill-registry.md'}

Contexto:
- Spec completo (requerimientos + arquitectura): ${spec.specFile}
- Plan completo (tareas + tests): ${spec.planFile}

Protocolo OBLIGATORIO:
1. Leer el skill file indicado ANTES de generar cualquier línea de código
2. Marcar la tarea ${task.id} como [>] en ${spec.planFile} al iniciar
3. Seguir ciclo Red → Green → Refactor:
   a. Escribir el test que falla primero
   b. Implementar el mínimo código para que pase
   c. Refactorizar sin romper tests
4. JavaDoc en todos los métodos públicos (formato del equipo KLAP BYSF)
5. Seguir naming conventions: cl.klap.bysf.{modulo}.{app}.dominio.{dominio}.*
6. Sin placeholders ni TODOs sin reportar
7. Autocheck de calidad al finalizar
8. Marcar la tarea ${task.id} como [x] en ${spec.planFile} si se completó
9. Marcar la tarea ${task.id} como [!] en ${spec.planFile} si quedó bloqueada, con motivo`,
      { schema: TASK_SCHEMA, label: task.id, phase: 'Implementar' }
    ))
  )

  const results   = groupResults.filter(Boolean)
  const completed = results.filter(r => r.status === 'completada').length
  const blocked   = results.filter(r => r.status === 'bloqueada').length
  log(`Nivel ${group.level}: ${completed} completada(s), ${blocked} bloqueada(s)`)

  // Si el nivel completo quedó bloqueado, no tiene sentido continuar con niveles dependientes
  if (completed === 0 && blocked > 0) {
    log(`Nivel ${group.level} completamente bloqueado. Revisa el informe en ${spec.planFile}.`)
    return {
      status:   'bloqueado',
      proyecto: spec.projectName,
      nivel:    group.level,
      detalle:  `Todas las tareas del nivel ${group.level} quedaron bloqueadas.`
    }
  }
}

log('Implementación completada. Iniciando ciclo Security Gate → Verificación.')

// ── Ciclo: Security Gate → Verificar (máx. 5 iteraciones) ────────────────────

let iteracion = spec.currentIteration || 0
let exitoso   = false
let secResult = null
let verResult = null

// Asegurar que existe la sección de estado en el plan antes del primer ciclo
if (iteracion === 0) {
  await agent(
    `Agrega la siguiente sección al final de ${spec.planFile} si no existe ya:

\`\`\`
## Estado de implementación

| Iteración | Security Gate | Fase 5 | Resultado |
|-----------|--------------|--------|-----------|
| 1/5       | pendiente    | pendiente | — |
\`\`\``,
    { label: 'init-estado-ciclo', phase: 'Implementar' }
  )
}

while (iteracion < 5 && !exitoso) {
  iteracion++
  log(`── Ciclo ${iteracion}/5 ──`)

  // ── Security Gate ───────────────────────────────────────────────────────

  phase('Security Gate')
  log(`Security Gate — iteración ${iteracion}/5`)

  secResult = await agent(
    `Ejecuta el Security Gate completo sobre el código del proyecto ${spec.projectName}.
Referencia de arquitectura: ${spec.specFile}

Analiza OBLIGATORIAMENTE:
1. OWASP Top 10 (2021): A01–A10
2. Amenazas de stack:
   - SSRF (CWE-918)
   - Deserialización Kafka (CWE-502)
   - SpEL Injection (CWE-917)
   - Mass Assignment (CWE-915)
   - Actuator expuesto (CWE-200)
3. NIST SP 800-53: controles AC-3, AU-3, SC-8
4. MITRE ATT&CK: técnicas T1190, T1552, T1059

Clasifica cada finding como CRITICAL, HIGH, MEDIUM o LOW.
passed = true SOLO si no hay findings CRITICAL, HIGH ni MEDIUM.

Actualiza la columna "Security Gate" de la fila ${iteracion}/5 en la sección
"## Estado de implementación" de ${spec.planFile} con el resultado.`,
    { schema: SECURITY_SCHEMA, label: `security-gate-${iteracion}`, phase: 'Security Gate' }
  )

  const bloqueantes = secResult.findings.filter(f =>
    ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity)
  )
  log(`Security Gate ${iteracion}/5: ${secResult.passed ? '✅ sin bloqueantes' : `❌ ${bloqueantes.length} finding(s) bloqueante(s)`}`)

  if (!secResult.passed) {
    // Corregir findings bloqueantes en paralelo antes del siguiente ciclo
    await parallel(
      bloqueantes.map(finding => () => agent(
        `Corrige el siguiente finding de seguridad en el proyecto ${spec.projectName}.

Severidad:   ${finding.severity}
CWE:         ${finding.cwe || 'ver descripción'}
OWASP:       ${finding.owasp || 'ver descripción'}
MITRE:       ${finding.mitre || 'ver descripción'}
Clase:       ${finding.affectedClass || 'ver descripción'}
Descripción: ${finding.description}
Remediación: ${finding.remediation}

Aplica la corrección siguiendo los estándares KLAP BYSF.
Lee el skill file correspondiente si aplica.
Verifica que todos los tests siguen en verde tras la corrección.`,
        { label: `fix-${finding.severity}-${iteracion}`, phase: 'Implementar' }
      ))
    )
    continue
  }

  // ── Verificar ───────────────────────────────────────────────────────────

  phase('Verificar')
  log(`Verificación — iteración ${iteracion}/5`)

  verResult = await agent(
    `Verifica la implementación completa del proyecto ${spec.projectName}.

Spec: ${spec.specFile}
Plan (CA-XX y CL-XX): ${spec.planFile}

Ejecuta OBLIGATORIAMENTE:
1. ./gradlew test       — tests unitarios
2. ./gradlew verify     — tests de integración
3. Verifica cobertura JaCoCo ≥ 95%

Verifica también:
- Cada CA-XX del spec tiene su test correspondiente
- Cada CL-XX del spec tiene su test correspondiente
- JavaDoc completo en todos los métodos públicos
- Naming conventions KLAP BYSF correctas
- Reglas DO/DON'T del equipo
- Consulta ~/.claude/commands/sdd-checklist.md
- Consulta ~/.claude/commands/defectos-tipicos-checklist.md (6 categorías)

passed = true SOLO si tests 100% verde Y cobertura ≥ 95%.

Actualiza la columna "Fase 5" y "Resultado" de la fila ${iteracion}/5 en la sección
"## Estado de implementación" de ${spec.planFile}.`,
    { schema: VERIFY_SCHEMA, label: `verificar-${iteracion}`, phase: 'Verificar' }
  )

  log(`Verificación ${iteracion}/5: cobertura=${verResult.coverage}% | ${verResult.passed ? '✅ todo verde' : `❌ ${(verResult.failingTests || []).length} test(s) fallando`}`)

  if (verResult.passed) {
    exitoso = true
    break
  }

  // Preparar correcciones para el siguiente ciclo
  const fixes = []

  const unitFails = (verResult.failingTests || []).filter(t => t.type === 'unit')
  const intFails  = (verResult.failingTests || []).filter(t => t.type === 'integration')

  if (unitFails.length > 0) {
    fixes.push(() => agent(
      `Corrige los tests unitarios fallidos del proyecto ${spec.projectName}.

Tests fallidos:
${unitFails.map(t => `- ${t.name}\n  Assertion: ${t.assertion || ''}\n  Stacktrace: ${t.stacktrace || ''}`).join('\n')}

Corrige la lógica o las assertions según corresponda.
No reduzcas la cobertura existente al corregir.`,
      { label: `fix-unit-${iteracion}`, phase: 'Implementar' }
    ))
  }

  if (intFails.length > 0) {
    fixes.push(() => agent(
      `Analiza los tests de integración fallidos del proyecto ${spec.projectName}.

Tests fallidos:
${intFails.map(t => `- ${t.name}: ${t.assertion || ''}`).join('\n')}

Si el fallo es por configuración de infraestructura o contrato entre servicios:
  → Reporta explícitamente: "REQUIERE VOLVER A fase_spec.md Fase 2"
  → Describe el error de contrato/conexión y el stacktrace
Si el fallo es por lógica de código: corrígelo directamente.`,
      { label: `fix-integration-${iteracion}`, phase: 'Implementar' }
    ))
  }

  if (verResult.coverage < 95 && (verResult.uncoveredClasses || []).length > 0) {
    fixes.push(() => agent(
      `Agrega tests para alcanzar cobertura ≥ 95% en el proyecto ${spec.projectName}.

Cobertura actual: ${verResult.coverage}% (requerida: 95%)
Clases/métodos sin cubrir:
${(verResult.uncoveredClasses || []).join('\n')}

Lee ~/.claude/commands/testing.md antes de generar tests.
Sigue el patrón AAA (Arrange-Act-Assert) y las convenciones del equipo.`,
      { label: `fix-coverage-${iteracion}`, phase: 'Implementar' }
    ))
  }

  if (fixes.length > 0) {
    await parallel(fixes)
  }
}

// ── Resultado final ───────────────────────────────────────────────────────────

if (exitoso) {
  log(`✅ Implementación verificada — ${iteracion}/5 iteración(es)`)

  await agent(
    `Actualiza ${spec.planFile}:
1. Marca la fila ${iteracion}/5 en "Estado de implementación" como ✅ completado
2. Agrega al final del archivo:

## Resultado final
✅ Implementación verificada en ${iteracion}/5 iteraciones.
Cobertura: ${verResult ? verResult.coverage : '≥95'}% | Security Gate: sin findings bloqueantes.`,
    { label: 'resultado-final', phase: 'Verificar' }
  )

  return {
    status:      'completado',
    proyecto:    spec.projectName,
    iteraciones: iteracion,
    cobertura:   verResult ? verResult.coverage : null
  }
}

// Informe de bloqueo tras 5 iteraciones sin éxito
log('❌ Límite de 5 iteraciones alcanzado. Generando informe de bloqueo...')

const findingsNoResueltos = secResult
  ? secResult.findings.filter(f => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity))
  : []

await agent(
  `Genera el informe de bloqueo para ${spec.projectName} y agrégalo al final de ${spec.planFile}.

Estado tras 5 iteraciones:
- Security Gate passed: ${secResult ? secResult.passed : false}
- Findings no resueltos (${findingsNoResueltos.length}):
${findingsNoResueltos.map(f => `  · ${f.severity} | ${f.cwe || ''} | ${f.affectedClass || ''}: ${f.description}`).join('\n')}

- Verificación passed: ${verResult ? verResult.passed : false}
- Cobertura alcanzada: ${verResult ? verResult.coverage : 0}%
- Tests fallidos:
${(verResult && verResult.failingTests ? verResult.failingTests : []).map(t => `  · [${t.type}] ${t.name}: ${t.assertion || ''}`).join('\n')}

El informe debe incluir:
1. Encabezado: "## Informe de Bloqueo — 5 iteraciones sin éxito"
2. Tabla resumen de las 5 iteraciones con lo intentado y resultado
3. Tests que no alcanzaron 95%: clase, método, porcentaje actual
4. Findings no resueltos: CWE, severidad, clase afectada, motivo por el que no se pudo resolver
5. Recomendación de routing:
   - Si el bloqueo requiere cambio de diseño → "Volver a fase_spec.md Fase 2"
   - Si es deuda técnica aceptable → "Documentar como observación técnica para el dev"`,
  { label: 'informe-bloqueo', phase: 'Verificar' }
)

return {
  status:    'bloqueado',
  proyecto:  spec.projectName,
  iteraciones: 5,
  mensaje:   `Ver informe de bloqueo al final de ${spec.planFile}`
}
