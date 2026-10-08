import Link from "next/link"

import { Container } from "@/components/layout/container"

type ContextItem = {
  href?: string
  label: string
}

export function RouteContext({
  items,
  ariaLabel,
}: {
  items: readonly [ContextItem, ...ContextItem[]]
  ariaLabel: string
}) {
  return (
    <nav aria-label={ariaLabel} className="route-context">
      <Container>
        <ol>
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              {item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                item.label
              )}
            </li>
          ))}
        </ol>
      </Container>
    </nav>
  )
}
