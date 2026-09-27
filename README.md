# Mueblea AI

Starter técnico para una app web de diseño y fabricación de muebles de melamina asistida por IA.

## Objetivo del MVP

Entrada de medidas → modelo paramétrico → vista 3D → despiece → presupuesto. La IA se integra después como capa de intención y nunca como fuente de verdad geométrica.

## Stack objetivo

- Next.js 16.3.x (App Router)
- React 19.3
- TypeScript 7
- Three.js + React Three Fiber
- PostgreSQL/Supabase en la siguiente fase
- Vercel para despliegue web

## Ejecutar

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Estado

BLOQUE 0 iniciado. Incluye arquitectura, agentes, modelo paramétrico mínimo y un diseñador de clóset demostrativo.

## Nota de validación

Las versiones de dependencias se fijaron con referencias públicas vigentes al 2026-09-26. En este entorno no se completó `npm install`, por lo que `typecheck/build` continúan como criterio pendiente de CHECKPOINT-001.


## QA

```bash
npm test
npm run check
```

El core tiene una regresión canónica automatizada de 2400 × 2300 × 600 mm.
