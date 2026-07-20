"use client";
import { useEffect, useState } from "react";
import Globe from "./Globe";
import { TOOLS } from "./tools";
import { DottedGlowBackground } from "./ui/DottedGlowBackground";

/* ------------------------- Terminal card ------------------------- */

type TermLine = { kind: "cmd" | "out"; text: string; className?: string };

const SCRIPT: TermLine[] = [
  { kind: "cmd", text: "whoami" },
  { kind: "out", text: "abdulbasit — dev · designer · aviator-in-training" },
  { kind: "cmd", text: "npm run build" },
  { kind: "out", text: "▲ Next.js 16 (Turbopack)", className: "t-dim" },
  { kind: "out", text: "✓ Compiled successfully", className: "t-ok" },
  { kind: "out", text: "✓ 0 errors · 0 warnings", className: "t-ok" },
  { kind: "cmd", text: "deploy --prod" },
  { kind: "out", text: "● live — shipping since age 16", className: "t-accent" },
];

function Terminal() {
  const [lines, setLines] = useState<TermLine[]>([]);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let li = 0;
    let ci = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (cancelled) return;
      if (li >= SCRIPT.length) {
        // Hold the finished screen, then wipe and loop.
        timer = setTimeout(() => {
          setLines([]);
          setTyped("");
          li = 0;
          ci = 0;
          timer = setTimeout(step, 500);
        }, 3500);
        return;
      }
      const line = SCRIPT[li];
      if (line.kind === "cmd") {
        if (ci < line.text.length) {
          ci++;
          setTyped(line.text.slice(0, ci));
          timer = setTimeout(step, 55 + Math.random() * 60);
        } else {
          setLines((prev) => [...prev, line]);
          setTyped("");
          li++;
          ci = 0;
          timer = setTimeout(step, 250);
        }
      } else {
        setLines((prev) => [...prev, line]);
        li++;
        timer = setTimeout(step, 320);
      }
    };
    timer = setTimeout(step, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const nextIsCmd = SCRIPT[lines.length]?.kind === "cmd" || lines.length >= SCRIPT.length;

  return (
    <div className="terminal">
      <div className="terminal-bar">
        <span className="term-dot td-red" />
        <span className="term-dot td-yellow" />
        <span className="term-dot td-green" />
        <span className="terminal-title">abdulbasit@islamabad: ~/portfolio</span>
      </div>
      <div className="terminal-body">
        {lines.map((l, i) =>
          l.kind === "cmd" ? (
            <p key={i} className="t-line">
              <span className="t-prompt">❯</span> {l.text}
            </p>
          ) : (
            <p key={i} className={`t-line t-out ${l.className ?? ""}`}>
              {l.text}
            </p>
          )
        )}
        {nextIsCmd && (
          <p className="t-line">
            <span className="t-prompt">❯</span> {typed}
            <span className="t-caret" />
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------ Stack columns card ---------------------- */

function StackColumns() {
  const names = TOOLS.map((t) => t.name);
  const colA = names.filter((_, i) => i % 2 === 0);
  const colB = names.filter((_, i) => i % 2 === 1);
  return (
    <div className="stack-cols">
      <div className="stack-col">
        <div className="stack-track stack-up">
          {[...colA, ...colA].map((name, i) => (
            <span key={i} className="stack-chip">
              {name}
            </span>
          ))}
        </div>
      </div>
      <div className="stack-col">
        <div className="stack-track stack-down">
          {[...colB, ...colB].map((name, i) => (
            <span key={i} className="stack-chip">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------- Flat dotted world map --------------------- */

// Stylized world map on a 48×20 dot grid ('#' = land). Deliberately
// coarse — it reads as continents at a glance, like reference/bento.png.
const MAP_ROWS = [
  "...###..######...###.....##..##############....",
  "..#############..###...######################..",
  "..############...##...#######################..",
  "...##########.........######################...",
  "....########..........#####..######..#####.....",
  ".....######...........####...#####...####......",
  "......#####...........#####.######...####......",
  ".......####...........#######..####..###.......",
  "........###...........########..###..##........",
  ".........##...........########...#...##....#...",
  ".........####..........#######......###..##....",
  "........#####..........######........#..###....",
  "........#####...........####............####...",
  ".........###............####...........#####...",
  ".........###.............##............#####.#.",
  ".........##..............#.............###...#.",
  "........##.....................................",
  "........#......................................",
  ".........#.....................................",
  "..........#....................................",
];

// Islamabad ≈ 33.7N, 73.1E → grid cell on the 48×20 map.
const HOME = { row: 6, col: 34 };

const TZ_CHIPS = [
  { label: "USA", left: "10%", top: "34%" },
  { label: "UK", left: "38%", top: "30%" },
  { label: "Germany", left: "48%", top: "52%" },
  { label: "Ukraine", left: "60%", top: "28%" },
  { label: "Pakistan", left: "68%", top: "58%", home: true },
];

function DottedMap() {
  return (
    <div className="tz-map">
      <svg viewBox="0 0 480 200" preserveAspectRatio="xMidYMid meet" aria-hidden>
        {MAP_ROWS.flatMap((row, r) =>
          row
            .padEnd(48, ".")
            .slice(0, 48)
            .split("")
            .map((ch, c) =>
              ch === "#" ? (
                <circle
                  key={`${r}-${c}`}
                  cx={c * 10 + 5}
                  cy={r * 10 + 5}
                  r={2.1}
                  fill={
                    r === HOME.row && c === HOME.col
                      ? "#22d3ee"
                      : "rgba(167, 139, 250, 0.32)"
                  }
                />
              ) : null,
            ),
        )}
        {/* Home ping ring */}
        <circle
          cx={HOME.col * 10 + 5}
          cy={HOME.row * 10 + 5}
          r={6}
          fill="none"
          stroke="rgba(34, 211, 238, 0.6)"
          strokeWidth="1.2"
          className="tz-ping"
        />
      </svg>
      {TZ_CHIPS.map((chip) => (
        <span
          key={chip.label}
          className={`tz-chip${chip.home ? " tz-chip-home" : ""}`}
          style={{ left: chip.left, top: chip.top }}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

/* ------------------------ Copy-email CTA card --------------------- */

const EMAIL = "abdulbasitso019@gmail.com";

function CopyEmail() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked — fall back to the mail client.
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <button className="ws-copy-btn" onClick={copy} data-cursor-label="Copy">
      <span className="ws-copy-icon" aria-hidden>
        {copied ? "✓" : "⧉"}
      </span>
      {copied ? "Copied to clipboard!" : "Copy my email address"}
    </button>
  );
}

/* --------------------------- The section -------------------------- */

export default function WorkingStyle() {
  return (
    <section id="working" className="ws-section">
      <p className="section-label">02 · Working Style</p>
      <h2 className="section-title">
        How I <span className="highlight">Operate</span>
      </h2>

      <div className="ws-grid">
        {/* Big laptop illustration — lid opens on hover, Earth on screen */}
        <div className="ws-card ws-laptop-card">
          <span className="ws-bubble ws-bubble-a" aria-hidden />
          <span className="ws-bubble ws-bubble-b" aria-hidden />
          <div className="laptop">
            <div className="laptop-lid">
              <div className="laptop-screen">
                <div className="screen-site">
                  <span className="screen-brand">PLANET EARTH</span>
                  <span className="screen-tag">design · code · ship</span>
                  <span className="screen-cta" />
                </div>
                <div className="screen-earth" />
              </div>
            </div>
            <div className="laptop-base">
              <span className="laptop-notch" />
            </div>
          </div>
          <h3 className="ws-laptop-headline">
            I prioritize client collaboration, fostering open communication
          </h3>
        </div>

        {/* Flat dotted map — time zones */}
        <div className="ws-card ws-tz-card">
          <DottedGlowBackground
            className="tz-glow-bg"
            gap={16}
            radius={1.6}
            color="rgba(167, 139, 250, 0.4)"
            glowColor="rgba(34, 211, 238, 0.85)"
            opacity={0.45}
            speedScale={0.8}
          />
          <h3 className="ws-h3">
            I&apos;m very flexible with time zone communications
          </h3>
          <DottedMap />
        </div>

        {/* Tech stack — opposing plain-text marquee columns */}
        <div className="ws-card ws-stack-card">
          <div className="stack-text">
            <p className="ws-kicker">I constantly try to improve</p>
            <h3 className="ws-h3-lg">My tech stack</h3>
          </div>
          <StackColumns />
        </div>

        {/* Personal blurb */}
        <div className="ws-card ws-blurb-card">
          <h3 className="ws-h3">Tech enthusiast with a passion for development.</h3>
          <div className="ws-sketch" aria-hidden>
            <span className="ws-sketch-dot" />
            <span className="ws-sketch-lines">
              <i /><i /><i />
            </span>
          </div>
        </div>

        {/* Terminal — the inside scoop */}
        <div className="ws-card ws-terminal-card">
          <div className="scoop-text">
            <p className="ws-kicker">The Inside Scoop</p>
            <h3 className="ws-h3-lg">
              Currently working on a new project - details soon
            </h3>
          </div>
          <div className="scoop-terminal">
            <Terminal />
          </div>
        </div>

        {/* Mini CTA — copy email */}
        <div className="ws-card ws-cta-card">
          <h3 className="ws-h3">Do you want to start a project together?</h3>
          <CopyEmail />
        </div>

        {/* Relocated 3D globe — full-width strip */}
        <div className="ws-card ws-globe-strip">
          <div className="globe-wrap">
            <div className="globe-glow" />
            <Globe />
          </div>
          <div className="globe-text">
            <h3 className="ws-h3-lg">Based in Islamabad, working worldwide</h3>
            <p>
              GMT+5 on paper, async in practice - wherever your team is, we
              will find an overlap that works.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
