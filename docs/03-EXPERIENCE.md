# 03 — EXPERIENCE

*Tier 2. Changes rarely. Owns the story spine and what each beat must accomplish.*

---

## Information architecture

The site is **one continuous ascent**. Sections are altitudes, not pages. There is no navigation between destinations — there is only higher and lower.

The existing nav links (About / Skills / Projects / Testimonials / Contact) must be reconsidered against this: jumping instantly from ground to cruise skips the only thing that makes the site itself. Options are addressed in the roadmap; the principle is that **navigation must not be able to teleport a first-time visitor past the break.**

---

## Narrative structure

| # | Beat | World | Objective |
|---|---|---|---|
| 0 | **Ground** | Dark | Arrival. Establish enclosure. The cube field as terrain at night. |
| 1 | **Identity** | Dark | Who this is. The hero, preserved. |
| 2 | **THE CLIMB** | Transition | The centrepiece. Everything before earns it; everything after justifies it. |
| 3 | **The View** | Light | First breath. Almost empty. Establish scale before content. |
| 4 | **Selected Work** | Light | The projects. Fewer, larger, better. |
| 5 | **Process** | Light | How he works. |
| 6 | **Instruments** | Light | Tools and technology, read as avionics. |
| 7 | **Flight Log** | Light | Experience and leadership as chronology. |
| 8 | **Open Sky** | Light | Contact. Still airborne. |

### Why the dark is short

Hero, then up. The dark world exists only long enough to establish identity and enclosure. It must feel **concentrated**, not cramped — if it is too brief it reads as a splash screen and the climb has nothing to escape from.

Target: the break begins at roughly **20–25% scroll depth**. Early enough that a skimming recruiter reaches it. Late enough that it was earned.

### Why it ends in flight

Landing implies completion. This portfolio represents who Abdulbasit is *now*, not a destination reached. "Cleared for takeoff" is about what is next, not about arriving.

The final frame is open sky. Nothing resolves. That is the point.

---

## User journey

**The skimmer** (most recruiters). Lands, scrolls fast, hits the break within seconds. The break must survive fast scrolling — see velocity clamping in `04-ARCHITECTURE.md`. If they leave after the break, they leave having felt something.

**The explorer.** Moves deliberately, hovers things, opens ORION, reads. Rewarded with detail, atmosphere and content depth. Nothing is hidden from the skimmer to serve this person — exploration adds, it does not gate.

**The returning visitor.** Has seen the break. Must be able to get to specific content quickly without the experience feeling like an obstacle. This is the strongest argument for retaining some navigation.

**The reduced-motion visitor.** Receives the same story as a cross-fade between altitudes rather than a camera move. The narrative survives; the vestibular load does not.

---

## Hero philosophy

The hero is the strongest existing element and the anchor of the dark world. It is **preserved, not redesigned.**

The question is never "how do we improve the hero." It is:

> **"How do we make the world around the hero feel richer, more immersive and more alive while preserving its identity?"**

Permitted: ambient particles, subtle environmental lighting, camera inertia, atmospheric depth, environmental storytelling around it.

Forbidden: changing the name treatment, the rotating subtitle, the CTA structure, or the palette. It works. Leave it.

---

## Section objectives

Each beat has one job. If a section is doing two jobs it should be two sections or one of the jobs should be cut.

**Ground** — establish that we are somewhere specific, enclosed, and low. Introduce the terrain that will later be left behind.

**Identity** — say who this is with enough confidence that a stranger keeps scrolling.

**The Climb** — deliver the thesis physically. This is the only beat whose objective is emotional rather than informational.

**The View** — prove the destination was worth reaching. Almost no content. Scale, silence, horizon. *Restraint here is what makes the rest of the site feel intentional.*

**Selected Work** — demonstrate capability with real evidence. Requires real screenshots and real writing; see content risk in `06-ROADMAP.md`.

**Process** — show that the work is deliberate rather than lucky.

**Instruments** — establish technical range without a skills-badge wall.

**Flight Log** — the strongest content on the site. Chronology of events, scale and responsibility, told as narrative rather than counters: SteamNexus → Nobelium 2025 → Pandora → PMUN26 → Nobelium 2026.

**Open Sky** — make contact feel like an invitation rather than a form. Nothing resolves.

---

## The Cloud Break — experience specification

*Philosophy in `02-DESIGN-LANGUAGE.md`. Technical implementation in `04-ARCHITECTURE.md`. This section defines what must be true experientially.*

**Status: HYPOTHESIS.** Unvalidated until Gate 1. Everything downstream is contingent on it.

### Beat table

| Beat | Duration | What the visitor perceives | Success condition |
|---|---|---|---|
| 1 — Loss of reference | ~0.6s | Horizon, terrain and parallax gone. Flat, close, quiet. | Mild tension. Not boredom. |
| 2 — Uneven brightening | ~0.8s | Patchy directional light above. Anticipation. | They know something is coming. |
| 3 — Glare | ~0.4s | Near-total white. Briefly harsh. | Involuntary physical reaction. |
| 4 — Adjustment | ~1.2s | Horizon resolves. Cloud becomes a floor below. | **Recognition.** The idea lands. |

Beat 4 gets the most frames. It is the payload.

### Failure conditions

The break has failed if any of these are true, regardless of technical quality:

- A visitor describes it as "cool" rather than reacting to it.
- The thesis is not legible — they do not register that the cloud is the *same* cloud, now beneath them.
- Fast scrolling teleports past it.
- Any frame drops during beats 3–4.
- It cannot be reversed.
- It exceeds ~3 seconds.
- It reads as a loading screen or a cutscene.

### Gate 1 validation question

Built ugly and standalone, with no content and no styling, the prototype answers exactly one question:

> **Is this moment emotionally powerful enough to be the foundation of the portfolio?**

Not "does it work." Not "is it smooth." **Does it move someone who has not been told what it means.**

Test it on people who know nothing about the project. If it needs explaining, it has failed.
