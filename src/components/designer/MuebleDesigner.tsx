"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildWardrobe } from "@/core/furniture/buildWardrobe";
import { boardAreaM2, edgeLengthM } from "@/core/furniture/metrics";
import { validateFurnitureModel } from "@/core/furniture/validateFurnitureModel";
import { FurniturePreview } from "./FurniturePreview";

const materials = [
  { id: "oak", name: "Roble claro", color: "#d9c19e", description: "Veta natural" },
  { id: "white", name: "Blanco mate", color: "#f0eee8", description: "Liso" },
  { id: "walnut", name: "Nogal", color: "#8c6245", description: "Tono oscuro" },
] as const;
type MaterialId = (typeof materials)[number]["id"];
type LeftTab = "library" | "elements";
type RightTab = "parameters" | "materials";

export function MuebleDesigner() {
  const [width, setWidth] = useState(2400);
  const [height, setHeight] = useState(2300);
  const [depth, setDepth] = useState(600);
  const [material, setMaterial] = useState<MaterialId>("oak");
  const [leftTab, setLeftTab] = useState<LeftTab>("elements");
  const [rightTab, setRightTab] = useState<RightTab>("parameters");
  const [selectedPartId, setSelectedPartId] = useState("side-left");

  const model = useMemo(() => buildWardrobe({ width, height, depth }), [width, height, depth]);
  const area = boardAreaM2(model);
  const edges = edgeLengthM(model);
  const issues = validateFurnitureModel(model);
  const selectedPart = model.parts.find((part) => part.id === selectedPartId) ?? model.parts[0];
  const selectedMaterial = materials.find((item) => item.id === material) ?? materials[0];

  function downloadCutList() {
    const rows = [
      ["Pieza", "Largo (mm)", "Ancho (mm)", "Espesor (mm)"],
      ...model.parts.map((part) => [part.name, Math.round(part.length), Math.round(part.width), Math.round(part.thickness)]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "despiece-closet.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="designerApp">
      <header className="editorTopbar">
        <div className="editorBrandSide">
          <Link className="editorBack" href="/" aria-label="Volver a Mueblea IA">←</Link>
          <Link className="brandGroup editorBrand" href="/" aria-label="Mueblea IA, inicio">
            <span className="brandMark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="m4 8 8-4 8 4v9l-8 4-8-4V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="m4.5 8.5 7.5 4 7.5-4M12 13v7.5M8 6l8 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            </span>
            <span className="brand">Mueblea<span className="brandAI">IA</span></span>
          </Link>
          <span className="editorDivider" />
          <div className="projectName"><strong>Clóset base</strong><span>Proyecto nuevo</span></div>
        </div>
        <div className="editorActions">
          <span className="localStatus"><span /> Prototipo interactivo</span>
          <button className="downloadButton" type="button" onClick={downloadCutList}><span aria-hidden="true">↓</span> Descargar despiece</button>
        </div>
      </header>

      <div className="editorLayout">
        <aside className="editorPanel leftPanel" aria-label="Biblioteca y elementos del modelo">
          <div className="panelTabs" role="tablist" aria-label="Panel del proyecto">
            <button role="tab" aria-selected={leftTab === "library"} className={leftTab === "library" ? "panelTab active" : "panelTab"} onClick={() => setLeftTab("library")}>Biblioteca</button>
            <button role="tab" aria-selected={leftTab === "elements"} className={leftTab === "elements" ? "panelTab active" : "panelTab"} onClick={() => setLeftTab("elements")}>Elementos <span>{model.parts.length}</span></button>
          </div>

          {leftTab === "library" ? (
            <div className="panelContent">
              <div className="panelHeading"><span>MODELOS</span><span>1 disponible</span></div>
              <button className="libraryModel selected" type="button" onClick={() => setLeftTab("elements")}>
                <span className="libraryModelIcon" aria-hidden="true"><span /></span>
                <span><strong>Clóset base</strong><small>Modelo paramétrico</small></span>
                <span className="libraryCheck" aria-hidden="true">✓</span>
              </button>
              <div className="libraryNote"><span aria-hidden="true">✦</span><p>La biblioteca crecerá con más plantillas de muebles.</p></div>
            </div>
          ) : (
            <div className="panelContent">
              <div className="panelHeading"><span>PIEZAS DEL CLÓSET</span><span>{model.parts.length} total</span></div>
              <div className="elementList">
                {model.parts.map((part, index) => (
                  <button key={part.id} className={selectedPart.id === part.id ? "elementRow selected" : "elementRow"} type="button" onClick={() => { setSelectedPartId(part.id); setRightTab("parameters"); }}>
                    <span className="elementThumb" aria-hidden="true"><span /></span>
                    <span className="elementInfo"><strong>{part.name}</strong><small>{Math.round(part.length)} × {Math.round(part.width)} mm</small></span>
                    <span className="elementIndex">{String(index + 1).padStart(2, "0")}</span>
                  </button>
                ))}
              </div>
              <p className="panelFootnote">Selecciona una pieza para consultar sus dimensiones.</p>
            </div>
          )}
        </aside>

        <section className="designerCanvas" aria-label="Lienzo de diseño">
          <div className="canvasToolbar">
            <div><span className="canvasBreadcrumb">PROYECTO</span><span className="canvasProject"> / Clóset base</span></div>
            <span className="canvasViewLabel"><span /> Vista isométrica</span>
          </div>
          <div className="canvasStage">
            <FurniturePreview model={model} material={material} />
            <div className="canvasSelection"><span className="selectionMark" />{selectedPart.name}<span>SELECCIONADO</span></div>
            <div className="canvasScale">MM <span>·</span> ILUSTRATIVO</div>
          </div>
          <section className="productionPanel" aria-label="Resumen de producción">
            <div className="productionHeading"><div><span className="panelEyebrow">RESUMEN DEL MODELO</span><h2>Listo para revisar</h2></div><span className={issues.length ? "validationTag warning" : "validationTag"}>{issues.length ? "Revisar medidas" : "✓ Medidas válidas"}</span></div>
            <div className="productionMetrics">
              <div><span>Piezas</span><strong>{model.parts.length}</strong></div>
              <div><span>Área de tablero</span><strong>{area.toFixed(2)} <small>m²</small></strong></div>
              <div><span>Canto preliminar</span><strong>{edges.toFixed(2)} <small>m</small></strong></div>
              <div className="materialMetric"><span>Material</span><strong><i style={{ backgroundColor: selectedMaterial.color }} />{selectedMaterial.name}</strong></div>
            </div>
            <p className="productionNote">Estimación preliminar. Confirma espesores, cantos y sistema de armado antes de fabricar.</p>
          </section>
        </section>

        <aside className="editorPanel rightPanel" aria-label="Parámetros y materiales">
          <div className="panelTabs" role="tablist" aria-label="Ajustes del mueble">
            <button role="tab" aria-selected={rightTab === "parameters"} className={rightTab === "parameters" ? "panelTab active" : "panelTab"} onClick={() => setRightTab("parameters")}>Parámetros</button>
            <button role="tab" aria-selected={rightTab === "materials"} className={rightTab === "materials" ? "panelTab active" : "panelTab"} onClick={() => setRightTab("materials")}>Materiales</button>
          </div>

          {rightTab === "parameters" ? (
            <div className="panelContent">
              <div className="parameterTitle"><div><span className="panelEyebrow">DIMENSIONES GENERALES</span><h2>Clóset base</h2></div><span className="parameterIcon" aria-hidden="true">↗</span></div>
              <p className="panelDescription">Las medidas controlan el modelo completo.</p>
              <div className="dimensionList editorDimensionList">
                <DimensionField label="Ancho" value={width} setValue={setWidth} min={400} />
                <DimensionField label="Alto" value={height} setValue={setHeight} min={500} />
                <DimensionField label="Fondo" value={depth} setValue={setDepth} min={250} />
              </div>
              <div className="selectionDetails">
                <div className="panelDivider" />
                <span className="panelEyebrow">PIEZA SELECCIONADA</span>
                <strong>{selectedPart.name}</strong>
                <div className="selectedPartSize"><span>Largo <b>{Math.round(selectedPart.length)} mm</b></span><span>Ancho <b>{Math.round(selectedPart.width)} mm</b></span><span>Espesor <b>{Math.round(selectedPart.thickness)} mm</b></span></div>
              </div>
              <div className="aiNotice"><span aria-hidden="true">✦</span><p><strong>Diseño con IA</strong><br />La generación desde texto llegará en una siguiente fase.</p></div>
            </div>
          ) : (
            <div className="panelContent">
              <div className="parameterTitle"><div><span className="panelEyebrow">ACABADO DEL MODELO</span><h2>Material</h2></div><span className="parameterIcon" aria-hidden="true">◒</span></div>
              <p className="panelDescription">Elige un acabado para la vista previa.</p>
              <div className="materialOptions" role="radiogroup" aria-label="Acabado del clóset">
                {materials.map((item) => (
                  <button key={item.id} className={material === item.id ? "materialOption selected" : "materialOption"} type="button" role="radio" aria-checked={material === item.id} onClick={() => setMaterial(item.id)}>
                    <span className="materialSwatch" style={{ backgroundColor: item.color }} />
                    <span><strong>{item.name}</strong><small>{item.description}</small></span>
                    <span className="materialRadio" />
                  </button>
                ))}
              </div>
              <div className="materialDisclaimer"><strong>Vista de referencia</strong><p>El acabado cambia la ilustración. El cálculo actual no incluye precio ni optimización de tableros.</p></div>
            </div>
          )}
        </aside>
      </div>

      <footer className="editorFooter"><span>Mueblea IA <i /> Diseñador paramétrico</span><span>Los cambios se calculan en esta sesión; todavía no hay guardado.</span></footer>
    </main>
  );
}

function DimensionField({ label, value, setValue, min }: { label: string; value: number; setValue: (n: number) => void; min: number }) {
  const id = `dimension-${label.toLowerCase()}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="inputWrap">
        <input id={id} type="number" inputMode="numeric" min={min} step={10} value={value} onChange={(event) => setValue(Math.max(min, Number(event.target.value) || min))} />
        <span className="inputUnit" aria-hidden="true">mm</span>
      </div>
    </div>
  );
}
