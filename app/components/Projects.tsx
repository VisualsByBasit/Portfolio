"use client";
import Sparkles from "./Sparkles";
import { TOOLS, ToolLogo, Tool } from "./tools";

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

// Placeholder "#" links get swapped for real URLs later.
const PROJECTS: Project[] = [
  {
    title: "Portfolio",
    pin: "you are here",
    description: "Hand-built with Next.js, Three.js, GSAP and Framer Motion - no template.",
    stack: ["Next.js", "React", "TypeScript", "Three.js", "GSAP"],
    links: [{ label: "Check Live Site", href: "#" }],
    accent: "#a78bfa",
  },
  {
    title: "DotRevamp",
    pin: "dotrevamp",
    description: "Studio work revamping dated sites into fast, modern experiences.",
    stack: ["Figma", "Next.js", "React", "Hostinger"],
    links: [{ label: "Check Live Site", href: "#" }],
    accent: "#22d3ee",
  },
  {
    title: "Riyat NGO",
    pin: "riyat.pk",
    description: "NGO site telling their story and driving donations and volunteer sign-ups.",
    stack: ["Figma", "Next.js", "Canva", "Hostinger"],
    links: [
      { label: "Check Live Site", href: "#" },
      { label: "Instagram", href: "#" },
    ],
    accent: "#f472b6",
  },
  {
    title: "PMUN Registration System",
    pin: "pmun events",
    description: "End-to-end registration, committee allocation and check-in for thousands of delegates.",
    stack: ["Next.js", "TypeScript", "Node.js", "Vercel"],
    links: [{ label: "Check Live Site", href: "#" }],
    accent: "#7c3aed",
  },
];

const APPROACH = [
  {
    phase: "Phase 1",
    title: "Plan & Strategize",
    text: "We map goals, audience and scope together. Wireframes, moodboards and a clear brief — before a single line of code.",
    shape: "approach-shape-a",
  },
  {
    phase: "Phase 2",
    title: "Build & Iterate",
    text: "Design and development in tight loops. You see progress early and often; feedback lands in days, not weeks.",
    shape: "approach-shape-b",
  },
  {
    phase: "Phase 3",
    title: "Launch & Polish",
    text: "Performance passes, responsive QA, deployment and handover. Then I stick around to make sure it flies.",
    shape: "approach-shape-c",
  },
];

function PinCard({ project }: { project: Project }) {
  return (
    <div className="pin-wrap" data-cursor-label="View">
      {/* Floating pin: pill + beam + rings, revealed on hover */}
      <div className="pin-float" style={{ ["--accent" as string]: project.accent }}>
        <a className="pin-pill" href={project.links[0].href} target="_blank" rel="noreferrer">
          {project.pin}
        </a>
        <span className="pin-beam" />
        <span className="pin-rings">
          <i /><i /><i />
        </span>
        <span className="pin-dot" />
      </div>

      <div className="pin-card" style={{ ["--accent" as string]: project.accent }}>
        {/* canvas-reveal style sweep: dotted matrix wiped in on hover */}
        <div className="pin-reveal" aria-hidden />
        {/* Mock-browser screenshot placeholder in the project accent */}
        <div className="proj-shot" aria-hidden>
          <div className="shot-bar">
            <span /><span /><span />
            <i className="shot-url">{project.pin}</i>
          </div>
          <div className="shot-body">
            <span className="shot-orb" />
            <span className="shot-title">{project.title}</span>
            <span className="shot-lines">
              <i /><i />
            </span>
          </div>
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
            {project.links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="projects-section">
      <p className="section-label">03 · Selected Work</p>
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
          <div key={a.phase} className="approach-card">
            <div className="approach-inner">
              <div className="approach-front">
                <div className={`approach-shapes ${a.shape}`} aria-hidden>
                  <i /><i /><i /><i /><i /><i />
                </div>
                <span className="approach-phase">{a.phase}</span>
              </div>
              <div className="approach-back">
                <h4>{a.title}</h4>
                <p>{a.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
