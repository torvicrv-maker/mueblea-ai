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
