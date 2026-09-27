import type { FurnitureModel } from "@/core/furniture/types";

type FurnitureMaterial = "oak" | "white" | "walnut";

export function FurniturePreview({ model, material = "oak", variant = "canvas" }: { model: FurnitureModel; material?: FurnitureMaterial; variant?: "canvas" | "hero" }) {
  const frontHeight = Math.max(250, Math.min(350, 340 * (model.dimensions.height / 2300)));
  const frontWidth = Math.max(190, Math.min(390, frontHeight * (model.dimensions.width / model.dimensions.height)));
  const depthX = Math.max(48, Math.min(118, frontHeight * (model.dimensions.depth / model.dimensions.height) * 1.15));
  const depthY = depthX * 0.48;
  const left = (720 - frontWidth - depthX) / 2;
  const top = 100 + (350 - frontHeight) / 2;
  const right = left + frontWidth;
  const bottom = top + frontHeight;
  const inner = 13;
  const shelfY = top + frontHeight * 0.53;

  return (
    <div className={`viewportStage ${variant === "hero" ? "heroPreviewStage" : ""}`} data-material={material}>
      <svg className="cabinetSvg" viewBox="0 0 720 560" role="img" aria-label={`Vista isométrica de clóset de ${model.dimensions.width} por ${model.dimensions.height} por ${model.dimensions.depth} milímetros`}>
        <ellipse cx={left + frontWidth / 2 + depthX * .42} cy={bottom + 20} rx={frontWidth * .62} ry="19" fill="#605541" opacity=".08" />

        <path className="cabinetSide" d={`M ${right} ${top} L ${right + depthX} ${top - depthY} L ${right + depthX} ${bottom - depthY} L ${right} ${bottom} Z`} />
        <path className="cabinetTop" d={`M ${left} ${top} L ${left + depthX} ${top - depthY} L ${right + depthX} ${top - depthY} L ${right} ${top} Z`} />
        <rect className="cabinetFront" x={left} y={top} width={frontWidth} height={frontHeight} rx="2" />
        <rect className="cabinetInner" x={left + inner} y={top + inner} width={frontWidth - inner * 2} height={frontHeight - inner * 2} rx="1" />

        <path className="cabinetShelf" d={`M ${left + inner} ${shelfY} L ${right - inner} ${shelfY} L ${right - inner + depthX * .18} ${shelfY - depthY * .18} L ${left + inner + depthX * .18} ${shelfY - depthY * .18} Z`} />
        <line className="cabinetLine" x1={left + inner} y1={shelfY + 7} x2={right - inner} y2={shelfY + 7} />

        <path d={`M ${left + inner} ${top + inner} V ${bottom - inner} M ${right - inner} ${top + inner} V ${bottom - inner}`} stroke="#c3ad91" strokeWidth="1" fill="none" opacity=".75" />
        <circle cx={right - inner - 9} cy={top + frontHeight * .34} r="2.4" fill="#aa8b67" />
      </svg>

      <div className="previewDimensions" aria-label="Dimensiones actuales">
        <span className="dimensionChip">{model.dimensions.width} mm ancho</span>
        <span className="dimensionChip">{model.dimensions.height} mm alto</span>
        <span className="dimensionChip">{model.dimensions.depth} mm fondo</span>
      </div>
    </div>
  );
}
