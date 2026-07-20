"use client";
import { useEffect, useRef } from "react";

const MAGNET_RADIUS = 90;
const MAGNET_PULL = 0.35;
const RING_SIZE = 36; // matches .cursor-ring base width/height
// Elements bigger than this get a label/hover state but no ring lock.
const LOCK_MAX_W = 300;
const LOCK_MAX_H = 150;

/**
 * Glowing dot + trailing ring cursor. Near links/buttons the cursor is
 * pulled toward the element's center (magnetic). Hovering directly over
 * a small link/button locks the ring onto it: the ring expands into a
 * rounded rect wrapping the element, centered on it. Elements carrying
 * data-cursor-label (e.g. "View", "Send") show that text as a small tag
 * trailing the cursor. Only active on fine-pointer devices.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    let mx = -100;
    let my = -100;
    let tx = -100; // magnet-adjusted dot target
    let ty = -100;
    let rx = -100; // ring lerped position
    let ry = -100;
    let rw = RING_SIZE; // ring lerped size
    let rh = RING_SIZE;
    let rafId = 0;
    let currentLabel = "";
    type Target = { el: Element; rect: DOMRect; cx: number; cy: number };
    let targets: Target[] = [];
    let labelTargets: Target[] = [];

    const toTarget = (el: Element): Target => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        rect,
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      };
    };
    const collect = () => {
      targets = Array.from(
        document.querySelectorAll("a, button, .magnetic"),
      ).map(toTarget);
      labelTargets = Array.from(
        document.querySelectorAll("[data-cursor-label]"),
      ).map(toTarget);
    };
    collect();
    // Element positions shift on scroll/resize/layout — refresh cheaply.
    const interval = setInterval(collect, 800);
    window.addEventListener("scroll", collect, { passive: true });

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const inside = (t: Target) =>
      mx >= t.rect.left && mx <= t.rect.right && my >= t.rect.top && my <= t.rect.bottom;

    const loop = () => {
      // Innermost interactive element directly under the pointer.
      let over: Target | null = null;
      for (const t of targets) {
        if (!inside(t)) continue;
        if (!over || t.rect.width * t.rect.height < over.rect.width * over.rect.height)
          over = t;
      }
      const locked =
        over !== null &&
        over.rect.width <= LOCK_MAX_W &&
        over.rect.height <= LOCK_MAX_H;

      // Nearest interactive element within the magnet radius pulls the dot.
      let best: Target | null = null;
      let bestD = MAGNET_RADIUS;
      for (const t of targets) {
        const d = Math.hypot(t.cx - mx, t.cy - my);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
      if (best) {
        const pull = MAGNET_PULL * (1 - bestD / MAGNET_RADIUS);
        tx = mx + (best.cx - mx) * pull;
        ty = my + (best.cy - my) * pull;
      } else {
        tx = mx;
        ty = my;
      }

      // Ring: locked → wrap the hovered element, centered on it;
      // free → trail the dot at its base size.
      const gx = locked ? over!.cx : tx;
      const gy = locked ? over!.cy : ty;
      const gw = locked ? over!.rect.width + 14 : RING_SIZE;
      const gh = locked ? over!.rect.height + 14 : RING_SIZE;
      const hovering = over !== null || best !== null;
      rx += (gx - rx) * (locked ? 0.28 : 0.16);
      ry += (gy - ry) * (locked ? 0.28 : 0.16);
      rw += (gw - rw) * 0.22;
      rh += (gh - rh) * 0.22;

      dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${!locked && hovering ? 1.7 : 1})`;
      ring.style.width = `${rw}px`;
      ring.style.height = `${rh}px`;
      ring.style.borderRadius = locked ? "12px" : "50%";
      ring.style.borderColor = hovering
        ? "rgba(34, 211, 238, 0.9)"
        : "rgba(167, 139, 250, 0.7)";

      // Context label ("View", "Send", …) from the element under the pointer.
      let text = "";
      for (const t of labelTargets) {
        if (inside(t)) {
          text = (t.el as HTMLElement).dataset.cursorLabel || "";
          break;
        }
      }
      if (text !== currentLabel) {
        currentLabel = text;
        if (text) label.textContent = text;
        label.classList.toggle("visible", text !== "");
      }
      label.style.transform = `translate(${tx + 20}px, ${ty + 20}px)`;

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(interval);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", collect);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" style={{ transform: "translate(-100px, -100px)" }} />
      <div ref={ringRef} className="cursor-ring" style={{ transform: "translate(-100px, -100px)" }} />
      <div ref={labelRef} className="cursor-label" style={{ transform: "translate(-100px, -100px)" }} />
    </>
  );
}
