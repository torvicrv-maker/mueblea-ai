# Mueblea AI

Starter técnico para una app web de diseño y fabricación de muebles de melamina asistida por IA.

## Objetivo del MVP

Entrada de medidas → modelo paramétrico → vista isométrica → despiece preliminar. La IA se integra después como capa de intención y nunca como fuente de verdad geométrica.

## Stack objetivo

- Next.js 16.3.x (App Router)
- React 19.3
- TypeScript 7
- PostgreSQL/Supabase en la siguiente fase
- GitHub Pages para el prototipo estático; Vercel podrá alojar futuras funciones de servidor

## Experiencia actual

- `/`: portada del producto y entrada al diseñador.
- `/designer/`: interfaz de trabajo con biblioteca/elementos a la izquierda, vista del modelo al centro y parámetros/materiales a la derecha.
- Cambiar dimensiones actualiza el modelo y sus métricas; el acabado cambia el visor.
- El visor Three.js `SVGRenderer` permite girar y acercar el clóset sin depender de WebGL.
- Guarda y carga proyectos en el almacenamiento de este navegador.
- El asistente local prepara propuestas de medidas desde texto y las muestra antes de aplicarlas.
- El botón de descarga genera un CSV del despiece actual.

El asistente no está conectado a una IA generativa: una integración real necesita un servidor que mantenga privada la clave del proveedor. El visor no es un CAD completo y el cálculo de materiales es preliminar. Los proyectos quedan solo en el navegador actual; todavía no hay sincronización, precios ni optimización de tableros.

## Ejecutar

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Estado

BLOQUE 0 iniciado. Incluye arquitectura, agentes, modelo paramétrico mínimo y un diseñador de clóset demostrativo.

Cada cambio en `main` compila y publica automáticamente el sitio en GitHub Pages.

## Nota de validación

Las dependencias están fijadas en `package-lock.json`. Validación local: `npm run check` completó typecheck, 10 pruebas del core y build de producción.


## QA

```bash
npm test
npm run check
```

El core tiene una regresión canónica automatizada de 2400 × 2300 × 600 mm.
