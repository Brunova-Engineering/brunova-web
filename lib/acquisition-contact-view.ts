import type { acquisitionApi } from "./acquisition-api"

type Map = Awaited<ReturnType<typeof acquisitionApi.explorationMap>>
type Profile = NonNullable<Map["companyProfiles"]>[number]
export type ContactPreparation = Awaited<ReturnType<typeof acquisitionApi.candidateContactPreparations>>["preparations"][number]
export type ContactAttempt = Awaited<ReturnType<typeof acquisitionApi.candidateContactAttempts>>["attempts"][number]
export type ContactReply = Awaited<ReturnType<typeof acquisitionApi.candidateContactReplies>>["replies"][number]

export type ContactPhase = "PRIORITIZED" | "PREPARED" | "AUTHORIZED_PENDING" |
  "OUTCOME_UNKNOWN" | "SEND_CONFIRMED" | "ATTEMPT_FAILED" | "CONTACT_UNVERIFIED" |
  "REPLY_UNINTERPRETED" | "REPLY_POSITIVE" | "REPLY_NEGATIVE" | "REPLY_OPT_OUT" |
  "REPLY_BAD_TIMING" | "REPLY_QUESTION" | "REPLY_UNCERTAIN" | "RETURNED_TO_CONTACT"
export type ContactDecision = "ADD_METHOD" | "PREPARE_MESSAGE" | "REVIEW_PREPARATION" |
  "REVIEW_ATTEMPT" | "WAIT_FOR_RESPONSE" | "RECONCILE_OUTCOME" | "VERIFY_CONTACT" |
  "INTERPRET_REPLY" | "VERIFY_CRM" | "REVIEW_CLOSURE" | "ENFORCE_SUPPRESSION" |
  "PREPARE_RESPONSE" | "REVIEW_REPLY" | "NONE"

export type ContactRow = {
  profile: Profile
  phase: ContactPhase
  decision: ContactDecision
  preparation: ContactPreparation | null
  attempt: ContactAttempt | null
  reply: ContactReply | null
  chosenChannel: string | null
  recipientLabel: string
  lastActivity: string | null
}

/** Only backed Engine stages enter Contacto. A technical SELECTED is a
 * pre-contact priority, never evidence of a positive response. */
export function contactRows(map: Map, preparations: readonly ContactPreparation[] = [],
  attempts: readonly ContactAttempt[] = [], replies: readonly ContactReply[] = []): ContactRow[] {
  return (map.companyProfiles ?? [])
    .flatMap((profile) => {
      if (profile.attention?.status === "OPEN") return []
      const stage = profile.enrichment?.stage
      if (stage !== "SELECTED" && stage !== "CONTACTED") return []
      const preparation = preparations.find((item) =>
        item.companyId === profile.companyId &&
        item.stageVersion === profile.enrichment?.version &&
        profile.links.some((link) => link.linkId === item.linkId) &&
        (profile.contactMethods ?? []).some((method) => method.methodId === item.methodId),
      ) ?? null
      const attempt = attempts.filter((item) =>
        item.companyId === profile.companyId &&
        (item.stageVersion === profile.enrichment?.version ||
          (stage === "CONTACTED" && item.stageVersion < (profile.enrichment?.version ?? 0))) &&
        profile.links.some((link) => link.linkId === item.linkId) &&
        (profile.contactMethods ?? []).some((method) => method.methodId === item.methodId),
      ).sort((a,b)=>b.authorizedAt.localeCompare(a.authorizedAt))[0] ?? null
      const reply = replies.filter((item) =>
        item.companyId === profile.companyId &&
        (item.stageVersion === profile.enrichment?.version ||
          (stage === "CONTACTED" && item.stageVersion < (profile.enrichment?.version ?? 0))) &&
        profile.links.some((link) => link.linkId === item.linkId) &&
        (profile.contactMethods ?? []).some((method) => method.methodId === item.methodId) &&
        attempts.some((sent) => sent.intentId === item.intentId && sent.companyId === item.companyId &&
          (sent.outcome === "SEND_CONFIRMED" || sent.outcome === "RECONCILED_CONFIRMED") &&
          !!sent.providerReceiptId),
      ).sort((a,b)=>b.receivedAt.localeCompare(a.receivedAt))[0] ?? null
      const phase: ContactPhase =
        reply ? reply.attentionAction === "RETURN_TO_CONTACT" ? "RETURNED_TO_CONTACT" :
          reply.classification === null ? "REPLY_UNINTERPRETED" :
          reply.classification === "POSITIVE" ? "REPLY_POSITIVE" :
          reply.classification === "NEGATIVE" ? "REPLY_NEGATIVE" :
          reply.classification === "OPT_OUT" ? "REPLY_OPT_OUT" :
          reply.classification === "BAD_TIMING" ? "REPLY_BAD_TIMING" :
          reply.classification === "QUESTION" ? "REPLY_QUESTION" : "REPLY_UNCERTAIN" :
        attempt?.outcome === "SEND_CONFIRMED" || attempt?.outcome === "RECONCILED_CONFIRMED"
          ? attempt.providerReceiptId ? "SEND_CONFIRMED" : "OUTCOME_UNKNOWN"
          : attempt?.outcome === "OUTCOME_UNKNOWN" || attempt?.outcome === "RECONCILIATION_REQUIRED" ||
              attempt?.outcome === "DISPATCH_STARTED"
            ? "OUTCOME_UNKNOWN"
            : attempt?.outcome === "FAILED_BEFORE_MUTATION"
              ? "ATTEMPT_FAILED"
              : attempt ? "AUTHORIZED_PENDING"
                : stage === "CONTACTED" ? "CONTACT_UNVERIFIED"
                  : preparation ? "PREPARED" : "PRIORITIZED"
      const decision: ContactDecision =
        phase === "RETURNED_TO_CONTACT" ? "PREPARE_RESPONSE" :
        phase === "REPLY_UNINTERPRETED" ? "INTERPRET_REPLY" :
        phase === "REPLY_POSITIVE" ? "VERIFY_CRM" :
        phase === "REPLY_NEGATIVE" ? "REVIEW_CLOSURE" :
        phase === "REPLY_OPT_OUT" ? "ENFORCE_SUPPRESSION" :
        phase === "REPLY_BAD_TIMING" || phase === "REPLY_QUESTION" ? "PREPARE_RESPONSE" :
        phase === "REPLY_UNCERTAIN" ? "REVIEW_REPLY" :
        phase === "SEND_CONFIRMED" ? "WAIT_FOR_RESPONSE" :
        phase === "OUTCOME_UNKNOWN" ? "RECONCILE_OUTCOME" :
        phase === "AUTHORIZED_PENDING" || phase === "ATTEMPT_FAILED" ? "REVIEW_ATTEMPT" :
        phase === "CONTACT_UNVERIFIED"
          ? "VERIFY_CONTACT"
          : (profile.contactMethods ?? []).length === 0
            ? "ADD_METHOD"
            : preparation ? "REVIEW_PREPARATION" : "PREPARE_MESSAGE"
      const currentMethodId = reply?.methodId ?? attempt?.methodId ?? preparation?.methodId
      const currentMethod = (profile.contactMethods ?? []).find((method) => method.methodId === currentMethodId)
      return [
        {
          profile,
          phase,
          decision,
          preparation,
          attempt,
          reply,
          chosenChannel: reply?.channelType ?? attempt?.channelType ?? preparation?.channelType ?? null,
          recipientLabel: currentMethod?.contactName?.trim() ||
            (preparation && preparation.methodId === currentMethodId ? preparation.recipientLabel : null) ||
            profile.displayName,
          lastActivity: [reply?.attentionDecidedAt, reply?.receivedAt, attempt?.outcomeAt, attempt?.authorizedAt,
            profile.enrichment?.contactedAt, profile.enrichment?.lastTouchedAt]
            .filter((value): value is string => !!value).sort().at(-1) ?? null,
        },
      ]
    })
    .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""))
}

export function filterContactRows(
  rows: readonly ContactRow[],
  phase: ContactPhase | "ALL",
  decision: ContactDecision | "ALL",
) {
  return rows.filter(
    (row) =>
      (phase === "ALL" || row.phase === phase) &&
      (decision === "ALL" || row.decision === decision),
  )
}
