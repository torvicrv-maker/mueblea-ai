# CURRENT STATE

Fecha de checkpoint inicial: 2026-09-26.

## Hecho
- Arquitectura multiagente definida.
- Fuente canónica definida: `FurnitureModel`.
- Starter Next.js creado.
- Modelo mínimo de clóset determinístico.
- Vista 3D inicial.
- Despiece y métricas preliminares derivados del mismo modelo.
- Validador de IDs, dimensiones, valores finitos, orientación y envelope físico creado.
- Suite A7 del Furniture Core: 7/7 pruebas PASS.

## No hecho todavía
- Persistencia.
- Supabase/Auth/RLS.
- IA real.
- Catálogo real de melaminas y herrajes.
- Cajones, puertas, bisagras, correderas.
- Nesting.
- Presupuestos completos.
- DXF/CNC.

## Corrección arquitectónica B0
Se detectó y corrigió la mezcla entre bounding-box 3D y dimensiones de corte. El modelo ahora separa dimensiones fabricables y orientación espacial.

## QA de BLOQUE 0
`B0-A7-001` está PASS. El 2026-09-26 se instaló el lockfile y `npm run check` pasó: typecheck, 7/7 pruebas y build de producción. `B0-A0-003 / CHECKPOINT-001` queda PASS.
