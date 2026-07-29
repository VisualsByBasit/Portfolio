# 02 — DESIGN LANGUAGE

*Tier 2. Changes rarely. Governs how everything feels and looks.*
*Concrete values live in `05-DESIGN-SYSTEM.md`. This document is philosophy; that one is reference.*

---

## The two worlds

The site is not one aesthetic. It is two, separated by a single event. They share typography and layout logic. They share nothing else.

### BELOW — the dark world

**Feeling:** focused, enclosed, technical, private. Working late with the door shut. The world is small and the work is everything. Not oppressive — *concentrated*.

**Light behaves as emission.** Everything visible is a light source in a void. Glow carries meaning here because there is nothing else producing light. Cyan and violet are not decoration; they are the only illumination in the room.

**Scale is intimate.** Objects are close. No horizon exists. Distance does not exist yet.

**Motion is local.** Things pulse, rise, settle, breathe. Nothing travels. The camera does not move because there is nowhere to go.

This world already exists and is good. It needs an exit, not a redesign.

### ABOVE — the light world

**Feeling:** calm, vast, clear, quietly overwhelming. Not celebratory. The engine is still running and nothing has been won — but you can see.

**Light behaves as atmosphere.** Nothing glows. Light is diffuse, directional, unfiltered, everywhere. Objects are visible because the environment is lit, not because they emit.

> This is the single most important difference between the worlds and the easiest thing to get wrong. **No bloom above the deck. Ever.**

**Scale is enormous.** A horizon exists. Distance is real and readable. Air has depth and haze.

**Motion is camera motion.** Drift, parallax through atmospheric layers, inertia. The user moves through a place; things do not animate at them.

**Emptiness is a material.** Large void areas are the point. The view is mostly nothing. That is what makes it a view.

---

## Colour philosophy

Cyan and violet are **emission colours**. On `#06060f` they read as light sources. Placed on cold white fog they read as a SaaS dashboard — precisely the register this project rejects.

So the palette does not swap backgrounds. It swaps *behaviour*:

| | Below | Above |
|---|---|---|
| Colour is | Light | Pigment |
| Depth from | Glow falloff | Haze and value |
| Contrast from | Emission vs. void | Value vs. atmosphere |
| Text is | Near-white on near-black | Cold ink, never pure black |
| Warmth | None | Exactly one note — sun |

**Above the deck, accents must be non-emissive.** Ink, graphite, cold blue-grey, deep instrument blue. The environment provides light; objects do not.

This is the real cost of the concept. Two colour systems is roughly double the surface area, and it is worth paying knowingly. Mitigation: **the dark world is frozen.** No new features are built below the deck. It receives an exit and nothing else.

---

## Material language

Think: cold daylight through cloud. Brushed aluminium. Glass with real thickness. Fresh snow. Diffuse shadow with no hard edges.

- **Below:** glass and emission. Transmissive, refractive, self-lit.
- **Above:** matte and metal. Light-receiving, never light-producing.
- Surfaces should feel like they have *mass*. Nothing weightless, nothing plastic.
- Shadows are soft, large and low-contrast. Hard shadows do not exist at altitude in diffuse light.

---

## Typography philosophy

**Inter** for reading. **JetBrains Mono** for labels and data.

Mono is retained for a specific reason: below the deck it reads as *code*. Above the deck it reads as *instrument data* — METARs, flight plans and altimeter labels are all monospace. One typeface, two meanings, zero cost.

This is the model for the whole project: **find new meaning in what already exists before replacing it.**

Above the deck, type sits in significantly more space. Cramped layouts destroy the illusion of scale faster than any wrong colour.

---

## Motion language

Think like a cinematographer, not a UI designer.

- **No bounce, no overshoot, no spring above the deck.** Air has inertia, not elasticity.
- **Long, camera-like easing.** Motion starts slowly, travels, and settles. It does not snap.
- **The climb is the only fast thing in the entire site.** Everything else is unhurried. That contrast is what makes the break feel physical.
- **Motion must be physically motivated.** Parallax because distance exists. Drift because air exists. Movement that cannot be explained by the world is decoration.
- **Nothing moves to attract attention.**

---

## Camera philosophy

The camera is a physical object with mass, not a viewport.

- It has **inertia** — it does not stop the instant scrolling stops.
- It **leads and settles** rather than tracking exactly.
- It responds subtly to pointer position, as though the world acknowledges the visitor without performing for them.
- It **never rolls**. Banking is tempting and reads as a video game.
- Altitude is the only thing scroll directly controls. Everything else is derived.

---

## Interaction language

- Interactions **reward** curiosity; they never demand it.
- Hover is tactile and physical. Never jumpy, never instant.
- Nothing should feel like a widget. Widgets belong to websites; this is an environment.
- The world acknowledges the pointer. It does not chase it.

---

## Sound philosophy

**Version 1 ships silent, and is emotionally complete in silence.**

Atmosphere must communicate everything without audio. Sound is an enhancement, never a dependency — a visitor with the tab muted, which is most visitors, must lose nothing essential.

The architecture reserves an audio layer for later: muffled and low-frequency inside cloud, opening into thin wind and space above. If it is ever enabled it must be opt-in, never autoplay, and never required to understand the story.

---

## The role of perspective

Perspective is the thesis and therefore the design's organising constraint.

Nothing in the world should *change* across the break. The same weather, the same person, the same work. What changes is **vantage** — what is visible, what is beneath, what the horizon does.

Concretely: the cloud deck the visitor was inside becomes the floor they stand above. It is the same cloud. That identity must be legible, or the idea does not land.

---

## The role of aviation

Aviation is the vocabulary, not the theme. It earns its place because Abdulbasit is genuinely training for a CPL — it is autobiography, not decoration.

**Permitted:** altitude, horizon, instruments, atmosphere, camera behaviour that obeys flight physics, monospace as flight data.

**Forbidden:** cockpit skeuomorphism, aircraft models, HUD reticles, aviation clip art, runway imagery used as texture, anything that reads as *theme* rather than *language*.

The test: if a visitor could describe the site as "the aviation one," we have gone too far. They should describe it as "the one where you break through the clouds."

---

## The Cloud Break principle

> The break does not exist because it is visually impressive. It exists because it is the moment the visitor understands what the portfolio is saying.

If that emotional clarity is absent, the transition has failed regardless of technical execution.

### What it feels like, in order

1. **Reference falls away.** No horizon, no depth, no parallax. Quiet, close, slightly tense. On instruments.
2. **Uneven brightening.** Thinning in patches. Light turns directional. Something is up there.
3. **Glare.** Genuinely harsh. Unfiltered sun with no atmosphere above to soften it. Briefly uncomfortable.
4. **Adjustment.** Eyes settle. The horizon resolves as a hard line. The murk that was pressing down is now a floor stretching to the edge of the world.

**Beat four is the payload.** The clouds did not leave. You rose above them.

### Non-negotiable rules

- **The user flies it.** Scroll-driven. If it plays *at* them it is a video, and people skip videos.
- **It is short.** Two to three seconds. The instinct to stretch it must be resisted; brevity is what makes it read as physical event rather than effect.
- **It is reversible.** Scroll up and descend back into cloud. Forward-only playback is a trigger, not a world.
- **It must not hitch.** One dropped frame at the reveal kills it permanently.

---

## What this is not

Stated plainly so it can be enforced:

- Not cyberpunk. Not neon-on-black as an end in itself.
- Not Apple minimalism.
- Not generic SaaS — **no stat-card rows, no feature grids, no trust badges.**
- Not a bento grid.
- Not a collection of impressive unrelated effects.
- Not Igloo.
