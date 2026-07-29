# 06 — ROADMAP

*Tier 4. Living. Read weekly.*

---

## Gate discipline

Work proceeds through gates. **Each gate must pass before the next begins.** The purpose is to fail cheaply — every gate is positioned to invalidate an assumption before it becomes expensive.

---

## Gate 0 — Ship what exists

**Deploy the current portfolio to Vercel before any of this work starts.**

Not because the current site is finished. Because it is job-hunting season, an unshipped portfolio earns nothing, and a rebuild loop with nothing live is the single most likely way this project fails — not technically, but by never being seen.

Rebuild in public. The work is visible while it improves.

**Complexity:** Low. Hours.
**Exit criteria:** Live URL. Real GitHub and LinkedIn links wired in (currently `#` placeholders).

---

## Gate 1 — Validate the hypothesis

**Build a standalone, ugly prototype of the Cloud Break.**

No content. No styling. No portfolio. A camera, fog, exposure, a cloud deck, a sky. Nothing else.

It answers exactly one question:

> **Is this moment emotionally powerful enough to be the foundation of the portfolio?**

Not "is it smooth." **Does it move someone who has not been told what it means.** Show it to people who know nothing about the project. If it needs explaining, it has failed.

**Complexity:** High — this is the hardest single thing in the project.
**Exit criteria:** Genuine reaction from at least three uninformed viewers, sustained 60fps on integrated graphics, reversible, no hitch at beats 3–4.
**Failure path:** Rewrite `02` and `03`. The thesis may survive with a different physical metaphor; do not force a moment that does not land.

---

## Gate 2 — Content

**Deliberately placed before the rebuild, and this is the most-overlooked risk in the project.**

Above the deck, the site runs on atmosphere and content quality. Current content: placeholder project screenshots, one-line descriptions, no case studies, no writing anywhere.

An award-standard shell around thin content reads *worse* than a modest site with excellent content, because the gap is visible. **This is a bigger threat to the outcome than the cloud break.**

Required:
- Real screenshots of every project.
- Real writing for each: the problem, the approach, the outcome. A paragraph that a stranger finds interesting.
- The Flight Log written as narrative — SteamNexus → Nobelium 2025 → Pandora → PMUN26 → Nobelium 2026 — with scale and responsibility told in prose, not counters.
- One honest paragraph of identity for the hero's surroundings.

**Complexity:** Medium effort, high difficulty. Writing is harder than shaders.
**Exit criteria:** Every beat has final copy. No lorem, no placeholders, no "coming soon."

---

## Gate 3 — Consolidate the canvas

Merge three WebGL contexts into one persistent world. Altitude becomes the single source of truth. Terrain and ORION migrate in.

**No new features during this gate.** It is pure architecture, and mixing features into it is how regressions hide.

**Complexity:** High.
**Exit criteria:** One context. All existing behaviour preserved. Full responsive regression passes 375px → 2560px. No framerate loss versus current.

---

## Gate 4 — Build the light world

Tokens, atmosphere, sky, typography at altitude, and **the View** — the empty first breath above the deck.

Build the emptiness *before* filling it. If the View is not compelling with almost nothing in it, no amount of content will rescue it.

**Complexity:** Medium-high.
**Exit criteria:** Someone can scroll from ground to cruise and the destination feels worth the climb with no content present.

---

## Gate 5 — Migrate content

Beat by beat, in narrative order, applying the cuts in `07-DECISIONS.md`.

**Complexity:** Medium, spread wide.
**Exit criteria:** All beats migrated. Everything cut is actually gone, not commented out.

---

## Gate 6 — Refine

Reduced-motion path, mobile, accessibility audit, final performance pass. Audio layer only if Gates 0–5 are genuinely complete.

**Complexity:** Medium.
**Exit criteria:** Contrast verified in both worlds. Reduced-motion path tells the same story. 60fps floor held on target hardware.

---

## Dependencies

```
Gate 0 ──┐
Gate 1 ──┼──→ Gate 3 ──→ Gate 4 ──→ Gate 5 ──→ Gate 6
Gate 2 ──┘
```

Gates 0, 1 and 2 are independent and can run in parallel. **Gate 3 must not begin until Gate 1 has passed** — consolidating the architecture around an unvalidated moment is the expensive mistake this whole structure exists to prevent.

Gate 2 (content) can and should proceed alongside everything. It requires no code.

---

## Weekly shape

Indicative, not binding. Adjust to reality rather than forcing the plan.

| Week | Focus |
|---|---|
| 1 | Gate 0 deploy. Begin Gate 1 prototype. Begin writing (Gate 2). |
| 2 | Gate 1 iteration and testing on uninformed viewers. Keep writing. |
| 3 | Gate 1 verdict. If pass → begin Gate 3 consolidation. |
| 4–5 | Gate 3. Architecture only, no features. |
| 6–7 | Gate 4. The light world and the View. |
| 8–10 | Gate 5. Content migration, beat by beat. |
| 11 | Gate 6. Refinement, accessibility, mobile. |
| 12 | Buffer. There is always a week that disappears. |

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| **Content stays thin** | **Critical** | Gate 2, run in parallel, no code dependency |
| **The break is technically fine but emotionally ordinary** | **Critical** | Gate 1 before any architecture commitment |
| **Rebuild loop — site never ships** | **Critical** | Gate 0, non-negotiable |
| Fast scroll teleports past the break | High | Velocity clamping (`04-ARCHITECTURE.md`) |
| Consolidation destabilises working features | High | Gate 3 isolated, no parallel feature work |
| Light world is empty rather than atmospheric | High | Gate 4 proves the View before content |
| Scope exceeds one person | High | Cut aggressively. One idea executed completely |
| Mobile cannot carry the concept | Medium | Responsive designed deliberately, not as fallback |
| Two design systems double CSS surface | Medium | Dark world frozen — no new features below deck |
| Navigation lets first-timers skip the break | Medium | Resolve nav model in Gate 4 |

---

## Complexity estimates

| Work | Complexity | Notes |
|---|---|---|
| Cloud break prototype | **Very high** | Novel. The hard part of the project |
| Canvas consolidation | **High** | Known problem, large surface |
| Light world atmosphere | High | Getting non-emissive right is subtle |
| Writing and content | Medium effort, **high difficulty** | Underestimated by every developer |
| Content migration | Medium | Volume, not difficulty |
| Reduced-motion path | Medium | Design decision, not just a media query |
| Accessibility audit | Low-medium | Light world contrast is the risk |
| Deploy | Low | Hours |

---

## Explicitly out of scope

Killed under the current constitution. Recorded here so they are not quietly resurrected.

- 3D exploded laptop model
- 3D exploded drone model
- Site-wide sound effects (V1)
- Contact cube physics in its current placement
- Animated stat counters
- Bento grid container
- Any new feature below the deck
