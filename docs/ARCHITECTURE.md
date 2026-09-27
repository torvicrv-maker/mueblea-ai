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
- `src/app`: rutas y composición Next.js.
- Backend/Data: se agrega en P1 con persistencia y auth.
- AI runtime: se agrega tras contratos de acciones.

## Restricciones
- UI no calcula geometría de negocio.
- IA no persiste directamente.
- Costos no alteran geometría.
- Fabricación no redefine piezas.
- Toda mutación futura debe crear una nueva versión del modelo.
