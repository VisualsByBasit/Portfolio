"use client";

/**
 * Spread-out horizontal row of three large quote cards (per
 * reference/testimonials.png): quote text on top, avatar placeholder +
 * name/role pinned to the bottom.
 */
const TESTIMONIALS = [
  {
    quote:
      "Abdulbasit is one of the most dependable people I've worked with. As Director IT & Graphics at Nobelium, he took complete ownership of our entire digital presence, from design to execution. His work ethic and output quality are genuinely top-notch.",
    name: "Haris Rabbani",
    role: "Nobelium Executive Council",
    initials: "HR",
    tone: "av-purple",
  },
  {
    quote:
      "Working with Abdulbasit at Riyat has been a pleasure. He handles our IT and design needs professionally, brings creative ideas to the table, and always delivers. The registration system he built has genuinely made our operations smoother.",
    name: "Ayla Adil",
    role: "riyat.pk · Co-founder",
    initials: "AA",
    tone: "av-pink",
  },
  {
    quote:
      "Abdulbasit doesn't just deliver. He over-delivers. His systems, attention to detail, and calm under pressure are exactly what you want in someone you're trusting with hundreds or thousands of participants. PMUN26 ran because of the work he put in.",
    name: "Rayan Saeed",
    role: "PMUN26 · Secretary General",
    initials: "RS",
    tone: "av-cyan",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="testimonials-section">
      <p className="section-label">05 · Kind Words</p>
      <h2 className="section-title">
        What People <span className="highlight">Say</span>
      </h2>

      <div className="testimonial-row">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="testimonial-card">
            <blockquote>
              <span className="testimonial-mark">&ldquo;</span>
              {t.quote}
            </blockquote>
            <figcaption>
              <span className={`testimonial-avatar ${t.tone}`} aria-hidden>
                {t.initials}
              </span>
              <span className="testimonial-person">
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
