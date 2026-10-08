# 7E-C.3 — Human Portal product acceptance remediation

Status: **product/technical remediation implemented; Human Portal Acceptance pending**. No recurrence, fifth real window, follow-up, HubSpot write or social effect is authorized by this work.

## Root cause and correction

- Navigation changed the selected tab immediately, but the parent refresh remounted each heavy child after every completed read, including the two-phase initial Cycle lookup. Discovery was fetched independently by several tabs; its current projection is large. The tab could briefly show a new selection with stale/loading content. The parent no longer uses read completion to remount sections; adjacent tab views share a short-lived read-only Discovery promise, invalidated by explicit refresh. Reads have a bounded timeout, and failed Settings/Attention reads no longer masquerade as endless loading or no decisions.
- Live navigation QA found duplicate React sibling keys among tab panels. Changing tabs could leave old Waves/Health sections visible above Settings. Each conditional panel now has a distinct key; the navigation test asserts prior sections are removed.
- Navigation is disabled during the initial authoritative refresh so a click cannot be replayed/lost during hydration and then appear to reset to Overview.
- Primary Discovery and Opportunities both rendered the same full Candidate inventory. Discovery now presents inventory, search context and identity/evidence coverage; Opportunities presents the retained Candidate working pool before Account admission, with rationale, unproven condition and next legitimate step. Source narratives and technical history remain behind disclosure.
- Same-name records are presentation-grouped with Record A/B and distinct underlying IDs. No canonical identity or Engine state is merged.
- Overview now distinguishes the fourth window's decision slot from zero executed research units, zero source requests and zero new company evidence. The decision WorkItem is not described as research execution. A1 acceptance and A2 not-applicable are scoped to that historical window.
- Settings exposes mutability and the active Cycle snapshot before showing the governed pre-activation candidate proposal flow. Work/Health distinguishes recurrence HOLD from configured time and presents listener, work, persisted n8n observations and technical details without treating reachability as fresh workflow evidence.

## Acceptance package for Management

| Surface | Business question |
|---|---|
| Overview | What is the current Cycle state, latest outcome, actual work done, and next boundary? |
| Discovery | What was discovered, where was searched, and which identities/evidence remain unresolved? |
| Same-name group | Why are 3 CG GROUP and Lumexa records separate despite a shared name? |
| Opportunities | Which Candidates remain worth consideration before Account admission, and why? |
| Waves / Scania | What was physically sent, what is waiting, and is follow-up authorized? |
| Needs your attention | Which genuine Management decisions exist now? |
| Settings | Which rules govern this Cycle, and which could only change through a governed future version? |
| Work / Health | Is recurrence held, is the listener available, and what health/work evidence is observable? |

Human acceptance requires a new real Management review of the deployed Portal. Passing automated/agent QA does not constitute that acceptance. Recurrence remains HOLD/unloaded; external effects remain disabled.
