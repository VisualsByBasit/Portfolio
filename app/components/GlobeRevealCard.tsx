"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "./ripple-grid/usePrefersReducedMotion";

// three-globe touches `window` at module-evaluation time, which crashes
// Next's SSR pass - deferring it to a client-only dynamic import keeps
// that entirely out of the server render.
const WorldGlobe = dynamic(() => import("./WorldGlobe"), { ssr: false });

/**
 * MacBook-Scroll-style reveal (tilt from an angled rotateX back to flat
 * while scaling up, tied to scroll position) adapted from a laptop lid
 * to this pill: as the card scrolls into view, the globe straightens up
 * and grows rather than a static image being revealed.
 */
export default function GlobeRevealCard() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.4"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [-24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.35, 1]);

  return (
    <div ref={ref} className="globe-wrap">
      <div className="globe-glow" />
      <motion.div
        className="globe-reveal-pill"
        style={
          reducedMotion
            ? undefined
            : { rotateX, scale, opacity, transformOrigin: "bottom center" }
        }
      >
        <WorldGlobe />
      </motion.div>
    </div>
  );
}
