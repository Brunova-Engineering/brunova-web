# Brunova Production Deployment

Status: production live at `https://brunova.mx` since 2026-08-24. Contact delivery remains intentionally disabled and fail-closed until the missing n8n secret and rate-limit salt are supplied.

This is the authoritative operating document for the Brunova public website. The repository is the deployment package; operators must not edit application source or Compose YAML on the VPS.

## Architecture

```text
Internet
  → DNS A/AAAA record
  → HTTPS reverse proxy on ports 80/443
  → 127.0.0.1:3000 on the VPS
  → Docker Compose web service
  → Next.js 16.2.11 standalone server on Node 24.18.0
  → n8n HTTPS webhook when contact delivery is configured
```

The reverse proxy is a security boundary. The application port stays on loopback. `SITE_URL` is authoritative for canonical metadata and contact-origin validation; the application does not derive its public origin from request forwarding headers.

### Application and container contract

| Area                | Current production decision                                              |
| ------------------- | ------------------------------------------------------------------------ |
| Framework           | Next.js 16.2.11, React 19.2.8, standalone output                         |
| Node                | 24.18.0 Alpine image pinned by digest                                    |
| Package manager     | pnpm 11.22.0 through Corepack; frozen lockfile                           |
| Build               | Multi-stage Docker build; dependencies, build and minimal runtime stages |
| Runtime user        | `nextjs`, UID/GID 1001, non-root                                         |
| Filesystem          | Read-only root; bounded tmpfs at `/tmp` and `/app/.next/cache`           |
| Host exposure       | `127.0.0.1:3000` by default; never public directly                       |
| Health              | `/api/health`; independent of n8n and other optional SaaS                |
| Restart             | `unless-stopped`                                                         |
| Persistent app data | None                                                                     |
| Logs                | Docker `json-file`, 10 MiB × 3 files                                     |
| Release identity    | OCI image/container label `org.opencontainers.image.revision`            |

## Prerequisites

The VPS needs:

- a supported 64-bit Linux distribution;
- Docker Engine with the Compose v2 plugin;
- Git and read access to the repository;
- outbound HTTPS access for image/package retrieval and optional n8n delivery;
- inbound TCP 80 and 443 for the reverse proxy;
- SSH according to operator policy, preferably key-only and restricted by firewall;
- working time synchronization;
- DNS control for the approved hostname.

Host Node and pnpm are not required. Docker is the production build and runtime boundary.

### Conservative capacity baseline

Do not interpret these values as traffic capacity claims.

- Build host: 2 vCPU, 4 GiB RAM and at least 10 GiB free disk are the conservative starting point for repeatable local image builds.
- Runtime-only footprint: the current image is approximately 72 MiB before future changes; 1 vCPU and 1 GiB RAM is a conservative initial allocation for the site container and host proxy.
- If the VPS has less build memory, build a versioned image elsewhere in a later CI/CD increment rather than adding swap-dependent undocumented behavior.

## Environment variables

Create `.env` from `.env.example`. It must remain outside Git and readable only by the deployment operator.

| Name                              | Required           | Phase                  | Secret                                | Expected format                                    | Safe example                                 | Missing/invalid behavior                                                                                                  |
| --------------------------------- | ------------------ | ---------------------- | ------------------------------------- | -------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                        | Yes                | Build + runtime        | No                                    | Canonical non-loopback HTTPS origin, no path/query | `https://example.com`                        | Canonical deployment validation fails                                                                                     |
| `SEO_INDEXING_ENABLED`            | Yes                | Build + runtime        | No                                    | Exactly `true` in production                       | `true`                                       | Deployment validation fails; application otherwise defaults to noindex                                                    |
| `N8N_CONTACT_WEBHOOK_URL`         | Contact activation | Runtime                | Treat as secret                       | Non-loopback HTTPS URL                             | `https://automation.example/webhook/contact` | With all contact values absent, site stays up and contact returns 503; partial/invalid config fails deployment validation |
| `N8N_CONTACT_WEBHOOK_SECRET`      | Legacy Bearer mode | Runtime                | Yes                                   | Non-empty bearer secret                            | generated secret value                       | Mutually exclusive with Basic Auth; retained for legacy workflows                                                         |
| `N8N_CONTACT_BASIC_AUTH_USER`     | Basic Auth mode    | Runtime                | Yes                                   | Non-empty username                                 | operator-supplied value                      | Username and password are required together                                                                               |
| `N8N_CONTACT_BASIC_AUTH_PASSWORD` | Basic Auth mode    | Runtime                | Yes                                   | Non-empty password                                 | operator-supplied value                      | Username and password are required together                                                                               |
| `CONTACT_RATE_LIMIT_SALT`         | Contact activation | Runtime                | Yes                                   | Random value of at least 16 characters             | generated random value                       | Required with either authentication mode                                                                                  |
| `PORTAL_URL`                      | No                 | Runtime                | No; it is eventually sent to browsers | Non-loopback HTTPS URL                             | `https://portal.example/client`              | Portal remains informational without an external action                                                                   |
| `BIND_ADDRESS`                    | Yes                | Compose                | No                                    | `127.0.0.1`                                        | `127.0.0.1`                                  | Deployment validation rejects public binding                                                                              |
| `PORT`                            | No                 | Compose                | No                                    | Unprivileged TCP port, 1024–65535                  | `3000`                                       | Defaults to 3000; invalid value fails validation                                                                          |
| `IMAGE_TAG`                       | No                 | Build/runtime identity | No                                    | Docker tag                                         | Git short SHA                                | `deploy.sh` derives it from Git HEAD                                                                                      |
| `VCS_REF`                         | No human input     | Build metadata         | No                                    | Full Git SHA                                       | derived automatically                        | `deploy.sh` derives it; direct Compose use records `unknown`                                                              |

`NODE_ENV=production`, container `HOSTNAME=0.0.0.0` and internal `PORT=3000` are controlled by the image/Compose definition, not operator inputs.

Test-only variables such as `E2E_PORT`, `LHCI_BASE_URL`, `BUNDLE_BASE_URL`, `QA_BASE_URL` and `CHROME_PATH` are not part of the production runtime contract.

### Environment validation behavior

`./scripts/deploy.sh` builds the image, then runs `scripts/validate-production-env.mjs` inside that image before replacing the running container. Validation rejects:

- missing, non-canonical, loopback or non-HTTPS production `SITE_URL`;
- production indexing not explicitly enabled;
- incomplete contact configuration;
- insecure webhook or portal URLs;
- short rate-limit salt;
- non-loopback application binding;
- invalid host port.

The contact integration is optional as a complete group. With all three contact values absent, the public site remains healthy and `/api/contact` returns a controlled 503. `/api/health` deliberately does not depend on n8n.

## Pre-deployment verification record

Verified on 2026-08-24 from a clean clone of the remote deployment branch, without local dependencies or build output:

- a no-cache multi-stage image build completed successfully;
- `./scripts/deploy.sh` completed from the clean clone with a safe non-production HTTPS origin and contact delivery intentionally disabled;
- the resulting image was approximately 71 MiB;
- the container ran as `nextjs`, with a read-only root filesystem, no persistent mounts, bounded tmpfs mounts, `no-new-privileges`, loopback-only host publishing and the expected restart policy;
- the OCI revision label matched the deployed Git SHA;
- health, public routes, representative dossier, Spanish route, security headers, robots, sitemap, branded 404 and disabled-contact behavior passed the container smoke;
- container logs contained no startup warning or error during the verification window.

This record proves the repository deployment mechanism in an isolated local Docker environment. It does not prove DNS, firewall, TLS, reverse-proxy behavior, n8n delivery, host capacity or real-user performance on the future VPS.

## Production deployment record

Non-secret state verified on 2026-08-24:

| Area                | Production state                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Canonical domain    | `https://brunova.mx`                                                                                               |
| VPS                 | Ubuntu 24.04.3 LTS                                                                                                 |
| Repository          | `/root/brunova/brunova-web`                                                                                        |
| Deployed revision   | `105d5f7a48e0bba824f4be0757d14d231cac0de5`                                                                         |
| Container           | `brunova-web-web-1`, healthy                                                                                       |
| Application binding | `127.0.0.1:3000`; externally unreachable                                                                           |
| Reverse proxy       | Nginx 1.24.0 at `/etc/nginx/sites-available/brunova.mx`; version-controlled production configuration               |
| Canonical redirects | HTTP redirects to HTTPS; HTTP/HTTPS `www` redirects permanently to `https://brunova.mx`                            |
| Proxy headers       | `Host`, `X-Real-IP`, `X-Forwarded-For` and `X-Forwarded-Proto` are overwritten at the trusted boundary             |
| Certificate         | Let's Encrypt ECDSA for `brunova.mx` and `www.brunova.mx`, expiring 2026-11-22; Certbot timer and dry-run verified |
| Contact delivery    | Disabled as a complete group; endpoint remains fail-closed until the missing secret and salt are supplied          |
| Portal              | No external destination configured                                                                                 |

The container, public routes, canonical redirects, TLS chain, canonical metadata, production robots/sitemap, Nginx host routing, security headers, restart behavior and certificate-renewal dry-run pass.

## DNS

Production DNS uses A records for the apex and `www`, both targeting the VPS. No AAAA record is published because the VPS has no global IPv6 address. The apex is canonical and `www` redirects permanently to it. `SITE_URL` is exactly `https://brunova.mx`.

## Firewall and network exposure

Expected public exposure:

- TCP 80: reverse-proxy HTTP listener and certificate challenge/redirect;
- TCP 443: reverse-proxy HTTPS listener;
- SSH: according to operator policy.

Expected private exposure:

- TCP 3000 (or configured `PORT`): bound only to `127.0.0.1`.

Do not publish the application port to `0.0.0.0`. Direct exposure bypasses the trusted forwarded-address boundary and weakens rate limiting.

## Reverse proxy

### Implemented production decision

Nginx is the active production reverse proxy. It:

- terminate TLS and redirect HTTP to HTTPS;
- accept only the approved hostnames;
- proxy to `127.0.0.1:3000`;
- forward `Host` and the public scheme;
- overwrite incoming `X-Real-IP` and `X-Forwarded-For` with the actual peer address;
- enforce a 16 KiB maximum body for `/api/contact`;
- allow more than the application's bounded 8-second n8n timeout;
- preserve the application's CSP and security headers.

The version-controlled production configuration is [`deploy/nginx/brunova.mx.conf`](../../deploy/nginx/brunova.mx.conf). The active VPS file must remain semantically identical except during an atomic, validated update.

Never append an untrusted client-supplied forwarded-address chain. The application uses the validated forwarded address only to derive an in-memory HMAC key; it neither stores nor forwards the raw address.

Reverse-proxy/edge rate limiting is recommended hardening for `/api/contact`, not an application startup blocker. The existing application limit is five attempts per 15 minutes per derived address key and is local to one Node process.

## TLS

- Certificates belong to the production hostname/operator environment, never Git.
- Let's Encrypt certificates are managed by Certbot's Nginx integration.
- The enabled `certbot.timer` handles renewal; a production dry-run passed on 2026-08-24.
- HTTP redirects to HTTPS and `www` redirects to the canonical apex.
- The application already emits production HSTS with one-year `max-age` and `includeSubDomains`; it does not request preload.
- Do not add HSTS preload at the proxy or browser list during initial launch.
- Confirm the HTTPS site is healthy and rollback-ready before considering any stronger domain-wide policy.

## First deployment

Do not run this section until the deployment branch is approved, merged through repository policy, and the production values are supplied.

```bash
git clone git@github.com:jorgeaveraf/brunova-web.git
cd brunova-web
git checkout <approved-production-sha>
cp .env.example .env
chmod 600 .env
# Edit .env with the approved production values.
./scripts/deploy.sh
```

The deployment command:

1. requires Docker, Compose v2 and Git;
2. rejects dirty tracked source and an unprotected `.env`;
3. derives the image tag and OCI revision label from Git HEAD;
4. validates Compose;
5. builds before replacement;
6. validates the production environment inside the built image;
7. starts/updates the service;
8. waits for Docker health;
9. runs route, SEO, security-header, 404 and contact fail-closed smokes;
10. exits non-zero on failure.

This is a single-container VPS deployment. A brief restart window may occur when Compose replaces the container. Zero downtime is not claimed.

## Update deployment

Select an accepted revision explicitly; do not deploy arbitrary feature-branch state.

```bash
git fetch origin --tags --prune
git checkout <approved-production-sha>
./scripts/deploy.sh
```

Keep the previous known-good SHA before updating.

## Health verification

```bash
docker compose ps
./scripts/verify-deployment.sh
curl --fail --silent --show-error http://127.0.0.1:3000/api/health
```

Expected health payload:

```json
{ "status": "ok" }
```

The container smoke verifies homepage, Capabilities, Process, Systems, a representative dossier, About, Contact, Privacy, Portal, Spanish homepage, robots, sitemap, security headers and branded 404 behavior. When contact is intentionally unconfigured it also verifies controlled HTTP 503 without contacting n8n.

## Logs and status

```bash
docker compose ps
docker compose logs -f web
docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$(docker compose ps -q web)"
```

Logs rotate through Docker's `json-file` policy. Application code does not log contact payloads, secrets or raw client addresses. A request ID is sent to n8n for downstream correlation when contact delivery is enabled.

## Contact verification

There are two separate launch checks:

1. Endpoint boundary: with integration disabled, valid same-origin submissions must return controlled 503. The clean-room smoke covers this.
2. End-to-end delivery: after real n8n values are configured, submit one authorized test through the browser and confirm exactly one downstream record with matching `request_id` and `idempotency_key`.

The browser never receives the n8n bearer secret and never calls n8n. Brunova's server sends a sanitized schema-only envelope, preserves the browser idempotency key, creates a request ID, uses an eight-second timeout, follows no redirects and performs no automatic retries.

### Required n8n workflow contract

The search/AI attribution extension is defined in [`SEARCH_ATTRIBUTION_CONTRACT.md`](./SEARCH_ATTRIBUTION_CONTRACT.md). A release containing `contact_v2` must not be deployed until its external workflow and CRM approval gate is satisfied.

Before activation, the external workflow owner must confirm that n8n:

- authenticates the bearer secret;
- accepts and persists `request_id` for tracing;
- treats `idempotency_key` as a deduplication key;
- prevents duplicate lead/contact creation;
- stores/routes only the supplied sanitized envelope;
- defines an operational owner and failure destination;
- documents replay and failure handling without exposing secrets downstream.

The repository does not own or deploy the external n8n workflow.

## Restart and stop

```bash
docker compose restart web
docker compose stop
docker compose start
```

Use `docker compose down` only when removing the local Compose container/network is intentional. The application owns no persistent volume.

## Rollback

Rollback is source-identified and rebuildable:

```bash
git fetch origin --tags --prune
git checkout <previous-known-good-sha>
./scripts/deploy.sh
```

After recovery, keep the repository on that detached known-good revision until the incident is understood. Do not force-reset shared branches. Verify health, logs and the public HTTPS route after rollback.

Because the application is stateless and `.env` is external, rollback does not require a database migration or volume restore. A rollback still has a brief container replacement window.

## Backup and recovery

The application owns no database, upload directory or authoritative local state. `/tmp` and the Next.js image cache are ephemeral tmpfs mounts. Back up only:

- the production `.env` in an approved secret/password manager;
- the approved Git SHA or release tag;
- reverse-proxy configuration if the deployed file is not reproduced from this repository example;
- DNS and firewall configuration in the operator's infrastructure records.

Do not back up secrets into Git. TLS private keys/certificates should remain under the proxy's managed storage; with automatic issuance they are reproducible after DNS recovery, subject to provider rate limits.

## Minimum launch monitoring

Launch blockers:

- Docker container remains healthy;
- `/api/health` is externally reachable through HTTPS;
- restart count remains stable;
- disk has sufficient free space for image builds and rotated logs;
- one controlled contact submission reaches n8n exactly once after activation.

Canonical checks:

```bash
docker compose ps
docker compose logs --since=30m web
docker inspect --format '{{.RestartCount}}' "$(docker compose ps -q web)"
df -h
```

Prometheus, Grafana and a full CI/CD platform are not required for initial launch. External uptime checks, central log shipping and automated image publication are post-launch improvements.

## Production acceptance checklist

- [ ] Approved production SHA checked out and clean.
- [ ] `.env` has approved values, mode 600 and is ignored by Git.
- [ ] DNS resolves to the intended VPS.
- [ ] Firewall exposes only approved SSH, 80 and 443.
- [ ] Reverse proxy overwrites forwarded address headers.
- [ ] HTTP redirects to canonical HTTPS hostname.
- [ ] Certificate is valid and renewal is configured.
- [ ] `./scripts/deploy.sh` completes successfully.
- [ ] Homepage, Capabilities, Process, Systems and representative dossier pass.
- [ ] About, Contact, Privacy, Portal and branded 404 pass.
- [ ] EN/ES switch, theme switch and mobile navigation pass.
- [ ] Robots, sitemap, canonical metadata and security headers use the production origin.
- [ ] Portal remains noindex; API and 404 remain noindex/nofollow.
- [ ] Contact endpoint is healthy and one end-to-end n8n delivery is deduplicated.
- [ ] Logs contain no secret, raw payload or raw IP disclosure.
- [ ] Rollback SHA is recorded and procedure is understood.
- [ ] Real-VPS/domain LCP is measured for homepage, Contact and one dossier.

## Values required from human for production

Do not place actual values in Git.

| Variable / decision                     | Purpose                                | Secret                     | Example format                                  | Source                         | Required before deploy          |
| --------------------------------------- | -------------------------------------- | -------------------------- | ----------------------------------------------- | ------------------------------ | ------------------------------- |
| Production hostname                     | Canonical public identity and TLS      | No                         | `example.com`                                   | Business/domain owner          | Yes                             |
| Apex/subdomain and `www` policy         | Canonical redirects                    | No                         | apex + `www` redirect                           | Business/domain owner          | Yes                             |
| `SITE_URL`                              | Canonicals, origin validation, sitemap | No                         | `https://example.com`                           | Derived from hostname decision | Yes                             |
| VPS public IPv4/IPv6                    | DNS target                             | Sensitive operational data | provider address                                | VPS provider/operator          | Yes                             |
| SSH/operator access model               | Secure administration                  | Keys are secret            | named users + SSH keys                          | Operator/security owner        | Yes                             |
| DNS control                             | Publish A/AAAA and proxy validation    | Credentials are secret     | registrar/DNS access                            | Domain owner                   | Yes                             |
| Reverse-proxy choice                    | TLS and trusted forwarding             | No                         | approve Caddy or existing Nginx                 | Operator                       | Yes                             |
| `PORTAL_URL`                            | Optional client portal action          | No; browser-visible        | `https://portal.example/client`                 | Portal owner                   | No                              |
| `N8N_CONTACT_WEBHOOK_URL`               | Contact delivery                       | Treat as secret            | HTTPS webhook URL                               | n8n workflow owner             | Yes to activate contact         |
| `N8N_CONTACT_WEBHOOK_SECRET`            | Legacy Bearer authentication           | Yes                        | generated bearer secret                         | n8n workflow owner             | Only for legacy Bearer mode     |
| `N8N_CONTACT_BASIC_AUTH_USER`           | Basic Auth identity                    | Yes                        | operator-supplied username                      | n8n workflow owner             | With Basic Auth mode            |
| `N8N_CONTACT_BASIC_AUTH_PASSWORD`       | Basic Auth credential                  | Yes                        | operator-supplied password                      | n8n workflow owner             | With Basic Auth mode            |
| `CONTACT_RATE_LIMIT_SALT`               | HMAC-derived abuse key                 | Yes                        | random 32+ character value                      | secret manager/operator        | Yes to activate contact         |
| n8n operational owner                   | Delivery, deduplication and failures   | No                         | named accountable owner                         | Business/automation owner      | Yes to activate contact         |
| Privacy/legal approval                  | Publication risk acceptance            | No                         | recorded approval                               | Legal/business owner           | Yes before public launch        |
| Final favicon / social artwork decision | Browser/social presentation            | No                         | approved production assets or explicit deferral | Brand owner                    | Yes or explicit launch deferral |

## Known limitations

- Application rate limiting and idempotency-intent memory are per process and reset on restart.
- The initial deployment replaces one container and may have a short restart window.
- n8n end-to-end delivery cannot be proven until the real workflow and secrets are supplied.
- Production privacy/legal approval remains outside engineering.
- Final favicon and social artwork remain a brand decision; the site intentionally does not fabricate them.
- Initial JavaScript transfer remains above the warning-only 133 KiB budget at approximately 195–200 KiB, depending on route.

## Post-launch improvements

Should complete soon after launch:

- external HTTPS uptime check for `/api/health`;
- alert on container restart/unhealthy state and low disk;
- reverse-proxy rate limiting for `/api/contact` if launch traffic warrants it;
- periodic verification of certificate renewal and n8n delivery.

Optional hardening:

- automated signed/versioned image publishing after the manual process is stable;
- centralized logs and metrics;
- CSP nonce architecture if a future framework decision justifies making static routes dynamic;
- multi-instance/global rate limiting only if the deployment topology changes.

## Post-deployment performance validation

Production Lighthouse measurements were collected on 2026-08-24 against `https://brunova.mx` at revision `105d5f7a48e0bba824f4be0757d14d231cac0de5`. Values are medians from three mobile Lighthouse runs per route:

| Route                                  | Performance | LCP      | TBT  | CLS |
| -------------------------------------- | ----------- | -------- | ---- | --- |
| `/`                                    | 100         | 1,682 ms | 1 ms | 0   |
| `/contact`                             | 99          | 1,865 ms | 1 ms | 0   |
| `/work/document-intelligence-workflow` | 100         | 1,789 ms | 0 ms | 0   |
| `/es`                                  | 100         | 1,262 ms | 3 ms | 0   |
| `/es/contact`                          | 99          | 1,867 ms | 7 ms | 0   |

Accessibility and SEO scored 100 on all five routes; Best Practices scored 96. The historical real-domain LCP acceptance item is closed. Continue measuring after material application, proxy or hosting changes.
