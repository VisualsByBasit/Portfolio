"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAM, COLOR, PHASE, SLAB } from "./config";
import { STATE, U } from "./uniforms";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * Owns the frame. Three passes:
 *
 *   1. sky + terrain + deck   -> sceneRT, full res, half float, real depth
 *   2. whiteout + exposure    -> screen
 *
 * The separate half-resolution cloud pass is gone with the stacked planes. An
 * opaque surface wants full resolution and a shared depth buffer, and the
 * upsample would have softened exactly the silhouette this technique most
 * needs to keep.
 *
 * Beat 3 lives in pass 3: a linear exposure multiply and a hard clamp. Eyes and
 * cameras do not glow when overwhelmed, they clip. There is no bloom anywhere.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D tScene;
  uniform float uExposure;
  uniform float uWhiteout;
  uniform float uWhiteTop;
  uniform vec3  uWhiteoutColor;
  uniform float uChromatic;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uFrame;

  varying vec2 vUv;

  vec3 comp(vec2 uv) {
    vec3 b = texture2D(tScene, uv).rgb;
    // Beats 1-3: the camera is inside the deck and the world is uniform cloud.
    // The vertical ramp is beat 2's "something is above" - directional light
    // through fog, before there is any surface to see.
    return mix(b, uWhiteoutColor * mix(1.0, uWhiteTop, uv.y), uWhiteout);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec3 linearToSRGB(vec3 c) {
    c = max(c, 0.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(0.4166666)) - 0.055, step(0.0031308, c));
  }

  void main() {
    vec2 d = vUv - 0.5;

    // Observed, not rendered. Subliminal at these values.
    vec2 off = d * uChromatic * dot(d, d) * 4.0;
    vec3 col;
    col.r = comp(vUv + off).r;
    col.g = comp(vUv).g;
    col.b = comp(vUv - off).b;

    col *= uExposure;
    col *= 1.0 - uVignette * dot(d, d) * 1.6;

    // Clipping, not bloom. Values past white are lost, exactly as a sensor
    // loses them.
    col = clamp(col, 0.0, 1.0);
    col = linearToSRGB(col);

    col += (hash12(gl_FragCoord.xy + uFrame) - 0.5) * uGrain;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const BG = new THREE.Color(COLOR.groundBg);
const DEG = Math.PI / 180;

/**
 * Frames of off-screen pre-warm at load. Measured cause: on a cold first
 * traversal every phase ran at ~13.9ms median - an exact doubling of the
 * 6.94ms vsync interval, i.e. a sustained halving to 72fps, not a hitch. After
 * any prior heavy pass the same traversal holds 7.0ms. That is first-use
 * pipeline creation plus the integrated GPU ramping its clocks, and both are
 * paid here, on the ground, where there are seconds to spare - rather than at
 * beats 3-4, where the docs treat one dropped frame as fatal.
 */
const WARMUP_FRAMES = 36;

export default function Composite() {
  const { gl, scene, camera, size } = useThree();

  const warmRef = useRef<{
    cam: THREE.PerspectiveCamera;
    saved: THREE.Vector3;
    n: number;
  } | null>(null);

  useEffect(() => {
    warmRef.current = {
      cam: new THREE.PerspectiveCamera(CAM.fov, 1, CAM.near, CAM.far),
      saved: new THREE.Vector3(),
      n: 0,
    };
  }, []);

  const sceneRT = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        type: THREE.HalfFloatType,
        depthBuffer: true,
        // The deck is opaque geometry whose silhouette against sky is this
        // technique's weakest point. MSAA is the cheapest thing that helps it.
        samples: 4,
      }),
    [],
  );

  const quad = useMemo(() => {
    const s = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tScene: { value: sceneRT.texture },
        uExposure: U.uExposure,
        uWhiteout: U.uWhiteout,
        uWhiteTop: U.uWhiteTop,
        uWhiteoutColor: U.uWhiteoutColor,
        uChromatic: U.uChromatic,
        uVignette: U.uVignette,
        uGrain: U.uGrain,
        uFrame: U.uFrame,
      },
      depthTest: false,
      depthWrite: false,
    });
    const geo = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geo, mat);
    // The vertex shader bypasses the projection entirely, so a bounding-sphere
    // cull test against the ortho frustum is meaningless here.
    mesh.frustumCulled = false;
    s.add(mesh);
    return { scene: s, cam, mat, geo };
  }, [sceneRT]);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    const w = Math.max(1, Math.floor(size.width * dpr));
    const h = Math.max(1, Math.floor(size.height * dpr));
    sceneRT.setSize(w, h);
  }, [gl, size, sceneRT]);

  useEffect(() => {
    const q = quad;
    return () => {
      sceneRT.dispose();
      q.mat.dispose();
      q.geo.dispose();
    };
  }, [sceneRT, quad]);

  useFrame((_, rawDelta) => {
    U.uFrame.value = (U.uFrame.value + 1) % 4096;

    // --- pre-warm ------------------------------------------------------------
    // Drives the deck at full cloud-target resolution from both sides of the
    // slab, so the in-cloud and above-deck paths are both resident before the
    // visitor can scroll anywhere near them.
    const w = warmRef.current;
    if (w && w.n < WARMUP_FRAMES) {
      // Three states, because they cost very different amounts. Deep inside is
      // the true worst case: every slice is fullscreen and none early-out.
      // Warming only the top of the slab left beats 1-2 cold at 13.9ms.
      const phase = w.n % 3;
      const wy =
        phase === 0
          ? SLAB.bottom + 10 // deep, as beats 1-2
          : phase === 1
            ? (SLAB.bottom + SLAB.top) * 0.5 // breaking out, as beat 3
            : SLAB.top + 44; // above, as beat 4
      w.cam.aspect = camera instanceof THREE.PerspectiveCamera ? camera.aspect : 1;
      w.cam.position.set(0, wy, 0);
      w.cam.rotation.set((phase === 2 ? -6 : 18) * DEG, 0, 0, "YXZ");
      w.cam.updateProjectionMatrix();

      // The shader discards on distance from uCamPos, so it has to agree with
      // the camera actually being used or the whole pass early-outs and warms
      // nothing.
      w.saved.copy(U.uCamPos.value);
      U.uCamPos.value.copy(w.cam.position);

      gl.setRenderTarget(sceneRT);
      gl.setClearColor(BG, 1);
      gl.render(scene, w.cam);

      U.uCamPos.value.copy(w.saved);
      w.n++;
    }

    // autoClear is left on, so each render() clears its own target using the
    // clear colour set immediately before it.
    gl.setRenderTarget(sceneRT);
    gl.setClearColor(BG, 1);
    gl.render(scene, camera);

    gl.setRenderTarget(null);
    gl.render(quad.scene, quad.cam);

    // Measured, not estimated. Reported by the panel.
    const ms = rawDelta * 1000;
    if (ms < 500) {
      STATE.fps += (1000 / Math.max(ms, 0.0001) - STATE.fps) * 0.06;
      if (ms > STATE.worstMs) STATE.worstMs = ms;
      const a = STATE.altitude;
      if (a > PHASE.beat2End && a < PHASE.levelEnd && ms > STATE.worstBreakMs) {
        STATE.worstBreakMs = ms;
      }
    }
  }, 1);

  return null;
}
