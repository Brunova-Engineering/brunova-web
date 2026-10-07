import { readFileSync } from "node:fs"
import { afterEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { acquisitionApi } from "@/lib/acquisition-api"
import {
  CandidateOpportunities,
  ConversationPreparation,
} from "@/components/acquisition/candidate-opportunities"

afterEach(() => vi.unstubAllGlobals())

it.skipIf(!process.env.NZT48_PROJECTION_INPUT)(
  "parses and renders both real local Engine projections through the web client",
  async () => {
    const payload = JSON.parse(
      readFileSync(process.env.NZT48_PROJECTION_INPUT!, "utf8"),
    )
    const fetch = vi.fn().mockImplementation(
      async (path: string) =>
        new Response(
          JSON.stringify(
            path === "/api/acquisition/v1/discovery"
              ? payload
              : {
                  status: "accepted",
                  proposalId: payload.conversationPreparations[0].id,
                  candidateId: payload.conversationPreparations[0].candidate_id,
                  effectCreated: false,
                  wakeRequired: false,
                  blocking: false,
                },
          ),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    )
    vi.stubGlobal("fetch", fetch)
    const data = await acquisitionApi.discovery()
    expect(fetch).toHaveBeenCalledWith(
      "/api/acquisition/v1/discovery",
      expect.objectContaining({ credentials: "same-origin" }),
    )
    expect(
      data.conversationPreparations?.map((item) => item.body.signalKind).sort(),
    ).toEqual(["REGIONAL_IMPLEMENTATION", "RELATIONSHIP_CHANGE"])
    expect(
      data.conversationPreparations?.every(
        (item) =>
          item.authority_state === "PREPARATION_ONLY" &&
          !item.effect_authorized,
      ),
    ).toBe(true)
    expect(data.commercialRoutes?.map((route) => route.next_gate)).toEqual([
      "CANDIDATE_IDENTITY_REQUIRED",
      "CANDIDATE_IDENTITY_REQUIRED",
    ])
    expect(data.buyerMessagePreviews?.map((item) => item.preview_gate)).toEqual([
      "CANDIDATE_IDENTITY_REQUIRED",
      "CANDIDATE_IDENTITY_REQUIRED",
    ])
    expect(
      data.buyerMessagePreviews?.every(
        (item) => !item.executable && !item.effect_authorized,
      ),
    ).toBe(true)
    expect(
      data.commercialRoutes?.every(
        (route) =>
          !route.executable &&
          !route.effect_authorized &&
          route.effects_disabled,
      ),
    ).toBe(true)
    render(<CandidateOpportunities data={data} locale="en" />)
    expect(
      screen.getByText(/supplier transition may change coordination work/),
    ).toBeVisible()
    expect(
      screen.getByText(/implementation elsewhere may be transferable/),
    ).toBeVisible()
    expect(screen.getAllByText(/This does not authorize contact/)).toHaveLength(
      2,
    )
    expect(screen.getByText(/Recorded feedback/)).toBeVisible()
    expect(
      screen.getAllByText(/The CRM and email route is not executable/),
    ).toHaveLength(2)
    expect(screen.getAllByText(/Buyer unresolved or not current/)).toHaveLength(
      2,
    )
    const proposalId = data.conversationPreparations!.at(0)!.id
    const result = await acquisitionApi.conversationFeedback(
      "synthetic-web-feedback",
      proposalId,
      "CORRECT",
      "QUESTION",
      "Check whether local adoption already exists.",
      "synthetic-csrf",
    )
    expect(result.effectCreated).toBe(false)
    expect(result.blocking).toBe(false)
    expect(fetch).toHaveBeenCalledWith(
      "/api/acquisition/v1/commands/discovery",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-csrf-token": "synthetic-csrf" }),
        body: JSON.stringify({
          commandId: "synthetic-web-feedback",
          request: {
            operation: "RECORD_CONVERSATION_FEEDBACK",
            proposalId,
            decision: "CORRECT",
            target: "QUESTION",
            comment: "Check whether local adoption already exists.",
          },
        }),
      }),
    )
  },
)

it.skipIf(!process.env.NZT48_BINDING_INPUT)(
  "reads the actual Candidate Message binding and labels it rehearsal only",
  async () => {
    const payload = JSON.parse(
      readFileSync(process.env.NZT48_BINDING_INPUT!, "utf8"),
    )
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    )
    const data = await acquisitionApi.discovery()
    const binding = data.candidateMessageBindings?.[0]
    expect(binding).toBeDefined()
    expect(binding?.executable).toBe(false)
    expect(binding?.effect_authorized).toBe(false)
    const proposal = data.conversationPreparations?.find(
      (item) => item.id === binding?.proposal_id,
    )
    expect(binding?.message_text).toBe(proposal?.body.message)
    render(
      <ConversationPreparation
        preparation={proposal!}
        messageBinding={binding}
        locale="en"
      />,
    )
    expect(screen.getByText(/Linked message/)).toBeVisible()
    expect(screen.getByText(/Current for rehearsal only/)).toBeVisible()
  },
)

it.skipIf(!process.env.NZT48_REAL_MODE_INPUT)(
  "renders the actual active-cycle, real-data gate without contact authority",
  async () => {
    const payload = JSON.parse(
      readFileSync(process.env.NZT48_REAL_MODE_INPUT!, "utf8"),
    )
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    )
    const data = await acquisitionApi.discovery()
    const proposal = data.conversationPreparations?.find(
      (entry) => entry.candidate_id === "nzt48-real-mode-unresolved",
    )
    const route = data.commercialRoutes?.find(
      (entry) => entry.candidate_id === "nzt48-real-mode-unresolved",
    )
    expect(proposal?.authority_state).toBe("PREPARATION_ONLY")
    expect(proposal?.effect_authorized).toBe(false)
    expect(route?.next_gate).toBe("CANDIDATE_IDENTITY_REQUIRED")
    expect(route?.executable).toBe(false)
    expect(route?.effect_authorized).toBe(false)
    expect(route?.effects_disabled).toBe(true)
    const contactEvidence = data.contactEvidencePreviews?.find(
      (entry) => entry.candidate_id === "nzt48-real-mode-unresolved",
    )
    expect(contactEvidence?.next_gate).toBe("CANDIDATE_IDENTITY_REQUIRED")
    expect(contactEvidence?.executable).toBe(false)
    render(<CandidateOpportunities data={data} locale="en" />)
    expect(
      screen.getByText(/observed regional implementation may transfer/),
    ).toBeVisible()
    expect(screen.getAllByText(/Contact evidence/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/This does not authorize contact/)).toHaveLength(
      data.conversationPreparations?.length ?? 0,
    )
  },
)

it.skipIf(!process.env.NZT48_BUYER_BOUNDARY_INPUT)(
  "keeps the real-mode Buyer boundary read only after synthetic identity and contact evidence",
  async () => {
    const payload = JSON.parse(
      readFileSync(process.env.NZT48_BUYER_BOUNDARY_INPUT!, "utf8"),
    )
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    )
    const data = await acquisitionApi.discovery()
    const route = data.commercialRoutes?.find(
      (entry) => entry.candidate_id === "nzt48-real-mode-unresolved",
    )
    expect(route?.next_gate).toBe("CURRENT_BUYER_PACKAGE_REQUIRED")
    const preview = data.buyerMessagePreviews?.find(
      (entry) => entry.candidate_id === "nzt48-real-mode-unresolved",
    )
    expect(preview?.preview_gate).toBe("CURRENT_BUYER_PACKAGE_REQUIRED")
    expect(preview?.executable).toBe(false)
    const contactEvidence = data.contactEvidencePreviews?.find(
      (entry) => entry.candidate_id === "nzt48-real-mode-unresolved",
    )
    expect(contactEvidence?.next_gate).toBe("BUYER_ROLE_EVIDENCE_REQUIRED")
    expect(contactEvidence?.supported_email_count).toBe(1)
    expect(route?.executable).toBe(false)
    expect(route?.effect_authorized).toBe(false)
    expect(route?.effects_disabled).toBe(true)
    render(<CandidateOpportunities data={data} locale="en" />)
    expect(screen.getByText(/obtain a current Buyer package/)).toBeVisible()
    expect(screen.getByText(/an email does not prove the role/)).toBeVisible()
    expect(
      screen.getAllByText(/The CRM and email route is not executable/),
    ).toHaveLength(data.conversationPreparations?.length ?? 0)
  },
)
