"use client";
import Magnetic from "./Magnetic";

type Milestone = {
  date: string;
  event: string;
  role: string;
  text: string;
  stat?: string;
};

const JOURNEY: Milestone[] = [
  {
    date: "2024",
    event: "SteamNexus",
    role: "IT & Graphics Team",
    text: "My first event - a commercial-style college social gathering built around mini games and a scavenger hunt. Recognized with a shield for the work put in.",
  },
  {
    date: "Jan 31 - Feb 2, 2025",
    event: "Nobelium",
    role: "Media & IT and Graphics Director",
    text: "Ran logistics and social media in lockstep with the Executive Council, with Bayaan headlining the concert night.",
    stat: "~1,400 attendees",
  },
  {
    date: "Jan 10-11, 2026",
    event: "Pandora",
    role: "Director of IT & Graphics",
    text: "A social gathering built around a DJ set and a Squid Game-themed section - and one that landed major sponsors along the way.",
  },
  {
    date: "Jan 16-18, 2026",
    event: "PMUN26",
    role: "Director of Registrations",
    text: "Built and ran the registration system leading a 15-person team, with Bayaan returning for the concert night alongside a Shaam-e-Mastana bazm.",
    stat: "2,400+ participants",
  },
  {
    date: "Feb 13-15, 2026",
    event: "Nobelium",
    role: "Director of General Management · Executive Council",
    text: "Oversaw sponsors, vendors, IT & Graphics, publications, registrations and media teams, closing with a bazm night featuring DJ Hanzi and DJ Sparkle.",
    stat: "1,000+ attendees",
  },
];

const CURRENT = {
  event: "Dual Internship",
  text: "Alongside events work, a dual internship split between hands-on technical and professional learning and soft-skills development - including helping organize a charity futsal and padel tournament, with proceeds going to charity.",
};

export default function Experience() {
  return (
    <section id="experience" className="experience-section">
      <p className="section-label">02 · The Journey</p>
      <h2 className="section-title">
        Leading at <span className="highlight">Scale</span>
      </h2>

      <div className="timeline">
        {JOURNEY.map((item) => (
          <div key={item.event + item.date} className="timeline-item">
            <span className="timeline-dot" aria-hidden />
            <div className="timeline-card">
              <span className="timeline-date">{item.date}</span>
              <h3>{item.event}</h3>
              <p className="timeline-role">{item.role}</p>
              <p className="timeline-text">{item.text}</p>
              {item.stat && <span className="timeline-stat">{item.stat}</span>}
            </div>
          </div>
        ))}

        <div className="timeline-item timeline-item-current">
          <span className="timeline-dot timeline-dot-current" aria-hidden />
          <div className="timeline-card timeline-card-current">
            <span className="timeline-date">Ongoing</span>
            <h3>{CURRENT.event}</h3>
            <p className="timeline-text">{CURRENT.text}</p>
          </div>
        </div>
      </div>

      <div className="timeline-cta">
        <p>Open to paid internships, freelance work, and part-time or full-time roles.</p>
        <Magnetic>
          <a href="#contact" className="timeline-cta-btn" data-cursor-label="Talk">
            Let&apos;s talk<span>↗</span>
          </a>
        </Magnetic>
      </div>
    </section>
  );
}
