import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeControl } from "@/components/theme/theme-control"

const setTheme = vi.fn()

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme }),
}))

describe("ThemeControl", () => {
  beforeEach(() => setTheme.mockClear())

  it("offers system, light, and dark preferences", () => {
    render(<ThemeControl />)

    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Light" })).toBeEnabled()
    expect(screen.getByRole("radio", { name: "Dark" })).toBeEnabled()
  })

  it("updates the explicit theme preference", () => {
    render(<ThemeControl />)

    fireEvent.click(screen.getByRole("radio", { name: "Dark" }))

    expect(setTheme).toHaveBeenCalledWith("dark")
  })
})
