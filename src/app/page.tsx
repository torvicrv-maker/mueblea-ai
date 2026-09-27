import Link from "next/link";
import { buildWardrobe } from "@/core/furniture/buildWardrobe";
import { FurniturePreview } from "@/components/designer/FurniturePreview";

const sample = buildWardrobe({ width: 2400, height: 2300, depth: 600 });

export default function HomePage() {
  return (
    <main className="landingPage">
      <header className="marketingHeader">
        <Link className="brandGroup" href="/" aria-label="Mueblea IA, inicio">
          <span className="brandMark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="m4 8 8-4 8 4v9l-8 4-8-4V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="m4.5 8.5 7.5 4 7.5-4M12 13v7.5M8 6l8 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
          </span>
          <span className="brand">Mueblea<span className="brandAI">IA</span></span>
        </Link>
        <nav className="marketingNav" aria-label="Navegación principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#herramientas">Herramientas</a>
          <Link className="navCta" href="/designer/">Abrir diseñador <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="heroSection">
        <div className="heroCopy">
          <p className="heroEyebrow"><span className="heroEyebrowDot" /> Diseño de muebles a medida</p>
          <h1>Diseña el mueble que tienes en mente.</h1>
          <p className="heroDescription">Ajusta las medidas de tu clóset, mira el modelo y consulta un despiece preliminar desde el navegador.</p>
          <Link className="heroButton" href="/designer/">Pruébalo gratis <span aria-hidden="true">→</span></Link>
          <p className="heroProof"><span aria-hidden="true">●</span> Gratis · Sin registro</p>
        </div>

        <div className="heroVisual" aria-label="Vista de ejemplo de un clóset diseñado en Mueblea IA">
          <div className="heroVisualTop"><span className="heroVisualDot" /> Tu diseño, en vivo <span className="heroVisualTag">VISTA PREVIA</span></div>
          <FurniturePreview model={sample} variant="hero" />
          <div className="heroVisualBottom"><span>Clóset base</span><strong>2400 × 2300 × 600 mm</strong></div>
        </div>
      </section>

      <section className="featureStrip" id="herramientas" aria-label="Herramientas incluidas">
        <article><span className="featureNumber">01</span><div><h2>Define tus medidas</h2><p>Ancho, alto y fondo en milímetros.</p></div></article>
        <article><span className="featureNumber">02</span><div><h2>Revisa el modelo</h2><p>La vista se actualiza junto con tus cambios.</p></div></article>
        <article><span className="featureNumber">03</span><div><h2>Consulta el despiece</h2><p>Explora piezas y métricas de material.</p></div></article>
      </section>

      <section className="howSection" id="como-funciona">
        <div className="howCopy"><p className="sectionKicker">Empieza en minutos</p><h2>De las medidas a una idea clara.</h2><p>El diseñador organiza los controles alrededor de tu modelo para que puedas ajustar el clóset y revisar sus piezas en un solo lugar.</p></div>
        <Link className="textLink" href="/designer/">Ir al espacio de diseño <span aria-hidden="true">→</span></Link>
      </section>

      <footer className="landingFooter"><span className="brand">Mueblea<span className="brandAI">IA</span></span><span>Diseño paramétrico de muebles</span></footer>
    </main>
  );
}
