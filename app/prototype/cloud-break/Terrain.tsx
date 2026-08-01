"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { U } from "./uniforms";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * A crude stand-in for the cube grid, deliberately. It has exactly one job:
 * fall away convincingly. Analytic sin octaves, no textures, no imports from
 * the real field.
 */

const VERT = /* glsl */ `
  uniform float uFlow;
  varying vec3 vWorld;

  // The visible ground footprint at the inherited camera is only about 27 x 17
  // world units, so the previous shortest wavelength of 20u never completed a
  // cycle across frame and the surface read as flat facets. The last two
  // octaves exist to give that footprint something to resolve.
  float h(vec2 p) {
    float d = 0.0;
    d += sin(p.x * 0.0141 + p.y * 0.0093) * 7.2;
    d += sin(p.x * 0.0412 - p.y * 0.0531) * 2.6;
    d += sin(p.x * 0.1730 + p.y * 0.1471) * 0.85;
    d += sin(p.x * 0.3110 - p.y * 0.2790) * 0.32;
    d += sin(p.x * 0.7900 + p.y * 0.6310) * 0.14;
    d += sin(p.x * 1.7300 - p.y * 1.9100) * 0.055;
    return d;
  }

  void main() {
    // Plane is rotated -90 about X, so local +y maps to world -z and local +z
    // becomes world height. Sampling in world space keeps the flow direction
    // identical to the cloud's.
    vec3 p = position;
    p.z = h(vec2(p.x, -p.y + uFlow));
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  // GLSL3 requires an explicit output - see the note in CloudDeck.tsx. Kept on
  // GLSL3 rather than the project's GLSL1 convention because dFdx/dFdy are
  // core in GLSL ES 3.00 and need no extension pragma.
  layout(location = 0) out vec4 outColor;

  uniform vec3  uCamPos;
  uniform vec3  uSunDir;
  uniform vec3  uFogColor;
  uniform vec3  uTerrainBase;
  uniform vec3  uTerrainLit;
  uniform float uFogDensity;

  varying vec3 vWorld;

  void main() {
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    if (n.y < 0.0) n = -n;

    float ndl = max(dot(n, uSunDir), 0.0);
    vec3 col = mix(uTerrainBase, uTerrainLit, ndl * 0.85 + 0.15);

    float dist = length(uCamPos - vWorld);
    float f = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
    col = mix(col, uFogColor, clamp(f, 0.0, 1.0));

    outColor = vec4(col, 1.0);
  }
`;

export default function Terrain() {
  // 400u at 512 segments = 0.78u cells, roughly 4 samples across the finest
  // displacement octave. The old 1400u/200 gave 7u cells against a 27u visible
  // footprint - three triangles across frame.
  //
  // Shrinking the plane from 1400 to 400 is safe: fog reaches the inherited
  // 0.045 density by ~30u and 0.16 before the camera clears 90u, so the plane
  // edge is fully fogged out long before it could enter frame.
  const geometry = useMemo(() => new THREE.PlaneGeometry(400, 400, 512, 512), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uFlow: U.uFlow,
          uCamPos: U.uCamPos,
          uSunDir: U.uSunDir,
          uFogColor: U.uFogColor,
          uTerrainBase: U.uTerrainBase,
          uTerrainLit: U.uTerrainLit,
          uFogDensity: U.uFogDensity,
        },
      }),
    [],
  );

  useEffect(() => {
    const g = geometry;
    const m = material;
    return () => {
      g.dispose();
      m.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      frustumCulled={false}
    />
  );
}
