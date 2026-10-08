# BR-017 — Brunova Website v1 Implementation Plan

**Status:** Phase 0/1 and Phase 2 approved and merged into `develop`. Phase 3 authorized on `feature/br-017-homepage`. Phase 4 remains approval-gated.

## 1. Repository assessment

The repository is a greenfield planning scaffold. At the start of Phase 0 it has no Git metadata, application, package manifest, lockfile, CI, Docker, or deployment configuration. Its inputs are the build specification, project-scoped Hallmark skill, `skills-lock.json`, and the approved logo source.

Local tooling observed during planning: Node.js 22.22.0, Corepack 0.34.0, Docker 28.5.2, Docker Compose 2.40.3, and Git 2.50.1. Production and documented development use Node.js 24 Active LTS.

### Logo assessment

The authorization names `doc/logo.png`; the actual approved source is `docs/logo.png`.

- Dimensions: 1254×1254 pixels.
- Actual encoding: JPEG/JFIF despite the `.png` extension.
- Color space: RGB.
- Transparency: none.
- Presentation: warm-white Brunova wordmark on a black square background.
- Size: approximately 46 KiB.
- SHA-256: `2cea7542237223721ae8c5af067b31128a327e29b2db3111737be942b5200463`.

Preserve the source byte-for-byte. Derive a correctly encoded, tightly cropped runtime asset in `public/brand/` while retaining the original wordmark and black background. Do not fabricate transparent/vector geometry or a font-based replacement. A future vector/transparent asset is recommended but does not block Phase 1. Favicon and production Open Graph artwork remain final-visual-acceptance deliverables.

## 2. Architecture decisions

### 2.1 Stack and versions

| Area            | Decision                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime         | Node.js 24 Active LTS                                                                                    |
| Package manager | Latest verified stable pnpm 11.x at scaffold time; exact version pinned in `package.json#packageManager` |
| Framework       | Next.js 16.2.11 Active LTS, App Router, Node runtime                                                     |
| UI              | React and React DOM 19.2.x compatible with Next.js 16.2.11                                               |
| Language        | TypeScript 5.9.3 strict baseline                                                                         |
| Styling         | Tailwind CSS 4.3.x and semantic CSS variables in root `tokens.css`                                       |
| Validation      | Zod 4.x                                                                                                  |
| Theme           | `next-themes` 0.4.x                                                                                      |
| Tests           | Vitest 4.1.x, Testing Library 16.x, Playwright 1.62.x, axe Playwright integration                        |
| Quality         | ESLint 9.x, `eslint-config-next` 16.2.11, Prettier 3.x                                                   |

Use Next.js 16.2.11 Active LTS instead of the 16.3.x Current line for Website v1. Re-evaluate Current only after v1 is stable. Commit `pnpm-lock.yaml`, use frozen-lockfile installs, and do not adopt a new pnpm major without an architecture decision.

Do not add a component framework, animation library, CMS SDK, database, Redis, Vercel-specific data/runtime service, or global client state library.

### 2.2 Canonical deployment

**Canonical production architecture: portable containerized Next.js deployment suitable for a Linux VPS using Docker Compose.** Vercel is an optional preview or alternative target only.

```text
Internet
   │
   ▼
Nginx or equivalent reverse proxy
   │  TLS · host routing · forwarded headers
   ▼
Docker Compose
   └── Next.js standalone container
          ├── public website
          ├── /api/health
          └── /api/contact → n8n
```

Use `output: "standalone"`, a multi-stage Docker build, an exact Node 24 image/digest resolved at scaffold time, Corepack with the pinned pnpm version, a non-root runtime user, restart policy, bounded logging, container health check, and environment-driven configuration. Do not mount application data or require Vercel APIs.

The app runs locally without a reverse proxy. A production host proxy may terminate TLS, route the domain, compress responses, apply additional headers, and forward `Host`, `X-Forwarded-Proto`, and trusted client address headers.

### 2.3 Health endpoint

`GET /api/health` returns HTTP 200 and exactly the simple application-health shape:

```json
{ "status": "ok" }
```

It sets `Cache-Control: no-store`, exposes no secrets or runtime details, performs no n8n request, and is used by Docker/Compose health checks through `127.0.0.1:3000`.

### 2.4 Environment contract

```text
SITE_URL=
N8N_CONTACT_WEBHOOK_URL=
N8N_CONTACT_WEBHOOK_SECRET=
CONTACT_RATE_LIMIT_SALT=
PORTAL_URL=
```

- `SITE_URL` is server-only and drives metadata, canonicals, sitemap, robots, structured data, and origin validation.
- Compose provides non-secret `SITE_URL` at build time because static metadata is generated during `next build`.
- n8n values and the rate-limit salt are runtime-only secrets and never Docker build arguments.
- `PORTAL_URL` is optional and server-only.
- Development defaults to `http://localhost:3000`; production requires HTTPS.
- `.env.example` contains no secrets.

### 2.5 Routes

Required public routes are `/`, `/capabilities`, `/process`, `/work`, `/work/[slug]`, `/about`, `/contact`, `/portal`, and `/privacy`. Utility routes are `/api/contact`, `/api/health`, `/robots.txt`, `/sitemap.xml`, 404, and error boundaries.

Use an `(site)` route group for the future website shell. Content routes are static Server Components. Work pages use typed local content, `generateStaticParams`, and `dynamicParams = false`. Contact and health use the Node runtime.

### 2.6 Server/client boundaries

Server Components are the default for layouts, content, metadata, work/capability rendering, brand wrapper, portal configuration, and page shells.

Client Components are limited to theme provider/control, mobile navigation dialog, contact form state machine, first-touch UTM capture, typed analytics dispatch, and framework-required error boundaries.

### 2.7 Contact idempotency

Preserve the browser-generated `Idempotency-Key` end-to-end:

```text
Browser Idempotency-Key → Next.js /api/contact → n8n idempotency_key
```

Keep two explicit identities:

```ts
type ContactEnvelope = {
  request_id: string
  idempotency_key: string
}
```

- `idempotency_key` is the browser-generated UUID for one logical submission.
- `request_id` is a server-generated UUID for one HTTP request/correlation.
- The server validates but never replaces the browser key.
- n8n receives both identities.
- The browser retains the same key through recoverable retries.
- A new key is generated only after success or a material submitted-value edit after an attempt.
- No automatic server retry follows an ambiguous upstream result.

### 2.8 Abuse controls

Always retain server validation, JSON/content-type enforcement, a 16 KiB body limit, honeypot, timing as a suspicious signal, same-origin checks, idempotency, bounded n8n timeout, best-effort per-instance controls, and safe errors.

Completion under three seconds is never a standalone rejection. It may contribute only when combined with honeypot state, repeated rate behavior, malformed requests, inconsistent identifier reuse, or other server-side abuse signals. Legitimate autofill and prepared responses remain valid.

Provider/edge rate limiting is an additional defense when supported; a paid capability is not an implementation or production blocker.

### 2.9 Design direction

Hallmark route: **Custom/Bespoke**. Macrostructure: **Architectural Narrative**. Vibe: **architectural restraint, warm bone, operational precision**.

The final homepage will use an asymmetric hero and semantic system-boundary diagram. Section structures vary by narrative responsibility; “Architecture before tools” is the visual hinge. No fake dashboards, fake chrome, repeated icon grids, arbitrary gradients, or floating decoration.

The palette is black, near-black, bone, warm white, and warm neutral grays, with no chromatic brand accent. First use neutral high-contrast focus rings: near-black in light mode and bone in dark mode, with offset separation. A chromatic accessibility token requires demonstrated need and explicit design-document approval. Danger/success colors are functional states only and require non-color cues.

All values live in root `tokens.css`; components never improvise color or fonts.

### 2.10 Typography

- Display: Manrope variable, 600–700.
- Body/UI: IBM Plex Sans, 400–600.
- Wordmark: approved raster logo only.

Use at most two families, roman headings, 16px minimum body text, a five-size page maximum, and no fabricated wordmark.

## 3. Git and branch strategy

Initialize with `git init -b main` and configure exactly:

```bash
git remote add origin git@github.com:jorgeaveraf/brunova-web.git
```

Before pushing, verify SSH and inspect remote refs. If unrelated/conflicting history exists, stop without force-pushing.

Create a clean baseline commit on `main`:

```text
chore: initialize Brunova website repository
```

Push `main`, create/push `develop`, then create `feature/br-017-foundation` from `develop`. All Phase 0/1 implementation occurs on the feature branch. Push it without merging.

Never commit secrets, `.env`, generated framework output, test reports, coverage, logs, or local IDE/runtime noise. Commit `.env.example`, the lockfile, Docker configuration, reproducible Hallmark memory, source/design documentation, code, and tests.

Expected feature commits:

1. `docs: record BR-017 design and deployment direction`
2. `chore: scaffold Next.js foundation`
3. `feat: establish Brunova theme and metadata foundation`
4. `chore: add portable container deployment`
5. `test: verify BR-017 foundation`

## 4. Authorized phases

### Phase 0 — Repository and design assessment

Work:

- Initialize/connect Git and establish the required branches.
- Push baseline `main` and `develop`.
- Inspect and preserve the approved logo; derive the runtime dark-backed crop.
- Create `docs/design/DESIGN_DIRECTION.md`.
- Record logo facts, palette, typography, Hallmark Custom/Architectural Narrative, motion-cut stance, responsive constraints, and anti-generic rules.
- Confirm container-first and reverse-proxy boundaries.

Acceptance:

- `main` and `develop` exist remotely.
- Current branch is `feature/br-017-foundation`.
- Baseline contains no secrets/generated output.
- Logo source remains byte-for-byte unchanged.
- Derived asset contains no invented geometry.
- Design direction contains no accidental chromatic brand accent.
- Hallmark critique scores at least 3/5 on all axes.
- No Phase 2 shell/navigation work begins.

### Phase 1 — Foundation

Work:

- Scaffold Next.js 16.2.11 with strict TypeScript.
- Resolve/pin stable pnpm 11.x and commit the lockfile.
- Establish Tailwind, root tokens, and typography.
- Implement light/dark/system theme foundation.
- Implement server-only environment validation.
- Establish base metadata, 404, and error foundation.
- Add `/api/health`.
- Add unit/browser test baselines.
- Add standalone Docker and Compose deployment.
- Add `.env.example`, `.dockerignore`, and operational README.

The root page is a clearly temporary server-rendered foundation smoke surface. It does not implement the final homepage, global navigation, footer, content sections, or contact form.

Acceptance:

- Frozen install, lint, typecheck, unit tests, browser baseline, and production build pass.
- Themes persist without first-paint flash.
- Neutral focus treatment passes contrast checks.
- No visual token drift exists outside `tokens.css`.
- Health endpoint works without n8n.
- Docker image and Compose validate, start, and become healthy.
- Runtime is non-root and contains no secrets.
- README works as the operational entrypoint.
- Feature branch is pushed and unmerged.

## 5. Later phases and authorization state

### Phase 2 — Global shell and typed content

Implement typed content, desktop/mobile navigation, footer, CTA system, semantic layout primitives, no-op analytics, and UTM capture. Acceptance includes accessible mobile focus behavior, complete required destinations, no AI-nav/footer fingerprint, and single-line clickable labels from 320–1920px.

**Authorization:** Approved and merged into `develop` with explicit non-fast-forward merge `4ae0194`.

### Phase 3 — Homepage

Implement the ten-part narrative. Acceptance includes all eight buyer questions in order, exact approved hero copy, exactly five capabilities/four work entries/four stages/three differentiators, no fake proof, fold fit at 1280×800, and Hallmark mobile widths.

**Authorization:** Approved for implementation on `feature/br-017-homepage`; do not merge into `develop` without review.

### Phase 4 — Core routes

Implement capabilities, process, work index/detail, about, portal, privacy, 404, and errors. Acceptance includes four valid work slugs, invalid-slug 404, no public pricing, no fake portal auth, and accurate privacy language.

### Phase 5 — Contact conversion

Implement the full form/API/n8n boundary. Acceptance includes unchanged browser idempotency through n8n, separate correlation identity, no timing-only rejection, preserved input/key on retry, and no secret/upstream leakage.

### Phase 6 — SEO/accessibility/security/performance

Complete metadata, sitemap, robots, truthful JSON-LD, headers, optimization, WCAG 2.2 AA, Lighthouse budgets, Core Web Vitals, and initial JS ≤130 KiB gzip.

### Phase 7 — QA

Run unit/component, Playwright, axe, responsive, browser, theme, reduced-motion, zoom, slow-network, and contact-failure checks.

### Phase 8 — Hallmark audit

Require 58/58, zero unresolved critical/major findings, truthful CSS stamp, and no fabricated proof, fake chrome, generic grids, italic headings, or token drift.

### Phase 9 — Production preparation

Verify clean-VPS Compose deployment, reverse proxy, health/logging, n8n, rollback, and documented operations. No feature branch deploys directly to production.

## 6. Operational workflow

First deployment:

```bash
git clone git@github.com:jorgeaveraf/brunova-web.git
cd brunova-web
cp .env.example .env
# configure production values
docker compose up -d --build
```

Operations:

```bash
docker compose ps
docker compose logs -f
docker compose restart
docker compose up -d --build
```

Update by fetching and fast-forwarding an accepted `main`, then rebuilding. Roll back by checking out a known-good tag/commit and rebuilding. `docker compose pull` becomes primary only if a future CI system publishes versioned images.

README must document local install/dev, lint, typecheck, unit tests, browser tests, production build, Docker build/start/health/logs/stop, VPS first deploy/update/restart/rollback, reverse proxy expectations, secrets, and branch policy.

## 7. CI/CD preparation

Prepare deterministic scripts and frozen-lockfile/container builds for:

```text
feature/* → quality/build checks → develop → integration/preview → main → authorized production
```

Do not automate VPS production deployment during Phase 0/1. Optional Vercel previews must not alter runtime architecture.

## 8. Risks and approval gates

Potential Phase 0/1 blockers: GitHub SSH/permissions, conflicting remote history, incompatible pnpm/Node toolchain, or unavailable Docker daemon. Never force-push conflicting history.

Blocks Phase 2:

- Phase 0/1 report and branch review.
- Typography/design-direction approval.
- Approval of the cropped black-backed logo treatment in navigation context.

Blocks final visual acceptance only:

- Production favicon and OG art.
- Preferred vector/transparent logo if needed.
- Approved detailed case studies, About copy, and founder imagery.

Blocks production only:

- Production `SITE_URL`/DNS/VPS/TLS.
- n8n URL and secret.
- Privacy legal review.
- Monitoring/backup ownership.
- Optional provider-level rate-limit decision.

Defaults: pricing hidden; analytics no-op/no cookies; no cookie banner; no CMS/database/Redis/authentication/Vercel dependency; portal placeholder without URL; no unapproved social links.

## 9. Required Phase 0/1 report

Report Git initialization, remote/connectivity, branches, commits, pushes, current branch/status; created/changed/deferred files; architecture and environment contracts; Docker/Compose/startup/health results; logo/typography/palette/Hallmark decisions; exact quality commands/results; and blockers separated by Phase 2, final visual acceptance, and production.

End with:

> Phase 0 and Phase 1 are complete on `feature/br-017-foundation`. The branch has been pushed and remains unmerged. Phase 2 has not started and requires review approval.
