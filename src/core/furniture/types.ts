export type Axis = "x" | "y" | "z";
export type EdgeSide = "lengthStart" | "lengthEnd" | "widthStart" | "widthEnd";

export interface FurnitureDimensions {
  width: number;
  height: number;
  depth: number;
}

export type WardrobeFrontStyle = "open" | "doors" | "drawers";

export interface WardrobeSection {
  /** Participación relativa del ancho interior. Se normaliza al construir el mueble. */
  widthRatio: number;
  shelfCount: number;
  hanging: boolean;
  frontStyle: WardrobeFrontStyle;
  drawerCount: number;
}

export interface WardrobeLayout {
  sections: WardrobeSection[];
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
  layout: WardrobeLayout;
  parts: FurniturePart[];
}
