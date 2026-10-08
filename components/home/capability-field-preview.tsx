"use client"

import { useEffect, useRef, useState } from "react"

import { Heading } from "@/components/layout/section-heading"

type CapabilityFieldPreviewProps = {
  capabilities: ReadonlyArray<{
    name: string
    slug: string
  }>
  coreLabel: string
}

export function CapabilityFieldPreview({
  capabilities,
  coreLabel,
}: CapabilityFieldPreviewProps) {
  const modelRef = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const model = modelRef.current

    if (!model || isRevealed) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        setIsRevealed(true)
        observer.disconnect()
      },
      { rootMargin: "0px 0px -12%", threshold: 0.2 },
    )

    observer.observe(model)

    return () => observer.disconnect()
  }, [isRevealed])

  return (
    <div
      aria-label={coreLabel}
      className="capability-field-preview"
      data-revealed={isRevealed ? "true" : undefined}
      ref={modelRef}
      role="group"
    >
      <p className="capability-field-preview__core">{coreLabel}</p>
      <ol className="capability-field-preview__disciplines">
        {capabilities.map((capability) => (
          <li className="capability-field-preview__item" key={capability.slug}>
            <Heading level={3}>{capability.name}</Heading>
          </li>
        ))}
      </ol>
    </div>
  )
}
