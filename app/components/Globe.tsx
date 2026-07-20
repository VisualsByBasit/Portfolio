"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Points distributed on a sphere with a faint wireframe — a light,
 *  texture-free globe that spins slowly for the time-zones card. */
function DotSphere() {
  const group = useRef<THREE.Group>(null);

  const [purplePts, cyanPts] = useMemo(() => {
    const makeFib = (count: number, offset: number) => {
      const arr = new Float32Array(count * 3);
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - ((i + offset) / count) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * (i + offset);
        arr[i * 3] = Math.cos(theta) * r;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = Math.sin(theta) * r;
      }
      return arr;
    };
    return [makeFib(700, 0), makeFib(140, 0.5)];
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={group} rotation={[0.35, 0, -0.15]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[purplePts, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.022} color="#a78bfa" transparent opacity={0.85} sizeAttenuation />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cyanPts, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#22d3ee" transparent opacity={0.95} sizeAttenuation />
      </points>
      <mesh>
        <icosahedronGeometry args={[0.99, 2]} />
        <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.07} />
      </mesh>
    </group>
  );
}

export default function Globe() {
  return (
    <div className="globe-canvas">
      <Canvas camera={{ position: [0, 0, 2.6], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <DotSphere />
      </Canvas>
    </div>
  );
}
