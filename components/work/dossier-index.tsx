"use client"

import { useEffect, useState } from "react"

type DossierSection = {
  id: string
  label: string
  disclosure?: boolean
}

type DossierIndexProps = {
  backHref: string
  backLabel: string
  engineering: readonly string[]
  engineeringLabel: string
  focus: readonly string[]
  focusLabel: string
  label: string
  navigationLabel: string
  sections: readonly DossierSection[]
  systemType: string
  systemTypeLabel: string
  title: string
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function DossierIndex({
  backHref,
  backLabel,
  engineering,
  engineeringLabel,
  focus,
  focusLabel,
  label,
  navigationLabel,
  sections,
  systemType,
  systemTypeLabel,
  title,
}: DossierIndexProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "")

  useEffect(() => {
    const sectionElements = sections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))
    const overview = sectionElements[0]
    const technicalDetail = sectionElements.find(
      (section) => section instanceof HTMLDetailsElement,
    ) as HTMLDetailsElement | undefined
    const relatedSystems = sectionElements.find(
      (section) => section.id === "related-systems",
    )
    let frame = 0

    const scrollToSection = (section: HTMLElement) => {
      section.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      })
    }

    const activateHash = (shouldScroll: boolean) => {
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""))
      const selected = sections.find(({ id }) => id === hash)
      if (!selected) return

      const section = document.getElementById(selected.id)
      if (!section) return

      if (selected.disclosure && section instanceof HTMLDetailsElement) {
        section.open = true
      }
      setActiveSection(selected.id)

      if (shouldScroll) {
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => scrollToSection(section))
        })
      }
    }

    const syncFromDisclosure = (event: Event) => {
      const disclosure = event.currentTarget
      if (!(disclosure instanceof HTMLDetailsElement)) return

      if (disclosure.open) {
        setActiveSection(disclosure.id)
      } else {
        setActiveSection(overview?.id ?? "")
        if (overview) {
          if (window.location.hash === `#${disclosure.id}`) {
            window.history.replaceState(null, "", `#${overview.id}`)
          }
          frame = requestAnimationFrame(() => scrollToSection(overview))
        }
      }
    }

    const syncFromScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const headerHeight =
          document
            .querySelector<HTMLElement>(".site-header")
            ?.getBoundingClientRect().height ?? 0
        const readingLine = headerHeight + window.innerHeight * 0.38

        if (
          relatedSystems &&
          relatedSystems.getBoundingClientRect().top <= readingLine
        ) {
          setActiveSection(relatedSystems.id)
          return
        }

        if (
          technicalDetail?.open &&
          technicalDetail.getBoundingClientRect().top <= readingLine
        ) {
          setActiveSection(technicalDetail.id)
          return
        }

        setActiveSection(overview?.id ?? "")
      })
    }

    const handleHashChange = () => activateHash(true)

    activateHash(true)
    technicalDetail?.addEventListener("toggle", syncFromDisclosure)
    window.addEventListener("hashchange", handleHashChange)
    window.addEventListener("popstate", handleHashChange)
    window.addEventListener("scroll", syncFromScroll, { passive: true })
    window.addEventListener("resize", syncFromScroll)

    return () => {
      cancelAnimationFrame(frame)
      technicalDetail?.removeEventListener("toggle", syncFromDisclosure)
      window.removeEventListener("hashchange", handleHashChange)
      window.removeEventListener("popstate", handleHashChange)
      window.removeEventListener("scroll", syncFromScroll)
      window.removeEventListener("resize", syncFromScroll)
    }
  }, [sections])

  const selectSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    section: DossierSection,
  ) => {
    const element = document.getElementById(section.id)
    if (!element) return

    event.preventDefault()
    if (section.disclosure && element instanceof HTMLDetailsElement) {
      element.open = true
    }

    setActiveSection(section.id)
    window.history.pushState(null, "", `#${section.id}`)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        })
      })
    })
  }

  return (
    <aside className="case-dossier__index">
      <a className="case-dossier__back" href={backHref}>
        {backLabel}
      </a>

      <div className="case-dossier__identity">
        <p className="case-dossier__name">{title}</p>
        <dl className="case-dossier__brief">
          <div>
            <dt>{systemTypeLabel}</dt>
            <dd>{systemType}</dd>
          </div>
          <div>
            <dt>{focusLabel}</dt>
            <dd>
              <ul>
                {focus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>{engineeringLabel}</dt>
            <dd>
              <ul>
                {engineering.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>

      <nav aria-label={label} className="case-dossier__navigation">
        <p>{navigationLabel}</p>
        <ul>
          {sections.map((section) => (
            <li key={section.id}>
              <a
                aria-current={
                  activeSection === section.id ? "location" : undefined
                }
                href={`#${section.id}`}
                onClick={(event) => selectSection(event, section)}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
