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
- El módulo Diseñador IA acepta texto y dictado; prepara una acción `SET_DIMENSIONS` con vista previa y confirmación.
- El panel acepta fotos JPG, PNG o WebP, las reduce en el navegador y permite solicitar a Meshy una referencia GLB que se puede girar y acercar en el lienzo.
- El botón de descarga genera un CSV del despiece actual.

La generación de fotos funciona mediante una Vercel Function en `api/image-to-3d.ts`; la clave de Meshy permanece del lado del servidor. El modelo generado es solo una referencia visual: no confirma dimensiones ni se convierte en piezas o despiece. El clóset paramétrico sigue siendo la fuente de verdad para medidas y CSV. El visor no es un CAD completo y el cálculo de materiales es preliminar. Los proyectos quedan solo en el navegador actual; todavía no hay sincronización, precios ni optimización de tableros.

### Activar foto a 3D

1. Despliega este repositorio como proyecto en Vercel para habilitar `/api/image-to-3d`.
2. En las variables de entorno de Vercel configura `MESHY_API_KEY` y `MUEBLEA_IMAGE3D_ENABLED=true`. Añade los orígenes de producción a `MUEBLEA_ALLOWED_ORIGINS` separados por comas.
3. En el build de GitHub Pages configura `NEXT_PUBLIC_MUEBLEA_API_ORIGIN` con el origen HTTPS del proyecto Vercel para que la web estática llame al servicio.

La plantilla de variables está en `.env.example`. Nunca publiques `MESHY_API_KEY` ni la guardes en una variable `NEXT_PUBLIC_*`. La solicitud al proveedor ocurre solo al pulsar **Generar modelo 3D**.

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

Las dependencias están fijadas en `package-lock.json`. Validación local: `npm run check` completó typecheck, 11 pruebas del core y build de producción.


## QA

```bash
npm test
npm run check
```

El core tiene una regresión canónica automatizada de 2400 × 2300 × 600 mm.
