"use client";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import GridBeams from "./ui/GridBeams";

/**
 * Shared 3D ripple grid used by both the loading screen and the hero
 * background. Cells physically rise (scale + translateZ), glow in a
 * palette color, then settle, staggered by distance from the ripple
 * origin - same delay/duration model as ui/BackgroundRippleEffect, but
 * driven through the Web Animations API so ripples can overlap and
 * follow the cursor without re-rendering hundreds of nodes.
 */

// Purple-dominant with cyan accents; pink is a ~3% easter egg.
const PURPLES = ["#7c3aed", "#8b5cf6", "#a78bfa", "#6d28d9"];
const CYANS = ["#22d3ee", "#67e8f9"];
const PINK = "#f472b6";

// Deterministic per-cell accent so re-renders never reshuffle colors.
const colorFor = (idx: number) => {
  const h = ((idx * 2654435761) >>> 0) % 1000;
  if (h < 30) return PINK;
  if (h < 330) return CYANS[h % CYANS.length];
  return PURPLES[h % PURPLES.length];
};

type RippleOpts = {
  /** ms of extra delay per cell of distance from the origin */
  delayPerCell?: number;
  /** base ms duration of one cell's rise+settle */
  durationBase?: number;
  /** extra ms of duration per cell of distance */
  durationPerCell?: number;
  /** cells further than this (grid distance) don't animate */
  maxRadius?: number;
  /** px of translateZ at the peak */
  lift?: number;
  /** 0..1 - how much the wave attenuates by its outer edge (1 = dies out fully) */
  edgeFade?: number;
};

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
  offX: number;
  offY: number;
};

type RippleGridProps = {
  className?: string;
  /** target cell size in px; adapts upward on huge viewports to cap cell count */
  cellSize?: number;
  /** periodically fire small ripples at random cells */
  idleRipples?: boolean;
  /** continuous small ripples trailing the cursor */
  followMouse?: boolean;
  /** grid-aligned light beams overlay */
  beams?: boolean;
};

const RippleGrid = forwardRef<RippleGridHandle, RippleGridProps>(
  function RippleGrid(
    { className, cellSize = 64, idleRipples = false, followMouse = false, beams = true },
    handle,
  ) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState<Dims | null>(null);
    const dimsRef = useRef<Dims | null>(null);
    dimsRef.current = dims;
    const reducedRef = useRef(false);
    const visibleRef = useRef(true);

    useEffect(() => {
      reducedRef.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
    }, []);

    // Measure the wrapper and derive a centered, full-bleed grid.
    useEffect(() => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const measure = () => {
        const { width, height } = wrap.getBoundingClientRect();
        if (width < 10 || height < 10) return;
        // Cap total cell count so 4K viewports don't get thousands of nodes.
        const cell = Math.max(cellSize, Math.sqrt((width * height) / 1000));
        const cols = Math.ceil(width / cell);
        const rows = Math.ceil(height / cell);
        setDims({
          width,
          height,
          cell,
          cols,
          rows,
          offX: (width - cols * cell) / 2,
          offY: (height - rows * cell) / 2,
        });
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(wrap);
      return () => ro.disconnect();
    }, [cellSize]);

    // Pause idle ripples while the grid is off-screen.
    useEffect(() => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const io = new IntersectionObserver(([entry]) => {
        visibleRef.current = entry.isIntersecting;
      });
      io.observe(wrap);
      return () => io.disconnect();
    }, []);

    const animateWave = useCallback(
      (originRow: number, originCol: number, opts: RippleOpts = {}) => {
        const d = dimsRef.current;
        const grid = gridRef.current;
        if (!d || !grid) return 0;
        const {
          delayPerCell = 55,
          durationBase = 300,
          durationPerCell = 70,
          maxRadius = Infinity,
          lift = 26,
          edgeFade = 1,
        } = opts;
        const reduced = reducedRef.current;
        const cells = grid.children;
        // Radius the falloff is measured against: the wave's own cap, or
        // the farthest grid corner for uncapped sweeps.
        const reach = Number.isFinite(maxRadius)
          ? maxRadius
          : Math.max(
              Math.hypot(originRow, originCol),
              Math.hypot(originRow, d.cols - 1 - originCol),
              Math.hypot(d.rows - 1 - originRow, originCol),
              Math.hypot(d.rows - 1 - originRow, d.cols - 1 - originCol),
            );
        const rise = "cubic-bezier(0.22, 1, 0.36, 1)";
        const fall = "cubic-bezier(0.5, 0, 0.6, 1)";
        let maxD = 0;
        for (let row = 0; row < d.rows; row++) {
          for (let col = 0; col < d.cols; col++) {
            const dist = Math.hypot(originRow - row, originCol - col);
            if (dist > maxRadius) continue;
            // Strength decays toward the wave's outer edge so it dissolves
            // there instead of stopping on a hard, full-brightness ring.
            const strength =
              1 - edgeFade * Math.pow(Math.min(dist / reach, 1), 1.6);
            if (strength < 0.05) continue;
            const idx = row * d.cols + col;
            const el = cells[idx] as HTMLElement | undefined;
            if (!el) continue;
            const pop = el.firstElementChild as HTMLElement | null;
            maxD = Math.max(maxD, dist);
            // Replace any in-flight wave on this cell instead of stacking
            // concurrent animations; the implicit first keyframe makes the
            // new wave take over from the cell's current pose.
            for (const a of el.getAnimations()) a.cancel();
            if (pop) for (const a of pop.getAnimations()) a.cancel();
            const timing = {
              delay: dist * delayPerCell,
              duration: Math.max(160, durationBase + dist * durationPerCell),
            };
            if (!reduced) {
              el.animate(
                [
                  { offset: 0, easing: rise },
                  {
                    offset: 0.32,
                    easing: fall,
                    transform: `translateZ(${lift * strength}px) scale(${1 + 0.1 * strength})`,
                  },
                  {
                    offset: 0.82,
                    easing: "ease-out",
                    transform: `translateZ(${lift * strength * 0.06}px) scale(1)`,
                  },
                  { offset: 1, transform: "translateZ(0) scale(1)" },
                ],
                timing,
              );
            }
            // Glow + box sides live on the pre-painted child; animating
            // only its opacity keeps the whole wave on the compositor.
            pop?.animate(
              [
                { offset: 0, easing: rise },
                { offset: 0.32, easing: fall, opacity: strength },
                { offset: 0.82, easing: "ease-out", opacity: strength * 0.12 },
                { offset: 1, opacity: 0 },
              ],
              timing,
            );
          }
        }
        return maxD * delayPerCell + durationBase + maxD * durationPerCell;
      },
      [],
    );

    const cellFromPoint = useCallback((clientX: number, clientY: number) => {
      const d = dimsRef.current;
      const wrap = wrapRef.current;
      if (!d || !wrap) return null;
      const rect = wrap.getBoundingClientRect();
      return {
        row: Math.floor((clientY - rect.top - d.offY) / d.cell),
        col: Math.floor((clientX - rect.left - d.offX) / d.cell),
      };
    }, []);

    useImperativeHandle(
      handle,
      () => ({
        sweepFrom: (clientX, clientY) =>
          new Promise((resolve) => {
            const cell = cellFromPoint(clientX, clientY);
            if (!cell) return resolve();
            const total = animateWave(cell.row, cell.col, {
              delayPerCell: 16,
              durationBase: 650,
              durationPerCell: 12,
              lift: 40,
              edgeFade: 0.55,
            });
            setTimeout(resolve, total);
          }),
        rippleAt: (clientX, clientY, opts) => {
          const cell = cellFromPoint(clientX, clientY);
          if (cell) animateWave(cell.row, cell.col, opts);
        },
      }),
      [animateWave, cellFromPoint],
    );

    // Idle: small ripples at random points on a loose interval.
    useEffect(() => {
      if (!idleRipples) return;
      let timer: ReturnType<typeof setTimeout>;
      const tick = () => {
        const d = dimsRef.current;
        if (d && visibleRef.current && !document.hidden) {
          animateWave(
            Math.floor(Math.random() * d.rows),
            Math.floor(Math.random() * d.cols),
            { maxRadius: 3.5 + Math.random() * 2, lift: 24, delayPerCell: 65 },
          );
        }
        timer = setTimeout(tick, 2600 + Math.random() * 2000);
      };
      timer = setTimeout(tick, 1200);
      return () => clearTimeout(timer);
    }, [idleRipples, animateWave]);

    // Mouse: continuous throttled ripples trailing the cursor.
    useEffect(() => {
      if (!followMouse) return;
      let last = 0;
      const onMove = (e: MouseEvent) => {
        const now = performance.now();
        if (now - last < 170) return;
        const wrap = wrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        )
          return;
        last = now;
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (cell)
          animateWave(cell.row, cell.col, {
            maxRadius: 3,
            lift: 20,
            delayPerCell: 45,
            durationBase: 260,
            durationPerCell: 55,
          });
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      return () => window.removeEventListener("mousemove", onMove);
    }, [followMouse, animateWave, cellFromPoint]);

    return (
      <div ref={wrapRef} className={cn("ripple-grid", className)} aria-hidden>
        {dims && (
          <>
            <div
              ref={gridRef}
              className="rg-inner"
              style={{
                left: dims.offX,
                top: dims.offY,
                gridTemplateColumns: `repeat(${dims.cols}, ${dims.cell}px)`,
                gridTemplateRows: `repeat(${dims.rows}, ${dims.cell}px)`,
                width: dims.cols * dims.cell,
                height: dims.rows * dims.cell,
              }}
            >
              {Array.from({ length: dims.rows * dims.cols }, (_, idx) => {
                const row = Math.floor(idx / dims.cols);
                const col = idx % dims.cols;
                // Show the two box faces angled toward the viewport center
                // so raised cells read as solid cubes under perspective.
                const sideH = col < dims.cols / 2 ? "rg-side-r" : "rg-side-l";
                const sideV = row < dims.rows / 2 ? "rg-side-b" : "rg-side-t";
                return (
                  <div key={idx} className="rg-cell">
                    <div
                      className="rg-pop"
                      style={{ "--c": colorFor(idx) } as React.CSSProperties}
                    >
                      <div className="rg-pop-top" />
                      <div className={`rg-side ${sideH}`} />
                      <div className={`rg-side ${sideV}`} />
                    </div>
                  </div>
                );
              })}
            </div>
            {beams && (
              <GridBeams
                width={dims.width}
                height={dims.height}
                cellSize={dims.cell}
                offsetX={dims.offX}
                offsetY={dims.offY}
                rows={dims.rows}
                cols={dims.cols}
              />
            )}
          </>
        )}
      </div>
    );
  },
);

export default RippleGrid;
