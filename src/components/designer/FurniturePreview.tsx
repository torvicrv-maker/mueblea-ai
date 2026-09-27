"use client";

import { Canvas } from "@react-three/fiber";
import type { FurnitureModel } from "@/core/furniture/types";
import { partWorldSize } from "@/core/furniture/worldSize";

function Scene({ model }: { model: FurnitureModel }) {
  const max = Math.max(model.dimensions.width, model.dimensions.height, model.dimensions.depth);
  const scale = 3.2 / max;

  return (
    <group
      scale={scale}
      position={[
        -model.dimensions.width * scale / 2,
        -model.dimensions.height * scale / 2,
        -model.dimensions.depth * scale / 2,
      ]}
    >
      {model.parts.map((p) => {
        const [x, y, z] = partWorldSize(p);
        return (
          <mesh key={p.id} position={[p.transform.x, p.transform.y, p.transform.z]}>
            <boxGeometry args={[x, y, z]} />
            <meshStandardMaterial color="#ded4c6" roughness={0.72} />
          </mesh>
        );
      })}
    </group>
  );
}

export function FurniturePreview({ model }: { model: FurnitureModel }) {
  return (
    <Canvas camera={{ position: [4.5, 3.2, 5.8], fov: 42 }}>
      <ambientLight intensity={1.7} />
      <directionalLight position={[4, 7, 6]} intensity={2.2} />
      <gridHelper args={[10, 20, "#b9bdc3", "#d9dde2"]} position={[0, -1.6, 0]} />
      <Scene model={model} />
    </Canvas>
  );
}
