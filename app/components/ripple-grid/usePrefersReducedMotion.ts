"use client";
import { useState } from "react";

/**
 * Distinct from quality tier: a touch device or low core-count also
 * drops to the "low" render tier but should still animate (just
 * cheaper); this flag specifically means the user asked their OS for
 * less motion, so ambient/idle animation is suppressed outright.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return reduced;
}
