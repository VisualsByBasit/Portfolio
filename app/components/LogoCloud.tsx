"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MARQUEE_TOOLS, ToolLogo } from "./tools";
import { usePrefersReducedMotion } from "./ripple-grid/usePrefersReducedMotion";

const BATCH_SIZE = 4;
const HOLD_MS = 3400;
const TOTAL_BATCHES = Math.ceil(MARQUEE_TOOLS.length / BATCH_SIZE);

function getBatch(index: number) {
  const start = index * BATCH_SIZE;
  const slice = MARQUEE_TOOLS.slice(start, start + BATCH_SIZE);
  // Wrap around so every batch is a full BATCH_SIZE, even the last one.
  if (slice.length < BATCH_SIZE) {
    return slice.concat(MARQUEE_TOOLS.slice(0, BATCH_SIZE - slice.length));
  }
  return slice;
}

/**
 * Logo cloud: exactly 4 tools shown at a time in an even grid, all pills
 * the same fixed size regardless of label length. The whole row slides
 * and blurs out, then the next batch of 4 slides in from the opposite
 * side and resolves into focus - same row-level transition as before,
 * just fewer, evenly-sized pills per batch.
 */
export default function LogoCloud() {
  const [batchIndex, setBatchIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (TOTAL_BATCHES <= 1) return;
    const id = setInterval(() => {
      setBatchIndex((i) => (i + 1) % TOTAL_BATCHES);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="logos" className="logo-cloud-section">
      <p className="section-label">07 · Powered By</p>
      <h2 className="section-title">
        Tools I <span className="highlight">Reach For</span>
      </h2>

      <div className="logo-marquee">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={batchIndex}
            className="logo-row"
            initial={reducedMotion ? undefined : { x: 60, opacity: 0, filter: "blur(14px)" }}
            animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
            exit={reducedMotion ? undefined : { x: -60, opacity: 0, filter: "blur(14px)" }}
            transition={{ duration: reducedMotion ? 0.2 : 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            {getBatch(batchIndex).map((tool, i) => (
              <span key={`${batchIndex}-${i}`} className="logo-chip">
                <ToolLogo tool={tool} size={26} />
                <span className="logo-chip-label">{tool.name}</span>
              </span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
