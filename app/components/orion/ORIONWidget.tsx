"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ORIONCore, { type OrionMode } from "./ORIONCore";
import { getGreeting } from "@/lib/orion-prompt";
import { usePrefersReducedMotion } from "../ripple-grid/usePrefersReducedMotion";

type Role = "user" | "model";
type ChatMsg = { role: Role; text: string; error?: boolean };

const THINKING_PHRASES = [
  "Receiving request...",
  "Analyzing...",
  "Searching knowledge base...",
  "Generating response...",
];

const COMMAND_CHIPS: { label: string; prompt: string }[] = [
  { label: "Show Projects", prompt: "What projects have you shipped?" },
  { label: "Tech Stack", prompt: "What's your tech stack?" },
  { label: "Experience", prompt: "Tell me about your event and leadership experience." },
  { label: "About Me", prompt: "Tell me about yourself." },
  { label: "Contact", prompt: "How can I get in touch with you?" },
];

const MAX_LEN = 500;
const OPEN_SEQUENCE_MS = 950;

function HudReadouts() {
  const [sync, setSync] = useState(96.4);
  const [load, setLoad] = useState(0.31);

  useEffect(() => {
    const id = setInterval(() => {
      setSync((v) => Math.min(99.9, Math.max(92, v + (Math.random() - 0.5) * 1.4)));
      setLoad((v) => Math.min(0.9, Math.max(0.12, v + (Math.random() - 0.5) * 0.08)));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="orion-readouts" aria-hidden>
      <span>SYNC {sync.toFixed(1)}%</span>
      <span>LOAD {load.toFixed(2)}</span>
    </div>
  );
}

export default function ORIONWidget() {
  const reducedMotion = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [panelReady, setPanelReady] = useState(false);
  const [hoveredLauncher, setHoveredLauncher] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thinkIdx, setThinkIdx] = useState(0);
  const [accentTrigger, setAccentTrigger] = useState(0);
  const [greetingText, setGreetingText] = useState("");
  const greetingStarted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greeting = useMemo(() => getGreeting(), []);
  const bump = () => setAccentTrigger((n) => n + 1);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (openTimer.current) clearTimeout(openTimer.current);
  }, []);

  const openPanel = () => {
    if (open) return;
    setOpen(true);
    bump(); // opening flourish
    if (reducedMotion) {
      greetingStarted.current = true;
      setGreetingText(greeting);
      setPanelReady(true);
      return;
    }
    setOpening(true);
    openTimer.current = setTimeout(() => {
      setOpening(false);
      setPanelReady(true);
    }, OPEN_SEQUENCE_MS);
  };

  const closePanel = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    setOpen(false);
    setOpening(false);
    setPanelReady(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the input once the message area has mounted.
  useEffect(() => {
    if (panelReady) inputRef.current?.focus();
  }, [panelReady]);

  // Type out the greeting once the panel has finished materializing
  // (the reduced-motion instant case is set directly in openPanel).
  useEffect(() => {
    if (!panelReady || greetingStarted.current || reducedMotion) return;
    greetingStarted.current = true;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setGreetingText(greeting.slice(0, i));
      if (i >= greeting.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [panelReady, greeting, reducedMotion]);

  // Cycle in-character status phrases while a real request is in flight
  // (the initial reset happens in send(), the event handler that starts it).
  useEffect(() => {
    if (!sending) return;
    const id = setInterval(() => {
      setThinkIdx((i) => (i + 1) % THINKING_PHRASES.length);
    }, 400);
    return () => clearInterval(id);
  }, [sending]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (raw: string) => {
    const trimmed = raw.trim().slice(0, MAX_LEN);
    if (!trimmed || sending) return;

    const history = messages.slice(-20).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);
    setThinkIdx(0);
    if (/orion/i.test(trimmed)) bump();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json().catch(() => null);
      const reply: string =
        data?.reply ?? "Something interrupted that request on my end. Try again in a moment.";
      if (data?.accent || reply.length > 260) bump();
      setMessages((prev) => [...prev, { role: "model", text: reply, error: !res.ok }]);
    } catch {
      bump();
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Something interrupted that request on my end. Try again in a moment.",
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const headerMode: OrionMode = opening ? "opening" : sending ? "thinking" : "idle";
  const launcherMode: OrionMode = hoveredLauncher ? "hover" : "idle";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="orion-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={closePanel}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            className="orion-launcher"
            aria-label="Open ORION, Abdulbasit's AI portfolio guide"
            onMouseEnter={() => setHoveredLauncher(true)}
            onMouseLeave={() => setHoveredLauncher(false)}
            onFocus={() => setHoveredLauncher(true)}
            onBlur={() => setHoveredLauncher(false)}
            onClick={openPanel}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.55, transition: { duration: 0.22 } }}
            whileHover={reducedMotion ? undefined : { scale: 1.05 }}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
          >
            <ORIONCore mode={launcherMode} size={64} accentTrigger={accentTrigger} reducedMotion={reducedMotion} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className={`orion-panel${opening ? " is-opening" : ""}`}
            role="dialog"
            aria-label="ORION assistant"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16, transition: { duration: 0.25 } }}
            transition={{ duration: reducedMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="orion-hud-grid" aria-hidden />
            {opening && <div className="orion-scan-sweep" aria-hidden />}

            <header className="orion-header">
              <div className="orion-header-left">
                <span className="orion-header-orb">
                  <ORIONCore mode={headerMode} size={40} accentTrigger={accentTrigger} reducedMotion={reducedMotion} />
                  <svg className="orion-hud-ring" viewBox="0 0 48 48" aria-hidden>
                    <motion.circle
                      cx="24"
                      cy="24"
                      r="22"
                      fill="none"
                      strokeWidth="1"
                      strokeDasharray="2 3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.8 }}
                      transition={{ duration: reducedMotion ? 0.2 : 0.8, delay: reducedMotion ? 0 : 0.3 }}
                    />
                  </svg>
                </span>
                <div className="orion-id">
                  <span className="orion-name">ORION</span>
                  <span className="orion-online">
                    <i className="orion-online-dot" />
                    ONLINE
                  </span>
                </div>
              </div>
              <HudReadouts />
              <button type="button" className="orion-close" onClick={closePanel} aria-label="Close ORION">
                <span>&times;</span>
              </button>
            </header>

            <div className="orion-divider" aria-hidden />

            {panelReady && (
              <>
                <div className="orion-messages" ref={scrollRef}>
                  <motion.div
                    className="orion-msg orion-msg-model"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {greetingText}
                    {greetingText.length < greeting.length && <span className="orion-caret" />}
                  </motion.div>

                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      className={`orion-msg orion-msg-${m.role}${m.error ? " orion-msg-error" : ""}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {m.text}
                    </motion.div>
                  ))}

                  {sending && (
                    <motion.div
                      className="orion-msg orion-msg-model orion-msg-thinking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {THINKING_PHRASES[thinkIdx]}
                    </motion.div>
                  )}
                </div>

                {messages.length === 0 && greetingText.length === greeting.length && (
                  <div className="orion-chips">
                    {COMMAND_CHIPS.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        className="orion-chip"
                        onClick={() => send(c.prompt)}
                        disabled={sending}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}

                <form className="orion-input-row" onSubmit={onSubmit}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
                    placeholder="Ask ORION about Abdulbasit..."
                    maxLength={MAX_LEN}
                    disabled={sending}
                  />
                  <button type="submit" className="orion-send" disabled={sending || !input.trim()} aria-label="Send">
                    <span>&#8593;</span>
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
