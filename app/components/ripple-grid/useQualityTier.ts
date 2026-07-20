"use client";
import { useState } from "react";

export type QualityTier = "high" | "low";

function detectTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowCores = (navigator.hardwareConcurrency || 8) <= 4;
  const narrow = window.innerWidth < 768;
  return coarse || reduced || lowCores || narrow ? "low" : "high";
}

/**
 * Device capability tier, decided once on mount. Deliberately not
 * resize-reactive: a mid-session tier flip would restart the material/
 * composer setup and is not worth chasing window resizes for.
 */
export function useQualityTier(): QualityTier {
  const [tier] = useState<QualityTier>(detectTier);
  return tier;
}
