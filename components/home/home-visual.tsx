import type { Locale } from "@/lib/i18n"
import Image from "next/image"

type HomeVisualKind =
  "hero" | "operational-intelligence" | "architecture-boundary"

type VisualCopy = {
  alt: string
  caption?: string
}

const visualCopy: Record<Locale, Record<HomeVisualKind, VisualCopy>> = {
  en: {
    hero: {
      alt: "From fragmented operations to a reliable operational system",
    },
    "operational-intelligence": {
      alt: "Operational intelligence control loop: observe, decide and act",
      caption:
        "Automation, software and AI remain governed capabilities—not the center of the system.",
    },
    "architecture-boundary": {
      alt: "Architecture before tools: fragmented operational context becomes a defined operating model that enables operational capability",
    },
  },
  es: {
    hero: {
      alt: "De una operación fragmentada a una operación confiable",
    },
    "operational-intelligence": {
      alt: "Ciclo de inteligencia operativa: observar, decidir y actuar",
      caption:
        "La automatización, el software y la IA actúan como capacidades gobernadas, no como el centro del sistema.",
    },
    "architecture-boundary": {
      alt: "Arquitectura antes que herramientas: el contexto operativo fragmentado se convierte en un modelo operativo definido que habilita capacidad operativa",
    },
  },
}

const visualDimensions: Record<HomeVisualKind, readonly [number, number]> = {
  hero: [1440, 420],
  "operational-intelligence": [960, 480],
  "architecture-boundary": [720, 520],
}

const mobileVisualDimensions: Record<
  HomeVisualKind,
  readonly [number, number]
> = {
  hero: [390, 720],
  "operational-intelligence": [390, 620],
  "architecture-boundary": [390, 650],
}

const visualFile: Record<HomeVisualKind, string> = {
  hero: "hero-operating-model",
  "operational-intelligence": "operational-intelligence-loop",
  "architecture-boundary": "architecture-boundary",
}

export function HomeVisual({
  kind,
  locale,
  priority = false,
}: {
  kind: HomeVisualKind
  locale: Locale
  priority?: boolean
}) {
  const copy = visualCopy[locale][kind]
  const [width, height] = visualDimensions[kind]
  const [mobileWidth, mobileHeight] = mobileVisualDimensions[kind]
  const localeSuffix = locale === "es" ? "-es" : ""
  const src = `/brand/visuals/${visualFile[kind]}${localeSuffix}.svg`
  const mobileSrc = `/brand/visuals/${visualFile[kind]}-mobile${localeSuffix}.svg`

  return (
    <figure
      className={`home-visual home-visual--${kind}`}
      data-locale={locale}
      data-visual={kind}
    >
      <picture className="home-visual__media">
        <source
          height={mobileHeight}
          media="(max-width: 39.999rem)"
          srcSet={mobileSrc}
          width={mobileWidth}
        />
        <Image
          alt={copy.alt}
          className="home-visual__asset"
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          height={height}
          loading={priority ? "eager" : "lazy"}
          src={src}
          unoptimized
          width={width}
        />
      </picture>
      {copy.caption ? <figcaption>{copy.caption}</figcaption> : null}
    </figure>
  )
}
