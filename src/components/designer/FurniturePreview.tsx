"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import { partWorldSize } from "@/core/furniture/worldSize";
import type { FurnitureModel, FurniturePart } from "@/core/furniture/types";

type FurnitureMaterial = "oak" | "white" | "walnut";
type PreviewVariant = "canvas" | "hero";

const MATERIAL_COLORS: Record<FurnitureMaterial, string> = {
  oak: "#d9c19e",
  white: "#eeece6",
  walnut: "#8c6245",
};

export function FurniturePreview({
  model,
  material = "oak",
  selectedPartId,
  variant = "canvas",
}: {
  model: FurnitureModel;
  material?: FurnitureMaterial;
  selectedPartId?: string;
  variant?: PreviewVariant;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const { width, height, depth } = model.dimensions;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fafb");
    scene.add(new THREE.HemisphereLight("#ffffff", "#c7cdd1", 2.1));
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.2);
    keyLight.position.set(-3, 6, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight("#dce7ee", 0.9);
    fillLight.position.set(4, 2, -4);
    scene.add(fillLight);

    const renderer = new SVGRenderer();
    renderer.setQuality("high");
    renderer.setClearColor(new THREE.Color("#f8fafb"), 1);
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", `Modelo 3D manipulable, clóset de ${width} por ${height} por ${depth} milímetros. Arrastra para girar y usa dos dedos para acercar.`);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    mount.replaceChildren(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const maxDimension = Math.max(width, height, depth) / 1000;
    camera.position.set(maxDimension * 1.45, maxDimension * 0.96, maxDimension * 2.05);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement as unknown as HTMLElement);
    controlsRef.current = controls;
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = maxDimension * 0.85;
    controls.maxDistance = maxDimension * 4.2;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI - 0.12;
    controls.target.set(0, 0, 0);
    controls.update();
    controls.saveState();

    const wardrobe = new THREE.Group();
    scene.add(wardrobe);
    const w = width / 1000;
    const h = height / 1000;
    const d = depth / 1000;
    const cutColor = new THREE.Color(MATERIAL_COLORS[material]);
    const topColor = cutColor.clone().lerp(new THREE.Color("#ffffff"), 0.22);
    const sideColor = cutColor.clone().multiplyScalar(0.79);
    const frontColor = cutColor.clone();

    function addPanel(part: FurniturePart, size: [number, number, number], position: [number, number, number]) {
      const selected = part.id === selectedPartId;
      const faceColors = [sideColor, sideColor, topColor, sideColor, frontColor, sideColor];
      const materials = faceColors.map((color) => new THREE.MeshLambertMaterial({ color: selected ? "#c8e5f8" : color }));
      const geometry = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.set(...position);
      wardrobe.add(mesh);

      const edges = new THREE.EdgesGeometry(geometry);
      const outline = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: selected ? "#138fe8" : "#9b8465", transparent: true, opacity: selected ? 1 : 0.7, linewidth: selected ? 2 : 1 }),
      );
      outline.position.copy(mesh.position);
      wardrobe.add(outline);
    }

    for (const part of model.parts) {
      const [sizeX, sizeY, sizeZ] = partWorldSize(part);
      addPanel(
        part,
        [sizeX / 1000, sizeY / 1000, sizeZ / 1000],
        [part.transform.x / 1000 - w / 2, part.transform.y / 1000 - h / 2, part.transform.z / 1000 - d / 2],
      );
    }

    const dividerCount = model.layout.sections.length - 1;
    const boardThickness = model.parts.find((part) => part.id === "side-left")?.thickness ?? 18;
    const clearWidth = width - 2 * boardThickness - dividerCount * boardThickness;
    let sectionStart = boardThickness;
    for (const section of model.layout.sections) {
      const sectionWidth = clearWidth * section.widthRatio;
      if (section.hanging) {
        const rodLength = Math.max(0.2, sectionWidth - 36) / 1000;
        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.009, rodLength, 12),
          new THREE.MeshStandardMaterial({ color: "#9ba8ad", metalness: 0.55, roughness: 0.38 }),
        );
        rod.rotation.z = Math.PI / 2;
        rod.position.set(
          (sectionStart + sectionWidth / 2) / 1000 - w / 2,
          (boardThickness + (height - 2 * boardThickness) * 0.72) / 1000 - h / 2,
          depth * 0.7 / 1000 - d / 2,
        );
        wardrobe.add(rod);
      }
      sectionStart += sectionWidth + boardThickness;
    }

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      renderer.setSize(nextWidth, nextHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    return () => {
      observer.disconnect();
      controls.removeEventListener("change", render);
      controls.dispose();
      controlsRef.current = null;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
          objectMaterials.forEach((objectMaterial) => objectMaterial.dispose());
        }
      });
      renderer.domElement.remove();
    };
  }, [depth, height, material, model.layout, model.parts, selectedPartId, width]);

  const resetView = () => controlsRef.current?.reset();

  return (
    <div className={`viewportStage ${variant === "hero" ? "heroPreviewStage" : ""}`} data-material={material}>
      <div className="threeModelViewport" ref={mountRef} />
      <span className="orbitHint">Arrastra para girar</span>
      <button className="resetViewButton" type="button" onClick={resetView} aria-label="Restablecer vista del modelo">↺</button>
      <div className="previewDimensions" aria-label="Dimensiones actuales">
        <span className="dimensionChip">{width} mm ancho</span>
        <span className="dimensionChip">{height} mm alto</span>
        <span className="dimensionChip">{depth} mm fondo</span>
      </div>
    </div>
  );
}
