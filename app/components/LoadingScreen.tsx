"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RippleGrid, { RippleGridHandle } from "./RippleGrid";

/**
 * Full-screen intro overlay sharing the hero's ripple grid. The grid
 * idles with soft ripples and beams until the visitor clicks/taps
 * (or presses Enter/Space), which fires a 3D ripple sweep from that
 * point across the whole screen, then dissolves the overlay into the
 * hero. A fallback timer triggers the sweep so nobody is stranded.
 */
export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"idle" | "sweeping" | "done">("idle");
  const startedRef = useRef(false);
  const gridRef = useRef<RippleGridHandle>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const trigger = useCallback((x: number, y: number) => {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("sweeping");
    const grid = gridRef.current;
    if (!grid) {
      setPhase("done");
      onDoneRef.current();
      return;
    }
    grid.sweepFrom(x, y).then(() => {
      setPhase("done");
      onDoneRef.current();
    });
  }, []);

  // Keyboard entry + a generous fallback so the site never stays locked.
  useEffect(() => {
    const center = () =>
      trigger(window.innerWidth / 2, window.innerHeight / 2);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") center();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(center, 7000);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [trigger]);

  // Lock scrolling while the overlay is up.
  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="loader-root"
          exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
          onClick={(e) => trigger(e.clientX, e.clientY)}
        >
          <div className="loader-overlay">
            <RippleGrid ref={gridRef} idleRipples beams />
            <div className="aurora-wash" />
            <AnimatePresence>
              {phase === "idle" && (
                <motion.p
                  className="loader-enter"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.4 } }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  / / tap anywhere to initialize<span className="t-caret" />
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
