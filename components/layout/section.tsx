import type { HTMLAttributes, PropsWithChildren } from "react"

export function Section({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <section
      className={["section", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </section>
  )
}
