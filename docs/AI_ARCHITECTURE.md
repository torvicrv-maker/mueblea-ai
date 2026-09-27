# AI ARCHITECTURE

## Objetivo
Convertir lenguaje, voz, imágenes y planos en acciones de dominio seguras.

## Pipeline
1. Captura multimodal.
2. Extracción de intención.
3. Generación de JSON tipado.
4. Validación de schema.
5. Simulación con Furniture Core.
6. Preview de diferencias.
7. Confirmación humana.
8. Ejecución.
9. Auditoría con modelo, tokens, costo y resultado.

## Ejemplo
“Hazlo de 2.40 m de ancho” → `{ type: "SET_DIMENSIONS", width: 2400, ... }`.
