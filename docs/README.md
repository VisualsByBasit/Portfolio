# PROJECT DOCUMENTATION

Permanent source of truth for Abdulbasit's portfolio.

---

## Structure

Documents are tiered by **rate of change** and **reader**, not by topic. This is deliberate: a token tweak should never require opening the same file as the narrative thesis.

| # | Document | Changes | Read when |
|---|---|---|---|
| 01 | **VISION** | Almost never | Deciding whether something belongs at all |
| 02 | **DESIGN-LANGUAGE** | Rarely | Deciding how something should feel or look |
| 03 | **EXPERIENCE** | Rarely | Deciding where something sits in the story |
| 04 | **ARCHITECTURE** | At gates | Writing structural or systems code |
| 05 | **DESIGN-SYSTEM** | Often | Writing CSS or component styles |
| 06 | **ROADMAP** | Weekly | Deciding what to build next |
| 07 | **DECISIONS** | Append-only | Wondering "why did we do it this way?" |

Plus `CLAUDE.md` at repo root — the bridge that makes Claude Code actually follow all of this.

---

## Maintenance rules

**1. Each fact lives in exactly one document.**
If something needs saying twice, cross-reference it. Duplication is how documentation dies.

**2. `07-DECISIONS.md` is append-only.**
Never edit or delete a past entry. Supersede it with a new one that references the old ID. The history of rejected ideas is as valuable as the accepted ones.

**3. Documents describe intent, not aspiration.**
If the build diverges from the doc, one of them is wrong. Fix whichever is actually wrong — do not let them quietly disagree.

**4. Unvalidated assumptions must be labelled as such.**
The Cloud Break is a hypothesis until Gate 1 proves it. Documents that state hypotheses as facts are fiction.

**5. `VISION.md` outranks everything.**
When documents conflict, the higher tier wins. When a feature conflicts with the Constitution, the feature loses.
