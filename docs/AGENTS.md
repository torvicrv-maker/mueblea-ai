# AGENTS — Mueblea AI

## Regla de gobierno
A0 es el único agente que puede aprobar cambios de arquitectura, contratos compartidos, fuente de verdad, despliegues de producción y cierres de checkpoint.

## A0 — Lead Architect / Integrator
- Mantiene arquitectura y decisiones.
- Divide trabajo y valida integraciones.
- No usa IA generativa como fuente de verdad geométrica.

## A1 — Frontend / UX / 3D
- App Router, interfaz, responsive y visor 3D.
- Consume contratos; no redefine entidades del dominio.

## A2 — Backend / Data
- API, PostgreSQL/Supabase, Auth, RLS, Storage y auditoría.
- No cambia reglas geométricas.

## A3 — AI / Multimodal
- Texto, voz, imagen, plano y acciones tipadas.
- Flujo obligatorio: intención → propuesta → preview → confirmación → ejecución → auditoría.
- Nunca escribe directamente geometría ni tablas canónicas.

## A4 — Furniture Core
- Modelo paramétrico, módulos, piezas, holguras, uniones y validadores.
- Es dueño de las reglas constructivas.

## A5 — Manufacturing
- Despiece, veta, canto, kerf, nesting, etiquetas, DXF/CSV/CNC.
- Trabaja únicamente con piezas canónicas de A4.

## A6 — Costing / Catalog
- Materiales, herrajes, listas de precio, desperdicio, mano de obra, margen y cotización.

## A7 — QA / Security
- Pruebas unitarias, invariantes geométricas, regresión, seguridad y validación de contratos.

## Esfuerzo recomendado
- Bajo: documentación, UX copy, tareas repetitivas.
- Medio: frontend, CRUD, contratos ordinarios.
- Alto: modelo paramétrico, nesting, seguridad, migraciones, CNC, decisiones transversales.
