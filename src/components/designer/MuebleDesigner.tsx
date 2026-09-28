"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildWardrobe } from "@/core/furniture/buildWardrobe";
import { boardAreaM2, edgeLengthM } from "@/core/furniture/metrics";
import { PROJECT_STORAGE_KEY, readSavedProjects, writeSavedProjects } from "@/core/furniture/projectStorage";
import type { ProjectMaterialId, SavedFurnitureProject } from "@/core/furniture/projectStorage";
import type { FurnitureDimensions } from "@/core/furniture/types";
import type { FurniturePromptProposal, DimensionKey } from "@/core/furniture/promptProposal";
import { validateFurnitureModel } from "@/core/furniture/validateFurnitureModel";
import { DesignerAIPanel } from "./DesignerAIPanel";
import { FurniturePreview } from "./FurniturePreview";
import { GeneratedModelPreview } from "./GeneratedModelPreview";

const materials = [
  { id: "oak", name: "Roble claro", color: "#d9c19e", description: "Veta natural" },
  { id: "white", name: "Blanco mate", color: "#f0eee8", description: "Liso" },
  { id: "walnut", name: "Nogal", color: "#8c6245", description: "Tono oscuro" },
] as const;

type LeftTab = "library" | "elements";
type RightTab = "parameters" | "materials" | "assistant";

const DEFAULT_DIMENSIONS: FurnitureDimensions = { width: 2400, height: 2300, depth: 600 };

export function MuebleDesigner() {
  const [dimensions, setDimensions] = useState<FurnitureDimensions>(DEFAULT_DIMENSIONS);
  const [material, setMaterial] = useState<ProjectMaterialId>("oak");
  const [leftTab, setLeftTab] = useState<LeftTab>("elements");
  const [rightTab, setRightTab] = useState<RightTab>("parameters");
  const [selectedPartId, setSelectedPartId] = useState("side-left");
  const [projectName, setProjectName] = useState("Clóset base");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedFurnitureProject[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [assistantSession, setAssistantSession] = useState(0);
  const [proposal, setProposal] = useState<FurniturePromptProposal | null>(null);
  const [generatedModelBlob, setGeneratedModelBlob] = useState<Blob | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [showGeneratedModel, setShowGeneratedModel] = useState(false);

  useEffect(() => {
    try {
      setSavedProjects(readSavedProjects(window.localStorage.getItem(PROJECT_STORAGE_KEY)));
    } catch {
      setStorageMessage("El almacenamiento local no está disponible en este navegador.");
    }
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!showProjects) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowProjects(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showProjects]);

  useEffect(() => {
    if (!generatedModelBlob) {
      setGeneratedModelUrl(null);
      return;
    }
    const url = URL.createObjectURL(generatedModelBlob);
    setGeneratedModelUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [generatedModelBlob]);

  const model = useMemo(() => buildWardrobe(dimensions), [dimensions]);
  const displayedDimensions = proposal?.status === "ready" ? proposal.action.payload : dimensions;
  const displayedModel = useMemo(() => buildWardrobe(displayedDimensions), [displayedDimensions]);
  const area = boardAreaM2(displayedModel);
  const edges = edgeLengthM(displayedModel);
  const issues = validateFurnitureModel(displayedModel);
  const selectedPart = model.parts.find((part) => part.id === selectedPartId) ?? model.parts[0];
  const selectedMaterial = materials.find((item) => item.id === material) ?? materials[0];
  const isPreviewingProposal = proposal?.status === "ready";

  function updateDimension(key: DimensionKey, value: number) {
    setDimensions((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    setProposal(null);
    setStorageMessage("");
  }

  function updateMaterial(value: ProjectMaterialId) {
    setMaterial(value);
    setIsDirty(true);
    setStorageMessage("");
  }

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

  function saveProject() {
    const id = projectId ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `project-${Date.now()}`);
    const saved: SavedFurnitureProject = {
      id,
      name: projectName.trim() || "Clóset sin nombre",
      dimensions: { ...dimensions },
      material,
      updatedAt: new Date().toISOString(),
    };
    const nextProjects = [saved, ...savedProjects.filter((project) => project.id !== id)];
    try {
      window.localStorage.setItem(PROJECT_STORAGE_KEY, writeSavedProjects(nextProjects));
      setSavedProjects(nextProjects);
      setProjectId(id);
      setProjectName(saved.name);
      setIsDirty(false);
      setStorageMessage("Proyecto guardado en este dispositivo.");
    } catch {
      setStorageMessage("No se pudo guardar. Revisa el espacio disponible en el navegador.");
    }
  }

  function newProject() {
    if (isDirty && !window.confirm("Este diseño tiene cambios sin guardar. ¿Crear un proyecto nuevo y descartarlos?")) return;
    setProjectId(null);
    setProjectName("Clóset sin título");
    setDimensions(DEFAULT_DIMENSIONS);
    setMaterial("oak");
    setSelectedPartId("side-left");
    setProposal(null);
    setGeneratedModelBlob(null);
    setShowGeneratedModel(false);
    setAssistantSession((current) => current + 1);
    setIsDirty(false);
    setShowProjects(false);
    setStorageMessage("Proyecto nuevo");
  }

  function loadProject(project: SavedFurnitureProject) {
    if (isDirty && !window.confirm("Hay cambios sin guardar. ¿Abrir este proyecto y descartarlos?")) return;
    setProjectId(project.id);
    setProjectName(project.name);
    setDimensions({ ...project.dimensions });
    setMaterial(project.material);
    setSelectedPartId("side-left");
    setProposal(null);
    setGeneratedModelBlob(null);
    setShowGeneratedModel(false);
    setAssistantSession((current) => current + 1);
    setIsDirty(false);
    setStorageMessage("Proyecto cargado desde este dispositivo.");
    setShowProjects(false);
  }

  function deleteProject(id: string) {
    if (!window.confirm("¿Eliminar este proyecto guardado? Esta acción no se puede deshacer.")) return;
    const nextProjects = savedProjects.filter((project) => project.id !== id);
    try {
      window.localStorage.setItem(PROJECT_STORAGE_KEY, writeSavedProjects(nextProjects));
      setSavedProjects(nextProjects);
      if (projectId === id) {
        setProjectId(null);
        setIsDirty(true);
      }
    } catch {
      setStorageMessage("No se pudo actualizar la lista de proyectos guardados.");
    }
  }

  function applyProposal() {
    if (proposal?.status !== "ready") return;
    setDimensions({ ...proposal.action.payload });
    setProposal(null);
    setIsDirty(true);
    setStorageMessage("");
  }

  const saveLabel = storageMessage || (!storageLoaded ? "Preparando…" : isDirty ? "Cambios sin guardar" : projectId ? "Guardado en este dispositivo" : "Proyecto nuevo");

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
          <div className="projectName">
            <input aria-label="Nombre del proyecto" value={projectName} onChange={(event) => { setProjectName(event.target.value); setIsDirty(true); setStorageMessage(""); }} />
            <span>{saveLabel}</span>
          </div>
        </div>
        <div className="editorActions">
          <button className="toolbarQuiet" type="button" onClick={() => setShowProjects(true)}>Proyectos <span>{savedProjects.length}</span></button>
          <button className="saveProjectButton" type="button" onClick={saveProject} disabled={!storageLoaded}>Guardar</button>
          <button className="downloadButton" type="button" onClick={downloadCutList} disabled={isPreviewingProposal} title={isPreviewingProposal ? "Aplica o descarta la propuesta antes de descargar" : "Descargar el despiece actual en CSV"}><span aria-hidden="true">↓</span> CSV</button>
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
              <div className="libraryNote"><span aria-hidden="true">✦</span><p>Más plantillas se agregarán a la biblioteca.</p></div>
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
              <p className="panelFootnote">Selecciona una pieza para resaltarla en el modelo.</p>
            </div>
          )}
        </aside>

        <section className="designerCanvas" aria-label="Lienzo de diseño">
          <div className="canvasToolbar">
            <div><span className="canvasBreadcrumb">PROYECTO</span><span className="canvasProject"> / {projectName || "Clóset sin nombre"}</span></div>
            <div className="canvasToolbarControls">
              <span className={isPreviewingProposal ? "canvasViewLabel proposalViewLabel" : "canvasViewLabel"}><span />{showGeneratedModel ? "Referencia 3D desde foto" : isPreviewingProposal ? "Vista previa sin aplicar" : "Modelo 3D interactivo"}</span>
              {generatedModelUrl ? <button className="canvasModelToggle" type="button" onClick={() => setShowGeneratedModel((current) => !current)}>{showGeneratedModel ? "Ver clóset paramétrico" : "Ver 3D de la foto"}</button> : null}
            </div>
          </div>
          <div className="canvasStage">
            {showGeneratedModel && generatedModelUrl
              ? <GeneratedModelPreview modelUrl={generatedModelUrl} />
              : <FurniturePreview model={displayedModel} material={material} selectedPartId={selectedPartId} />}
            {!showGeneratedModel ? <div className="canvasSelection"><span className="selectionMark" />{selectedPart.name}<span>SELECCIONADO</span></div> : null}
            {!showGeneratedModel ? <div className="canvasScale">MM <span>·</span> {isPreviewingProposal ? "PROPUESTA" : "CLÓSET BASE"}</div> : null}
          </div>
          <section className="productionPanel" aria-label="Resumen de producción">
            <div className="productionHeading"><div><span className="panelEyebrow">{isPreviewingProposal ? "RESUMEN DE LA PROPUESTA" : "RESUMEN DEL MODELO"}</span><h2>{isPreviewingProposal ? "Vista previa de cambios" : "Listo para revisar"}</h2></div><span className={issues.length ? "validationTag warning" : "validationTag"}>{issues.length ? "Revisar medidas" : "✓ Medidas válidas"}</span></div>
            {showGeneratedModel ? <p className="generatedModelNote">El modelo de la foto es solo una referencia visual. Las piezas, medidas y el CSV de esta sección pertenecen al clóset paramétrico.</p> : null}
            <div className="productionMetrics">
              <div><span>Piezas</span><strong>{displayedModel.parts.length}</strong></div>
              <div><span>Área de tablero</span><strong>{area.toFixed(2)} <small>m²</small></strong></div>
              <div><span>Canto preliminar</span><strong>{edges.toFixed(2)} <small>m</small></strong></div>
              <div className="materialMetric"><span>Material</span><strong><i style={{ backgroundColor: selectedMaterial.color }} />{selectedMaterial.name}</strong></div>
            </div>
            <p className="productionNote">Estimación preliminar. Confirma espesores, cantos y sistema de armado antes de fabricar.</p>
          </section>
        </section>

        <aside className="editorPanel rightPanel" aria-label="Parámetros, materiales y Diseñador IA">
          <div className="panelTabs rightPanelTabs" role="tablist" aria-label="Ajustes del mueble">
            <button role="tab" aria-selected={rightTab === "parameters"} className={rightTab === "parameters" ? "panelTab active" : "panelTab"} onClick={() => setRightTab("parameters")}>Parámetros</button>
            <button role="tab" aria-selected={rightTab === "materials"} className={rightTab === "materials" ? "panelTab active" : "panelTab"} onClick={() => setRightTab("materials")}>Materiales</button>
            <button role="tab" aria-selected={rightTab === "assistant"} className={rightTab === "assistant" ? "panelTab active" : "panelTab"} onClick={() => setRightTab("assistant")}>Diseñador IA</button>
          </div>

          {rightTab === "parameters" ? (
            <div className="panelContent">
              <div className="parameterTitle"><div><span className="panelEyebrow">DIMENSIONES GENERALES</span><h2>Clóset base</h2></div><span className="parameterIcon" aria-hidden="true">↗</span></div>
              <p className="panelDescription">Las medidas controlan el modelo completo.</p>
              <div className="dimensionList editorDimensionList">
                <DimensionField label="Ancho" value={dimensions.width} setValue={(value) => updateDimension("width", value)} min={400} />
                <DimensionField label="Alto" value={dimensions.height} setValue={(value) => updateDimension("height", value)} min={500} />
                <DimensionField label="Fondo" value={dimensions.depth} setValue={(value) => updateDimension("depth", value)} min={250} />
              </div>
              <div className="selectionDetails">
                <div className="panelDivider" />
                <span className="panelEyebrow">PIEZA SELECCIONADA</span>
                <strong>{selectedPart.name}</strong>
                <div className="selectedPartSize"><span>Largo <b>{Math.round(selectedPart.length)} mm</b></span><span>Ancho <b>{Math.round(selectedPart.width)} mm</b></span><span>Espesor <b>{Math.round(selectedPart.thickness)} mm</b></span></div>
              </div>
              <button className="assistantShortcut" type="button" onClick={() => setRightTab("assistant")}><span aria-hidden="true">✦</span><span><strong>¿Prefieres describirlo?</strong><small>Proponer medidas desde texto</small></span><span aria-hidden="true">→</span></button>
            </div>
          ) : rightTab === "materials" ? (
            <div className="panelContent">
              <div className="parameterTitle"><div><span className="panelEyebrow">ACABADO DEL MODELO</span><h2>Material</h2></div><span className="parameterIcon" aria-hidden="true">◒</span></div>
              <p className="panelDescription">Elige un acabado para el modelo y la ilustración.</p>
              <div className="materialOptions" role="radiogroup" aria-label="Acabado del clóset">
                {materials.map((item) => (
                  <button key={item.id} className={material === item.id ? "materialOption selected" : "materialOption"} type="button" role="radio" aria-checked={material === item.id} onClick={() => updateMaterial(item.id)}>
                    <span className="materialSwatch" style={{ backgroundColor: item.color }} />
                    <span><strong>{item.name}</strong><small>{item.description}</small></span>
                    <span className="materialRadio" />
                  </button>
                ))}
              </div>
              <div className="materialDisclaimer"><strong>Acabado visual</strong><p>El color de referencia cambia; el cálculo no incluye precios ni optimización de tableros.</p></div>
            </div>
          ) : (
            <DesignerAIPanel
              key={assistantSession}
              dimensions={dimensions}
              proposal={proposal}
              onProposalChange={setProposal}
              onApplyProposal={applyProposal}
              hasGeneratedModel={Boolean(generatedModelBlob)}
              onGeneratedModel={(blob) => { setGeneratedModelBlob(blob); setShowGeneratedModel(true); }}
              onClearGeneratedModel={() => { setGeneratedModelBlob(null); setShowGeneratedModel(false); }}
            />
          )}
        </aside>
      </div>

      <footer className="editorFooter"><span>Mueblea IA <i /> Diseñador paramétrico</span><span>Los proyectos se guardan en este navegador, no en la nube.</span></footer>

      {showProjects ? (
        <div className="modalBackdrop" onMouseDown={() => setShowProjects(false)}>
          <section className="projectsDialog" role="dialog" aria-modal="true" aria-labelledby="projects-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="projectsDialogHeader"><div><span className="panelEyebrow">ALMACENAMIENTO LOCAL</span><h2 id="projects-title">Tus proyectos</h2></div><button type="button" aria-label="Cerrar proyectos" onClick={() => setShowProjects(false)}>×</button></div>
            <p className="projectsDialogCopy">Solo se ven en este navegador y dispositivo. El guardado en la nube llegará en una fase posterior.</p>
            {storageMessage ? <p className={storageMessage.startsWith("No se") || storageMessage.includes("no está disponible") ? "storageError" : "storageSuccess"}>{storageMessage}</p> : null}
            {savedProjects.length ? (
              <div className="savedProjectList">
                {savedProjects.map((project) => (
                  <article className="savedProjectRow" key={project.id}>
                    <button className="openSavedProject" type="button" onClick={() => loadProject(project)}>
                      <strong>{project.name}</strong>
                      <span>{project.dimensions.width} × {project.dimensions.height} × {project.dimensions.depth} mm <i /> {project.updatedAt.slice(0, 10)}</span>
                    </button>
                    <button className="deleteSavedProject" type="button" aria-label={`Eliminar ${project.name}`} onClick={() => deleteProject(project.id)}>Eliminar</button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyProjects"><span aria-hidden="true">▱</span><strong>Aún no hay proyectos guardados</strong><small>Guarda este clóset para encontrarlo aquí.</small></div>
            )}
            <div className="projectsDialogFooter"><button type="button" className="newProjectButton" onClick={newProject}>＋ Nuevo proyecto</button><button type="button" className="dialogDoneButton" onClick={() => setShowProjects(false)}>Listo</button></div>
          </section>
        </div>
      ) : null}
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
