import { aboutNarrative, companyModel, operationalLens } from "@/content/about"
import { capabilities } from "@/content/capabilities"
import {
  architectureInputs,
  differentiators,
  homepage,
  homepageSymptoms,
  operationalIntelligenceElements,
} from "@/content/home"
import {
  footerNavigation,
  portalNavigation,
  primaryNavigation,
} from "@/content/navigation"
import { privacyContent } from "@/content/privacy"
import { processStages } from "@/content/process"
import { siteConfig } from "@/content/site"
import { workDetails } from "@/content/work-details"
import { workCases } from "@/content/work"
import {
  esAboutNarrative,
  esArchitectureInputs,
  esCapabilities,
  esCompanyModel,
  esDifferentiators,
  esHomepage,
  esHomepageSymptoms,
  esOperationalIntelligenceElements,
  esOperationalLens,
  esPrivacyContent,
  esProcessStages,
  esWorkCases,
  esWorkDetails,
} from "@/content/es"
import type { Locale } from "@/lib/i18n"

export const shellCopy = {
  en: {
    skip: "Skip to content",
    primaryNavigation: "Primary navigation",
    mobileNavigation: "Mobile navigation",
    navigation: "Navigation",
    menu: "Menu",
    close: "Close",
    footerNavigation: "Footer navigation",
    appearance: "Appearance",
    language: "Language",
    appearanceOptions: { system: "System", light: "Light", dark: "Dark" },
    languageOptions: { en: "English", es: "Español" },
  },
  es: {
    skip: "Saltar al contenido",
    primaryNavigation: "Navegación principal",
    mobileNavigation: "Navegación móvil",
    navigation: "Navegación",
    menu: "Menú",
    close: "Cerrar",
    footerNavigation: "Navegación del pie de página",
    appearance: "Apariencia",
    language: "Idioma",
    appearanceOptions: { system: "Sistema", light: "Claro", dark: "Oscuro" },
    languageOptions: { en: "English", es: "Español" },
  },
} as const

export const localizedNavigation = {
  en: {
    primary: primaryNavigation,
    portal: portalNavigation,
    footer: footerNavigation,
  },
  es: {
    primary: [
      { label: "Capacidades", href: "/es/capabilities" },
      { label: "Proceso", href: "/es/process" },
      { label: "Sistemas", href: "/es/work" },
      { label: "Brunova", href: "/es/about" },
    ],
    portal: {
      label: "Portal",
      href: "/es/portal",
      analyticsEvent: "portal_clicked",
    },
    footer: [
      {
        label: "Hablemos",
        href: "/es/contact",
        analyticsEvent: "cta_start_conversation",
      },
      { label: "Portal", href: "/es/portal", analyticsEvent: "portal_clicked" },
      { label: "Privacidad", href: "/es/privacy" },
    ],
  },
} as const

export const localizedSiteConfig = {
  en: siteConfig,
  es: {
    name: "Brunova",
    description:
      "Brunova diseña y construye sistemas operacionales confiables que integran datos, automatización, software e IA para operaciones empresariales complejas.",
    descriptor: "Ingeniería de Sistemas · Inteligencia Operativa",
    primaryAction: {
      label: "Hablemos",
      href: "/es/contact",
      analyticsEvent: "cta_start_conversation",
    },
  },
} as const

export const englishContent = {
  aboutNarrative,
  companyModel,
  operationalLens,
  capabilities,
  homepage,
  homepageSymptoms,
  operationalIntelligenceElements,
  architectureInputs,
  differentiators,
  privacyContent,
  processStages,
  workCases,
  workDetails,
}

export const localizedContent = {
  en: englishContent,
  es: {
    aboutNarrative: esAboutNarrative,
    companyModel: esCompanyModel,
    operationalLens: esOperationalLens,
    capabilities: esCapabilities,
    homepage: esHomepage,
    homepageSymptoms: esHomepageSymptoms,
    operationalIntelligenceElements: esOperationalIntelligenceElements,
    architectureInputs: esArchitectureInputs,
    differentiators: esDifferentiators,
    privacyContent: esPrivacyContent,
    processStages: esProcessStages,
    workCases: esWorkCases,
    workDetails: esWorkDetails,
  },
} as const

export function getShellCopy(locale: Locale) {
  return shellCopy[locale]
}
