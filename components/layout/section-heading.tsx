import {
  createElement,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react"

export function Heading({
  children,
  className,
  level,
  ...props
}: PropsWithChildren<
  HTMLAttributes<HTMLHeadingElement> & { level: 1 | 2 | 3 }
>) {
  return createElement(
    `h${level}`,
    {
      className: ["heading", `heading--${level}`, className]
        .filter(Boolean)
        .join(" "),
      ...props,
    },
    children,
  )
}
