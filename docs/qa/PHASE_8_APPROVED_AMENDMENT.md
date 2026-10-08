<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# Brunova Website — Phase 8 Approved Utility and Localization Amendment

**Date:** 2026-08-18  
**Branch:** `feature/br-017-final-visual`  
**Status:** Engineering, localization and Hallmark verification complete; awaiting final human visual approval before integration.  
**Authorization boundary:** The approved Phase 8 amendment only. Phase 9, VPS deployment and `main` were not touched.

## 1. Execution summary

The approved utility-navigation amendment is implemented. The masthead theme selector was removed from desktop and mobile navigation and replaced by one restrained bottom-left preference cluster. The public site now has complete English and Latin American Spanish route families, localized content and metadata, and equivalent-path switching. English remains canonical at unprefixed paths; Spanish is crawlable under `/es`.

## 2. Git and private-material boundary

- Work remained on `feature/br-017-final-visual`.
- `develop` and `main` were not merged or modified during implementation.
- `docs/BRUNOVA_HANDOFF_PRIVATE.md`, `.env`, QA screenshots and Lighthouse artifacts remain ignored and were not staged or published.
- The implementation awaits a final human visual decision before any integration step.

## 3. Localization architecture

- Two static Next.js root layouts emit server-correct `<html lang="en">` and `<html lang="es">` without request-header rendering or destructive browser-language redirects.
- Shared page-view components render both languages; the Spanish route tree consists of thin route entries rather than duplicated page implementations.
- Lightweight typed dictionaries cover shell copy, homepage, capabilities, process, About, Privacy, four work summaries, four complete dossiers, Contact and system states.
- Explicit language choice stores only `brunova-locale`; the URL remains the rendering source of truth, preventing language flash and hydration mismatch.
- Equivalent-path switching preserves the current route and work slug in both directions.

## 4. Preference utility

- Resting cluster: appearance icon plus active `EN` or `ES` code.
- Appearance panel: System, Light and Dark; existing `next-themes` behavior and `brunova-theme` persistence are unchanged.
- Language panel: `EN — English` and `ES — Español`.
- The controls have 44 px targets, safe-area offsets, visible focus, selected states, keyboard/radio behavior, Escape dismissal, light outside-pointer dismissal and focus restoration.
- The cluster is independent of the mobile navigation dialog. The footer reserves a lower utility zone so the resting control does not collide with footer identity or links.

## 5. Route and content coverage

The verified route matrix contains 11 English indexable URLs and 11 Spanish equivalents: Home, Capabilities, Process, Work, four dossier slugs, About, Contact and Privacy. Portal remains available in both languages but excluded from indexing and the sitemap. Localized 404 and runtime error states are present for both route families.

Spanish terminology follows professional Latin American usage and preserves normalized technical names where appropriate. No client identity, metric, outcome, credential or commercial claim was added.

## 6. Contact boundary

- The public endpoint remains `/api/contact`.
- Display labels, category labels, validation, success and recoverable/error states are localized.
- Machine category enum values remain unchanged.
- The sanitized envelope adds `locale: "en" | "es"`; requests without a locale default to English for backward compatibility.
- Spanish submissions use `/es/contact`; English submissions retain `/contact`.
- Honeypot, timing, origin, size, idempotency, rate-limit and private n8n boundaries are unchanged.

## 7. SEO and structured data

- Every indexable page emits localized canonical, Open Graph, Twitter and `hreflang` entries for `x-default`, `en` and `es`.
- Organization JSON-LD descriptions follow the active locale without adding unverified fields.
- The sitemap contains exactly 22 indexable localized URLs with alternates.
- `/portal` and `/es/portal` remain `noindex, follow` and excluded from the sitemap; `/api/*` remains excluded; the production robots policy is otherwise unchanged.

## 8. Accessibility and interaction result

The preference panels and all Spanish indexable surfaces pass automated axe checks. The complete bilingual surface passes the Hallmark mobile gates at 320, 375, 414 and 768 px: no horizontal overflow, unprotected display heading, two-line clickable affordance or unlabeled visible SVG. Theme/language independence is covered across all six combinations. No WCAG conformance claim is made.

## 9. Visual QA evidence

The required amendment evidence is generated locally under ignored `.qa-artifacts/phase8/screenshots/phase8-amendment`:

- Desktop 1440 dark: Home resting, utility expanded, Home ES, Capabilities ES and Contact ES.
- Desktop 1440 light: Home resting, utility expanded and Home ES.
- Mobile 390 dark: Home EN, utility open, Home ES and Contact ES.
- Mobile 390 light: Home EN, utility open, Home ES and Contact ES.
- Desktop dark footer/utility collision check.

The evidence is not tracked or published. Macrostructure, typography, palette, logo treatment and approved page compositions remain intact.

## 10. Quality result

- Formatting: pass.
- ESLint: pass with zero warnings.
- TypeScript: pass.
- Unit/integration: 60/60 pass.
- Chromium E2E: 95/95 pass in the complete suite; the expanded bilingual Hallmark route matrix also passes at 320–768 px.
- Production Next build: pass; public localized routes remain static/SSG, with only the existing portal and API boundaries dynamic.
- Docker: pinned Node 24.18.0 build passes; temporary runtime verified as non-root, read-only and `no-new-privileges`, with English/Spanish route and Health smoke checks passing.

## 11. Bundle and Lighthouse result

The utility adds about 1.05 KB gzip of route-specific client JavaScript while total first-load JavaScript is lower than the prior Phase 8 baseline: 210,051 B gzip on English static routes versus 211,846 B previously. Spanish static routes measure 210,052 B; English/Spanish Contact measure 214,358/214,359 B. CSS and font budgets pass.

The supported Node 24 production container passed all enforced Lighthouse assertions across Home, Contact, a dossier, Home ES and Contact ES. Scores were Accessibility 100, Best Practices 96 and SEO 100. Performance was 95–99 with CLS 0 and TBT 0–12 ms. The already accepted warning-only shared-runtime/script budget remains; local LCP stayed in the accepted simulated range (approximately 2.05–2.94 s).

## 12. DevOps boundary

Dockerfile, Compose topology, standalone runtime, VPS-first architecture, API endpoint and downstream automation boundary were not changed. Docker was used only for local validation. No VPS, DNS, TLS, reverse-proxy or production environment action was performed.

## 13. Remaining blockers

- Final human visual approval of this approved amendment.
- Approved favicon and Open Graph artwork remain required under the existing Phase 8 acceptance policy.
- Human/legal Privacy approval remains required before production.
- Integration into `develop` requires explicit authorization after visual approval.
- Phase 9 and production deployment remain separately gated.

## 14. Scope statement

**Phase 9 was not started.**
