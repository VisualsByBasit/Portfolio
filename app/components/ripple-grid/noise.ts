import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

/**
 * Two independent noise fields: one fixed seed for the resting terrain
 * shape, one for the slow idle "breathing" layered on top of it, so
 * breathing never accidentally reshapes the ridgelines it rides on.
 */
const terrain = new SimplexNoise();
const breathe = new SimplexNoise();

/**
 * Anisotropic sample (different frequency/rotation on each diagonal
 * axis) so ridges read as diagonal sweeps across the field rather than
 * an axis-aligned checkerboard.
 */
export function terrainHeight(col: number, row: number, freq = 0.16) {
  const a = (col + row) * freq;
  const b = (col - row) * freq * 0.55;
  return terrain.noise(a, b);
}

/** Very slow, low-amplitude drift so idle terrain is never fully static. */
export function breatheOffset(col: number, row: number, t: number) {
  return breathe.noise3d(col * 0.25, row * 0.25, t * 0.04);
}
