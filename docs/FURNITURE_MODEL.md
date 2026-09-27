# FURNITURE MODEL

## Unidad canónica
Milímetros.

## Separación crítica: fabricación vs. espacio 3D
Una pieza de melamina se define canónicamente por `length × width × thickness`. Su posición en el mueble se define aparte por `transform` y `orientation`.

Esto evita usar accidentalmente una caja 3D como dimensión de corte. Ejemplo: un lateral puede medir **2300 × 600 × 18 mm**, aunque en coordenadas mundiales su espesor corresponda al eje X.

## Parte
Cada `FurniturePart` contiene:
- ID estable
- material
- `length`, `width`, `thickness`
- dirección de veta
- lados de canto
- centro `transform`
- mapeo de ejes `orientation`

## Invariantes iniciales
- Ninguna dimensión puede ser ≤ 0.
- `lengthAxis`, `widthAxis`, `thicknessAxis` deben ocupar tres ejes distintos.
- El mismo `part.id` enlaza visualización, despiece, etiqueta, costos y fabricación.
- Área de tablero = `length × width`; nunca se calcula desde el bounding box mundial.
