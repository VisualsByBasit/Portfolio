"use client";
import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { AnimatePresence, motion } from "framer-motion";
import Magnetic from "./Magnetic";
import CountrySelect from "./contact/CountrySelect";
import StatCard from "./contact/StatCard";
import ContactCubes from "./contact/ContactCubes";
import { COUNTRIES } from "@/data/countries";

type Status = "idle" | "sending" | "sent" | "error";
type Errors = { firstName?: boolean; email?: boolean; country?: boolean; message?: boolean };

const REQUIREMENTS = ["Web Development", "UI/UX & Graphic Design", "Event Systems", "Something Else"];

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.2.67.8.56A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.93-.26-.1-.46-.15-.65.14-.2.29-.75.93-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.6-2-.17-.29-.02-.44.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.2.05-.36-.02-.5-.07-.15-.65-1.57-.9-2.15-.24-.57-.48-.49-.65-.5h-.56c-.19 0-.5.07-.77.36-.26.29-1.01.99-1.01 2.41s1.04 2.79 1.18 2.98c.15.19 2.04 3.11 4.94 4.36.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.11.55-.08 1.7-.7 1.94-1.37.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.34Z" />
      <path d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.85.5 3.58 1.38 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12.02 22c5.52 0 10-4.48 10-10S17.54 2 12.02 2Zm0 18.13c-1.66 0-3.2-.47-4.5-1.29l-.32-.19-3 .79.8-2.93-.21-.3A8.1 8.1 0 0 1 3.9 12c0-4.48 3.65-8.13 8.12-8.13S20.14 7.52 20.14 12s-3.65 8.13-8.12 8.13Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" strokeLinecap="round" />
      <path d="M15.5 6.2c1.6.2 2.8 1.6 2.8 3.3 0 1.6-1.1 2.9-2.6 3.2M17.5 14c2.4.4 4 2.4 4 5" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

/**
 * Contact form wired to EmailJS. Reads its IDs from NEXT_PUBLIC_ env vars
 * (see .env.local.example) - until those are set, submissions show a
 * friendly "email me directly" fallback instead of failing silently.
 */
export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [countryIso2, setCountryIso2] = useState<string | null>(null);
  const [dialIso2, setDialIso2] = useState<string | null>("PK");
  const [requirements, setRequirements] = useState<string[]>([]);

  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  const toggleRequirement = (opt: string) => {
    setRequirements((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));
  };

  const validate = () => {
    const form = formRef.current;
    if (!form) return false;
    const firstNameEl = form.elements.namedItem("first_name") as HTMLInputElement;
    const emailEl = form.elements.namedItem("reply_to") as HTMLInputElement;
    const messageEl = form.elements.namedItem("message") as HTMLTextAreaElement;
    const next: Errors = {
      firstName: !firstNameEl.value.trim(),
      email: !emailEl.validity.valid,
      country: !countryIso2,
      message: !messageEl.value.trim(),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current || status === "sending") return;
    if (!validate()) return;

    if (!serviceId || !templateId || !publicKey) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await emailjs.sendForm(serviceId, templateId, formRef.current, { publicKey });
      setStatus("sent");
      formRef.current.reset();
      setCountryIso2(null);
      setDialIso2("PK");
      setRequirements([]);
      setErrors({});
    } catch {
      setStatus("error");
    }
  };

  const dial = COUNTRIES.find((c) => c.iso2 === dialIso2)?.dial ?? "";

  return (
    <section id="contact" className="contact-section">
      <span id="letstalk" className="anchor-alias" aria-hidden />

      <div className="contact-hero">
        <p className="section-label contact-label-center">08 · Contact</p>
        <h2 className="section-title contact-headline">
          Let&apos;s <span className="highlight">Talk</span>
        </h2>
        <p className="contact-underline-lead">
          Have a project, an event that needs a system behind it, or just want to say salam - my inbox is open.
        </p>
        <span className="contact-pill">Available for freelance work</span>
      </div>

      <div className="contact-stats-row">
        <StatCard icon={<CalendarIcon />} value={5} suffix="+" label="Events managed" />
        <StatCard icon={<UsersIcon />} value={4800} suffix="+" label="Participants reached" />
        <StatCard icon={<span className="stat-code-icon">{"</>"}</span>} value={3} suffix="+" label="Years shipping code" />
        <div className="stat-card stat-card-status">
          <span className="stat-icon" aria-hidden>
            <BoltIcon />
          </span>
          <p className="stat-status">
            <span className="stat-status-dot" />
            Available
          </p>
          <p className="stat-label">Usually replies within 24h</p>
        </div>
      </div>

      <div className="contact-panels-wrap">
        <div className="contact-bg-heading" aria-hidden>
          LET&apos;S CONNECT
        </div>

        <div className="contact-panels">
        <div className="contact-form-panel">
          <form ref={formRef} className="contact-form" onSubmit={onSubmit} noValidate>
            <div className="contact-form-row">
              <label>
                <span>First name *</span>
                <input
                  name="first_name"
                  type="text"
                  placeholder="First name"
                  className={errors.firstName ? "field-error" : undefined}
                  onChange={() => errors.firstName && setErrors((p) => ({ ...p, firstName: false }))}
                />
                {errors.firstName && <p className="field-error-text">Tell me your name.</p>}
              </label>
              <label>
                <span>Last name</span>
                <input name="last_name" type="text" placeholder="Last name" />
              </label>
            </div>

            <div className="contact-form-row">
              <label>
                <span>Email *</span>
                <input
                  name="reply_to"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className={errors.email ? "field-error" : undefined}
                  onChange={() => errors.email && setErrors((p) => ({ ...p, email: false }))}
                />
                {errors.email && <p className="field-error-text">Enter a valid email address.</p>}
              </label>
              <label>
                <span>Phone</span>
                <div className="phone-field">
                  <CountrySelect mode="compact" value={dialIso2} onChange={setDialIso2} />
                  <input name="phone" type="tel" placeholder="Phone number" />
                </div>
                <input type="hidden" name="phone_dial" value={dial} />
              </label>
            </div>

            <label>
              <span>Country *</span>
              <CountrySelect
                mode="full"
                value={countryIso2}
                onChange={(iso2) => {
                  setCountryIso2(iso2);
                  setErrors((p) => ({ ...p, country: false }));
                }}
                error={errors.country}
                name="country"
              />
              {errors.country && <p className="field-error-text">Choose a country.</p>}
            </label>

            <div className="requirement-field">
              <span>What do you need help with?</span>
              <div className="requirement-chips">
                {REQUIREMENTS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className={requirements.includes(opt) ? "chip chip-active" : "chip"}
                    onClick={() => toggleRequirement(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input type="hidden" name="requirement" value={requirements.join(", ")} />
            </div>

            <label>
              <span>How can I help?</span>
              <textarea
                name="message"
                rows={5}
                placeholder="Feel free to outline your ideas or needs..."
                className={errors.message ? "field-error" : undefined}
                onChange={(e) => errors.message && e.target.value.trim() && setErrors((p) => ({ ...p, message: false }))}
              />
              {errors.message && <p className="field-error-text">Let me know what you need.</p>}
            </label>

            <Magnetic className="contact-send-wrap">
              <button
                type="submit"
                className="contact-send"
                data-cursor-label="Send"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending..." : "Send Message"}
                <span>↗</span>
              </button>
            </Magnetic>

            <AnimatePresence mode="wait">
              {status === "sent" && (
                <motion.p
                  key="sent"
                  className="form-note form-ok"
                  initial={{ opacity: 0, y: 12, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 340, damping: 15 }}
                >
                  <span className="form-note-icon">🎉</span> Message away - I&apos;ll get back to you soon. Check your inbox for a confirmation.
                </motion.p>
              )}
              {status === "error" && (
                <motion.p
                  key="error"
                  className="form-note form-err"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  Couldn&apos;t send right now - email me directly at{" "}
                  <a href="mailto:abdulbasitso019@gmail.com">abdulbasitso019@gmail.com</a>.
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </div>

        <div className="contact-visual-panel">
          <ContactCubes />
        </div>
        </div>
      </div>

      <div className="contact-links-row">
        <a className="contact-link-chip" href="mailto:abdulbasitso019@gmail.com" data-cursor-label="Email">
          <MailIcon />
          abdulbasitso019@gmail.com
        </a>
        <a
          className="contact-link-chip"
          href="https://wa.me/923340666502"
          target="_blank"
          rel="noreferrer"
          data-cursor-label="Chat"
        >
          <WhatsappIcon />
          +92 334 0666502
        </a>
        <a
          className="contact-link-chip"
          href="https://github.com/VisualsByBasit"
          target="_blank"
          rel="noopener noreferrer"
          data-cursor-label="View"
        >
          <GithubIcon />
          GitHub
        </a>
        <a
          className="contact-link-chip"
          href="https://www.linkedin.com/in/abdul-basit-a36b25385/"
          target="_blank"
          rel="noopener noreferrer"
          data-cursor-label="View"
        >
          <LinkedinIcon />
          LinkedIn
        </a>
      </div>

      <footer className="site-footer">
        <p className="footer-copy">
          © 2026 Abdulbasit - built with Next.js, Three.js &amp; too much coffee.
          <span className="footer-mono">{" // cleared for takeoff"}</span>
        </p>
        <div className="footer-socials">
          <a
            href="https://github.com/VisualsByBasit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="footer-icon"
          >
            <GithubIcon />
          </a>
          <a
            href="https://www.linkedin.com/in/abdul-basit-a36b25385/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="footer-icon"
          >
            <LinkedinIcon />
          </a>
          <a
            href="https://wa.me/923340666502"
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="footer-icon"
          >
            <WhatsappIcon />
          </a>
        </div>
      </footer>
    </section>
  );
}
