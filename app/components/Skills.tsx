"use client";
import Magnetic from "./Magnetic";

/**
 * Four broad capability cards in the illustrated format of
 * reference/approach-experience.png: colorful gradient visual on the
 * left, bold title + subtext on the right. Cards are magnetic (drift
 * toward the cursor, spring back on leave).
 */
const CATEGORIES = [
  {
    title: "Coding & Development",
    text: "Full-stack web building with JavaScript, Next.js and React - pushed to the max.",
    art: "skill-art-code",
  },
  {
    title: "Graphic & UI/UX Design",
    text: "Visual design, branding and interfaces that feel effortless to use.",
    art: "skill-art-design",
  },
  {
    title: "Leadership & Team Management",
    text: "Directing teams and running large-scale events from front of house to backstage.",
    art: "skill-art-lead",
  },
  {
    title: "Event Systems Architecture",
    text: "Registration platforms and operational systems - PMUN26 (2,400+ participants), Nobelium (1,400+ participants).",
    art: "skill-art-systems",
  },
];

export default function Skills() {
  return (
    <section id="skills" className="skills-section">
      <p className="section-label">04 · Skills &amp; Tools</p>
      <h2 className="section-title">
        What I <span className="highlight">Work With</span>
      </h2>

      <div className="skills-grid">
        {CATEGORIES.map((c) => (
          <Magnetic key={c.title} className="skill-card-wrap" strength={0.16}>
            <div className="skill-card">
              <div className={`skill-art ${c.art}`} aria-hidden>
                {c.art === "skill-art-code" && <span>&lt;/&gt;</span>}
                <i /><i /><i />
              </div>
              <div className="skill-text">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            </div>
          </Magnetic>
        ))}
      </div>
    </section>
  );
}
