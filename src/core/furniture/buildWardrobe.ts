import type { FurnitureModel, FurniturePart } from "./types";

export interface WardrobeInput {
  width: number;
  height: number;
  depth: number;
  thickness?: number;
  materialId?: string;
}

function part(input: FurniturePart): FurniturePart {
  if (input.length <= 0 || input.width <= 0 || input.thickness <= 0) {
    throw new Error(`Dimensión inválida en ${input.id}`);
  }
  const axes = new Set(Object.values(input.orientation));
  if (axes.size !== 3) throw new Error(`Orientación inválida en ${input.id}`);
  return input;
}

export function buildWardrobe({
  width,
  height,
  depth,
  thickness = 18,
  materialId = "melamine-white-18",
}: WardrobeInput): FurnitureModel {
  if (width < 400 || height < 500 || depth < 250) {
    throw new Error("El mueble es demasiado pequeño para la plantilla base.");
  }

  const innerWidth = width - thickness * 2;
  const innerHeight = height - thickness * 2;
  const shelfDepth = depth - 20;
  const shelfY = thickness + innerHeight * 0.52;

  const vertical = { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" } as const;
  const horizontal = { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" } as const;

  const parts: FurniturePart[] = [
    part({ id: "side-left", name: "Lateral izquierdo", materialId, length: height, width: depth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: thickness / 2, y: height / 2, z: depth / 2 }, orientation: vertical }),
    part({ id: "side-right", name: "Lateral derecho", materialId, length: height, width: depth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: width - thickness / 2, y: height / 2, z: depth / 2 }, orientation: vertical }),
    part({ id: "top", name: "Tapa", materialId, length: innerWidth, width: depth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: width / 2, y: height - thickness / 2, z: depth / 2 }, orientation: horizontal }),
    part({ id: "bottom", name: "Piso", materialId, length: innerWidth, width: depth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: width / 2, y: thickness / 2, z: depth / 2 }, orientation: horizontal }),
    part({ id: "shelf-01", name: "Repisa", materialId, length: innerWidth, width: shelfDepth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: width / 2, y: shelfY, z: shelfDepth / 2 }, orientation: horizontal }),
  ];

  return { id: "wardrobe-demo", kind: "wardrobe", version: 1, dimensions: { width, height, depth }, materialId, parts };
}
