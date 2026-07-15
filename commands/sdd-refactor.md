Ejecuta el flujo completo de refactorización KLAP BYSF: Spec (Fases 1–3) seguido de Implementación (Fases 4–5).

## Paso 1 — Detectar estado actual

Antes de hacer cualquier cosa, verifica si ya existen archivos spec en el directorio del proyecto:

- Buscar `spec/*-refactor-spec.md` y `spec/*-refactor-plan.md`

**Si NO existen → ir a Etapa 1 (Spec)**
**Si YA existen → ir a Etapa 2 (Implementación)** e informar al dev que los archivos spec ya están listos

---

## Etapa 1 — Spec: Analizar → Proponer → Validar (Fases 1–3)

Lee y sigue el protocolo completo de `~/.claude/workflows/fase_spec_refactor.md`.

Al finalizar las 3 fases y crear los archivos en `spec/`:
- `spec/*-refactor-spec.md`
- `spec/*-refactor-plan.md`
- `spec/contracts/` con snapshots de contratos

Pregunta al dev:
> "Los archivos spec están creados y aprobados. ¿Continuamos con la implementación ahora (Fases 4–5)?"
> - **Sí** → continuar a Etapa 2
> - **No** → terminar aquí; el dev puede retomar con `/sdd-impl-spec-refactor` cuando esté listo

---

## Etapa 2 — Implementación: Characterization → TDD → Security Gate → Verificar (Fases 4–5)

Usa el Workflow tool con el script en `~/.claude/workflows/sdd-impl-spec-refactor.js`.

El workflow detecta automáticamente si hay tareas ya completadas `[x]` en el plan y reanuda desde donde quedó.

---

## Reanudación

Si el proceso se interrumpe en cualquier punto:
- Con spec inexistente: volver a activar `/sdd-refactor` — retoma desde Etapa 1
- Con spec existente y plan sin implementar: volver a activar `/sdd-refactor` — salta a Etapa 2
- Con implementación en progreso (tareas `[x]` en el plan): Etapa 2 reanuda automáticamente

Contexto del desarrollador: $ARGUMENTS
