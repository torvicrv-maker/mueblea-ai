# ARCHITECTURE

## Principio central
La fuente de verdad es `FurnitureModel`. La vista isométrica, despiece, nesting, presupuesto y archivos de fabricación son proyecciones derivadas.

```text
Usuario / IA
     ↓
Typed Furniture Action
     ↓
Furniture Core (canónico)
     ↓
FurnitureModel vN
 ┌──────┼────────┬─────────┐
 3D   CutList   Costing   Manufacturing
```

## Capas
- `src/core/furniture`: dominio puro y determinístico.
- `src/components`: interfaz y visor SVG 3D basado en Three.js `SVGRenderer` con `OrbitControls`.
- `src/app/page.tsx`: portada pública y acceso al diseñador.
- `src/app/designer/page.tsx`: espacio de trabajo del mueble.
- El editor presenta biblioteca/elementos a la izquierda, lienzo al centro y parámetros/materiales a la derecha; en móvil se apilan en ese orden de uso.
- El CSV se genera desde el modelo actual en el navegador. La selección de acabado cambia el color del visor, no el cálculo de piezas ni el costo.
- Los proyectos se guardan localmente con la clave versionada `mueblea-ai.projects.v1`; no se sincronizan.
- El asistente actual solo propone dimensiones mediante reglas locales. Para IA generativa y proyectos compartidos se necesita una función de servidor y persistencia, siguiendo los contratos de acciones y autenticación.

## Estado del prototipo
- El lienzo usa geometría paramétrica 3D proyectada a SVG. Permite girar y acercar el modelo; el render SVG no aporta texturas ni sombras avanzadas.
- Las dimensiones actualizan el mismo `FurnitureModel` usado por las métricas y el despiece.
- Guardar y cargar funciona en el navegador actual; limpiar los datos del navegador elimina esos proyectos.
- Las propuestas desde texto pasan por reglas y mínimos del core, se muestran en preview y requieren confirmación.

## Restricciones
- UI no calcula geometría de negocio.
- IA no persiste directamente.
- Costos no alteran geometría.
- Fabricación no redefine piezas.
- Toda mutación futura debe crear una nueva versión del modelo.
