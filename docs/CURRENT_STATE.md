# Estado actual

Última actualización: 2026-09-30.

## Incluido
- Portada en `/` y editor `/designer/`, optimizado para móvil y escritorio.
- Clóset paramétrico de melamina: laterales, tapa, piso, divisiones, repisas, paneles de puerta y frentes de cajón.
- Vista 3D y métricas calculadas desde `FurnitureModel`; el CSV usa las mismas piezas.
- Proyectos guardados en `localStorage`, incluida la distribución de módulos.
- Diseñador IA con texto, dictado y flujo de análisis de foto como propuesta revisable.
- Función de servidor `api/design-from-photo.ts` para OpenAI Responses con salida estructurada y validación local; la credencial queda privada.
- La distribución de foto se puede ajustar, previsualizar, confirmar o descartar antes de aplicarla.
- Pruebas para geometría, piezas, métricas, distribución, propuestas y persistencia local.

## Límites y activación pendiente
- La interfaz estática de GitHub Pages no contiene claves. El análisis de foto requiere desplegar la función en Vercel, configurar `OPENAI_API_KEY` y `MUEBLEA_VISION_ENABLED=true`, y pasar el origen Vercel a `NEXT_PUBLIC_MUEBLEA_API_ORIGIN` en Actions.
- El modelo solo representa clósets/armarios con hasta cuatro módulos. Una foto no revela dimensiones ni interior oculto; el usuario debe revisar las suposiciones.
- Los frentes de cajón no incluyen cajas ni herrajes. Las barras de colgar son solo una referencia visual.
- No hay autenticación, sincronización de proyectos, costeo, optimización de tableros, planos certificados, DXF ni CNC.

## QA
Ejecuta `npm run check` para TypeScript, pruebas y build estático.
