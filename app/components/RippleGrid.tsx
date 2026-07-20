"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import CubeField, {
  type CubeFieldHandle,
  type RippleOpts,
} from "./ripple-grid/CubeField";
import Effects from "./ripple-grid/Effects";
import GlassEnvironment from "./ripple-grid/GlassEnvironment";
import { useQualityTier } from "./ripple-grid/useQualityTier";
import { usePrefersReducedMotion } from "./ripple-grid/usePrefersReducedMotion";

/**
 * Shared GPU-rendered 3D cube field used by both the loading screen and
 * the hero background. A single React Three Fiber instanced mesh reads
 * as a field of glass cubes over noise-based terrain; waves are spring-
 * physics height targets injected into that mesh, not per-node DOM
 * animations. See app/components/ripple-grid/ for the implementation -
 * this file is just the measurement/wiring shell so the public
 * contract (props + sweepFrom/rippleAt) never has to change for callers.
 */

export type RippleGridHandle = {
  /** Full-grid wave from a viewport point; resolves when the wave has covered the grid. */
  sweepFrom: (clientX: number, clientY: number) => Promise<void>;
  /** Small local ripple at a viewport point. */
  rippleAt: (clientX: number, clientY: number, opts?: RippleOpts) => void;
};

type Dims = {
  width: number;
  height: number;
  cell: number;
  cols: number;
  rows: number;
};

type RippleGridProps = {
  className?: string;
  /** target cell size in px; adapts upward on huge viewports to cap cell count */
  cellSize?: number;
  /** periodically fire small ripples at random cells */
  idleRipples?: boolean;
  /** continuous small ripples trailing the cursor */
  followMouse?: boolean;
  /**
   * Kept for API compatibility - the old flat SVG light-beam overlay
   * (ui/GridBeams) doesn't make sense projected over true 3D geometry
   * under a perspective camera and has been retired. The connector
   * "energy" bars between active cubes (see CubeField) now cover the
   * same "something is traveling through the grid" role, natively in 3D.
   */
  beams?: boolean;
};

const BG = "#06060f";

const RippleGrid = forwardRef<RippleGridHandle, RippleGridProps>(
  function RippleGrid(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API compatibility, see RippleGridProps.beams
    { className, cellSize = 64, idleRipples = false, followMouse = false, beams = true },
    handle,
  ) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const cubeFieldRef = useRef<CubeFieldHandle>(null);
    const [dims, setDims] = useState<Dims | null>(null);
    const visibleRef = useRef(true);
    const mouseActiveRef = useRef(false);

    const tier = useQualityTier();
    const reducedMotion = usePrefersReducedMotion();
    const effectiveCellSize = tier === "low" ? cellSize * 1.6 : cellSize;

    // Measure the wrapper and derive a centered grid density; same cap
    // formula as before so 4K viewports don't get thousands of cubes.
    useEffect(() => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const measure = () => {
        const { width, height } = wrap.getBoundingClientRect();
        if (width < 10 || height < 10) return;
        const cell = Math.max(effectiveCellSize, Math.sqrt((width * height) / 1000));
        const cols = Math.ceil(width / cell);
        const rows = Math.ceil(height / cell);
        setDims({ width, height, cell, cols, rows });
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(wrap);
      return () => ro.disconnect();
    }, [effectiveCellSize]);

    // Pause idle/ambient animation while the grid is off-screen.
    useEffect(() => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const io = new IntersectionObserver(([entry]) => {
        visibleRef.current = entry.isIntersecting;
      });
      io.observe(wrap);
      return () => io.disconnect();
    }, []);

    useImperativeHandle(
      handle,
      () => ({
        sweepFrom: (clientX, clientY) =>
          cubeFieldRef.current?.sweepFrom(clientX, clientY) ?? Promise.resolve(),
        rippleAt: (clientX, clientY, opts) => cubeFieldRef.current?.rippleAt(clientX, clientY, opts),
      }),
      [],
    );

    return (
      <div
        ref={wrapRef}
        className={cn("ripple-grid", className)}
        aria-hidden
        onPointerEnter={() => {
          mouseActiveRef.current = true;
        }}
        onPointerLeave={() => {
          mouseActiveRef.current = false;
        }}
        onPointerDown={(e) => {
          if (!followMouse) return;
          cubeFieldRef.current?.rippleAt(e.clientX, e.clientY, {
            lift: 0.42,
            maxRadius: 5,
            speed: 22,
            width: 2,
            edgeFade: 0.6,
          });
        }}
      >
        {dims && (
          <>
            <Canvas
              camera={{ position: [0, 12.5, 4.5], fov: 38 }}
              dpr={tier === "high" ? [1, 1.5] : 1}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              onCreated={({ camera, scene, gl }) => {
                camera.lookAt(0, -0.5, -7);
                scene.background = new THREE.Color(BG);
                scene.fog = new THREE.FogExp2(BG, 0.045);
                gl.setClearColor(BG, 1);
              }}
            >
              <ambientLight intensity={0.09} color="#6f92c4" />
              <hemisphereLight args={["#6fa8c4", "#050414", 0.1]} />
              <directionalLight position={[-6, 9, 4]} intensity={0.5} color="#bfe4ee" />
              {tier === "high" && <GlassEnvironment />}
              <CubeField
                key={`${dims.cols}x${dims.rows}-${tier}`}
                ref={cubeFieldRef}
                cols={dims.cols}
                rows={dims.rows}
                tier={tier}
                idleRipples={idleRipples}
                followMouse={followMouse}
                reducedMotion={reducedMotion}
                mouseActiveRef={mouseActiveRef}
                visibleRef={visibleRef}
              />
              {tier === "high" && <Effects />}
            </Canvas>
          </>
        )}
      </div>
    );
  },
);

export default RippleGrid;
