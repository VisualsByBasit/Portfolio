# 04 — ARCHITECTURE

*Tier 3. Changes at gates. Read before writing structural or systems code.*

**Stack:** Next.js (App Router) · TypeScript · hand-written CSS · Three.js / React Three Fiber · Framer Motion · GSAP + ScrollTrigger · Lenis

---

## The persistent world

### The non-negotiable

**One WebGL context for the entire site.**

Current state is three separate canvases: the ripple grid, ORION's core, and the Contact cubes. You cannot fly a camera through a world split across unrelated contexts, and you cannot hold framerate attempting it. Browsers also cap concurrent contexts, and weak GPUs cap them lower.

Consolidation is the price of the concept. It also resolves a performance problem this project was going to hit regardless.

### Shape

```
<WorldCanvas>                 single persistent R3F canvas, fixed, full-viewport, z-0
  <WorldCamera>               altitude-driven, inertial
  <Atmosphere>                fog · haze · exposure · sky colour, all f(altitude)
  <Terrain />                 existing CubeField — mounted below deck only
  <CloudDeck />               the break surface — always mounted
  <SkyDome />                 mounted above deck only
  <OrionInstrument />         migrated from its own canvas
</WorldCanvas>

<Content>                     normal DOM, scrolls above the canvas, z-10
  … sections …
</Content>
```

### Altitude is the single source of truth

One normalised scalar, `0 → 1`, derived from scroll position. Everything reads from it:

- camera position and pitch
- fog density and colour
- exposure
- sky vs. terrain mounting
- CSS custom properties for the DOM layer (world → DOM via a single CSS variable write)
- ORION's luminance

**Nothing else computes its own scroll position.** Multiple scroll listeners fighting each other is the most likely source of jitter, and jitter at the break is fatal.

### Mount discipline

Terrain and sky are **mutually exclusive**. The terrain does not exist above the clouds — not hidden, *unmounted*. The sky dome does not exist below them. Both in memory simultaneously is a bug, not an optimisation.

---

## Camera system

The camera is a physical object with mass.

- **Inertia:** a damped follow of the altitude target, not a direct binding. It overshoots slightly on stop and settles. Critically damped, never bouncy.
- **Pointer influence:** subtle positional offset from pointer, heavily smoothed, clamped small. The world acknowledges; it does not chase.
- **No roll, ever.** Banking reads as a video game.
- **Pitch is the primary expressive axis** — it pitches up to begin the climb and levels at cruise.
- Reduced-motion: inertia and pointer influence disabled, altitude changes become cross-fades.

### Scroll velocity clamping

**This protects the centrepiece and is not optional.**

A trackpad flick moves a page faster than the break's 2–3 second duration. Without protection, a skimming visitor teleports through the most important moment on the site.

Within the transition zone, the camera's altitude follow rate is **clamped to a maximum velocity**. The DOM continues to scroll normally; the world simply cannot climb faster than the break's minimum duration. Scroll and altitude decouple briefly, then re-converge above the deck.

This is not scroll-jacking — input is never blocked or hijacked. The world has inertia, which is physically honest.

---

## Scene management

| Concern | Rule |
|---|---|
| Instantiation | All heavy objects created once, reused. No allocation during transitions. |
| Preloading | Light-world assets initialise, compile shaders, and pre-render during the dark section, hidden. |
| Disposal | Terrain geometry/material disposed on unmount above deck, recreated on descent. |
| Frame budget | Per-frame allocations forbidden. No `new` inside `useFrame`. |
| Shared resources | One environment map, one shared material library. |

**A hitch at the reveal kills the moment permanently.** Everything above exists to prevent that single frame.

---

## Rendering strategy

- **Bloom exists below the deck and during break beat 3 only.** Above the deck there is no bloom, ever. Atmosphere replaces it.
- **Tone mapping** drives the glare. Exposure is animated; it is not a white overlay div.
- **DPR capped** on high-density displays. Atmosphere hides the difference; framerate does not survive it.
- **Adaptive quality returns.** See "Performance" below.
- Post-processing chain kept minimal — every pass is a full-screen read.

---

## Motion system

| Layer | Tool | Used for |
|---|---|---|
| Scroll | **Lenis** | Smooth scroll, single source of scroll value |
| World | **R3F `useFrame`** | Camera, atmosphere, anything in 3D |
| DOM sections | **GSAP + ScrollTrigger** | Reveals, pinning, scroll-linked DOM |
| Components | **Framer Motion** | Local UI state, hover, ORION panel |

### Hard rules

- **One scroll source.** Lenis feeds altitude; ScrollTrigger reads Lenis. Never two independent listeners.
- **GSAP writes inline styles, which beat CSS classes.** This already caused a silent bug where a leftover scroll-reveal locked the Approach card flip. **Never target the same element with both GSAP transforms and CSS transform state.** Separate the wrapper (GSAP) from the interactive element (CSS/Framer).
- **No spring or overshoot above the deck.** Air has inertia, not elasticity.
- All easing above the deck is long cubic-bezier, slow-in/slow-out.

---

## Transition system

Transitions between beats are **altitude changes**, not page transitions. There is no route change, no unmount/remount of the world, no fade-to-black.

The Cloud Break is the only *hard* transition in the site. Every craft hour spent on transitions goes there. Elsewhere, sections arrive by parallax and atmosphere.

---

## Component philosophy

- Components describe **what they are**, not where they sit. Altitude context provides world state.
- A component must work in exactly one world. Components that render "in both, but different" are two components and should be split — dual-mode components accumulate conditionals and rot.
- No component owns scroll state.
- No component creates its own WebGL context.

---

## State management

Deliberately minimal. No global state library.

| State | Owner |
|---|---|
| Altitude | Single context provider, written by the scroll driver |
| World objects | Refs inside R3F, mutated in `useFrame` — never React state |
| ORION conversation | Local component state |
| Form state | Local component state |

**Never put per-frame values in React state.** Anything changing at 60fps lives in a ref.

---

## Technical architecture — Next.js

- App Router, mostly static.
- `WorldCanvas` mounts once in the root layout, above all page content, never unmounts.
- Heavy 3D modules dynamically imported with `ssr: false`.
- `three-globe` and similar must remain SSR-safe — this has already caused one build failure.
- API routes: ORION only.

---

## Folder structure

```
app/
  layout.tsx                    mounts WorldCanvas + Content
  page.tsx                      the single ascent
  api/chat/route.ts             ORION backend
  sections/                     one folder per narrative beat
    ground/  identity/  view/  work/  process/
    instruments/  flight-log/  open-sky/
  components/
    orion/
    ui/
world/                          everything WebGL
  WorldCanvas.tsx
  camera/
  atmosphere/
  terrain/                      existing CubeField, relocated
  cloud/
  sky/
  materials/
  hooks/                        useAltitude, useWorldFrame
lib/
  altitude.ts                   the single scroll → altitude driver
  motion.ts                     shared easings, durations
  orion-prompt.ts
styles/
  tokens.css                    both worlds' tokens
  …
docs/                           this documentation suite
```

Sections are named for **narrative beats**, not for content types. `sections/view/` not `sections/about/`. The folder structure should teach the story to anyone opening the repo.

---

## Coding principles

1. **The world is imperative; the DOM is declarative.** Do not fight either.
2. **Refs for anything per-frame.** State for anything a human changes.
3. **Dispose what you create.** Geometry, materials, textures, listeners.
4. **No magic numbers in components.** Motion constants live in `lib/motion.ts`, colour in tokens.
5. **Every effect must survive the question:** would a visitor notice its absence? If not, delete it.
6. **Comment the why, never the what.**

---

## Performance strategy

### Budget

- **1** WebGL context.
- **60fps sustained** on integrated graphics is the floor, not the target. 120 where the display allows.
- **Zero allocation** during the break.
- Bloom: below deck and break beat 3 only.
- Terrain and sky never co-resident.

### Adaptive quality returns

The earlier decision — *permanent max quality, no adaptive tier* — was reasonable for a two-machine test set. It does not survive contact with a four-year-old work laptop, which is the actual audience for this site.

Adaptive quality is reinstated, but reframed: it is not a downgrade path, it is **what makes the concept work on the hardware that matters.** Tiering affects particle counts, DPR, post-processing passes and cloud sampling — never the narrative, never the break's duration or beats.

### Known warnings, accepted

- `THREE.Clock` deprecation — upstream R3F issue, fix only exists in an unstable major. Leave it.
- Shader `X4122` precision warnings — harmless driver noise from glass materials.

---

## Accessibility strategy

- **`prefers-reduced-motion` is a first-class path, not a fallback.** The story survives as altitude cross-fades. The break becomes a dissolve.
- All content lives in the DOM, above the canvas. Text is selectable, findable, and readable by screen readers. **The canvas is decorative and `aria-hidden`.**
- Keyboard navigation reaches every interactive element in document order.
- Contrast targets met in *both* worlds — the light world is the harder case, and cold ink on pale haze must be verified, not assumed.
- ORION is fully usable by keyboard.
- No information conveyed by colour alone, or by motion alone.

---

## Responsive strategy

Not a scaled-down desktop. The break must work on a phone or the site fails for half its audience.

- **Vertical viewports get more sky.** The horizon sits lower; the composition changes rather than shrinking.
- The frustum-footprint fix for extreme portrait aspect ratios is load-bearing and must survive the world consolidation.
- Touch has no hover: pointer-influence effects degrade to nothing, and anything hover-gated must have a tap path.
- Lower tier by default on mobile — see adaptive quality.
- The break's *duration* never changes across devices. Its fidelity may.

---

## Future scalability

- **Adding a section** = adding an altitude band and a DOM section. It should require no world changes.
- **Adding audio** = one layer reading altitude. Architected for, disabled in V1.
- **Case study pages**, if they arrive, are separate routes that exit the world deliberately — they are not additional altitudes.
- The world must never require knowledge of what content exists at a given altitude.
