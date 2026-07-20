"use client";
import { useEffect, useRef } from "react";

type Spark = {
  x: number;
  y: number;
  size: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  color: string;
};

const COLORS = ["#a78bfa", "#22d3ee", "#ffffff", "#c4b5fd"];

/**
 * Canvas of tiny twinkling particles that fade in, drift slightly and
 * fade out. Sized to its parent — position the parent, drop this inside.
 */
export default function Sparkles({ density = 40 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let rafId = 0;
    const sparks: Spark[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const spawn = () => {
      sparks.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.6 + Math.random() * 1.6,
        life: 0,
        maxLife: 50 + Math.random() * 90,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25 - 0.08,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      });
    };

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      if (sparks.length < density && Math.random() < 0.5) spawn();

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        if (s.life >= s.maxLife) {
          sparks.splice(i, 1);
          continue;
        }
        // Triangle envelope: fade in for the first half, out for the second.
        const t = s.life / s.maxLife;
        const alpha = t < 0.5 ? t * 2 : (1 - t) * 2;
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [density]);

  return <canvas ref={canvasRef} className="sparkles-canvas" aria-hidden />;
}
