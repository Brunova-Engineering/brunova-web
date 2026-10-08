# Brunova Public Website Editorial Assessment

Status: Approved implementation brief
Language-system reference: `docs/design/BRUNOVA_LANGUAGE_SYSTEM_V1.md`
Source inventory: `docs/BRUNOVA_PUBLIC_WEBSITE_CONTENT_INVENTORY.txt`
Date: 2026-08-23

No public page content has been modified as part of this assessment.

## Cross-site findings

- The homepage already establishes the target voice and core hierarchy.
- Capabilities and Process already use native `<details>` disclosures. Their executive first view exists; density is concentrated inside expanded content.
- System dossiers may use one scoped progressive disclosure for technical depth while preserving the executive first view, accessibility and SEO content availability.
- English uses `ownership`, `accountability` and `responsibilities`; Spanish uses `gobernanza`, `responsables`, `responsabilidad` and `quienes responden`. These terms currently mix system governance with actual human responsibility.
- `Work`, `Selected Work`, `portfolio`, `systems`, `system records`, `Sistemas` and `sistemas desarrollados` describe the same navigation area with different positioning.
- Public Spanish uses both `pipeline` and `flujo` for data movement.
- Metadata sometimes uses terminology that differs from the visible page.

## Route — Capabilities

Routes: `/capabilities`, `/es/capabilities`

### Current issue

The collapsed first view is concise, but each expanded capability carries five equal explanatory groups: problem, approach, outcomes, operational concerns and related systems. The page therefore shifts from an engineering model into documentation when disclosures are opened. The introduction also uses `service lines / servicios aislados`, terminology the language system marks as restricted.

### Content to keep

- Page proposition: five connected engineering disciplines.
- Capability names and short descriptions.
- Class of problem.
- Brunova approach.
- Representative outcomes.
- Related systems as evidence.
- Existing disclosure behavior.

### Content to compress

- Long problem-class paragraphs.
- Long approach paragraphs.
- Outcome lists with overlapping reliability or ownership language.
- Repeated explanations of boundaries, ownership and maintainability across capabilities.

### Content to move deeper

- Operational concerns should remain inside the existing collapsed disclosure and should not be promoted into the first view.
- Detailed implementation boundaries should remain in system dossiers or future deeper capability material.
- No new route is proposed.

### Terminology changes

- Frame the five items as `engineering disciplines / disciplinas de ingeniería` that combine into operational systems.
- Replace system-level Spanish `responsables` with `gobernanza` where the sentence describes authority, data ownership or service ownership.
- Retain person-specific responsibility language only when a person or role is intended.
- Replace public Spanish `pipeline` with a precise `flujo` term where no technical distinction is lost.
- Remove `service lines / servicios aislados` from the page proposition.

### Recommended action

Perform a content-only compression inside the existing disclosures. Preserve all five capability sections and their current interaction. Rewrite metadata and the page introduction around engineering disciplines and operational systems. Do not remove evidence links.

## Route — Process

Routes: `/process`, `/es/process`

### Current issue

The page successfully rejects a mandatory funnel, but each expanded stage explains description, problem, entry knowledge, established outputs and next step. The result is methodologically complete but dense. Metadata, state map and detail headings use different versions of stage names.

### Content to keep

- Lateral entry.
- System-state framing.
- Discover / Design / Build / Evolve.
- Diagnosticar / Diseñar / Construir / Evolucionar.
- Current-state summaries.
- Resulting-state outputs.
- Existing stage disclosures.

### Content to compress

- Stage descriptions that repeat the problem statement.
- Entry-knowledge paragraphs.
- Next-step explanations.
- Repeated definitions of system boundary and production capability.

### Content to move deeper

- Entry conditions, detailed established outputs and next-step explanations remain inside the existing disclosure.
- Timelines remain supporting metadata, not the primary definition of each stage.

### Terminology changes

- Normalize metadata and visible stage naming to the approved stage terms.
- Use `ownership / gobernanza` only for the system-control concept.
- Use human responsibility terms only for handoff to an actual operating owner or team.
- Remove `funnel / embudo` after the no-mandatory-sequence idea is established once.

### Recommended action

Reduce every stage to a clear sequence inside the existing component: current situation, Brunova intervention and resulting state. Retain detailed fields in collapsed content but shorten them materially.

## Route — Work / Systems index

Routes: `/work`, `/es/work`

### Current issue

The records are technically credible, but the English introduction explicitly calls the page an `anonymized portfolio`. Spanish uses `sistemas desarrollados`, which can read as software-development output rather than systems engineering. Navigation and metadata use Work, Selected Work, Systems and Sistemas for the same area.

### Content to keep

- Anonymization.
- Four system records.
- System titles and summaries.
- Capability links.
- No clients, metrics, testimonials or unsupported proof.

### Content to compress

- Record summaries that repeat detail-page introductions.
- Repeated statements about anonymization and absent metrics.

### Content to move deeper

- Architecture, decisions and safeguards remain in each system dossier.
- The index should retain only enough context to distinguish the system classes.

### Terminology changes

- Replace `portfolio` with `selected system records` or `examples of operational systems`.
- Use `engineered systems / sistemas diseñados y construidos`.
- Use EN navigation label `Systems` while retaining the `/work` route.
- Retain ES navigation label `Sistemas`.

### Recommended action

Reframe the introduction and metadata as selected evidence of operational systems engineered around different constraints. Shorten summaries without removing technical distinctions.

## System dossier — Multi-tenant Financial Integration Platform

Routes: `/work/multi-tenant-financial-integration-platform`, `/es/work/multi-tenant-financial-integration-platform`

### Current issue

Context, operational problem, approach and boundary description repeat the same accounting-access and shared-layer idea before engineering decisions appear.

### Content to keep

- Multiple operating entities.
- Shared accounting access.
- OAuth lifecycle and reference resolution.
- Financial reads, writes and recurring reporting.
- Reusable integration boundary.
- Three engineering decisions.
- Outcome and capability links.

### Content to compress

- Repetition of `shared`, `reusable`, `consistent` and `across entities`.
- Overlap between summary, context and system approach.

### Content to move deeper

- OAuth and reference-resolution detail belongs in the boundary diagram and engineering decisions.
- The first view should retain context, boundary and outcome.

### Terminology changes

- Use `operational system / sistema operacional` for the full system.
- Use `integration boundary / límite de integración` for the controlled technical boundary.
- Use `governance / gobernanza` if system authority is introduced; do not substitute a person-specific owner.

### Recommended action

Compress the summary and context into distinct roles: why the system was needed and what boundary was engineered. Preserve all technical decisions in deeper content.

## System dossier — Operational Finance Data Infrastructure

Routes: `/work/operational-finance-data-infrastructure`, `/es/work/operational-finance-data-infrastructure`

### Current issue

The page repeats source systems, reporting flow, warehouse and spreadsheet access across summary, context, problem, approach and diagram. Spanish alternates between `pipeline` and other flow language.

### Content to keep

- Accounting and operational source systems.
- Automated extraction and reporting.
- Shared data warehouse.
- Business-facing spreadsheet access.
- Non-technical users.
- Three engineering decisions.
- Outcome and capability links.

### Content to compress

- Repeated explanation of spreadsheets as the business-facing layer.
- Repeated explanation of the warehouse as shared infrastructure.

### Content to move deeper

- Source-to-warehouse sequence remains in the boundary diagram.
- Interface and access decisions remain in engineering decisions.

### Terminology changes

- Normalize EN around `reporting flow` or the precise pipeline term used by the technical context.
- Prefer `flujo de extracción` and `flujo de reportes` in public Spanish unless `pipeline` conveys a required technical distinction.
- Preserve `data warehouse / almacén de datos`.

### Recommended action

Make the executive first view state the operational constraint and resulting shared reporting infrastructure. Keep the data movement sequence as technical depth.

## System dossier — Document Intelligence Workflow

Routes: `/work/document-intelligence-workflow`, `/es/work/document-intelligence-workflow`

### Current issue

Classification, extraction, validation, human review and downstream handoff recur in nearly every section. The controlled role of AI is strong but repeatedly explained.

### Content to keep

- Operationally sensitive documents.
- Classification and structured extraction.
- Validation and human review.
- Controlled downstream handoff.
- Safeguards.
- AI as assistance, not authority.
- Outcome and capability links.

### Content to compress

- Repeated enumeration of the same five-stage sequence.
- Repeated statements that human judgment remains in control.

### Content to move deeper

- Full sequence remains in the boundary diagram.
- Validation and human-review safeguards remain in the safeguards section.

### Terminology changes

- Use `AI-assisted / asistido por IA`.
- Use `governed / gobernado` for the system-control concept.
- Retain `human review / revisión humana` for the actual human action.

### Recommended action

Use the first view to state the document constraint, the governed boundary and the outcome. Preserve safeguards and engineering decisions as deeper technical evidence.

## System dossier — Fragile Automation Modernization

Routes: `/work/fragile-automation-modernization`, `/es/work/fragile-automation-modernization`

### Current issue

This is the densest dossier. Fragility, unclear boundaries, observability, recovery, idempotency, deployment and documentation recur across context, problem, scaling constraint, approach, diagram, decisions, safeguards and outcome. Spanish system-level control alternates with person-specific `responsables`.

### Content to keep

- Preservation of working behavior.
- Fragility and key-person dependency.
- Clear boundaries.
- Observability, recovery and idempotency.
- Deployment discipline and documentation.
- Scaling constraint.
- Safeguards and outcome.

### Content to compress

- Repeated safeguard lists.
- Repeated explanation that a full rewrite was unnecessary.
- Repeated maintainability language.

### Content to move deeper

- The full safeguard list remains in safeguards.
- Deployment and recovery mechanisms remain in engineering decisions and the boundary diagram.
- The first view should retain the inherited constraint, modernization boundary and resulting operability.

### Terminology changes

- Translate system-level `ownership` as `gobernanza`.
- Replace `responsables` where it describes authority, recovery rules or system evolution.
- Retain person-specific language only where a real operating team receives responsibility.
- Use `automation estate` only in technical English; public Spanish should describe the set of automations directly.

### Recommended action

Separate the inherited working behavior from the operating model added around it. Preserve the technical safeguards once, in their deepest relevant section.

## Route — About / Brunova

Routes: `/about`, `/es/about`

### Current issue

The page is institutionally strong but repeats operational proximity across the opening narrative, company statement and `Close to operations / Vinculados a la operación` facet. Founder-led architecture and team-based delivery also appear in both the statement and facets.

### Content to keep

- Founder-led architecture.
- Team-based delivery.
- Operational proximity.
- Systems engineering company positioning.
- Operational intelligence facet.

### Content to compress

- Repeated explanation of proximity to real operations.
- Duplication between the company statement and facet descriptions.
- Repeated lists of process, data, software and automation.

### Content to move deeper

- Detailed explanation remains in the four facets.
- The opening should carry only the institutional observation and Brunova boundary.

### Terminology changes

- Use `ownership / gobernanza` only for system authority.
- Retain `quienes responden por el resultado` when it refers to actual people.
- Normalize `delivery / ejecución` and avoid switching to generic consulting language.

### Recommended action

Shorten the company statement and facet descriptions while preserving all four institutional principles. Keep the page factual and avoid adding manifesto language.

## Route — Contact

Routes: `/contact`, `/es/contact`

### Current issue

The page structure and tone are approved. Terminology is largely consistent. Spanish uses `Cargo` in the form while Privacy describes the same collected field as `puesto`.

### Content to keep

- Page opening.
- Three expectation statements.
- Six fields and seven categories.
- Validation and error states.
- Privacy statement.
- Success state.

### Content to compress

- None at page level.
- Error messages should remain explicit and actionable.

### Content to move deeper

- None.

### Terminology changes

- Align `Role / Cargo` with the Privacy description of collected fields.
- Retain `operational problem / situación operativa` and `operational context / contexto operativo`.
- Use `operational systems / sistemas operacionales` in the form’s accessible label.

### Recommended action

Make terminology-only edits. Do not expand or restructure the page.

## Route — Portal

Routes: `/portal`, `/es/portal`

### Current issue

The page is already low-density and clear. `Delivery context / contexto de entrega` is the only term that may drift from the approved delivery language.

### Content to keep

- Client-systems boundary label.
- Portal identity.
- Active-client access state.
- Conditional external CTA.
- `noindex` metadata.

### Content to compress

- None.

### Content to move deeper

- None.

### Terminology changes

- Confirm whether `delivery context / contexto de entrega` means implementation context, operating context or client engagement context.
- Retain `client systems / sistemas de clientes`.

### Recommended action

Preserve the page unless the meaning of `delivery context` is clarified. Apply no speculative rewrite.

## Route — Privacy

Routes: `/privacy`, `/es/privacy`

### Current issue

The document is intentionally dense and marked in source as requiring human legal review before production. Editorial compression could change legal or operational meaning. The Spanish field name `puesto` differs from the form label `Cargo`.

### Content to keep

- All four sections.
- All factual descriptions of collection, attribution, server processing, analytics and advertising.
- Current no-cookie statement.
- Session and UTM terminology.

### Content to compress

- None before legal review.

### Content to move deeper

- None.

### Terminology changes

- Align the contact role field name with Contact.
- Preserve technical terms `UTM`, `sessionStorage`, server, honeypot, network address and browser fingerprint.
- Do not replace legal or operational terms solely for stylistic consistency.

### Recommended action

Limit changes to verified terminology parity and submit the resulting copy for human legal review. Do not perform general editorial compression.

## Navigation-label assessment

### Capabilities / Capacidades

Retain. The labels are concise and natural in both languages.

### Process / Proceso

Retain. The labels identify the engagement model without forcing literal stage terminology.

### Work / Sistemas

`Sistemas` communicates the intended Spanish concept more accurately than `Trabajo` or `Proyectos`. EN `Systems` avoids portfolio/agency associations. The approved labels are `Systems / Sistemas`; the route remains `/work`.

### About / Brunova

Retain both. `About` is natural English navigation; `Brunova` is a natural Spanish institutional label. Conceptual parity does not require literal parity.

## Approved implementation scope

Progressive disclosure is approved only for dossier technical depth. The first view retains operational context, system approach and boundary, and outcome. Architecture detail, engineering decisions, safeguards and capability relationships remain available in one accessible secondary layer. Route structure, dossier identity, wayfinding and EN/ES parity remain unchanged.
