import type { Metadata } from "next"
import { WorkDetailPageView } from "@/components/pages/work-detail-page"
import { workCases } from "@/content/work"
import { createPageMetadata } from "@/lib/metadata"

type Props = { params: Promise<{ slug: string }> }
export const dynamicParams = true
export function generateStaticParams() {
  return workCases.map(({ slug }) => ({ slug }))
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const work = workCases.find((item) => item.slug === slug)
  return createPageMetadata({
    title: work?.systemsTitle ?? "System not found",
    description:
      work?.systemsSummary ??
      "The requested Brunova system record is unavailable.",
    path: `/work/${slug}`,
    noIndex: !work,
    followWhenNoIndex: false,
  })
}
export default async function Page({ params }: Props) {
  return <WorkDetailPageView locale="en" slug={(await params).slug} />
}
