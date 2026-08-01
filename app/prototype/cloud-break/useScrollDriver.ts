"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { STATE } from "./uniforms";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * The one and only scroll source for the prototype. Lenis writes STATE.scroll;
 * the world's altitude is a damped, rate-clamped follow of it in Director.
 * Nothing else listens to scroll.
 */
export function useScrollDriver() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let raf = 0;

    const loop = (t: number) => {
      lenis.raf(t);
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      STATE.scroll = limit > 0 ? Math.min(1, Math.max(0, window.scrollY / limit)) : 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}
