"use client"

import type { MouseEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

type ExclusiveDisclosureOptions = {
  canonicalHash: (id: string) => string
  resolveHash: (hash: string) => string | null
}

function motionIsReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useExclusiveDisclosure({
  canonicalHash,
  resolveHash,
}: ExclusiveDisclosureOptions) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>())
  const pendingScroll = useRef<string | null>(null)

  const updateLocation = useCallback(
    (id: string | null) => {
      const nextUrl = id
        ? `${window.location.pathname}${window.location.search}#${canonicalHash(id)}`
        : `${window.location.pathname}${window.location.search}`
      window.history.pushState(null, "", nextUrl)
    },
    [canonicalHash],
  )

  const select = useCallback(
    (id: string, shouldFocus = false) => {
      const nextId = activeId === id ? null : id
      pendingScroll.current = nextId
      setActiveId(nextId)
      updateLocation(nextId)

      if (nextId && shouldFocus) {
        window.requestAnimationFrame(() => {
          triggerRefs.current.get(nextId)?.focus({ preventScroll: true })
        })
      }
    },
    [activeId, updateLocation],
  )

  const handleNavigationClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault()
      select(id, true)
    },
    [select],
  )

  const setTriggerRef = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) triggerRefs.current.set(id, node)
      else triggerRefs.current.delete(id)
    },
    [],
  )

  useEffect(() => {
    function syncFromLocation() {
      const nextId = resolveHash(window.location.hash)
      pendingScroll.current = nextId
      setActiveId(nextId)
    }

    syncFromLocation()
    window.addEventListener("hashchange", syncFromLocation)
    window.addEventListener("popstate", syncFromLocation)
    return () => {
      window.removeEventListener("hashchange", syncFromLocation)
      window.removeEventListener("popstate", syncFromLocation)
    }
  }, [resolveHash])

  useEffect(() => {
    const id = pendingScroll.current
    if (!id || activeId !== id) return

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(canonicalHash(id))?.scrollIntoView({
          behavior: motionIsReduced() ? "auto" : "smooth",
          block: "start",
        })
        pendingScroll.current = null
      })
    })

    return () => window.cancelAnimationFrame(firstFrame)
  }, [activeId, canonicalHash])

  return {
    activeId,
    handleNavigationClick,
    select,
    setTriggerRef,
  }
}
