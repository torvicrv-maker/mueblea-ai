# AI ARCHITECTURE

## Objetivo
Convertir lenguaje, voz, imágenes y planos en acciones de dominio seguras.

## Pipeline objetivo para la integración generativa
1. Captura multimodal.
2. Extracción de intención.
3. Generación de JSON tipado.
4. Validación de schema.
5. Simulación con Furniture Core.
6. Preview de diferencias.
7. Confirmación humana.
8. Ejecución.
9. Auditoría con modelo, tokens, costo y resultado.

La clave del proveedor vive solo en una función de servidor; nunca se incluye en JavaScript público ni en el repositorio. La geometría canónica se actualiza únicamente mediante acciones tipadas validadas por Furniture Core.

## Prototipo actual

El asistente local reconoce dimensiones de ancho, alto y fondo expresadas en mm, cm o m. Devuelve una propuesta tipada, advierte si asume una unidad o si se mencionan distribuciones aún no soportadas, dibuja la vista previa y espera confirmación. No hay todavía llamada a un LLM, análisis de distribución, voz, imagen ni auditoría remota.

## Ejemplo
“Hazlo de 2.40 m de ancho” → `{ type: "SET_DIMENSIONS", width: 2400, ... }`.
