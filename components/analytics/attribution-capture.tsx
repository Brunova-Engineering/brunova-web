"use client"

import { useEffect } from "react"

import { captureFirstTouchAttribution } from "@/lib/attribution"

export function AttributionCapture() {
  useEffect(() => {
    captureFirstTouchAttribution({
      search: window.location.search,
      landingPath: window.location.pathname,
      referrer: document.referrer,
      currentHost: window.location.hostname,
    })
  }, [])

  return null
}
