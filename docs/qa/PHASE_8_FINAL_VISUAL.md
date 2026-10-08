<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# Brunova Website — Phase 8 Final Visual Audit

> The original candidate documented below was visually approved subject to the final utility/localization amendment. The current engineering candidate and latest verification are recorded in [PHASE_8_APPROVED_AMENDMENT.md](./PHASE_8_APPROVED_AMENDMENT.md).

**Date:** 2026-08-18  
**Status:** Engineering and Hallmark audit complete on `feature/br-017-final-visual`; awaiting human visual approval and intentionally unmerged.  
**Scope:** Final whole-site visual, brand and Hallmark acceptance candidate only. No feature, architecture, performance-optimization or deployment work was performed.

## Git

- Approved Phase 7 was integrated into `develop` with non-fast-forward merge `281d812` (`merge: integrate BR-017 system QA`) and pushed to `origin/develop`.
- Phase 8 was created from that merge as `feature/br-017-final-visual` and pushed before audit work began.
- Phase 8 commits:
  - `48efcf3 fix: harden display heading reflow`
  - `0210dc1 test: add Phase 8 visual acceptance gates`
  - `f8d9bbc docs: publish Phase 8 final visual report`
  - `f1b1030 test: make Phase 8 evidence capture deterministic`
  - the commit containing this final verification update
- `main` was not modified.
- The private handoff, local environment and visual evidence remain ignored and were not staged, committed, copied or published.

## Hallmark

Source: project-scoped `.agents/skills/hallmark`, version 1.1.0, using its current 58-gate system (numbered gates 1–57 plus 38a). The audit covered the completed application, not a single representative page.

### Result

| Pass      | Result | Critical | Major |  Minor |
| --------- | -----: | -------: | ----: | -----: |
| Initial   |  57/58 |        0 |     0 |      2 |
| Corrected |  58/58 |        0 |     0 | 0 open |

The two findings belonged to the same failed responsive gate but affected separate selectors:

| Finding                                                                  | Where                                                                              | Severity | Disposition                                                               |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| About display heading explicitly disabled emergency long-word wrapping   | `/about`; `.about-thesis .heading--1` in `app/core-routes.css`                     | Minor    | Changed to `overflow-wrap: anywhere`; typography and copy unchanged       |
| Contact form/result display headings lacked local shrink/wrap protection | `/contact`; `.contact-form__heading h2`, `.contact-result h2` in `app/contact.css` | Minor    | Added `min-width: 0` and `overflow-wrap: anywhere`; composition unchanged |

Neither omission produced clipping with current approved copy, but both were genuine robustness defects under Hallmark gate 51. Automated regression coverage now checks every route at 320, 375, 414 and 768 px, the 1280×800 hero fold, in-content SVG semantics and both visible logo placements.

### Pre/post critique

```text
Pre:  Philosophy 5/5 · Hierarchy 5/5 · Execution 4/5 · Specificity 5/5 · Restraint 5/5 · Variety 5/5
Post: Philosophy 5/5 · Hierarchy 5/5 · Execution 5/5 · Specificity 5/5 · Restraint 5/5 · Variety 5/5
```

The Execution score increases after the two reflow protections and route-wide regression gate. No score is below 3.

### Accepted intentional decisions

- The approved logo retains its black raster field. Pure black is source-bound brand material, not a newly introduced UI color.
- The adapted two-band N6 masthead and Ft2 inline footer repeat across routes because they are the shared shell, while route bodies retain distinct macrostructures.
- Numbered ledgers remain where content is genuinely ordinal or operational. They are not decorative eyebrow or pill repetition.
- Motion remains cut. No animation was added because no state or system meaning required it.
- The semantic homepage and dossier diagrams remain because they explain system relationships; they are not generic network decoration.

## Whole-site visual review

The audit inspected Homepage, Capabilities, Process, Work, all four dossiers, About, Contact, Portal, Privacy, the branded 404, desktop and mobile navigation, light/dark themes and representative 320, 375, 390, 414, 768, 1024, 1280×800, 1440 and 1920 px layouts.

- **Homepage:** the approved recognition-first sequence remains coherent from hero through final action. Alternating density, inverse hinge and route previews avoid scrolling fatigue and repeated section composition. The architecture-before-tools hinge remains the strongest contrast moment.
- **Hero:** headline, support, actions and semantic diagram remain balanced at 1280×800 and 1440. Essential content fits the first 800 px; lower padding remains intentionally greater than upper padding. Mobile uses the approved semantic sequence rather than a compressed diagram.
- **Capabilities / Process:** the connected field and transfer map remain readable and distinct. Intermediate widths do not create half-collapsed grids or CTA wrapping.
- **Work / dossiers:** editorial folio and technical dossier maintain different information densities without fake proof, dashboard chrome or invented detail. All four dossiers were included in layout checks.
- **About:** the company-thesis composition remains restrained; emergency wrapping is now consistent with the system.
- **Contact:** initial, validation, submitting, success, recoverable error, rejected, rate-limit and unavailable states retain the executive-conversation framing. The mobile reading order is intentional, and no API behavior changed.
- **Portal / Privacy / 404:** the access threshold, legal reading surface and recovery surface remain intentionally sparse and integrated with the shell. Privacy remains readable and does not make a legal-conformance claim.
- **Navigation / themes:** desktop and mobile shell behavior remains coherent. Light and dark are peer compositions rather than a primary design and a mechanical inversion.

No clipping, collision, horizontal overflow, weak CTA placement, visual dead zone or production-facing screenshot defect was found after the two robustness corrections.

## Anti-generic review

The whole-site scan found none of the prohibited fingerprints: centered generic SaaS hero, gradient headline, glow, AI network wallpaper, default bento grid, repetitive card system, icon-per-feature grid, excessive pills, floating SaaS navigation, consulting-service tile grid, fake client proof, fake dashboard, invented metrics, four-column SaaS footer, excessive centered alignment, universal rounding or decorative animation.

The route family intentionally varies composition by responsibility while sharing grid, typography, rules, neutral surfaces, CTA hierarchy and content measures. It does not read as generated page-template variation.

## Brand and assets

### Logo

Classification: **B — production-acceptable, but a transparent/vector source is strongly preferred.**

The approved 1045×295 lossless WebP crop renders legibly as a deliberate black plate in light/dark desktop headers, light/dark mobile headers and both footers. Its intrinsic dimensions and source wiring are regression-tested. The plate is more visually explicit on light surfaces and blends into dark surfaces as already approved. A transparent/vector source would improve future placement flexibility, but the current asset is not production-blocking. Engineering must not trace, invert or recreate it.

### Missing production assets

| Asset                       | Status                                               | Recommended delivery                                                                                                             | Integration point                                                                  | Acceptance impact                                         |
| --------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Favicon                     | Missing; no imitation generated                      | Approved SVG favicon where suitable; PNG 32×32 and 48×48; 180×180 PNG for Apple touch; optional legacy multi-size ICO (16/32/48) | Next App Router `app/icon.*`, `app/apple-icon.*` and optional `app/favicon.ico`    | Required before final visual acceptance and public launch |
| Open Graph artwork          | Missing; truthful text-only social metadata retained | Approved 1200×630 PNG or JPEG with safe text margins                                                                             | `app/opengraph-image.*` or explicit metadata image entries after approval          | Required before final visual acceptance and public launch |
| Transparent/vector wordmark | Not supplied                                         | Approved SVG/transparent master produced by the brand owner                                                                      | Replace the current runtime asset only after visual approval and regression review | Strongly preferred; not blocking under classification B   |

Typography remains Manrope for display and IBM Plex Sans for body/UI. The black/bone and warm-neutral OKLCH palette remains intact; no third typeface or chromatic brand accent was introduced.

## Content and privacy boundary

The final public-text scan found no TODO/FIXME, placeholder/lorem copy, phase terminology, internal implementation note, public n8n reference, client identity, invented metric, unsupported claim or generic AI buzzword. Approved commercial wording was not rewritten for taste.

The Privacy page remains aligned with implemented technical behavior: current contact fields, first-touch attribution in `sessionStorage`, no analytics/advertising trackers, server-mediated processing and sanitized forwarding. Human/legal approval remains required; Phase 8 does not provide legal approval.

### Production content and brand readiness

| READY                            | PENDING HUMAN / EXTERNAL                                                          |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Public website copy              | Human/legal Privacy approval                                                      |
| Five capabilities                | Final favicon                                                                     |
| Four-stage process               | Final Open Graph artwork                                                          |
| Four work summaries and dossiers | Final transparent/vector logo decision (strongly preferred, not blocking under B) |
| About                            | Human visual approval of this Phase 8 candidate                                   |
| Contact                          |                                                                                   |
| Portal placeholder               |                                                                                   |
| Privacy technical wording        |                                                                                   |

Infrastructure is intentionally excluded from this content/brand matrix and remains Phase 9 territory.

## Accessibility

The visual corrections preserve contrast, neutral visible focus, semantic controls, 44 px interaction targets, reduced-motion behavior, stable error/status announcements and existing keyboard interactions. Route-wide checks confirm no horizontal overflow, two-line clickable labels or unprotected display headings at Hallmark widths. The existing axe, landmark, focus, dialog, form and state suites remain passing. No WCAG conformance claim is made; no physical screen-reader/device lab was part of Phase 8.

## Performance

Phase 8 changes add no client runtime, font, image or component dependency. Bundle enforcement and Lighthouse deterministic floors remain passing against the production container.

| Route shape  | Performance | Accessibility | Best Practices | SEO | LCP range     | TBT range | CLS |
| ------------ | ----------: | ------------: | -------------: | --: | ------------- | --------: | --: |
| Homepage     |       95–99 |           100 |             96 | 100 | 2.123–2.926 s | 2.5–36 ms |   0 |
| Contact      |          96 |           100 |             96 | 100 | 2.781–2.784 s |    5–6 ms |   0 |
| Work dossier |          96 |           100 |             96 | 100 | 2.778–2.801 s |  11–17 ms |   0 |

First-load JS is unchanged at 211,846 B gzip for static routes and 215,316 B for Contact; Contact route-specific JS remains 3,470 B and initial fonts remain 64,689 B. The reflow declarations add only 5 B gzip to shared core-route CSS (11,967 B) and 7 B to Contact CSS (13,674 B) versus Phase 7. This is the expected direct cost of the correction, not a meaningful regression.

The accepted shared Next.js/React runtime warning remains visible. Timing-sensitive local LCP stays inside the Phase 7 range apart from a 17 ms dossier maximum variation, with unchanged deterministic floors and CLS 0. These observations are not Phase 8 regressions or Phase 9 blockers.

## DevOps

The pinned Node 24.18.0 standalone Docker build, Compose startup, non-root/read-only runtime constraints, Health endpoint, route matrix and missing-contact fail-closed response remain passing from a clean production build. VPS-first architecture, environment boundaries, contact contract and n8n boundary are unchanged. No VPS deployment was performed.

## Visual evidence

Fresh evidence is generated from the production container under ignored `.qa-artifacts/phase8/screenshots`:

- 10 desktop 1440 light screenshots.
- 11 desktop 1440 dark screenshots, including Contact success.
- 2 homepage 1280×800 fold screenshots.
- 6 mobile 390 light screenshots, including open navigation.
- 6 mobile 390 dark screenshots, including open navigation.

Total: **35 required screenshots**. They are grouped into `homepage`, `core-routes`, `contact-states`, `system-states` and `mobile`; local contact sheets live under `.qa-artifacts/phase8/contact-sheets`. Evidence is ignored by Git and is not published. Inspection found no additional visual defect.

## Quality result

The final branch passes frozen install, formatting, lint, typecheck, 55 unit/integration tests, 84 Chromium E2E tests, production build, bundle enforcement, Lighthouse deterministic assertions, Compose configuration/build/startup, route smoke checks, Health and Contact fail-closed verification. The supported production result uses pinned Node 24.18.0 in Docker; the local Node 22 engine warning remains informational.

## Final recommendation

The engineering candidate passes Hallmark 58/58 and is recommended for human visual review. Do not merge it until that review is approved and the missing favicon/Open Graph asset decision is resolved according to the acceptance policy. This report does not claim human visual approval.

## Remaining blockers

### Blocks Phase 9

- Human review and approval of this unmerged Phase 8 branch, report and visual evidence.

The accepted shared-runtime and local simulated LCP warnings do not block Phase 9.

### Blocks final visual acceptance

- Human visual approval of this Phase 8 candidate.
- Final approved favicon.
- Final approved Open Graph artwork.

The vector/transparent logo remains strongly preferred but is not blocking under classification B.

### Blocks production deployment / final production acceptance

- Approved merge path through `develop` to `main`; `main` remains unchanged.
- Human/legal Privacy approval.
- Phase 9 infrastructure and operations work: real domain/DNS/TLS/reverse proxy/VPS, production contact configuration and downstream idempotency, trusted forwarding and abuse controls, monitoring, incident/backup/rollback readiness, and real-VPS performance verification.
- Final approved favicon and Open Graph artwork.

## Scope

**Phase 9 was not started.**
