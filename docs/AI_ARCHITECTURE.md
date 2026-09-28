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

## Módulo actual: Diseñador IA

El panel mantiene una conversación en la sesión, acepta instrucciones escritas y dictado de voz cuando el navegador lo soporta. El dictado llena un borrador editable y no envía ni ejecuta automáticamente.

El parser local reconoce dimensiones generales de ancho, alto y fondo en mm, cm o m y devuelve `SET_DIMENSIONS` con un payload tipado. El core aplica mínimos, advierte cuando el texto pide una distribución aún no soportada, dibuja una vista previa y espera confirmación antes de actualizar el modelo. Esta versión no llama a un LLM ni analiza fotos o planos.

## Siguiente integración

La lectura generativa de texto, fotos y planos requiere una función de servidor con la clave del proveedor en variables privadas. La respuesta debe validarse contra un esquema de acciones, simularse con Furniture Core y seguir propuesta → preview → confirmación → ejecución → auditoría. Las acciones de distribución solo se habilitan después de que el modelo canónico tenga piezas y reglas para representarlas.

## Ejemplo
“Hazlo de 2.40 m de ancho” → `{ type: "SET_DIMENSIONS", width: 2400, ... }`.
