"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { U } from "./uniforms";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * Gradient dome. Above an overcast layer the sky is desaturated, so this is a
 * cool GREY ramp, not a blue one - a blue sky reads as a clear day, which is a
 * different and much more generic image. The vertical deepening is kept (it is
 * the primary altitude cue at beat 4) but carried by value, not by hue.
 *
 * Below the horizon the dome sits close to the haze colour, so the deck has
 * something to dissolve INTO rather than ending on an edge. No sun disc, no
 * flare.
 */

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  // GLSL3 requires an explicit output - see the note in CloudDeck.tsx.
  layout(location = 0) out vec4 outColor;

  uniform vec3  uSkyHorizon;
  uniform vec3  uSkyZenith;
  uniform vec3  uSkyBelow;
  uniform vec3  uGroundBg;
  uniform vec3  uSunDir;
  uniform vec3  uSkyZenithDeep;
  uniform vec3  uSkyHorizonDeep;
  uniform float uSkyPow;
  uniform float uSunGlow;
  uniform float uSkyMix;
  uniform float uSkyDeepen;
  uniform float uStars;
  uniform float uTime;

  // Cheap point stars on a hashed direction lattice. A suggestion of altitude,
  // never a starfield.
  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p += dot(p, p.yzx + 41.17);
    return fract((p.x + p.y) * p.z);
  }

  varying vec3 vDir;

  void main() {
    vec3 d = normalize(vDir);

    // The climb never stops, so the ramp deepens for the whole light world.
    vec3 zen = mix(uSkyZenith, uSkyZenithDeep, uSkyDeepen);
    vec3 hor = mix(uSkyHorizon, uSkyHorizonDeep, uSkyDeepen);

    vec3 col = d.y >= 0.0
      ? mix(hor, zen, pow(d.y, uSkyPow))
      : mix(hor, uSkyBelow, pow(-d.y, 0.7));

    // Real air glow around the bright region. Not a lens artefact. Fades out
    // as the sky deepens - there is no daylight scattering left by then.
    col += uSunGlow * pow(max(dot(d, uSunDir), 0.0), 6.0) * (1.0 - uSkyDeepen);

    // Stars, only once the sky is genuinely navy and only well above the
    // horizon. Sunlit cloud tops and visible stars cannot coexist (R-007).
    if (uStars > 0.001 && d.y > 0.04) {
      vec3 cell = floor(d * 260.0);
      float h = hash31(cell);
      float pt = step(0.99935, h);
      float twinkle = 0.55 + 0.45 * sin(uTime * 0.6 + h * 91.0);
      // Faint. A suggestion of altitude, not a starfield.
      col += pt * twinkle * uStars * 0.16 * smoothstep(0.04, 0.42, d.y);
    }

    // Below the deck this world does not exist yet.
    col = mix(uGroundBg, col, uSkyMix);

    outColor = vec4(col, 1.0);
  }
`;

export default function SkyDome() {
  const geometry = useMemo(() => new THREE.SphereGeometry(20000, 32, 16), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uSkyHorizon: U.uSkyHorizon,
          uSkyZenith: U.uSkyZenith,
          uSkyBelow: U.uSkyBelow,
          uGroundBg: U.uGroundBg,
          uSunDir: U.uSunDir,
          uSkyZenithDeep: U.uSkyZenithDeep,
          uSkyHorizonDeep: U.uSkyHorizonDeep,
          uSkyPow: U.uSkyPow,
          uSunGlow: U.uSunGlow,
          uSkyMix: U.uSkyMix,
          uSkyDeepen: U.uSkyDeepen,
          uStars: U.uStars,
          uTime: U.uTime,
        },
        side: THREE.BackSide,
        depthTest: false,
        depthWrite: false,
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

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />;
}
