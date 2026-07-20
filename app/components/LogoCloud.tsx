"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TOOLS, ToolLogo } from "./tools";

const SLOT_COUNT = 10;
const SWAP_INTERVAL = 2600;

/**
 * Logo marquee that scrolls right (the tech-stack marquees in WorkingStyle
 * scroll vertically the other way). Both halves of the loop render off the
 * same `slots` state so swaps stay in sync across the seam.
 */
export default function LogoCloud() {
  const [slots, setSlots] = useState(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => i % TOOLS.length),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSlots((prev) => {
        const next = [...prev];
        const pos = Math.floor(Math.random() * SLOT_COUNT);
        let candidate = next[pos];
        while (candidate === next[pos]) {
          candidate = Math.floor(Math.random() * TOOLS.length);
        }
        next[pos] = candidate;
        return next;
      });
    }, SWAP_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const renderChip = (toolIndex: number, key: string) => {
    const tool = TOOLS[toolIndex];
    return (
      <span key={key} className="logo-chip">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={tool.name}
            className="logo-chip-inner"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <ToolLogo tool={tool} size={24} />
            {tool.name}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  };

  return (
    <section id="logos" className="logo-cloud-section">
      <p className="section-label">06 · Powered By</p>
      <h2 className="section-title">
        Tools I <span className="highlight">Reach For</span>
      </h2>

      <div className="logo-marquee">
        <div className="logo-track">
          {slots.map((t, i) => renderChip(t, `a-${i}`))}
          {slots.map((t, i) => renderChip(t, `b-${i}`))}
        </div>
      </div>
    </section>
  );
}
