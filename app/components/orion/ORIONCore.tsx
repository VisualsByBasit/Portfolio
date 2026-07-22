"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/**
 * ORION's holographic AI core - a self-contained R3F scene rendered at
 * whatever pixel size the caller gives it (small in the chat header,
 * larger as the floating launcher).
 *
 * Glow is achieved with layered additive-blended geometry rather than a
 * post-processing bloom pass. EffectComposer/UnrealBloomPass round-trip
 * through intermediate render targets that don't carry the canvas alpha
 * channel cleanly, which is what turned the whole canvas into a visible
 * opaque square in the previous build. Blending straight onto the
 * default framebuffer keeps every pixel outside the geometry itself at
 * true alpha 0, no matter the state.
 */

export type OrionMode = "idle" | "hover" | "thinking" | "opening" | "error";

const CYAN = new THREE.Color("#22d3ee");
const BLUE = new THREE.Color("#3b82f6");
const VIOLET = new THREE.Color("#7c3aed");
const ACCENT = new THREE.Color("#ff5a2e"); // warm amber/red accent flash
const RESPOND = new THREE.Color("#eafcff"); // bright flash the instant a real reply lands

const PARTICLE_COUNT = 90;
const THINK_SEGMENTS = 28;
const CONTAINMENT_SEGMENTS = 36;
const SPOKE_COUNT = 8;
const MAX_PULSES = 3;
const OPEN_SEQUENCE_S = 0.95;
const tmpObj = new THREE.Object3D();

type ORIONCoreProps = {
  mode?: OrionMode;
  size?: number;
  /** increment this from the parent to fire a brief warm accent flash */
  accentTrigger?: number;
  reducedMotion?: boolean;
  className?: string;
};

type Pulse = { start: number; active: boolean };

function baseTone(t: number, out: THREE.Color) {
  // Calm resting tone: cyan/electric-blue with a subtle violet undertone.
  out.copy(CYAN).lerp(BLUE, 0.35).lerp(VIOLET, 0.12 + 0.05 * Math.sin(t * 0.31));
}

function bakeContainmentRing(mesh: THREE.InstancedMesh, radius: number) {
  for (let i = 0; i < CONTAINMENT_SEGMENTS; i++) {
    const gap = i % 4 === 3; // dashed/segmented, arc-reactor containment feel
    const a = (i / CONTAINMENT_SEGMENTS) * Math.PI * 2;
    tmpObj.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    tmpObj.rotation.set(0, 0, a + Math.PI / 2);
    tmpObj.scale.set(gap ? 0 : 1, gap ? 0 : 1, 1);
    tmpObj.updateMatrix();
    mesh.setMatrixAt(i, tmpObj.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function bakeSpokes(mesh: THREE.InstancedMesh, length: number) {
  for (let i = 0; i < SPOKE_COUNT; i++) {
    const a = (i / SPOKE_COUNT) * Math.PI * 2;
    tmpObj.position.set(Math.cos(a) * (length / 2), Math.sin(a) * (length / 2), 0);
    tmpObj.rotation.set(0, 0, a);
    tmpObj.scale.set(1, 1, 1);
    tmpObj.updateMatrix();
    mesh.setMatrixAt(i, tmpObj.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function Scene({ mode, accentTrigger, reducedMotion }: Required<Omit<ORIONCoreProps, "size" | "className">>) {
  const parallaxRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const edgesMat = useRef<THREE.LineBasicMaterial>(null);
  const haloRefs = useRef<(THREE.Mesh | null)[]>([]);
  const haloMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const containmentRef = useRef<THREE.InstancedMesh>(null);
  const containmentMat = useRef<THREE.MeshBasicMaterial>(null);
  const spokesRef = useRef<THREE.InstancedMesh>(null);
  const spokesMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const pointsRef = useRef<THREE.Points>(null);
  const pointsMat = useRef<THREE.PointsMaterial>(null);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pulseMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const thinkRef = useRef<THREE.InstancedMesh>(null);

  const accentRef = useRef(0); // 0..1 decaying warm-accent intensity
  const respondRef = useRef(0); // 0..1 decaying "reply just landed" flash
  const lastAccentTrigger = useRef(accentTrigger);
  const pulses = useRef<Pulse[]>(
    Array.from({ length: MAX_PULSES }, () => ({ start: -999, active: false })),
  );
  const lastMode = useRef(mode);
  const openStart = useRef<number | null>(null);
  const thinkStart = useRef<number | null>(null);
  const idleAccentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const color = useMemo(() => new THREE.Color(), []);
  const tone = useMemo(() => new THREE.Color(), []);

  const ringData = useMemo(
    () => [
      { radius: 1.15, tube: 0.02, rotAxis: new THREE.Vector3(1, 0.2, 0).normalize(), speed: 0.22, tilt: 0.4 },
      { radius: 1.45, tube: 0.015, rotAxis: new THREE.Vector3(0.3, 1, 0.1).normalize(), speed: -0.16, tilt: 1.1 },
      { radius: 1.75, tube: 0.012, rotAxis: new THREE.Vector3(0.1, 0.15, 1).normalize(), speed: 0.11, tilt: 1.9 },
    ],
    [],
  );

  // Scatter seeds for the opening "boot" sequence - each ring gets a random
  // extra tilt/scale offset that eases out to zero as the core aligns.
  /* eslint-disable react-hooks/purity */
  const scatterSeeds = useMemo(
    () => ringData.map(() => ({ axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), amount: 0.7 + Math.random() * 0.6 })),
    [ringData],
  );
  /* eslint-enable react-hooks/purity */

  const coreGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.55, 1), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(coreGeometry, 1), [coreGeometry]);
  const containmentGeometry = useMemo(() => new THREE.BoxGeometry(0.09, 0.035, 0.02), []);
  const spokeGeometry = useMemo(() => new THREE.BoxGeometry(0.85, 0.014, 0.014), []);
  const thinkGeometry = useMemo(() => new THREE.BoxGeometry(0.05, 0.22, 0.05), []);
  const thinkMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#22d3ee",
        toneMapped: false,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      coreGeometry.dispose();
      edgesGeometry.dispose();
      containmentGeometry.dispose();
      spokeGeometry.dispose();
      thinkGeometry.dispose();
      thinkMaterial.dispose();
    },
    [coreGeometry, edgesGeometry, containmentGeometry, spokeGeometry, thinkGeometry, thinkMaterial],
  );

  // Bake the static instance transforms once - these rigid shapes rotate
  // as whole meshes, so there's no need to recompute per-instance matrices
  // every frame the way the thinking waveform does.
  useEffect(() => {
    if (containmentRef.current) bakeContainmentRing(containmentRef.current, 0.82);
    if (spokesRef.current) bakeSpokes(spokesRef.current, 1.85);
  }, []);

  // One-time random orbit seeds per particle - deliberately non-reactive
  // (mount-stable, like CubeField's per-cube jitter), not a render-purity
  // hazard the way the rule's static check assumes.
  /* eslint-disable react-hooks/purity */
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        radius: 1.9 + Math.random() * 1.1,
        speed: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        incline: (Math.random() - 0.5) * 1.6,
        vSpeed: 0.3 + Math.random() * 0.4,
      });
    }
    return arr;
  }, []);
  /* eslint-enable react-hooks/purity */

  const particlePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    return geo;
  }, [particlePositions]);

  // Fire the accent flash whenever the trigger prop changes.
  useEffect(() => {
    if (accentTrigger !== lastAccentTrigger.current) {
      lastAccentTrigger.current = accentTrigger;
      accentRef.current = 1;
    }
  }, [accentTrigger]);

  // Occasional idle accent moment - a brief warm pulse every couple of
  // minutes while at rest, independent of chat activity.
  useEffect(() => {
    if (reducedMotion) return;
    const schedule = () => {
      idleAccentTimer.current = setTimeout(
        () => {
          if (lastMode.current === "idle") accentRef.current = 1;
          schedule();
        },
        90_000 + Math.random() * 90_000,
      );
    };
    schedule();
    return () => {
      if (idleAccentTimer.current) clearTimeout(idleAccentTimer.current);
    };
  }, [reducedMotion]);

  // Mode-transition bookkeeping: hover scan pulses, the opening boot
  // timer, the thinking-pattern clock, and the "reply landed" flash.
  useEffect(() => {
    const t = performance.now() / 1000;
    if (mode === "opening" && lastMode.current !== "opening") openStart.current = t;
    if (mode === "thinking" && lastMode.current !== "thinking") thinkStart.current = t;
    if (lastMode.current === "thinking" && mode !== "thinking") respondRef.current = 1;
    lastMode.current = mode;

    const spawn = () => {
      const now = performance.now() / 1000;
      const slot = pulses.current.find((p) => !p.active) ?? pulses.current[0];
      slot.start = now;
      slot.active = true;
    };
    if (mode === "hover" && !reducedMotion) {
      spawn();
      hoverPulseTimer.current = setInterval(spawn, 1400);
    }
    return () => {
      if (hoverPulseTimer.current) clearInterval(hoverPulseTimer.current);
    };
  }, [mode, reducedMotion]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;

    // Decay the accent flash and reply-landed flash back to resting state.
    accentRef.current = Math.max(0, accentRef.current - dt * (reducedMotion ? 1.4 : 0.9));
    respondRef.current = Math.max(0, respondRef.current - dt * 2.6);

    const hoverK = mode === "hover" ? 1 : 0;
    const thinkK = mode === "thinking" ? 1 : 0;
    const openK = mode === "opening" ? 1 : 0;
    const speedMul = reducedMotion ? 0.08 : mode === "hover" ? 2.1 : mode === "thinking" ? 1.5 : mode === "opening" ? 1.8 : 1;

    // --- opening boot progress: brief pulse, then rings ease into place ---
    let openEase = 1;
    if (mode === "opening" && openStart.current !== null) {
      const progress = Math.min(1, (t - openStart.current) / OPEN_SEQUENCE_S);
      openEase = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    }
    const scatterAmount = reducedMotion ? 0 : openK * (1 - openEase);

    // --- parallax tilt toward the pointer ---
    if (parallaxRef.current) {
      const px = reducedMotion ? 0 : state.pointer.x;
      const py = reducedMotion ? 0 : state.pointer.y;
      parallaxRef.current.rotation.y += (px * 0.28 - parallaxRef.current.rotation.y) * 0.06;
      parallaxRef.current.rotation.x += (-py * 0.2 - parallaxRef.current.rotation.x) * 0.06;
    }

    // --- continuous ring spin ---
    if (spinRef.current) {
      spinRef.current.rotation.y += dt * 0.12 * speedMul;
    }
    ringData.forEach((r, i) => {
      const mesh = ringRefs.current[i];
      if (!mesh) return;
      mesh.rotateOnWorldAxis(r.rotAxis, r.speed * dt * speedMul);
      if (scatterAmount > 0) {
        const seed = scatterSeeds[i];
        mesh.rotateOnWorldAxis(seed.axis, seed.amount * scatterAmount * dt * 4);
        const s = 1 + seed.amount * scatterAmount * 0.35;
        mesh.scale.setScalar(s);
      } else {
        mesh.scale.setScalar(1);
      }
    });

    // --- containment ring + spokes: slow independent rotation ---
    if (containmentRef.current) containmentRef.current.rotation.z += dt * 0.3 * speedMul;
    if (spokesRef.current) spokesRef.current.rotation.z -= dt * 0.08 * speedMul;

    // --- breathing pulse (idle) + brightness ---
    const breathe = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.5 + 0.5; // 0..1
    const openPulse = openK * Math.max(0, 1 - (t - (openStart.current ?? t)) / 0.35); // brief energy spike at boot start
    const coreScale =
      0.92 + breathe * 0.1 + hoverK * 0.08 + thinkK * 0.04 + openPulse * 0.22 + respondRef.current * 0.12;
    if (coreRef.current) coreRef.current.scale.setScalar(coreScale);
    if (edgesRef.current) edgesRef.current.scale.setScalar(coreScale);

    baseTone(t, color);
    const brightnessBoost =
      1 + breathe * 0.5 + hoverK * 0.9 + thinkK * 0.35 + openPulse * 1.4 + respondRef.current * 0.8;
    tone.copy(color).multiplyScalar(brightnessBoost);
    // Error mode holds the warm accent at full strength instead of letting
    // it decay - a persistent status signal rather than a passing flash.
    const errorK = mode === "error" ? 1 : 0;
    const accentAmount = Math.min(1, Math.max(accentRef.current * 1.15, errorK));
    if (accentAmount > 0.01) tone.lerp(ACCENT, accentAmount).multiplyScalar(1 + accentAmount * 0.6);
    if (respondRef.current > 0.01) tone.lerp(RESPOND, respondRef.current * 0.5);

    if (coreMat.current) coreMat.current.color.copy(tone);
    if (edgesMat.current) {
      edgesMat.current.color.copy(tone);
      edgesMat.current.opacity = 0.55 + hoverK * 0.3 + thinkK * 0.15 + respondRef.current * 0.3;
    }
    haloMats.current.forEach((m, i) => {
      if (!m) return;
      const falloff = [0.34, 0.17, 0.08][i] ?? 0.08;
      m.color.copy(tone);
      m.opacity =
        falloff + breathe * falloff * 0.5 + hoverK * falloff * 0.6 + openPulse * falloff * 1.6 + respondRef.current * falloff;
    });
    if (containmentMat.current) {
      containmentMat.current.color.copy(tone);
      containmentMat.current.opacity = 0.7 + hoverK * 0.25 + thinkK * 0.1;
    }
    if (spokesMat.current) {
      spokesMat.current.color.copy(tone);
      spokesMat.current.opacity = 0.16 + breathe * 0.08 + hoverK * 0.12;
    }
    ringMats.current.forEach((m) => {
      if (m) {
        m.color.copy(tone);
        m.opacity = 0.55 + hoverK * 0.35 + thinkK * 0.15;
      }
    });
    if (pointsMat.current) {
      pointsMat.current.color.copy(tone);
      pointsMat.current.opacity = 0.7 + hoverK * 0.3;
    }

    // --- orbiting particles --- (mutated through the live ref, not the
    // useMemo'd geometry/array directly, so React Compiler doesn't treat
    // this as a render-purity violation - same convention as CubeField)
    const pointsMesh = pointsRef.current;
    if (pointsMesh) {
      const posAttr = pointsMesh.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const activity = reducedMotion ? 0.3 : 1 + hoverK * 0.8;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        const angle = p.phase + t * p.speed * activity;
        const y = Math.sin(t * p.vSpeed + p.phase) * p.incline;
        arr[i * 3] = Math.cos(angle) * p.radius;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = Math.sin(angle) * p.radius * 0.9;
      }
      posAttr.needsUpdate = true;
    }

    // --- expanding scan-pulse rings (hover) ---
    pulses.current.forEach((p, i) => {
      const mesh = pulseRefs.current[i];
      const mat = pulseMats.current[i];
      if (!mesh || !mat) return;
      if (!p.active) {
        mesh.visible = false;
        return;
      }
      const age = t - p.start;
      const life = 1.3;
      if (age > life) {
        p.active = false;
        mesh.visible = false;
        return;
      }
      const progress = age / life;
      mesh.visible = true;
      const s = 1.05 + progress * 1.6;
      mesh.scale.setScalar(s);
      mat.opacity = (1 - progress) * 0.5;
      mat.color.copy(tone);
    });

    // --- thinking waveform: alternates between a radial pulse pattern and
    // a tightening "focus" pattern every ~1.1s, fast/subtle transitions ---
    if (thinkRef.current) {
      thinkRef.current.visible = mode === "thinking";
      if (mode === "thinking" && thinkStart.current !== null) {
        const elapsed = t - thinkStart.current;
        const cycle = 1.1;
        const cycleT = (elapsed % cycle) / cycle;
        const tightening = Math.floor(elapsed / cycle) % 2 === 1;
        for (let i = 0; i < THINK_SEGMENTS; i++) {
          const a = (i / THINK_SEGMENTS) * Math.PI * 2;
          let radius: number;
          let h: number;
          if (tightening) {
            radius = 1.35 - cycleT * 0.4;
            const focus = Math.sin(a * 6 + t * 9) * 0.5 + 0.5;
            h = 0.1 + focus * 0.22 * (1 - cycleT * 0.4);
          } else {
            const wave = Math.sin(a * 3 - t * 5) * 0.5 + 0.5;
            radius = 1.35;
            h = 0.12 + wave * 0.32;
          }
          tmpObj.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
          tmpObj.rotation.set(0, -a, 0);
          tmpObj.scale.set(1, h, 1);
          tmpObj.updateMatrix();
          thinkRef.current.setMatrixAt(i, tmpObj.matrix);
        }
        thinkRef.current.instanceMatrix.needsUpdate = true;
        thinkMaterial.color.copy(tone);
      }
    }
  });

  return (
    <group ref={parallaxRef}>
      <group ref={spinRef}>
        <mesh ref={coreRef}>
          <primitive object={coreGeometry} attach="geometry" />
          <meshBasicMaterial ref={coreMat} color="#22d3ee" toneMapped={false} />
        </mesh>
        <lineSegments ref={edgesRef}>
          <primitive object={edgesGeometry} attach="geometry" />
          <lineBasicMaterial
            ref={edgesMat}
            color="#22d3ee"
            transparent
            opacity={0.55}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        {[0.72, 0.98, 1.3].map((radius, i) => (
          <mesh key={radius} ref={(el) => { haloRefs.current[i] = el; }}>
            <sphereGeometry args={[radius, 24, 24]} />
            <meshBasicMaterial
              ref={(el) => { haloMats.current[i] = el; }}
              color="#22d3ee"
              transparent
              opacity={0.15}
              toneMapped={false}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}

        <instancedMesh ref={containmentRef} args={[containmentGeometry, undefined, CONTAINMENT_SEGMENTS]}>
          <meshBasicMaterial
            ref={containmentMat}
            color="#22d3ee"
            transparent
            opacity={0.7}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </instancedMesh>

        <instancedMesh ref={spokesRef} args={[spokeGeometry, undefined, SPOKE_COUNT]}>
          <meshBasicMaterial
            ref={spokesMat}
            color="#22d3ee"
            transparent
            opacity={0.2}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </instancedMesh>

        {ringData.map((r, i) => (
          <mesh key={i} ref={(el) => { ringRefs.current[i] = el; }} rotation={[0, 0, r.tilt]}>
            <torusGeometry args={[r.radius, r.tube, 8, 96]} />
            <meshBasicMaterial
              ref={(el) => { ringMats.current[i] = el; }}
              color="#22d3ee"
              transparent
              opacity={0.6}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}

        {Array.from({ length: MAX_PULSES }).map((_, i) => (
          <mesh key={i} ref={(el) => { pulseRefs.current[i] = el; }} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[1.0, 1.04, 64]} />
            <meshBasicMaterial
              ref={(el) => { pulseMats.current[i] = el; }}
              color="#22d3ee"
              transparent
              opacity={0}
              toneMapped={false}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}

        <instancedMesh ref={thinkRef} args={[thinkGeometry, thinkMaterial, THINK_SEGMENTS]} visible={false} />

        <points ref={pointsRef} geometry={particleGeometry}>
          <pointsMaterial
            ref={pointsMat}
            color="#22d3ee"
            size={0.035}
            sizeAttenuation
            transparent
            opacity={0.75}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>
    </group>
  );
}

export default function ORIONCore({
  mode = "idle",
  size = 64,
  accentTrigger = 0,
  reducedMotion = false,
  className,
}: ORIONCoreProps) {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  return (
    <div className={cn("orion-core", className)} style={{ width: size, height: size }} aria-hidden>
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.4], fov: 40 }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Scene mode={mode} accentTrigger={accentTrigger} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
