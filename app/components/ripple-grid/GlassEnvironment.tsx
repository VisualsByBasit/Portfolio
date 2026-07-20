"use client";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Cheap procedural environment (three's own RoomEnvironment, no HDR
 * asset needed) so the high-tier glass material has something believable
 * to reflect/refract instead of flat black. High-tier only - skipped
 * entirely on the low-tier opaque material.
 */
export default function GlassEnvironment() {
  const { gl, scene } = useThree();
  const pmrem = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);

  useEffect(() => {
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    // Assigning scene.environment is the standard R3F/three.js pattern
    // for wiring up IBL (this is what drei's own Environment does) -
    // react-hooks/immutability can't tell useThree() returns a mutable
    // imperative three.js handle, not React-owned state.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = target.texture;
    return () => {
      target.dispose();
      scene.environment = null;
    };
  }, [pmrem, scene]);

  useEffect(() => () => pmrem.dispose(), [pmrem]);

  return null;
}
