import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { ExecutiveSystemStatus, executiveFlowPieces, moveExecutivePiece } from "@/components/acquisition/executive-system-status"
import { acquisitionApi as api } from "@/lib/acquisition-api"
import type { DiscoveryTruth } from "@/lib/acquisition-management-truth"

afterEach(() => vi.restoreAllMocks())

type Session = NonNullable<DiscoveryTruth["routineOperatingSessions"]>[number]
const activeSession = {
  id: "routine-session", cycle_id: "cycle-one",
  operational_status: "ACTIVE",
  activity_phase: "SOURCE_EXECUTION",
  activity_detail: "Executing bounded COMPANY_FIRST work.",
  latest_meaningful_result: null,
  latest_completed_action: null,
  wait_reason: null,
  window_closes_at: "2099-01-01T02:00:00Z",
} as Session

it("shows one current high-level block and does not invent a candidate priority", () => {
  const pieces = executiveFlowPieces(activeSession, null, "es")
  expect(pieces).toHaveLength(6)
  expect(pieces.filter((piece) => piece.state === "current").map((piece) => piece.key)).toEqual(["investigate"])
  expect(pieces.find((piece) => piece.key === "focus")?.detail).toContain("orden concreto de candidatas aún no se publica")
  expect(pieces.find((piece) => piece.key === "investigate")?.summary).toBe("Lectura en curso")
})

it("reorders only the six known pieces", () => {
  expect(moveExecutivePiece(["focus","investigate","review","decide","attention","continue"],"attention","focus"))
    .toEqual(["attention","focus","investigate","review","decide","continue"])
})

it("keeps the executive canvas concise while exposing details and the Attention section", async () => {
  vi.spyOn(api, "discovery").mockResolvedValue({
    routineOperatingSessions: [activeSession],
  } as unknown as DiscoveryTruth)
  vi.spyOn(api, "routineSupervision").mockResolvedValue({direction:null})
  const onAttention = vi.fn()
  render(<ExecutiveSystemStatus locale="es" health={null} csrf="test-csrf" onAttention={onAttention} />)
  await waitFor(() => expect(screen.getByRole("button", { name: /Investigar/ })).toBeVisible())
  expect(within(screen.getByLabelText("Flujo de la ventana")).getAllByRole("button")).toHaveLength(6)
  expect(screen.queryByText("Executing bounded COMPANY_FIRST work.")).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: /Investigar/ }))
  expect(screen.getByText("Executing bounded COMPANY_FIRST work.")).toBeVisible()
  fireEvent.click(screen.getByRole("button", { name: /Atención de Jorge/ }))
  fireEvent.click(screen.getByRole("button", { name: "Abrir Necesita tu atención" }))
  expect(onAttention).toHaveBeenCalledOnce()
  expect(screen.getByText(/La prioridad solo cambia al confirmarla/)).toBeVisible()
})

it("submits a bounded priority only after a human confirmation", async () => {
  vi.spyOn(api,"discovery").mockResolvedValue({routineOperatingSessions:[activeSession]} as unknown as DiscoveryTruth)
  vi.spyOn(api,"routineSupervision").mockResolvedValue({direction:null})
  const submit=vi.spyOn(api,"setRoutineSupervision").mockResolvedValue({status:"accepted",commandId:"command-one",version:1,externalEffect:false})
  render(<ExecutiveSystemStatus locale="es" health={null} csrf="test-csrf" onAttention={() => {}} />)
  await waitFor(() => expect(screen.getByRole("button",{name:"Confirmar dirección"})).toBeVisible())
  fireEvent.change(screen.getByLabelText("Qué priorizar"),{target:{value:"ENRICHMENT"}})
  fireEvent.change(screen.getByLabelText("Por qué cambiar el foco"),{target:{value:"Resolver el enriquecimiento que tiene evidencia pendiente."}})
  expect(submit).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole("button",{name:"Confirmar dirección"}))
  await waitFor(() => expect(submit).toHaveBeenCalledOnce())
  expect(submit.mock.calls[0]?.[1]).toMatchObject({sessionId:"routine-session",cycleId:"cycle-one",priorityBlock:"ENRICHMENT",maxUnitMinutes:15})
})
