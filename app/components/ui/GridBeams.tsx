"use client";
import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * BackgroundBeams adapted to the ripple grid: instead of organic curves,
 * light beams travel along the grid's own line positions (rows/columns),
 * using the same animated-linearGradient technique as ui/BackgroundBeams.
 * Rendered by RippleGrid, which supplies the measured grid geometry so
 * beams stay pixel-aligned with cell borders.
 */

const BEAM_COLORS = ["#22d3ee", "#a78bfa", "#7c3aed"];
const SEG = 220; // px length of the glowing gradient segment

type Beam = {
  horizontal: boolean;
  pos: number;
  from: number;
  to: number;
  color: string;
  duration: number;
  delay: number;
  repeatDelay: number;
  reverse: boolean;
};

type GridBeamsProps = {
  width: number;
  height: number;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  rows: number;
  cols: number;
  count?: number;
};

export default function GridBeams({
  width,
  height,
  cellSize,
  offsetX,
  offsetY,
  rows,
  cols,
  count = 7,
}: GridBeamsProps) {
  const reduced = useReducedMotion();

  // Hash-based pseudo-randomness keeps render pure: the same grid
  // geometry always yields the same beam layout, and a resize reshuffles.
  const beams = useMemo<Beam[]>(() => {
    const rnd = (n: number) => {
      const x =
        Math.sin(n * 127.1 + width * 0.0173 + height * 0.0131) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => {
      const horizontal = rnd(i * 7 + 1) < 0.5;
      const lineCount = horizontal ? rows : cols;
      const k = 1 + Math.floor(rnd(i * 7 + 2) * Math.max(1, lineCount - 1));
      return {
        horizontal,
        pos: (horizontal ? offsetY : offsetX) + k * cellSize,
        from: 0,
        to: horizontal ? width : height,
        color: BEAM_COLORS[i % BEAM_COLORS.length],
        duration: 3.5 + rnd(i * 7 + 3) * 4,
        delay: rnd(i * 7 + 4) * 5,
        repeatDelay: 1.5 + rnd(i * 7 + 5) * 4.5,
        reverse: rnd(i * 7 + 6) < 0.5,
      };
    });
  }, [width, height, cellSize, offsetX, offsetY, rows, cols, count]);

  if (reduced) return null;

  return (
    <svg
      className="grid-beams"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {beams.map((b, i) => {
          const start = b.reverse ? b.to + SEG : b.from - SEG;
          const end = b.reverse ? b.from - SEG : b.to + SEG;
          const head = { head1: [start, end], head2: [start + SEG, end + SEG] };
          return (
            <motion.linearGradient
              key={`gb-grad-${i}`}
              id={`gb-grad-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={b.horizontal ? start : 0}
              x2={b.horizontal ? start + SEG : 0}
              y1={b.horizontal ? 0 : start}
              y2={b.horizontal ? 0 : start + SEG}
              animate={
                b.horizontal
                  ? { x1: head.head1, x2: head.head2 }
                  : { y1: head.head1, y2: head.head2 }
              }
              transition={{
                duration: b.duration,
                delay: b.delay,
                repeat: Infinity,
                repeatDelay: b.repeatDelay,
                ease: "linear",
              }}
            >
              <stop stopColor={b.color} stopOpacity="0" />
              <stop offset="30%" stopColor={b.color} stopOpacity="0.9" />
              <stop offset="60%" stopColor="#a78bfa" stopOpacity="0.5" />
              <stop offset="100%" stopColor={b.color} stopOpacity="0" />
            </motion.linearGradient>
          );
        })}
      </defs>
      {beams.map((b, i) =>
        b.horizontal ? (
          <line
            key={`gb-${i}`}
            x1={b.from}
            y1={b.pos}
            x2={b.to}
            y2={b.pos}
            stroke={`url(#gb-grad-${i})`}
            strokeWidth="1.2"
          />
        ) : (
          <line
            key={`gb-${i}`}
            x1={b.pos}
            y1={b.from}
            x2={b.pos}
            y2={b.to}
            stroke={`url(#gb-grad-${i})`}
            strokeWidth="1.2"
          />
        ),
      )}
    </svg>
  );
}
