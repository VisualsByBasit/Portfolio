"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "./ripple-grid/usePrefersReducedMotion";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#contact", label: "Contact" },
];

/**
 * Hamburger + dropdown shown only below the breakpoint where the
 * desktop .links row hides (see .navbar .links in globals.css) - the
 * mobile-only replacement for that row plus the "Hire Me" CTA.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Ignore the toggle button itself - it has its own onClick that
    // flips `open`, so without this a tap-to-close would immediately
    // get re-opened by that same handler right after this fires.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (toggleRef.current?.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) close();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={`nav-toggle${open ? " is-open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id="mobile-nav-menu"
            className="nav-mobile-menu"
            role="dialog"
            aria-label="Site navigation"
            initial={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={close}>
                {link.label}
              </a>
            ))}
            <a href="#contact" className="cta nav-mobile-cta" onClick={close}>
              Hire Me
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
