"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";

/* ---------------------------------------------------------------- *
 * Rippling grid plane
 * Vertex shader: ambient waves + a mouse-centered ripple displace z.
 * Fragment shader: draws glowing grid lines, plus bright "light beam"
 * segments that travel along a few random rows/columns.
 * ---------------------------------------------------------------- */

const GRID_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseActive;
  varying vec2 vUv;
  varying float vElev;

  void main() {
    vUv = uv;
    vec3 p = position;

    float d = distance(p.xy, uMouse);
    float ripple = sin(d * 3.2 - uTime * 4.0) * exp(-d * 0.5) * 0.55 * uMouseActive;
    float ambient = sin(p.x * 0.55 + uTime * 0.7) * cos(p.y * 0.55 + uTime * 0.5) * 0.14;

    p.z += ripple + ambient;
    vElev = ripple;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const GRID_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElev;

  const vec3 PURPLE = vec3(0.486, 0.227, 0.929);
  const vec3 LAVENDER = vec3(0.655, 0.545, 0.980);
  const vec3 CYAN = vec3(0.133, 0.827, 0.933);
  const float N = 26.0; // grid cells across the plane

  float hash(float n) {
    return fract(sin(n * 127.1) * 43758.5453);
  }

  // Anti-aliased grid line mask (1 on a line, 0 in a cell).
  vec2 lineMask(vec2 uv) {
    vec2 g = abs(fract(uv * N) - 0.5);
    vec2 fw = fwidth(uv * N);
    return 1.0 - smoothstep(vec2(0.0), fw * 1.6, g - 0.48 + fw * 1.6);
  }

  // A glowing head + exponential tail moving along one axis of a line.
  float beam(float along, float lineIndex, float seed) {
    float rnd = hash(lineIndex * 7.13 + seed);
    // Only ~1 in 6 lines carries a beam at any moment.
    if (rnd < 0.84) return 0.0;
    float speed = 0.08 + hash(lineIndex * 3.7 + seed) * 0.12;
    float head = fract(uTime * speed + hash(lineIndex + seed) * 7.0);
    float dist = fract(head - along);
    return exp(-dist * 26.0);
  }

  void main() {
    vec2 lines = lineMask(vUv);
    float grid = max(lines.x, lines.y);

    // Base grid color: purple fading to cyan across the plane.
    vec3 gridColor = mix(PURPLE, CYAN, vUv.y) * 0.55;

    // Beams travel along rows (u direction) and columns (v direction).
    float row = floor(vUv.y * N);
    float col = floor(vUv.x * N);
    // Re-seed periodically so different lines light up over time.
    float seed = floor(uTime * 0.15);
    float beamRow = beam(vUv.x, row, seed) * lines.y;
    float beamCol = beam(vUv.y, col, seed + 51.0) * lines.x;

    vec3 color = gridColor * grid;
    color += CYAN * beamRow * 1.6;
    color += LAVENDER * beamCol * 1.6;

    // Ripple crests glow cyan.
    color += CYAN * max(vElev, 0.0) * 1.2 * grid;

    // Fade the plane out toward its far edge and the sides.
    float edgeFade = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.62, vUv.y);
    edgeFade *= smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);

    float alpha = (grid * 0.5 + beamRow + beamCol + max(vElev, 0.0)) * edgeFade;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

function RippleGrid() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  // Per-frame scratch objects, allocated once and mutated via the ref.
  const scratch = useRef({
    mouseTarget: new THREE.Vector2(0, 0),
    active: 0,
    plane: new THREE.Plane(),
    hit: new THREE.Vector3(),
    normal: new THREE.Vector3(),
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseActive: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    const m = mesh.current;
    const mat = material.current;
    if (!m || !mat) return;
    const u = mat.uniforms;
    const s = scratch.current;

    u.uTime.value += delta;

    // Intersect the pointer ray with the grid's plane, in world space,
    // then convert to the plane's local XY for the shader.
    s.normal.set(0, 0, 1).applyQuaternion(m.quaternion);
    s.plane.setFromNormalAndCoplanarPoint(s.normal, m.position);
    const intersected = state.raycaster.ray.intersectPlane(s.plane, s.hit);
    if (intersected) {
      m.worldToLocal(s.hit);
      s.mouseTarget.set(s.hit.x, s.hit.y);
      s.active = 1;
    } else {
      s.active = 0;
    }

    u.uMouse.value.lerp(s.mouseTarget, 0.08);
    u.uMouseActive.value += (s.active - u.uMouseActive.value) * 0.05;
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2.45, 0, 0]} position={[0, -1.4, 0]}>
      <planeGeometry args={[26, 18, 130, 90]} />
      <shaderMaterial
        ref={material}
        vertexShader={GRID_VERTEX}
        fragmentShader={GRID_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- *
 * Aurora wash — a big quad behind the grid running slow fbm noise in
 * purple/cyan/pink, additively blended for a soft northern-lights wash.
 * ---------------------------------------------------------------- */

const AURORA_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  const vec3 PURPLE = vec3(0.486, 0.227, 0.929);
  const vec3 CYAN = vec3(0.133, 0.827, 0.933);
  const vec3 PINK = vec3(0.957, 0.447, 0.714);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 q = vUv * vec2(3.0, 2.0);
    float t = uTime * 0.05;

    float n1 = fbm(q + vec2(t, -t * 0.6));
    float n2 = fbm(q * 1.4 + vec2(-t * 0.8, t * 0.4) + 5.2);
    float n3 = fbm(q * 0.8 + vec2(t * 0.3, t * 0.2) - 2.7);

    vec3 color = PURPLE * smoothstep(0.35, 0.85, n1) * 0.8;
    color += CYAN * smoothstep(0.45, 0.9, n2) * 0.55;
    color += PINK * smoothstep(0.6, 0.95, n3) * 0.25;

    // Strongest near the top, dissolving downward like an aurora veil.
    float falloff = smoothstep(0.05, 0.75, vUv.y);
    float alpha = (n1 * 0.5 + n2 * 0.3) * falloff * 0.4;

    gl_FragColor = vec4(color, alpha);
  }
`;

const AURORA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function Aurora() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });
  return (
    <mesh position={[0, 2.5, -9]}>
      <planeGeometry args={[40, 18]} />
      <shaderMaterial
        ref={material}
        vertexShader={AURORA_VERTEX}
        fragmentShader={AURORA_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Scene() {
  useFrame((state) => {
    // Gentle parallax: the camera drifts a touch against the pointer.
    const cam = state.camera;
    cam.position.x += (state.pointer.x * 0.4 - cam.position.x) * 0.03;
    cam.position.y += (2.2 + state.pointer.y * 0.2 - cam.position.y) * 0.03;
    cam.lookAt(0, 0.2, 0);
  });
  return (
    <>
      <Aurora />
      <RippleGrid />
    </>
  );
}

export default function HeroBackground() {
  return (
    <motion.div
      className="hero-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6, ease: "easeOut" }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 2.2, 7], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <Scene />
      </Canvas>
      {/* Soft radial vignette so the 3D scene melts into the page bg */}
      <div className="hero-bg-vignette" />
    </motion.div>
  );
}
