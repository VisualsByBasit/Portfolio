"use client";
import { useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CAM, TERRAIN_UNMOUNT } from "./config";
import { STATE } from "./uniforms";
import CloudDeck from "./CloudDeck";
import Composite from "./Composite";
import Director from "./Director";
import SkyDome from "./SkyDome";
import Terrain from "./Terrain";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * One WebGL context. The deck is now opaque geometry, so it belongs in the main
 * scene at full resolution with real depth - the half-resolution cloud target
 * that the stacked-plane version needed would stair-step its silhouette, which
 * is the one place this technique is already weakest.
 */

/** Terrain and the view are never co-resident. Hysteresis so scrubbing across
 *  the boundary cannot thrash a mount/unmount. */
function TerrainGate() {
  const [mounted, setMounted] = useState(true);
  useFrame(() => {
    const a = STATE.altitude;
    if (mounted && a > TERRAIN_UNMOUNT + 0.02) setMounted(false);
    else if (!mounted && a < TERRAIN_UNMOUNT - 0.02) setMounted(true);
  });
  return mounted ? <Terrain /> : null;
}

export default function Scene() {
  return (
    <Canvas
      camera={{
        position: [CAM.x, CAM.groundY, CAM.z],
        fov: CAM.fov,
        near: CAM.near,
        far: CAM.far,
      }}
      // Uncapped DPR would make the framerate report meaningless. 1.0 is the
      // honest integrated-graphics case.
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      style={{ position: "fixed", inset: 0 }}
    >
      <SkyDome />
      <TerrainGate />
      <CloudDeck />
      <Director />
      <Composite />
    </Canvas>
  );
}
