"use client";
import { useEffect, useRef, useState } from "react";
import { COUNTRIES, flagEmoji } from "@/data/countries";
import { cn } from "@/lib/utils";

type Mode = "full" | "compact";

/**
 * Shared country picker: "full" mode shows the country name (Country*
 * field), "compact" mode shows just the flag + dial code (phone prefix).
 * A plain <select> can't be styled to match the glass form aesthetic
 * across browsers, so this is a small custom listbox instead.
 */
export default function CountrySelect({
  value,
  onChange,
  mode = "full",
  error,
  name,
}: {
  value: string | null;
  onChange: (iso2: string) => void;
  mode?: Mode;
  error?: boolean;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = COUNTRIES.find((c) => c.iso2 === value) ?? null;
  const filtered = query
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES;

  return (
    <div
      ref={rootRef}
      className={cn(
        "country-select",
        `country-select-${mode}`,
        error && "country-select-error",
        open && "country-select-open",
      )}
    >
      <button
        type="button"
        className="country-select-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <span className="country-flag">{flagEmoji(selected.iso2)}</span>
            <span className="country-select-label">
              {mode === "full" ? selected.name : selected.dial}
            </span>
          </>
        ) : (
          <span className="country-select-placeholder">
            {mode === "full" ? "Your country" : "Code"}
          </span>
        )}
        <span className="country-select-caret" aria-hidden>
          ▾
        </span>
      </button>
      {name && <input type="hidden" name={name} value={selected?.name ?? ""} />}

      {open && (
        <div className="country-select-panel" role="listbox">
          <input
            autoFocus
            type="text"
            className="country-select-search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="country-select-list">
            {filtered.map((c) => (
              <button
                type="button"
                key={c.iso2}
                role="option"
                aria-selected={c.iso2 === value}
                className="country-select-option"
                onClick={() => {
                  onChange(c.iso2);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="country-flag">{flagEmoji(c.iso2)}</span>
                <span>{mode === "full" ? c.name : `${c.name} (${c.dial})`}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="country-select-empty">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
