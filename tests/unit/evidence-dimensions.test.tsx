import { render, screen } from "@testing-library/react"
import { expect, it } from "vitest"
import { EvidenceDimensions } from "@/components/acquisition/evidence-dimensions"

it("does not infer a capacity dimension from arbitrary text", () => {
  render(
    <EvidenceDimensions
      locale="en"
      assertions={[
        {
          id: "synthetic",
          statement: "Capacity and complexity are enormous",
          confidence: "HIGH",
          epistemic_status: "WORKING_HYPOTHESIS",
        },
      ]}
    />,
  )
  expect(screen.getAllByText(/No explicit evidence is recorded/)).toHaveLength(
    3,
  )
  expect(
    screen.queryByText("Capacity and complexity are enormous"),
  ).not.toBeInTheDocument()
})
it("keeps Spanish explicit evidence, uncertainty and signal meaning", () => {
  render(
    <EvidenceDimensions
      locale="es"
      assertions={[
        {
          id: "synthetic",
          statement: "SYNTHETIC contrato observado",
          confidence: "HIGH",
          epistemic_status: "OBSERVED_FACT",
          context: {
            dimension: "INTERVENTION_SIGNAL",
            signalClass: "CHANGE_PRESSURE",
          },
          known_unknowns: ["Presupuesto desconocido"],
        },
      ]}
    />,
  )
  expect(screen.getByText("SYNTHETIC contrato observado")).toBeVisible()
  expect(screen.getByText(/no presumir dolor/)).toBeVisible()
  expect(screen.getByText(/Presupuesto desconocido/)).toBeVisible()
})
