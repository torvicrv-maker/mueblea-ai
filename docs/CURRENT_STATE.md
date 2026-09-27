# CURRENT STATE

Fecha de checkpoint inicial: 2026-09-26.

## Hecho
- Arquitectura multiagente definida.
- Fuente canónica definida: `FurnitureModel`.
- Starter Next.js creado.
- Modelo mínimo de clóset determinístico.
- Vista isométrica SVG, ligera y compatible con móviles.
- Despiece y métricas preliminares derivados del mismo modelo.
- Validador de IDs, dimensiones, valores finitos, orientación y envelope físico creado.
- Suite A7 del Furniture Core: 7/7 pruebas PASS.
- Portada pública en `/` separada del espacio de trabajo `/designer/`.
- Editor ordenado en biblioteca/elementos, lienzo y panel de parámetros/materiales.
- Selector de tres acabados para la ilustración isométrica y descarga CSV del despiece actual.
- Portada y editor reorganizados para pantallas móviles.

## No hecho todavía
- Visor CAD/3D interactivo, geometría de puertas/cajones y selección espacial de piezas.
- Guardado de proyectos o persistencia local.
- Persistencia.
- Supabase/Auth/RLS.
- IA real.
- Catálogo real de melaminas y herrajes.
- Cajones, puertas, bisagras, correderas.
- Nesting.
- Presupuestos completos.
- DXF/CNC.

La vista actual es una representación isométrica SVG. Las métricas son preliminares y el CSV contiene el despiece básico del modelo; no equivale a documentación lista para fabricar.

## Corrección arquitectónica B0
Se detectó y corrigió la mezcla entre bounding-box 3D y dimensiones de corte. El modelo ahora separa dimensiones fabricables y orientación espacial.

## QA de BLOQUE 0
`B0-A7-001` está PASS. El 2026-09-26 se instaló el lockfile y `npm run check` pasó: typecheck, 7/7 pruebas y build de producción. `B0-A0-003 / CHECKPOINT-001` queda PASS.
