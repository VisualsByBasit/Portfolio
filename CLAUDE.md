# CLAUDE.md

Instructions for Claude Code working in this repository.

---

## Read this first

This project has a documentation suite in `/docs`. It is the source of truth and it outranks inference from the existing codebase.

**Before any non-trivial task, read:**

| Task type | Read |
|---|---|
| Anything at all | `docs/01-VISION.md` |
| Visual or motion work | `docs/02-DESIGN-LANGUAGE.md` + `docs/05-DESIGN-SYSTEM.md` |
| Structure, story, sections | `docs/03-EXPERIENCE.md` |
| Systems, 3D, performance | `docs/04-ARCHITECTURE.md` |
| "Why is it like this?" | `docs/07-DECISIONS.md` |

---

## The project in one line

A portfolio that begins in a dark, enclosed, emissive world and climbs through a cloud layer into a vast, calm, atmospheric one. The thesis is **perspective** — the same world seen from a different altitude.

---

## Hard rules

These are not preferences. Violating them breaks the project.

1. **One WebGL context.** Never create a second canvas. All 3D lives in `world/WorldCanvas.tsx`.
2. **No bloom, glow, or emissive material above the cloud deck.** Ever.
3. **No spring, bounce or overshoot above the deck.** Air has inertia, not elasticity.
4. **One scroll source.** Lenis feeds altitude. Never add an independent scroll listener.
5. **Never target the same element with both GSAP transforms and CSS/Framer transform state.** GSAP writes inline styles that silently beat CSS. This has already caused one bug.
6. **No per-frame values in React state.** Use refs.
7. **No allocation inside `useFrame`.**
8. **The dark world is frozen.** No new features below the deck.
9. **No stat counters, no bento grids, no feature-card grids.** Explicitly excluded.
10. **Text lives in the DOM, never in the canvas.** The canvas is `aria-hidden`.

---

## Writing style for any copy

- No em dashes.
- No emojis.
- Natural human phrasing. Not corporate, not AI-flavoured.
- Monospace is used for instrument data, not decoration.

---

## Before implementing any significant feature

State, briefly:

1. **Why** this improves the experience.
2. **How** it supports the story.
3. **Why** it belongs to the design language.

Then implement. If it fails any of the three, say so instead of building it.

---

## The test

> **Does this belong to the climb, or to the view?**

If neither, do not build it. Say why.

---

## Current phase

See `docs/06-ROADMAP.md` for the active gate. **Do not begin work belonging to a later gate.** The gates exist to fail cheaply — skipping one defeats the purpose.

---

## Known accepted warnings

Do not "fix" these:

- `THREE.Clock` deprecation — upstream R3F, fix only in an unstable major.
- Shader `X4122` precision warnings — harmless driver noise from glass materials.

---

## Environment

- `.env.local` holds `GEMINI_API_KEY`. It is gitignored and machine-specific — it will not exist after a fresh clone.
- Dev server: `npm run dev`.
- Always run `tsc --noEmit` and `npm run build` before declaring work complete.
- Responsive regression range: **375px → 2560px.**
