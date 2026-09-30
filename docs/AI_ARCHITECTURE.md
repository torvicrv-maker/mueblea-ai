# Arquitectura del Diseñador IA

## Flujo de foto

1. El usuario carga una foto y revisa las medidas de ancho, alto y fondo que ya ingresó.
2. Al pulsar **Analizar y preparar diseño**, el navegador comprime la foto y envía foto, dimensiones e instrucción opcional a `api/design-from-photo.ts`.
3. La función llama a Gemini Developer API desde el servidor privado y solicita JSON con un esquema de distribución permitido.
4. `parsePhotoDesignProposal` valida módulos, proporciones, repisas, colgado, frentes y suposiciones.
5. Furniture Core simula la propuesta con `buildWardrobe`; una distribución imposible se rechaza antes de volver al navegador.
6. El usuario edita los módulos, revisa las suposiciones y confirma o descarta.
7. Tras confirmar, `FurnitureModel.layout` es la fuente de verdad para el visor, las métricas y el CSV.

La IA nunca entrega ni cambia coordenadas 3D directamente. La foto es una referencia visual y no se usa para inferir dimensiones. La clave `GEMINI_API_KEY` solo vive en el servidor y la app no persiste las fotos. En el nivel gratuito, Google indica que puede usar el contenido enviado para mejorar sus productos; no se deben cargar fotos privadas ni con información personal. El endpoint queda apagado si `MUEBLEA_VISION_ENABLED` no es `true`.

## Modelo de clóset admitido por esta fase

- Entre una y cuatro secciones verticales, sujetas al ancho disponible.
- Repisas, una referencia visual de barra para colgar, paneles sencillos de puerta y frentes de cajón.
- El despiece contiene los tableros representados por el modelo. No genera cajas de cajón, bisagras, barras de metal ni uniones.
- Espesor de melamina actual: 18 mm. El diseño y el canto son preliminares.

Las fotos de muebles que no se pueden representar como clóset/armario se rechazan. El interior oculto de una foto cerrada se presenta como una suposición que el usuario puede revisar, no como un dato medido.

## Texto y dictado

El panel acepta instrucciones escritas y dictado. El dictado solo completa el borrador y nunca se envía automáticamente. El parser local reconoce ancho, alto y fondo en mm, cm o m y devuelve `SET_DIMENSIONS`. El core valida mínimos, presenta una vista previa y espera confirmación antes de cambiar el modelo.

## Configuración del servicio

Vercel debe tener `GEMINI_API_KEY` y `MUEBLEA_VISION_ENABLED=true`. `MUEBLEA_VISION_MODEL` permite elegir otro modelo compatible; por defecto se usa `gemini-3.8-flash`. `MUEBLEA_ALLOWED_ORIGINS` limita los orígenes web que pueden llamar a la función. GitHub Pages debe compilar con `NEXT_PUBLIC_MUEBLEA_API_ORIGIN` apuntando al proyecto Vercel.
