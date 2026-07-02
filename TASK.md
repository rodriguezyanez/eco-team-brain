# TASK — Skill `/auditoria`: auditoría de proyectos pre-certificación

Rama: `feature/dev/20260701_skill_auditoria_proyectos`
Última actualización: 2026-07-01

## Contexto
El equipo necesita auditar entregables **antes de que pasen a certificación**, con el objetivo concreto de que
**pasen los quality gates del pipeline Jenkins** (SonarQube, OWASP Dependency-Check, Trivy) además del estándar
KLAP BYSF. Los entregables son **multi-stack**: microservicios Spring Boot, AWS Lambda (SAM/Serverless/CDK,
Java o Node), APIs REST y sitios Angular.

No existía un comando que emitiera un veredicto único **APTO / NO APTO para certificación** alineado a esos gates.
Sí existían piezas reutilizables (`code-review-expert`, `kafka-audit`, `defectos-tipicos-checklist`, `sdd-checklist`,
Security Gate SDD fase 4.5) pero Java/Kafka-céntricas y sin cubrir el quality gate de Sonar, CVEs de dependencias
(OWASP DC) ni Trivy.

## Decisiones de diseño (confirmadas con el dev)
- **Vehículo:** skill / slash-command `/auditoria` (solo lectura), NO subcomando `klap` — el CLI solo despacha
  scripts shell y no puede juzgar código.
- **Composición:** orquestador que reutiliza las skills existentes + agrega dimensiones de CI gates.
- **Ejecución:** híbrida — corre Trivy y OWASP Dependency-Check si están instalados; para Sonar replica
  analíticamente las métricas del quality gate (sin server); predice verde/rojo. Escáner ausente → se reporta
  "no ejecutado localmente", nunca se silencia.
- **Umbrales:** autodetección desde el propio repo (Jenkinsfile, `sonar-project.properties`, config de
  dependency-check/trivy) con fallback al estándar KLAP.
- **Stacks v1:** los cuatro (Spring Boot, AWS Lambda, API REST, Angular).

## Actividades

| # | Actividad | Estado |
|---|-----------|--------|
| 1 | Explorar CLI `klap`, flujo SDD y piezas de auditoría existentes | ✅ Completado |
| 2 | Crear `skills/auditoria.md` (detección de stack, gates Jenkins, umbrales, estándar KLAP por stack, veredicto, informe) | ✅ Completado |
| 3 | Registrar `auditoria.md` en `scripts/windows/install-skills.ps1` (`$Files` + `$Expected=13`) | ✅ Completado |
| 4 | Registrar en `scripts/windows/install-skills.bat` (`DO_COPY` + `EXPECTED=13`) | ✅ Completado |
| 5 | Registrar en `scripts/linux/install-skills.sh` (`FILES` + `EXPECTED=13`) | ✅ Completado |
| 6 | Agregar a la limpieza de `rollback.ps1` y `rollback.sh` | ✅ Completado |
| 7 | Índice en `skills/skill-registry.md` | ✅ Completado |
| 8 | Docs: `README.md` y `GUIA-PRACTICA.md` | ✅ Completado |
| 9 | `git add -f skills/auditoria.md` (`.gitignore` ignora `*.md`) | ✅ Completado |
| 10 | Fix del origen en `install-skills.ps1/.bat/.sh`: apuntar a la raíz (`..\..\skills`) en vez de la carpeta del script | ✅ Completado |

## Diseño del skill (resumen)
`skills/auditoria.md` — frontmatter estilo `kafka-audit` (`disable-model-invocation: true`). Pasos:
1. **Detección de stack** por marcadores (`build.gradle`/`@SpringBootApplication`, `template.yaml`/`serverless.yml`/
   `cdk.json`, controllers REST, `angular.json`).
2. **Autodetección de umbrales** (repo → fallback KLAP: cobertura ≥95%, quality gate PASSED, 0 CVE CVSS≥7,
   0 Trivy CRITICAL/HIGH, duplicaciones ≤3%).
3. **Gates Jenkins** (todos los stacks): Sonar quality gate analítico, OWASP Dependency-Check, Trivy (fs/image/config).
4. **Estándar KLAP por stack** reutilizando `code-review-expert`, `sdd-checklist`, `defectos-tipicos-checklist`,
   `kafka-audit` (solo si usa Kafka); reglas específicas para Lambda / API / Angular.
5. **Veredicto** APTO / APTO CON OBSERVACIONES / NO APTO.
6. **Informe** `auditoria-{proyecto}-{fecha}.md` (tabla por gate + matriz de hallazgos + bloqueantes). Solo lectura.

## Verificación
- ✅ `bash -n` OK en `install-skills.sh` y `rollback.sh`; parseo OK de `install-skills.ps1` y `rollback.ps1`.
- ✅ Conteo consistente: 13 entradas de skills en los 3 instaladores (`.ps1`/`.bat`/`.sh`), contadores en 13.
- ✅ `skills/auditoria.md` presente (9 KB) y trackeado (force-add por `.gitignore *.md`).
- ✅ `auditoria.md` agregado a ambas listas de `rollback` para limpieza completa.
- ✅ **Fix del instalador (preexistente, resuelto en esta rama):** el origen se resolvía a la carpeta del script
  (`$PSScriptRoot\skills`, `%~dp0..\skills`, `${SCRIPT_DIR}/skills`) en vez de a `skills/` en la raíz. Corregido a
  `..\..\skills` / `${SCRIPT_DIR}/../../skills`. Los 3 instaladores (`.ps1`/`.bat`/`.sh`) corren OK y reportan **13/13**
  copiando `auditoria.md` a `~/.claude/skills`.

## Actualización 2026-07-02
- 🔁 **Renombrado** `audit-cert` → `auditoria` en todo el repo (archivos `skills/auditoria.md` y
  `commands/auditoria.md`, listas de instalación/rollback, registro, docs, CLI). Contadores de skills 13 → 14.
- 🆕 **Dashboard HTML**: nueva skill `web-artifacts-builder` (`skills/` + `commands/`) que genera un `.html`
  autocontenido con gráficos SVG inline. `/auditoria` ahora emite un JSON estructurado (PASO 6.1) y un
  **PASO 7** que produce `auditoria-{proyecto}-{fecha}.html` además del `.md`.
- 🔧 **`klap init` ahora instala skills**: `init-brain.ps1/.sh/.bat` encadenan `install-skills` (antes solo
  `install-commands`). Corrige el gap con lo que ya prometía la documentación.

## Pendiente / fuera de alcance
- ⏳ Prueba funcional real de `/auditoria` sobre un repo de cada stack (queda para uso en el día a día).
