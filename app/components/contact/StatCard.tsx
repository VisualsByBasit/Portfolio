"use client";
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

type StatCardProps = {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
};

/**
 * Glass stat tile that counts its number up from 0 once scrolled into
 * view. A spring (rather than a linear tween) gives it the same
 * slightly-overshooting feel as the rest of the site's motion.
 */
export default function StatCard({ icon, value, suffix = "", prefix = "", label, decimals = 0 }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20, mass: 0.9 });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (spanRef.current) spanRef.current.textContent = latest.toFixed(decimals);
      }),
    [spring, decimals],
  );

  return (
    <div ref={ref} className="stat-card">
      <span className="stat-icon" aria-hidden>
        {icon}
      </span>
      <p className="stat-number">
        {prefix}
        <span ref={spanRef}>0</span>
        {suffix}
      </p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
