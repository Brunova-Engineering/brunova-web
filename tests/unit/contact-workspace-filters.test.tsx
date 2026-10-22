import { fireEvent, render, screen, within } from "@testing-library/react"
import { expect, it } from "vitest"
import { ContactWorkspace } from "@/components/acquisition/contact-workspace"
import type { ContactPreparation } from "@/lib/acquisition-contact-view"
import type { ContactAttempt } from "@/lib/acquisition-contact-view"

type PreviewMap = NonNullable<Parameters<typeof ContactWorkspace>[0]["previewMap"]>

it("updates each filter count within the other selected filter", () => {
  const profile = (id: string, methods: number) => ({
    companyId: id,
    displayName: id,
    links: [{ linkId: `${id}-link`, market: "MX" }],
    attention: null,
    contactMethods: Array.from({ length: methods }, (_, index) => ({
      methodId: `${id}-method-${index}`,
      channelType: "EMAIL",
      channelValue: `${id}@example.com`,
      sourceUrl: `https://${id}.example/contacto`,
      attribution: "Fuente de prueba atribuida a la empresa",
    })),
    enrichment: { stage: "SELECTED", version: 5, lastTouchedAt: null },
  })
  const previewMap = {
    companyProfiles: [profile("prepared", 1), profile("missing", 0)],
  } as unknown as PreviewMap
  const preparation = {
    companyId: "prepared",
    linkId: "prepared-link",
    methodId: "prepared-method-0",
    stageVersion: 5,
    channelType: "EMAIL",
    sendAuthorized: false,
  } as ContactPreparation

  render(
    <ContactWorkspace
      cycleId="preview"
      locale="es"
      previewMap={previewMap}
      previewPreparations={[preparation]}
    />,
  )

  const states = screen.getByRole("group", { name: "Estado" })
  fireEvent.click(screen.getByText("Filtrar por siguiente decisión"))
  const decisions = screen.getByRole("group", { name: "Siguiente decisión" })
  fireEvent.click(within(states).getByRole("button", { name: "Mensaje preparado: 1" }))
  expect(states).toHaveAttribute("data-compact", "true")
  expect(states).toHaveAttribute("data-reveal", "false")
  fireEvent.mouseMove(states)
  expect(states).toHaveAttribute("data-reveal", "true")
  fireEvent.mouseLeave(states)
  expect(states).toHaveAttribute("data-reveal", "false")
  expect(within(decisions).getByRole("button", { name: "Todas: 1" })).toBeVisible()
  expect(within(decisions).queryByRole("button", { name: "Falta un medio atribuido: 0" })).toBeNull()
  expect(within(decisions).getByRole("button", { name: "Revisar mensaje y medio: 1" })).toBeVisible()
  expect(screen.getByRole("status", { name: "" })).toHaveTextContent("1 resultado")
  fireEvent.click(within(decisions).getByRole("button", { name: "Revisar mensaje y medio: 1" }))
  expect(within(states).queryByRole("button", { name: "Priorizada para contacto: 0" })).toBeNull()
  expect(within(states).getByRole("button", { name: "Mensaje preparado: 1" })).toBeVisible()
  fireEvent.click(within(decisions).getByRole("button", { name: "Todas: 1" }))
  expect(within(decisions).queryByRole("button", { name: "Falta un medio atribuido: 0" })).toBeNull()
  expect(screen.getByRole("status", { name: "" })).toHaveTextContent("1 resultado")
  fireEvent.click(within(states).getByRole("button", { name: "Todas: 2" }))
  expect(within(decisions).getByRole("button", { name: "Falta un medio atribuido: 1" })).toBeVisible()
  fireEvent.change(screen.getByRole("searchbox", {name: "Buscar empresa"}),
    {target: {value: "missing"}})
  expect(screen.getByRole("status", {name: ""})).toHaveTextContent("1 resultado")
  expect(screen.getByRole("heading", {name: "missing"})).toBeVisible()
  expect(screen.queryByRole("heading", {name: "prepared"})).toBeNull()
})

it("filters a confirmed send only when a receipt belongs to the current company and method", () => {
  const previewMap={companyProfiles:[{companyId:"one",displayName:"Empresa Uno",
    links:[{linkId:"one-link",market:"MX"}],attention:null,
    contactMethods:[{methodId:"one-method",channelType:"EMAIL",channelValue:"hola@one.example",
      sourceUrl:"https://one.example/contacto",attribution:"Fuente propia de la empresa"}],
    enrichment:{stage:"CONTACTED",version:6,lastTouchedAt:"2026-10-20T00:00:00Z"}}]} as unknown as PreviewMap
  const attempt={companyId:"one",linkId:"one-link",methodId:"one-method",stageVersion:5,
    preparationId:"one-prep",intentId:"one-intent",channelType:"EMAIL",authorizedAt:"2026-10-22T00:00:00Z",
    expiresAt:"2026-10-23T00:00:00Z",outcome:"SEND_CONFIRMED",providerReceiptId:"receipt-1",
    outcomeAt:"2026-10-22T00:01:00Z"} as ContactAttempt
  render(<ContactWorkspace cycleId="preview" locale="es" previewMap={previewMap} previewAttempts={[attempt]}/> )
  expect(screen.getAllByText("Envío confirmado").length).toBeGreaterThan(0)
  expect(screen.getAllByText("Esperar respuesta").length).toBeGreaterThan(0)
  fireEvent.click(screen.getByText("Medios, tesis y trazabilidad"))
  expect(screen.getByText("Recibo: receipt-1")).toBeInTheDocument()
  expect(screen.getByText("Medio del envío confirmado")).toBeInTheDocument()
})
