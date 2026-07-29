# 07 — DECISIONS

*Tier 4. **Append-only.** Never edit or delete an entry — supersede it with a new one referencing the old ID.*

*Rejected ideas are recorded with equal weight. In month three, knowing why something was killed is what stops it being rebuilt.*

---

## Format

```
### D-000 — Title
Status: Accepted | Superseded by D-XXX | Rejected
Date: YYYY-MM
Decision: what was decided
Rationale: why
Cost: what this makes harder
```

---

### D-001 — The thesis is perspective, not exploration or aviation
**Status:** Accepted · **Date:** 2026-07

**Decision:** The portfolio is about *perspective* — the same world seen from a different altitude. Aviation is the vocabulary; exploration was rejected as the framing.

**Rationale:** "Exploration" is too broad to exclude anything, and a thesis that excludes nothing cannot guide decisions. "Aviation" is a theme, and themes decorate rather than mean. Perspective is personal, specific, and literally true of the subject.

**Cost:** Requires discipline to keep aviation as language rather than letting it become theme.

---

### D-002 — Two worlds, sequenced rather than blended
**Status:** Accepted · **Date:** 2026-07

**Decision:** The site moves from a dark emissive world to a light atmospheric one via a single event, rather than blending the two or choosing one.

**Rationale:** Blending high-key overcast atmosphere with black-and-neon emission produces mush. Sequencing them creates a story instead of a compromise, and it is physically true — this is what taking off through cloud actually looks like.

**Superseded:** an earlier framing that the project must *choose* one identity.

**Cost:** Two colour systems, roughly double the CSS surface. Mitigated by freezing the dark world (D-012).

---

### D-003 — Front-load the climb
**Status:** Accepted · **Date:** 2026-07

**Decision:** The break occurs at roughly 20–25% scroll depth. Dark world is hero plus identity only.

**Rationale:** A payoff eight sections deep is never seen by a skimming recruiter. Concentrating the transition into one early event also means all craft goes into one moment rather than managing a continuous gradient across every component. A real flight is minutes of climb and hours of cruise.

**Cost:** The back half must hold attention on atmosphere and content quality rather than spectacle. This is a harder problem, and it is the right one.

---

### D-004 — The experience ends in flight
**Status:** Accepted · **Date:** 2026-07

**Decision:** No landing. The final beat is open sky.

**Rationale:** Landing implies completion. The portfolio represents who Abdulbasit is now, not a destination reached. "Cleared for takeoff" is about what is next.

---

### D-005 — The cube grid becomes terrain
**Status:** Accepted · **Date:** 2026-07

**Decision:** The existing ripple grid is reinterpreted as ground, left behind during the climb, and never seen again.

**Rationale:** It was a beautiful background with no reason to exist. As terrain it gains narrative purpose, its absence above the deck becomes meaningful, and the most expensive existing asset is preserved rather than discarded.

**This is the model for the whole project: find new meaning in what exists before replacing it.**

---

### D-006 — ORION becomes an instrument
**Status:** Accepted · **Date:** 2026-07

**Decision:** ORION is reframed from sci-fi orb to intelligent flight instrument. It dims with altitude — a beacon below, a quiet trusted system above.

**Rationale:** A glowing orb is native to the dark world and foreign in the light one. Real cockpit instruments are dark glass in bright cabins. The existing status readouts and HUD framing already support this reading; almost nothing needs rebuilding.

---

### D-007 — ORION's scope narrows
**Status:** Accepted · **Date:** 2026-07 · **Supersedes:** the earlier decision permitting general knowledge answers

**Decision:** ORION no longer answers general knowledge questions (capitals, famous people, trivia). Its scope narrows to this person, this work, this flight. Off-topic requests are declined in character.

**Rationale:** A chatbot answering trivia is fine. A *flight instrument* answering trivia is a toy, and it punctures the world at exactly the moment a curious visitor is testing whether the experience is real. Under D-006 the earlier decision is now wrong.

**Cost:** Slightly less impressive as a raw capability demo. Considerably more coherent as an experience.

---

### D-008 — One WebGL context
**Status:** Accepted · **Date:** 2026-07

**Decision:** All 3D consolidates into a single persistent canvas driven by a single altitude value.

**Rationale:** A camera cannot fly through a world split across three unrelated contexts, and framerate cannot survive the attempt. Also resolves a performance ceiling the project would have hit regardless.

**Cost:** Significant architectural work (Gate 3) with no visible output.

---

### D-009 — V1 ships silent
**Status:** Accepted · **Date:** 2026-07

**Decision:** No audio in V1. The experience must be emotionally complete in silence. An audio layer is architected for and disabled.

**Rationale:** Most visitors browse muted. Atmosphere must carry everything alone. Autoplay restrictions would also require an unmute prompt early, which sits badly against a calm opening.

---

### D-010 — Adaptive quality is reinstated
**Status:** Accepted · **Date:** 2026-07 · **Supersedes:** "permanent max quality, no adaptive fallback"

**Decision:** Adaptive quality tiers return, affecting particle counts, DPR, post-processing and cloud sampling — never narrative, never the break's duration or beats.

**Rationale:** The original decision was reasonable against a two-machine test set. The actual audience is a recruiter on a four-year-old work laptop. Adaptive quality is not a downgrade — it is what lets the concept exist on the hardware that matters.

---

### D-011 — The Cloud Break is a hypothesis, not a fact
**Status:** Accepted · **Date:** 2026-07

**Decision:** The break is treated as the project's primary creative hypothesis and validated by a standalone throwaway prototype (Gate 1) before any architecture commits to it.

**Rationale:** Every document in this suite assumes the moment is great rather than merely fine. If it is not, the documents are fiction. Failing cheaply in days is better than discovering it after consolidation.

---

### D-012 — The dark world is frozen
**Status:** Accepted · **Date:** 2026-07

**Decision:** No new features are built below the deck. It receives an exit and nothing else.

**Rationale:** Two design systems is the real cost of D-002. Freezing one halves the ongoing maintenance surface.

---

### D-013 — Cut the bento grid
**Status:** Accepted · **Date:** 2026-07

**Decision:** The Working-Style bento section is removed. Its worthwhile content redistributes to beats that need it.

**Rationale:** A trend-driven container holding six unrelated fragments. The Constitution places craftsmanship before trends and requires everything to earn its place. The content may survive; the container does not.

---

### D-014 — Cut the Contact cube physics
**Status:** Accepted · **Date:** 2026-07

**Decision:** Removed from Contact. May relocate below the deck if it earns a place there.

**Rationale:** Well built and genuinely fun, but it is a fidget toy at the calmest moment of the experience, and it reintroduces emissive glow into a world that has none. Fails both the atmosphere rule and "no effect exists purely to impress." Craftsmanship alone does not justify existence.

---

### D-015 — Cut the animated stat cards
**Status:** Accepted · **Date:** 2026-07

**Decision:** Count-up stat tiles removed. The underlying achievements move into the Flight Log as narrative.

**Rationale:** Animated counters are a SaaS landing-page convention, explicitly excluded by the design language. The facts — 2,400+ participants, a fifteen-person team at eighteen — are the strongest content on the site and deserve prose, not dashboard tiles.

---

### D-016 — Deploy before rebuilding
**Status:** Accepted · **Date:** 2026-07

**Decision:** The current site ships to production before Gate 3 work begins.

**Rationale:** Active job search. An unshipped portfolio earns nothing, and an ambitious rebuild with nothing live is the most likely failure mode for this project — by silence, not by defect.

---

### D-017 — Content is a gate, not a task
**Status:** Accepted · **Date:** 2026-07

**Decision:** Real screenshots and real writing for every beat become Gate 2, running in parallel with prototyping.

**Rationale:** Above the deck the site runs on atmosphere and content. An award-standard shell around one-line project descriptions reads worse than a modest site with excellent writing, because the gap is visible. This is a larger threat to the outcome than the break itself.

---

## Rejected

### R-001 — Blending the two palettes
**Rejected 2026-07.** Produces a muddy neither-world. Superseded by sequencing (D-002).

### R-002 — Continuous gradient across the whole page
**Rejected 2026-07.** Linear interpolation across eight sections lands in an indeterminate blue-grey around 40% and cheapens both worlds. The transition must be an event.

### R-003 — Ending with a landing
**Rejected 2026-07.** Implies completion and closes the story precisely where an invitation is wanted.

### R-004 — 3D exploded laptop and drone models
**Rejected 2026-07.** Cool objects with no narrative role. Fail the climb-or-view test outright.

### R-005 — Redesigning the hero
**Rejected 2026-07.** It works and it is the anchor of the dark world. The correct question is how to enrich the world around it.

### R-006 — Aviation as visible theme
**Rejected 2026-07.** Cockpit skeuomorphism, aircraft models, HUD reticles and runway textures. If a visitor describes the site as "the aviation one," the language became the subject.
