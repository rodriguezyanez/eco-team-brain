Inicia el flujo de implementación para proyectos de refactorización (Fases 4–5).

Requiere que existan previamente los archivos generados por `/fase-spec-refactor`:
- `spec/*-refactor-spec.md`
- `spec/*-refactor-plan.md`
- `spec/contracts/` con los snapshots de contratos del componente original

Si no existen esos archivos, indicar al dev que primero debe ejecutar `/fase-spec-refactor` o `/sdd-refactor`.

Usa el Workflow tool con el script en `~/.claude/workflows/sdd-impl-spec-refactor.js`.

El workflow ejecuta en orden:
1. **Characterization** — escribe y valida los characterization tests contra el código existente usando `spec/contracts/` como baseline
2. **Implementar** — TDD por grupos de tareas (excluye `[EXT]` y characterization); bloquea si hay tareas `[EXT]` pendientes de confirmación externa
3. **Security Gate** — OWASP + NIST + MITRE; bloquea findings CRITICAL/HIGH/MEDIUM
4. **Verificar** — tests 100% verde + cobertura ≥95% + no-regresión de contratos (characterization tests sobre código refactorizado)

Reanuda automáticamente si hay tareas con estado `[x]` en el plan.

Contexto del desarrollador: $ARGUMENTS
