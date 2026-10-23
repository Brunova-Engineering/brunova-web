import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { ContactSilenceDecision } from "@/components/acquisition/contact-silence-decision"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"

const session:PortalSession={authenticated:true,
  actor:{email:"jorge@example.test",capabilities:["MANAGE_CYCLE"]},
  csrfToken:"csrf-local",expiresAt:"2027-01-01T00:00:00Z"}
afterEach(()=>vi.restoreAllMocks())

it("requires Jorge's decision and reason before a silence closure can be recorded",async()=>{
  const decide=vi.spyOn(acquisitionApi,"candidateContactSilenceDecision").mockResolvedValue({
    status:"decided",decisionId:"decision-one",companyId:"company-one",
    action:"CONFIRM_CLOSE",externalEffect:false,
  })
  const onSaved=vi.fn(async()=>{})
  const props={cycleId:"cycle-one",companyId:"company-one",lastIntentId:"third-intent",
    stageVersion:6,locale:"es" as const,session,onSaved}
  render(<ContactSilenceDecision {...props} preview={false}/> )
  expect(screen.queryByRole("button",{name:"Confirmar decisión"})).toBeNull()
  fireEvent.change(screen.getByRole("combobox",{name:"Decisión por falta de respuesta"}),
    {target:{value:"CONFIRM_CLOSE"}})
  const submit=screen.getByRole("button",{name:"Confirmar decisión"})
  expect(submit).toBeDisabled()
  fireEvent.change(screen.getByRole("textbox",{name:"Motivo de la decisión"}),
    {target:{value:"Tres envíos acreditados y ninguna respuesta recibida."}})
  expect(submit).toBeEnabled()
  fireEvent.click(submit)
  await waitFor(()=>expect(decide).toHaveBeenCalledOnce())
  expect(decide.mock.calls[0]?.[1]).toMatchObject({cycleId:"cycle-one",companyId:"company-one",
    lastIntentId:"third-intent",expectedStageVersion:6,action:"CONFIRM_CLOSE"})
  expect(decide.mock.calls[0]?.[2]).toBe("csrf-local")
  await waitFor(()=>expect(onSaved).toHaveBeenCalledOnce())
})

it("keeps the sample view read only",()=>{
  const decide=vi.spyOn(acquisitionApi,"candidateContactSilenceDecision")
  render(<ContactSilenceDecision cycleId="cycle-one" companyId="company-one"
    lastIntentId="third-intent" stageVersion={6} locale="es" session={session}
    preview onSaved={async()=>{}}/> )
  fireEvent.change(screen.getByRole("combobox",{name:"Decisión por falta de respuesta"}),
    {target:{value:"KEEP_OPEN"}})
  expect(screen.getByRole("button",{name:"Confirmar decisión"})).toBeDisabled()
  expect(decide).not.toHaveBeenCalled()
})
