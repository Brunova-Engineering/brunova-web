import { readFileSync } from "node:fs"
import { afterEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { acquisitionApi } from "@/lib/acquisition-api"
import { CandidateOpportunities } from "@/components/acquisition/candidate-opportunities"

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
