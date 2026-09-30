# TASKS

## BLOQUE 0 — Base arquitectónica
- [x] B0-A0-001 Definir agentes y gobierno.
- [x] B0-A0-002 Definir fuente de verdad.
- [x] B0-A4-001 Crear tipos mínimos FurnitureModel/Part.
- [x] B0-A4-002 Crear generador determinístico de clóset base.
- [x] B0-A1-001 Crear demostrador web inicial.
- [x] B0-A7-001 Suite automatizada de invariantes Furniture Core: 7/7 PASS.
- [x] B0-A0-003 Cerrar CHECKPOINT-001 — `npm run check` PASS (typecheck, 7/7 pruebas, build).

## P1 — Persistencia + catálogo
- [ ] P1-A2-001 Crear esquema PostgreSQL/Supabase.
- [ ] P1-A2-002 Auth + organizaciones + RLS.
- [ ] P1-A6-001 Catálogo de melaminas, canto y herrajes.
- [ ] P1-A4-001 Versionado del modelo.

## P2 — Mueble real
- [x] Divisiones interiores básicas parametrizadas.
- [x] Puertas de panel simple y frentes visuales de cajón.
- [ ] Cajas completas de cajón.
- [ ] Puertas abatibles/corredizas con herrajes.
- [ ] Bisagras y correderas.
- [ ] Holguras configurables.

## P3 — Producción
- [ ] Despiece industrial.
- [ ] Canto.
- [ ] Kerf.
- [ ] Veta.
- [ ] Nesting.

## P4 — IA
- [x] Acción tipada `SET_DIMENSIONS` con preview/confirmación.
- [x] Dictado de voz como borrador editable.
- [x] Endpoint de visión para proponer distribución desde foto, con preview/confirmación.
- [ ] Activar servicio de visión Gemini en Vercel con `GEMINI_API_KEY` privada; probar el análisis con una foto no sensible.
- [ ] Interpretar planos técnicos.
