export const meta = {
  name: 'sdd-impl-spec-refactor',
  description: 'SDD Implementación para Refactorización: Characterization Tests + TDD + Security Gate + No-regresión de contratos',
  phases: [
    { title: 'Leer Spec',        detail: 'Leer spec files, detectar tareas [EXT], characterization tasks y spec/contracts/' },
    { title: 'Characterization', detail: 'Escribir y ejecutar characterization tests sobre el código existente usando spec/contracts/ como baseline' },
    { title: 'Implementar',      detail: 'TDD por grupos en paralelo (excluye [EXT] y characterization) — Red-Green-Refactor' },
    { title: 'Security Gate',    detail: 'OWASP + NIST + MITRE — bloquea CRITICAL/HIGH/MEDIUM' },
    { title: 'Verificar',        detail: 'Tests + cobertura ≥95% + no-regresión de contratos — ciclo máx. 5 iteraciones' },
  ]
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    projectName:      { type: 'string' },
    specFile:         { type: 'string' },
    planFile:         { type: 'string' },
    contractsDir:     { type: 'string' },
    contractFiles:    { type: 'array', items: { type: 'string' } },
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
                id:                    { type: 'string' },
                description:           { type: 'string' },
                size:                  { type: 'string' },
                status:                { type: 'string' },
                component:             { type: 'string' },
                skillFile:             { type: 'string' },
                taskType:              { type: 'string', enum: ['refact', 'nuevo-req', 'ext', 'characterization'] },
                isCharacterizationTest: { type: 'boolean' },
                dependsOn:             { type: 'string' }
              },
              required: ['id', 'description', 'status', 'taskType']
            }
          }
        },
        required: ['level', 'tasks']
      }
    },
    externalTasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:                   { type: 'string' },
          description:          { type: 'string' },
          level:                { type: 'number' },
          whoExecutes:          { type: 'string' },
          confirmationCriteria: { type: 'string' },
          status:               { type: 'string' }
        },
        required: ['id', 'description', 'level', 'status']
      }
    },
    characterizationTasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:          { type: 'string' },
          description: { type: 'string' },
          status:      { type: 'string' }
        },
        required: ['id', 'description', 'status']
      }
    }
  },
  required: ['projectName', 'specFile', 'planFile', 'taskGroups', 'currentIteration',
             'externalTasks', 'characterizationTasks', 'contractFiles']
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

const CHARACTERIZATION_SCHEMA = {
  type: 'object',
  properties: {
    passed:             { type: 'boolean' },
    testsCreated:       { type: 'array', items: { type: 'string' } },
    contractsValidated: { type: 'array', items: { type: 'string' } },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contractFile: { type: 'string' },
          testName:     { type: 'string' },
          issue:        { type: 'string' }
        },
        required: ['contractFile', 'issue']
      }
    }
  },
  required: ['passed', 'testsCreated', 'contractsValidated', 'failures']
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
    passed:                     { type: 'boolean' },
    coverage:                   { type: 'number' },
    contractRegressionPassed:   { type: 'boolean' },
    contractRegressionFailures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contractFile: { type: 'string' },
          testName:     { type: 'string' },
          expected:     { type: 'string' },
          actual:       { type: 'string' }
        },
        required: ['contractFile', 'testName']
      }
    },
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
  required: ['passed', 'coverage', 'contractRegressionPassed']
}

// ── Fase: Leer Spec ───────────────────────────────────────────────────────────

phase('Leer Spec')
log('Buscando archivos spec de refactorización y leyendo estado del plan...')

const spec = await agent(
  `Lee los archivos spec/*-refactor-spec.md y spec/*-refactor-plan.md del proyecto actual.

Extrae:
1. Nombre del proyecto (kebab-case, desde el nombre del archivo sin sufijo -refactor-spec)
2. Rutas absolutas de spec/*-refactor-spec.md y spec/*-refactor-plan.md
3. Lista completa de tareas, clasificando cada una por taskType:
   - 'characterization': columna Tipo es 'Refact.' Y descripción contiene "characterization test"
   - 'ext': columna Tipo es '[EXT]'
   - 'refact': columna Tipo es 'Refact.' (que no sea characterization)
   - 'nuevo-req': columna Tipo es 'Nuevo req.'

   Estados: [ ] = pendiente | [>] = en-progreso | [x] = completada | [!] = bloqueada

4. Separar en:
   - taskGroups: todos los grupos por nivel con TODAS las tareas (incluyendo ext y characterization)
   - externalTasks: solo las tareas de tipo 'ext', extrayendo whoExecutes y confirmationCriteria
     de la descripción o la columna Tests del plan
   - characterizationTasks: solo las tareas de tipo 'characterization'

5. Agrupa las tareas por nivel de dependencia:
   - Nivel 1: tareas sin dependencias (columna "Depende de" vacía o "—")
   - Nivel 2: tareas que dependen solo de nivel 1
   - Nivel N: tareas que dependen de nivel N-1

6. Para cada tarea de tipo 'refact' o 'nuevo-req', identifica el componente
   (KafkaListener, Processor, Repository, Client, Exception, Controller, etc.)
   y el skill file correspondiente en ~/.claude/commands/

7. Lee la sección "## Estado de implementación" del plan si existe
   para determinar la iteración actual del ciclo (0 si no existe la sección)

8. Lista los archivos en spec/contracts/ si el directorio existe:
   - contractsDir: ruta absoluta a spec/contracts/
   - contractFiles: lista de rutas absolutas de todos los archivos encontrados
   - Si spec/contracts/ no existe o está vacío: contractFiles = []

Si no encuentras archivos *-refactor-spec.md y *-refactor-plan.md en spec/, retorna
projectName="ERROR: no se encontraron archivos spec de refactorización. Completa fase_spec_refactor primero."
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
log(`Contratos: ${spec.contractFiles.length} archivo(s) en spec/contracts/`)
log(`Tareas [EXT]: ${spec.externalTasks.length} | Characterization: ${spec.characterizationTasks.length}`)

// Clasificar tareas por estado para resumen
const allTasks        = spec.taskGroups.flatMap(g => g.tasks)
const completedCount  = allTasks.filter(t => t.status === 'completada').length
const pendingCount    = allTasks.filter(t => t.status === 'pendiente' || t.status === 'en-progreso').length
const extPendingCount = spec.externalTasks.filter(t => t.status !== 'completada').length

if (completedCount > 0) {
  log(`Modo reanudación: ${completedCount} completada(s), ${pendingCount} pendiente(s), ${extPendingCount} ext pendiente(s)`)
}

// ── Fase: Characterization ────────────────────────────────────────────────────

const pendingCharacterizationTasks = spec.characterizationTasks.filter(
  t => t.status === 'pendiente' || t.status === 'en-progreso'
)

if (pendingCharacterizationTasks.length > 0) {
  phase('Characterization')

  if (spec.contractFiles.length === 0) {
    log('⚠️  spec/contracts/ vacío o no existe — los characterization tests no tienen snapshots de referencia.')
    log('    El agente construirá los contratos desde el código fuente.')
  }

  log(`Implementando characterization tests — ${spec.contractFiles.length} contrato(s) de referencia`)

  const charResult = await agent(
    `Implementa y ejecuta los characterization tests del proyecto ${spec.projectName}.

PROPÓSITO: Capturar el comportamiento actual como contrato ejecutable ANTES de refactorizar.
Estos tests son el baseline de no-regresión: deben pasar GREEN contra el código existente.

Contratos de referencia en ${spec.contractsDir || 'spec/contracts/'}:
${spec.contractFiles.length > 0
    ? spec.contractFiles.map(f => `- ${f}`).join('\n')
    : '(ninguno — construir ejemplos desde el código fuente y guardar en spec/contracts/)'}

Spec (comportamiento actual documentado): ${spec.specFile}
Plan: ${spec.planFile}

PROTOCOLO — DIFERENTE AL CICLO RED-GREEN-REFACTOR ESTÁNDAR:

Para cada archivo en spec/contracts/ (o para cada salida documentada en el spec si no hay archivos):

1. Leer el archivo de contrato y determinar:
   - Tipo de salida: CSV, TXT, JSON, XML, Kafka message, HTTP response, escritura a BD, email, etc.
   - Clase y método del código existente que produce esa salida

2. Escribir un test de integración en src/test/java/ con nombre *CharacterizationTest.java:
   - Leer el contrato desde spec/contracts/ como recurso estático (no hardcodear el valor)
   - Invocar el código existente tal como está
   - Afirmar que la salida coincide campo a campo con el contrato

3. Ejecutar: ./gradlew test --tests "*CharacterizationTest"

   Si TODOS pasan GREEN:
   → Los contratos son válidos. Marcar tareas de characterization como [x] en ${spec.planFile}.
   → passed = true

   Si alguno falla RED:
   → NO modificar el código existente
   → El snapshot en spec/contracts/ no coincide con el comportamiento real del código
   → Documentar: archivo de contrato, campo que difiere, valor en snapshot vs valor real
   → passed = false, registrar en failures
   → El dev debe decidir: ¿actualizar el snapshot o es un bug preexistente?

REGLA CLAVE: Un characterization test bien implementado NUNCA falla RED contra el código
existente. Si falla, es porque el snapshot está mal construido — no el código.`,
    { schema: CHARACTERIZATION_SCHEMA, label: 'characterization', phase: 'Characterization' }
  )

  if (!charResult.passed) {
    log(`❌ Characterization tests fallaron contra el código existente — ${charResult.failures.length} contrato(s) inconsistente(s):`)
    charResult.failures.forEach(f => log(`   · ${f.contractFile}: ${f.issue}`))
    log('   Corregir los snapshots en spec/contracts/ antes de continuar con la refactorización.')
    return {
      status:   'contratos-inconsistentes',
      proyecto: spec.projectName,
      fallos:   charResult.failures
    }
  }

  log(`✅ Characterization — ${charResult.testsCreated.length} test(s) verde(s), ${charResult.contractsValidated.length} contrato(s) validado(s)`)
} else {
  log('Characterization tests ya completados — continuando con implementación.')
}

// ── Fase: Implementar ─────────────────────────────────────────────────────────

phase('Implementar')

// Excluir [EXT] y characterization — se gestionan fuera del ciclo de implementación
const pendingGroups = spec.taskGroups
  .map(g => ({
    ...g,
    tasks: g.tasks.filter(t =>
      (t.status === 'pendiente' || t.status === 'en-progreso') &&
      t.taskType !== 'ext' &&
      t.taskType !== 'characterization'
    )
  }))
  .filter(g => g.tasks.length > 0)

// Inicializar sección de estado si es la primera iteración
if ((spec.currentIteration || 0) === 0) {
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

for (const group of pendingGroups) {
  // Verificar que no haya tareas [EXT] pendientes en niveles anteriores que bloqueen este nivel
  const blockingExtTasks = spec.externalTasks.filter(
    t => t.level < group.level && t.status !== 'completada'
  )

  if (blockingExtTasks.length > 0) {
    log(`⏸  Nivel ${group.level} bloqueado — tareas [EXT] pendientes de confirmación externa:`)
    blockingExtTasks.forEach(t => {
      log(`   · ${t.id}: ${t.description}`)
      if (t.whoExecutes)          log(`     Ejecuta: ${t.whoExecutes}`)
      if (t.confirmationCriteria) log(`     Confirmar cuando: ${t.confirmationCriteria}`)
    })
    log('   Marcar las tareas [EXT] como [x] en el plan cuando el equipo externo confirme y volver a ejecutar.')
    return {
      status:              'pendiente-ext',
      proyecto:            spec.projectName,
      nivelBloqueado:      group.level,
      tareasPendientesExt: blockingExtTasks
    }
  }

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
- Contratos de referencia (no-regresión): ${spec.contractsDir || 'spec/contracts/'}

Protocolo OBLIGATORIO:
1. Leer el skill file indicado ANTES de generar cualquier línea de código
2. Marcar la tarea ${task.id} como [>] en ${spec.planFile} al iniciar
3. Seguir ciclo Red → Green → Refactor:
   a. Escribir el test que falla primero
   b. Implementar el mínimo código para que pase
   c. Refactorizar sin romper tests
4. Los characterization tests (*CharacterizationTest.java) deben seguir pasando GREEN — no romperlos
5. JavaDoc en todos los métodos públicos (formato del equipo KLAP BYSF)
6. Seguir naming conventions: cl.klap.bysf.{modulo}.{app}.dominio.{dominio}.*
7. Sin placeholders ni TODOs sin reportar
8. Si el componente tiene un patrón GoF definido en el spec: leer ~/.claude/commands/design_patterns/skill.md antes de generar código
9. Si la tarea implementa KafkaConfig o archivos de configuración: leer ~/.claude/commands/spring-properties.md y generar los 4 archivos application-{ambiente}.properties
10. Si la tarea implementa operaciones I/O-bound concurrentes (múltiples llamadas HTTP, queries paralelas): usar CompletableFuture.allOf() o @Async con ThreadPoolTaskExecutor — nunca bloquear el hilo de procesamiento principal
11. Si la tarea accede a estado compartido desde múltiples hilos o instancias: documentar la estrategia de sincronización (isolation level, SELECT FOR UPDATE, clave de idempotencia) ANTES de escribir código
12. Autocheck de calidad al finalizar
13. Marcar la tarea ${task.id} como [x] en ${spec.planFile} si se completó
14. Marcar la tarea ${task.id} como [!] en ${spec.planFile} si quedó bloqueada, con motivo`,
      { schema: TASK_SCHEMA, label: task.id, phase: 'Implementar' }
    ))
  )

  const results   = groupResults.filter(Boolean)
  const completed = results.filter(r => r.status === 'completada').length
  const blocked   = results.filter(r => r.status === 'bloqueada').length
  log(`Nivel ${group.level}: ${completed} completada(s), ${blocked} bloqueada(s)`)

  if (completed === 0 && blocked > 0) {
    log(`Nivel ${group.level} completamente bloqueado. Revisa el informe en ${spec.planFile}.`)
    return {
      status:   'bloqueado',
      proyecto: spec.projectName,
      nivel:    group.level,
      detalle:  `Todas las tareas del nivel ${group.level} quedaron bloqueadas.`
    }
  }

  // Verificar si hay tareas [EXT] en ESTE nivel que bloquean el siguiente antes de continuar
  const extTasksThisLevel = spec.externalTasks.filter(
    t => t.level === group.level && t.status !== 'completada'
  )
  const hasNextLevel = pendingGroups.some(g => g.level > group.level)

  if (extTasksThisLevel.length > 0 && hasNextLevel) {
    log(`⏸  Tareas [EXT] pendientes en nivel ${group.level} — el siguiente nivel queda en espera:`)
    extTasksThisLevel.forEach(t => {
      log(`   · ${t.id}: ${t.description}`)
      if (t.whoExecutes)          log(`     Ejecuta: ${t.whoExecutes}`)
      if (t.confirmationCriteria) log(`     Confirmar cuando: ${t.confirmationCriteria}`)
    })
    log('   Marcar las tareas [EXT] como [x] en el plan y volver a ejecutar para continuar.')
    return {
      status:              'pendiente-ext',
      proyecto:            spec.projectName,
      nivelBloqueado:      group.level + 1,
      tareasPendientesExt: extTasksThisLevel
    }
  }
}

log('Implementación completada. Iniciando ciclo Security Gate → Verificación.')

// ── Ciclo: Security Gate → Verificar (máx. 5 iteraciones) ────────────────────

let iteracion = spec.currentIteration || 0
let exitoso   = false
let secResult = null
let verResult = null

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
2. Amenazas de stack según arquitectura del servicio (leer el spec para determinar cuáles aplican):
   - SSRF (CWE-918) — si hay llamadas HTTP a URLs externas
   - Deserialización de mensajes/datos (CWE-502) — si hay consumo de mensajes o datos serializados desde fuentes externas
   - SpEL Injection (CWE-917) — si hay evaluación de expresiones dinámicas
   - Mass Assignment (CWE-915) — si hay endpoints REST con binding automático
   - Actuator expuesto (CWE-200) — si Spring Actuator está habilitado
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
Verifica que todos los tests (incluidos *CharacterizationTest) siguen en verde tras la corrección.`,
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
Contratos de referencia: ${spec.contractsDir || 'spec/contracts/'}

Ejecuta OBLIGATORIAMENTE en este orden:

1. ./gradlew test       — tests unitarios
2. ./gradlew verify     — tests de integración
3. Verifica cobertura JaCoCo ≥ 95%

4. No-regresión de contratos — ejecuta la suite de characterization tests sobre el código refactorizado:
   ./gradlew test --tests "*CharacterizationTest"
   · Si todos pasan GREEN: contractRegressionPassed = true
   · Si alguno falla RED: contractRegressionPassed = false
     → Documentar en contractRegressionFailures: qué campo difiere entre el output
       del código refactorizado y el snapshot en spec/contracts/
     → Un fallo aquí significa que la refactorización alteró un contrato externo

Verifica también:
- Cada CA-XX del spec tiene su test correspondiente
- Cada CL-XX del spec tiene su test correspondiente
- JavaDoc completo en todos los métodos públicos
- Naming conventions KLAP BYSF correctas
- Reglas DO/DON'T del equipo
- Consulta ~/.claude/commands/sdd-checklist.md
- Consulta ~/.claude/commands/defectos-tipicos-checklist.md (6 categorías)
- Patrones GoF implementados coinciden con los documentados en el spec (Fase 2)
- Si hay Kafka: existen los 4 archivos application-{ambiente}.properties y siguen spring-properties.md
- Si hay operaciones I/O-bound concurrentes: verificar que los hilos de procesamiento no quedan bloqueados
- Si hay acceso concurrente a estado compartido: verificar isolation level, idempotencia y ausencia de race conditions

passed = true SOLO si tests 100% verde Y cobertura ≥ 95% Y contractRegressionPassed = true.

Actualiza las columnas "Fase 5" y "Resultado" de la fila ${iteracion}/5 en la sección
"## Estado de implementación" de ${spec.planFile}.`,
    { schema: VERIFY_SCHEMA, label: `verificar-${iteracion}`, phase: 'Verificar' }
  )

  log(`Verificación ${iteracion}/5: cobertura=${verResult.coverage}% | contratos=${verResult.contractRegressionPassed ? '✅' : '❌'} | ${verResult.passed ? '✅ todo verde' : `❌ ${(verResult.failingTests || []).length} test(s) fallando`}`)

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
  → Reporta explícitamente: "REQUIERE VOLVER A fase_spec_refactor.md Fase 2"
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

  if (!verResult.contractRegressionPassed && (verResult.contractRegressionFailures || []).length > 0) {
    fixes.push(() => agent(
      `Los siguientes characterization tests fallan sobre el código refactorizado en ${spec.projectName}.

Contratos rotos:
${(verResult.contractRegressionFailures || []).map(f => `- ${f.testName} (${f.contractFile})\n  Esperado: ${f.expected || 'ver test'}\n  Actual:   ${f.actual || 'ver test'}`).join('\n')}

Estos tests verifican que el código refactorizado produce exactamente la misma salida que el original.
Un fallo indica que la refactorización alteró un contrato externo.

Para cada contrato roto:
1. Identifica el componente refactorizado que produce esa salida
2. Corrige la implementación para que preserve el contrato original
3. Verifica que el characterization test vuelve a pasar GREEN

NO modifiques spec/contracts/ — los snapshots son el contrato de referencia, el código debe adaptarse a ellos.`,
      { label: `fix-contract-regression-${iteracion}`, phase: 'Implementar' }
    ))
  }

  if (fixes.length > 0) {
    await parallel(fixes)
  }
}

// ── Resultado final ───────────────────────────────────────────────────────────

if (exitoso) {
  log(`✅ Implementación verificada — ${iteracion}/5 iteración(es) | contratos preservados`)

  await agent(
    `Actualiza ${spec.planFile}:
1. Marca la fila ${iteracion}/5 en "Estado de implementación" como ✅ completado
2. Agrega al final del archivo:

## Resultado final
✅ Implementación verificada en ${iteracion}/5 iteraciones.
Cobertura: ${verResult ? verResult.coverage : '≥95'}% | Security Gate: sin findings bloqueantes | Contratos preservados: ✅`,
    { label: 'resultado-final', phase: 'Verificar' }
  )

  return {
    status:               'completado',
    proyecto:             spec.projectName,
    iteraciones:          iteracion,
    cobertura:            verResult ? verResult.coverage : null,
    contratosPreservados: verResult ? verResult.contractRegressionPassed : null
  }
}

// Informe de bloqueo tras 5 iteraciones sin éxito
log('❌ Límite de 5 iteraciones alcanzado. Generando informe de bloqueo...')

const findingsNoResueltos = secResult
  ? secResult.findings.filter(f => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity))
  : []

const contratosRotos = verResult && verResult.contractRegressionFailures
  ? verResult.contractRegressionFailures
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

- Contratos rotos (no-regresión): ${contratosRotos.length}
${contratosRotos.map(f => `  · ${f.testName} (${f.contractFile}): esperado=${f.expected || '?'} / actual=${f.actual || '?'}`).join('\n')}

El informe debe incluir:
1. Encabezado: "## Informe de Bloqueo — 5 iteraciones sin éxito"
2. Tabla resumen de las 5 iteraciones con lo intentado y resultado
3. Tests que no alcanzaron 95%: clase, método, porcentaje actual
4. Findings no resueltos: CWE, severidad, clase afectada, motivo por el que no se pudo resolver
5. Contratos rotos: archivo de contrato, campo que difiere, causa probable
6. Recomendación de routing:
   - Si hay contratos rotos → "Volver a fase_spec_refactor.md Fase 2 — revisar plan de compatibilidad"
   - Si el bloqueo requiere cambio de diseño → "Volver a fase_spec_refactor.md Fase 2"
   - Si es deuda técnica aceptable → "Documentar como observación técnica para el dev"`,
  { label: 'informe-bloqueo', phase: 'Verificar' }
)

return {
  status:      'bloqueado',
  proyecto:    spec.projectName,
  iteraciones: 5,
  mensaje:     `Ver informe de bloqueo al final de ${spec.planFile}`
}
