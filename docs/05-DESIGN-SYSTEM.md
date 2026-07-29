# 05 — DESIGN SYSTEM

*Tier 3. Changes often. Pure reference — philosophy lives in `02-DESIGN-LANGUAGE.md`.*

---

## Colour — below the deck

Existing. Preserved. **Frozen** — no new tokens are added to this world.

| Token | Value | Role |
|---|---|---|
| `--below-base` | `#06060f` | Void |
| `--below-violet` | `#7c3aed` | Primary emission |
| `--below-lavender` | `#a78bfa` | Secondary emission |
| `--below-cyan` | `#22d3ee` | Accent emission |
| `--below-warm` | `#ff5a2e` | ORION alert state only |

Behaviour: **emissive**. Bloom permitted. Glow is meaningful.

## Colour — above the deck

New. Non-emissive. **No bloom, no glow, no self-lit surfaces.**

| Token | Value | Role |
|---|---|---|
| `--above-cloud-lit` | `#F7F9FA` | Sunlit cloud top |
| `--above-cloud-mid` | `#EEF1F4` | Cloud body |
| `--above-cloud-shadow` | `#C9D2DA` | Shadowed cloud, cool |
| `--above-haze` | `#DCE6EE` | Horizon atmosphere |
| `--above-sky-low` | `#7FA3C4` | Sky near horizon |
| `--above-sky-high` | `#4A7196` | Sky toward zenith |
| `--above-ink` | `#1A2028` | Primary text — cold near-black, **never** pure |
| `--above-ink-soft` | `#5A6672` | Secondary text |
| `--above-line` | `#B8C4CE` | Hairlines, dividers |
| `--above-sun` | `#FFF4E0` | The single warm note |
| `--above-instrument` | `#0E5A73` | Non-emissive accent |

### Interpolation

Tokens are written to `:root` as CSS custom properties by the altitude driver. The DOM never computes altitude itself — it reads variables.

**Colour interpolation across the break is not linear.** Linear RGB blending between the two systems produces the muddy blue-grey that kills every scroll-gradient site. The transition is event-shaped: values hold, then move sharply during beats 2–4.

---

## Typography

| | Family | Use |
|---|---|---|
| Primary | **Inter** | All reading text |
| Data | **JetBrains Mono** | Labels, altitudes, instrument readouts, metadata |

Mono reads as *code* below the deck and as *flight data* above it. Same face, two meanings.

### Scale

| Step | Size | Line height | Use |
|---|---|---|---|
| `display` | `clamp(3rem, 8vw, 7rem)` | 0.95 | Hero, the View |
| `h1` | `clamp(2.25rem, 5vw, 4rem)` | 1.05 | Beat titles |
| `h2` | `clamp(1.5rem, 3vw, 2.5rem)` | 1.15 | Section headings |
| `h3` | `1.25rem` | 1.3 | Card titles |
| `body` | `1rem` | 1.6 | Reading |
| `small` | `0.875rem` | 1.5 | Secondary |
| `data` | `0.75rem` | 1.4 | Mono labels, `0.15em` tracking, uppercase |

Above the deck, body line-height increases to `1.75`. Air needs air.

---

## Spacing

Base unit `8px`.

| Token | Value |
|---|---|
| `--s-1` | 8px |
| `--s-2` | 16px |
| `--s-3` | 24px |
| `--s-4` | 40px |
| `--s-5` | 64px |
| `--s-6` | 104px |
| `--s-7` | 168px |

**Section padding below deck:** `--s-5`
**Section padding above deck:** `--s-7`

Above the deck, whitespace roughly doubles. Cramped layouts destroy the illusion of scale faster than any wrong colour.

---

## Motion constants

Defined once in `lib/motion.ts`. No magic numbers in components.

| Token | Value | Use |
|---|---|---|
| `ease.world` | `cubic-bezier(0.16, 1, 0.3, 1)` | Camera, atmosphere, anything large |
| `ease.ui` | `cubic-bezier(0.4, 0, 0.2, 1)` | Local UI |
| `ease.glare` | `cubic-bezier(0.7, 0, 0.84, 0)` | Break beat 3 only — sharp in |
| `dur.instant` | 150ms | Hover feedback |
| `dur.ui` | 400ms | Component state |
| `dur.section` | 900ms | Reveals |
| `dur.world` | 1600ms | Atmosphere shifts |
| `dur.break` | 2400–3000ms | The break, total |

**No spring, no overshoot, no bounce above the deck.** If a value needs a bounce, it is in the wrong world.

---

## Elevation and shadow

Below deck: glow instead of shadow.

Above deck:

| Token | Value |
|---|---|
| `--shadow-near` | `0 2px 12px rgba(26,32,40,0.06)` |
| `--shadow-mid` | `0 12px 40px rgba(26,32,40,0.08)` |
| `--shadow-far` | `0 40px 120px rgba(26,32,40,0.10)` |

Large, soft, low-contrast. Hard shadows do not exist in diffuse light at altitude.

---

## Radii and lines

| Token | Value |
|---|---|
| `--r-sm` | 8px |
| `--r-md` | 16px |
| `--r-lg` | 24px |
| `--hairline` | 1px solid `--above-line` |

Above the deck, hairlines replace borders. Heavy strokes read as UI, and UI breaks the world.

---

## Layout

- Content max-width `1240px`, `1080px` for reading-dense beats.
- 12-column grid, `--s-3` gutter.
- Above the deck, content rarely fills the column — asymmetry and empty space are compositional tools, not accidents.

### Breakpoints

| Name | Width |
|---|---|
| `sm` | 480px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1440px |
| `xxl` | 1920px |

Verified working range: **375px → 2560px.** Extreme portrait aspect ratios have a known frustum edge case — see `04-ARCHITECTURE.md`.

---

## Material reference

| Surface | Below | Above |
|---|---|---|
| Panels | Glass, transmissive, blurred | Matte, opaque, hairline edge |
| Accent objects | Self-lit | Light-receiving |
| Text | Near-white on void | Cold ink on pale haze |
| Depth cue | Glow falloff | Haze and value |
| Post-processing | Bloom | **None** |
