import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { PresenceWorkPlan, workSteps } from "@/components/presence/work-plan"

afterEach(() => { vi.unstubAllGlobals() })

it("lets Natalia reorder and publish the next Presence run plan", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({version:4}), {status:200}))
  vi.stubGlobal("fetch", fetcher)
  const onSaved = vi.fn().mockResolvedValue(undefined)
  render(<PresenceWorkPlan locale="es" plan={{version:3,order:workSteps.map(step=>step.key),updatedAt:null,actor:null}}
    canManage csrf="csrf-test" onSaved={onSaved} />)
  fireEvent.click(screen.getByRole("button", {name:"Subir Crear para cada red"}))
  fireEvent.click(screen.getByRole("button", {name:"Publicar plan"}))
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
  const [path, request] = fetcher.mock.calls[0] as [string, RequestInit]
  expect(path).toBe("/api/presence/v1/work_plan")
  expect(request.headers).toMatchObject({"x-csrf-token":"csrf-test"})
  expect(JSON.parse(String(request.body))).toMatchObject({expectedVersion:3,
    order:["ADAPT","RESEARCH","REVIEW","PUBLISH","LEARN"]})
  expect(screen.getByRole("status")).toHaveTextContent("Plan publicado")
})
