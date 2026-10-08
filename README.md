# Brunova Website

Production public website for Brunova systems engineering and operational intelligence.

## Local development

Supported local toolchain: Node 24, Corepack and the pnpm version pinned in `package.json`.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open `http://localhost:3000`.

## Quality gates

```bash
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:e2e
SITE_URL=http://localhost:3000 corepack pnpm build
corepack pnpm bundle:report
corepack pnpm lighthouse
```

Docker is the authoritative production build/runtime boundary; the VPS does not require host Node or pnpm.

## Production deployment

The canonical architecture is a Next.js standalone image managed by Docker Compose behind a trusted HTTPS reverse proxy. The application port is bound to loopback, the container runs non-root with a read-only filesystem, and no persistent application data is stored locally.

Do not deploy until the production approval gate is complete. The canonical command for an approved revision is:

```bash
cp .env.example .env
# Configure approved production values.
./scripts/deploy.sh
```

Full architecture, environment contract, proxy/TLS requirements, operator commands, rollback, backups and launch checklist:

- [Production deployment](docs/operations/PRODUCTION_DEPLOYMENT.md)
- [Application hardening](docs/operations/HARDENING.md)

Never commit `.env`, credentials, QA artifacts, private specifications or VPS-specific values.

## Branch policy

```text
feature/* → develop → main
```

Feature branches are reviewed through `develop`. `main` represents the explicitly approved production line; deployment work must not bypass that policy.
# Acquisition Portal (3G)

`/portal/acquisition` is dynamically authenticated against the existing Portal
Backend session before rendering. It is noindex/private/no-store. API traffic is
same-origin `/api/acquisition/v1`; no DB/Gateway access or business decisions live
in Web. The typed client validates schema version 1 and the `3g-v1` surface handshake.
The existing operator can inspect evidence and submit confirmed CONTINUE/HOLD/REJECT
with CSRF, stable command identity and expected version. A conflict refreshes detail
without automatically retrying the decision. A network retry retains the original
payload. Counts, eligibility, permitted actions and refill come from Engine.

Cycle, Accounts (outcome filter and cursor pages), primary Attention, and Work/Health
are bounded surfaces. Empty capacity is intentional; no enable-gate, arbitrary CRUD,
buyer/contact, message, email or HubSpot action is present. Refresh is explicit.

For isolated local server-rendered auth checks, `PORTAL_BACKEND_INTERNAL_URL` may
point to a trusted local backend; production defaults to `https://brunova.mx`.
Never point this server-only value at an untrusted origin: it receives the session
cookie for validation. Runtime production uses the existing nginx API boundary.
`tests/unit/acquisition.test.tsx` covers empty/gate/loading/auth states, epistemic
presentation, confirmation/refill, stale conflicts, stable retries and contract drift.

3G is COMPLETE (2026-09-05): 84 tests, typecheck, lint and production build pass.
The deployed Google-authenticated browser completed CONTINUE/HOLD/REJECT through
the UI with deterministic refill (five active; overflow 14 → 11). PostgreSQL audit
confirmed three unique Human commands/receipts and three refill events. Cycle,
Accounts/detail, conflict exclusions and queued/working/completed Work were inspected.
Wide desktop (1440), laptop (1280) and mobile (390) showed no horizontal overflow;
axe reported no violations in the tested detail, confirmation and empty states.

Backend `d40e357d130d` fixes the Google return/Strict-cookie redirect loop without
relaxing cookie security: a same-origin callback document precedes authenticated SSR.
After restoring production, fresh Google login, empty UI/reads, health and logout
204 → session/Engine reads 401 passed. The temporary database was removed and runtime
configuration restored exactly; zero business rows/work, both safety gates disabled.
Web runtime remains `cd6cde03a2a6`. No Gateway, outbound or 3H changes.

## Portal semantics and locale standard (post-3G)

Brunova Portal is the authenticated umbrella workspace, not a Client-only product.
The neutral public sign-in threshold reveals no applications. Its server-rendered
authenticated landing exposes Acquisition only with backend-verified
`VIEW_ACQUISITION`; identities without it see no Acquisition entry. Acquisition
remains an internal operational surface. No future Client modules are implemented.
The shared session reader fails closed; backend capability checks remain authoritative.

The existing route locale drives all Portal-owned copy: `/portal` and
`/portal/acquisition` are EN; `/es/portal` and `/es/portal/acquisition` are ES.
The existing language selector switches equivalent routes. The Acquisition catalog
covers labels, state presentation, errors, dialogs, confirmations and refill; Engine
payloads/enums stay unchanged. Evidence and Human-authored text remain verbatim;
product names, `Work / Health` and technical identifiers are intentionally preserved.

`/portal/login?locale=en|es` forwards to the unchanged Google OIDC endpoint. A
ten-minute, HttpOnly, same-site bounded return-path cookie is consumed at the existing
callback destination to preserve the selected route. It carries no credentials and
grants no access; it is not another locale preference. Only the two Acquisition
routes are accepted, never external return URLs. Logout returns to the same-locale
Portal. Both localized Portal trees are private/no-store/noindex. 3G stays COMPLETE;
this refinement introduces no Engine, DB, Signal or 3H behavior.

Post-3G verification (2026-09-05): Web runtime `2f9b9f8efb5a`; 106 tests,
typecheck, lint and production build pass. Real Chrome QA with the Brunova profile
verified authenticated EN/ES Portal and empty Acquisition, route switching,
desktop/laptop/mobile layouts without horizontal overflow, and ES logout followed
by session/Engine-read 401. Tested surfaces reported no axe violations. Capability
absence and localized forbidden states are covered by isolated tests, not a new
production identity. Backend, Engine, Gateway and database schema are unchanged;
production control verification confirms zero business rows/work, restricted Portal
DB privileges and both safety gates disabled. Public pages and backend live/ready
remain healthy, with `authConfigured=true`.

Post-3G refinement is COMPLETE (2026-09-05). Fresh Google browser round trips
passed in both locales: callback 200 → localized Acquisition 200 → authorized
session/empty Engine reads 200 → logout 204 → same-locale Portal → session/Engine
reads 401. The ES callback consumed the bounded return path with a 307 to the ES
route; EN returned directly to the EN route. Login navigation uses the existing
trusted `SITE_URL`, with a regression test for internal origins/untrusted Host.
All four authenticated routes passed at 1440, 1280 and 390 px, without horizontal
overflow or axe violations. Final production verification retained zero business
rows/pending work, disabled gates and restricted DB privileges. No outbound actions
were invoked. 3G remains COMPLETE; 3H was not started and requires separate scope.
