Lee el protocolo completo en `~/.claude/workflows/fase_spec_refactor.md` y sigue exactamente sus instrucciones para ejecutar las Fases 1–3 del proceso SDD adaptado a refactorización de proyectos existentes (Analizar → Proponer → Validar).

Genera como resultado:
- `spec/*-refactor-spec.md` — análisis del estado actual + arquitectura objetivo
- `spec/*-refactor-plan.md` — tabla de tareas atómica con trazabilidad y plan de tests
- `spec/contracts/` — snapshots de contratos de entrada/salida del componente actual

Al finalizar las 3 fases, informa al dev que puede continuar la implementación con `/sdd-impl-spec-refactor` o con el flujo completo `/sdd-refactor`.

Contexto del desarrollador: $ARGUMENTS
