import type { FurnitureModel } from "./types";
import { partWorldSize } from "./worldSize";

export interface ValidationIssue {
  code: string;
  message: string;
  partId?: string;
}

const EPSILON = 1e-6;

export function validateFurnitureModel(model: FurnitureModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  const modelValues = [model.dimensions.width, model.dimensions.height, model.dimensions.depth];
  if (modelValues.some((value) => !Number.isFinite(value))) {
    issues.push({ code: "NON_FINITE_MODEL_DIMENSION", message: "El volumen del mueble contiene una dimensión no finita." });
  }
  if (modelValues.some((value) => value <= 0)) {
    issues.push({ code: "NON_POSITIVE_MODEL_DIMENSION", message: "El volumen del mueble debe tener dimensiones positivas." });
  }

  for (const p of model.parts) {
    if (ids.has(p.id)) {
      issues.push({ code: "DUPLICATE_PART_ID", message: `ID duplicado: ${p.id}`, partId: p.id });
    }
    ids.add(p.id);

    const dimensions = [p.length, p.width, p.thickness];
    const position = [p.transform.x, p.transform.y, p.transform.z];

    if (dimensions.some((value) => !Number.isFinite(value)) || position.some((value) => !Number.isFinite(value))) {
      issues.push({ code: "NON_FINITE_PART_VALUE", message: `Valor no finito en ${p.name}`, partId: p.id });
      continue;
    }

    if (dimensions.some((value) => value <= 0)) {
      issues.push({ code: "NON_POSITIVE_DIMENSION", message: `Dimensión no positiva en ${p.name}`, partId: p.id });
    }

    if (new Set(Object.values(p.orientation)).size !== 3) {
      issues.push({ code: "INVALID_ORIENTATION", message: `Orientación inválida en ${p.name}`, partId: p.id });
      continue;
    }

    const [sizeX, sizeY, sizeZ] = partWorldSize(p);
    const minX = p.transform.x - sizeX / 2;
    const maxX = p.transform.x + sizeX / 2;
    const minY = p.transform.y - sizeY / 2;
    const maxY = p.transform.y + sizeY / 2;
    const minZ = p.transform.z - sizeZ / 2;
    const maxZ = p.transform.z + sizeZ / 2;

    if (
      minX < -EPSILON ||
      minY < -EPSILON ||
      minZ < -EPSILON ||
      maxX > model.dimensions.width + EPSILON ||
      maxY > model.dimensions.height + EPSILON ||
      maxZ > model.dimensions.depth + EPSILON
    ) {
      issues.push({ code: "PART_OUTSIDE_ENVELOPE", message: `${p.name} sale del volumen del mueble`, partId: p.id });
    }
  }

  return issues;
}
