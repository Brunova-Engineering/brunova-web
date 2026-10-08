"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { NavigationItem } from "@/content/types"

export function ActiveNavigationLink({ item }: { item: NavigationItem }) {
  const pathname = usePathname()
  const active =
    pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`))

  return (
    <Link aria-current={active ? "page" : undefined} href={item.href}>
      {item.label}
    </Link>
  )
}
