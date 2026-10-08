import { z } from "zod"
import { portalSessionExpiredEvent } from "@/lib/portal-session-expiry"

const version = z.literal("1")
export const sessionSchema = z.object({
  authenticated: z.literal(true),
  actor: z.object({ email: z.string(), capabilities: z.array(z.string()) }),
  csrfToken: z.string(),
  expiresAt: z.string(),
})
export type PortalSession = z.infer<typeof sessionSchema>
const cycleSchema = z.object({
  schemaVersion: version,
  cycleId: z.string(),
  status: z.string(),
  policy: z.object({ id: z.string(), version: z.string() }),
  outcomeCounts: z.record(z.string(), z.number()),
  stageCounts: z.record(z.string(), z.number()),
})
const accountSchema = z.object({
  schemaVersion: version,
  accountId: z.string(),
  cycleId: z.string(),
  canonicalIdentity: z.object({ domain: z.string(), displayName: z.string() }),
  researchOutcome: z.string().nullable(),
  stage: z.string(),
  latestMaterialActivityAt: z.string().nullable(),
})
const assertionSchema = z.object({
  id: z.string(),
  epistemic_status: z.string(),
  statement: z.string(),
  confidence: z.string(),
  falsifier: z.string().nullable().optional(),
  context: z
    .object({
      dimension: z.string().optional(),
      signalClass: z.string().optional(),
      painFamily: z.string().optional(),
      interventionHorizon: z.string().optional(),
      revalidateAfter: z.string().optional(),
    })
    .optional(),
  known_unknowns: z.array(z.string()).optional(),
})
const detailSchema = accountSchema.extend({
  researchDecision: z
    .object({ buyer_role_hypothesis: z.string().nullable().optional() })
    .nullable()
    .optional(),
  sourceObservations: z.array(
    z.object({
      id: z.string(),
      canonical_uri: z.string(),
      observed_at: z.string().nullable(),
    }),
  ),
  assertions: z.array(assertionSchema),
  knownUnknowns: z.array(z.string()),
  rationale: z
    .object({ summary: z.string().optional() })
    .passthrough()
    .nullable(),
  materialEvents: z.array(
    z.object({ event_type: z.string(), occurred_at: z.string() }).passthrough(),
  ),
})
const prioritySchema = z.object({
  tier: z.enum(["HIGH", "MEDIUM", "LOW"]),
  evidenceConfidence: z.string(),
  hypothesisConfidence: z.string(),
  recommendation: z.string(),
  whyNow: z.array(
    z.object({
      assertionId: z.string(),
      observedContext: z.string(),
      validAsOf: z.string().nullable(),
    }),
  ),
  hardStops: z.array(z.string()),
  limitingFactors: z.array(z.string()),
  supportingAssertionIds: z.array(z.string()),
  knownUnknowns: z.array(z.string()),
  materialUnknowns: z.array(z.string()),
  policyId: z.string(),
  policyVersion: z.string(),
  hypothesisRefs: z.array(
    z.object({ assertionId: z.string(), falsifier: z.string() }),
  ),
})
export const dispositionSchema = z.enum(["CONTINUE", "HOLD", "REJECT"])
const attentionSchema = z.object({
  schemaVersion: version,
  attention_id: z.string(),
  account_id: z.string(),
  cycle_id: z.string(),
  displayName: z.string(),
  domain: z.string(),
  status: z.string(),
  version: z.number().int(),
  stale: z.boolean(),
  eligible: z.boolean(),
  reconsideration_required: z.boolean(),
  next_stage_ready: z.boolean(),
  result: prioritySchema,
  allowedDispositions: z.array(dispositionSchema),
  human: z
    .object({
      decision: dispositionSchema,
      reason: z.string(),
      notes: z.string(),
      decidedAt: z.string(),
    })
    .passthrough()
    .nullable(),
})
const countsSchema = z.object({
  schemaVersion: version,
  configured: z.boolean(),
  counts: z
    .object({
      capacity: z.number(),
      prioritized_count: z.number(),
      active_count: z.number(),
      overflow_count: z.number(),
      eligible_unresolved_count: z.number(),
      candidate_count: z.number(),
    })
    .nullable(),
  tiers: z.object({ high: z.number(), medium: z.number(), low: z.number() }),
})
const healthSchema = z.object({
  schemaVersion: version,
  databaseReady: z.boolean(),
  realAcquisitionDataAllowed: z.boolean(),
  externalEffectsMode: z.string(),
  pendingWorkCount: z.number(),
  oldestPendingAt: z.string().nullable(),
})
const workSchema = z.object({
  schemaVersion: version,
  workItemId: z.string(),
  workType: z.string(),
  state: z.string(),
  attemptCount: z.number(),
  maxAttempts: z.number(),
  availableAt: z.string(),
  correlationId: z.string().nullable(),
})
const page = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() })
export type Cycle = z.infer<typeof cycleSchema>
export type Account = z.infer<typeof accountSchema>
export type AccountDetail = z.infer<typeof detailSchema>
export type Attention = z.infer<typeof attentionSchema>
export type Counts = z.infer<typeof countsSchema>
export type Health = z.infer<typeof healthSchema>
export type Work = z.infer<typeof workSchema>
export type Disposition = z.infer<typeof dispositionSchema>
const crmSchema = z.object({
  intent_id: z.string(),
  status: z.string(),
  version: z.number().int(),
  reason: z.string().nullable(),
  company_id: z.string().nullable(),
  contact_id: z.string().nullable(),
  company_name: z.string(),
  contact_name: z.string(),
  association_observed: z.boolean(),
  authority: z.string(),
  handoffs: z.array(
    z.object({
      handoffId: z.string(),
      reason: z.string(),
      status: z.string(),
      accepted: z.boolean(),
    }),
  ),
})
export type CrmBoundary = z.infer<typeof crmSchema>
export type DispositionInput = {
  schemaVersion: "1"
  commandId: string
  attentionId: string
  expectedVersion: number
  disposition: Disposition
  reason: string
  notes: string
}
export class AcquisitionError extends Error {
  constructor(public status: number) {
    super(`ACQUISITION_HTTP_${status}`)
  }
}
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/acquisition/v1${path}`, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(30_000),
    })
  } catch {
    throw new AcquisitionError(503)
  }
  if (response.status === 401 && typeof window !== "undefined")
    window.dispatchEvent(new Event(portalSessionExpiredEvent))
  if (!response.ok) throw new AcquisitionError(response.status)
  const parsed = schema.safeParse(await response.json())
  if (!parsed.success) throw new AcquisitionError(502)
  return parsed.data
}
const id = encodeURIComponent
const cyclePolicySchema = z.object({
  schemaVersion: version,
  implementationReadiness: z.string(),
  readyForRehearsal: z.boolean(),
  executable: z.literal(false),
  policyHash: z.string(),
  policy: z.object({
    policyId: z.string(),
    policyVersion: z.string(),
    configurationState: z.string(),
    productionExecution: z.literal("DISABLED"),
    geography: z.array(z.string()),
    limits: z.object({
      researchUniverse: z.number(),
      outboundApproved: z.number(),
      waveSize: z.number(),
      waveCount: z.number(),
    }),
  }),
})
const cycleReviewSchema = z.object({
  cycleId: z.string(),
  discovery: z
    .object({
      maximum: z.number(),
      admitted: z.number(),
      stoppedReason: z.string().nullable(),
    })
    .optional(),
  control: z
    .object({
      version: z.number(),
      state: z.string(),
      technical_halt: z.string().nullable(),
      discovery_stop_reason: z.string().nullable(),
    })
    .nullable(),
  pool: z.record(z.string(), z.number()),
  markets: z.array(
    z.object({
      country: z.string().nullable(),
      discovered: z.number(),
      qualified: z.number(),
    }),
  ),
  waves: z.array(
    z.object({
      id: z.string(),
      number: z.number(),
      state: z.string(),
      composition_hash: z.string(),
      composition: z.array(z.object({ accountId: z.string() }).passthrough()),
      members: z
        .array(
          z.object({
            accountId: z.string(),
            company: z.string(),
            domain: z.string(),
            buyer: z.string().nullable(),
            channel: z.string(),
            poolState: z.string().nullable(),
            readinessReason: z.string().nullable(),
            tier: z.string().nullable(),
            reason: z.string().nullable(),
            knownUnknowns: z.array(z.string()).nullable(),
          }),
        )
        .optional(),
    }),
  ),
  attempts: z.number(),
  newProspects: z.number(),
  attemptsToday: z.number(),
  delivery: z.record(z.string(), z.number()).optional(),
  funnel: z
    .object({ handoffs: z.number(), acceptedHandoffs: z.number() })
    .optional(),
  responses: z.record(z.string(), z.number()),
  quality: z.record(z.string(), z.number()),
  zeroResponseMeansFailure: z.literal(false),
  automaticIcpMutation: z.literal(false),
  productionExecution: z.literal("DISABLED"),
})
export type CyclePolicyDefinition = z.infer<typeof cyclePolicySchema>
export type CycleReview = z.infer<typeof cycleReviewSchema>
const poolItemSchema = z.object({
  account_id: z.string(),
  display_name: z.string(),
  canonical_domain: z.string().optional(),
  country: z.string().nullable().optional(),
  pool_state: z.string(),
  readiness_reason: z.string(),
  rationale: z.record(z.string(), z.unknown()).nullable(),
  known_unknowns: z.array(z.string()).nullable(),
  research_version: z.number().nullable(),
  buyer_role_hypothesis: z.string().nullable().optional(),
  intervention_hypothesis: z.string().nullable().optional(),
  buyer_name: z.string().nullable().optional(),
  channel: z.string().optional(),
  binding: z
    .object({ personId: z.string().nullable().optional() })
    .passthrough()
    .optional(),
})
export type CyclePoolItem = z.infer<typeof poolItemSchema>
export const acquisitionApi = {
  buyerPackage: (cycle: string, account: string) =>
    request(
      `/cycles/${id(cycle)}/accounts/${id(account)}/buyer-dry-run`,
      z.object({
        schemaVersion: version,
        package: z
          .object({
            current: z.boolean(),
            messageability: z.string(),
            result: z.object({
              buyer: z.object({
                state: z.string(),
                selected: z
                  .object({
                    name: z.string(),
                    role: z.string(),
                    companyDomain: z.string(),
                    sourceUri: z.string(),
                    observedAt: z.string(),
                    confidence: z.string(),
                    supports: z.array(z.string()),
                  })
                  .nullable(),
              }),
              contact: z
                .object({
                  type: z.string(),
                  state: z.string(),
                  sourceUri: z.string(),
                })
                .nullable(),
            }),
          })
          .nullable(),
      }),
    ),
  cyclePool: (cycle: string, after?: string) =>
    request(
      `/cycles/${id(cycle)}/pool?limit=25${after ? `&after=${id(after)}` : ""}`,
      z.object({ schemaVersion: version, items: z.array(poolItemSchema) }),
    ),
  cyclePolicy: () => request("/cycle-policy", cyclePolicySchema),
  discovery: () =>
    request(
      "/discovery",
      z.object({
        schemaVersion: version,
        state: z.enum(["NO_ACTIVE_CYCLE", "WORK_PENDING", "WAITING"]),
        reviewBatches: z
          .array(
            z.object({
              id: z.string(),
              cycle_id: z.string(),
              state: z.string(),
              maximum_new: z.number(),
              new_candidates: z.coerce.number(),
              retained_baseline_count: z.number(),
              direction: z.string().nullable(),
              stop_reason: z.string().nullable(),
            }),
          )
          .optional(),
        batchCandidates: z
          .array(
            z.object({
              batch_id: z.string(),
              candidate_id: z.string(),
              name: z.string(),
              identity_state: z.string(),
              admission_state: z.string().nullable(),
              account_id: z.string().nullable(),
              market_context: z.string().nullable(),
              source: z.string(),
              found_because: z.string().nullable().optional(),
              investigation_summary: z.string().nullable().optional(),
              reviewed_next_action: z.string().nullable().optional(),
              screen_state: z.string().optional(),
              research_outcome: z.string().nullable().optional(),
              origin_mode: z.string().optional(),
            }),
          )
          .optional(),
        authenticatedResearch: z
          .array(
            z.object({
              id: z.string(),
              cycle_id: z.string(),
              uri: z.string(),
              profile: z.literal("Jorge"),
              surface: z.string(),
              status: z.string(),
              receipt: z.record(z.string(), z.unknown()).nullable(),
              created_at: z.string(),
              completed_at: z.string().nullable(),
            }),
          )
          .optional(),
        commercialCalibration: z
          .array(
            z
              .object({
                calibration_id: z.string(),
                cycle_id: z.string(),
                candidate_id: z.string(),
                name: z.string().nullable(),
                current_engine_state: z.string(),
                internal_need: z.literal("UNKNOWN"),
                strict_result: z.string(),
                conversation_worthiness: z.string(),
                reason: z.string(),
                material_falsifier: z.string(),
                outreach_learning_goal: z.string(),
                market: z.string(),
              })
              .passthrough(),
          )
          .optional(),
        workAllocation: z
          .array(
            z.object({
              id: z.string(),
              cycle_id: z.string(),
              rationale: z.string(),
              status: z.string(),
              created_at: z.string(),
              expires_at: z.string(),
              inventory_snapshot: z.record(z.string(), z.unknown()),
              items: z.array(
                z.object({
                  position: z.number(),
                  workClass: z.string(),
                  candidateId: z.string().nullable(),
                  accountId: z.string().nullable(),
                  dimension: z.string().nullable(),
                  expectedInformationGain: z.string(),
                  reason: z.string(),
                  stopCondition: z.string(),
                  budget: z.object({
                    maxRequests: z.number(),
                    maxMinutes: z.number(),
                  }),
                  status: z.string(),
                }),
              ),
            }),
          )
          .optional(),
        conversationPolicy: z
          .object({
            version: z.number(),
            cycle_id: z.string(),
            base_policy_version: z.string(),
            base_policy_hash: z.string(),
            definition: z.record(z.string(), z.unknown()),
            definition_hash: z.string(),
            approved_at: z.string(),
            executable: z.boolean(),
            outreach_authorized: z.boolean(),
            account_admission_changed: z.boolean(),
          })
          .nullable()
          .optional(),
        workExecution: z
          .array(
            z.object({
              plan_id: z.string(),
              cycle_id: z.string(),
              status: z.string(),
              created_at: z.string(),
              expires_at: z.string(),
              approved_at: z.string().nullable(),
              semantic_policy_version: z.number().nullable(),
              items: z.array(
                z
                  .object({
                    position: z.number(),
                    candidateId: z.string().nullable(),
                    workClass: z.string(),
                    proposedDimension: z.string().nullable(),
                    selectedDimension: z.string().nullable(),
                    companyValue: z.string().nullable(),
                    jobValue: z.string().nullable(),
                    socialValue: z.string().nullable(),
                    reason: z.string().nullable(),
                    expectedInformationGain: z.string().nullable(),
                    stopCondition: z.string().nullable(),
                    budget: z
                      .object({
                        maxRequests: z.number(),
                        maxMinutes: z.number(),
                      })
                      .nullable(),
                    executionRequest: z
                      .record(z.string(), z.unknown())
                      .nullable(),
                    outcome: z
                      .object({
                        workItemId: z.string(),
                        strictBefore: z.string(),
                        worthinessBefore: z.string(),
                        hypothesisBefore: z.string(),
                        unknownBefore: z.string(),
                        actualToolsSources: z.array(z.unknown()),
                        actualRequests: z.number(),
                        actualMinutes: z.number(),
                        evidenceSummary: z.string(),
                        falsifiers: z.string(),
                        strictAfter: z.string(),
                        worthinessAfter: z.string(),
                        hypothesisChange: z.string(),
                        unknownAfter: z.string(),
                        nextAction: z.string(),
                        selectedDimensionInformative: z.boolean(),
                        changedDecision: z.boolean(),
                        budgetJustified: z.boolean(),
                        betterDimension: z.string().nullable(),
                        enrichmentVsDiscovery: z.string(),
                        remainingUnknownInternal: z.boolean(),
                        recordedAt: z.string(),
                      })
                      .nullable(),
                  })
                  .passthrough(),
              ),
            }),
          )
          .optional(),
        channelCapabilities: z
          .array(
            z.object({
              version: z.number(),
              channel: z.string(),
              capabilities: z.record(z.string(), z.unknown()),
              limitations: z.string(),
              evidence: z.array(z.unknown()),
              assessed_at: z.string(),
            }),
          )
          .optional(),
        targetResolution: z
          .array(
            z.object({
              id: z.string(),
              cycle_id: z.string(),
              source_wave_id: z.string(),
              rationale: z.string(),
              fourth_slot_empty: z.literal(true),
              broad_discovery_paused: z.literal(true),
              outreach_authority: z.literal("NONE"),
              created_at: z.string(),
              items: z.array(z.record(z.string(), z.unknown())),
            }),
          )
          .optional(),
        copyReviews: z
          .array(
            z.object({
              id: z.string(),
              wave_id: z.string(),
              review: z.record(z.string(), z.unknown()),
              effects_authorized: z.literal(false),
              created_at: z.string(),
            }),
          )
          .optional(),
        firstExploratoryEffect: z
          .array(
            z.object({
              company: z.string(),
              decision: z.string(),
              message_version: z.number().nullable(),
              subject: z.string().nullable(),
              text: z.string().nullable(),
              message_hash: z.string().nullable(),
              authorization_id: z.string().nullable(),
              intent_id: z.string().nullable(),
              work_item_id: z.string().nullable(),
              effect_status: z.string().nullable(),
              attempt_id: z.string().nullable(),
              attempted_at: z.string().nullable(),
              provider_observation: z.unknown().nullable(),
              contact_strategy_state: z.string().nullable(),
              next_review_at: z.string().nullable(),
              follow_up_authority: z.string().nullable(),
              logical_attempts: z.number().nullable(),
            }),
          )
          .optional(),
        postEffectReconciliation: z
          .array(
            z.object({
              cycle_id: z.string(),
              scania_message_learning: z
                .record(z.string(), z.unknown())
                .nullable(),
              capability_claim_map: z
                .record(z.string(), z.unknown())
                .nullable(),
              message_quality_policy: z
                .record(z.string(), z.unknown())
                .nullable(),
              n8n_expected_contracts: z.array(z.unknown()).nullable(),
              n8n_health: z.array(z.unknown()),
              operating_model: z.record(z.string(), z.unknown()).nullable(),
              operational_learnings: z.array(z.unknown()).nullable(),
              roadmap: z.record(z.string(), z.unknown()).nullable(),
            }),
          )
          .optional(),
        routineOperatingSessions: z
          .array(
            z
              .object({
                id: z.string(),
                cycle_id: z.string(),
                local_date: z.string(),
                timezone: z.string(),
                window_opens_at: z.string(),
                window_closes_at: z.string(),
                status: z.string(),
                started_at: z.string().nullable(),
                closed_at: z.string().nullable(),
                opened_late: z.boolean(),
                early_stop_reason: z.string().nullable(),
                close_reason: z.string().nullable(),
                decisions: z.array(z.record(z.string(), z.unknown())),
                report: z.record(z.string(), z.unknown()).nullable(),
                capacity: z.record(z.string(), z.unknown()),
                recurrence_state: z.string(),
                prospect_effects_authorized: z.literal(false),
                lease_expires_at: z.string().nullable(),
                operational_status: z.enum([
                  "ACTIVE",
                  "INTERRUPTED",
                  "TERMINAL",
                ]),
                activity_phase: z.string().nullable().optional(),
                activity_detail: z.string().nullable().optional(),
                current_decision_sequence: z.number().nullable().optional(),
                latest_completed_action: z.string().nullable().optional(),
                latest_meaningful_result: z.string().nullable().optional(),
                wait_reason: z.string().nullable().optional(),
                activity_observed_at: z.string().nullable().optional(),
                wall_clock_seconds: z.number().optional(),
              })
              .passthrough(),
          )
          .optional(),
        routineSemanticTelemetry: z
          .array(
            z.object({
              id: z.string(),
              session_id: z.string(),
              work_class: z.string(),
              dimension: z.string().nullable(),
              started_at: z.string(),
              finished_at: z.string().nullable(),
              elapsed_ms: z.number().nullable(),
              current_elapsed_ms: z.number(),
              status: z.enum([
                "STARTED",
                "SUCCESS",
                "TIMEOUT",
                "FAILED",
                "BYPASSED_DETERMINISTIC_NO_YIELD",
              ]),
              prompt_bytes: z.number(),
              outcome_class: z.string().nullable(),
              deterministic_bypass: z.boolean(),
            }),
          )
          .optional(),
        managementFunnel: z
          .object({
            currentCycle: z.record(
              z.string(),
              z.object({
                value: z.number().nullable(),
                available: z.boolean(),
                definition: z.string(),
              }),
            ),
            recent7Days: z.record(
              z.string(),
              z.object({
                value: z.number().nullable(),
                available: z.boolean(),
                definition: z.string(),
              }),
            ),
          })
          .optional(),
        productionOperatingState: z
          .object({
            cycle_id: z.string(),
            mandate_id: z.string(),
            state: z.literal("ACTIVE_CONTINUOUS"),
            portal_acceptance: z.literal("PASS"),
            commercial_gate: z.literal("PANCRACIO_EXACT_EFFECT_REQUIRED"),
            allowed_outbound_channels: z.array(z.string()),
            new_channel_authority: z.literal("HUMAN_ONLY"),
            timezone: z.string(),
            window_start: z.string(),
            window_end: z.string(),
            max_units: z.number(),
            max_requests: z.number(),
            max_minutes: z.number(),
            effective_at: z.string(),
            expires_at: z.string(),
            current: z.boolean(),
            recurrence_authorized: z.boolean(),
            standing_effect_authority: z.literal(false),
          })
          .nullable()
          .optional(),
        routineSourceEconomics: z
          .array(z.record(z.string(), z.unknown()))
          .optional(),
        allocationComparisons: z
          .array(
            z.object({
              session_id: z.string(),
              sequence: z.number(),
              selected_alternative_id: z.string(),
              alternatives: z.array(z.record(z.string(), z.unknown())),
            }),
          )
          .optional(),
        allocationCalibrations: z
          .array(
            z.object({
              id: z.string(),
              cycle_id: z.string(),
              executable: z.literal(false),
              body: z.record(z.string(), z.unknown()),
            }),
          )
          .optional(),
        planningDispositions: z
          .array(
            z.object({
              work_id: z.string(),
              cycle_id: z.string(),
              disposition: z.string(),
              reason: z.string(),
              mission_count: z.number(),
            }),
          )
          .optional(),
        learningWaves: z
          .array(
            z.object({
              id: z.string(),
              cycle_id: z.string(),
              version: z.number(),
              target_class: z.literal("EXPLORATORY_CANDIDATE_LEARNING"),
              semantic_policy_version: z.number(),
              status: z.string(),
              outreach_authority: z.literal("NONE"),
              executable: z.literal(false),
              created_at: z.string(),
              all_candidates: z.array(z.unknown()),
              targets: z.array(
                z.object({
                  position: z.number(),
                  candidateId: z.string(),
                  company: z.string(),
                  strictState: z.string(),
                  conversationWorthiness: z.string(),
                  evidenceSnapshot: z.record(z.string(), z.unknown()),
                  why: z.string(),
                  learningGoal: z.string(),
                  hypothesis: z.string(),
                  falsifier: z.string(),
                  yesLearning: z.string(),
                  noLearning: z.string(),
                  noResponseLimits: z.string(),
                  internalNeed: z.literal("UNKNOWN"),
                  organizationIdentityEvidence: z.unknown(),
                  person: z.record(z.string(), z.unknown()),
                  contactPoints: z.array(z.unknown()),
                  channels: z.array(z.unknown()),
                  contactStrategy: z.record(z.string(), z.unknown()),
                  messages: z.array(z.record(z.string(), z.unknown())),
                  safety: z.record(z.string(), z.unknown()),
                  attemptBudget: z.number(),
                  authorizationState: z.literal("NOT_AUTHORIZED"),
                  effectState: z.literal("NO_EFFECT_INTENT"),
                  humanReviews: z.array(z.unknown()),
                }),
              ),
              reviews: z.array(z.unknown()),
              first_effect: z
                .object({
                  company: z.string(),
                  decision: z.string(),
                  message_version: z.number().nullable(),
                  subject: z.string().nullable(),
                  text: z.string().nullable(),
                  message_hash: z.string().nullable(),
                  authorization_id: z.string().nullable(),
                  intent_id: z.string().nullable(),
                  work_item_id: z.string().nullable(),
                  effect_status: z.string().nullable(),
                  attempt_id: z.string().nullable(),
                  attempted_at: z.string().nullable(),
                  provider_observation: z.unknown().nullable(),
                  contact_strategy_state: z.string().nullable(),
                  next_review_at: z.string().nullable(),
                  follow_up_authority: z.string().nullable(),
                  logical_attempts: z.number().nullable(),
                })
                .nullable()
                .optional(),
              post_effect_reconciliation: z
                .record(z.string(), z.unknown())
                .nullable()
                .optional(),
            }),
          )
          .optional(),
        journeys: z
          .array(
            z.object({
              candidate_id: z.string(),
              executions: z
                .array(
                  z.object({
                    workItemId: z.string(),
                    status: z.string(),
                    direction: z.string(),
                    actorType: z.string(),
                    requests: z.number().nullable(),
                    decision: z.unknown(),
                    evidence: z.unknown(),
                    admission: z.string().nullable(),
                    accountId: z.string().nullable(),
                  }),
                )
                .optional(),
              origins: z.array(
                z.object({
                  source: z.string(),
                  search: z.unknown(),
                  hypothesis: z.string().nullable(),
                  reason: z.string().nullable(),
                  sourceEntity: z.string(),
                  jobTitle: z.string().nullable(),
                  attempts: z.unknown(),
                  requests: z.coerce.number(),
                  runStatus: z.string(),
                }),
              ),
              investigations: z.array(
                z.object({
                  summary: z.string(),
                  nextAction: z.string(),
                  actorType: z.string(),
                  actorId: z.string(),
                  recordedAt: z.string(),
                  attempts: z.array(
                    z.object({
                      mechanism: z.string(),
                      uri: z.string().optional(),
                      query: z.string().optional(),
                      observedAt: z.string(),
                      finding: z.string(),
                      outcome: z.string(),
                    }),
                  ),
                  limitations: z.array(z.string()),
                }),
              ),
              decisions: z.array(z.unknown()),
            }),
          )
          .optional(),
        totals: z.object({
          observations: z.coerce.number(),
          candidates: z.coerce.number(),
          resolved: z.coerce.number(),
          ambiguous: z.coerce.number(),
          unresolved: z.coerce.number(),
          held: z.coerce.number(),
          admitted: z.coerce.number(),
          pending_work: z.coerce.number(),
        }),
        sources: z.array(
          z.object({
            id: z.string(),
            available: z.boolean(),
            health: z.string(),
            markets: z.array(z.string()),
            next_run_at: z.string().nullable().optional(),
            cadence_hours: z.number().optional(),
          }),
        ),
        candidates: z.array(
          z.object({
            id: z.string(),
            name: z.string().nullable(),
            domain: z.string().nullable(),
            identity_state: z.string(),
            screen_state: z.string(),
            reasons: z.array(z.string()),
            missing: z.array(z.string()),
            market_contexts: z.array(z.string()).nullable(),
            sources: z.array(z.string()).nullable(),
            sightings: z.coerce.number(),
            admissions: z.coerce.number(),
            first_seen: z.string().optional(),
            last_seen: z.string().optional(),
            archived: z.boolean().optional(),
            workspace_action: z.string().nullable().optional(),
            workspace_reason: z.string().nullable().optional(),
            workspace_actor_type: z.string().nullable().optional(),
            workspace_actor_id: z.string().nullable().optional(),
            workspace_changed_at: z.string().nullable().optional(),
          }),
        ),
        archivePolicy: z
          .object({
            version: z.number(),
            enabled: z.boolean(),
            terminal_retention_days: z.number(),
            stale_unresolved_retention_days: z.number().nullable(),
            definition: z.record(z.string(), z.unknown()),
            definition_hash: z.string(),
          })
          .nullable()
          .optional(),
        archiveEligibility: z
          .array(
            z.object({
              candidate_id: z.string(),
              policy_version: z.number(),
              eligibility_reason: z.string(),
              eligible_at: z.string(),
            }),
          )
          .optional(),
        planning: z.array(
          z.object({
            id: z.string(),
            actor_type: z.string().optional(),
            direction_actor_type: z.string().nullable().optional(),
            management_direction: z.string().nullable().optional(),
            status: z.string().nullable(),
            hypothesis: z.string().nullable(),
            reason: z.string().nullable(),
            coverage_gap: z.string().nullable(),
            created_at: z.string().optional(),
          }),
        ),
        missions: z.array(
          z.object({
            mission_id: z.string(),
            source: z.string(),
            market: z.string(),
            observations: z.coerce.number(),
            candidates: z.coerce.number(),
            source_failures: z.coerce.number(),
            requests: z.coerce.number(),
          }),
        ),
        displayLimits: z.object({
          missions: z.number(),
          candidates: z.number(),
          planning: z.number(),
        }),
      }),
    ),
  activationPreflight: () =>
    request(
      "/activation-preflight",
      z.object({
        ready: z.boolean(),
        executable: z.literal(false),
        activationAvailable: z.literal(false),
        observedAt: z.string(),
        policyVersion: z.number().nullable(),
        checks: z.array(
          z.object({
            component: z.string(),
            ready: z.boolean(),
            reason: z.string(),
            observedAt: z.string().optional(),
          }),
        ),
      }),
    ),
  operatingModel: () =>
    request(
      "/operating-model",
      z.object({
        currentExecutionScope: z.string(),
        chatRequiredForRuntime: z.boolean(),
        portalRequiredForRuntime: z.boolean(),
        activity: z.array(
          z.object({
            mode: z.string(),
            event: z.string(),
            heartbeat_at: z.string(),
            current: z.boolean(),
            completed: z.string().nullable(),
            pending_signals: z.string().nullable(),
            schedule: z
              .object({
                hour: z.number(),
                minute: z.number(),
                timeZone: z.string(),
              })
              .nullable(),
          }),
        ),
      }),
    ),
  policySettings: () =>
    request(
      "/policy-candidate",
      z.object({
        version: z.number(),
        policyHash: z.string(),
        executable: z.literal(false),
        activationAvailable: z.literal(false),
        settings: z.array(
          z.object({
            key: z.string(),
            value: z.unknown().optional(),
            editable: z.boolean(),
            mutability: z.string(),
          }),
        ),
      }),
    ),
  policyChange: (
    commandId: string,
    body: Record<string, unknown>,
    csrf: string,
  ) =>
    request(
      "/commands/policy-candidate",
      z.object({
        proposalId: z.string().optional(),
        proposalHash: z.string().optional(),
        version: z.number().nullable().optional(),
        wakeRequired: z.literal(false),
      }),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ commandId, request: body }),
      },
    ),
  candidateWorkspace: (
    commandId: string,
    candidateId: string,
    action: "ARCHIVE_CANDIDATE" | "RESTORE_CANDIDATE",
    reason: string,
    csrf: string,
  ) =>
    request(
      "/commands/discovery",
      z.object({
        status: z.string(),
        candidateId: z.string(),
        workspaceState: z.enum(["ACTIVE", "ARCHIVED"]),
        wakeRequired: z.literal(false),
      }),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({
          commandId,
          request: { operation: action, candidateId, reason },
        }),
      },
    ),
  reviewExploratoryTarget: (
    commandId: string,
    waveId: string,
    position: number,
    decision: "APPROVE_FOR_FUTURE_7EB2" | "ADJUST" | "REMOVE" | "HOLD",
    csrf: string,
  ) =>
    request(
      "/commands/discovery",
      z.object({
        status: z.string(),
        waveId: z.string(),
        position: z.number(),
        decision: z.string(),
        effectCreated: z.literal(false),
        wakeRequired: z.literal(false),
      }),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({
          commandId,
          request: {
            operation: "REVIEW_EXPLORATORY_TARGET",
            waveId,
            position,
            decision,
          },
        }),
      },
    ),
  cycleReview: (cycle: string) =>
    request(
      `/cycles/${id(cycle)}/review`,
      z.object({ schemaVersion: version, review: cycleReviewSchema }),
    ),
  cycleCommand: (
    commandId: string,
    body: Record<string, unknown>,
    csrf: string,
  ) =>
    request(
      "/commands/cycle-control/cycle",
      z.object({ cycleVersion: z.number(), wakeRequired: z.boolean() }),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ commandId, request: body }),
      },
    ),
  approveWave: (
    commandId: string,
    body: Record<string, unknown>,
    csrf: string,
  ) =>
    request(
      "/commands/cycle-control/approve-wave",
      z.object({ cycleVersion: z.number(), wakeRequired: z.boolean() }),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ commandId, request: body }),
      },
    ),
  reconsiderAccount: (
    commandId: string,
    body: Record<string, unknown>,
    csrf: string,
  ) =>
    request(
      "/commands/cycle-control/reconsideration",
      z.object({ wakeRequired: z.boolean() }),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ commandId, request: body }),
      },
    ),
  crm: (cycle: string, account: string) =>
    request(
      `/cycles/${id(cycle)}/crm?accountId=${id(account)}&limit=20`,
      z.object({ schemaVersion: version, items: z.array(crmSchema) }),
    ),
  crmCommand: (
    operation: string,
    commandId: string,
    body: Record<string, unknown>,
    csrf: string,
  ) =>
    request(
      `/commands/crm/${id(operation)}`,
      z.object({ commandId: z.string(), wakeRequired: z.boolean() }),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ commandId, request: body }),
      },
    ),
  contract: () =>
    request(
      "/contract",
      z.object({
        schemaVersion: version,
        attentionSurfaceVersion: z.literal("3g-v1"),
      }),
    ),
  cycles: () => request("/cycles?limit=100", page(cycleSchema)),
  accounts: (cycle: string, outcome: string, cursor = "") =>
    request(
      `/cycles/${id(cycle)}/accounts?limit=20${outcome ? `&outcome=${id(outcome)}` : ""}${cursor ? `&cursor=${id(cursor)}` : ""}`,
      page(accountSchema),
    ),
  detail: (cycle: string, account: string) =>
    request(`/cycles/${id(cycle)}/accounts/${id(account)}`, detailSchema),
  attention: (cycle: string, active: boolean) =>
    request(
      `/cycles/${id(cycle)}/attention?active=${active}`,
      z.object({ schemaVersion: version, items: z.array(attentionSchema) }),
    ),
  attentionDetail: (attention: string) =>
    request(`/attention/${id(attention)}`, attentionSchema),
  counts: (cycle: string) =>
    request(`/cycles/${id(cycle)}/attention-counts`, countsSchema),
  health: () => request("/engine-health", healthSchema),
  work: (cycle: string, cursor = "", state = "") =>
    request(
      `/work?limit=20${cycle ? `&cycleId=${id(cycle)}` : ""}${cursor ? `&cursor=${id(cursor)}` : ""}${state ? `&state=${id(state)}` : ""}`,
      page(workSchema),
    ),
  disposition: (body: DispositionInput, csrf: string) =>
    request(
      "/commands/record-attention-disposition",
      z.object({
        schemaVersion: version,
        status: z.enum(["accepted", "already_applied"]),
        refill: z.object({
          activated: z.array(z.string()),
          withdrawn: z.array(z.string()),
        }),
        nextStageReady: z.boolean(),
      }),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(body),
      },
    ),
  logout: async (csrf: string) => {
    const r = await fetch("/api/acquisition/v1/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "x-csrf-token": csrf },
    })
    if (!r.ok) throw new AcquisitionError(r.status)
  },
}
