import { AcquisitionPageView } from "@/components/acquisition/page-view"
export const dynamic = "force-dynamic"
export const metadata = {
  title: "Portal de Adquisición",
  robots: { index: false, follow: false },
}
export default function Page() {
  return <AcquisitionPageView locale="es" />
}
