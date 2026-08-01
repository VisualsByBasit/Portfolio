"use client";
import { useEffect, useReducer, useState } from "react";
import { BEAT_LABEL, SLIDERS, TUNE, type TuneKey } from "./config";
import { STATE, U } from "./uniforms";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * Not UI. A tuning instrument. Every number in the brief is a starting point
 * that will be wrong, and the framerate has to be measured rather than
 * estimated, so both live here. Press H to hide it before showing anyone.
 */

const GROUPS = ["climb", "cloud", "alive", "light", "air", "lens"] as const;

function beatName(a: number) {
  let name = BEAT_LABEL[0].name;
  for (const b of BEAT_LABEL) if (a >= b.at) name = b.name;
  return name;
}

const mono: React.CSSProperties = {
  font: "11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#cfe0ee",
};

export default function Panel() {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [hidden, setHidden] = useState(false);
  const [readout, setReadout] = useState({
    alt: 0,
    scroll: 0,
    pitch: 0,
    exposure: 1,
    fps: 0,
    worst: 0,
    worstBreak: 0,
    clamped: false,
  });

  // Expose live world state so an external harness can tag frame times with
  // altitude. Prototype-only instrumentation.
  useEffect(() => {
    (window as unknown as { __CB?: typeof STATE }).__CB = STATE;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "h" || e.key === "H") setHidden((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setReadout({
        alt: STATE.altitude,
        scroll: STATE.scroll,
        pitch: STATE.pitch,
        exposure: U.uExposure.value,
        fps: STATE.fps,
        worst: STATE.worstMs,
        worstBreak: STATE.worstBreakMs,
        clamped: STATE.clamped,
      });
    }, 120);
    return () => clearInterval(id);
  }, []);

  const goto = (a: number) => {
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: limit * a, behavior: "smooth" });
  };

  if (hidden) {
    return (
      <div style={{ position: "fixed", left: 8, bottom: 8, zIndex: 30, ...mono, opacity: 0.5 }}>
        H
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        zIndex: 30,
        width: 300,
        maxHeight: "100vh",
        overflowY: "auto",
        padding: "10px 12px",
        background: "rgba(6,8,14,0.82)",
        borderLeft: "1px solid rgba(120,160,200,0.25)",
        ...mono,
      }}
    >
      <div style={{ marginBottom: 8, lineHeight: 1.7 }}>
        <div>
          alt <b>{readout.alt.toFixed(3)}</b> scroll {readout.scroll.toFixed(3)}{" "}
          {readout.clamped && <span style={{ color: "#ffcf6b" }}>CLAMPED</span>}
        </div>
        <div style={{ color: "#8fd0ff" }}>{beatName(readout.alt)}</div>
        <div>
          pitch {readout.pitch.toFixed(2)}&deg; &nbsp; exp {readout.exposure.toFixed(2)}
        </div>
        <div>
          fps <b>{readout.fps.toFixed(0)}</b> &nbsp; worst {readout.worst.toFixed(1)}ms &nbsp;
          <span style={{ color: readout.worstBreak > 20 ? "#ff8080" : "#9fe0a0" }}>
            beats3-4 {readout.worstBreak.toFixed(1)}ms
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            STATE.worstMs = 0;
            STATE.worstBreakMs = 0;
          }}
          style={{ marginTop: 4, ...mono, background: "#12203a", border: "1px solid #2c4666" }}
        >
          reset perf
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
        {BEAT_LABEL.map((b) => (
          <button
            key={b.name}
            type="button"
            onClick={() => goto(b.at)}
            style={{ ...mono, background: "#12203a", border: "1px solid #2c4666", padding: "1px 4px" }}
          >
            {b.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {GROUPS.map((g) => (
        <div key={g} style={{ marginBottom: 6 }}>
          <div style={{ color: "#6f8ba6", marginBottom: 2 }}>{g}</div>
          {SLIDERS.filter((s) => s.group === g).map((s) => (
            <label key={s.key} style={{ display: "block", marginBottom: 1 }}>
              <span style={{ display: "inline-block", width: 108 }}>{s.key}</span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={TUNE[s.key as TuneKey]}
                onChange={(e) => {
                  TUNE[s.key as TuneKey] = parseFloat(e.target.value);
                  bump();
                }}
                style={{ width: 110, verticalAlign: "middle" }}
              />
              <span style={{ display: "inline-block", width: 58, textAlign: "right" }}>
                {TUNE[s.key as TuneKey]}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
