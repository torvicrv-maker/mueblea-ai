"use client";

import { useMemo, useState } from "react";
import { buildWardrobe } from "@/core/furniture/buildWardrobe";
import { boardAreaM2, edgeLengthM } from "@/core/furniture/metrics";
import { FurniturePreview } from "./FurniturePreview";
import { validateFurnitureModel } from "@/core/furniture/validateFurnitureModel";

export function MuebleDesigner() {
  const [width, setWidth] = useState(2400);
  const [height, setHeight] = useState(2300);
  const [depth, setDepth] = useState(600);

  const model = useMemo(() => buildWardrobe({ width, height, depth }), [width, height, depth]);
  const area = boardAreaM2(model);
  const edges = edgeLengthM(model);
  const issues = validateFurnitureModel(model);

  return (
    <main className="appShell">
      <header className="topbar">
        <div className="brandGroup">
          <div className="brandMark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m4 8 8-4 8 4v9l-8 4-8-4V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="m4.5 8.5 7.5 4 7.5-4M12 13v7.5M8 6l8 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="brand">Mueblea<span className="brandAI">AI</span></div>
        </div>
        <div className="topStatus"><span className="statusDot" />Diseñador inicial</div>
      </header>

      <div className="pageIntro">
        <div className="eyebrow">Tu taller, en una pantalla</div>
        <h1>Diseña tu mueble</h1>
        <p>Ajusta las medidas y revisa el modelo junto con un despiece preliminar.</p>
      </div>

      <section className="workspace" aria-label="Diseñador de clóset">
        <aside className="sidebar" aria-label="Configuración del mueble">
          <div className="card">
            <div className="cardTitleRow">
              <h2>Clóset base</h2>
              <span className="miniBadge">Melamina</span>
            </div>
            <p>Las medidas están en milímetros. Puedes cambiarlas cuando quieras.</p>
            <div className="dimensionList">
              <DimensionField label="Ancho" value={width} setValue={setWidth} min={400} />
              <DimensionField label="Alto" value={height} setValue={setHeight} min={500} />
              <DimensionField label="Fondo" value={depth} setValue={setDepth} min={250} />
            </div>
          </div>

          <div className="aiBox">
            <div className="aiTitle"><span className="aiIcon" aria-hidden="true">✦</span>Asistente IA <span className="miniBadge">Próximamente</span></div>
            <p>Después podrás describir el mueble con tus palabras y revisar la propuesta antes de aplicarla.</p>
            <span className="aiExample">“Un clóset de 2,40 m con cajones y espacio para colgar”</span>
          </div>
        </aside>

        <section className="viewport" aria-label="Vista previa del mueble">
          <div className="previewCard">
            <div className="previewHeader">
              <div>
                <div className="previewHeading">Vista del mueble</div>
                <div className="previewHint">Se actualiza al cambiar las medidas</div>
              </div>
              <span className="previewPill">Vista isométrica</span>
            </div>
            <FurniturePreview model={model} />
            <div className="previewFoot"><span>Modelo paramétrico</span><strong>{issues.length === 0 ? "Medidas válidas" : "Revisar medidas"}</strong></div>
          </div>
        </section>

        <aside className="inspector" aria-label="Resumen de producción">
          <div className="card">
            <div className="cardTitleRow"><h2>Resumen</h2><span className="miniBadge">Estimado</span></div>
            <p>Material calculado a partir del modelo actual.</p>
            <div className="metricList">
              <div className="metric"><span>Piezas</span><strong>{model.parts.length}</strong></div>
              <div className="metric emphasis"><span>Área de tablero</span><strong>{area.toFixed(2)} m²</strong></div>
              <div className="metric"><span>Canto preliminar</span><strong>{edges.toFixed(2)} m</strong></div>
            </div>
            <div className="validation">{issues.length === 0 ? "Estructura válida" : `${issues.length} observación(es)`}</div>
          </div>

          <div className="card">
            <div className="cardTitleRow"><h2>Despiece</h2><span className="miniBadge">{model.parts.length} piezas</span></div>
            <div className="pieceList">
              {model.parts.map((part) => (
                <div className="piece" key={part.id}>
                  <span className="pieceName">{part.name}</span>
                  <span className="pieceSize">{Math.round(part.length)} × {Math.round(part.width)} × {Math.round(part.thickness)} mm</span>
                </div>
              ))}
            </div>
            <p className="note">Despiece orientativo. Antes de fabricar, confirma espesores, cantos y sistema de armado.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function DimensionField({ label, value, setValue, min }: { label: string; value: number; setValue: (n: number) => void; min: number }) {
  const id = `dimension-${label.toLowerCase()}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}<span className="fieldUnit">mm</span></label>
      <div className="inputWrap">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          step={10}
          value={value}
          onChange={(event) => setValue(Math.max(min, Number(event.target.value) || min))}
        />
        <span className="inputUnit" aria-hidden="true">mm</span>
      </div>
    </div>
  );
}
