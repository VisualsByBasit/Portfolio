"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide scroll-driven animation pass. Everything here is scrubbed -
 * tied to scroll position and running both directions - rather than
 * one-time entrance fades.
 */
export default function ScrollFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero recedes as you scroll into the page.
      const intro = document.querySelector(".intro");
      if (intro) {
        gsap.to(intro, {
          scale: 0.86,
          opacity: 0.1,
          yPercent: -18,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom 35%",
            scrub: true,
          },
        });
      }

      // Section titles grow + settle as they cross the viewport.
      gsap.utils.toArray<HTMLElement>(".section-title").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0.8, opacity: 0.25, y: 50, rotate: -2 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            rotate: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 95%", end: "top 55%", scrub: true },
          }
        );
      });

      // Section labels stretch their tracking while scrolling through.
      gsap.utils.toArray<HTMLElement>(".section-label").forEach((el) => {
        gsap.fromTo(
          el,
          { letterSpacing: "0px", opacity: 0.2 },
          {
            letterSpacing: "5px",
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 95%", end: "top 55%", scrub: true },
          }
        );
      });

      // About cards drift at alternating speeds (parallax) through the section.
      gsap.utils.toArray<HTMLElement>(".about-card").forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 60 + (i % 3) * 30 },
          {
            y: -20 - (i % 3) * 12,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });

      // Bento / project / testimonial cards scale + tilt continuously.
      gsap.utils.toArray<HTMLElement>(".ws-card, .pin-wrap, .approach-card").forEach((el, i) => {
        gsap.fromTo(
          el,
          { scale: 0.92, opacity: 0.35, rotate: i % 2 === 0 ? -1.5 : 1.5 },
          {
            scale: 1,
            opacity: 1,
            rotate: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 98%", end: "top 55%", scrub: true },
          }
        );
      });

      // Marquees hue-shift slowly with scroll for a living-color feel.
      gsap.utils.toArray<HTMLElement>(".skills-marquee, .testimonial-track").forEach((el) => {
        gsap.fromTo(
          el,
          { filter: "hue-rotate(0deg)" },
          {
            filter: "hue-rotate(40deg)",
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });
    });

    // Recalculate positions once fonts/images settle.
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);

    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return null;
}
