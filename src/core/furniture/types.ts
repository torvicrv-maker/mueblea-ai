export type Axis = "x" | "y" | "z";
export type EdgeSide = "lengthStart" | "lengthEnd" | "widthStart" | "widthEnd";

export interface FurnitureDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface PartTransform {
  x: number;
  y: number;
  z: number;
}

export interface PartOrientation {
  lengthAxis: Axis;
  widthAxis: Axis;
  thicknessAxis: Axis;
}

export interface FurniturePart {
  id: string;
  name: string;
  materialId: string;
  /** Dimensiones canónicas de fabricación, en mm. */
  length: number;
  width: number;
  thickness: number;
  grainAxis: "length" | "width";
  edgedSides: EdgeSide[];
  /** Centro de la pieza en el sistema del mueble. */
  transform: PartTransform;
  /** Mapea dimensiones de fabricación a ejes X/Y/Z para render y colisiones. */
  orientation: PartOrientation;
}

export interface FurnitureModel {
  id: string;
  kind: "wardrobe";
  version: number;
  dimensions: FurnitureDimensions;
  materialId: string;
  parts: FurniturePart[];
}
