# DECISIONS

## D-001 — Fuente de verdad
**Decisión:** `FurnitureModel` paramétrico y versionado es la fuente canónica.

## D-002 — IA como orquestador, no CAD
**Decisión:** la IA genera acciones tipadas; Furniture Core ejecuta geometría determinística.

## D-003 — Unidades internas
**Decisión:** milímetros para geometría, moneda en enteros de centavos para costos.

## D-004 — IDs estables
**Decisión:** toda pieza y módulo tiene ID estable dentro de una versión lógica para permitir trazabilidad hacia despiece, etiquetas y CNC.

## D-005 — Frontend
**Decisión:** Next.js App Router + React + TypeScript; visor con Three.js/R3F.

## D-006 — Dimensiones de fabricación separadas del 3D
**Decisión:** cada pieza conserva `length × width × thickness` como geometría fabricable y usa `orientation` para mapearla al espacio 3D. Las métricas de material siempre usan dimensiones fabricables.
