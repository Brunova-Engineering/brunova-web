import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { MobileNavigation } from "@/components/layout/mobile-navigation"

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "open", {
    configurable: true,
    get() {
      return this.hasAttribute("open")
    },
  })

  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "")
  })
  HTMLDialogElement.prototype.close = vi.fn(function close(
    this: HTMLDialogElement,
  ) {
    this.removeAttribute("open")
    this.dispatchEvent(new Event("close"))
  })
})

const primaryItems = [
  { label: "Capabilities", href: "/capabilities" as const },
  { label: "Process", href: "/process" as const },
]

describe("MobileNavigation", () => {
  it("opens with focus inside and restores focus after Escape", async () => {
    render(
      <MobileNavigation
        locale="en"
        portalItem={{
          label: "Portal",
          href: "/portal",
          analyticsEvent: "portal_clicked",
        }}
        primaryAction={{
          label: "Start a conversation",
          href: "/contact",
          analyticsEvent: "cta_start_conversation",
        }}
        primaryItems={primaryItems}
      />,
    )

    const trigger = screen.getByRole("button", { name: "Menu" })
    fireEvent.click(trigger)

    const dialog = screen.getByRole("dialog", { name: "Navigation" })
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Capabilities" })).toHaveFocus(),
    )
    expect(trigger).toHaveAttribute("aria-expanded", "true")

    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }))

    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("provides an explicit close control", async () => {
    render(
      <MobileNavigation
        locale="en"
        portalItem={{ label: "Portal", href: "/portal" }}
        primaryAction={{
          label: "Start a conversation",
          href: "/contact",
        }}
        primaryItems={primaryItems}
      />,
    )

    const trigger = screen.getByRole("button", { name: "Menu" })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
