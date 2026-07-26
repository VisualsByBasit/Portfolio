"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import GlassEnvironment from "../ripple-grid/GlassEnvironment";
import Effects from "../ripple-grid/Effects";
import { useQualityTier } from "../ripple-grid/useQualityTier";
import { usePrefersReducedMotion } from "../ripple-grid/usePrefersReducedMotion";

const ACCENTS = [
  new THREE.Color("#7c3aed"), // purple
  new THREE.Color("#22d3ee"), // cyan
  new THREE.Color("#a78bfa"), // lavender
];

const STIFFNESS = 55;
const DAMPING = 6;
const REPEL_STRENGTH = 22;
const FLICK_MULTIPLIER = 0.22;
const MAX_FLICK_SPEED = 900;

type CubeHome = {
  fx: number; // 0..1, fraction of container width
  fy: number; // 0..1, fraction of container height
  z: number;
  size: number;
  phase: number;
  speed: number;
};

type CubeMotionState = { x: number; y: number; vx: number; vy: number };

type Vec2 = { x: number; y: number };

export type CubeClusterHandle = {
  /** Picks the nearest cube within grab range; returns whether one was grabbed. */
  grabAt: (worldX: number, worldY: number) => boolean;
  /** Releases the currently-grabbed cube, launching it with a flick impulse. */
  release: (flickX: number, flickY: number) => void;
};

/** Orthographic camera whose frustum exactly matches the canvas's pixel size, so world units == CSS pixels and pointer math stays simple. */
function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    // Resizing an orthographic frustum in place is the standard r3f
    // pattern - useThree() hands back a live three.js object, not
    // React-owned state (same rationale as GlassEnvironment's
    // scene.environment assignment).
    /* eslint-disable react-hooks/immutability */
    cam.left = -size.width / 2;
    cam.right = size.width / 2;
    cam.top = size.height / 2;
    cam.bottom = -size.height / 2;
    cam.near = 0.1;
    cam.far = 1000;
    cam.position.set(0, 0, 300);
    cam.updateProjectionMatrix();
    /* eslint-enable react-hooks/immutability */
  }, [camera, size]);
  return null;
}

const CubeCluster = forwardRef<
  CubeClusterHandle,
  {
    homes: CubeHome[];
    tier: "high" | "low";
    reducedMotion: boolean;
    pointerWorldRef: React.RefObject<Vec2>;
    pointerActiveRef: React.RefObject<boolean>;
  }
>(function CubeCluster({ homes, tier, reducedMotion, pointerWorldRef, pointerActiveRef }, handleRef) {
  const { size } = useThree();
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // All mutable physics state is owned locally by this component (never
  // passed in as a prop) - the parent only ever reaches it through the
  // grabAt/release handle below, the same imperative-handle pattern
  // CubeField uses for its sweepFrom/rippleAt.
  const st = useRef<CubeMotionState[]>(homes.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 })));
  const draggingIndex = useRef<number | null>(null);
  const dragOffset = useRef<Vec2>({ x: 0, y: 0 });

  const materials = useMemo(
    () =>
      homes.map((_, i) => {
        const accent = ACCENTS[i % ACCENTS.length];
        if (tier === "high") {
          return new THREE.MeshPhysicalMaterial({
            color: accent,
            transmission: 0.5,
            thickness: 0.7,
            roughness: 0.32,
            envMapIntensity: 0.6,
            ior: 1.4,
            clearcoat: 0.25,
            clearcoatRoughness: 0.3,
            emissive: accent,
            emissiveIntensity: 0.32,
            transparent: true,
            opacity: 0.96,
          });
        }
        return new THREE.MeshStandardMaterial({
          color: accent,
          roughness: 0.4,
          metalness: 0.1,
          emissive: accent,
          emissiveIntensity: 0.22,
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tier],
  );

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useImperativeHandle(
    handleRef,
    () => ({
      grabAt: (worldX, worldY) => {
        let nearest = -1;
        let nearestDist = Infinity;
        st.current.forEach((s, i) => {
          const dist = Math.hypot(s.x - worldX, s.y - worldY);
          if (dist < homes[i].size * 1.6 && dist < nearestDist) {
            nearestDist = dist;
            nearest = i;
          }
        });
        if (nearest < 0) return false;
        draggingIndex.current = nearest;
        dragOffset.current = { x: st.current[nearest].x - worldX, y: st.current[nearest].y - worldY };
        return true;
      },
      release: (flickX, flickY) => {
        const idx = draggingIndex.current;
        if (idx !== null) {
          const speed = Math.hypot(flickX, flickY);
          const scale = speed > MAX_FLICK_SPEED ? MAX_FLICK_SPEED / speed : 1;
          st.current[idx].vx = flickX * FLICK_MULTIPLIER * scale;
          st.current[idx].vy = flickY * FLICK_MULTIPLIER * scale;
        }
        draggingIndex.current = null;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((frameState, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const t = frameState.clock.elapsedTime;
    const states = st.current;
    const dragIdx = draggingIndex.current;
    const pointerActive = pointerActiveRef.current;
    const pointerWorld = pointerWorldRef.current;

    for (let i = 0; i < homes.length; i++) {
      const s = states[i];
      const home = homes[i];

      if (i === dragIdx) {
        const targetX = pointerWorld.x + dragOffset.current.x;
        const targetY = pointerWorld.y + dragOffset.current.y;
        s.vx = (targetX - s.x) / Math.max(dt, 0.001);
        s.vy = (targetY - s.y) / Math.max(dt, 0.001);
        s.x = targetX;
        s.y = targetY;
        continue;
      }

      let targetX = (home.fx - 0.5) * size.width;
      let targetY = (home.fy - 0.5) * size.height;

      if (!reducedMotion) {
        targetX += Math.sin(t * home.speed + home.phase) * size.width * 0.035;
        targetY += Math.cos(t * home.speed * 0.8 + home.phase) * size.height * 0.035;

        if (pointerActive) {
          const dx = s.x - pointerWorld.x;
          const dy = s.y - pointerWorld.y;
          const dist = Math.hypot(dx, dy);
          const repelRadius = Math.min(size.width, size.height) * 0.4;
          if (dist < repelRadius && dist > 0.001) {
            const force = (1 - dist / repelRadius) ** 2 * REPEL_STRENGTH;
            targetX += (dx / dist) * force * repelRadius * 0.3;
            targetY += (dy / dist) * force * repelRadius * 0.3;
          }
        }
      }

      const ax = (targetX - s.x) * STIFFNESS;
      const ay = (targetY - s.y) * STIFFNESS;
      s.vx += ax * dt;
      s.vy += ay * dt;
      s.vx *= Math.max(0, 1 - DAMPING * dt);
      s.vy *= Math.max(0, 1 - DAMPING * dt);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }

    // Soft pairwise collision so cubes gently nudge each other apart
    // rather than overlapping when drifting/repelling into one another.
    for (let i = 0; i < homes.length; i++) {
      for (let j = i + 1; j < homes.length; j++) {
        const a = states[i];
        const b = states[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = (homes[i].size + homes[j].size) * 0.95;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          if (i !== dragIdx) {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
          }
          if (j !== dragIdx) {
            b.x += nx * overlap;
            b.y += ny * overlap;
          }
        }
      }
    }

    for (let i = 0; i < homes.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      const s = states[i];
      mesh.position.set(s.x, s.y, homes[i].z);
      if (!reducedMotion) {
        mesh.rotation.x += (0.04 + Math.min(Math.abs(s.vx), 400) * 0.0007) * dt;
        mesh.rotation.y += (0.06 + Math.min(Math.abs(s.vy), 400) * 0.0007) * dt;
      }
    }
  });

  return (
    <>
      {homes.map((home, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          geometry={geometry}
          material={materials[i]}
          scale={home.size}
        />
      ))}
    </>
  );
});

const BG_TRANSPARENT = new THREE.Color("#06060f");

function randomHomes(count: number): CubeHome[] {
  return Array.from({ length: count }, () => ({
    fx: 0.16 + Math.random() * 0.68,
    fy: 0.16 + Math.random() * 0.68,
    z: (Math.random() - 0.5) * 30,
    size: 22 + Math.random() * 16,
    phase: Math.random() * Math.PI * 2,
    speed: 0.35 + Math.random() * 0.3,
  }));
}

/**
 * Small cluster of glowing cubes standing in for the reference site's
 * floating chrome spheres - same glass/cyan-purple material language as
 * the hero's CubeField, but a self-contained pocket physics toy: idle
 * drift, gentle mutual collision, cursor-proximity repulsion, and
 * click-drag-flick. Bounded to its own container rather than the
 * viewport-tracking hero grid.
 */
export default function ContactCubes() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<CubeClusterHandle>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const tier = useQualityTier();
  const reducedMotion = usePrefersReducedMotion();

  const count = tier === "high" ? 9 : 6;
  // Lazy initializer runs once on mount, not on every render - a fresh
  // random layout per page load is fine for this decorative toy.
  const [homes] = useState<CubeHome[]>(() => randomHomes(count));

  const pointerWorldRef = useRef<Vec2>({ x: 0, y: 0 });
  const pointerActiveRef = useRef(false);
  const lastPointerRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const flickVelRef = useRef<Vec2>({ x: 0, y: 0 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const { width, height } = wrap.getBoundingClientRect();
      if (width < 10 || height < 10) return;
      setDims({ width, height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const toWorld = (clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: clientX - rect.left - rect.width / 2,
      y: -(clientY - rect.top - rect.height / 2),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const world = toWorld(e.clientX, e.clientY);
    pointerActiveRef.current = true;
    const now = performance.now();
    const last = lastPointerRef.current;
    if (last) {
      const dt = Math.max((now - last.t) / 1000, 0.001);
      flickVelRef.current = { x: (world.x - last.x) / dt, y: (world.y - last.y) / dt };
    }
    lastPointerRef.current = { t: now, x: world.x, y: world.y };
    pointerWorldRef.current = world;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const world = toWorld(e.clientX, e.clientY);
    clusterRef.current?.grabAt(world.x, world.y);
  };

  const releaseDrag = () => {
    clusterRef.current?.release(flickVelRef.current.x, flickVelRef.current.y);
  };

  return (
    <div
      ref={wrapRef}
      className="contact-cubes"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={releaseDrag}
      onPointerLeave={() => {
        pointerActiveRef.current = false;
        releaseDrag();
      }}
    >
      {dims && homes && (
        <Canvas
          orthographic
          dpr={tier === "high" ? [1, 1.5] : 1}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(BG_TRANSPARENT, 0);
          }}
        >
          <CameraRig />
          <ambientLight intensity={0.7} color="#cfd2ff" />
          <directionalLight position={[80, 120, 200]} intensity={0.6} color="#a78bfa" />
          <directionalLight position={[-100, -60, 150]} intensity={0.4} color="#22d3ee" />
          {tier === "high" && <GlassEnvironment />}
          <CubeCluster
            ref={clusterRef}
            homes={homes}
            tier={tier}
            reducedMotion={reducedMotion}
            pointerWorldRef={pointerWorldRef}
            pointerActiveRef={pointerActiveRef}
          />
          {tier === "high" && <Effects />}
        </Canvas>
      )}
      <span className="contact-cubes-hint">{"// drag the cubes"}</span>
    </div>
  );
}
