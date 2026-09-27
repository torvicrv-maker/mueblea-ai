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
- `src/components`: interfaz y visualización isométrica SVG.
- `src/app/page.tsx`: portada pública y acceso al diseñador.
- `src/app/designer/page.tsx`: espacio de trabajo del mueble.
- El editor presenta biblioteca/elementos a la izquierda, lienzo al centro y parámetros/materiales a la derecha; en móvil se apilan en ese orden de uso.
- El CSV se genera desde el modelo actual en el navegador. La selección de acabado solo modifica la ilustración, no el cálculo del material ni el costo.
- Backend/Data: se agrega en P1 con persistencia y auth.
- AI runtime: se agrega tras contratos de acciones.

## Estado del prototipo
- El lienzo es una vista SVG isométrica ligera y responsiva, no un visor CAD/3D interactivo.
- Las dimensiones actualizan el mismo `FurnitureModel` usado por las métricas y el despiece.
- No se guardan proyectos ni se sincronizan con un servidor.

## Restricciones
- UI no calcula geometría de negocio.
- IA no persiste directamente.
- Costos no alteran geometría.
- Fabricación no redefine piezas.
- Toda mutación futura debe crear una nueva versión del modelo.
