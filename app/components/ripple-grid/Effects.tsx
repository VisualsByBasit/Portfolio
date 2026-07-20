"use client";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/**
 * Hand-rolled bloom composer (no @react-three/postprocessing dependency -
 * three ships EffectComposer/UnrealBloomPass itself). Registering a
 * useFrame subscriber with a positive priority hands the render call
 * over to us; see the "priority" check in fiber's internal loop.
 */
export default function Effects() {
  const { gl, scene, camera, size } = useThree();

  // Built once at a placeholder size - the layout effect below syncs it
  // to the real viewport before the first frame ever renders, so the
  // composer doesn't need to be torn down and rebuilt on every resize.
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.2, // strength - subdued, premium glow rather than a neon flare
      0.5, // radius
      0.8, // threshold - only genuinely hot (near-peak-activity) cubes bloom
    );
    c.addPass(bloom);
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]);

  useLayoutEffect(() => {
    composer.setSize(size.width, size.height);
    composer.setPixelRatio(gl.getPixelRatio());
  }, [composer, gl, size]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame(
    (_, delta) => {
      composer.render(delta);
    },
    1,
  );

  return null;
}
