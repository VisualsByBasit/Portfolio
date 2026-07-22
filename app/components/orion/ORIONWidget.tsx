"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ORIONCore, { type OrionMode } from "./ORIONCore";
import { getGreeting } from "@/lib/orion-prompt";
import { renderMarkdown } from "@/lib/render-markdown";
import { usePrefersReducedMotion } from "../ripple-grid/usePrefersReducedMotion";

type Role = "user" | "model";
type ChatMsg = { role: Role; text: string; error?: boolean; time: number };

const STATUS_STEPS = [
  "Receiving request...",
  "Analyzing query...",
  "Searching knowledge base...",
  "Generating response...",
  "Complete.",
];

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const COMMAND_CHIPS: { label: string; prompt: string }[] = [
  { label: "Show Projects", prompt: "What projects have you shipped?" },
  { label: "Tech Stack", prompt: "What's your tech stack?" },
  { label: "Experience", prompt: "Tell me about your event and leadership experience." },
  { label: "About Me", prompt: "Tell me about yourself." },
  { label: "Contact", prompt: "How can I get in touch with you?" },
];

const MAX_LEN = 500;
const OPEN_SEQUENCE_MS = 950;
const WAVEFORM_DELAYS = [0, 0.18, 0.36, 0.09, 0.27, 0.45, 0.14, 0.32];

function OrionStatusColumn({ status, responseLabel }: { status: string; responseLabel: string }) {
  const [sync, setSync] = useState(96.4);
  const [memory, setMemory] = useState(74);

  useEffect(() => {
    const id = setInterval(() => {
      setSync((v) => Math.min(99.9, Math.max(92, v + (Math.random() - 0.5) * 1.4)));
      setMemory((v) => Math.min(98, Math.max(60, v + (Math.random() - 0.5) * 6)));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="orion-hero-status" aria-hidden>
      <div className="orion-stat">
        <span className="orion-stat-label">STATUS</span>
        <span className={`orion-stat-value${status === "ERROR" ? " is-error" : ""}`}>{status}</span>
      </div>
      <div className="orion-stat">
        <span className="orion-stat-label">RESPONSE</span>
        <span className="orion-stat-value">{responseLabel}</span>
      </div>
      <div className="orion-stat">
        <span className="orion-stat-label">MEMORY</span>
        <span className="orion-stat-value">{Math.round(memory)}%</span>
      </div>
      <div className="orion-stat">
        <span className="orion-stat-label">SYNC</span>
        <span className="orion-stat-value">{sync.toFixed(1)}%</span>
      </div>
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
  const [sendStage, setSendStage] = useState<"listening" | "checklist">("listening");
  const [thinkIdx, setThinkIdx] = useState(0);
  const [accentTrigger, setAccentTrigger] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [greetingText, setGreetingText] = useState("");
  const [greetingTime, setGreetingTime] = useState<number | null>(null);
  const greetingStarted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [greeting] = useState(() => (typeof window === "undefined" ? "" : getGreeting()));
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
      setGreetingTime(Date.now());
      setPanelReady(true);
      return;
    }
    setOpening(true);
    openTimer.current = setTimeout(() => {
      setOpening(false);
      setPanelReady(true);
      setGreetingTime(Date.now());
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

  // No backdrop anymore (the page behind ORION stays fully visible), so
  // clicking outside the panel to close it needs its own listener.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
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

  // Stage the wait visual while a real request is in flight: a brief
  // "listening" waveform first, then a staged checklist that advances on
  // its own timer but never blocks the real reply - the moment send()
  // gets a response it jumps thinkIdx to the final step and this effect's
  // cleanup (fired by `sending` flipping false) cancels both timers, so a
  // fast response never gets dragged through every stage.
  useEffect(() => {
    if (!sending) return;
    const toChecklist = setTimeout(() => setSendStage("checklist"), 550);
    const advance = setInterval(() => {
      setThinkIdx((i) => Math.min(i + 1, STATUS_STEPS.length - 2));
    }, 420);
    return () => {
      clearTimeout(toChecklist);
      clearInterval(advance);
    };
  }, [sending]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (raw: string) => {
    const trimmed = raw.trim().slice(0, MAX_LEN);
    if (!trimmed || sending) return;

    const history = messages.slice(-20).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: trimmed, time: Date.now() }]);
    setInput("");
    setSending(true);
    setSendStage("listening");
    setThinkIdx(0);
    if (/orion/i.test(trimmed)) bump();

    // performance.now() here measures a real request's round-trip inside an
    // event handler, never during render, so it isn't the render-purity
    // hazard the rule's static check assumes (same rationale as the
    // Math.random() disables in ORIONCore.tsx).
    /* eslint-disable react-hooks/purity */
    const start = performance.now();
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
      setLastLatencyMs(performance.now() - start);
      setThinkIdx(STATUS_STEPS.length - 1);
      setMessages((prev) => [...prev, { role: "model", text: reply, error: !res.ok, time: Date.now() }]);
      setHasError(!res.ok);
    } catch {
      bump();
      setLastLatencyMs(performance.now() - start);
      setThinkIdx(STATUS_STEPS.length - 1);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Something interrupted that request on my end. Try again in a moment.",
          error: true,
          time: Date.now(),
        },
      ]);
      setHasError(true);
    } finally {
      setSending(false);
    }
    /* eslint-enable react-hooks/purity */
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const headerMode: OrionMode = opening ? "opening" : sending ? "thinking" : hasError ? "error" : "idle";
  const launcherMode: OrionMode = hoveredLauncher ? "hover" : hasError ? "error" : "idle";
  const statusLabel = sending ? "PROCESSING" : hasError ? "ERROR" : "ONLINE";
  const responseLabel = lastLatencyMs == null ? "—" : `${(lastLatencyMs / 1000).toFixed(2)}s`;

  return (
    <>
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
            <ORIONCore mode={launcherMode} size={96} accentTrigger={accentTrigger} reducedMotion={reducedMotion} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            className={`orion-panel${opening ? " is-opening" : ""}`}
            role="dialog"
            aria-label="ORION assistant"
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16, transition: { duration: 0.25 } }}
            transition={{ duration: reducedMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="orion-hud-grid" aria-hidden />
            {opening && <div className="orion-scan-sweep" aria-hidden />}
            <div className="orion-frame" aria-hidden>
              <span className="orion-frame-corner orion-frame-corner-tl" />
              <span className="orion-frame-corner orion-frame-corner-br" />
              <span className="orion-frame-tick orion-frame-tick-left-a" />
              <span className="orion-frame-tick orion-frame-tick-left-b" />
              <span className="orion-frame-tick orion-frame-tick-right-a" />
              <span className="orion-frame-tick orion-frame-tick-right-b" />
            </div>

            <header className="orion-header">
              <div className="orion-header-left">
                <div className="orion-id">
                  <span className="orion-name">ORION</span>
                  <span className="orion-tag">AI ASSISTANT</span>
                </div>
              </div>
              <div className="orion-header-right">
                <span className="orion-online">
                  <i className="orion-online-dot" />
                  ONLINE
                </span>
                <button type="button" className="orion-close" onClick={closePanel} aria-label="Close ORION">
                  <span>&times;</span>
                </button>
              </div>
            </header>

            <div className="orion-hero">
              <div className="orion-hero-orb-wrap">
                <div className="orion-hero-orb">
                  <ORIONCore mode={headerMode} size={132} accentTrigger={accentTrigger} reducedMotion={reducedMotion} />
                  <svg className="orion-hud-ring orion-hud-ring-hero" viewBox="0 0 144 144" aria-hidden>
                    <motion.circle
                      cx="72"
                      cy="72"
                      r="68"
                      fill="none"
                      strokeWidth="1.5"
                      strokeDasharray="4 6"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.8 }}
                      transition={{ duration: reducedMotion ? 0.2 : 0.8, delay: reducedMotion ? 0 : 0.3 }}
                    />
                  </svg>
                </div>
                <span className="orion-hero-caption">ORION CORE</span>
              </div>
              <OrionStatusColumn status={statusLabel} responseLabel={responseLabel} />
            </div>

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
                    {greetingText.length === greeting.length && greetingTime && (
                      <span className="orion-msg-time">{formatTime(greetingTime)}</span>
                    )}
                  </motion.div>

                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      className={`orion-msg orion-msg-${m.role}${m.error ? " orion-msg-error" : ""}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {m.role === "model" ? renderMarkdown(m.text) : m.text}
                      <span className="orion-msg-time">{formatTime(m.time)}</span>
                    </motion.div>
                  ))}

                  {sending && sendStage === "listening" && (
                    <motion.div
                      className="orion-waveform"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="orion-waveform-bars" aria-hidden>
                        {WAVEFORM_DELAYS.map((delay, i) => (
                          <span key={i} style={{ animationDelay: `${delay}s` }} />
                        ))}
                      </div>
                      <span className="orion-waveform-label">LISTENING...</span>
                    </motion.div>
                  )}

                  {sending && sendStage === "checklist" && (
                    <motion.div
                      className="orion-status-checklist"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {STATUS_STEPS.map((step, i) => (
                        <div
                          key={step}
                          className={`orion-status-step${
                            i < thinkIdx ? " is-done" : i === thinkIdx ? " is-active" : ""
                          }`}
                        >
                          <i className="orion-status-dot" aria-hidden />
                          <span>{step}</span>
                        </div>
                      ))}
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
                    placeholder="Ask ORION anything..."
                    maxLength={MAX_LEN}
                    disabled={sending}
                  />
                  <button type="submit" className="orion-send" disabled={sending || !input.trim()} aria-label="Send">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M21 3L3 10.5L10.5 13.5L13.5 21L21 3Z"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21 3L10.5 13.5"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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

