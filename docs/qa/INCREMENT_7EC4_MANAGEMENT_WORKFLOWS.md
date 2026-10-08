# Increment 7E-C.4 — Management workflow QA

Status: automated product validation complete; **Human Portal Acceptance pending**.

## Primary model

The authenticated Acquisition surface has five primary workflows:

1. Overview — compact business state and next Management action.
2. Opportunities — Candidate discovery journey plus admitted Account pool.
3. Outreach — ready/proposed, active and historical contact state.
4. Attention — authoritative Management decisions only.
5. Operations — current runtime health first; policy and activity/audit are secondary disclosures.

The UI derives presentation labels from Engine truth. It does not store policy,
archive state or lifecycle authority in browser state. Archived Candidates are
excluded from the active workspace by default and remain inspectable/restorable.
Archive controls appear only with `MANAGE_CYCLE`; every change requires a reason
and goes through the Engine command boundary.

## Automated acceptance

- EN/ES workflow navigation and route-free panel transitions.
- Concise Candidate cards: stage, search context, identity, reason, unknown,
  next legitimate action and Management requirement.
- Same-name Candidates remain grouped without merge.
- Synthetic archive command, policy-disabled readback and refresh callback.
- Current Operations summary before read-only Policy and collapsed Activity/Audit.
- Existing responsive/accessibility/auth regression suites remain authoritative.

No synthetic UI state is written to production. Human acceptance must be performed
against the deployed Portal and recorded separately; it cannot authorize recurrence
or any prospect-facing effect.
