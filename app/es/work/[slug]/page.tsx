import type { Metadata } from "next"
import { WorkDetailPageView } from "@/components/pages/work-detail-page"
import { esWorkCases } from "@/content/es"
import { createPageMetadata } from "@/lib/metadata"

type Props = { params: Promise<{ slug: string }> }
export const dynamicParams = true
export function generateStaticParams() {
  return esWorkCases.map(({ slug }) => ({ slug }))
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const work = esWorkCases.find((item) => item.slug === slug)
  return createPageMetadata({
    title: work?.systemsTitle ?? "Sistema no encontrado",
    description:
      work?.systemsSummary ?? "El sistema solicitado no está disponible.",
    path: `/work/${slug}`,
    locale: "es",
    noIndex: !work,
    followWhenNoIndex: false,
  })
}
export default async function Page({ params }: Props) {
  return <WorkDetailPageView locale="es" slug={(await params).slug} />
}
