# CHECKPOINTS

## CHECKPOINT-001 — criterio de cierre
BLOQUE 0 cierra cuando:
- Architecture y Decisions están vigentes.
- Furniture Core tiene tests de invariantes.
- El demo genera el 3D y despiece desde el mismo modelo.
- No existe una segunda fuente de verdad.
- `npm run typecheck` y `npm run build` pasan en un entorno con dependencias instaladas.

Estado actual: **CLOSED — PASS (2026-09-26)**.

Evidencia actual:
- Furniture Core: 7/7 tests PASS.
- Fuente canónica única: `FurnitureModel`.
- Demo, despiece y métricas derivan del mismo modelo.
- `npm run check`: PASS — typecheck, 7/7 pruebas y build de producción con Next.js 16.3.6.
- Se corrigió `tsconfig.core-tests.json` para usar resolución de módulos Node16 compatible con TypeScript 7.
