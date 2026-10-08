"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react"

import { shellCopy } from "@/content/locales"
import { equivalentLocalePath, type Locale } from "@/lib/i18n"

const themeValues = ["system", "light", "dark"] as const
type ThemeValue = (typeof themeValues)[number]
type OpenPanel = "appearance" | "language" | null

export function SiteUtilities({
  locale,
  placement = "shell",
}: {
  locale: Locale
  placement?: "shell" | "navigation"
}) {
  const copy = shellCopy[locale]
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const clusterRef = useRef<HTMLDivElement>(null)
  const appearanceButtonRef = useRef<HTMLButtonElement>(null)
  const languageButtonRef = useRef<HTMLButtonElement>(null)
  const appearanceId = useId()
  const languageId = useId()
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )
  const selectedTheme: ThemeValue =
    mounted && themeValues.includes(theme as ThemeValue)
      ? (theme as ThemeValue)
      : "system"

  useEffect(() => {
    if (!openPanel) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!clusterRef.current?.contains(event.target as Node))
        setOpenPanel(null)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      const previousPanel = openPanel
      setOpenPanel(null)
      if (previousPanel === "appearance") appearanceButtonRef.current?.focus()
      if (previousPanel === "language") languageButtonRef.current?.focus()
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [openPanel])

  function selectLocale(nextLocale: Locale) {
    window.localStorage.setItem("brunova-locale", nextLocale)
    setOpenPanel(null)
    if (nextLocale !== locale) {
      window.location.assign(equivalentLocalePath(pathname, nextLocale))
    }
  }

  return (
    <aside
      aria-label={
        locale === "es" ? "Preferencias del sitio" : "Site preferences"
      }
      className={`site-utilities site-utilities--${placement}`}
      ref={clusterRef}
    >
      <div className="site-utilities__panels">
        {openPanel === "appearance" ? (
          <fieldset className="site-utilities__panel" id={appearanceId}>
            <legend>{copy.appearance}</legend>
            {themeValues.map((value) => (
              <label
                data-selected={selectedTheme === value ? "true" : undefined}
                key={value}
              >
                <input
                  checked={selectedTheme === value}
                  disabled={!mounted}
                  name={`${appearanceId}-theme`}
                  onChange={() => setTheme(value)}
                  type="radio"
                  value={value}
                />
                <span>{copy.appearanceOptions[value]}</span>
                <span aria-hidden="true">
                  {selectedTheme === value ? "•" : ""}
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}

        {openPanel === "language" ? (
          <fieldset className="site-utilities__panel" id={languageId}>
            <legend>{copy.language}</legend>
            {(["en", "es"] as const).map((value) => (
              <label
                data-selected={locale === value ? "true" : undefined}
                key={value}
              >
                <input
                  checked={locale === value}
                  name={`${languageId}-locale`}
                  onChange={() => selectLocale(value)}
                  type="radio"
                  value={value}
                />
                <span>
                  {value.toUpperCase()} — {copy.languageOptions[value]}
                </span>
                <span aria-hidden="true">{locale === value ? "•" : ""}</span>
              </label>
            ))}
          </fieldset>
        ) : null}
      </div>

      <div className="site-utilities__triggers">
        <button
          aria-controls={appearanceId}
          aria-expanded={openPanel === "appearance"}
          aria-label={copy.appearance}
          onClick={() =>
            setOpenPanel((current) =>
              current === "appearance" ? null : "appearance",
            )
          }
          ref={appearanceButtonRef}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="7.5" />
            <path d="M12 4.5a7.5 7.5 0 0 1 0 15Z" />
          </svg>
        </button>
        <button
          aria-controls={languageId}
          aria-expanded={openPanel === "language"}
          aria-label={copy.language}
          onClick={() =>
            setOpenPanel((current) =>
              current === "language" ? null : "language",
            )
          }
          ref={languageButtonRef}
          type="button"
        >
          {locale.toUpperCase()}
        </button>
      </div>
    </aside>
  )
}
