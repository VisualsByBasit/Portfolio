import * as THREE from "three";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * One tiling 64^3 RGBA volume, built on the CPU once at module init and reused
 * for every cloud sample. Analytic fbm in the fragment shader is unaffordable
 * at this overdraw: 26 near-fullscreen slices x 4 octaves of gradient noise is
 * tens of ALU-heavy evaluations per pixel. A texture fetch is not.
 *
 * Channels hold progressively finer tiling fbm, so ONE fetch yields four
 * octaves. Sampling the volume twice at two different world scales gives eight
 * usable octaves for two fetches - the standard cloud-volume trick.
 *
 *   R  3 octaves, coarse - body shape
 *   G  2 octaves, mid
 *   B  2 octaves, fine
 *   A  1 octave billow - erosion
 */

const SIZE = 64;

/** Deterministic so the deck looks the same on every reload while tuning. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Layer = { lat: Float32Array; p: number; amp: number };

function makeLayer(p: number, amp: number, rng: () => number): Layer {
  const lat = new Float32Array(p * p * p);
  for (let i = 0; i < lat.length; i++) lat[i] = rng();
  return { lat, p, amp };
}

/** Trilinear value noise over a wrapped lattice - tiles exactly over [0,1). */
function sampleLayer(l: Layer, u: number, v: number, w: number) {
  const p = l.p;
  const x = u * p;
  const y = v * p;
  const z = w * p;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fy = y - yi;
  const fz = z - zi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const sz = fz * fz * (3 - 2 * fz);

  const x0 = ((xi % p) + p) % p;
  const y0 = ((yi % p) + p) % p;
  const z0 = ((zi % p) + p) % p;
  const x1 = (x0 + 1) % p;
  const y1 = (y0 + 1) % p;
  const z1 = (z0 + 1) % p;

  const a = l.lat;
  const r0 = z0 * p * p;
  const r1 = z1 * p * p;
  const c00 = y0 * p;
  const c10 = y1 * p;

  const v000 = a[r0 + c00 + x0];
  const v100 = a[r0 + c00 + x1];
  const v010 = a[r0 + c10 + x0];
  const v110 = a[r0 + c10 + x1];
  const v001 = a[r1 + c00 + x0];
  const v101 = a[r1 + c00 + x1];
  const v011 = a[r1 + c10 + x0];
  const v111 = a[r1 + c10 + x1];

  const e00 = v000 + (v100 - v000) * sx;
  const e10 = v010 + (v110 - v010) * sx;
  const e01 = v001 + (v101 - v001) * sx;
  const e11 = v011 + (v111 - v011) * sx;
  const f0 = e00 + (e10 - e00) * sy;
  const f1 = e01 + (e11 - e01) * sy;
  return f0 + (f1 - f0) * sz;
}

function fbm(layers: Layer[], u: number, v: number, w: number) {
  let sum = 0;
  for (let i = 0; i < layers.length; i++) sum += sampleLayer(layers[i], u, v, w) * layers[i].amp;
  return sum;
}

let cached: THREE.Data3DTexture | null = null;

export function buildVolume(): THREE.Data3DTexture {
  if (cached) return cached;

  const rng = mulberry32(0x5eed);
  const chR = [makeLayer(4, 0.55, rng), makeLayer(8, 0.3, rng), makeLayer(16, 0.15, rng)];
  const chG = [makeLayer(8, 0.65, rng), makeLayer(16, 0.35, rng)];
  const chB = [makeLayer(16, 0.6, rng), makeLayer(32, 0.4, rng)];
  const chA = [makeLayer(32, 1.0, rng)];

  const data = new Uint8Array(SIZE * SIZE * SIZE * 4);
  let i = 0;
  for (let z = 0; z < SIZE; z++) {
    const w = z / SIZE;
    for (let y = 0; y < SIZE; y++) {
      const v = y / SIZE;
      for (let x = 0; x < SIZE; x++) {
        const u = x / SIZE;
        const a = fbm(chA, u, v, w);
        data[i++] = (fbm(chR, u, v, w) * 255) | 0;
        data[i++] = (fbm(chG, u, v, w) * 255) | 0;
        data[i++] = (fbm(chB, u, v, w) * 255) | 0;
        // billow - ridged, so erosion carves rather than smudges
        data[i++] = ((1 - Math.abs(a * 2 - 1)) * 255) | 0;
      }
    }
  }

  const tex = new THREE.Data3DTexture(data, SIZE, SIZE, SIZE);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.wrapR = THREE.RepeatWrapping;
  tex.generateMipmaps = false;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;

  cached = tex;
  return tex;
}
