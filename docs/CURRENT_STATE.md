# Estado actual

Última actualización: 2026-09-27.

## Incluido
- Arquitectura basada en `FurnitureModel` como fuente canónica de geometría y medidas fabricables.
- Portada en `/` y espacio de diseño en `/designer/`, con biblioteca/elementos a la izquierda, lienzo al centro y ajustes a la derecha.
- Modelo paramétrico determinístico de clóset base; las medidas gobiernan el modelo, sus métricas y el despiece CSV.
- Visor manipulable hecho con geometría Three.js y `SVGRenderer`, con giro, zoom, selección resaltada y restablecimiento de cámara. Renderiza a SVG para funcionar en navegadores móviles sin WebGL.
- Selector de tres acabados visuales (roble claro, blanco mate y nogal).
- Proyectos guardados en `localStorage` del navegador con esquema versionado, lista, carga, renombrado, nuevo y eliminación.
- Módulo dedicado Diseñador IA dentro del editor: conversación, ejemplos rápidos, entrada por texto y dictado de voz cuando el navegador lo admite.
- El asistente convierte medidas reconocidas en la acción tipada `SET_DIMENSIONS`, comprueba mínimos, muestra preview y espera confirmación. El dictado solo rellena el texto; no ejecuta por sí mismo.
- CSV del despiece básico y métricas preliminares desde el modelo canónico.
- Pruebas del core para geometría, métricas, propuestas de medidas y lectura de proyectos guardados.

## Límites actuales
- El asistente reconoce dimensiones y unidades comunes; no llama a un modelo generativo ni interpreta distribución de cajones, puertas o espacios para colgar. Fotos y planos todavía no se analizan.
- Los proyectos se quedan en el navegador y dispositivo donde se guardan; no hay cuenta ni sincronización.
- El visor es un modelo paramétrico demostrativo, no un CAD completo: faltan texturas y sombras avanzadas, colocación espacial, catálogo de herrajes y construcción detallada de puertas/cajones.
- Los acabados son colores ilustrativos. Las métricas y el CSV son preliminares, no planos certificados para fabricar.
- Aún no hay Supabase/Auth/RLS, precios, optimización de tableros, nesting, DXF o CNC.

## Próxima arquitectura
Para activar IA generativa hace falta una función de servidor que guarde la clave del proveedor y devuelva acciones tipadas. El flujo debe seguir siendo intención → acción tipada → validación del core → vista previa → confirmación → ejecución. La IA no modifica la geometría canónica directamente.

## QA
`npm run check` pasa TypeScript, 11 pruebas y build de producción.
