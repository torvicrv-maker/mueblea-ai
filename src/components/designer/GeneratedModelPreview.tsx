"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function GeneratedModelPreview({ modelUrl }: { modelUrl: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let active = true;
    let loadedModel: THREE.Object3D | null = null;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fafb");
    scene.add(new THREE.HemisphereLight("#ffffff", "#c7cdd1", 2.4));

    const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
    keyLight.position.set(-4, 6, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight("#dce7ee", 1.1);
    fillLight.position.set(4, 2, -4);
    scene.add(fillLight);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(new THREE.Color("#f8fafb"), 1);
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", "Modelo 3D de referencia generado desde una foto. Arrastra para girar y usa dos dedos para acercar.");
      renderer.domElement.style.touchAction = "none";
      renderer.domElement.style.cursor = "grab";
      mount.replaceChildren(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
      camera.position.set(3.6, 2.6, 4.5);
      camera.lookAt(0, 0, 0);
      controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.minDistance = 1.5;
      controls.maxDistance = 9;
      controls.minPolarAngle = 0.1;
      controls.maxPolarAngle = Math.PI - 0.1;
      controls.target.set(0, 0, 0);
      controls.update();
      controls.saveState();

      const render = () => renderer.render(scene, camera);
      controls.addEventListener("change", render);
      const resize = () => {
        const rect = mount.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        render();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();

      new GLTFLoader().load(
        modelUrl,
        (gltf) => {
          if (!active) {
            disposeObject(gltf.scene);
            return;
          }
          loadedModel = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(loadedModel);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const largestDimension = Math.max(size.x, size.y, size.z);
          if (!Number.isFinite(largestDimension) || largestDimension <= 0) {
            setLoadState("error");
            return;
          }

          const scale = 2.7 / largestDimension;
          loadedModel.scale.setScalar(scale);
          loadedModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          scene.add(loadedModel);

          const cameraDistance = Math.max(3.8, 2.5 * Math.max(size.x, size.y, size.z) * scale);
          camera.position.set(cameraDistance * 0.8, cameraDistance * 0.55, cameraDistance);
          camera.near = cameraDistance / 100;
          camera.far = cameraDistance * 30;
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.minDistance = cameraDistance * 0.5;
          controls.maxDistance = cameraDistance * 5;
          controls.update();
          controls.saveState();
          setLoadState("ready");
          render();
        },
        undefined,
        () => { if (active) setLoadState("error"); },
      );

      return () => {
        active = false;
        observer.disconnect();
        controls.removeEventListener("change", render);
        controls.dispose();
        controlsRef.current = null;
        disposeObject(scene);
        renderer.dispose();
        renderer.domElement.remove();
      };
    } catch {
      setLoadState("error");
    }
  }, [modelUrl]);

  return (
    <div className="viewportStage generatedViewportStage">
      <div className="threeModelViewport generatedModelViewport" ref={mountRef} />
      {loadState === "loading" ? <div className="generatedModelStatus" role="status">Preparando el modelo 3D…</div> : null}
      {loadState === "error" ? <div className="generatedModelStatus error" role="status">No se pudo mostrar el modelo en este dispositivo.</div> : null}
      <span className="orbitHint">Arrastra para girar</span>
      <button className="resetViewButton" type="button" onClick={() => controlsRef.current?.reset()} aria-label="Restablecer vista del modelo">↺</button>
      <span className="generatedModelBadge">REFERENCIA VISUAL · IA</span>
    </div>
  );
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
}
