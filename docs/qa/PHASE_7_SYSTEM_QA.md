# Brunova Website — Phase 7 System QA

**Date:** 2026-08-17  
**Status:** Complete on `feature/br-017-system-qa`; awaiting review and intentionally unmerged.  
**Scope:** Integrated production-candidate QA only. No feature work, redesign or final Hallmark acceptance was performed.

## Git

- Phase 6 was integrated into `develop` with non-fast-forward merge `ff0c538` (`merge: integrate BR-017 hardening`) and pushed to `origin/develop`.
- Phase 7 was created from that merge as `feature/br-017-system-qa` and pushed before QA work began.
- Phase 7 commits:
  - `d0a49e4 test: add Phase 7 system QA matrix`
  - `aa25aeb fix: avoid redundant not-found robots metadata`
  - `a801bfb docs: record Phase 7 QA state`
  - `e0ea602 fix: preserve system QA boundary checks`
  - `82d64d5 test: stabilize Phase 7 visual evidence`
  - the commit containing this end-of-phase report
- `main` was not modified.
- The private handoff remains ignored and was not staged, committed, copied or published.

## Integrated route matrix

| Route                                               | Expected result | Rendering             | Indexing / cache boundary          | Integrated result |
| --------------------------------------------------- | --------------: | --------------------- | ---------------------------------- | ----------------- |
| `/`                                                 |             200 | static                | index, follow                      | pass              |
| `/capabilities`                                     |             200 | static                | index, follow                      | pass              |
| `/process`                                          |             200 | static                | index, follow                      | pass              |
| `/work`                                             |             200 | static                | index, follow                      | pass              |
| `/work/multi-tenant-financial-integration-platform` |             200 | SSG                   | index, follow                      | pass              |
| `/work/operational-finance-data-infrastructure`     |             200 | SSG                   | index, follow                      | pass              |
| `/work/document-intelligence-workflow`              |             200 | SSG                   | index, follow                      | pass              |
| `/work/fragile-automation-modernization`            |             200 | SSG                   | index, follow                      | pass              |
| `/about`                                            |             200 | static                | index, follow                      | pass              |
| `/contact`                                          |             200 | static page           | index, follow                      | pass              |
| `/portal`                                           |             200 | runtime               | noindex, follow; private, no-store | pass              |
| `/privacy`                                          |             200 | static                | index, follow                      | pass              |
| `/sitemap.xml`                                      |             200 | static metadata route | exactly 11 public URLs             | pass              |
| `/robots.txt`                                       |             200 | static metadata route | environment-dependent policy       | pass              |
| `/api/health`                                       |             200 | runtime               | noindex, nofollow; no-store        | pass              |
| `/api/contact` GET                                  |             405 | runtime               | noindex, nofollow; no-store        | pass              |
| unknown route                                       |             404 | static not-found UI   | noindex, nofollow                  | pass after fix    |

Every applicable document route was checked for its H1, shared header/footer, non-empty description, canonical, Open Graph title, Twitter card and representative security headers. The typed work records remain the single source for approved dossier slugs and sitemap entries.

The only product defect discovered was a 404 metadata interaction: relying solely on Next's automatic `noindex` left the root `index, follow` tag present and did not state `nofollow`. The branded not-found metadata now explicitly adds `noindex, nofollow`; the production container was rebuilt and verified to emit it. No approved public page was redesigned.

## User journeys

The following integrated journeys passed:

- Homepage → Capabilities → related Work.
- Homepage → Work → dossier.
- Homepage → Process → Contact.
- Homepage main CTA → Contact.
- Header CTA → Contact.
- Footer destinations and typed header/footer hrefs.
- Portal → valid configured `PORTAL_URL`.
- Unknown route → branded 404 → Homepage recovery.
- Browser Back and Forward between Work and a dossier.
- Mobile navigation route selection, theme selection and CTA/Portal access.

All rendered links were checked for empty, `#` and `javascript:` destinations. No dead placeholder links were found. Representative production navigation was free of console errors, React/hydration warnings, CSP violations, page errors and failed third-party requests.

## Content integrity

All current public routes were scanned and manually reviewed against the typed records. No duplicate or missing approved work record, stale phase label, TODO/FIXME, placeholder, lorem ipsum, review copy, development wording or public n8n reference was found. No customer identity, metric or claim beyond the approved anonymized records was introduced.

The approved capability terms and the Discover / Design / Build / Evolve sequence are present verbatim. Navigation, CTA and work references remain semantically consistent. No copy was rewritten for preference, and no questionable new public copy requires escalation from this phase.

## Accessibility

### Automated evidence

- Axe completed with zero detected violations across every indexable route in light and dark themes, plus portal and the open mobile dialog.
- The suite verifies one H1, heading progression, landmarks, skip-link behavior, focus restoration, dialog focus containment, form label/error associations, live status behavior and contact-result focus.
- Reflow checks cover 320, 375, 390, 414, 768, 960, 1024, 1280, 1440 and 1920 px where representative depth is useful.
- The 640 px 200%-zoom equivalent and 320 px 400%-reflow equivalent remain covered without horizontal overflow.

### Manual evidence

- All 17 production-container screenshots were inspected for readable hierarchy, visible focus treatment, contrast relationships, diagram integrity, control clipping, footer behavior and light/dark consistency.
- Desktop, tablet and mobile compositions were inspected at the requested representative sizes; no clipped text, orphan heading, narrow unusable column, CTA collision or horizontal overflow was found.
- Keyboard behavior was exercised for skip navigation, form completion, dialog entry/exit, Escape, Close, backdrop dismissal and focus restoration. Contact validation and result announcements retain stable accessible associations.
- Interactive sizing was checked against the 44 px control baseline used by form and mobile navigation controls.

These checks do not constitute a claim of WCAG conformance. A dedicated physical screen-reader/device lab was not used in this phase.

## Contact boundary

The controlled state matrix passed for initial, validation failure, submitting, success, recoverable upstream failure, network failure, rejection, rate limit, service unavailable and unexpected response states. Required values are retained for recoverable failures; upstream bodies and private error text are not rendered.

The release-critical integration regression proves:

```text
browser logical submission UUID
  → Next.js idempotency_key
  → Idempotency-Key header
  → sanitized n8n envelope idempotency_key
```

The same logical UUID survives the chain and logical retries, while `request_id` is newly generated for every server request. The adapter has no automatic retry. The browser never receives the bearer secret, the downstream envelope excludes raw IP, honeypot and timing fields, and the server retains its bounded eight-second timeout.

Abuse-control tests pass for honeypot, suspicious timing, timing-alone acceptance, invalid origin, invalid content type, oversized body, unknown fields, invalid UUID and the rate-limit boundary. Protections were not weakened.

The `/privacy` implementation comparison found the technical statements consistent with the current code: listed contact fields, first-touch attribution in `sessionStorage`, no cookies, no analytics or advertising trackers, server-mediated processing and forwarding only of the sanitized operational envelope. Legal interpretation and approval remain outside this QA phase.

## SEO

- Production titles, descriptions, canonicals, Open Graph, Twitter fallback and conservative Organization JSON-LD passed.
- Production sitemap contains exactly 11 intended public URLs and excludes portal, APIs and error states.
- Production robots allows public content and disallows `/api/` and `/portal`; non-production robots uses `Disallow: /`.
- Portal is `noindex, follow`; APIs and 404 are `noindex, nofollow`.
- A production `SITE_URL=https://brunova.example` produced only HTTPS canonical/sitemap URLs and no localhost leakage.
- Indexing remains fail-closed unless both a valid non-loopback HTTPS origin and `SEO_INDEXING_ENABLED=true` are present.
- Final favicon and production Open Graph artwork remain intentionally absent rather than being replaced with fabricated brand assets.

## Security

The production container returned the approved CSP, HSTS, `nosniff`, frame denial, strict-origin referrer policy, restrictive permissions policy, COOP and CORP. Normal representative navigation produced no CSP console violation.

Portal remained `private, no-store`; Health and every Contact API response remained `no-store`, with the correct `X-Robots-Tag` boundary. Browser traffic was same-origin only, created no cookies and contained no analytics, advertising, external-font or development endpoint request.

The clean image history contained no runtime contact secret variable or value. Only non-secret build configuration enters image arguments. Contact credentials remain runtime-only, and a missing integration fails closed without exposing internal data.

## Runtime

The production build classification remained:

- static: Homepage, About, Capabilities, Contact page, Privacy, Process, Work, Robots, Sitemap and not-found;
- SSG: all four typed Work dossiers;
- dynamic: `/api/contact`, `/api/health` and `/portal` only.

Portal runtime configuration does not make unrelated routes dynamic.

The environment matrix covered local/development-safe indexing, production-like HTTPS/indexing, missing Contact configuration, valid and invalid Portal URL, and valid/invalid production configuration through existing environment tests and clean containers. Public content and Health remain available without Contact configuration; Contact returns a controlled 503. Invalid production origins and portal configuration fail validation.

The branded 404, contact integration unavailable, upstream timeout, invalid/rejected/rate-limited requests, unexpected upstream response and invalid runtime configuration all fail in controlled, non-sensitive ways. No stack trace, secret or trusted upstream body reached the public UI.

## DevOps

A detached clean worktree was used so ignored local files and existing artifacts were not part of the build context. Both `.env.example`-based local configuration and a controlled production-like configuration built successfully with the pinned Node 24.18.0 image.

Container inspection passed:

- healthy application and Health endpoint;
- runtime user `nextjs` / UID 1001, not root;
- read-only root filesystem;
- only the intended bounded tmpfs mounts at `/tmp` and `/app/.next/cache` are writable;
- `no-new-privileges:true`;
- `unless-stopped` restart policy;
- loopback-only host binding (`127.0.0.1`);
- no persistent application volume or unexpected writable application path;
- no runtime secrets in image history.

The complete container route smoke matrix returned the expected 200/404/405 statuses. Missing Contact credentials produced the expected controlled 503.

## Performance regression

Nine Lighthouse mobile runs were executed against the production-like Node 24 container:

| Route shape  | Performance | Accessibility | Best Practices | SEO |     LCP range |  TBT range | CLS |
| ------------ | ----------: | ------------: | -------------: | --: | ------------: | ---------: | --: |
| Homepage     |       95–99 |           100 |             96 | 100 | 1.829–2.931 s | 1.5–7.5 ms |   0 |
| Contact      |          96 |           100 |             96 | 100 | 2.782–2.791 s |     6–9 ms |   0 |
| Work dossier |          96 |           100 |             96 | 100 | 2.776–2.784 s |    5–12 ms |   0 |

The single 1.829 s homepage run was faster than the other two baseline-like runs and is retained without treating it as a new steady-state baseline. Worst-case LCP did not meaningfully worsen from Phase 6 (Homepage 2.964 s, Contact 2.777 s, dossier 2.781 s). Score floors and deterministic assertions passed.

Production gzip measurements are unchanged from Phase 6:

| Route shape          | First-load JS | Route-specific JS |             CSS | Initial fonts |
| -------------------- | ------------: | ----------------: | --------------: | ------------: |
| Static public routes |     211,846 B |               0 B | 11,035–11,962 B |      64,689 B |
| Contact              |     215,316 B |           3,470 B |        13,667 B |      64,689 B |

The accepted shared Next.js 16.2.11 / React 19 runtime warning above the historical approximate 130 KiB target remains visible. The accepted local simulated LCP above 2.5 seconds also remains visible. Neither is a Phase 7 regression or a Phase 8 blocker. Budgets, architecture and visual design were not changed to conceal either observation. LCP must be re-measured on the real production VPS before final production acceptance.

## Visual regression

Seventeen ignored PNGs were generated from production-container rendering under `.qa-artifacts/phase7/screenshots`:

- Homepage desktop light/dark and mobile light/dark.
- Capabilities, Process, Work, one dossier and About desktop.
- Contact desktop initial/success/error and mobile.
- Portal, Privacy and 404 desktop.
- Mobile navigation open.

Hallmark project-scoped principles were used only as a regression-inspection guard. No chromatic accent, redesign or final 58-gate Hallmark audit was introduced.

No product visual defect was found. Chromium's full-page screenshot stitching could paint the correctly off-canvas skip link into a stitched image; the evidence utility now hides that link only while capturing, after the functional focus assertion has passed. This does not alter production rendering.

## Quality

Successful commands and results:

```text
corepack pnpm install --frozen-lockfile
  pass; lockfile unchanged

corepack pnpm format:check
  pass

corepack pnpm lint
  pass; zero warnings

corepack pnpm typecheck
  pass

corepack pnpm test
  17 files passed; 55 tests passed

corepack pnpm test:e2e
  78 Chromium tests passed

SITE_URL=http://localhost:3000 corepack pnpm build
  pass; static/SSG/dynamic classification preserved

BUNDLE_BASE_URL=http://127.0.0.1:3101 corepack pnpm bundle:report
  enforced gates pass; accepted shared-runtime warning retained

LHCI_BASE_URL=http://127.0.0.1:3101 corepack pnpm lighthouse
  9 runs; deterministic assertions pass; accepted timing warnings retained

docker compose config --quiet
docker compose build
docker compose up -d
  pass in clean and controlled production-like projects

QA_BASE_URL=http://127.0.0.1:3101 corepack pnpm qa:visuals
  17 screenshots produced and inspected
```

The host runs Node 22 and emits the expected engine warning; Docker with pinned Node 24.18.0 is the authoritative production-runtime result.

## Remaining blockers

### Blocks Phase 8

- Human review and approval of this unmerged Phase 7 branch/report.
- No newly discovered technical regression blocks Phase 8.

The accepted shared-runtime size and local simulated LCP observations do not block Phase 8.

### Blocks final visual acceptance

- Final supplied favicon.
- Final supplied Open Graph artwork.
- Final vector/logo asset decision where the current approved implementation still depends on the supplied raster mark.
- The Phase 8 whole-site Hallmark audit and human visual acceptance.

### Blocks production deployment / final production acceptance

- Approved merge path from this Phase 7 branch; `main` remains unchanged.
- Real domain, DNS, TLS/reverse-proxy and VPS deployment configuration.
- Production n8n URL/secret, rate-limit salt and downstream idempotency handling.
- Provider/proxy abuse-control decision and trusted forwarded-address configuration.
- Privacy/legal approval.
- Production monitoring, incident and backup/rollback readiness.
- Real-VPS LCP re-measurement before final production acceptance.

## Scope

Phase 8 was not started.
