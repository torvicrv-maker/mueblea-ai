# Mueblea AI

Starter técnico para una app web de diseño y fabricación de muebles de melamina asistida por IA.

## Objetivo del MVP

Foto y medidas → propuesta de distribución editable → confirmación → modelo paramétrico → despiece preliminar. La IA propone; Furniture Core calcula las piezas y la geometría.

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
- El panel acepta fotos JPG, PNG o WebP, las reduce en el navegador y envía la imagen junto con las medidas actuales a una función de servidor de visión; la credencial queda privada.
- La IA propone hasta cuatro módulos, repisas, espacio para colgar y frentes simples de puertas o cajones. La distribución se puede editar y descartar antes de aplicarla.
- Al confirmar, el mismo modelo paramétrico alimenta el visor 3D, las métricas de tableros y el CSV; los proyectos guardados conservan esa distribución.
- El botón de descarga genera un CSV del despiece actual.

Una sola foto no revela medidas, la parte trasera ni la estructura oculta: la app usa las dimensiones ingresadas y marca lo demás como suposición revisable. El despiece incluye las piezas de melamina que representa el modelo; los frentes de cajón no incluyen cajas ni herrajes, y el colgador es solo una referencia visual. El visor no es un CAD completo y los cantos son preliminares. Los proyectos quedan solo en este navegador; todavía no hay sincronización, precios ni optimización de tableros.

### Activar análisis de fotos

1. Despliega este repositorio como proyecto en Vercel para habilitar `/api/design-from-photo`.
2. En las variables privadas de Vercel configura `GEMINI_API_KEY` y `MUEBLEA_VISION_ENABLED=true`. `MUEBLEA_VISION_MODEL` es opcional y por defecto usa `gemini-3.8-flash`. Añade el origen de la web a `MUEBLEA_ALLOWED_ORIGINS`.
3. En GitHub, crea la variable de Actions `NEXT_PUBLIC_MUEBLEA_API_ORIGIN` con el origen HTTPS del proyecto Vercel. El workflow la incorpora al build estático de Pages.

La plantilla está en `.env.example`. Crea la clave de Gemini Developer API en [Google AI Studio](https://aistudio.google.com/app/apikey) y guárdala solo como `GEMINI_API_KEY` privada en Vercel; nunca la publiques ni la guardes en una variable `NEXT_PUBLIC_*`. En el nivel gratuito, Google puede usar el contenido enviado para mejorar sus productos, y las cuotas son limitadas. No cargues fotos privadas o con datos personales. La imagen solo se envía cuando se pulsa **Analizar y preparar diseño**; el endpoint permanece apagado hasta configurar la clave y `MUEBLEA_VISION_ENABLED`.

## Ejecutar

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Estado

El modelo paramétrico de clóset ya admite secciones, repisas, puertas sencillas y frentes de cajones. La integración de visión está lista en el código y requiere el endpoint de Vercel y su clave privada para analizar fotos.

Cada cambio en `main` compila y publica automáticamente el sitio en GitHub Pages.

## Nota de validación

Las dependencias están fijadas en `package-lock.json`. Ejecuta `npm run check` para validar tipos, pruebas y build estático.


## QA

```bash
npm test
npm run check
```

El core tiene regresiones automatizadas de 2400 × 2300 × 600 mm, distribución por módulos, puertas, frentes de cajón, límites del mueble y propuestas de foto.
