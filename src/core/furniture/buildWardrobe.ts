import type { FurnitureModel, FurniturePart, WardrobeLayout } from "./types";
import { DEFAULT_WARDROBE_LAYOUT, normalizeWardrobeLayout } from "./wardrobeLayout";

export interface WardrobeInput {
  width: number;
  height: number;
  depth: number;
  thickness?: number;
  materialId?: string;
  layout?: WardrobeLayout;
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
  layout = DEFAULT_WARDROBE_LAYOUT,
}: WardrobeInput): FurnitureModel {
  if (width < 400 || height < 500 || depth < 250) {
    throw new Error("El mueble es demasiado pequeño para la plantilla base.");
  }
  if (![width, height, depth, thickness].every(Number.isFinite) || thickness < 12 || thickness > 30) {
    throw new Error("Revisa las medidas y el espesor del tablero.");
  }

  const normalizedLayout = normalizeWardrobeLayout(layout);
  if (!normalizedLayout) throw new Error("La distribución del clóset no es válida.");

  const innerWidth = width - thickness * 2;
  const innerHeight = height - thickness * 2;
  const shelfDepth = depth - 20;
  const partitionCount = normalizedLayout.sections.length - 1;
  const totalClearWidth = innerWidth - partitionCount * thickness;
  if (totalClearWidth < normalizedLayout.sections.length * 250) {
    throw new Error("Las divisiones dejan espacios demasiado estrechos. Reduce las secciones.");
  }

  const vertical = { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" } as const;
  const horizontal = { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" } as const;
  const front = { lengthAxis: "y", widthAxis: "x", thicknessAxis: "z" } as const;
  const parts: FurniturePart[] = [
    part({ id: "side-left", name: "Lateral izquierdo", materialId, length: height, width: depth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: thickness / 2, y: height / 2, z: depth / 2 }, orientation: vertical }),
    part({ id: "side-right", name: "Lateral derecho", materialId, length: height, width: depth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: width - thickness / 2, y: height / 2, z: depth / 2 }, orientation: vertical }),
    part({ id: "top", name: "Tapa", materialId, length: innerWidth, width: depth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: width / 2, y: height - thickness / 2, z: depth / 2 }, orientation: horizontal }),
    part({ id: "bottom", name: "Piso", materialId, length: innerWidth, width: depth, thickness, grainAxis: "length", edgedSides: ["widthStart"], transform: { x: width / 2, y: thickness / 2, z: depth / 2 }, orientation: horizontal }),
  ];

  let sectionStartX = thickness;
  normalizedLayout.sections.forEach((section, index) => {
    const sectionWidth = totalClearWidth * section.widthRatio;
    const sectionCenterX = sectionStartX + sectionWidth / 2;
    const sectionLabel = `sección ${index + 1}`;
    let drawersHeight = 0;

    if (index < partitionCount) {
      const partitionX = sectionStartX + sectionWidth + thickness / 2;
      parts.push(part({
        id: `partition-${String(index + 1).padStart(2, "0")}`,
        name: `División vertical ${index + 1}`,
        materialId,
        length: innerHeight,
        width: shelfDepth,
        thickness,
        grainAxis: "length",
        edgedSides: ["widthStart"],
        transform: { x: partitionX, y: height / 2, z: shelfDepth / 2 },
        orientation: vertical,
      }));
    }

    if (section.frontStyle === "doors") {
      const doorCount = sectionWidth >= 850 ? 2 : 1;
      const doorHeight = height - 6;
      const doorWidth = (sectionWidth - (doorCount + 1) * 3) / doorCount;
      for (let doorIndex = 0; doorIndex < doorCount; doorIndex += 1) {
        const doorCenterX = sectionStartX + 3 + doorWidth / 2 + doorIndex * (doorWidth + 3);
        parts.push(part({
          id: `door-${String(index + 1).padStart(2, "0")}-${String(doorIndex + 1).padStart(2, "0")}`,
          name: `Puerta ${sectionLabel}${doorCount > 1 ? ` · ${doorIndex + 1}` : ""}`,
          materialId,
          length: doorHeight,
          width: doorWidth,
          thickness,
          grainAxis: "length",
          edgedSides: ["lengthStart", "lengthEnd", "widthStart", "widthEnd"],
          transform: { x: doorCenterX, y: height / 2, z: depth - thickness / 2 },
          orientation: front,
        }));
      }
    }

    if (section.frontStyle === "drawers") {
      drawersHeight = Math.min(650, innerHeight * 0.38);
      const gap = 3;
      const drawerFaceHeight = (drawersHeight - gap * (section.drawerCount + 1)) / section.drawerCount;
      const drawerFrontWidth = sectionWidth - 4;
      if (drawerFrontWidth < 150) throw new Error(`La sección ${index + 1} no tiene ancho para cajones.`);
      for (let drawerIndex = 0; drawerIndex < section.drawerCount; drawerIndex += 1) {
        const drawerCenterY = thickness + gap + drawerFaceHeight / 2 + drawerIndex * (drawerFaceHeight + gap);
        parts.push(part({
          id: `drawer-front-${String(index + 1).padStart(2, "0")}-${String(drawerIndex + 1).padStart(2, "0")}`,
          name: `Frente de cajón ${sectionLabel} · ${drawerIndex + 1}`,
          materialId,
          length: drawerFaceHeight,
          width: drawerFrontWidth,
          thickness,
          grainAxis: "length",
          edgedSides: ["lengthStart", "lengthEnd", "widthStart", "widthEnd"],
          transform: { x: sectionCenterX, y: drawerCenterY, z: depth - thickness / 2 },
          orientation: front,
        }));
      }
    }

    const upperInteriorHeight = innerHeight - drawersHeight;
    for (let shelfIndex = 0; shelfIndex < section.shelfCount; shelfIndex += 1) {
      const legacySingleShelf = normalizedLayout.sections.length === 1 && section.shelfCount === 1 && drawersHeight === 0;
      const shelfY = legacySingleShelf
        ? thickness + innerHeight * 0.52
        : thickness + drawersHeight + upperInteriorHeight * (shelfIndex + 1) / (section.shelfCount + 1);
      const legacySingleId = normalizedLayout.sections.length === 1 && section.shelfCount === 1 && drawersHeight === 0;
      parts.push(part({
        id: legacySingleId ? "shelf-01" : `shelf-${String(index + 1).padStart(2, "0")}-${String(shelfIndex + 1).padStart(2, "0")}`,
        name: normalizedLayout.sections.length === 1 && section.shelfCount === 1
          ? "Repisa"
          : `Repisa ${sectionLabel} · ${shelfIndex + 1}`,
        materialId,
        length: sectionWidth,
        width: shelfDepth,
        thickness,
        grainAxis: "length",
        edgedSides: ["widthStart"],
        transform: { x: sectionCenterX, y: shelfY, z: shelfDepth / 2 },
        orientation: horizontal,
      }));
    }

    sectionStartX += sectionWidth + (index < partitionCount ? thickness : 0);
  });

  return {
    id: "wardrobe-parametric",
    kind: "wardrobe",
    version: 2,
    dimensions: { width, height, depth },
    materialId,
    layout: normalizedLayout,
    parts,
  };
}
