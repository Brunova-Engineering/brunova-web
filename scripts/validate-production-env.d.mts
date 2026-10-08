export type ProductionEnvironmentResult = {
  contactEnabled: boolean
  portalEnabled: boolean
  siteOrigin: string
}

export function validateProductionEnvironment(
  environment: NodeJS.ProcessEnv | Readonly<Record<string, string | undefined>>,
): ProductionEnvironmentResult
