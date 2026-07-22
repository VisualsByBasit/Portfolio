"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { terrainHeight, breatheOffset } from "./noise";
import type { QualityTier } from "./useQualityTier";

// Single dark navy-teal accent, no per-cube hue variation - only
// shading (AO) and activity (rise/glow) vary cube to cube. Deliberately
// dark even at its brightest so the field reads as genuinely dark, not
// just dimly lit.
const ACCENT_DIM = new THREE.Color("#041A20");
const ACCENT = new THREE.Color("#0E4B58");
const ACCENT_HOT = new THREE.Color("#2E8FA6");

const SPACING = 0.92; // world units between cube centers
const CUBE_SIZE = SPACING * 0.9; // leaves a dark gutter between cubes
const BOX_DEPTH = SPACING * 0.55;
const TERRAIN_AMPLITUDE = 0.1;
const ACTIVITY_REF = 0.5; // lift value treated as "fully active" for color/scale mixing
const STIFFNESS = 95;
const DAMPING = 9.5;
const MOUSE_RADIUS = 2.3; // grid cells
const MOUSE_LIFT = 0.22;

// Connector "energy" bars filling the gutter between adjacent cubes,
// brightening with the average activity of the two cubes they join.
const GAP = SPACING - CUBE_SIZE;
const CONNECTOR_WIDTH = CUBE_SIZE * 0.4;
const CONNECTOR_THICKNESS = 0.03;
const CONNECTOR_GLOW = 2.4; // additive blending - boosted so it reads against the dark gutter
const PULSE_GLOW = 3.4; // brighter peak than CONNECTOR_GLOW - just enough to catch bloom and bleed softly

const tmpObj = new THREE.Object3D();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
const ndc = new THREE.Vector2();

export type RippleOpts = {
  lift?: number;
  maxRadius?: number;
  speed?: number; // grid cells / second the wave front travels
  width?: number; // pulse width, in grid cells
  edgeFade?: number; // 0..1, how much the wave attenuates by maxRadius
};

export type CubeFieldHandle = {
  sweepFrom: (clientX: number, clientY: number) => Promise<void>;
  rippleAt: (clientX: number, clientY: number, opts?: RippleOpts) => void;
};

type Wave = {
  row: number;
  col: number;
  start: number;
  speed: number;
  width: number;
  lift: number;
  maxRadius: number;
  edgeFade: number;
};

// Automatic light pulse traveling through the connector gutters only -
// doesn't touch cube height, purely a current/energy sweep through the
// terrain, independent of mouse/wave-driven connector activity.
type LightPulse = {
  row: number;
  col: number;
  start: number;
  speed: number;
  width: number;
};

type CubeFieldProps = {
  cols: number;
  rows: number;
  tier: QualityTier;
  idleRipples: boolean;
  followMouse: boolean;
  reducedMotion: boolean;
  mouseActiveRef: RefObject<boolean>;
  visibleRef: RefObject<boolean>;
};

const CubeField = forwardRef<CubeFieldHandle, CubeFieldProps>(
  function CubeField(
    { cols, rows, tier, idleRipples, followMouse, reducedMotion, mouseActiveRef, visibleRef },
    handleRef,
  ) {
    const { camera, gl, size } = useThree();
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    // World-units-per-cell scale actually needed to cover the current
    // camera frustum's footprint on the ground plane - see the resize
    // effect below. Read by cellFromClient/mouse-tracking so hit-testing
    // stays correct once the group has been rescaled.
    const spacingScaleRef = useRef({ x: 1, z: 1 });
    const count = cols * rows;

    const geometry = useMemo(() => {
      const geo = new THREE.BoxGeometry(CUBE_SIZE, BOX_DEPTH, CUBE_SIZE);
      // USE_COLOR multiplies vColor by the geometry's per-vertex "color"
      // attribute *before* instanceColor is applied - without this,
      // that read comes back (0,0,0) (unbound attribute) and zeroes out
      // every instance's color regardless of what instanceColor holds.
      const vertCount = geo.attributes.position.count;
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(vertCount * 3).fill(1), 3));
      return geo;
    }, []);

    const material = useMemo(() => {
      if (tier === "high") {
        return new THREE.MeshPhysicalMaterial({
          vertexColors: true,
          flatShading: true,
          // Kept moderate (not near-1) - at high transmission the per-
          // instance vertex color barely reads, since transmitted light
          // shows mostly what's behind the cube. This is the balance
          // point where cubes still read as glass but keep their color.
          transmission: 0.42,
          thickness: 0.45,
          roughness: 0.42,
          envMapIntensity: 0.28,
          ior: 1.4,
          clearcoat: 0.08,
          clearcoatRoughness: 0.4,
          attenuationColor: new THREE.Color("#0B4A5C"),
          attenuationDistance: 1.4,
        });
      }
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        roughness: 0.4,
        metalness: 0.08,
      });
      // Cheap fresnel rim so opaque cubes still read as glass-edged.
      mat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>\nvarying vec3 vRimNormal;\nvarying vec3 vRimView;`,
          )
          .replace(
            "#include <dithering_fragment>",
            `float rimFresnel = pow(1.0 - saturate(dot(normalize(vRimNormal), normalize(vRimView))), 2.5);
gl_FragColor.rgb += rimFresnel * 0.35;
#include <dithering_fragment>`,
          );
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>\nvarying vec3 vRimNormal;\nvarying vec3 vRimView;`,
          )
          .replace(
            "#include <project_vertex>",
            `#include <project_vertex>\nvRimNormal = normalize(normalMatrix * objectNormal);\nvRimView = normalize(-mvPosition.xyz);`,
          );
      };
      return mat;
    }, [tier]);

    useEffect(() => () => material.dispose(), [material]);

    // Per-cube static fields, computed once for this grid size.
    const field = useMemo(() => {
      const base = new Float32Array(count);
      const jitter = new Float32Array(count);
      const restColor = new Float32Array(count * 3);
      const activeColor = new Float32Array(count * 3);
      const c = new THREE.Color();

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          base[i] = terrainHeight(col, row) * TERRAIN_AMPLITUDE;
          jitter[i] = (Math.random() - 0.5) * 0.05; // ~+-1.4 deg
        }
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          let sum = 0;
          let n = 0;
          for (const [dc, dr] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nc = col + dc;
            const nr = row + dr;
            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
              sum += base[nr * cols + nc];
              n++;
            }
          }
          const avg = n ? sum / n : base[i];
          const rel = base[i] - avg;
          const aoVal = THREE.MathUtils.clamp(0.55 + rel * 0.9, 0.4, 0.85);

          c.copy(ACCENT_DIM).lerp(ACCENT, 0.4).multiplyScalar(aoVal);
          restColor[i * 3] = c.r;
          restColor[i * 3 + 1] = c.g;
          restColor[i * 3 + 2] = c.b;

          c.copy(ACCENT).lerp(ACCENT_HOT, 0.5);
          activeColor[i * 3] = c.r;
          activeColor[i * 3 + 1] = c.g;
          activeColor[i * 3 + 2] = c.b;
        }
      }
      return { base, jitter, restColor, activeColor };
    }, [cols, rows, count]);

    const current = useMemo(() => new Float32Array(count), [count]);
    const velocity = useMemo(() => new Float32Array(count), [count]);
    const activityArr = useMemo(() => new Float32Array(count), [count]);

    // Attached synchronously when the mesh is created (not via effect) so
    // instanceColor exists before the very first frame renders it.
    const setMeshRef = (mesh: THREE.InstancedMesh | null) => {
      meshRef.current = mesh;
      if (mesh && !mesh.instanceColor) {
        const attr = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        mesh.instanceColor = attr;
        mesh.frustumCulled = false;
      }
    };

    // Glowing "energy" bars in the gutter between every pair of grid-
    // adjacent cubes - horizontal edges first, then vertical.
    const hEdges = Math.max(0, cols - 1) * rows;
    const vEdges = cols * Math.max(0, rows - 1);
    const edgeCount = hEdges + vEdges;
    const connectorMeshRef = useRef<THREE.InstancedMesh>(null);

    const connectorGeometry = useMemo(() => {
      const geo = new THREE.BoxGeometry(GAP, CONNECTOR_THICKNESS, CONNECTOR_WIDTH);
      const vertCount = geo.attributes.position.count;
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(vertCount * 3).fill(1), 3));
      return geo;
    }, []);
    const connectorMaterial = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          vertexColors: true,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      [],
    );
    useEffect(() => () => connectorMaterial.dispose(), [connectorMaterial]);

    const setConnectorMeshRef = (mesh: THREE.InstancedMesh | null) => {
      connectorMeshRef.current = mesh;
      if (mesh && !mesh.instanceColor) {
        const attr = new THREE.InstancedBufferAttribute(new Float32Array(edgeCount * 3), 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        mesh.instanceColor = attr;
        mesh.frustumCulled = false;
      }
    };

    const waves = useRef<Wave[]>([]);
    const lightPulses = useRef<LightPulse[]>([]);
    const mouseCell = useRef({ row: rows / 2, col: cols / 2 });
    const raycaster = useRef(new THREE.Raycaster());
    const clockRef = useRef(0);

    // The camera is a fixed oblique perspective rig - its frustum's
    // footprint on the ground plane is roughly constant in world units
    // regardless of the container's CSS pixel size (aspect ratio only
    // shifts it slightly). cols/rows above are picked from raw pixel
    // dimensions purely for cube density/perf, so on a viewport with
    // fewer CSS pixels (eg. a laptop vs a desktop monitor) that produced
    // a grid physically smaller than the frustum, leaving background
    // showing around the edges. Rescale the whole grid (via the wrapping
    // group) so it always spans the actual visible footprint, computed
    // by raycasting the four screen corners onto the ground plane -
    // vertical FOV (and thus the near/far reach) doesn't change with
    // aspect, so this stays correct across ultrawide, 16:9 and square
    // aspect ratios alike.
    useEffect(() => {
      const corners: [number, number][] = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (const [nx, ny] of corners) {
        ndc.set(nx, ny);
        raycaster.current.setFromCamera(ndc, camera);
        const hit = raycaster.current.ray.intersectPlane(groundPlane, hitPoint);
        if (!hit) continue;
        minX = Math.min(minX, hit.x);
        maxX = Math.max(maxX, hit.x);
        minZ = Math.min(minZ, hit.z);
        maxZ = Math.max(maxZ, hit.z);
      }
      if (!Number.isFinite(minX) || !Number.isFinite(minZ) || !groupRef.current) return;

      const FOOTPRINT_MARGIN = 1.08; // slight overscan - covers rounding/trapezoidal edges
      const gridWidth = Math.max(cols - 1, 1) * SPACING;
      const gridDepth = Math.max(rows - 1, 1) * SPACING;
      const scaleX = Math.max(1, ((maxX - minX) * FOOTPRINT_MARGIN) / gridWidth);
      const scaleZ = Math.max(1, ((maxZ - minZ) * FOOTPRINT_MARGIN) / gridDepth);

      spacingScaleRef.current = { x: scaleX, z: scaleZ };
      groupRef.current.scale.set(scaleX, 1, scaleZ);
    }, [camera, size.width, size.height, cols, rows]);

    const injectWave = (row: number, col: number, opts: RippleOpts = {}) => {
      const {
        lift = 0.34,
        maxRadius = 4,
        speed = 16,
        width = 2,
        edgeFade = 1,
      } = opts;
      const list = waves.current;
      list.push({ row, col, start: clockRef.current, speed, width, lift, maxRadius, edgeFade });
      if (list.length > 24) list.shift();
    };

    // Origin sits far outside the grid on one side so the front reads as
    // a near-straight line by the time it crosses the field, same trick
    // as the scroll/diagonal ambient waves.
    const injectPulse = () => {
      const dirs = [
        { row: rows / 2, col: -cols * 1.4 }, // left -> right
        { row: rows / 2, col: cols * 2.4 }, // right -> left
        { row: -rows * 1.4, col: cols / 2 }, // top -> bottom
        { row: rows * 2.4, col: cols / 2 }, // bottom -> top
        { row: -rows * 1.4, col: -cols * 1.4 }, // diagonal
        { row: rows * 2.4, col: cols * 2.4 }, // diagonal, opposite corner
      ];
      const origin = dirs[Math.floor(Math.random() * dirs.length)];
      const list = lightPulses.current;
      list.push({ row: origin.row, col: origin.col, start: clockRef.current, speed: 12, width: 1.4 });
      if (list.length > 6) list.shift();
    };

    // Screen-space client coords -> grid (row, col) via a raycast against
    // the field's base plane; robust regardless of the oblique camera.
    const cellFromClient = (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(ndc, camera);
      const hit = raycaster.current.ray.intersectPlane(groundPlane, hitPoint);
      if (!hit) return null;
      const col = hit.x / (SPACING * spacingScaleRef.current.x) + (cols - 1) / 2;
      const row = -hit.z / (SPACING * spacingScaleRef.current.z);
      return { row, col };
    };

    useImperativeHandle(
      handleRef,
      () => ({
        sweepFrom: (clientX, clientY) =>
          new Promise((resolve) => {
            const cell = cellFromClient(clientX, clientY);
            if (!cell) return resolve();
            const speed = 30;
            const width = 1.8;
            const maxRadius = Math.max(
              Math.hypot(cell.row, cell.col),
              Math.hypot(cell.row, cols - 1 - cell.col),
              Math.hypot(rows - 1 - cell.row, cell.col),
              Math.hypot(rows - 1 - cell.row, cols - 1 - cell.col),
            );
            injectWave(cell.row, cell.col, {
              lift: 0.5,
              speed,
              width,
              maxRadius: Infinity,
              edgeFade: 0.5,
            });
            const totalMs = (maxRadius / speed + width / speed + 0.4) * 1000;
            setTimeout(resolve, totalMs);
          }),
        rippleAt: (clientX, clientY, opts) => {
          const cell = cellFromClient(clientX, clientY);
          if (cell) injectWave(cell.row, cell.col, opts);
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [cols, rows],
    );

    // Idle ambience: small clusters periodically, plus a larger diagonal
    // wave every few seconds so the field is never fully static.
    useEffect(() => {
      if (!idleRipples || reducedMotion) return;
      let smallTimer: ReturnType<typeof setTimeout>;
      let bigTimer: ReturnType<typeof setTimeout>;
      const tickSmall = () => {
        if (visibleRef.current && !document.hidden) {
          injectWave(Math.random() * rows, Math.random() * cols, {
            lift: 0.3 + Math.random() * 0.1,
            maxRadius: 3 + Math.random() * 2,
            speed: 13 + Math.random() * 5,
            width: 1.8,
            edgeFade: 1,
          });
        }
        smallTimer = setTimeout(tickSmall, 2600 + Math.random() * 2000);
      };
      const tickBig = () => {
        if (visibleRef.current && !document.hidden) {
          // Origin sits far outside a corner, equally offset in row and
          // col, so the arc reads as a near-straight diagonal front by
          // the time it crosses the field.
          const fromTopLeft = Math.random() < 0.5;
          const originRow = fromTopLeft ? -rows * 1.4 : rows + rows * 1.4;
          const originCol = fromTopLeft ? -cols * 1.4 : cols + cols * 1.4;
          injectWave(originRow, originCol, {
            lift: 0.4,
            speed: 20,
            width: 3.2,
            maxRadius: Infinity,
            edgeFade: 0.3,
          });
        }
        bigTimer = setTimeout(tickBig, 5000 + Math.random() * 4000);
      };
      smallTimer = setTimeout(tickSmall, 1200);
      bigTimer = setTimeout(tickBig, 3800);
      return () => {
        clearTimeout(smallTimer);
        clearTimeout(bigTimer);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idleRipples, reducedMotion, cols, rows]);

    // Automatic light pulse: a current running through the gutters on
    // its own timer, independent of mouse/wave-driven connector glow.
    useEffect(() => {
      if (!idleRipples || reducedMotion) return;
      let pulseTimer: ReturnType<typeof setTimeout>;
      const tick = () => {
        if (visibleRef.current && !document.hidden) injectPulse();
        pulseTimer = setTimeout(tick, 7000 + Math.random() * 4000);
      };
      pulseTimer = setTimeout(tick, 4500);
      return () => clearTimeout(pulseTimer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idleRipples, reducedMotion, cols, rows]);

    // Scroll: a flattened wave front sweeping in from the edge nearest
    // the scroll direction, throttled so continuous scrolling doesn't
    // flood the wave pool.
    useEffect(() => {
      if (!followMouse || reducedMotion) return;
      let lastY = window.scrollY;
      let lastFire = 0;
      const onScroll = () => {
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;
        const now = performance.now();
        if (Math.abs(dy) < 4 || now - lastFire < 650) return;
        lastFire = now;
        const goingDown = dy > 0;
        // Far-off origin flattens the circular front into a near-straight
        // line sweeping across the grid.
        injectWave(goingDown ? -rows * 2 : rows * 3, cols / 2, {
          lift: 0.3,
          speed: 24,
          width: 2.6,
          maxRadius: Infinity,
          edgeFade: 0.35,
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }, [followMouse, reducedMotion, cols, rows]);

    useFrame((state, rawDelta) => {
      const mesh = meshRef.current;
      if (!mesh || !mesh.instanceColor || !visibleRef.current) return;
      const dt = Math.min(rawDelta, 1 / 30);
      const t = state.clock.elapsedTime;
      clockRef.current = t;

      // Continuous mouse-proximity lift, resolved every frame so nearby
      // cubes lift smoothly and fade with distance - no snapping.
      if (followMouse && mouseActiveRef.current && !reducedMotion) {
        raycaster.current.setFromCamera(state.pointer, state.camera);
        const hit = raycaster.current.ray.intersectPlane(groundPlane, hitPoint);
        if (hit) {
          mouseCell.current.col = hit.x / (SPACING * spacingScaleRef.current.x) + (cols - 1) / 2;
          mouseCell.current.row = -hit.z / (SPACING * spacingScaleRef.current.z);
        }
      }
      const mouseOn = followMouse && mouseActiveRef.current && !reducedMotion;

      // Drop waves that have fully passed beyond their radius.
      const list = waves.current;
      for (let w = list.length - 1; w >= 0; w--) {
        const wave = list[w];
        const age = t - wave.start;
        const reach = Number.isFinite(wave.maxRadius)
          ? wave.maxRadius
          : Math.max(rows, cols) * 1.6;
        if (age * wave.speed > reach + wave.width * 4) list.splice(w, 1);
      }

      // Drop light pulses that have fully crossed the field.
      const pulses = lightPulses.current;
      const pulseReach = Math.max(rows, cols) * 3.2;
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        if ((t - pulse.start) * pulse.speed > pulseReach + pulse.width * 4) pulses.splice(p, 1);
      }

      const colorArr = mesh.instanceColor.array as Float32Array;
      const { base, jitter, restColor, activeColor } = field;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;

          let target = reducedMotion ? 0 : breatheOffset(col, row, t) * 0.035;

          for (let w = 0; w < list.length; w++) {
            const wave = list[w];
            const dist = Math.hypot(row - wave.row, col - wave.col);
            if (dist > wave.maxRadius) continue;
            const age = t - wave.start;
            const front = age * wave.speed;
            const d = dist - front;
            if (Math.abs(d) > wave.width * 3) continue;
            const pulse = Math.exp(-(d * d) / (2 * wave.width * wave.width));
            const reach = Number.isFinite(wave.maxRadius)
              ? wave.maxRadius
              : Math.max(rows, cols) * 1.6;
            const edgeAtten = 1 - wave.edgeFade * Math.min(dist / reach, 1);
            target += wave.lift * pulse * Math.max(edgeAtten, 0);
          }

          if (mouseOn) {
            const dist = Math.hypot(row - mouseCell.current.row, col - mouseCell.current.col);
            target += MOUSE_LIFT * Math.exp(-(dist * dist) / (2 * MOUSE_RADIUS * MOUSE_RADIUS));
          }

          const accel = (target - current[i]) * STIFFNESS;
          velocity[i] += accel * dt;
          velocity[i] *= Math.max(0, 1 - DAMPING * dt);
          current[i] += velocity[i] * dt;

          const activity = THREE.MathUtils.clamp(
            Math.max(current[i], 0) / ACTIVITY_REF,
            0,
            1,
          );
          activityArr[i] = activity;

          tmpObj.position.set(
            (col - (cols - 1) / 2) * SPACING,
            base[i] + current[i],
            -row * SPACING,
          );
          const s = 1 + activity * 0.1;
          tmpObj.scale.set(s, 1 + activity * 0.22, s);
          tmpObj.rotation.set(0, jitter[i] * activity, 0);
          tmpObj.updateMatrix();
          mesh.setMatrixAt(i, tmpObj.matrix);

          const ia = i * 3;
          colorArr[ia] = restColor[ia] + (activeColor[ia] - restColor[ia]) * activity;
          colorArr[ia + 1] = restColor[ia + 1] + (activeColor[ia + 1] - restColor[ia + 1]) * activity;
          colorArr[ia + 2] = restColor[ia + 2] + (activeColor[ia + 2] - restColor[ia + 2]) * activity;
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;

      const cMesh = connectorMeshRef.current;
      if (cMesh && cMesh.instanceColor && edgeCount > 0) {
        // Automatic light-pulse contribution at a connector's own
        // midpoint - separate signal from mouse/wave-driven activity.
        const pulseGlowAt = (r: number, c: number) => {
          let g = 0;
          for (let p = 0; p < pulses.length; p++) {
            const pulse = pulses[p];
            const dist = Math.hypot(r - pulse.row, c - pulse.col);
            const d = dist - (t - pulse.start) * pulse.speed;
            if (Math.abs(d) > pulse.width * 3) continue;
            g += Math.exp(-(d * d) / (2 * pulse.width * pulse.width));
          }
          return g;
        };

        const cColorArr = cMesh.instanceColor.array as Float32Array;
        let idx = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols - 1; col++) {
            const a = row * cols + col;
            const b = a + 1;
            const edgeActivity = ((activityArr[a] + activityArr[b]) * 0.5) ** 2;
            const glow = edgeActivity * CONNECTOR_GLOW + pulseGlowAt(row, col + 0.5) * PULSE_GLOW;
            tmpObj.position.set(
              (col + 0.5 - (cols - 1) / 2) * SPACING,
              (base[a] + current[a] + base[b] + current[b]) / 2,
              -row * SPACING,
            );
            tmpObj.rotation.set(0, 0, 0);
            tmpObj.scale.set(1, 1, 1);
            tmpObj.updateMatrix();
            cMesh.setMatrixAt(idx, tmpObj.matrix);
            const ia = idx * 3;
            cColorArr[ia] = ACCENT.r * glow;
            cColorArr[ia + 1] = ACCENT.g * glow;
            cColorArr[ia + 2] = ACCENT.b * glow;
            idx++;
          }
        }
        for (let row = 0; row < rows - 1; row++) {
          for (let col = 0; col < cols; col++) {
            const a = row * cols + col;
            const b = a + cols;
            const edgeActivity = ((activityArr[a] + activityArr[b]) * 0.5) ** 2;
            const glow = edgeActivity * CONNECTOR_GLOW + pulseGlowAt(row + 0.5, col) * PULSE_GLOW;
            tmpObj.position.set(
              (col - (cols - 1) / 2) * SPACING,
              (base[a] + current[a] + base[b] + current[b]) / 2,
              -(row + 0.5) * SPACING,
            );
            tmpObj.rotation.set(0, Math.PI / 2, 0);
            tmpObj.scale.set(1, 1, 1);
            tmpObj.updateMatrix();
            cMesh.setMatrixAt(idx, tmpObj.matrix);
            const ia = idx * 3;
            cColorArr[ia] = ACCENT.r * glow;
            cColorArr[ia + 1] = ACCENT.g * glow;
            cColorArr[ia + 2] = ACCENT.b * glow;
            idx++;
          }
        }
        cMesh.instanceMatrix.needsUpdate = true;
        cMesh.instanceColor.needsUpdate = true;
      }
    });

    return (
      <group ref={groupRef}>
        <instancedMesh ref={setMeshRef} args={[geometry, material, count]} castShadow={false} receiveShadow={false} />
        {edgeCount > 0 && (
          <instancedMesh
            ref={setConnectorMeshRef}
            args={[connectorGeometry, connectorMaterial, edgeCount]}
            castShadow={false}
            receiveShadow={false}
          />
        )}
      </group>
    );
  },
);

export default CubeField;
