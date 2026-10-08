# Increment 7E-C.5 — Human Portal acceptance closure

Status: **technical product remediation complete; Human Portal Acceptance pending**.

## Management contract

The primary Acquisition navigation now contains only the four daily workflows:

1. Overview — what is happening.
2. Opportunities — which organizations remain in consideration and what may happen next.
3. Outreach / Contact — who could be contacted, who has been contacted and who is waiting.
4. Attention — the actual decision requiring Management.

Runtime observability remains available as the secondary **System status / Estado
del sistema** surface. It preserves recurrence, scheduler/listener, PostgreSQL,
n8n transport and inbound, pending work, latest-window health, policy and
activity/audit history without competing with the daily workflows.

## Current authority boundary

The latest operating-window decision is accepted technical evidence, not a
current operating-review task. Attention identifies **Human Portal Acceptance**
as the present boundary. Its decision inspection stays in context and explains:

- what happened and the relevant alternatives;
- why the Engine deferred;
- that no research unit or source request executed;
- that no new company evidence was learned;
- that recurrence remains held, follow-up remains unauthorized and no commercial
  action is pending.

Portal acceptance is not implemented or simulated here. If a Human later accepts
the Portal, recurrence becomes a separate explicit Human decision and is not
enabled automatically.

## Locale and provenance

Management summaries, reasons, open questions, next actions, opportunity state
and outreach state are rendered in the selected locale. Canonical Engine/source
text is not rewritten; when useful, it appears under a clearly labelled
progressive disclosure as original evidence.

## Validation boundary

- Unit/component suite: 150 passed.
- TypeScript, ESLint and production build: passed.
- Full public-site Playwright suite: 133 passed, 19 failed against pre-existing
  public-site expectations unrelated to the authenticated Acquisition changes.
- Candidate archive/restore command coverage: passed; no production Candidate was
  archived or restored.
- No Engine, allocator, recurrence, provider or commercial-effect behavior was
  changed by this increment.

This technical closure must stop for actual Human Portal Acceptance. It does not
authorize recurrence, another real window, Scania follow-up, 7E-D or 7F.
