import Link from "next/link"
import type { PropsWithChildren } from "react"

export type ActionLinkVariant = "primary" | "secondary" | "text" | "utility"

export function actionLinkClassName(
  variant: ActionLinkVariant,
  className?: string,
): string {
  return ["action-link", `action-link--${variant}`, className]
    .filter(Boolean)
    .join(" ")
}

export function ActionLink({
  children,
  className,
  href,
  variant = "text",
}: PropsWithChildren<{
  className?: string
  href: string
  variant?: ActionLinkVariant
}>) {
  return (
    <Link className={actionLinkClassName(variant, className)} href={href}>
      {children}
    </Link>
  )
}
