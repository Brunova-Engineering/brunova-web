# Phase 8.2 — Homepage Refinement Sprint

**Branch:** `feature/br-017-final-visual`  
**Scope:** homepage visual and editorial refinement only  
**Status:** implemented; awaiting human visual review

## Homepage assessment

| Section                   | Current-state issue                                                                             | Decision                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Hero                      | Correct transformation, but the labeled-box density read like an internal architecture diagram. | **Visualize** with one reduced boundary model.                             |
| Category positioning      | The page moved directly from proposition to symptoms without naming Brunova's category.         | **Add / compress** as one statement bridge.                                |
| Problem recognition       | Three strong symptoms were present but contained in card-like blocks.                           | **Compress** into ruled evidence and a decisive transition.                |
| Operational Intelligence  | The content was correct but visually resembled a taxonomy.                                      | **Visualize** as an observe → decide → act control loop.                   |
| Capabilities              | Five disciplines were reduced, but still read as five independent services.                     | **Visualize** around one operational-system boundary.                      |
| Architecture before tools | The approved principle was strong but shared emphasis with its supporting framework.            | **Keep / emphasize** through scale and inversion.                          |
| Selected work             | The two-record hierarchy was right; the supporting record still read as a portfolio card.       | **Keep / refine** as one dominant system story plus one evidence record.   |
| Process                   | Four stages were approved, but the horizontal presentation could imply a required timeline.     | **Compress** into entry condition → Brunova action → resulting state rows. |
| Principles                | The content was correct but visually quiet.                                                     | **Keep** with larger, more memorable statements.                           |
| Final CTA                 | Copy and single-action logic were approved.                                                     | **Keep** and increase whitespace.                                          |

No existing section was moved or removed. One concise category bridge was added between the hero and problem-recognition section.

## Signature visual decisions

### Hero boundary

The hero now uses three visual states with fewer labels:

1. fragmented work, data, and systems;
2. one explicit operating-model boundary containing state, decisions, and ownership;
3. one reliable operating flow described as controlled, operable, and scalable.

The visual remains a semantic inline SVG on larger screens and becomes a dedicated three-state reading sequence on mobile. It is static and meaningful without animation.

### Operational Intelligence control loop

Operational Intelligence is represented as Brunova's decision layer:

`Observe (operations + data + systems) → Decide (meaning + boundaries + ownership) → Act (automation + software + AI)`

Operational state returns to the model. AI is one governed capability in the action layer; it is neither the center nor the product.

### Capability field

The five capabilities surround one named operational system. Individual homepage links were reduced to one exploration action so the disciplines read as a combined engineering system rather than a service-card collection.

### Evidence and process

Selected Work retains one dominant case and one supporting case. The supporting case is now an editorial evidence record rather than a filled card. Process is no longer presented as a timeline: each row starts from a recognizable buyer state and identifies the Brunova intervention and outcome.

## Information density and executive scanning

- The 30-second scan is carried by the hero, category bridge, problem transition, Operational Intelligence model, architecture principle, selected proof, and final CTA.
- Supporting prose is limited to one thought per section.
- Technical detail stays on exploration and evidence routes.
- Repeated cards were replaced with rules, boundaries, state changes, and controlled surface inversion.
- English and Spanish use the same semantic order and component model; Spanish is allowed to wrap naturally without reducing its type size.

## Content changes

- Added a concise systems-engineering category statement in EN and ES.
- Added the approved “not another tool / better system” transition in EN and ES.
- Shortened the process entry explanation.
- Reframed the process around four situation-based entry conditions.
- Removed defensive proof language from the Selected Work introduction while retaining anonymization and factual restraint.
- No metrics, client names, logos, testimonials, or outcome claims were added.

## Hallmark check

```text
Philosophy  5/5 — executive recognition and systems thinking drive every composition
Hierarchy   5/5 — category, problem, model, proof, entry and conversation scan independently
Execution   5/5 — semantic desktop/mobile visuals use the locked tokens and real content
Specificity 5/5 — boundaries, state, decisions, ownership and governed AI are Brunova-specific
Restraint   5/5 — achromatic, static, no imagery, gradients, cards, fake proof or SaaS chrome
Variety     5/5 — statement, boundary, control loop, field, hinge, evidence and state rows vary deliberately
```

The final Hallmark review passes 58 / 58 gates. The existing macrostructure was retained by explicit brief direction; its variation knobs changed materially through the reduced hero boundary, category bridge, control loop, connected capability field, editorial evidence treatment, and lateral state-entry process.

## Quality and runtime evidence

- Formatting, lint, and TypeScript: pass.
- Unit tests: 60 / 60 pass.
- End-to-end tests: 100 / 100 pass, including contact behavior, localization, theme, navigation, axe, and responsive checks.
- Production build: pass.
- Bundle report: enforced route-specific JavaScript, CSS, and font budgets pass. Shared first-load JavaScript remains a configured warning at approximately 208 KB gzip on the homepage.
- Lighthouse homepage: Performance 96, Accessibility 100, Best Practices 96, SEO 100; CLS 0 and TBT 7 ms. LCP is a configured warning at approximately 2.77 s.
- Docker Compose configuration, image build, startup, and `/api/health`: pass; runtime is healthy on the QA port.
- Real implementation screenshots: `.qa-artifacts/phase8-2/screenshots/`.

The local shell uses Node 22.22.0 while the repository requires Node 24. Docker validation uses the pinned Node 24 image and passes.

## Phase boundary

Phase 9 was not started. No merge to `develop` or modification of `main` is authorized by this sprint.
