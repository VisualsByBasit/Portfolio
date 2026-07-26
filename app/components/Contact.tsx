"use client";
import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { AnimatePresence, motion } from "framer-motion";
import Magnetic from "./Magnetic";

type Status = "idle" | "sending" | "sent" | "error";

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

/**
 * Contact form wired to EmailJS. Reads its IDs from NEXT_PUBLIC_ env vars
 * (see .env.local.example) - until those are set, submissions show a
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

      <div className="contact-hero">
        <p className="section-label contact-label-center">08 · Contact</p>
        <h2 className="section-title contact-headline">
          Let&apos;s <span className="highlight">Talk</span>
        </h2>
        <p className="contact-underline-lead">
          Have a project, an event that needs a system behind it, or just want to say salam - my inbox is open.
        </p>
      </div>

      <div className="contact-grid">
        <div className="contact-info">
          <span className="contact-pill">Available for freelance work</span>
          <div className="contact-rows">
            <div className="contact-row">
              <span className="contact-key">email</span>
              <a href="mailto:abdulbasitso019@gmail.com">abdulbasitso019@gmail.com</a>
            </div>
            <div className="contact-row">
              <span className="contact-key">location</span>
              <span>Islamabad, Pakistan - available remote &amp; local</span>
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

      <footer className="site-footer">
        <p className="footer-copy">
          © 2026 Abdulbasit - built with Next.js, Three.js &amp; too much coffee.
          <span className="footer-mono">{" // cleared for takeoff"}</span>
        </p>
        <div className="footer-socials">
          <a href="#" target="_blank" rel="noreferrer" aria-label="GitHub" className="footer-icon">
            <GithubIcon />
          </a>
          <a href="#" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="footer-icon">
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
