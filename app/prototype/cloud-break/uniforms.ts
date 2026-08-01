import * as THREE from "three";
import { CAM, COLOR, SLAB, TUNE } from "./config";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * One shared uniform table, created once at module scope and mutated in place
 * by Director's single useFrame. Every material references these exact objects,
 * so there is no prop drilling, no React state at 60fps, and no allocation in
 * the frame loop.
 */

const c = (hex: string) => new THREE.Color(hex); // ColorManagement converts sRGB -> linear working space

export const U = {
  // driven every frame
  uTime: { value: 0 },
  uFlow: { value: 0 },
  uCamPos: { value: new THREE.Vector3() },
  uSunDir: { value: new THREE.Vector3(0.62, 0.26, 0.74).normalize() },
  uExposure: { value: 1 },
  uFrame: { value: 0 },

  uFogColor: { value: new THREE.Color() },
  uFogDensity: { value: 0.045 },
  uSkyMix: { value: 0 },

  uDriftH: { value: 0 },
  uWhiteout: { value: 0 },
  uWhiteTop: { value: TUNE.whiteTop },

  // slab geometry - fixed
  uSlabBottom: { value: SLAB.bottom as number },
  uSlabSpan: { value: (SLAB.top - SLAB.bottom) as number },

  // pushed from TUNE each frame so the panel is live
  uTopBase: { value: TUNE.topBase },
  uTopVar: { value: TUNE.topVar },
  uShapeScale: { value: TUNE.shapeScale },
  uShadowStep: { value: TUNE.shadowStep },
  uShadowStrength: { value: TUNE.shadowStrength },
  uShadowSoft: { value: TUNE.shadowSoft },
  uWrap: { value: TUNE.wrap },
  uSkyBounce: { value: TUNE.skyBounce },
  uTranslucency: { value: TUNE.translucency },
  uThickScale: { value: TUNE.thickScale },
  uDeckDim: { value: 1 },
  uSkyDeepen: { value: 0 },
  uStars: { value: 0 },
  uNormalEps: { value: TUNE.normalEps },
  uClumpLo: { value: TUNE.clumpLo },
  uClumpHi: { value: TUNE.clumpHi },
  uOct2: { value: TUNE.oct2 },
  uOct3: { value: TUNE.oct3 },
  uOct4: { value: TUNE.oct4 },
  uHazeDensity: { value: TUNE.hazeDensity },
  uFarCut: { value: TUNE.farCut },
  uSkyPow: { value: TUNE.skyPow },
  uSunGlow: { value: TUNE.sunGlow },
  uChromatic: { value: TUNE.chromatic },
  uVignette: { value: TUNE.vignette },
  uGrain: { value: TUNE.grain },

  // colour - constant
  uCloudLit: { value: c(COLOR.cloudLit) },
  uCloudShadow: { value: c(COLOR.cloudShadow) },
  uDeckBase: { value: c(COLOR.deckBase) },
  uWhiteoutColor: { value: c(COLOR.whiteout) },
  uHazeColor: { value: c(COLOR.haze) },
  uSkyHorizon: { value: c(COLOR.skyHorizon) },
  uSkyZenith: { value: c(COLOR.skyZenith) },
  uSkyZenithDeep: { value: c(COLOR.skyZenithDeep) },
  uSkyHorizonDeep: { value: c(COLOR.skyHorizonDeep) },
  uHazeDeep: { value: c(COLOR.hazeDeep) },
  uSkyBelow: { value: c(COLOR.skyBelow) },
  uGroundBg: { value: c(COLOR.groundBg) },
  uTerrainBase: { value: c(COLOR.terrainBase) },
  uTerrainLit: { value: c(COLOR.terrainLit) },
};

/** Live world + timing state, read by the panel for its readout. */
export const STATE: {
  scroll: number;
  /** damped raw scroll - drives the light world past the break */
  journey: number;
  altitude: number;
  pitch: number;
  clamped: boolean;
  fps: number;
  worstMs: number;
  worstBreakMs: number;
} = {
  scroll: 0,
  journey: 0,
  altitude: 0,
  pitch: CAM.groundPitch,
  /** true while the rate clamp is actively decoupling altitude from scroll */
  clamped: false,
  fps: 0,
  /** worst single frame, ms, since the last reset. A hitch at beats 3-4 is fatal. */
  worstMs: 0,
  /** worst frame seen strictly inside beats 3-4 */
  worstBreakMs: 0,
};
