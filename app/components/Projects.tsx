"use client";
import { IconClipboardList, IconCode, IconRocket } from "@tabler/icons-react";
import Sparkles from "./Sparkles";
import { TOOLS, ToolLogo, Tool } from "./tools";
import ORIONCore from "./orion/ORIONCore";
import { usePrefersReducedMotion } from "./ripple-grid/usePrefersReducedMotion";

type Project = {
  title: string;
  pin: string; // pill text shown on the floating pin
  description: string;
  stack: string[]; // names resolved against TOOLS
  links: { label: string; href: string }[];
  accent: string;
};

const TOOL_BY_NAME: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.name, t]),
);

// Sentinel href: ORION lives on this same page, so its card opens the
// real widget instead of linking out (see the click handler in PinCard).
const OPEN_ORION_HREF = "#open-orion";

const PROJECTS: Project[] = [
  {
    title: "Portfolio",
    pin: "you are here",
    description: "Hand-built with Next.js, Three.js, GSAP and Framer Motion - no template.",
    stack: ["Next.js", "React", "TypeScript", "Three.js", "GSAP"],
    links: [],
    accent: "#a78bfa",
  },
  {
    title: "DotRevamp",
    pin: "dotrevamp",
    description: "Studio work revamping dated sites into fast, modern experiences.",
    stack: ["Figma", "Next.js", "React", "Hostinger"],
    links: [{ label: "Check Live Site", href: "https://dotrevamp.netlify.app/" }],
    accent: "#22d3ee",
  },
  {
    title: "Riyat NGO",
    pin: "riyat.pk",
    description: "NGO site telling their story and driving donations and volunteer sign-ups.",
    stack: ["Figma", "Next.js", "Canva", "Hostinger"],
    links: [
      { label: "Check Live Site", href: "https://riyatpk.netlify.app/" },
      { label: "Instagram", href: "https://www.instagram.com/riyat.pk/" },
    ],
    accent: "#f472b6",
  },
  {
    title: "PMUN26",
    pin: "pmun events",
    description:
      "Director of Registrations for PMUN26 - built the registration system handling 2,400+ participants end-to-end, from committee allocation to check-in.",
    stack: ["Next.js", "TypeScript", "Node.js", "Vercel"],
    links: [{ label: "Instagram", href: "https://www.instagram.com/pmun.26/" }],
    accent: "#7c3aed",
  },
  {
    title: "ORION",
    pin: "orion ai",
    description:
      "A Gemini-powered AI guide built into this very portfolio - Next.js API routes behind the chat, a holographic core rendered with React Three Fiber, and Framer Motion driving the whole panel.",
    stack: ["Next.js", "React", "TypeScript", "Three.js"],
    links: [{ label: "Try ORION", href: OPEN_ORION_HREF }],
    accent: "#22d3ee",
  },
];

const APPROACH = [
  {
    phase: "Phase 1",
    title: "Plan & Strategize",
    text: "We map goals, audience and scope together. Wireframes, moodboards and a clear brief - before a single line of code.",
    icon: IconClipboardList,
    gradient: "approach-grad-a",
  },
  {
    phase: "Phase 2",
    title: "Build & Iterate",
    text: "Design and development in tight loops. You see progress early and often; feedback lands in days, not weeks.",
    icon: IconCode,
    gradient: "approach-grad-b",
  },
  {
    phase: "Phase 3",
    title: "Launch & Polish",
    text: "Performance passes, responsive QA, deployment and handover. Then I stick around to make sure it flies.",
    icon: IconRocket,
    gradient: "approach-grad-c",
  },
];

// ORION lives on this page - its links open the real widget (via a
// window event ORIONWidget listens for) instead of navigating away.
function handleProjectLinkClick(e: React.MouseEvent, href: string) {
  if (href !== OPEN_ORION_HREF) return;
  e.preventDefault();
  window.dispatchEvent(new Event("orion:open"));
}

function PinCard({ project }: { project: Project }) {
  const reducedMotion = usePrefersReducedMotion();
  const isOrion = project.title === "ORION";

  const hasLinks = project.links.length > 0;

  return (
    <div className="pin-wrap" data-cursor-label={hasLinks ? "View" : undefined}>
      {/* Floating pin: pill + beam + rings, revealed on hover */}
      <div className="pin-float" style={{ ["--accent" as string]: project.accent }}>
        {hasLinks ? (
          <a
            className="pin-pill"
            href={project.links[0].href}
            target={isOrion ? undefined : "_blank"}
            rel={isOrion ? undefined : "noopener noreferrer"}
            onClick={(e) => handleProjectLinkClick(e, project.links[0].href)}
          >
            {project.pin}
          </a>
        ) : (
          <span className="pin-pill pin-pill-static">{project.pin}</span>
        )}
        <span className="pin-beam" />
        <span className="pin-rings">
          <i /><i /><i />
        </span>
        <span className="pin-dot" />
      </div>

      <div className="pin-card" style={{ ["--accent" as string]: project.accent }}>
        {/* canvas-reveal style sweep: dotted matrix wiped in on hover */}
        <div className="pin-reveal" aria-hidden />
        {/* Mock-browser screenshot placeholder in the project accent -
            ORION gets a live preview of its own real holographic core
            instead of the generic orb, since that component is right
            here to reuse. */}
        <div className="proj-shot" aria-hidden>
          <div className="shot-bar">
            <span /><span /><span />
            <i className="shot-url">{project.pin}</i>
          </div>
          {isOrion ? (
            <div className="shot-body shot-body-orion">
              <ORIONCore mode="idle" size={84} reducedMotion={reducedMotion} />
              <span className="shot-title">{project.title}</span>
            </div>
          ) : (
            <div className="shot-body">
              <span className="shot-orb" />
              <span className="shot-title">{project.title}</span>
              <span className="shot-lines">
                <i /><i />
              </span>
            </div>
          )}
        </div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="proj-footer">
          <div className="proj-icons">
            {project.stack.map(
              (name) =>
                TOOL_BY_NAME[name] && (
                  <span key={name} className="proj-icon" title={name}>
                    <ToolLogo tool={TOOL_BY_NAME[name]} size={15} />
                  </span>
                ),
            )}
          </div>
          <div className="pin-links">
            {hasLinks ? (
              project.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={isOrion ? undefined : "_blank"}
                  rel={isOrion ? undefined : "noopener noreferrer"}
                  onClick={(e) => handleProjectLinkClick(e, l.href)}
                >
                  {l.label} ↗
                </a>
              ))
            ) : (
              <span className="pin-link-static">You&apos;re on it</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="projects-section">
      <p className="section-label">04 · Selected Work</p>
      <div className="projects-heading">
        <Sparkles density={26} />
        <h2 className="section-title">
          Things I&apos;ve <span className="highlight">Shipped</span>
        </h2>
      </div>

      <div className="projects-grid">
        {PROJECTS.map((p) => (
          <PinCard key={p.title} project={p} />
        ))}
      </div>

      <h3 className="approach-title">
        My <span className="highlight">Approach</span>
      </h3>
      <p className="approach-sub">Hover a phase to flip it open.</p>
      <div className="approach-grid">
        {APPROACH.map((a) => (
          <div key={a.phase} className="approach-card-wrap">
            <div className="approach-card">
              <div className="approach-face approach-face-front">
                <span className="approach-icon">
                  <a.icon size={30} stroke={1.5} />
                </span>
                <span className="approach-phase-pill">{a.phase}</span>
              </div>
              <div className="approach-face approach-face-back">
                <span className={`approach-gradient-fill ${a.gradient}`} aria-hidden />
                <span className="approach-particle approach-particle-a" aria-hidden />
                <span className="approach-particle approach-particle-b" aria-hidden />
                <span className="approach-phase-pill approach-phase-pill-back">{a.phase}</span>
                <h4 className="approach-card-title">{a.title}</h4>
                <p className="approach-card-text">{a.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
