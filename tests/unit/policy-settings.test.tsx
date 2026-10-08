import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import { PolicySettings } from "@/components/acquisition/policy-settings"
import {
  acquisitionApi as api,
  type PortalSession,
} from "@/lib/acquisition-api"
const session: PortalSession = {
  authenticated: true,
  actor: { email: "synthetic@brunova.mx", capabilities: ["MANAGE_CYCLE"] },
  csrfToken: "synthetic",
  expiresAt: "2030-01-01T00:00:00Z",
}
const state = {
  version: 3,
  policyHash: "synthetic-hash",
  executable: false as const,
  activationAvailable: false as const,
  settings: [
    {
      key: "discoveryMaximum",
      value: 75,
      editable: true,
      mutability: "PRE_ACTIVATION_CANDIDATE",
    },
  ],
}
beforeEach(() => {
  vi.spyOn(api, "policySettings").mockResolvedValue(structuredClone(state))
  vi.spyOn(api, "policyChange").mockResolvedValue({
    proposalId: "synthetic-proposal",
    proposalHash: "synthetic-hash",
    wakeRequired: false,
  })
})
it("does not confuse an active snapshot with a later policy candidate", async () => {
  vi.mocked(api.policySettings).mockResolvedValue({
    ...state,
    version: 5,
    settings: [
      {
        ...state.settings[0]!,
        value: 60,
        editable: false,
        mutability: "SNAPSHOT_LOCKED",
      },
    ],
  })
  vi.spyOn(api, "cycleReview").mockResolvedValue({
    schemaVersion: "1",
    review: { discovery: { maximum: 75 } },
  } as Awaited<ReturnType<typeof api.cycleReview>>)
  render(
    <PolicySettings locale="en" session={session} cycleId="synthetic-active" />,
  )
  expect(
    await screen.findByRole("heading", { name: /75 companies maximum/ }),
  ).toBeVisible()
  expect(screen.getByText(/Current snapshot immutable/)).toBeVisible()
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
})
it.each(["en", "es"] as const)(
  "%s proposal impact precedes exact confirmation; no technical input or activation",
  async (locale) => {
    const es = locale === "es"
    render(<PolicySettings locale={locale} session={session} />)
    fireEvent.change(await screen.findByRole("spinbutton"), {
      target: { value: "70" },
    })
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Synthetic reduction" },
    })
    fireEvent.click(
      screen.getByRole("button", {
        name: es ? "Revisar impacto" : "Review impact",
      }),
    )
    expect(await screen.findByText("75 → 70")).toBeVisible()
    expect(api.policyChange).toHaveBeenCalledTimes(1)
    expect(vi.mocked(api.policyChange).mock.calls[0]![1]).toEqual({
      operation: "PROPOSE",
      expectedVersion: 3,
      discoveryMaximum: 70,
      reason: "Synthetic reduction",
    })
    fireEvent.click(
      screen.getByRole("button", {
        name: es ? "Confirmar nueva versión" : "Confirm new version",
      }),
    )
    await waitFor(() => expect(api.policyChange).toHaveBeenCalledTimes(2))
    expect(vi.mocked(api.policyChange).mock.calls[1]![1]).toEqual({
      operation: "CONFIRM",
      expectedVersion: 3,
      proposalId: "synthetic-proposal",
      proposalHash: "synthetic-hash",
    })
    expect(
      screen.queryByRole("button", { name: /^(activate|activar)/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("textbox", { name: /hash|version|identifier/i }),
    ).not.toBeInTheDocument()
  },
)
it("invalid envelope does not call command; snapshotted policy has no editor", async () => {
  const { rerender } = render(<PolicySettings locale="en" session={session} />)
  fireEvent.change(await screen.findByRole("spinbutton"), {
    target: { value: "80" },
  })
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Synthetic" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Review impact" }))
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Increasing it requires policy review",
  )
  expect(api.policyChange).not.toHaveBeenCalled()
  vi.mocked(api.policySettings).mockResolvedValue({
    ...state,
    settings: [{ ...state.settings[0]!, editable: false }],
  })
  rerender(<PolicySettings locale="es" session={session} />)
  await waitFor(() =>
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument(),
  )
})
