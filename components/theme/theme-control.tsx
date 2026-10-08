"use client"

import { useTheme } from "next-themes"
import { useId, useSyncExternalStore } from "react"

const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const

export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const controlId = useId()
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )
  const selectedTheme =
    mounted && themeOptions.some((option) => option.value === theme)
      ? theme
      : "system"

  return (
    <fieldset
      className={`theme-control${compact ? " theme-control--compact" : ""}`}
      data-state={mounted ? "ready" : "loading"}
      disabled={!mounted}
    >
      <legend className="theme-control__legend">Theme</legend>
      <div className="theme-control__options">
        {themeOptions.map((option) => (
          <label className="theme-control__option" key={option.value}>
            <input
              checked={selectedTheme === option.value}
              name={`${controlId}-theme`}
              onChange={() => setTheme(option.value)}
              type="radio"
              value={option.value}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
