"use client"

import { useEffect, useRef, useState } from "react"

import type { Locale } from "@/lib/i18n"

export function BackToTop({ locale }: { locale: Locale }) {
  const [isVisible, setIsVisible] = useState(false)
  const thresholdRef = useRef<HTMLSpanElement>(null)
  const label = locale === "es" ? "Volver arriba" : "Back to top"

  useEffect(() => {
    const threshold = thresholdRef.current
    if (!threshold) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return
      setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })

    observer.observe(threshold)
    return () => observer.disconnect()
  }, [])

  function returnToTop() {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })
  }

  return (
    <>
      <span
        aria-hidden="true"
        className="back-to-top__threshold"
        ref={thresholdRef}
      />
      <button
        aria-label={label}
        className="back-to-top"
        data-visible={isVisible ? "true" : undefined}
        onClick={returnToTop}
        tabIndex={isVisible ? 0 : -1}
        type="button"
      >
        <span aria-hidden="true" className="back-to-top__label">
          {label}
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
        </svg>
      </button>
    </>
  )
}
