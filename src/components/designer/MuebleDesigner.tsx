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
        <div className="brand">Mueblea AI</div>
        <div className="badge">BLOQUE 0 · modelo paramétrico</div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="card">
            <h2>Clóset base</h2>
            <p>Las medidas gobiernan el modelo. El 3D es solo una representación.</p>
            <DimensionField label="Ancho" value={width} setValue={setWidth} min={400} />
            <DimensionField label="Alto" value={height} setValue={setHeight} min={500} />
            <DimensionField label="Fondo" value={depth} setValue={setDepth} min={250} />
          </div>
          <div className="aiBox">
            <strong>✨ IA — próxima fase</strong><br />
            “Haz un clóset de 2.40 m, con seis cajones y dos espacios para colgar.”<br /><br />
            La IA convertirá esa frase en una acción tipada y mostrará un preview antes de modificar el modelo.
          </div>
        </aside>

        <div className="viewport">
          <div className="viewportLabel">Vista 3D · demostrador determinístico</div>
          <FurniturePreview model={model} />
        </div>

        <aside className="inspector">
          <div className="card">
            <h2>Producción</h2>
            <p>Estas métricas provienen del mismo modelo que genera el 3D.</p>
            <div className="kpi"><span>Piezas</span><strong>{model.parts.length}</strong></div>
            <div className="kpi"><span>Área de tablero</span><strong>{area.toFixed(2)} m²</strong></div>
            <div className="kpi"><span>Canto preliminar</span><strong>{edges.toFixed(2)} m</strong></div>
            <div className="kpi"><span>Validación core</span><strong>{issues.length === 0 ? "OK" : `${issues.length} error(es)`}</strong></div>
          </div>
          <div className="card">
            <h2>Despiece</h2>
            <div className="pieceList">
              {model.parts.map((p) => (
                <div className="piece" key={p.id}>
                  <span>{p.name}</span>
                  <strong>{Math.round(p.length)} × {Math.round(p.width)} × {Math.round(p.thickness)}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function DimensionField({ label, value, setValue, min }: { label: string; value: number; setValue: (n: number) => void; min: number }) {
  return (
    <div className="field">
      <label><span>{label}</span><span>mm</span></label>
      <input type="number" min={min} value={value} onChange={(e) => setValue(Math.max(min, Number(e.target.value) || min))} />
    </div>
  );
}
