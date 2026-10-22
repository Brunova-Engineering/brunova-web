import { expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ContactMethods } from "@/components/acquisition/contact-methods"

it("shows a checked public phone without presenting it as accredited WhatsApp", () => {
  render(<ContactMethods locale="es" companyName="Abastos Lógicos" methods={[]}
    checks={[{checkId:"check-1",normalizedNumber:"529981931450",
      sourceUrl:"https://example.test/aviso",outcome:"NOT_FOUND"}]} />)
  expect(screen.getByText("No figura en WhatsApp")).toBeInTheDocument()
  expect(screen.getByText("529981931450")).toBeInTheDocument()
  expect(screen.getByText("Aún no hay un medio acreditado.")).toBeInTheDocument()
  expect(screen.queryByText("Disponible; medio por registrar")).not.toBeInTheDocument()
})

it("does not repeat a verified WhatsApp number after it becomes a contact method", () => {
  render(<ContactMethods locale="es" companyName="Empresa" methods={[{
    methodId:"method-1",channelType:"WHATSAPP",channelValue:"+52 998 193 1451",
    sourceUrl:"https://example.test/contacto",attribution:"El sitio publica este canal.",
  }]} checks={[{checkId:"check-1",normalizedNumber:"529981931451",
    sourceUrl:"https://example.test/contacto",outcome:"EXISTS"}]} />)
  expect(screen.getByText("WhatsApp")).toBeInTheDocument()
  expect(screen.queryByText("Números comprobados")).not.toBeInTheDocument()
})

it("keeps the confirmed receipt distinct from method availability", () => {
  render(<ContactMethods locale="es" companyName="Empresa" receiptConfirmed sentMethodId="method-1"
    methods={[{methodId:"method-1",channelType:"EMAIL",channelValue:"hola@empresa.example",
      sourceUrl:"https://empresa.example/contacto",attribution:"El sitio publica este correo."}]} />)
  expect(screen.getByText("El envío tiene recibo confirmado; estos son los medios atribuidos.")).toBeInTheDocument()
  expect(screen.getByText("Medio del envío confirmado")).toBeInTheDocument()
  expect(screen.queryByText(/recibo del envío aún no está disponible/)).not.toBeInTheDocument()
})
