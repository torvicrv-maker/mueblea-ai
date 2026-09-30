# API CONTRACTS — borrador

## Acciones del dominio

```ts
type FurnitureAction =
  | { type: "SET_DIMENSIONS"; width: number; height: number; depth: number }
  | { type: "SET_MATERIAL"; materialId: string }
  | { type: "ADD_MODULE"; module: ModuleInput }
  | { type: "REMOVE_MODULE"; moduleId: string };
```

## Regla de mutación IA

```text
AI proposal
→ schema validation
→ deterministic preview
→ user confirmation
→ domain command
→ new furniture version
→ audit event
```

No existe endpoint `ai_write_database`.

## Foto a propuesta de clóset

`POST /api/design-from-photo` recibe una foto JPEG compactada en un data URI, dimensiones actuales en milímetros y una instrucción opcional. El servidor llama a Gemini Developer API con un esquema JSON limitado a una distribución de clóset.

```ts
interface PhotoDesignProposal {
  supported: boolean;
  summary: string;
  layout: {
    sections: Array<{
      widthRatio: number;
      shelfCount: number;
      hanging: boolean;
      frontStyle: "open" | "doors" | "drawers";
      drawerCount: number;
    }>;
  } | null;
  assumptions: string[];
}
```

El servidor valida la propuesta y prueba la geometría con Furniture Core antes de responder. El cliente presenta el resultado como borrador; solo la confirmación del usuario actualiza `FurnitureModel.layout`. La respuesta de error tiene `{ error: string }`; orígenes ajenos a `MUEBLEA_ALLOWED_ORIGINS` se rechazan.
