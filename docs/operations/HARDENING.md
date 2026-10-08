# Brunova Website — Production Hardening

**Status:** Phase 6 implementation record. Phase 7 QA and the final Phase 8 Hallmark audit are intentionally excluded.

## Search indexing contract

| Route            | Policy            | Sitemap            | Rationale                                                                  |
| ---------------- | ----------------- | ------------------ | -------------------------------------------------------------------------- |
| `/`              | index, follow     | yes                | Canonical company entry point                                              |
| `/capabilities`  | index, follow     | yes                | Public capability narrative                                                |
| `/process`       | index, follow     | yes                | Public engagement model                                                    |
| `/work`          | index, follow     | yes                | Approved work index                                                        |
| `/work/[slug]`   | index, follow     | typed records only | Approved anonymized work dossiers                                          |
| `/about`         | index, follow     | yes                | Public company narrative                                                   |
| `/contact`       | index, follow     | yes                | Public conversion route                                                    |
| `/privacy`       | index, follow     | yes                | Public implementation-transparency document; legal review remains required |
| `/portal`        | noindex, follow   | no                 | Controlled access boundary, not acquisition content                        |
| `/api/*`         | noindex, nofollow | no                 | Runtime interfaces, not search documents                                   |
| 404/error states | noindex, nofollow | no                 | Non-content runtime states                                                 |

`SITE_URL` is the sole canonical origin. Work URLs in the sitemap are derived from the typed work records, not a second handwritten slug list. Production indexing requires both `SEO_INDEXING_ENABLED=true` and a non-loopback HTTPS `SITE_URL`; all other environments default to site-wide `noindex` metadata and `Disallow: /` in `robots.txt`.

`robots.txt` is crawler guidance, not access control. Portal and API responses also send `X-Robots-Tag`; portal metadata independently emits `noindex`. The sitemap omits portal, APIs, errors and future routes.

Each public route has a unique title, description and canonical plus matching Open Graph text and a Twitter `summary` fallback. No social handle is claimed. Organization JSON-LD contains only Brunova's name, approved description and canonical URL. Final favicon and Open Graph artwork remain brand-production blockers; the application deliberately does not fabricate replacements.

## Content Security Policy and response headers

Next.js static rendering is preserved. The application owns these headers:

- `Content-Security-Policy`
- `Strict-Transport-Security` in production only
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` as legacy reinforcement of `frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- a restrictive `Permissions-Policy`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

The production CSP permits resources only from the application origin, plus `data:`/`blob:` where current image and worker behavior can require them. It blocks objects, frames and framing, constrains base and form targets, and upgrades insecure requests. `unsafe-eval` exists only in development for the Next.js development runtime.

The production policy currently includes `unsafe-inline` for scripts and styles. This is a narrow, documented compatibility compromise for Next.js hydration, generated font styling and the inline prepaint theme bootstrap. A per-request nonce would make otherwise static public routes dynamic, so Phase 6 does not trade the approved server/static architecture for a nominally tighter policy. No third-party analytics, speculative host or wildcard HTTPS source is allowed.

A reverse proxy may reinforce the same headers, but must not replace them with contradictory or broader values. TLS termination is external to the app. HSTS is useful only after the canonical HTTPS deployment is confirmed; do not add `preload` without a separate domain-wide decision.

## Reverse-proxy trust boundary

The production boundary is:

```text
Internet → trusted reverse proxy → loopback-bound Compose service → Next.js
```

The contact handler validates `Origin` against `SITE_URL` and requires `Sec-Fetch-Site` to be absent or `same-origin`. For its best-effort, per-instance abuse limit it reads `X-Real-IP` first, then the first syntactically valid address in `X-Forwarded-For`; raw addresses are never persisted or sent downstream and are HMAC-hashed with `CONTACT_RATE_LIMIT_SALT`.

Because those forwarded values affect abuse controls, Nginx or its equivalent must overwrite—not append untrusted client values—and the app port must remain bound to loopback or an internal network. Direct public exposure would allow spoofing the address signal and weaken application rate limiting. Provider/proxy rate limiting is recommended defense-in-depth but is not an application startup requirement.

The proxy must preserve `Host` and the public scheme, terminate TLS, cap contact request bodies consistently with the application's 16 KiB limit, and allow the application's bounded eight-second upstream timeout. No Vercel-specific trust convention is used.

## Environment and cache boundaries

Production validation enforces an origin-only HTTPS `SITE_URL`, HTTPS external webhook/portal URLs, an explicit boolean indexing switch and the existing secret/rate-limit constraints. Loopback HTTP remains available for local production-runtime tests. Public content and health can render without contact credentials; contact then fails closed with HTTP 503.

Only `SITE_URL` and `SEO_INDEXING_ENABLED` are build arguments. Webhook URL, bearer secret and rate-limit salt remain runtime-only. They must not appear in image history or browser bundles.

Caching is intentional:

- Public content, metadata, sitemap and robots remain static where Next.js can pre-render them.
- `/portal` is runtime-rendered and sends `private, no-store`.
- `/api/health` and every `/api/contact` response send `no-store`.
- Contact form data and response state are browser state only and are never placed in a shared cache.
- The container retains only a bounded ephemeral writable Next image cache at `/app/.next/cache`.

## Accessibility and performance gates

Automated coverage checks every indexable route in both themes with axe, enforces one H1 and non-skipping heading order, verifies skip-navigation focus, and regresses contact status/focus behavior. Existing responsive coverage includes the dense route set through a 320px viewport, the WCAG 400%-equivalent reflow width for a 1280px layout. Automated checks supplement, not replace, keyboard, zoom, contrast and touch-target inspection.

Production gzip budgets:

| Resource                                                     |  Budget |
| ------------------------------------------------------------ | ------: |
| First-load public-route JavaScript, including shared runtime | 130 KiB |
| Route-specific client JavaScript outside the shared runtime  |  30 KiB |
| CSS                                                          |  35 KiB |
| Initial WOFF2 font transfer                                  | 160 KiB |

The first-load JavaScript line remains a measured warning gate: the pinned Next.js 16.2.11/React 19.2 shared runtime exceeds 130 KiB gzip before route-specific Brunova code. The report does not relabel that target or conceal the miss. Route-specific JavaScript, CSS and font limits fail the command; Lighthouse also reports the total script target as a warning. A framework/runtime change requires a separate architecture decision.

Lighthouse mobile targets are Performance 90, Accessibility 95, Best Practices 95 and SEO 95, with LCP at most 2.5 seconds, INP at most 200 milliseconds and CLS at most 0.10. Lighthouse cannot directly measure field INP in an idle lab run, so total blocking time is kept as a 200ms lab proxy and INP remains a production monitoring target. The two self-hosted font families use `font-display: optional`: fast connections retain the approved typography, while a delayed font request does not replace already rendered text and reset text LCP. Timing-sensitive performance assertions warn locally; deterministic accessibility, best-practices, SEO, CLS and compression regressions fail.

Run against an already started production build or container:

```bash
corepack pnpm bundle:report
LHCI_BASE_URL=http://127.0.0.1:3000 corepack pnpm lighthouse
```

The test set covers three representative route shapes: homepage narrative, contact interaction and a work dossier. Local Lighthouse artifacts are written under `.lighthouseci/` and intentionally ignored by Git.

## Phase 6 verified measurements

Measured on 2026-08-17 against the Node 24.18.0 standalone production container with production indexing enabled:

| Route shape  | Performance | Accessibility | Best Practices | SEO |     LCP range | TBT range | CLS |
| ------------ | ----------: | ------------: | -------------: | --: | ------------: | --------: | --: |
| Homepage     |          95 |           100 |             96 | 100 | 2.929–2.964 s |    7–8 ms |   0 |
| Contact      |          96 |           100 |             96 | 100 | 2.776–2.777 s |      5 ms |   0 |
| Work dossier |          96 |           100 |             96 | 100 | 2.775–2.781 s |   0–12 ms |   0 |

The four category score floors pass. The local mobile-throttled LCP target does not: all three text-led route shapes remain 0.275–0.464 seconds over 2.5 seconds. This is retained as an explicit warning and a production-observation item rather than hidden by relaxing the target. INP cannot be established from this idle lab run; TBT is the recorded lab proxy.

Production gzip measurements:

| Route shape          | First-load JS | Route-specific JS |             CSS | Initial fonts |
| -------------------- | ------------: | ----------------: | --------------: | ------------: |
| Static public routes |     211,846 B |               0 B | 11,035–11,962 B |      64,689 B |
| Contact              |     215,316 B |           3,470 B |        13,667 B |      64,689 B |

Moving browser prevalidation off Zod reduced contact-specific JavaScript from 67,850 B to 3,470 B gzip (64,380 B removed) while keeping Zod as the authoritative server validator. Homepage CSS was split from internal-route/contact CSS. The first-load target remains missed by the pinned shared framework runtime; all enforced route-specific, CSS and font budgets pass.

Automated browser evidence: 66 Playwright tests passed, including axe on every indexable route in light and dark modes. Manual inspection found no horizontal overflow at 320px on Contact or Privacy, no overflow at the 640px 200%-zoom equivalent, intact focus/navigation structure and no browser console warnings. The full Phase 7 browser/assistive-technology matrix remains intentionally deferred.
