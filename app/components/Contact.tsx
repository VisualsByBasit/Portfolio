"use client";
import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import Magnetic from "./Magnetic";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Contact form wired to EmailJS. Reads its IDs from NEXT_PUBLIC_ env vars
 * (see .env.local.example) — until those are set, submissions show a
 * friendly "email me directly" fallback instead of failing silently.
 */
export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current || status === "sending") return;

    if (!serviceId || !templateId || !publicKey) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await emailjs.sendForm(serviceId, templateId, formRef.current, { publicKey });
      setStatus("sent");
      formRef.current.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="contact-section">
      <span id="letstalk" className="anchor-alias" aria-hidden />
      <p className="section-label">06 · Contact</p>
      <h2 className="section-title">
        Let&apos;s <span className="highlight">Talk</span>
      </h2>

      <div className="contact-grid">
        <div className="contact-info">
          <p className="contact-lead">
            Have a project, an event that needs a system behind it, or just want to say salam? My inbox is open.
          </p>
          <div className="contact-rows">
            <div className="contact-row">
              <span className="contact-key">email</span>
              <a href="mailto:abdulbasitso019@gmail.com">abdulbasitso019@gmail.com</a>
            </div>
            <div className="contact-row">
              <span className="contact-key">location</span>
              <span>Islamabad, Pakistan — available remote &amp; local</span>
            </div>
            <div className="contact-row">
              <span className="contact-key">socials</span>
              <span className="contact-socials">
                <a href="#" target="_blank" rel="noreferrer">GitHub ↗</a>
                <a href="#" target="_blank" rel="noreferrer">LinkedIn ↗</a>
              </span>
            </div>
          </div>
        </div>

        <form ref={formRef} className="contact-form" onSubmit={onSubmit}>
          <label>
            <span>Name</span>
            <input name="from_name" type="text" placeholder="Your name" required />
          </label>
          <label>
            <span>Email</span>
            <input name="reply_to" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Message</span>
            <textarea name="message" rows={5} placeholder="Tell me about your project..." required />
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

          {status === "sent" && (
            <p className="form-note form-ok">Message away — I&apos;ll get back to you soon. Check your inbox for a confirmation.</p>
          )}
          {status === "error" && (
            <p className="form-note form-err">
              Couldn&apos;t send right now — email me directly at{" "}
              <a href="mailto:abdulbasitso019@gmail.com">abdulbasitso019@gmail.com</a>.
            </p>
          )}
        </form>
      </div>

      <footer className="site-footer">
        <p>
          © 2026 Abdulbasit — built with Next.js, Three.js &amp; too much coffee.
          <span className="footer-mono">{" // cleared for takeoff"}</span>
        </p>
      </footer>
    </section>
  );
}
