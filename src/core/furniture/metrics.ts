import type { EdgeSide, FurnitureModel, FurniturePart } from "./types";

export function boardAreaM2(model: FurnitureModel) {
  return model.parts.reduce((sum, p) => sum + p.length * p.width, 0) / 1_000_000;
}

function edgeMm(part: FurniturePart, edge: EdgeSide) {
  return edge === "widthStart" || edge === "widthEnd" ? part.length : part.width;
}

export function edgeLengthM(model: FurnitureModel) {
  return model.parts.reduce((sum, p) => sum + p.edgedSides.reduce((s, edge) => s + edgeMm(p, edge), 0), 0) / 1000;
}
