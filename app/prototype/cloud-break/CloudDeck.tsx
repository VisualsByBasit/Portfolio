"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAM, SLAB } from "./config";
import { buildVolume } from "./noise3d";
import { U } from "./uniforms";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * The deck is a SURFACE, not participating media.
 *
 * Cloud tops seen from above are a landscape. The volumetric requirement was
 * almost entirely imaginary: beats 1-3 are the camera inside fog, which needs
 * no volume at all, and beat 4 is the only moment that needs anything - and
 * what it needs is a lit, shadowed, self-similar terrain.
 *
 * Everything the stacked-plane version structurally could not do falls out of
 * this for free:
 *   - lit crown / shadowed underside: it has real normals
 *   - perspective compression: it is real geometry under a real projection
 *   - crisp edges: displacement, with no slice banding to hide behind, so the
 *     softening that used to fight crispness is gone
 *
 * Geometry is a radial grid centred under the camera with exponential ring
 * spacing, so vertex density is highest where the visitor is looking closely
 * and thins toward the horizon where haze eats it anyway.
 */

const NOISE = /* glsl */ `
  uniform sampler3D uNoise;
  uniform float uShapeScale;
  uniform float uDriftH;
  uniform float uTopBase;
  uniform float uTopVar;
  uniform float uSlabBottom;
  uniform float uSlabSpan;
  uniform float uClumpLo;
  uniform float uClumpHi;
  uniform float uOct2;
  uniform float uOct3;
  uniform float uOct4;

  // BILLOW, not ridged, and not plain fbm.
  //
  //   ridged  1-|2v-1|  sharp maxima  -> peaks and connected ridgelines
  //   plain   v         rolling       -> hills with drainage networks
  //   billow  |2v-1|    round maxima  -> separated lobes
  //
  // The crease in billow noise falls in the VALLEYS and the maxima are smooth,
  // which is the difference between a clump and a mountain. Persistence is kept
  // low deliberately so lobes stay isolated instead of connecting into ranges -
  // terrain has drainage, cloud has clumps.
  float billow(float v) { return abs(v * 2.0 - 1.0); }

  // The BASE is a clump mask, not fbm and not billow. Billow alone puts a lobe
  // at both extremes of the underlying noise, which doubles the feature rate
  // and reads as a field of small hills. A smoothstep threshold instead gives
  // isolated rounded masses with flat air between them - terrain has drainage
  // networks, cloud has clumps, and this is that difference directly.
  float oct1(vec2 q) {
    vec4 a = textureLod(uNoise, vec3(q * uShapeScale, uDriftH), 0.0);
    return smoothstep(uClumpLo, uClumpHi, a.r * 0.62 + a.g * 0.38);
  }
  float oct2(vec2 q) {
    vec4 b = textureLod(uNoise, vec3(q * uShapeScale * 3.17 + vec2(0.31), uDriftH * 1.73), 0.0);
    return billow(b.g * 0.6 + b.b * 0.4);
  }
  float oct3(vec2 q) {
    vec4 c = textureLod(uNoise, vec3(q * uShapeScale * 9.73 + vec2(0.67), uDriftH * 2.61), 0.0);
    return billow(c.b * 0.55 + c.a * 0.45);
  }
  float oct4(vec2 q) {
    vec4 d = textureLod(uNoise, vec3(q * uShapeScale * 27.1 + vec2(0.19), uDriftH * 3.41), 0.0);
    return billow(d.a);
  }

  float toWorld(float h) { return uSlabBottom + (uTopBase + h * uTopVar) * uSlabSpan; }

  /** 2 octaves - shadow marching and the coarse body reference. */
  float deckShadowH(vec2 q) { float c = oct1(q); return toWorld(c * (1.0 + oct2(q) * uOct2)); }

  /** 3 octaves - vertex displacement, so the silhouette carries the lobes. */
  float deckGeoH(vec2 q) {
    float c = oct1(q);
    // Any high-frequency component surviving onto a crown reads as rock. Fade
    // the fine octaves out where the clump is already high, so crowns stay round.
    float crown = 1.0 - smoothstep(0.5, 0.98, c);
    return toWorld(c * (1.0 + oct2(q) * uOct2 + oct3(q) * uOct3 * crown));
  }

  /** 4 octaves - fragment normals only. Finer than the mesh can carry. */
  float deckDetailH(vec2 q) {
    float c = oct1(q);
    float crown = 1.0 - smoothstep(0.5, 0.98, c);
    return toWorld(c * (1.0 + oct2(q) * uOct2 + (oct3(q) * uOct3 + oct4(q) * uOct4) * crown));
  }
`;

const VERT = /* glsl */ `
  precision highp float;
  precision highp sampler3D;
  uniform float uFlow;
  varying vec3 vWorld;
  varying vec2 vQ;
  ${NOISE}

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    // Forward flight lives in the sample coordinate, never in the camera.
    vec2 q = vec2(wp.x, wp.z + uFlow);
    vQ = q;
    wp.y = deckGeoH(q);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  precision highp sampler3D;
  layout(location = 0) out vec4 outColor;

  uniform vec3  uCamPos;
  uniform vec3  uSunDir;
  uniform float uFlow;
  uniform float uNormalEps;
  uniform float uShadowStep;
  uniform float uShadowStrength;
  uniform float uShadowSoft;
  uniform float uWrap;
  uniform float uSkyBounce;
  uniform float uTranslucency;
  uniform float uThickScale;
  uniform float uDeckDim;
  uniform float uHazeDensity;
  uniform float uFarCut;
  uniform vec3  uCloudLit;
  uniform vec3  uCloudShadow;
  uniform vec3  uDeckBase;
  uniform vec3  uHazeColor;
  uniform vec3  uHazeDeep;
  uniform float uSkyDeepen;

  varying vec3 vWorld;
  varying vec2 vQ;
  ${NOISE}

  void main() {
    float dist = length(uCamPos - vWorld);
    float haze = 1.0 - exp(-dist * uHazeDensity);

    // Seen from below during the climb this is an overcast ceiling, not a lit
    // landscape. Flat, dim, and it dissolves into the same haze.
    if (!gl_FrontFacing) {
      outColor = vec4(mix(uDeckBase, mix(uHazeColor, uHazeDeep, uSkyDeepen), haze), 1.0);
      return;
    }

    // --- normal ------------------------------------------------------------
    // Finite differences on a finer height field than the mesh carries, so
    // shading resolves detail the geometry cannot.
    float e = uNormalEps;
    float hC = deckDetailH(vQ);
    float hX = deckDetailH(vQ + vec2(e, 0.0));
    float hZ = deckDetailH(vQ + vec2(0.0, e));
    vec3 n = normalize(vec3(hC - hX, e, hC - hZ));

    // --- self-shadowing ----------------------------------------------------
    // Marching the height field toward the sun. This is the single most
    // important element in beat 4: without it every rise is lit identically on
    // both sides and there is no landscape.
    vec2 sdir = normalize(uSunDir.xz);
    float slope = uSunDir.y / max(length(uSunDir.xz), 0.001);
    float occ = 0.0;
    for (int i = 1; i <= 6; i++) {
      float t = float(i) * uShadowStep;
      float ray = hC + slope * t;
      occ = max(occ, (deckShadowH(vQ + sdir * t) - ray) / uShadowSoft);
    }
    occ = clamp(occ, 0.0, 1.0);

    // --- light -------------------------------------------------------------
    // Vapour, not stone. Heavy wrap so shaded faces scatter rather than fall
    // dark, and the shadow end of the ramp is kept high - if a shaded face
    // looks like grey rock, the value is too low.
    float ndl = dot(n, uSunDir);
    float diff = clamp((ndl + uWrap) / (1.0 + uWrap), 0.0, 1.0);
    diff *= 1.0 - occ * uShadowStrength;
    diff += uSkyBounce * (n.y * 0.5 + 0.5);

    // Translucency. Where the fine octaves lift the surface clear of the coarse
    // body, the material is a lobe tip rather than bulk and light bleeds
    // through it. This is the strongest single cue that a surface is vapour.
    float lift = (hC - deckShadowH(vQ)) / uThickScale;
    diff += uTranslucency * clamp(lift, 0.0, 1.0);

    vec3 col = mix(uCloudShadow, uCloudLit, clamp(diff, 0.0, 1.0));
    col *= uDeckDim;

    // --- atmosphere --------------------------------------------------------
    // Haze is the primary depth cue, not a limitation being hidden. Detail is
    // meant to be gone well before the horizon, and the haze colour sits close
    // to the sky so the silhouette dissolves instead of ending on an edge.
    col = mix(col, mix(uHazeColor, uHazeDeep, uSkyDeepen), haze);
    outColor = vec4(col, 1.0);
  }
`;

/** Exponential radial grid: dense near the camera, sparse toward the horizon. */
function buildRadialGrid(rings: number, segs: number, r0: number, rMax: number) {
  const count = rings * segs + 1;
  const pos = new Float32Array(count * 3);
  // centre vertex
  pos[0] = 0;
  pos[1] = 0;
  pos[2] = 0;
  const growth = Math.pow(rMax / r0, 1 / (rings - 1));
  for (let i = 0; i < rings; i++) {
    const r = r0 * Math.pow(growth, i);
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const o = (1 + i * segs + j) * 3;
      pos[o] = Math.cos(a) * r;
      pos[o + 1] = 0;
      pos[o + 2] = Math.sin(a) * r;
    }
  }

  const tris = segs + (rings - 1) * segs * 2;
  const idx = new Uint32Array(tris * 3);
  let k = 0;
  for (let j = 0; j < segs; j++) {
    idx[k++] = 0;
    idx[k++] = 1 + j;
    idx[k++] = 1 + ((j + 1) % segs);
  }
  for (let i = 0; i < rings - 1; i++) {
    const a0 = 1 + i * segs;
    const b0 = 1 + (i + 1) * segs;
    for (let j = 0; j < segs; j++) {
      const jn = (j + 1) % segs;
      idx[k++] = a0 + j;
      idx[k++] = b0 + j;
      idx[k++] = b0 + jn;
      idx[k++] = a0 + j;
      idx[k++] = b0 + jn;
      idx[k++] = a0 + jn;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  // Displaced in the vertex shader, so its rest bounds mean nothing.
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, SLAB.bottom, 0), rMax * 2);
  return g;
}

export default function CloudDeck() {
  const meshRef = useRef<THREE.Mesh>(null);
  const volume = useMemo(() => buildVolume(), []);
  const geometry = useMemo(() => buildRadialGrid(SLAB.rings, SLAB.segments, 0.6, SLAB.reach), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uNoise: { value: volume },
          uCamPos: U.uCamPos,
          uSunDir: U.uSunDir,
          uFlow: U.uFlow,
          uDriftH: U.uDriftH,
          uShapeScale: U.uShapeScale,
          uTopBase: U.uTopBase,
          uTopVar: U.uTopVar,
          uSlabBottom: U.uSlabBottom,
          uSlabSpan: U.uSlabSpan,
          uClumpLo: U.uClumpLo,
          uClumpHi: U.uClumpHi,
          uOct2: U.uOct2,
          uOct3: U.uOct3,
          uOct4: U.uOct4,
          uNormalEps: U.uNormalEps,
          uShadowStep: U.uShadowStep,
          uShadowStrength: U.uShadowStrength,
          uShadowSoft: U.uShadowSoft,
          uWrap: U.uWrap,
          uSkyBounce: U.uSkyBounce,
          uTranslucency: U.uTranslucency,
          uThickScale: U.uThickScale,
          uDeckDim: U.uDeckDim,
          uHazeDensity: U.uHazeDensity,
          uFarCut: U.uFarCut,
          uCloudLit: U.uCloudLit,
          uCloudShadow: U.uCloudShadow,
          uDeckBase: U.uDeckBase,
          uHazeColor: U.uHazeColor,
          uHazeDeep: U.uHazeDeep,
          uSkyDeepen: U.uSkyDeepen,
        },
        side: THREE.DoubleSide,
      }),
    [volume],
  );

  useEffect(() => {
    const g = geometry;
    const m = material;
    return () => {
      g.dispose();
      m.dispose();
    };
  }, [geometry, material]);

  // Beats 1-3 put the camera under the deck, where its backfaces cover the
  // frame and are then painted over by an opaque whiteout. Rendering 102k
  // vertices to be discarded cost those beats a sustained halving to 72fps.
  useFrame(() => {
    const m = meshRef.current;
    if (m) m.visible = U.uWhiteout.value < 0.98;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, CAM.z]}
      frustumCulled={false}
    />
  );
}
