# TEST PLAN — Mueblea AI

## B0 — Furniture Core invariants

La fuente de verdad es `FurnitureModel`. El visor 3D, despiece, métricas y futuras salidas de fabricación deben derivar de este modelo.

### Invariantes obligatorias
1. El mismo input genera exactamente el mismo modelo.
2. Las dimensiones de fabricación no dependen de la orientación 3D.
3. Los IDs de pieza son únicos dentro del modelo.
4. Ninguna dimensión fabricable puede ser <= 0 o no finita.
5. Cada pieza usa los tres ejes X/Y/Z exactamente una vez en su orientación.
6. Ninguna pieza generada puede salir del volumen exterior del mueble.
7. Área de tablero y metros de canto deben ser reproducibles desde el modelo canónico.
8. Las plantillas deben rechazar medidas por debajo de sus mínimos constructivos.

## Regresión canónica inicial
Entrada:
- ancho: 2400 mm
- alto: 2300 mm
- fondo: 600 mm
- espesor: 18 mm

Salida esperada:
- piezas: 5
- área: 6.96792 m²
- canto preliminar: 11.692 m
- issues: 0

## Ejecución
`npm test`

Actualmente la suite contiene 7 pruebas automatizadas usando `node:test`, sin dependencia adicional de framework de testing.
