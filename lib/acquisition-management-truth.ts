import type { acquisitionApi } from "./acquisition-api"

export type DiscoveryTruth = Awaited<
  ReturnType<typeof acquisitionApi.discovery>
>
type Candidate = DiscoveryTruth["candidates"][number]
type Journey = NonNullable<DiscoveryTruth["journeys"]>[number]

const text = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value : ""
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

/** A presentation projection over one authoritative Engine read. It never
 * promotes a Candidate to Account or treats a search market as domicile. */
export function candidateManagementTruth(data: DiscoveryTruth) {
  const journeys = new Map<string, Journey>(
    (data.journeys ?? []).map((journey) => [journey.candidate_id, journey]),
  )
  const latestWave = (data.learningWaves ?? [])[0]
  const targets = new Map(
    (latestWave?.targets ?? []).map((target) => [target.candidateId, target]),
  )
  const nameCounts = new Map<string, number>()
  for (const candidate of data.candidates)
    nameCounts.set(
      candidate.name ?? "",
      (nameCounts.get(candidate.name ?? "") ?? 0) + 1,
    )
  return data.candidates.map((candidate: Candidate) => {
    const journey = journeys.get(candidate.id)
    const target = targets.get(candidate.id)
    const performed = (data.workExecution ?? [])
      .flatMap((execution) => execution.items)
      .filter((item) => item.candidateId === candidate.id && item.outcome)
    const lastPerformed = performed.sort((a, b) =>
      String(b.outcome?.recordedAt).localeCompare(
        String(a.outcome?.recordedAt),
      ),
    )[0]
    const latestInvestigation = [...(journey?.investigations ?? [])].sort(
      (a, b) => b.recordedAt.localeCompare(a.recordedAt),
    )[0]
    const batch = (data.batchCandidates ?? []).find(
      (item) => item.candidate_id === candidate.id,
    )
    const latestRoutine = (data.routineOperatingSessions ?? [])
      .flatMap((session) => session.decisions)
      .filter(
        (decision) =>
          decision.candidateId === candidate.id &&
          record(decision.outcome).recorded_at,
      )
      .sort((a, b) =>
        text(record(b.outcome).recorded_at).localeCompare(
          text(record(a.outcome).recorded_at),
        ),
      )[0]
    const routineOutcome = record(latestRoutine?.outcome)
    const effect = data.firstExploratoryEffect?.find(
      (item) =>
        item.company === candidate.name && item.effect_status === "SUCCEEDED",
    )
    const exactEffect =
      target && effect && nameCounts.get(candidate.name ?? "") === 1
        ? effect
        : null
    const sourceCoverage = new Set(
      performed.map((item) => text(item.selectedDimension)).filter(Boolean),
    )
    for (const origin of journey?.origins ?? [])
      if (origin.source === "remotive-hiring") sourceCoverage.add("JOB")
    const latestOutcome = lastPerformed?.outcome
    const routineIsLatest =
      !!routineOutcome.recorded_at &&
      text(routineOutcome.recorded_at) >= text(latestOutcome?.recordedAt)
    const observation =
      [
        text(routineOutcome.recorded_at),
        latestOutcome?.recordedAt,
        latestInvestigation?.recordedAt,
        candidate.last_seen,
        candidate.first_seen,
      ]
        .filter((date): date is string => !!date)
        .sort()
        .at(-1) ?? null
    return {
      id: candidate.id,
      name: candidate.name ?? "Unknown organization",
      domain: candidate.domain,
      reasons: candidate.reasons,
      nameCollision: (nameCounts.get(candidate.name ?? "") ?? 0) > 1,
      searchMarkets: candidate.market_contexts ?? [],
      identity: candidate.identity_state,
      screen: candidate.screen_state,
      contactState: exactEffect?.contact_strategy_state ?? null,
      followUpAuthority: exactEffect?.follow_up_authority ?? null,
      nextReviewAt: exactEffect?.next_review_at ?? null,
      contacted: exactEffect?.effect_status === "SUCCEEDED",
      coverage: [...sourceCoverage],
      sources: candidate.sources ?? [],
      sightings: candidate.sightings,
      known:
        (routineIsLatest && text(routineOutcome.actual_learning)) ||
        text(latestOutcome?.evidenceSummary) ||
        text(latestInvestigation?.summary) ||
        text(batch?.found_because),
      unknown: text(latestOutcome?.unknownAfter),
      nextAction:
        (routineIsLatest && text(routineOutcome.next_recommendation)) ||
        text(latestOutcome?.nextAction) ||
        text(latestInvestigation?.nextAction) ||
        text(batch?.reviewed_next_action),
      lastAction: observation,
      worthiness:
        text(latestOutcome?.worthinessAfter) || text(batch?.research_outcome),
      lastWorkQuality: routineIsLatest ? text(routineOutcome.quality) : "",
      target: target
        ? {
            why: target.why,
            learningGoal: target.learningGoal,
            hypothesis: target.hypothesis,
            falsifier: target.falsifier,
            yesLearning: target.yesLearning,
            noLearning: target.noLearning,
            noResponseLimits: target.noResponseLimits,
            conversationWorthiness: target.conversationWorthiness,
            person: target.person,
            contactPoints: target.contactPoints,
            contactStrategy: target.contactStrategy,
          }
        : null,
      discoveryReason: text(journey?.origins?.[0]?.reason),
      sourceHypothesis: text(journey?.origins?.[0]?.hypothesis),
      missingCodes: candidate.missing,
      exactEffect,
      journey,
      archived: candidate.archived,
      workspaceReason: candidate.workspace_reason ?? null,
      workspaceActorType: candidate.workspace_actor_type ?? null,
      workspaceChangedAt: candidate.workspace_changed_at ?? null,
    }
  })
}

export function marketContextCounts(data: DiscoveryTruth) {
  return {
    MX: data.candidates.filter(
      (c) => c.market_contexts?.length === 1 && c.market_contexts[0] === "MX",
    ).length,
    US: data.candidates.filter(
      (c) => c.market_contexts?.length === 1 && c.market_contexts[0] === "US",
    ).length,
    ambiguous: data.candidates.filter(
      (c) => !c.market_contexts?.length || c.market_contexts.length > 1,
    ).length,
  }
}

/** Presentation grouping only: same-name Candidates retain distinct identities. */
export function candidateNameGroups(
  candidates: ReturnType<typeof candidateManagementTruth>,
) {
  type CandidateView = (typeof candidates)[number]
  const groups = new Map<string, [CandidateView, ...CandidateView[]]>()
  for (const candidate of candidates) {
    const key = candidate.name.trim().normalize("NFKC").toLocaleLowerCase()
    const existing = groups.get(key)
    if (existing) existing.push(candidate)
    else groups.set(key, [candidate])
  }
  return [...groups.values()]
}
