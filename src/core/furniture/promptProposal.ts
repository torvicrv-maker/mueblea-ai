import type { FurnitureDimensions } from "./types";

export type DimensionKey = keyof FurnitureDimensions;

export interface FurniturePromptProposal {
  status: "ready" | "invalid" | "no_dimensions";
  dimensions: FurnitureDimensions;
  changedKeys: DimensionKey[];
  warnings: string[];
  message: string;
}

const NUMBER = "(\\d+(?:[.,]\\d+)?)";
const UNIT = "(mm|mil[ií]metros?|cm|cent[ií]metros?|mts?|metros?|m)";
const LABELS: Record<DimensionKey, string> = {
  width: "Ancho",
  height: "Alto",
  depth: "Fondo",
};

const KEYWORDS: Record<DimensionKey, string> = {
  width: "ancho|anchura|frente",
  height: "alto|altura",
  depth: "fondo|profundidad",
};

function toMillimeters(raw: string, unit?: string): { value: number; assumedUnit?: string } {
  const amount = Number(raw.replace(",", "."));
  const normalizedUnit = unit?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalizedUnit?.startsWith("mm") || normalizedUnit?.startsWith("milimetro")) return { value: Math.round(amount) };
  if (normalizedUnit?.startsWith("cm") || normalizedUnit?.startsWith("centimetro")) return { value: Math.round(amount * 10) };
  if (normalizedUnit) return { value: Math.round(amount * 1000) };
  if (amount <= 10) return { value: Math.round(amount * 1000), assumedUnit: "metros" };
  return { value: Math.round(amount), assumedUnit: "milímetros" };
}

function captureDimension(text: string, keywords: string): { value: number; assumedUnit?: string } | undefined {
  const before = new RegExp(`\\b(?:${keywords})\\b\\s*(?:de|a|:|=)?\\s*${NUMBER}\\s*(?:${UNIT})?\\b`, "i").exec(text);
  if (before) return toMillimeters(before[1], before[2]);

  const after = new RegExp(`${NUMBER}\\s*(?:${UNIT})?\\s*(?:de\\s*)?\\b(?:${keywords})\\b`, "i").exec(text);
  if (after) return toMillimeters(after[1], after[2]);
  return undefined;
}

export function proposeFurnitureDimensions(prompt: string, current: FurnitureDimensions): FurniturePromptProposal {
  const text = prompt.trim();
  const normalized = text.toLowerCase();
  const next = { ...current };
  const assumedUnits: string[] = [];
  const changed = new Set<DimensionKey>();

  const triplet = new RegExp(`${NUMBER}\\s*(?:x|×|por)\\s*${NUMBER}\\s*(?:x|×|por)\\s*${NUMBER}\\s*(?:${UNIT})?\\b`, "i").exec(normalized);
  if (triplet) {
    const sharedUnit = triplet[4];
    const converted = [triplet[1], triplet[2], triplet[3]].map((value) => toMillimeters(value, sharedUnit));
    next.width = converted[0].value;
    next.height = converted[1].value;
    next.depth = converted[2].value;
    changed.add("width"); changed.add("height"); changed.add("depth");
    converted.forEach((item) => { if (item.assumedUnit) assumedUnits.push(item.assumedUnit); });
  } else {
    for (const key of Object.keys(KEYWORDS) as DimensionKey[]) {
      const found = captureDimension(normalized, KEYWORDS[key]);
      if (!found) continue;
      next[key] = found.value;
      changed.add(key);
      if (found.assumedUnit) assumedUnits.push(found.assumedUnit);
    }

    if (!changed.has("width")) {
      const wardrobeSize = new RegExp(`\\b(?:cl[oó]set|armario|ropero)\\b.{0,30}?\\b(?:de|mide)\\s*${NUMBER}\\s*(?:${UNIT})?\\b`, "i").exec(normalized);
      if (wardrobeSize) {
        const converted = toMillimeters(wardrobeSize[1], wardrobeSize[2]);
        next.width = converted.value;
        changed.add("width");
        if (converted.assumedUnit) assumedUnits.push(converted.assumedUnit);
      }
    }
  }

  const warnings: string[] = [];
  if (/caj[oó]n|puerta|colgar|colgador|gaveta|entrepa[nñ]o/i.test(normalized)) {
    warnings.push("La distribución interior todavía no se puede editar; solo se aplicarán las medidas reconocidas.");
  }
  if (assumedUnits.length) {
    const distinct = [...new Set(assumedUnits)];
    warnings.push(`Sin unidad explícita asumí ${distinct.join(" y ")}.`);
  }
  if (changed.size === 0) {
    return {
      status: "no_dimensions",
      dimensions: current,
      changedKeys: [],
      warnings,
      message: "No encontré medidas compatibles. Prueba con: ancho 2400 mm, alto 2300 mm y fondo 600 mm.",
    };
  }

  const minimums: FurnitureDimensions = { width: 400, height: 500, depth: 250 };
  const invalid = (Object.keys(minimums) as DimensionKey[]).filter((key) => next[key] < minimums[key]);
  if (invalid.length) {
    return {
      status: "invalid",
      dimensions: current,
      changedKeys: [...changed],
      warnings,
      message: `${invalid.map((key) => LABELS[key]).join(", ")} por debajo del mínimo del modelo. Revisa la propuesta.`,
    };
  }

  return {
    status: "ready",
    dimensions: next,
    changedKeys: [...changed],
    warnings,
    message: `Propuesta: ${[...changed].map((key) => `${LABELS[key].toLowerCase()} ${next[key]} mm`).join(", " )}.`,
  };
}
