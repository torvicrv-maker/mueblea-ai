# B0-A7-001 — Furniture Core invariant suite

Fecha: 2026-09-26
Agente: A7 — QA / Security
Estado: PASS

## Implementado
- Suite automatizada del Furniture Core.
- Prueba de determinismo.
- Prueba de separación dimensiones fabricables / orientación 3D.
- Regresión de área de tablero y canto.
- Rechazo de mínimos constructivos inválidos.
- Detección de IDs duplicados.
- Detección de dimensiones no positivas.
- Detección de orientación inválida.
- Detección de piezas fuera del volumen del mueble.

## Resultado ejecutado
7 tests / 7 PASS / 0 FAIL.

## Validación integral posterior
El 2026-09-26, tras instalar las dependencias fijadas en `package-lock.json`, se ejecutó `npm run check`: typecheck PASS, 7/7 pruebas PASS y build de producción PASS. Se actualizó la configuración del compilador de pruebas a Node16 para compatibilidad con TypeScript 7.
