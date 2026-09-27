import type { Axis, FurniturePart } from "./types";

export function partWorldSize(part: FurniturePart): [number, number, number] {
  const size: Record<Axis, number> = { x: 0, y: 0, z: 0 };
  size[part.orientation.lengthAxis] = part.length;
  size[part.orientation.widthAxis] = part.width;
  size[part.orientation.thicknessAxis] = part.thickness;
  return [size.x, size.y, size.z];
}
